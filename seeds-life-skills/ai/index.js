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
      // ORIGINAL-STYLE SIMPLE PROMPT
      // --------------------------------------------------

      const prompt = `
Create a child-friendly visual routine poster.

TITLE:
"${skill}"

Create one illustrated step for each of the following routine steps.

Keep the steps in this exact order:

${numberedSteps}

Each step should have:

- a clear illustration
- a visible step number
- a short readable caption

Use a friendly, simple visual style appropriate for a child.

Keep the poster organized and easy to follow.

Use the same child character throughout the poster when appropriate.

Student strengths:
${strengths}

Student learning barriers:
${barriers}

Student interests:
${interests}

Use the student's interests and strengths to make the visual more engaging.

For example, if the child likes cats, friendly cats may appear as decorative or encouraging characters.

Keep the design simple and avoid unnecessary clutter.
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