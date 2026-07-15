import { playerPieceColors } from "./playerPieceVisuals.js";

const factoryAssetSlugByType = {
  ore: "mine",
  fuel: "refinery",
  food: "food",
  carbon: "carbon",
  goods: "trade"
};

export const factoryAssetPaths = Object.fromEntries(
  Object.entries(factoryAssetSlugByType).map(([factoryType, slug]) => [
    factoryType,
    Object.fromEntries(playerPieceColors.map((color) => [
      color,
      `./assets/generated/factories/factory-${slug}-${color}.png`
    ]))
  ])
);

export const factoryBlueprintAssetPaths = Object.fromEntries(
  Object.entries(factoryAssetSlugByType).map(([factoryType, slug]) => [
    factoryType,
    `./assets/generated/ui/blueprint-factory-${slug}.png`
  ])
);

export function getFactoryAssetPath(factoryType, playerColor) {
  const colorAssets = factoryAssetPaths[factoryType];
  return colorAssets?.[playerColor] ?? colorAssets?.blue ?? null;
}

export function getFactoryBlueprintAssetPath(factoryType) {
  return factoryBlueprintAssetPaths[factoryType] ?? null;
}
