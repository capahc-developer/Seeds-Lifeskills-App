const { Buffer } = require("buffer");
const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const OpenAI = require("openai");
const crypto = require("crypto");

initializeApp();

setGlobalOptions({
  maxInstances: 10,
});

const openaiApiKey = defineSecret("OPENAI_API_KEY");

exports.generateVisualPlan = onCall(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (request) => {
    try {

      // --------------------------------------------------
      // 1. GET THE LOGGED-IN STUDENT'S UID
      // --------------------------------------------------

      const uid = request.auth?.uid;

      if (!uid) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in to generate a visual."
        );
      }

      const data = request.data || {};

      const skillId = data.skillId || "unknown-skill";
      const skill = data.skill || "Morning Routine";
      const strengths = data.strengths || "Not provided";
      const barriers = data.barriers || "Not provided";
      const interests = data.interests || "Not provided";


      // --------------------------------------------------
      // 2. CREATE OPENAI CLIENT
      // --------------------------------------------------

      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });


      // --------------------------------------------------
      // 3. CREATE IMAGE PROMPT
      // --------------------------------------------------

      const prompt = `
Create a portrait-oriented visual schedule poster for a child or
teen learning the daily living skill:

"${skill}"

Student information:

Strengths:
${strengths}

Learning barriers:
${barriers}

Interests:
${interests}

POSTER REQUIREMENTS:

- Create ONE complete vertical poster.
- Make it look like a professional visual schedule used to teach
  daily living skills.
- Use a clean, simple, child-friendly illustration style.
- Use a light uncluttered background.
- Put the skill name as a large title at the top.
- Break the skill into 4 to 8 steps.
- Put the steps in the correct practical order.
- Each step must have a clear illustration.
- Each step must contain only a few words.
- Number every step clearly.
- Use large readable text.
- Use strong visual separation between steps.
- Avoid unnecessary decorations.
- Avoid long paragraphs.
- Finish with a positive "All Done!" visual at the bottom.
- Personalize the approach using the student's strengths,
  barriers, and interests when appropriate.
- Do not include medical claims or diagnoses.
- Do not include the student's name.
- Do not mention AI.
- The finished image should be useful as a visual support that
  a parent could show directly to a child.
`;


      // --------------------------------------------------
      // 4. GENERATE IMAGE
      // --------------------------------------------------

      const image = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1536",
        quality: "medium",
      });

      const base64Image = image.data?.[0]?.b64_json;

      if (!base64Image) {
        throw new Error(
          "OpenAI did not return image data."
        );
      }

      const buffer = Buffer.from(
        base64Image,
        "base64"
      );


      // --------------------------------------------------
      // 5. SAVE IMAGE UNDER THE STUDENT'S UID
      // --------------------------------------------------

      const bucket = getStorage().bucket();

      const token = crypto.randomUUID();
      const imageId = crypto.randomUUID();

      const safeSkillId = String(skillId)
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      const fileName =
        `visual-posters/${uid}/${safeSkillId}/` +
        `${Date.now()}-${imageId}.png`;

      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType: "image/png",
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      });


      // --------------------------------------------------
      // 6. CREATE DOWNLOAD URL
      // --------------------------------------------------

      const encodedFileName =
        encodeURIComponent(fileName);

      const posterUrl =
        `https://firebasestorage.googleapis.com/v0/b/` +
        `${bucket.name}/o/${encodedFileName}` +
        `?alt=media&token=${token}`;


      // --------------------------------------------------
      // 7. SAVE IMAGE INFORMATION IN FIRESTORE
      // --------------------------------------------------

      const db = getFirestore();

      const planRef = await db
        .collection("studentProfiles")
        .doc(uid)
        .collection("generatedVisuals")
        .add({
          studentId: uid,

          skillId: skillId,
          skill: skill,

          posterUrl: posterUrl,
          storagePath: fileName,

          createdAt: FieldValue.serverTimestamp(),
        });


      // --------------------------------------------------
      // 8. RETURN RESULT TO THE APP
      // --------------------------------------------------

      return {
        success: true,
        posterUrl: posterUrl,
        visualId: planRef.id,
      };

    } catch (error) {

      console.error(
        "Poster generation error:",
        error
      );

      // Preserve intentional Firebase errors
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Unable to generate the visual poster."
      );
    }
  }
);