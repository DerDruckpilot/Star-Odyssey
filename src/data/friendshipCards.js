const friendshipCards = [
  createFriendshipCard("diplomats-tribute-discount", "diplomats", "tributeDiscount", "tributeDiscountSummary"),
  createFriendshipCard("diplomats-bought-fame-1", "diplomats", "boughtFame", "boughtFameSummary"),
  createFriendshipCard("diplomats-bought-fame-2", "diplomats", "boughtFame", "boughtFameSummary"),
  createFriendshipCard("diplomats-rich-helps-poor", "diplomats", "richHelpsPoor", "richHelpsPoorSummary"),
  createFriendshipCard("diplomats-galactic-aid", "diplomats", "galacticAid", "galacticAidSummary"),
  createFriendshipCard("green-ore-bonus", "greenPeople", "productionBonus", "greenOreBonusSummary"),
  createFriendshipCard("green-fuel-bonus", "greenPeople", "productionBonus", "greenFuelBonusSummary"),
  createFriendshipCard("green-carbon-bonus", "greenPeople", "productionBonus", "greenCarbonBonusSummary"),
  createFriendshipCard("green-food-bonus", "greenPeople", "productionBonus", "greenFoodBonusSummary"),
  createFriendshipCard("green-goods-bonus", "greenPeople", "productionBonus", "greenGoodsBonusSummary"),
  createFriendshipCard("traders-ore-2to1", "traders", "tradeRate", "tradersOreSummary"),
  createFriendshipCard("traders-fuel-2to1", "traders", "tradeRate", "tradersFuelSummary"),
  createFriendshipCard("traders-carbon-2to1", "traders", "tradeRate", "tradersCarbonSummary"),
  createFriendshipCard("traders-food-2to1", "traders", "tradeRate", "tradersFoodSummary"),
  createFriendshipCard("traders-goods-1to1", "traders", "tradeRate", "tradersGoodsSummary"),
  createFriendshipCard("wise-speed-combat-1", "wisePeople", "upgradeBoost", "wiseSpeedCombatSummary"),
  createFriendshipCard("wise-speed-combat-2", "wisePeople", "upgradeBoost", "wiseSpeedCombatSummary"),
  createFriendshipCard("wise-speed-combat-3", "wisePeople", "upgradeBoost", "wiseSpeedCombatSummary"),
  createFriendshipCard("wise-cannon-boost", "wisePeople", "upgradeBoost", "wiseCannonBoostSummary"),
  createFriendshipCard("wise-drive-boost", "wisePeople", "upgradeBoost", "wiseDriveBoostSummary")
];

export function getFriendshipCardsByOutpostType(outpostType) {
  return friendshipCards.filter((card) => card.outpostType === outpostType);
}

export function getFriendshipCardIdsForOutpostType(outpostType) {
  return getFriendshipCardsByOutpostType(outpostType).map((card) => card.id);
}

export function getFriendshipCardById(cardId) {
  return friendshipCards.find((card) => card.id === cardId) ?? null;
}

function createFriendshipCard(id, outpostType, titleKey, summaryKey) {
  return {
    id,
    outpostType,
    titleKey,
    summaryKey,
    effectType: titleKey,
    implemented: false
  };
}
