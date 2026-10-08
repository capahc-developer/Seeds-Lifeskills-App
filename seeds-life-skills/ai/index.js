
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const OpenAI = require('openai');
const { toFile } = require('openai');
const { Buffer } = require('buffer');
const sharp = require('sharp');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

const PAGE_SIZE = 4;
const MAX_STEPS = 18;

function imageBytes(response, pageNumber) {
  const item = response.data?.[0];

  if (!item?.b64_json) {
    throw new Error(`No image returned for page ${pageNumber}`);
  }

  return Buffer.from(item.b64_json, 'base64');
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }

  if (line) lines.push(line);

  return lines;
}

// Assemble AI illustrations with exact Firebase captions.
async function composePoster(rawBuffer, page) {
  const count = page.steps.length;
  const tile = 480;
  const margin = 20;
  const gap = 24;
  const captionHeight = 90;
  const rowHeight = tile + captionHeight;
  const rows = Math.ceil(count / 2);

  const width = margin * 2 + tile * 2 + gap;
  const height =
    margin * 2 +
    rows * rowHeight +
    (rows - 1) * gap;

  const metadata = await sharp(rawBuffer).metadata();
  const sourceWidth = metadata.width;
  const sourceHeight = metadata.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Image dimensions missing');
  }

  const sourceColumns = count === 1 ? 1 : 2;
  const sourceRows = count === 1 ? 1 : 2;

  const composites = [];

  let svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
  `;

  for (let j = 0; j < count; j++) {
    const col = j % 2;
    const row = Math.floor(j / 2);

    const left = margin + col * (tile + gap);
    const top = margin + row * (rowHeight + gap);

    // Extract the corresponding AI-generated quadrant.
    const sourceCol = j % sourceColumns;
    const sourceRow = Math.floor(j / sourceColumns);

    const sx = Math.floor(
      sourceCol * sourceWidth / sourceColumns
    );

    const sy = Math.floor(
      sourceRow * sourceHeight / sourceRows
    );

    const sw = Math.floor(
      (sourceCol + 1) * sourceWidth / sourceColumns
    ) - sx;

    const sh = Math.floor(
      (sourceRow + 1) * sourceHeight / sourceRows
    ) - sy;

    const crop = await sharp(rawBuffer)
      .extract({
        left: sx,
        top: sy,
        width: sw,
        height: sh,
      })
      .resize(tile, tile, { fit: 'cover' })
      .png()
      .toBuffer();

    composites.push({
      input: crop,
      left,
      top,
    });

    svg += `
      <rect
        x="${left}"
        y="${top}"
        width="${tile}"
        height="${rowHeight}"
        rx="12"
        fill="#ffffff"
        stroke="#d4dbe3"
        stroke-width="2"
      />
    `;

    // This text comes directly from the submitted steps.
    const label = `${page.start + j + 1}. ${page.steps[j]}`;
    const lines = wrapText(label, 37);

    const fontSize = lines.length > 7 ? 18 : 22;
    const lineHeight = lines.length > 7 ? 22 : 29;
    const textY = top + tile + 38;

    svg += `
      <text
        x="${left + 16}"
        y="${textY}"
        fill="#202b37"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
      >
    `;

    lines.forEach((line, index) => {
      svg += `
        <tspan
          x="${left + 16}"
          dy="${index === 0 ? 0 : lineHeight}"
        >${xmlEscape(line)}</tspan>
      `;
    });

    svg += '</text>';
  }

  svg += '</svg>';

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#ffffff',
    },
  })
    .composite([
      { input: Buffer.from(svg), left: 0, top: 0 },
      ...composites,
    ])
    .png()
    .toBuffer();
}

exports.generateVisualPlan = onCall(
  {
    region: 'us-central1',
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in.'
      );
    }

    const uid = request.auth.uid;
    const data = request.data || {};

    const skillId =
      typeof data.skillId === 'string'
        ? data.skillId.trim()
        : '';

    const safeSkillId =
      skillId.replace(/[^a-zA-Z0-9_-]/g, '_') ||
      'unknown-skill';

    const skill =
      typeof data.skill === 'string'
        ? data.skill.slice(0, 150)
        : 'Life Skill';

    const strengths =
      typeof data.strengths === 'string'
        ? data.strengths.slice(0, 500)
        : '';

    const barriers =
      typeof data.barriers === 'string'
        ? data.barriers.slice(0, 500)
        : '';

    const interests =
      typeof data.interests === 'string'
        ? data.interests.slice(0, 500)
        : '';

    const gender = [
      'girl',
      'boy',
      'not-specified',
    ].includes(data.gender)
      ? data.gender
      : 'not-specified';

    const steps = Array.isArray(data.steps)
      ? data.steps
          .filter(
            (s) =>
              typeof s === 'string' &&
              s.trim()
          )
          .map((s) => s.trim().slice(0, 300))
      : [];

    if (!steps.length || steps.length > MAX_STEPS) {
      throw new HttpsError(
        'invalid-argument',
        `Provide 1–${MAX_STEPS} steps.`
      );
    }

    // Four steps per page.
    const pages = [];

    for (
      let start = 0;
      start < steps.length;
      start += PAGE_SIZE
    ) {
      pages.push({
        start,
        steps: steps.slice(start, start + PAGE_SIZE),
      });
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY.value(),
      timeout: 150000,
      maxRetries: 0,
    });

    const visualRef = db
      .collection('generatedVisuals')
      .doc();

    const createdPaths = [];
    const results = [];

    // First page becomes the character reference.
    let referenceBuffer = null;

    try {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const stepLines = page.steps
          .map(
            (step, j) =>
              `${page.start + j + 1}. ${step}`
          )
          .join('\n');

        const single = page.steps.length === 1;

        const layout = single
          ? `
Exactly ONE square illustration.
One scene.
One action.
No panels or collage.
`
          : `
Create EXACTLY ${page.steps.length} separate square scenes
in a STRICT 2x2 GRID.

If fewer than four actions are provided,
leave unused quadrants completely blank white.

Divide the canvas at the exact horizontal
and vertical midpoint.

Positions:
TOP LEFT: first action.
TOP RIGHT: second action.
BOTTOM LEFT: third action.
BOTTOM RIGHT: fourth action.

All quadrants must have identical size.

No headings, captions, margins, or gutters.
Each illustration fills its own quadrant.
No extra panels.
`;

        const referenceInstructions = referenceBuffer
          ? `
The attached image is PAGE 1 of this same routine.

Use it ONLY as a character and artistic style reference.

Preserve:
- Same child's facial features.
- Same skin tone.
- Same hair color and hairstyle.
- Same illustration line weight.
- Same shading and color palette.
- Same overall art style.

Clothing may change only when an action requires it.

Do not repeat the reference image's activities.

Draw ONLY the new actions listed below.
`
          : `
Establish one distinctive, friendly cartoon child.

Gender: ${gender}.

Use a consistent flat 2D educational illustration style.

Keep the same child throughout the entire page.

Use simple backgrounds and recognizable objects.
`;

        const prompt = `
${referenceInstructions}

Create a children's visual routine for:

"${skill}"

ACTIONS TO DRAW IN EXACT ORDER:

${stepLines}

LAYOUT:

${layout}

Show the child ACTIVELY PERFORMING each action,
not simply posing after the action is completed.

Examples:
- Get dressed: show the child pulling on a shirt or pants.
- Brush hair: show a hairbrush touching the hair.
- Put on shoes: show the child putting a foot into a shoe.
- Wash face: show the child washing their face with water.

Every illustration must clearly communicate the action
without needing to read its caption.

Do not substitute a different activity.

No duplicated actions.
No invented activities.
No extra people.
No extra panels.

Keep the character visually consistent.

Use:
- Friendly educational illustrations.
- Simple uncluttered backgrounds.
- High contrast.
- Clear recognizable actions.
- Consistent character proportions.

TEXT RULES:
Do not draw any text.
No titles.
No captions.
No labels.
No numbers.
No letters.

The application will add the exact step descriptions.

PERSONALIZATION:
Strengths: ${strengths}
Barriers: ${barriers}
Interests: ${interests}

Use personalization only where relevant.
The requested action always takes priority.
`.trim();

        console.log(
          `Starting page ${i + 1}/${pages.length}`,
          {
            totalSteps: steps.length,
            pageSteps: page.steps.length,
            referenceUsed: Boolean(referenceBuffer),
          }
        );

        let response;

        if (referenceBuffer) {
          response = await openai.images.edit({
            model: 'gpt-image-1',
            image: await toFile(
              referenceBuffer,
              'reference-page-1.png',
              { type: 'image/png' }
            ),
            prompt,
            size: '1024x1024',
            quality: 'medium',
            input_fidelity: 'high',
          });
        } else {
          response = await openai.images.generate({
            model: 'gpt-image-1',
            prompt,
            size: '1024x1024',
            quality: 'medium',
          });
        }

        const imageBuffer = imageBytes(
          response,
          i + 1
        );

        // Always use the first page as the reference.
        if (i === 0) {
          referenceBuffer = imageBuffer;
        }

        // Add exact step text below the illustrations.
        const posterBuffer = await composePoster(
          imageBuffer,
          page
        );

        const storagePath =
          `visual-posters/${uid}/` +
          `${safeSkillId}/${visualRef.id}/` +
          `page-${i + 1}.png`;

        const file = bucket.file(storagePath);

        await file.save(posterBuffer, {
          resumable: false,
          metadata: {
            contentType: 'image/png',
          },
        });

        createdPaths.push(storagePath);

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2035',
        });

        results.push({
          pageNumber: i + 1,
          posterUrl: url,
          storagePath,
          steps: page.steps,
          startStep: page.start + 1,
          endStep:
            page.start + page.steps.length,
        });

        console.log(
          `Saved page ${i + 1}/${pages.length}`
        );
      }

      const createdAt =
        admin.firestore.FieldValue.serverTimestamp();

      const common = {
        userId: uid,

        // Signed-in account ID, not necessarily student ID.
        studentId: uid,

        skillId: safeSkillId,
        skillTitle: skill,

        // Keep existing frontend compatibility.
        posterUrl: results[0].posterUrl,

        pages: results,
        pageCount: results.length,

        steps,
        stepCount: steps.length,

        strengths,
        barriers,
        interests,
        gender,
        createdAt,
      };

      const batch = db.batch();

      batch.set(visualRef, common);

      batch.set(
        db
          .collection('studentProfiles')
          .doc(uid)
          .collection('generatedVisuals')
          .doc(visualRef.id),
        {
          visualId: visualRef.id,
          skillId: safeSkillId,
          skillTitle: skill,

          posterUrl: results[0].posterUrl,

          pages: results,
          pageCount: results.length,

          steps,
          stepCount: steps.length,

          gender,
          createdAt,
        }
      );

      await batch.commit();

      return {
        success: true,
        posterUrl: results[0].posterUrl,
        pages: results,
        pageCount: results.length,
        visualId: visualRef.id,
        skillId: safeSkillId,
        stepCount: steps.length,
      };
    } catch (error) {
      console.error(
        'generateVisualPlan failed:',
        error
      );

      await Promise.allSettled(
        createdPaths.map((path) =>
          bucket.file(path).delete()
        )
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error?.message ||
          'Unable to generate visual.'
      );
    }
  }
);
