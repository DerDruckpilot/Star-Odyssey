export const outpostAssetPaths = {
  greenPeople: "./assets/generated/outposts/outpost-green-people.png",
  diplomats: "./assets/generated/outposts/outpost-diplomats.png",
  traders: "./assets/generated/outposts/outpost-traders.png",
  wisePeople: "./assets/generated/outposts/outpost-wise-people.png"
};

export const tradeStationAssetPaths = {
  red: "./assets/generated/trade-stations/trade-station-red.png",
  blue: "./assets/generated/trade-stations/trade-station-blue.png",
  yellow: "./assets/generated/trade-stations/trade-station-yellow.png",
  white: "./assets/generated/trade-stations/trade-station-green.png",
  green: "./assets/generated/trade-stations/trade-station-green.png"
};

export const outpostVisualDefaults = {
  outpost: {
    width: 124,
    height: 124,
    hitRadius: 54
  },
  tradeStation: {
    width: 42,
    height: 42,
    hitRadius: 20
  }
};

export function getOutpostAssetPath(outpostType) {
  return outpostAssetPaths[outpostType] ?? outpostAssetPaths.traders;
}

export function getTradeStationAssetPath(playerColor) {
  return tradeStationAssetPaths[playerColor] ?? tradeStationAssetPaths.red;
}
