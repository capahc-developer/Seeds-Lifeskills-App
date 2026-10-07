const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const admin = require("firebase-admin");
const OpenAI = require("openai");
const { Buffer } = require("buffer");


// --------------------------------------------------
// Firebase Admin
// --------------------------------------------------

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();


// --------------------------------------------------
// OpenAI Secret
// --------------------------------------------------

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");


// --------------------------------------------------
// Generate Visual Plan
// --------------------------------------------------

exports.generateVisualPlan = onCall(
  {
    region: "us-central1",
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 300,
    memory: "512MiB",
  },

  async (request) => {
    try {

      // --------------------------------------------------
      // Require authenticated user
      // --------------------------------------------------

      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in to generate a visual."
        );
      }

      const uid = request.auth.uid;
      const data = request.data || {};


      // --------------------------------------------------
      // Read request data
      // --------------------------------------------------

      const skillId =
        typeof data.skillId === "string"
          ? data.skillId.trim()
          : "";

      const skill =
        typeof data.skill === "string" && data.skill.trim()
          ? data.skill.trim()
          : "Life Skill";

      const strengths =
        typeof data.strengths === "string" && data.strengths.trim()
          ? data.strengths.trim()
          : "Not provided";

      const barriers =
        typeof data.barriers === "string" && data.barriers.trim()
          ? data.barriers.trim()
          : "Not provided";

      const interests =
        typeof data.interests === "string" && data.interests.trim()
          ? data.interests.trim()
          : "Not provided";

      const gender =
        typeof data.gender === "string" && data.gender.trim()
          ? data.gender.trim().toLowerCase()
          : "not-specified";


      // --------------------------------------------------
      // Read steps
      // --------------------------------------------------

      const steps = Array.isArray(data.steps)
        ? data.steps
            .filter(
              (step) =>
                typeof step === "string" &&
                step.trim().length > 0
            )
            .map((step) => step.trim())
        : [];

      if (!steps.length) {
        throw new HttpsError(
          "invalid-argument",
          "No steps were provided for this visual."
        );
      }


      console.log("Generating visual for:", skill);
      console.log("Skill ID:", skillId);
      console.log("Student UID:", uid);
      console.log("Student gender:", gender);
      console.log("Total steps:", steps.length);


      // --------------------------------------------------
      // OpenAI
      // --------------------------------------------------

      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY.value(),
      });


      // --------------------------------------------------
      // Simple numbered list
      // --------------------------------------------------

      const numberedSteps = steps
        .map(
          (step, index) =>
            `${index + 1}. ${step}`
        )
        .join("\n");


      // --------------------------------------------------
      // Illustration-only prompt
      // --------------------------------------------------

      const prompt = `
Create a child-friendly visual routine illustration sheet for:

"${skill}"

Create EXACTLY ${steps.length} separate illustrations,
one for each action below.

The illustrations must appear in this exact order:

${numberedSteps}


IMPORTANT OUTPUT RULES:

- Illustrations ONLY.
- DO NOT include any words.
- DO NOT include captions.
- DO NOT include step numbers.
- DO NOT include letters.
- DO NOT include a title.
- DO NOT include labels.
- DO NOT include written text anywhere in the image.

Each action must have its own clearly separated illustration.

Each illustration should clearly communicate the action
without requiring written text.

Use a simple, friendly visual style appropriate for children.

Keep backgrounds simple and uncluttered.


MAIN CHILD CHARACTER:

Student gender:
${gender}

- If the student gender is "girl", the main child MUST be depicted as a girl.
- If the student gender is "boy", the main child MUST be depicted as a boy.
- If the student gender is "not-specified", use a gender-neutral child.

CHARACTER CONSISTENCY IS IMPORTANT:

- Keep the SAME child character throughout every illustration.
- Keep the child's approximate age consistent.
- Keep the child's hair consistent.
- Keep the child's skin tone consistent.
- Keep the child's general facial appearance consistent.
- Keep the child's clothing style reasonably consistent.
- Do not switch between different children unless the action specifically requires another person.


STUDENT PERSONALIZATION:

Student strengths:
${strengths}

Student learning barriers:
${barriers}

Student interests:
${interests}

The student's interests may influence small visual details
when appropriate.

For example, an interest in cats may appear as a small
friendly cat or cat-themed object.

However, interests must not distract from the action being
demonstrated.

The primary purpose of every illustration is to make the
corresponding routine step visually clear.
`;


      // --------------------------------------------------
      // Generate ONE image
      // --------------------------------------------------

      console.log(
        "Starting OpenAI image generation:",
        new Date().toISOString()
      );

      const imageResponse =
        await openai.images.generate({
          model: "gpt-image-1",
          prompt,
          size: "1024x1536",
          quality: "medium",
        });

      console.log(
        "OpenAI image returned:",
        new Date().toISOString()
      );


      const imageData =
        imageResponse.data?.[0];

      if (!imageData) {
        throw new Error(
          "OpenAI did not return image data."
        );
      }


      // --------------------------------------------------
      // Convert image to buffer
      // --------------------------------------------------

      let imageBuffer;

      if (imageData.b64_json) {

        imageBuffer =
          Buffer.from(
            imageData.b64_json,
            "base64"
          );

      } else if (imageData.url) {

        const imageFetch =
          await fetch(imageData.url);

        if (!imageFetch.ok) {
          throw new Error(
            "Could not download generated image."
          );
        }

        const arrayBuffer =
          await imageFetch.arrayBuffer();

        imageBuffer =
          Buffer.from(arrayBuffer);

      } else {

        throw new Error(
          "OpenAI returned no usable image."
        );
      }


      // --------------------------------------------------
      // Save ONE image to Firebase Storage
      // --------------------------------------------------

      const safeSkillId =
        skillId || "unknown-skill";

      const timestamp =
        Date.now();

      const filePath =
        `visual-posters/${uid}/${safeSkillId}/` +
        `${timestamp}.png`;

      const file =
        bucket.file(filePath);


      console.log(
        "Starting Firebase Storage save:",
        new Date().toISOString()
      );


      await file.save(
        imageBuffer,
        {
          metadata: {
            contentType: "image/png",
          },
          resumable: false,
        }
      );


      console.log(
        "Firebase Storage save finished:",
        new Date().toISOString()
      );


      // --------------------------------------------------
      // Create signed URL
      // --------------------------------------------------

      console.log(
        "Starting signed URL:",
        new Date().toISOString()
      );

      const [posterUrl] =
        await file.getSignedUrl({
          action: "read",
          expires: "03-01-2035",
        });

      console.log(
        "Signed URL finished:",
        new Date().toISOString()
      );


      // --------------------------------------------------
      // Save metadata
      // --------------------------------------------------

      const visualRef =
        db.collection("generatedVisuals").doc();

      await visualRef.set({

        userId: uid,

        studentId: uid,

        skillId: safeSkillId,

        skillTitle: skill,

        posterUrl,

        steps,

        stepCount: steps.length,

        strengths,

        barriers,

        interests,

        gender,

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),

      });


      // --------------------------------------------------
      // Save under student
      // --------------------------------------------------

      const studentVisualRef =
        db
          .collection("studentProfiles")
          .doc(uid)
          .collection("generatedVisuals")
          .doc(visualRef.id);

      await studentVisualRef.set({

        visualId:
          visualRef.id,

        skillId:
          safeSkillId,

        skillTitle:
          skill,

        posterUrl,

        steps,

        stepCount:
          steps.length,

        gender,

        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),

      });


      console.log(
        "Visual metadata saved:",
        visualRef.id
      );


      // --------------------------------------------------
      // Return result
      // --------------------------------------------------

      return {

        success: true,

        posterUrl,

        visualId:
          visualRef.id,

        skillId:
          safeSkillId,

        stepCount:
          steps.length,

      };


    } catch (error) {

      console.error(
        "generateVisualPlan error:",
        error
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error?.message ||
          "Unable to generate visual."
      );
    }
  }
);