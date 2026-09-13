// Static content for the app. Swap this out for real backend/CMS data later.

export const overallStrategies = [
  {
    id: "positive-reinforcement",
    title: "Use Positive Reinforcement",
    summary: "Catch your child doing something right",
    icon: "star",
    color: "green",
    recommendation:
      "Praise or reward specific behaviors right after they happen. Be specific about what your child did well so they know exactly what to repeat next time.",
  },
  {
    id: "one-instruction",
    title: "Give One Instruction at a Time",
    summary: "Keep instructions clear and simple",
    icon: "list",
    color: "orange",
    recommendation:
      "Break tasks into single steps and give one direction at a time. Wait for your child to complete it before moving on to the next instruction.",
  },
  {
    id: "consistency",
    title: "Maintain Consistency",
    summary: "Predictability helps children feel secure",
    icon: "refresh-cw",
    color: "red",
    recommendation:
      "Use the same words, routines, and expectations every day. Consistency across caregivers and settings helps your child know what to expect.",
  },
  {
    id: "visual-supports",
    title: "Use Visual Supports",
    summary: "Visuals help children understand and remember",
    icon: "image",
    color: "purple",
    recommendation:
      "Pair spoken instructions with pictures, checklists, or visual schedules so your child has something concrete to reference.",
  },
  {
    id: "celebrate-small-successes",
    title: "Celebrate Small Successes",
    summary: "Small wins build confidence",
    icon: "award",
    color: "gold",
    recommendation:
      "Notice and celebrate progress, not just the finished result. Small, frequent wins build the confidence needed for bigger steps later.",
  },
];

export const morningRoutineStrategies = [
  {
    id: "prepare-night-before",
    number: 1,
    title: "Prepare the Night Before",
    summary: "Set your child up for success in the morning",
    icon: "moon",
    color: "purple",
    recommendation:
      "Lay out clothes, pack bags, and agree on the morning plan the night before. Reducing decisions in the morning lowers stress for everyone.",
  },
  {
    id: "visual-checklist",
    number: 2,
    title: "Use a Visual Checklist",
    summary: "Visual steps help your child stay on track",
    icon: "check-square",
    color: "purple",
    recommendation:
      "Use a visual checklist to show each step of the morning routine. This helps children see what needs to be done and feel a sense of accomplishment as they check off each step.",
  },
  {
    id: "reduce-verbal-prompting",
    number: 3,
    title: "Reduce Verbal Prompting Over Time",
    summary: "Gradually reduce help so your child builds skills",
    icon: "message-circle",
    color: "purple",
    recommendation:
      "Start with clear verbal reminders, then slowly step back as your child masters each step, letting the checklist do more of the work.",
  },
  {
    id: "reward-completion",
    number: 4,
    title: "Reward Completion Not Perfection",
    summary: "Focus on progress, not perfection",
    icon: "gift",
    color: "purple",
    recommendation:
      "Celebrate that the routine got done, even if steps were out of order or needed reminders. Perfection isn't the goal, momentum is.",
  },
];

export const initialPracticeLogEntries = [
  {
    id: "1",
    skill: "Morning Routine",
    strategy: "Used a Visual Checklist",
    date: "2024-05-12",
    result: "success",
    notes: "Needed one reminder",
  },
  {
    id: "2",
    skill: "Morning Routine",
    strategy: "Used a Visual Checklist",
    date: "2024-05-11",
    result: "partial",
    notes: "Forgot to check in",
  },
  {
    id: "3",
    skill: "Morning Routine",
    strategy: "Used a Visual Checklist",
    date: "2024-05-10",
    result: "failed",
    notes: "Refused to look at checklist",
  },
  {
    id: "4",
    skill: "Morning Routine",
    strategy: "Prepared Before Bed",
    date: "2024-05-09",
    result: "success",
    notes: "Morning was easy",
  },
];

export const skillOptions = ["Morning Routine"];

export const strategyOptionsBySkill = {
  "Morning Routine": morningRoutineStrategies.map((s) => s.title),
};