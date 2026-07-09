const battleShipAssetMetrics = {
  red: {
    1: [1196, 524],
    2: [1195, 524],
    3: [1196, 525]
  },
  blue: {
    1: [1196, 524],
    2: [1196, 525],
    3: [1197, 524]
  },
  yellow: {
    1: [1195, 524],
    2: [1195, 524],
    3: [1195, 525]
  },
  green: {
    1: [1195, 524],
    2: [1196, 525],
    3: [1196, 525]
  }
};

const battleShipEffectColors = {
  red: "#ef4444",
  blue: "#38bdf8",
  yellow: "#facc15",
  green: "#4ade80"
};

export const battleShipVfxData = {
  version: 1,
  battleShipVfxAnchors: createBattleShipVfxAnchors()
};

function createBattleShipVfxAnchors() {
  const anchors = {};
  for (const color of ["red", "blue", "yellow", "green"]) {
    for (const variant of [1, 2, 3]) {
      anchors[`${color}-battle-ship-${variant}`] = createBattleShipAnchors(color, variant);
    }
  }
  return anchors;
}

function createBattleShipAnchors(color, variant) {
  const [assetWidth, assetHeight] = battleShipAssetMetrics[color][variant];
  const midY = Math.round(assetHeight / 2);
  return {
    color,
    variant,
    asset: `./assets/generated/battle-ships/battle-ship-${color}-variant-0${variant}.png`,
    assetWidth,
    assetHeight,
    coils: getCoilsForVariant(variant, midY),
    engines: [
      {
        id: "engine-1",
        x: 34,
        y: midY,
        direction: 180,
        size: 12,
        length: 92,
        color: battleShipEffectColors[color],
        layer: "behind",
        templateId: "template-plasma"
      }
    ],
    shots: [
      {
        id: "shot-1",
        x: assetWidth - 26,
        y: midY,
        direction: 0,
        weaponType: "laser",
        size: 10,
        length: 150,
        speed: 1.6,
        duration: 420,
        fireRate: 1,
        spread: 0,
        salvoCount: 1,
        intensity: 1,
        color: battleShipEffectColors[color],
        layer: "front",
        templateId: "template-plasma"
      }
    ]
  };
}

function getCoilsForVariant(variant, midY) {
  const coilSets = {
    1: [[520, midY]],
    2: [[480, midY], [610, midY]],
    3: [[455, midY], [560, midY], [665, midY]]
  };
  return coilSets[variant].map(([x, y], index) => ({ id: `coil-${index + 1}`, x, y }));
}
