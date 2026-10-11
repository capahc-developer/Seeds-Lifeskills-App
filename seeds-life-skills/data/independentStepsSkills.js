export const independentStepsSkills = [
  {
    id: 'morning-routine',
    title: 'Morning Routine',
    subtitle: 'Build a consistent morning routine',
    icon: 'sunny-outline',
    order: 1,
    videoUrl: 'https://www.youtube.com/watch?v=T07KyptAXgc',
    resourceUrl: 'https://www.capa-hc.org/seeds-2/',
  },
  {
    id: 'zip-winter-coat',
    title: 'Zip Up a Winter Coat',
    subtitle: 'Practice zipping a winter coat independently',
    icon: 'shirt-outline',
    order: 2,
    videoUrl: 'https://www.youtube.com/watch?v=JfOPtfkOnXU',
    resourceUrl: 'https://www.capa-hc.org/seeds-2/',
  },
  {
    id: 'cook-eggs',
    title: 'Cook Eggs',
    subtitle: 'Practice a simple cooking routine',
    icon: 'restaurant-outline',
    order: 3,
    videoUrl: 'https://www.youtube.com/watch?v=Qb0jkkwasLo',
    resourceUrl: 'https://www.capa-hc.org/seeds-2/',
  },
  {
    id: 'shop',
    title: 'Shop',
    subtitle: 'Practice shopping and everyday independence',
    icon: 'cart-outline',
    order: 4,
    videoUrl: 'https://www.youtube.com/watch?v=ewZlXDXmfgU',
    resourceUrl: 'https://www.capa-hc.org/seeds-2/',
  },
  {
    id: 'brushing-teeth',
    title: 'Brush Teeth',
    subtitle: 'Build a predictable tooth-brushing routine',
    icon: 'sparkles-outline',
    order: 5,
    videoUrl: 'https://www.youtube.com/watch?v=RQv95w44vsA',
    resourceUrl: 'https://www.capa-hc.org/seeds-2/',
  },
];

export function findIndependentStepsSkill(skillId) {
  return independentStepsSkills.find(
    (skill) => skill.id === String(skillId)
  );
}
