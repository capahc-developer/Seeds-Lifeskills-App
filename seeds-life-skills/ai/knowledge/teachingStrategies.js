// SEEDS caregiver teaching knowledge (draft examples, NOT professionally reviewed).
// Replace or revise entries using approved SEEDS video transcripts and expert review.
// Keep this file free of student names and other personal information.
const strategies = [
  {
    id: "concrete-language",
    title: "Make abstract instructions observable",
    tags: ["understand", "meaning", "word", "runny", "ready", "done", "recognize", "confused", "look"],
    guidance: "Replace vague words with something the learner can see or point to. Demonstrate two contrasting examples and ask the learner to identify which matches the target. Check understanding before expecting independent action.",
    caution: "For cooking, appearance alone does not establish food safety. An adult must supervise and use appropriate safe-cooking guidance.",
    reviewStatus: "draft",
  },
  {
    id: "task-analysis",
    title: "Break a task into smaller observable actions",
    tags: ["step", "stuck", "sequence", "first", "next", "start", "finish", "zip", "coat"],
    guidance: "Identify the exact transition where the learner pauses. Model one small action, let them practice that action, then gradually connect it with the steps before and after. Keep instructions brief.",
    caution: "Adapt physical assistance to the learner's preferences, consent, and safety needs.",
    reviewStatus: "draft",
  },
  {
    id: "visual-supports",
    title: "Use a simple visual cue",
    tags: ["visual", "picture", "remember", "sequence", "attention", "routine", "forget"],
    guidance: "Offer a photo, drawing, or two-choice visual that shows the immediate next action. Point to the cue while demonstrating; gradually reduce reminders when useful.",
    caution: "Use visuals that are understandable and appropriate for the individual learner.",
    reviewStatus: "draft",
  },
  {
    id: "prompt-fading",
    title: "Give just enough help, then reduce prompts",
    tags: ["help", "prompt", "reminder", "independent", "assistance", "repeat"],
    guidance: "Start with the least intrusive prompt that works, such as pointing or a short verbal cue. Allow time to respond. Reduce prompts gradually while keeping the task safe and achievable.",
    caution: "Do not withhold necessary safety support in pursuit of independence.",
    reviewStatus: "draft",
  },
  {
    id: "sensory-and-motor",
    title: "Check sensory or movement barriers",
    tags: ["sensory", "texture", "sound", "touch", "motor", "grip", "hold", "difficult", "hard"],
    guidance: "Notice whether noise, texture, grip, reach, or positioning may be getting in the way. Offer a manageable environmental or tool adjustment and try one change at a time.",
    caution: "Do not infer a diagnosis from a single observation.",
    reviewStatus: "draft",
  },
];

function selectTeachingStrategies(queryText, limit = 3) {
  const text = String(queryText || "").toLowerCase();
  const ranked = strategies
    .map((strategy) => ({
      strategy,
      score: strategy.tags.reduce(
        (score, tag) => score + (text.includes(tag) ? 1 : 0),
        0
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map(({ strategy }) => strategy);
}

function formatTeachingStrategies(selected) {
  if (!selected.length) return "";
  return [
    "Relevant SEEDS teaching knowledge (DRAFT examples; not expert-approved):",
    ...selected.map(
      (item) =>
        "- " + item.title + ": " + item.guidance + " Caution: " + item.caution
    ),
    "Treat this knowledge as optional guidance, not proof of a diagnosis or professional endorsement.",
  ].join("\n");
}

module.exports = { selectTeachingStrategies, formatTeachingStrategies };
