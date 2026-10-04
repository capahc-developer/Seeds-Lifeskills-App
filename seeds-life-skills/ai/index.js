const { Buffer } = require("buffer");
const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");
const {
  getFirestore,
  FieldValue,
  FieldPath,
} = require("firebase-admin/firestore");
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
    invoker: "public",
  },
  async (request) => {
    try {
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

      const encodedFileName = encodeURIComponent(fileName);

      const posterUrl =
        `https://firebasestorage.googleapis.com/v0/b/` +
        `${bucket.name}/o/${encodedFileName}` +
        `?alt=media&token=${token}`;

      const db = getFirestore();

      const planRef = await db
        .collection("studentProfiles")
        .doc(uid)
        .collection("generatedVisuals")
        .add({
          studentId: uid,
          skillId,
          skill,
          posterUrl,
          storagePath: fileName,
          createdAt: FieldValue.serverTimestamp(),
        });

      return {
        success: true,
        posterUrl,
        visualId: planRef.id,
      };
    } catch (error) {
      console.error("Poster generation error:", error);

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

exports.deleteAccountData = onCall(
  {
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to delete your account."
      );
    }

    const authTime = Number(request.auth?.token?.auth_time || 0);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!authTime || nowSeconds - authTime > 10 * 60) {
      throw new HttpsError(
        "failed-precondition",
        "Please sign in again before deleting your account."
      );
    }

    const db = getFirestore();
    let stage = "starting deletion";

    try {
      stage = "deleting generated image files";

      // Delete generated image files first. New Firebase projects commonly use
      // <project-id>.firebasestorage.app, while older projects use appspot.com.
      // A missing/unused bucket should not prevent deletion of the account.
      const projectId =
        process.env.GCLOUD_PROJECT ||
        process.env.GCP_PROJECT ||
        "seeds-life-skills";

      const bucketNames = [
        `${projectId}.firebasestorage.app`,
        `${projectId}.appspot.com`,
      ];

      let storageDeleted = false;

      for (const bucketName of bucketNames) {
        try {
          const bucket = getStorage().bucket(bucketName);

          const [exists] = await bucket.exists();
          if (!exists) continue;

          await bucket.deleteFiles({
            prefix: `visual-posters/${uid}/`,
          });

          storageDeleted = true;
          break;
        } catch (storageError) {
          console.warn(
            `Skipping unavailable Storage bucket ${bucketName}:`,
            storageError?.message || storageError
          );
        }
      }

      if (!storageDeleted) {
        console.log(
          "No accessible Storage bucket found or no generated image files needed deletion."
        );
      }

      stage = "deleting Firestore profile and user data";

      // Remove account documents and nested subcollections.
      await Promise.all([
        db.recursiveDelete(db.doc(`adultProfiles/${uid}`)),
        db.recursiveDelete(db.doc(`studentProfiles/${uid}`)),
        db.recursiveDelete(db.doc(`users/${uid}`)),
      ]);

      stage = "deleting assistant usage records";

      // parentAssistant stores daily usage in assistantUsage/{uid}_YYYY-MM-DD.
      const usageSnapshot = await db
        .collection("assistantUsage")
        .where(FieldPath.documentId(), ">=", `${uid}_`)
        .where(FieldPath.documentId(), "<", `${uid}_\\uf8ff`)
        .get();

      if (!usageSnapshot.empty) {
        const writer = db.bulkWriter();

        usageSnapshot.docs.forEach((snapshot) => {
          writer.delete(snapshot.ref);
        });

        await writer.close();
      }

      stage = "deleting Firebase Authentication account";

      // Delete the Firebase Authentication account last.
      await getAuth().deleteUser(uid);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Account deletion backend error:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "failed-precondition",
        `Account deletion failed while ${stage}.`,
        {
          stage,
          backendMessage: error?.message || "unknown error",
          backendCode: error?.code || null,
        }
      );
    }
  }
);
