export const gameVariants = {
  classic: "classic",
  supernova: "supernova"
};

export const supernovaFactoryLimitPerPlayer = 5;

export const supernovaMissionCards = [
  { id: "mission-freighter", title: "Frachter", category: "blue", conditionKey: "allCargo", originalText: "Es müssen alle 5 Frachtringe am Mutterschiff ausgebaut werden." },
  { id: "mission-food-factory", title: "Nahrungs Fabrikant", category: "violet", conditionKey: "factoryCard:food", originalText: "Es muss die Siegpunktkarte \"Landwirt\" in Besitz sein." },
  { id: "mission-goods-factory", title: "Handels Waren Fabrikant", category: "violet", conditionKey: "factoryCard:goods", originalText: "Es muss die Siegpunktkarte \"Handelsmeister\" in Besitz sein." },
  { id: "mission-goods-trader", title: "Händler", category: "yellow", conditionKey: "coloniesOnResource:goods:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Handelsware-Planeten gegründet werden (ohne Alpha bis Delta)." },
  { id: "mission-carbon-miner", title: "Carbon Schürfer", category: "yellow", conditionKey: "coloniesOnResource:carbon:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Carbon-Planeten gegründet werden (ohne Alpha bis Delta)." },
  { id: "mission-explorer", title: "Entdecker", category: "green", conditionKey: "farSystemsColony", originalText: "Es muss mindestens je eine Kolonie an den entferntesten Systemen gegründet werden." },
  { id: "mission-fuel-depot", title: "Treibstoff Depot", category: "yellow", conditionKey: "coloniesOnResource:fuel:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Treibstoff-Planeten gegründet werden (ohne Alpha bis Delta)." },
  { id: "mission-star-empire", title: "Sternen Reich", category: "green", conditionKey: "fullNonStartSystem", originalText: "Es muss mindestens ein Drei-Planeten-System (ohne Alpha bis Delta) mit eigenen Kolonien komplett besiedelt werden." },
  { id: "mission-food-supplier", title: "Nahrungs Lieferant", category: "yellow", conditionKey: "coloniesOnResource:food:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Nahrungs-Planeten gegründet werden (ohne Alpha bis Delta)." },
  { id: "mission-hermit", title: "Einsiedler", category: "green", conditionKey: "oneColonyPerNonStartSystem", originalText: "Außer in den Alpha bis Delta Systemen darf in keinem Drei-Planeten-System mehr als eine eigene Kolonie gegründet werden." },
  { id: "mission-big-manufacturer", title: "Groß Fabrikant", category: "red", conditionKey: "factories:3", originalText: "Es müssen mindestens 3 Fabriken gebaut werden." },
  { id: "mission-large-fleet", title: "Große Flotte", category: "blueWhite", conditionKey: "twoShipsInFlightAtWin", originalText: "Bei Erreichen der 15 Siegpunkte müssen sich noch 2 Schiffe (Kolonie- oder Handelsschiff) im Flug befinden." },
  { id: "mission-mining", title: "Bergbau", category: "yellow", conditionKey: "coloniesOnResource:ore:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Erz-Planeten gegründet werden (ohne Alpha bis Delta)." },
  { id: "mission-prestige-fleet", title: "Prestige Flotte", category: "red", conditionKey: "battleShips:3", originalText: "Es müssen alle drei Schlachtschiffe gebaut und auch erhalten werden (Vorsicht bei Raumschlachten)." },
  { id: "mission-conqueror", title: "Eroberer", category: "redWhite", conditionKey: "conquestVp:2", originalText: "Es müssen mindestens 2 Siegpunkte durch Planeteneroberung gewonnen werden (Piraten-, Eis-Diplomatie)." },
  { id: "mission-trade-almost-everyone", title: "Handel mit (fast) jedem", category: "green", conditionKey: "tradeStationsAtPeople:3", originalText: "Es müssen bei mindestens 3 verschiedenen Völkern Handelsstationen gegründet werden." },
  { id: "mission-trade-production", title: "Handel und Produktion", category: "green", conditionKey: "tradeStationsAndAdjacentColony", originalText: "Es muss mindestens je eine Handelsstation bei zwei verschiedenen Völkern gebaut und an dem jeweils angrenzenden Planetensystem je eine Kolonie gegründet werden." },
  { id: "mission-gunner", title: "Kanonier", category: "blueWhite", conditionKey: "allCannons", originalText: "Es müssen alle 6 Bordkanonen am Mutterschiff ausgebaut werden." },
  { id: "mission-fuel-factory", title: "Treibstoff Fabrikant", category: "violet", conditionKey: "factoryCard:fuel", originalText: "Es muss die Siegpunktkarte \"Raffination\" in Besitz sein." },
  { id: "mission-ore-factory", title: "Erz Fabrikant", category: "violet", conditionKey: "factoryCard:ore", originalText: "Es muss die Siegpunktkarte \"Minenbesitzer\" in Besitz sein." },
  { id: "mission-engine", title: "Triebwerk", category: "blue", conditionKey: "allDrives", originalText: "Es müssen alle 6 Antriebe am Mutterschiff ausgebaut werden." },
  { id: "mission-fame-honor", title: "Ruhm und Ehre", category: "blueWhite", conditionKey: "halfMedals:7", originalText: "Es müssen mindestens 7 halbe Medaillen erreicht werden (Kampf um halbe Medaillen ist erlaubt)." },
  { id: "mission-bases", title: "Stütz Punkte", category: "red", conditionKey: "spaceports:3", originalText: "Es müssen alle 3 Raumhäfen gebaut werden." },
  { id: "mission-carbon-factory", title: "Carbon Fabrikant", category: "violet", conditionKey: "factoryCard:carbon", originalText: "Es muss die Siegpunktkarte \"Carbonschürfer\" in Besitz sein." },
  { id: "mission-trade-fleet", title: "Handels Flotte", category: "green", conditionKey: "tradeShipsAtPeople:3", originalText: "Es müssen bei einem Volk mindestens 3 Handelspunkte mit eigenen Handelsschiffen besiedelt werden." }
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
