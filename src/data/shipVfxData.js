import { normalizePlayerPieceColor } from "./playerPieceVisuals.js";

const engineTemplates = [
  {
    id: "template-plasma",
    name: "Red Flame",
    emitters: [
      createEmitter("emitter-mqos9k3d", "flame", 35, 3, 180, 20, 190, "#fa6400", 0.8, 30, 58, 0.15, 0.65),
      createEmitter("emitter-mqosztn0", "smoke", 18, -13, 180, 20, 82, "#64748b", 0.42, 28, 24, 0.45, 0.38),
      createEmitter("emitter-mqot0t8g", "smoke", 18, 20, 180, 20, 82, "#64748b", 0.42, 28, 24, 0.45, 0.38),
      createEmitter("emitter-mqot11gq", "ember", 14, -3, 180, 6, 68, "#fb7185", 0.86, 24, 24, 0.95, 0.58),
      createEmitter("emitter-mqot1byq", "ember", 14, 3, 180, 6, 68, "#fb7185", 0.86, 24, 24, 0.95, 0.58),
      createEmitter("emitter-mqot1ipf", "ember", 14, 9, 180, 6, 68, "#fb7185", 0.86, 24, 24, 0.95, 0.58)
    ]
  }
];

const colonyShipVfxAnchors = {
  "red-ship-1": createShipAnchors("red", 1, 512, 279, [[246, 140]], [[7, 136, 359, 12, 140, "#e65151"]]),
  "red-ship-2": createShipAnchors("red", 2, 512, 294, [[245, 118], [247, 184]], [[0, 147, 0, 13, 138, "#ff5252"]]),
  "red-ship-3": createShipAnchors("red", 3, 512, 256, [[247, 127], [246, 58], [247, 194]], [[6, 125, 0, 9, 58, "#f87171"]]),
  "blue-ship-1": createShipAnchors("blue", 1, 512, 290, [[236, 145]], [[0, 145, 0, 9, 58, "#38bdf8"]]),
  "blue-ship-2": createShipAnchors("blue", 2, 512, 285, [[249, 148], [311, 147]], [[3, 144, 0, 9, 58, "#38bdf8"]]),
  "blue-ship-3": createShipAnchors("blue", 3, 512, 288, [[236, 146], [280, 146], [321, 146]], [[0, 144, 0, 9, 58, "#38bdf8"]]),
  "yellow-ship-1": createShipAnchors("yellow", 1, 512, 289, [[238, 144]], [[0, 145, 0, 9, 58, "#facc15"]]),
  "yellow-ship-2": createShipAnchors("yellow", 2, 512, 288, [[244, 145], [302, 147]], [[0, 144, 0, 9, 58, "#facc15"]]),
  "yellow-ship-3": createShipAnchors("yellow", 3, 512, 290, [[237, 146], [279, 147], [322, 147]], [[0, 145, 0, 9, 58, "#facc15"]]),
  "green-ship-1": createShipAnchors("green", 1, 512, 243, [[248, 116]], [[0, 110, 0, 9, 58, "#4ade80"]]),
  "green-ship-2": createShipAnchors("green", 2, 512, 244, [[246, 116], [313, 116]], [[0, 111, 0, 9, 58, "#4ade80"]]),
  "green-ship-3": createShipAnchors("green", 3, 512, 243, [[240, 114], [286, 115], [332, 115]], [[0, 110, 0, 9, 58, "#4ade80"]])
};

export const shipVfxData = {
  version: 2,
  engineTemplates,
  colonyShipVfxAnchors,
  shipVfxAnchors: colonyShipVfxAnchors
};

export function getShipVfxAnchors(playerColor, shipId) {
  const color = normalizePlayerPieceColor(playerColor);
  const variant = getShipVariantIndex(shipId, 3) + 1;
  return shipVfxData.colonyShipVfxAnchors[`${color}-ship-${variant}`] ?? null;
}

export function getShipEngineTemplate(templateId) {
  return shipVfxData.engineTemplates.find((template) => template.id === templateId) ?? null;
}

function createEmitter(id, type, x, y, direction, size, length, color, intensity, spread, count, speed, jitter) {
  return {
    id,
    type,
    x,
    y,
    direction,
    size,
    length,
    color,
    layer: "behind",
    intensity,
    spread,
    count,
    speed,
    jitter
  };
}

function createShipAnchors(color, variant, assetWidth, assetHeight, coils, engines) {
  return {
    color,
    variant,
    asset: `./assets/generated/player-ships/player-ship-${color}-variant-0${variant}.png`,
    assetWidth,
    assetHeight,
    coils: coils.map(([x, y], index) => ({ id: `coil-${index + 1}`, x, y })),
    engines: engines.map(([x, y, direction, size, length, engineColor], index) => ({
      id: `engine-${index + 1}`,
      x,
      y,
      direction,
      size,
      length,
      color: engineColor,
      layer: "behind",
      templateId: "template-plasma"
    }))
  };
}

function getShipVariantIndex(shipId, variantCount) {
  const numericSuffix = String(shipId).match(/-(\d+)$/);
  if (numericSuffix) {
    return (Number(numericSuffix[1]) - 1) % variantCount;
  }

  let hash = 0;
  for (const character of String(shipId)) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % variantCount;
}
