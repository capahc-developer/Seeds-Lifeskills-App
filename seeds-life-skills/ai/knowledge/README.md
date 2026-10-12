# SEEDS professional teaching knowledge (Firestore)

The `chatAssistant` callable function now reads from the **teachingStrategies** Firestore collection. It retrieves up to 100 active records, scores their `keywords` against the parent's question and selected skill context, and includes at most 3 relevant **approved** records in the AI prompt.

## Create a strategy document in Firebase Console
Firestore Database → Start collection → `teachingStrategies` → Add document.

Example document ID: `concrete-language`

| Field | Firestore type | Example |
| --- | --- | --- |
| title | string | Make vague language concrete |
| whenToUse | string | Learner has difficulty understanding a term such as "runny" or "ready" |
| guidance | string | Show two clear examples and ask the learner to identify the matching one before practicing |
| cautions | string | For cooking, an adult must supervise and follow appropriate food safety guidance |
| keywords | array of strings | runny, understand, meaning, ready, look, egg |
| source | string | SEEDS video 1, timestamp TBD |
| reviewStatus | string | draft |
| active | boolean | false |

**Draft entries will not be sent to AI.** After the content is checked by an authorized reviewer, change `reviewStatus` to `approved` and `active` to `true`. Only mark as approved if an actual review took place.

Keep parent/student names and other private information out of these shared knowledge documents. Set Firestore security rules so ordinary app users cannot write to this collection; only authorized administrators should manage it. The Cloud Function uses the Admin SDK and does not require client read access.

## Deploy
From `seeds-life-skills`:

```bash
firebase deploy --only functions:chatAssistant --project seeds-life-skills
```

Ensure your working tree includes the changes to `ai/index.js` and `ai/knowledge/firestoreStrategies.js` before deploying. A deployment is required **once** to enable Firestore retrieval; after that, editing strategy documents does not require a redeployment.

## Notes
- With no approved matching strategies, the AI uses its existing general prompt.
- Keyword matching is a starter retrieval approach; it does not understand synonyms automatically.
- The backend currently reads at most 100 active documents. For a large library, add indexed category retrieval or semantic search.
- The app should not claim AI-generated advice is professional advice or automatically add it to the approved library.
