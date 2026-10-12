// Bundled artwork; future user-created flowers may instead use Firebase Storage URLs.
export const FLOWER_TYPES = ["sunflower", "tulip", "rose", "lavender", "hydrangea"];
const FLOWER_ART = {
  sunflower: [
    require('../assets/garden/sunflower_seed.png'),
    require('../assets/garden/sunflower_sprout.png'),
    require('../assets/garden/sunflower_plant.png'),
    require('../assets/garden/sunflower_flower.png'),
  ],
  tulip: [
    require('../assets/garden/tulip_seed.png'),
    require('../assets/garden/tulip_sprout.png'),
    require('../assets/garden/tulip_plant.png'),
    require('../assets/garden/tulip_flower.png'),
  ],

  rose: [
    require('../assets/garden/rose_seed.png'),
    require('../assets/garden/rose_sprout.png'),
    require('../assets/garden/rose_plant.png'),
    require('../assets/garden/rose_flower.png'),
  ],
  lavender: [
    require('../assets/garden/lavender_seed.png'),
    require('../assets/garden/lavender_sprout.png'),
    require('../assets/garden/lavender_plant.png'),
    require('../assets/garden/lavender_flower.png'),
  ],
  hydrangea: [
    require('../assets/garden/hydrangea_seed.png'),
    require('../assets/garden/hydrangea_sprout.png'),
    require('../assets/garden/hydrangea_plant.png'),
    require('../assets/garden/hydrangea_flower.png'),
  ],
};
export function flowerImageSource(type, stage) {
  const stages = FLOWER_ART[type] || FLOWER_ART.sunflower;
  return stages[Math.max(0, Math.min(3, Number(stage) || 0))];
}
