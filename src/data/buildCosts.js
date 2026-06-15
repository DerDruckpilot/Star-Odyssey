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

export const buildActionDefinitions = [
  {
    id: "colonyShip",
    cost: { ore: 1, fuel: 1, carbon: 1, food: 1 }
  },
  {
    id: "tradeShip",
    cost: { ore: 1, fuel: 1, goods: 2 }
  },
  {
    id: "spaceport",
    cost: { carbon: 3, food: 2 }
  }
];
