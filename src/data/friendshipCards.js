const friendshipCards = [
  createFriendshipCard({
    id: "diplomats-tribute-discount",
    peopleId: "diplomats",
    titleKey: "tributeDiscount",
    summaryKey: "tributeDiscountSummary",
    summaryDe: "Bei einer 7 musst du erst ab mehr als 12 Rohstoffen die Hälfte abgeben.",
    summaryEn: "When a 7 is rolled, you only discard half your resources above 12 cards.",
    effectType: "sevenDiscardThreshold",
    effectValue: { threshold: 12 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "diplomats-bought-fame-1",
    peopleId: "diplomats",
    titleKey: "boughtFame",
    summaryKey: "boughtFameSummary",
    summaryDe: "In der Handels- und Bauphase kannst du einmal pro Zug 1 Handelsware für 1 halbe Medaille ausgeben.",
    summaryEn: "During trade/build you may spend 1 goods for 1 half medal once per turn.",
    effectType: "buyHalfMedal",
    effectValue: { cost: { goods: 1 }, halfMedals: 1, oncePerTurn: true },
    timing: "action",
    implemented: true
  }),
  createFriendshipCard({
    id: "diplomats-bought-fame-2",
    peopleId: "diplomats",
    titleKey: "boughtFame",
    summaryKey: "boughtFameSummary",
    summaryDe: "In der Handels- und Bauphase kannst du einmal pro Zug 1 Handelsware für 1 halbe Medaille ausgeben.",
    summaryEn: "During trade/build you may spend 1 goods for 1 half medal once per turn.",
    effectType: "buyHalfMedal",
    effectValue: { cost: { goods: 1 }, halfMedals: 1, oncePerTurn: true },
    timing: "action",
    implemented: true,
    notes: "Eine zweite Kopie bringt keinen zusätzlichen Vorteil."
  }),
  createFriendshipCard({
    id: "diplomats-rich-helps-poor",
    peopleId: "diplomats",
    titleKey: "richHelpsPoor",
    summaryKey: "richHelpsPoorSummary",
    summaryDe: "Einmal pro Zug kannst du von bis zu zwei punktestärkeren Mitspielern je 1 zufällige Rohstoffkarte ziehen.",
    summaryEn: "Once per turn, draw 1 random resource from up to two players with more victory points.",
    effectType: "drawFromLeaders",
    effectValue: { maxTargets: 2 },
    timing: "action",
    implemented: true
  }),
  createFriendshipCard({
    id: "diplomats-galactic-aid",
    peopleId: "diplomats",
    titleKey: "galacticAid",
    summaryKey: "galacticAidSummary",
    summaryDe: "Wenn dir ein Ertragswurf keine Rohstoffe bringt und keine 7 ist, darfst du 1 beliebigen Rohstoff nehmen.",
    summaryEn: "If a production roll gives you no resources and is not a 7, take 1 resource of your choice.",
    effectType: "galacticAid",
    effectValue: { amount: 1 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "green-ore-bonus",
    peopleId: "greenPeople",
    titleKey: "productionBonus",
    summaryKey: "greenOreBonusSummary",
    summaryDe: "Wenn du durch einen Ertragswurf Erz erhältst, bekommst du 1 Erz zusätzlich.",
    summaryEn: "If a production roll gives you ore, gain 1 extra ore.",
    effectType: "productionBonus",
    effectValue: { resource: "ore", amount: 1 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "green-fuel-bonus",
    peopleId: "greenPeople",
    titleKey: "productionBonus",
    summaryKey: "greenFuelBonusSummary",
    summaryDe: "Wenn du durch einen Ertragswurf Treibstoff erhältst, bekommst du 1 Treibstoff zusätzlich.",
    summaryEn: "If a production roll gives you fuel, gain 1 extra fuel.",
    effectType: "productionBonus",
    effectValue: { resource: "fuel", amount: 1 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "green-carbon-bonus",
    peopleId: "greenPeople",
    titleKey: "productionBonus",
    summaryKey: "greenCarbonBonusSummary",
    summaryDe: "Wenn du durch einen Ertragswurf Carbon erhältst, bekommst du 1 Carbon zusätzlich.",
    summaryEn: "If a production roll gives you carbon, gain 1 extra carbon.",
    effectType: "productionBonus",
    effectValue: { resource: "carbon", amount: 1 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "green-food-bonus",
    peopleId: "greenPeople",
    titleKey: "productionBonus",
    summaryKey: "greenFoodBonusSummary",
    summaryDe: "Wenn du durch einen Ertragswurf Nahrung erhältst, bekommst du 1 Nahrung zusätzlich.",
    summaryEn: "If a production roll gives you food, gain 1 extra food.",
    effectType: "productionBonus",
    effectValue: { resource: "food", amount: 1 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "green-goods-bonus",
    peopleId: "greenPeople",
    titleKey: "productionBonus",
    summaryKey: "greenGoodsBonusSummary",
    summaryDe: "Wenn du durch einen Ertragswurf Handelsware erhältst, bekommst du 1 Handelsware zusätzlich.",
    summaryEn: "If a production roll gives you goods, gain 1 extra goods.",
    effectType: "productionBonus",
    effectValue: { resource: "goods", amount: 1 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "traders-ore-2to1",
    peopleId: "traders",
    titleKey: "tradeRate",
    summaryKey: "tradersOreSummary",
    summaryDe: "Erz kann im Vorrat 2:1 getauscht werden.",
    summaryEn: "Ore can be traded with the supply at 2:1.",
    effectType: "tradeRate",
    effectValue: { resource: "ore", rate: 2 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "traders-fuel-2to1",
    peopleId: "traders",
    titleKey: "tradeRate",
    summaryKey: "tradersFuelSummary",
    summaryDe: "Treibstoff kann im Vorrat 2:1 getauscht werden.",
    summaryEn: "Fuel can be traded with the supply at 2:1.",
    effectType: "tradeRate",
    effectValue: { resource: "fuel", rate: 2 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "traders-carbon-2to1",
    peopleId: "traders",
    titleKey: "tradeRate",
    summaryKey: "tradersCarbonSummary",
    summaryDe: "Carbon kann im Vorrat 2:1 getauscht werden.",
    summaryEn: "Carbon can be traded with the supply at 2:1.",
    effectType: "tradeRate",
    effectValue: { resource: "carbon", rate: 2 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "traders-food-2to1",
    peopleId: "traders",
    titleKey: "tradeRate",
    summaryKey: "tradersFoodSummary",
    summaryDe: "Nahrung kann im Vorrat 2:1 getauscht werden.",
    summaryEn: "Food can be traded with the supply at 2:1.",
    effectType: "tradeRate",
    effectValue: { resource: "food", rate: 2 },
    timing: "passive",
    implemented: true
  }),
  createFriendshipCard({
    id: "traders-goods-1to1",
    peopleId: "traders",
    titleKey: "tradeRate",
    summaryKey: "tradersGoodsSummary",
    summaryDe: "Handelsware kann einmal pro Zug 1:1 gegen einen anderen Rohstoff getauscht werden.",
    summaryEn: "Goods can be traded once per turn at 1:1 for another resource.",
    effectType: "tradeRate",
    effectValue: { resource: "goods", rate: 1, oncePerTurn: true },
    timing: "action",
    implemented: true
  }),
  createFriendshipCard({
    id: "wise-speed-combat-1",
    peopleId: "wisePeople",
    titleKey: "upgradeBoost",
    summaryKey: "wiseSpeedCombatSummary",
    summaryDe: "Gibt +1 Antrieb und +1 Bordkanone als Kartenbonus, nicht als echte Anbauten.",
    summaryEn: "Grants +1 drive and +1 cannon as card bonuses, not real upgrades.",
    effectType: "upgradeBoost",
    effectValue: { drive: 1, cannon: 1 },
    timing: "passive",
    implemented: true,
    notes: "UpgradeBoost bonuses are effective values only; they do not count against build limits and are not removed by real-upgrade loss effects."
  }),
  createFriendshipCard({
    id: "wise-speed-combat-2",
    peopleId: "wisePeople",
    titleKey: "upgradeBoost",
    summaryKey: "wiseSpeedCombatSummary",
    summaryDe: "Gibt +1 Antrieb und +1 Bordkanone als Kartenbonus, nicht als echte Anbauten.",
    summaryEn: "Grants +1 drive and +1 cannon as card bonuses, not real upgrades.",
    effectType: "upgradeBoost",
    effectValue: { drive: 1, cannon: 1 },
    timing: "passive",
    implemented: true,
    notes: "UpgradeBoost bonuses are effective values only; they do not count against build limits and are not removed by real-upgrade loss effects."
  }),
  createFriendshipCard({
    id: "wise-speed-combat-3",
    peopleId: "wisePeople",
    titleKey: "upgradeBoost",
    summaryKey: "wiseSpeedCombatSummary",
    summaryDe: "Gibt +1 Antrieb und +1 Bordkanone als Kartenbonus, nicht als echte Anbauten.",
    summaryEn: "Grants +1 drive and +1 cannon as card bonuses, not real upgrades.",
    effectType: "upgradeBoost",
    effectValue: { drive: 1, cannon: 1 },
    timing: "passive",
    implemented: true,
    notes: "UpgradeBoost bonuses are effective values only; they do not count against build limits and are not removed by real-upgrade loss effects."
  }),
  createFriendshipCard({
    id: "wise-cannon-boost",
    peopleId: "wisePeople",
    titleKey: "upgradeBoost",
    summaryKey: "wiseCannonBoostSummary",
    summaryDe: "Gibt +2 Bordkanonen als Kartenbonus, nicht als echte Anbauten.",
    summaryEn: "Grants +2 cannons as a card bonus, not real upgrades.",
    effectType: "upgradeBoost",
    effectValue: { cannon: 2 },
    timing: "passive",
    implemented: true,
    notes: "UpgradeBoost bonuses are effective values only; they do not count against build limits and are not removed by real-upgrade loss effects."
  }),
  createFriendshipCard({
    id: "wise-drive-boost",
    peopleId: "wisePeople",
    titleKey: "upgradeBoost",
    summaryKey: "wiseDriveBoostSummary",
    summaryDe: "Gibt +2 Antriebe als Kartenbonus, nicht als echte Anbauten.",
    summaryEn: "Grants +2 drives as a card bonus, not real upgrades.",
    effectType: "upgradeBoost",
    effectValue: { drive: 2 },
    timing: "passive",
    implemented: true,
    notes: "UpgradeBoost bonuses are effective values only; they do not count against build limits and are not removed by real-upgrade loss effects."
  })
];

export function getAllFriendshipCards() {
  return friendshipCards;
}

export function getFriendshipCardsByOutpostType(outpostType) {
  return friendshipCards.filter((card) => card.outpostType === outpostType);
}

export function getFriendshipCardIdsForOutpostType(outpostType) {
  return getFriendshipCardsByOutpostType(outpostType).map((card) => card.id);
}

export function getFriendshipCardById(cardId) {
  return friendshipCards.find((card) => card.id === cardId) ?? null;
}

export function getFriendshipCardTitle(card, language = "de") {
  if (!card) return "";
  return language === "en" ? card.titleEn : card.titleDe;
}

export function getFriendshipCardSummary(card, language = "de") {
  if (!card) return "";
  return language === "en" ? card.summaryEn : card.summaryDe;
}

function createFriendshipCard({
  id,
  peopleId,
  titleKey,
  summaryKey,
  summaryDe,
  summaryEn,
  effectType,
  effectValue = {},
  timing = "passive",
  implemented = false,
  notes = ""
}) {
  return {
    id,
    peopleId,
    outpostType: peopleId,
    titleKey,
    titleDe: resolveTitle("de", titleKey),
    titleEn: resolveTitle("en", titleKey),
    summaryKey,
    summaryDe,
    summaryEn,
    effectType,
    effectValue,
    timing,
    implemented,
    notes
  };
}

function resolveTitle(language, titleKey) {
  const titles = {
    tributeDiscount: {
      de: "Tribut-Ermäßigung",
      en: "Tribute discount"
    },
    boughtFame: {
      de: "Gekaufter Ruhm",
      en: "Bought fame"
    },
    richHelpsPoor: {
      de: "Reich hilft Arm",
      en: "Rich helps poor"
    },
    galacticAid: {
      de: "Galaktische Hilfe",
      en: "Galactic aid"
    },
    productionBonus: {
      de: "Produktions-Erhöhung",
      en: "Production boost"
    },
    tradeRate: {
      de: "Tauschkurs",
      en: "Trade rate"
    },
    upgradeBoost: {
      de: "Ausbau-Erhöhung",
      en: "Upgrade boost"
    }
  };

  return titles[titleKey]?.[language] ?? titleKey;
}
