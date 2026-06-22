export const playerPieceColors = ["red", "blue", "yellow", "green"];

export const colonyShipAssetPaths = {
  red: [
    "./assets/generated/player-ships/player-ship-red-variant-01.png",
    "./assets/generated/player-ships/player-ship-red-variant-02.png",
    "./assets/generated/player-ships/player-ship-red-variant-03.png"
  ],
  blue: [
    "./assets/generated/player-ships/player-ship-blue-variant-01.png",
    "./assets/generated/player-ships/player-ship-blue-variant-02.png",
    "./assets/generated/player-ships/player-ship-blue-variant-03.png"
  ],
  yellow: [
    "./assets/generated/player-ships/player-ship-yellow-variant-01.png",
    "./assets/generated/player-ships/player-ship-yellow-variant-02.png",
    "./assets/generated/player-ships/player-ship-yellow-variant-03.png"
  ],
  green: [
    "./assets/generated/player-ships/player-ship-green-variant-01.png",
    "./assets/generated/player-ships/player-ship-green-variant-02.png",
    "./assets/generated/player-ships/player-ship-green-variant-03.png"
  ]
};

export const playerShipAssetPaths = colonyShipAssetPaths;

export const tradeShipAssetPaths = {
  red: [
    "./assets/generated/trade-ships/trade-ship-red-variant-01.png",
    "./assets/generated/trade-ships/trade-ship-red-variant-02.png",
    "./assets/generated/trade-ships/trade-ship-red-variant-03.png"
  ],
  blue: [
    "./assets/generated/trade-ships/trade-ship-blue-variant-01.png",
    "./assets/generated/trade-ships/trade-ship-blue-variant-02.png",
    "./assets/generated/trade-ships/trade-ship-blue-variant-03.png"
  ],
  yellow: [
    "./assets/generated/trade-ships/trade-ship-yellow-variant-01.png",
    "./assets/generated/trade-ships/trade-ship-yellow-variant-02.png",
    "./assets/generated/trade-ships/trade-ship-yellow-variant-03.png"
  ],
  green: [
    "./assets/generated/trade-ships/trade-ship-green-variant-01.png",
    "./assets/generated/trade-ships/trade-ship-green-variant-02.png",
    "./assets/generated/trade-ships/trade-ship-green-variant-03.png"
  ]
};

export const playerColonyAssetPaths = {
  red: "./assets/generated/player-colonies/player-colony-red.png",
  blue: "./assets/generated/player-colonies/player-colony-blue.png",
  yellow: "./assets/generated/player-colonies/player-colony-yellow.png",
  green: "./assets/generated/player-colonies/player-colony-green.png"
};

export const playerSpaceportAssetPaths = {
  red: "./assets/generated/player-spaceports/player-spaceport-red.png",
  blue: "./assets/generated/player-spaceports/player-spaceport-blue.png",
  yellow: "./assets/generated/player-spaceports/player-spaceport-yellow.png",
  green: "./assets/generated/player-spaceports/player-spaceport-green.png"
};

export const playerPieceVisualDefaults = {
  ship: {
    width: 58,
    height: 34,
    hitRadius: 22
  },
  colony: {
    width: 52,
    height: 46,
    hitRadius: 24
  },
  spaceport: {
    width: 70,
    height: 70,
    hitRadius: 32
  }
};

const colorAliases = {
  white: "green"
};

export function getPlayerShipAssetPath(playerColor, shipId = "") {
  const assets = playerShipAssetPaths[normalizePlayerPieceColor(playerColor)] ?? playerShipAssetPaths.red;
  return assets[getShipVariantIndex(shipId, assets.length)] ?? assets[0];
}

export function getColonyShipAssetPath(playerColor, shipId = "") {
  const assets = colonyShipAssetPaths[normalizePlayerPieceColor(playerColor)] ?? colonyShipAssetPaths.red;
  return assets[getShipVariantIndex(shipId, assets.length)] ?? assets[0];
}

export function getTradeShipAssetPath(playerColor, shipId = "") {
  const assets = tradeShipAssetPaths[normalizePlayerPieceColor(playerColor)] ?? tradeShipAssetPaths.red;
  return assets[getShipVariantIndex(shipId, assets.length)] ?? assets[0];
}

export function getPlayerColonyAssetPath(playerColor) {
  return playerColonyAssetPaths[normalizePlayerPieceColor(playerColor)] ?? playerColonyAssetPaths.red;
}

export function getPlayerSpaceportAssetPath(playerColor) {
  return playerSpaceportAssetPaths[normalizePlayerPieceColor(playerColor)] ?? playerSpaceportAssetPaths.red;
}

export function normalizePlayerPieceColor(playerColor) {
  return playerPieceColors.includes(playerColor)
    ? playerColor
    : colorAliases[playerColor] ?? "red";
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
