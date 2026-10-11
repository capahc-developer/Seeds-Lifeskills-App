const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const OpenAI = require('openai');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

exports.chatAssistant = onCall(
  {
    region: 'us-central1',
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 60,
    memory: '256MiB',
    invoker: 'public',
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to use the assistant.'
      );
    }

    const data = request.data || {};
    const screenPath =
      typeof data.screenPath === 'string'
        ? data.screenPath.slice(0, 200)
        : '';

    const params =
      data.params && typeof data.params === 'object'
        ? data.params
        : {};

    const messages = Array.isArray(data.messages)
      ? data.messages
          .filter(
            (item) =>
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string'
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 3000),
          }))
      : [];

    const lastUserMessage = [...messages]
      .reverse()
      .find((item) => item.role === 'user');

    if (!lastUserMessage?.content?.trim()) {
      throw new HttpsError(
        'invalid-argument',
        'Please enter a message.'
      );
    }

    try {
      const profileSnapshot = await db
        .doc(`studentProfiles/${uid}`)
        .get();

      const profile = profileSnapshot.exists
        ? profileSnapshot.data()
        : {};

      const skillId =
        typeof params.skillId === 'string'
          ? params.skillId.slice(0, 120)
          : '';

      let skillContext = '';

      if (skillId) {
        const skillSnapshot = await db
          .doc(`skills/${skillId}`)
          .get();

        if (skillSnapshot.exists) {
          const skill = skillSnapshot.data();

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
            skill.subtitle
              ? `Skill summary: ${skill.subtitle}`
              : '',
            skill.description
              ? `Description: ${skill.description}`
              : '',
            steps.length
              ? `Current steps: ${steps.join(' | ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n');
        }
      }

      const studentContext = [
        profile.name
          ? `Student name/nickname: ${profile.name}`
          : '',
        profile.age != null
          ? `Age: ${profile.age}`
          : '',
        profile.strengths
          ? `Strengths: ${profile.strengths}`
          : '',
        profile.barriers
          ? `Learning barriers: ${profile.barriers}`
          : '',
        profile.interests
          ? `Interests: ${profile.interests}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY.value(),
      });

      const response = await openai.responses.create({
        model: 'gpt-5-mini',
        instructions: [
          'You are the SEEDS Independent Steps caregiver assistant.',
          'Help parents and caregivers teach practical life skills to children and teens.',
          'Your main job is to troubleshoot where a student gets stuck and identify very small missing steps that may have been skipped.',
          'Be supportive, concrete, concise, and action-oriented.',
          'Break tasks into small observable steps when useful.',
          'Suggest visual supports, prompting, choices, repetition, reinforcement, and ways to reduce task difficulty when appropriate.',
          'Use the student profile and current skill context only when relevant.',
          'Never diagnose a medical, psychological, developmental, or educational condition.',
          'Do not present your answer as professional medical, therapeutic, legal, or emergency advice.',
          'Do not shame the student or caregiver.',
          'Prefer short paragraphs and numbered steps over long essays.',
        ].join('\n'),
        input: [
          {
            role: 'user',
            content: [
              screenPath
                ? `Current app screen: ${screenPath}`
                : '',
              studentContext
                ? `Student profile:\n${studentContext}`
                : 'Student profile: not provided.',
              skillContext
                ? `Current skill context:\n${skillContext}`
                : '',
              'Conversation:',
              ...messages.map(
                (item) =>
                  `${item.role === 'user' ? 'Caregiver' : 'Assistant'}: ${item.content}`
              ),
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
        ],
        max_output_tokens: 500,
      });

      const answer = response.output_text?.trim();

      if (!answer) {
        throw new Error('OpenAI returned an empty response.');
      }

      return { answer };
    } catch (error) {
      console.error('Chat assistant error:', {
        code: error?.code,
        message: error?.message,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'The assistant could not answer right now.'
      );
    }
  }
);

exports.deleteAccountData = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '512MiB',
    invoker: 'public',
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to delete your account.'
      );
    }

    const authTime = Number(
      request.auth?.token?.auth_time || 0
    );

    const nowSeconds = Math.floor(
      Date.now() / 1000
    );

    if (
      !authTime ||
      nowSeconds - authTime > 10 * 60
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Please sign in again before deleting your account.'
      );
    }

    let stage = 'starting deletion';

    try {
      stage = 'deleting stored user files';

      const projectId =
        process.env.GCLOUD_PROJECT ||
        process.env.GCP_PROJECT ||
        'seeds-life-skills';

      const bucketNames = [
        `${projectId}.firebasestorage.app`,
        `${projectId}.appspot.com`,
      ];

      for (const bucketName of bucketNames) {
        try {
          const bucket = admin
            .storage()
            .bucket(bucketName);

          const [exists] = await bucket.exists();
          if (!exists) continue;

          await bucket.deleteFiles({
            prefix: `visual-posters/${uid}/`,
          });
        } catch (storageError) {
          console.warn(
            `Skipping unavailable Storage bucket ${bucketName}:`,
            storageError?.message || storageError
          );
        }
      }

      stage = 'deleting Firestore profile and user data';

      await Promise.all([
        db.recursiveDelete(
          db.doc(`adultProfiles/${uid}`)
        ),
        db.recursiveDelete(
          db.doc(`studentProfiles/${uid}`)
        ),
        db.recursiveDelete(
          db.doc(`users/${uid}`)
        ),
      ]);

      stage = 'deleting Firebase Authentication account';

      await admin.auth().deleteUser(uid);

      return { success: true };
    } catch (error) {
      console.error(
        'Account deletion backend error:',
        {
          stage,
          code: error?.code,
          message: error?.message,
        }
      );

      throw new HttpsError(
        'failed-precondition',
        `Account deletion failed while ${stage}.`,
        {
          stage,
          backendMessage:
            error?.message || 'unknown error',
          backendCode: error?.code || null,
        }
      );
    }
  }
);
