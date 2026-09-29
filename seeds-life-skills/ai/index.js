const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const OpenAI = require("openai");

setGlobalOptions({maxInstances: 10});

const openaiApiKey = defineSecret("OPENAI_API_KEY");

exports.generateVisualPlan = onCall(
    {secrets: [openaiApiKey]},
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

        const response = await openai.responses.create({
          model: "gpt-5-mini",
          instructions: `
You create simple daily living visual plans for children and teens.

Create a step-by-step plan for the selected daily living skill.

Use the child's strengths, barriers, and interests when appropriate.

Rules:
- Use short, concrete language.
- Break the activity into manageable steps.
- Put the steps in the correct order.
- Each step should contain one main action.
- Use 4 to 8 steps.
- Keep the wording suitable for a simple printable visual.
`,
          input: `
Skill: ${skill}

Strengths:
${strengths}

Barriers:
${barriers}

Interests:
${interests}
`,
        });

        return {
          success: true,
          plan: response.output_text,
        };
      } catch (error) {
        console.error("OpenAI error:", error);

        throw new HttpsError(
            "internal",
            "Unable to generate the visual plan."
        );
      }
    }
);