const { Buffer } = require("buffer");
const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
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
      const data = request.data || {};

      const skill = data.skill || "Morning Routine";
      const strengths = data.strengths || "Not provided";
      const barriers = data.barriers || "Not provided";
      const interests = data.interests || "Not provided";

      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

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

      const image = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1536",
        quality: "medium",
      });

      const base64Image = image.data?.[0]?.b64_json;

      if (!base64Image) {
        throw new Error("OpenAI did not return image data.");
      }

      const buffer = Buffer.from(base64Image, "base64");

      const bucket = getStorage().bucket();

      const token = crypto.randomUUID();
      const fileName =
        `visual-posters/${Date.now()}-${crypto.randomUUID()}.png`;

      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType: "image/png",
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      });

      const encodedFileName = encodeURIComponent(fileName);

      const posterUrl =
        `https://firebasestorage.googleapis.com/v0/b/` +
        `${bucket.name}/o/${encodedFileName}` +
        `?alt=media&token=${token}`;

      return {
        success: true,
        posterUrl,
      };
    } catch (error) {
      console.error("Poster generation error:", error);

      throw new HttpsError(
        "internal",
        "Unable to generate the visual poster."
      );
    }
  }
);