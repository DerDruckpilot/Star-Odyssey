export const resourceTypes = ["ore", "fuel", "carbon", "food", "goods"];

export const upgradeDefinitions = [
  {
    id: "drive",
    cost: { fuel: 2 },
    limit: 6
  },
  {
    id: "cargo",
    cost: { ore: 2 },
    limit: 5
  },
  {
    id: "cannon",
    cost: { carbon: 2 },
    limit: 6
  }
];

export const bankTradeRates = {
  default: 3,
  goods: 2
};
