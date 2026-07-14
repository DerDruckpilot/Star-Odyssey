export const gameVariants = {
  classic: "classic",
  supernova: "supernova"
};

export const supernovaFactoryLimitPerPlayer = 5;

export const supernovaMissionCards = [
  { id: "mission-freighter", title: "Frachter", category: "blue", conditionKey: "allCargo", originalText: "Du hast alle 5 Frachtringe an dein Mutterschiff gebaut." },
  { id: "mission-food-factory", title: "Nahrungs Fabrikant", category: "violet", conditionKey: "factoryCard:food", originalText: "Du besitzt die Siegpunktkarte Landwirt." },
  { id: "mission-goods-factory", title: "Handels Waren Fabrikant", category: "violet", conditionKey: "factoryCard:goods", originalText: "Du besitzt die Siegpunktkarte Handelsmeister." },
  { id: "mission-goods-trader", title: "Händler", category: "yellow", conditionKey: "coloniesOnResource:goods:3", originalText: "Du hast mindestens 3 Kolonien auf Handelswaren-Planeten außerhalb der Anfangsgalaxien Alpha bis Delta." },
  { id: "mission-carbon-miner", title: "Carbon Schürfer", category: "yellow", conditionKey: "coloniesOnResource:carbon:3", originalText: "Du hast mindestens 3 Kolonien auf Carbon-Planeten außerhalb der Anfangsgalaxien Alpha bis Delta." },
  { id: "mission-explorer", title: "Entdecker", category: "green", conditionKey: "farSystemsColony", originalText: "Du hast mindestens eine Kolonie bei den entferntesten Planetensystemen gegründet." },
  { id: "mission-fuel-depot", title: "Treibstoff Depot", category: "yellow", conditionKey: "coloniesOnResource:fuel:3", originalText: "Du hast mindestens 3 Kolonien auf Treibstoff-Planeten außerhalb der Anfangsgalaxien Alpha bis Delta." },
  { id: "mission-star-empire", title: "Sternen Reich", category: "green", conditionKey: "fullNonStartSystem", originalText: "Du hast ein nicht zur Anfangsgalaxie gehörendes System mit drei Planeten vollständig mit eigenen Kolonien besetzt." },
  { id: "mission-food-supplier", title: "Nahrungs Lieferant", category: "yellow", conditionKey: "coloniesOnResource:food:3", originalText: "Du hast mindestens 3 Kolonien auf Nahrungs-Planeten außerhalb der Anfangsgalaxien Alpha bis Delta." },
  { id: "mission-hermit", title: "Einsiedler", category: "green", conditionKey: "oneColonyPerNonStartSystem", originalText: "Außerhalb der Anfangsgalaxien Alpha bis Delta hast du in keinem Dreier-System mehr als eine eigene Kolonie." },
  { id: "mission-big-manufacturer", title: "Groß Fabrikant", category: "red", conditionKey: "factories:3", originalText: "Du besitzt mindestens 3 Fabriken." },
  { id: "mission-large-fleet", title: "Große Flotte", category: "blueWhite", conditionKey: "twoShipsInFlightAtWin", originalText: "Wenn du 15 Siegpunkte erreichst, hast du noch 2 Schiffe im All." },
  { id: "mission-mining", title: "Bergbau", category: "yellow", conditionKey: "coloniesOnResource:ore:3", originalText: "Du hast mindestens 3 Kolonien auf Erz-Planeten außerhalb der Anfangsgalaxien Alpha bis Delta." },
  { id: "mission-prestige-fleet", title: "Prestige Flotte", category: "red", conditionKey: "battleShips:3", originalText: "Du hast alle 3 Schlachtschiffe gebaut und sie sind noch im Spiel." },
  { id: "mission-conqueror", title: "Eroberer", category: "redWhite", conditionKey: "conquestVp:2", originalText: "Du hast mindestens 2 Siegpunkte durch Planeteneroberungen erhalten." },
  { id: "mission-trade-almost-everyone", title: "Handel mit (fast) jedem", category: "green", conditionKey: "tradeStationsAtPeople:3", originalText: "Du hast Handelsstationen bei mindestens 3 verschiedenen Völkern errichtet." },
  { id: "mission-trade-production", title: "Handel und Produktion", category: "green", conditionKey: "tradeStationsAndAdjacentColony", originalText: "Du hast bei 2 Völkern eine Handelsstation und im angrenzenden System eine Kolonie." },
  { id: "mission-gunner", title: "Kanonier", category: "blueWhite", conditionKey: "allCannons", originalText: "Du hast alle 6 Bordkanonen an dein Mutterschiff gebaut." },
  { id: "mission-fuel-factory", title: "Treibstoff Fabrikant", category: "violet", conditionKey: "factoryCard:fuel", originalText: "Du besitzt die Siegpunktkarte Raffination." },
  { id: "mission-ore-factory", title: "Erz Fabrikant", category: "violet", conditionKey: "factoryCard:ore", originalText: "Du besitzt die Siegpunktkarte Minenbesitzer." },
  { id: "mission-engine", title: "Triebwerk", category: "blue", conditionKey: "allDrives", originalText: "Du hast alle 6 Antriebe an dein Mutterschiff gebaut." },
  { id: "mission-fame-honor", title: "Ruhm und Ehre", category: "blueWhite", conditionKey: "halfMedals:7", originalText: "Du besitzt mindestens 7 halbe Medaillen." },
  { id: "mission-bases", title: "Stütz Punkte", category: "red", conditionKey: "spaceports:3", originalText: "Du hast alle 3 Raumhäfen gebaut." },
  { id: "mission-carbon-factory", title: "Carbon Fabrikant", category: "violet", conditionKey: "factoryCard:carbon", originalText: "Du besitzt die Siegpunktkarte Carbonschürfer." },
  { id: "mission-trade-fleet", title: "Handels Flotte", category: "green", conditionKey: "tradeShipsAtPeople:3", originalText: "Du hast bei einem Volk mindestens 3 Handelsplätze mit eigenen Handelsschiffen besetzt." }
];

export const supernovaFactoryTypes = [
  { id: "ore", title: "Mine", resource: "ore", victoryCardId: "factory-majority-ore", cost: { ore: 3, carbon: 1 } },
  { id: "fuel", title: "Raffinerie", resource: "fuel", victoryCardId: "factory-majority-fuel", cost: { ore: 1, carbon: 1, fuel: 2 } },
  { id: "food", title: "Nahrungsfabrik", resource: "food", victoryCardId: "factory-majority-food", cost: { ore: 1, carbon: 1, food: 2 } },
  { id: "carbon", title: "Carbonreinigung", resource: "carbon", victoryCardId: "factory-majority-carbon", cost: { ore: 1, carbon: 3 } },
  { id: "goods", title: "Handelsstation", resource: "goods", victoryCardId: "factory-majority-goods", cost: { ore: 1, carbon: 1, fuel: 1, goods: 2 } }
];

export const supernovaFactoryVictoryCards = [
  { id: "factory-majority-food", title: "Landwirt", type: "food", victoryPoints: 1, originalText: "Die meisten Nahrungsfabriken." },
  { id: "factory-majority-carbon", title: "Carbonschürfer", type: "carbon", victoryPoints: 1, originalText: "Die meisten Carbonfabriken." },
  { id: "factory-majority-ore", title: "Minenbesitzer", type: "ore", victoryPoints: 1, originalText: "Die meisten Erzminen." },
  { id: "factory-majority-goods", title: "Handelsmeister", type: "goods", victoryPoints: 1, originalText: "Die meisten Handelswarenfabriken." },
  { id: "factory-majority-fuel", title: "Raffination", type: "fuel", victoryPoints: 1, originalText: "Die meisten Treibstoffraffinerien." }
];

export function getSupernovaFactoryType(factoryTypeId) {
  return supernovaFactoryTypes.find((factoryType) => factoryType.id === factoryTypeId) ?? null;
}

export function getSupernovaFactoryVictoryCard(cardId) {
  return supernovaFactoryVictoryCards.find((card) => card.id === cardId) ?? null;
}
