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

initializeApp();

setGlobalOptions({
  maxInstances: 10,
});

const openaiApiKey = defineSecret("OPENAI_API_KEY");

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


const assistantSchemas = {
  advice: {
    type: "object",
    properties: { answer: { type: "string" } },
    required: ["answer"],
    additionalProperties: false,
  },
};

function cleanAssistantText(value, limit) {
  return typeof value === "string"
    ? value.trim().slice(0, limit)
    : "";
}

exports.parentAssistant = onCall(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 5,
    invoker: "public",
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in to use the assistant."
      );
    }

    const mode = request.data?.mode;
    const question =
      typeof request.data?.question === "string"
        ? request.data.question.trim()
        : "";

    if (
      mode !== "advice" ||
      question.length < 5 ||
      question.length > 600
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Enter a question of 5 to 600 characters."
      );
    }

    const db = getFirestore();
    let context = "No student profile provided.";

    try {
      const day = new Date().toISOString().slice(0, 10);
      const usage = db.doc(`assistantUsage/${uid}_${day}`);

      try {
        await db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(usage);
          const count = snapshot.exists
            ? snapshot.get("count") || 0
            : 0;

          if (count >= 20) {
            throw new HttpsError(
              "resource-exhausted",
              "Daily assistant limit reached. Try again tomorrow."
            );
          }

          transaction.set(
            usage,
            {
              count: count + 1,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        });
      } catch (usageError) {
        if (usageError instanceof HttpsError) {
          throw usageError;
        }

        // Usage tracking should never prevent a caregiver from getting help.
        console.warn("Assistant usage tracking failed:", {
          code: usageError?.code,
          message: usageError?.message,
        });
      }

      if (request.data?.useProfile === true) {
        try {
          const snapshot = await db
            .doc(`studentProfiles/${uid}`)
            .get();

          const profile = snapshot.data() || {};

          context = JSON.stringify({
            age:
              typeof profile.age === "number"
                ? profile.age
                : undefined,
            strengths: cleanAssistantText(
              profile.strengths,
              300
            ),
            barriers: cleanAssistantText(
              profile.barriers,
              300
            ),
            interests: cleanAssistantText(
              profile.interests,
              300
            ),
          });
        } catch (profileError) {
          // The assistant can still work without profile personalization.
          console.warn("Assistant profile lookup failed:", {
            code: profileError?.code,
            message: profileError?.message,
          });
        }
      }

      const instructions = [
      "You are the SEEDS Independent Steps caregiver assistant.",
      "Help parents and caregivers teach practical daily life skills.",
      "When a child is stuck, focus on the transition where the difficulty happens and suggest tiny physical or observable micro-steps that may be missing.",
      "Explain what the caregiver should watch for before moving to the next action.",
      "Be supportive, practical, concise, and non-diagnostic.",
      "Do not claim a technique is guaranteed.",
      "Return JSON with one field named answer containing the advice.",
    ].join("\n");

      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${openaiApiKey.value()}`,
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            store: false,
            max_output_tokens: 900,
            reasoning: { effort: "low" },
            instructions,
            input:
              `Student context: ${context}\nCaregiver request: ${question}`,
            text: {
              format: {
                type: "json_schema",
                name: "parent_advice",
                strict: true,
                schema: assistantSchemas.advice,
              },
            },
          }),
          signal: AbortSignal.timeout(45000),
        }
      );

      if (!response.ok) {
        const bodyText = await response.text();
        console.error(
          "OpenAI response error:",
          response.status,
          bodyText
        );
        throw new Error(
          `Model HTTP ${response.status}`
        );
      }

      const body = await response.json();
      const output = body.output
        ?.flatMap((item) => item.content || [])
        .find(
          (part) => part.type === "output_text"
        )?.text;

      const parsed = JSON.parse(output);
      const answer = cleanAssistantText(
        parsed?.answer,
        2400
      );

      if (!answer) {
        throw new Error("Empty advice");
      }

      return { answer };
    } catch (error) {
      console.error("Parent assistant failed:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "unavailable",
        "The assistant is unavailable. Please try again later.",
        {
          backendCode: error?.code || null,
          backendMessage: error?.message || "unknown error",
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
        const independentSkillTitles = {
          "morning-routine": "Morning Routine",
          "zip-winter-coat": "Zip Up a Winter Coat",
          "cook-eggs": "Cook Eggs",
          "shop": "Shop",
          "brushing-teeth": "Brush Teeth",
        };

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
          } else if (independentSkillTitles[skillId]) {
            skillContext =
              `Current skill: ${independentSkillTitles[skillId]}\n` +
              "The parent may be asking for help identifying a missing micro-step.";
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
        model: "gpt-5-mini",
        instructions: [
          "You are the SEEDS Independent Steps caregiver assistant.",
          "Help parents and caregivers teach practical life skills to children and teens.",
          "Be supportive, concrete, concise, and action-oriented.",
          "When a caregiver says the student is stuck, first identify the transition between the surrounding steps and suggest one or more very small observable actions that may be missing.",
          "Break tasks into small physical or observable actions when helpful.",
          "For each suggested micro-step, explain briefly what the caregiver should look for before moving on.",
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
