export const skillCategories = [
  { id: 'daily-living', title: 'Daily Living Skills', subtitle: 'Routines, self-care, independence', icon: 'sunny-outline' },
  { id: 'learning-school', title: 'Learning & School Skills', subtitle: 'Focus, organization, following directions', icon: 'book-outline' },
  { id: 'social', title: 'Social Skills', subtitle: 'Communication, friendships', icon: 'people-outline' },
  { id: 'emotional', title: 'Emotional Regulation', subtitle: 'Managing feelings and coping', icon: 'heart-outline' },
  { id: 'eating', title: 'Eating & Nutrition', subtitle: 'Food preferences and mealtime skills', icon: 'restaurant-outline' },
  { id: 'motor', title: 'Gross & Fine Motor Skills', subtitle: 'Movement, coordination', icon: 'fitness-outline' },
];

export const skills = [
  {
    id: 'morning-routine', categoryId: 'daily-living', title: 'Morning Routine', subtitle: 'Getting ready for the day', icon: 'sunny-outline', modules: [],
    description: 'Helps your child build independence and confidence by following a consistent morning routine.',
    goals: ['Follow a sequence of morning tasks', 'Transition between activities', 'Build independence'],
    strategies: [
      { title: 'Use a visual schedule', detail: 'Show each task in order with a simple picture and a few words.' },
      { title: 'Give transition warnings', detail: 'Use a timer or short verbal cue before moving to the next step.' },
      { title: 'Provide choices', detail: 'Offer limited choices when possible to increase participation.' },
      { title: 'Use positive reinforcement', detail: 'Notice and praise effort, progress, and successful transitions.' },
    ],
  },
  { id: 'brushing-teeth', categoryId: 'daily-living', title: 'Brushing Teeth', subtitle: 'Oral hygiene routine', icon: 'sparkles-outline', modules: [], description: 'Build a predictable and independent tooth-brushing routine.', goals: ['Complete brushing steps in order', 'Tolerate brushing sensations', 'Increase independence'], strategies: [{ title: 'Use the same sequence', detail: 'Keep the brushing steps and location consistent.' }, { title: 'Reduce sensory load', detail: 'Consider tolerated toothpaste flavors, brush textures, and water temperature.' }] },
  { id: 'getting-dressed', categoryId: 'daily-living', title: 'Getting Dressed', subtitle: 'Choosing and putting on clothes', icon: 'shirt-outline', modules: [], description: 'Practice selecting and putting on clothing with the right level of support.', goals: ['Choose appropriate clothes', 'Complete dressing steps', 'Ask for help when needed'], strategies: [{ title: 'Lay clothes out in order', detail: 'Arrange clothing in the sequence it will be put on.' }, { title: 'Use backward chaining', detail: 'Let the child finish the last step first, then gradually add earlier steps.' }] },
  { id: 'cleaning-up', categoryId: 'daily-living', title: 'Cleaning Up', subtitle: 'Tidying and responsibility', icon: 'basket-outline', modules: [], description: 'Develop a simple, repeatable cleanup routine.', goals: ['Sort items', 'Follow cleanup steps', 'Finish a short routine'], strategies: [{ title: 'Define “finished” visually', detail: 'Show what the space should look like when cleanup is complete.' }] },
  { id: 'following-directions', categoryId: 'learning-school', title: 'Following Directions', subtitle: 'Understanding and completing directions', icon: 'list-outline', modules: [], description: 'Build success with one-step and multistep directions.', goals: ['Attend to directions', 'Remember steps', 'Complete tasks'], strategies: [{ title: 'Chunk directions', detail: 'Break multistep directions into smaller parts and check understanding.' }, { title: 'Pair words with visuals', detail: 'Use pictures, gestures, or a written checklist to support spoken directions.' }] },
  { id: 'starting-conversation', categoryId: 'social', title: 'Starting a Conversation', subtitle: 'Beginning social interactions', icon: 'chatbubbles-outline', modules: [], description: 'Practice comfortable ways to begin a conversation.', goals: ['Notice opportunities to connect', 'Use a greeting or opener', 'Take turns'], strategies: [{ title: 'Practice scripts', detail: 'Rehearse a few flexible conversation starters in low-pressure settings.' }] },
  { id: 'calming-down', categoryId: 'emotional', title: 'Calming Down', subtitle: 'Coping when overwhelmed', icon: 'heart-outline', modules: [], description: 'Identify and practice strategies for returning to a regulated state.', goals: ['Recognize early signs', 'Choose a coping strategy', 'Return to activity'], strategies: [{ title: 'Practice when calm', detail: 'Teach coping strategies before they are needed during a difficult moment.' }] },
  { id: 'trying-foods', categoryId: 'eating', title: 'Trying New Foods', subtitle: 'Exploring foods gradually', icon: 'nutrition-outline', modules: [], description: 'Support gradual, low-pressure exploration of unfamiliar foods.', goals: ['Tolerate new foods nearby', 'Explore safely', 'Communicate preferences'], strategies: [{ title: 'Use gradual exposure', detail: 'Move from seeing and smelling to touching or tasting without forcing progression.' }] },
  { id: 'fine-motor', categoryId: 'motor', title: 'Fine Motor Practice', subtitle: 'Hands and everyday tools', icon: 'hand-left-outline', modules: [], description: 'Practice hand skills used in everyday activities.', goals: ['Improve control', 'Use common tools', 'Build confidence'], strategies: [{ title: 'Adapt the task', detail: 'Adjust size, grip, position, or duration so the child can participate successfully.' }] },
];

export function findSkill(skillId) { return skills.find((skill) => skill.id === String(skillId)); }
export function findCategory(categoryId) { return skillCategories.find((category) => category.id === String(categoryId)); }

// Compatibility helpers for the app's existing Lessons/Assignments screens.
export function findModule(skillId, moduleId) {
  return findSkill(skillId)?.modules?.find((module) => module.id === String(moduleId));
}
export function findAssignment(skillId, assignmentId) {
  return findSkill(skillId)?.modules?.find((module) => module.assignmentId === String(assignmentId));
}
