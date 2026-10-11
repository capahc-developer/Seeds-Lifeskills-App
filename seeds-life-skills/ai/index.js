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


exports.chatAssistant = onCall(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 60,
    memory: "256MiB",
    invoker: "public",
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to use the assistant."
      );
    }

    const data = request.data || {};
    const rawMessages = Array.isArray(data.messages) ? data.messages : [];
    const screenPath =
      typeof data.screenPath === "string"
        ? data.screenPath.slice(0, 200)
        : "";
    const params =
      data.params && typeof data.params === "object"
        ? data.params
        : {};

    const messages = rawMessages
      .filter(
        (item) =>
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
      )
      .slice(-10)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 3000),
      }));

    const lastUserMessage = [...messages]
      .reverse()
      .find((item) => item.role === "user");

    if (!lastUserMessage?.content?.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "Please enter a message."
      );
    }

    const db = getFirestore();

    try {
      const studentSnapshot = await db
        .doc(`studentProfiles/${uid}`)
        .get();

      const student = studentSnapshot.exists
        ? studentSnapshot.data()
        : {};

      let skillContext = "";
      const skillId =
        typeof params.skillId === "string"
          ? params.skillId.slice(0, 120)
          : "";

      if (skillId) {
        const builtInSnapshot = await db
          .doc(`skills/${skillId}`)
          .get();

        if (builtInSnapshot.exists) {
          const skill = builtInSnapshot.data();
          const customizationSnapshot = await db
            .doc(
              `users/${uid}/skillCustomizations/${skillId}`
            )
            .get();

          const steps =
            customizationSnapshot.exists &&
            Array.isArray(customizationSnapshot.data().steps)
              ? customizationSnapshot.data().steps
              : Array.isArray(skill.steps)
                ? skill.steps
                : [];

          skillContext = [
            `Current skill: ${skill.title || skillId}`,
            skill.subtitle ? `Skill summary: ${skill.subtitle}` : "",
            skill.description
              ? `Description: ${skill.description}`
              : "",
            steps.length
              ? `Current steps: ${steps.join(" | ")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n");
        } else {
          const customSnapshot = await db
            .doc(`users/${uid}/customSkills/${skillId}`)
            .get();

          if (customSnapshot.exists) {
            const skill = customSnapshot.data();
            skillContext = [
              `Current custom skill: ${skill.title || skillId}`,
              skill.subtitle ? `Skill summary: ${skill.subtitle}` : "",
              skill.description
                ? `Description: ${skill.description}`
                : "",
              Array.isArray(skill.steps) && skill.steps.length
                ? `Current steps: ${skill.steps.join(" | ")}`
                : "",
            ]
              .filter(Boolean)
              .join("\n");
          }
        }
      }

      const studentContext = [
        student.name ? `Student name/nickname: ${student.name}` : "",
        student.age != null ? `Age: ${student.age}` : "",
        student.strengths
          ? `Strengths: ${student.strengths}`
          : "",
        student.barriers
          ? `Learning barriers: ${student.barriers}`
          : "",
        student.interests
          ? `Interests: ${student.interests}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      const response = await openai.responses.create({
        model: "gpt-6-luna",
        instructions: [
          "You are the SEEDS Independent Steps caregiver assistant.",
          "Help parents and caregivers teach practical life skills to children and teens.",
          "Be supportive, concrete, concise, and action-oriented.",
          "Break tasks into small steps when helpful.",
          "Suggest visual supports, prompting, choices, repetition, reinforcement, and ways to reduce task difficulty when appropriate.",
          "Use the student's profile and current skill context only when relevant.",
          "Never diagnose a medical, psychological, developmental, or educational condition.",
          "Do not present your answer as professional medical, therapeutic, legal, or emergency advice.",
          "If there is immediate danger or a medical emergency, tell the caregiver to contact appropriate emergency/professional help.",
          "Do not shame the student or caregiver.",
          "If the user asks to modify an app skill, explain the suggested change clearly but do not claim it was saved unless the app actually saves it.",
          "Prefer short paragraphs and numbered steps over long essays.",
        ].join("\n"),
        input: [
          {
            role: "user",
            content: [
              screenPath
                ? `Current app screen: ${screenPath}`
                : "",
              studentContext
                ? `Student profile:\n${studentContext}`
                : "Student profile: not provided.",
              skillContext
                ? `Screen skill context:\n${skillContext}`
                : "",
              "Conversation:",
              ...messages.map(
                (item) =>
                  `${item.role === "user" ? "Caregiver" : "Assistant"}: ${item.content}`
              ),
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        max_output_tokens: 500,
      });

      const answer = response.output_text?.trim();

      if (!answer) {
        throw new Error("OpenAI returned an empty response.");
      }

      return {
        answer,
      };
    } catch (error) {
      console.error("Chat assistant error:", {
        code: error?.code,
        message: error?.message,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "The assistant could not answer right now."
      );
    }
  }
);
