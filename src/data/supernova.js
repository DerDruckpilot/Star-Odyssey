export const gameVariants = {
  classic: "classic",
  supernova: "supernova"
};

export const supernovaFactoryLimitPerPlayer = 5;

export const supernovaMissionCards = [
  { id: "mission-freighter", title: "Frachter", titleEn: "Freighter", category: "blue", conditionKey: "allCargo", originalText: "Es müssen alle 5 Frachtringe am Mutterschiff ausgebaut werden.", originalTextEn: "All 5 cargo rings must be installed on the mothership." },
  { id: "mission-food-factory", title: "Nahrungs Fabrikant", titleEn: "Food Manufacturer", category: "violet", conditionKey: "factoryCard:food", originalText: "Es muss die Siegpunktkarte \"Landwirt\" in Besitz sein.", originalTextEn: "You must own the Farmer victory point card." },
  { id: "mission-goods-factory", title: "Handels Waren Fabrikant", titleEn: "Trade Goods Manufacturer", category: "violet", conditionKey: "factoryCard:goods", originalText: "Es muss die Siegpunktkarte \"Handelsmeister\" in Besitz sein.", originalTextEn: "You must own the Trade Master victory point card." },
  { id: "mission-goods-trader", title: "Händler", titleEn: "Trader", category: "yellow", conditionKey: "coloniesOnResource:goods:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Handelsware-Planeten gegründet werden (ohne Alpha bis Delta).", originalTextEn: "Found at least 3 of your own colonies on trade-goods planets (excluding Alpha through Delta)." },
  { id: "mission-carbon-miner", title: "Carbon Schürfer", titleEn: "Carbon Miner", category: "yellow", conditionKey: "coloniesOnResource:carbon:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Carbon-Planeten gegründet werden (ohne Alpha bis Delta).", originalTextEn: "Found at least 3 of your own colonies on carbon planets (excluding Alpha through Delta)." },
  { id: "mission-explorer", title: "Entdecker", titleEn: "Explorer", category: "green", conditionKey: "farSystemsColony", originalText: "Es muss mindestens je eine Kolonie an den entferntesten Systemen gegründet werden.", originalTextEn: "Found at least one colony at each of the most distant systems." },
  { id: "mission-fuel-depot", title: "Treibstoff Depot", titleEn: "Fuel Depot", category: "yellow", conditionKey: "coloniesOnResource:fuel:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Treibstoff-Planeten gegründet werden (ohne Alpha bis Delta).", originalTextEn: "Found at least 3 of your own colonies on fuel planets (excluding Alpha through Delta)." },
  { id: "mission-star-empire", title: "Sternen Reich", titleEn: "Star Empire", category: "green", conditionKey: "fullNonStartSystem", originalText: "Es muss mindestens ein Drei-Planeten-System (ohne Alpha bis Delta) mit eigenen Kolonien komplett besiedelt werden.", originalTextEn: "Fully settle at least one three-planet system with your own colonies (excluding Alpha through Delta)." },
  { id: "mission-food-supplier", title: "Nahrungs Lieferant", titleEn: "Food Supplier", category: "yellow", conditionKey: "coloniesOnResource:food:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Nahrungs-Planeten gegründet werden (ohne Alpha bis Delta).", originalTextEn: "Found at least 3 of your own colonies on food planets (excluding Alpha through Delta)." },
  { id: "mission-hermit", title: "Einsiedler", titleEn: "Hermit", category: "green", conditionKey: "oneColonyPerNonStartSystem", originalText: "Außer in den Alpha bis Delta Systemen darf in keinem Drei-Planeten-System mehr als eine eigene Kolonie gegründet werden.", originalTextEn: "Outside the Alpha through Delta systems, no three-planet system may contain more than one of your colonies." },
  { id: "mission-big-manufacturer", title: "Groß Fabrikant", titleEn: "Major Manufacturer", category: "red", conditionKey: "factories:3", originalText: "Es müssen mindestens 3 Fabriken gebaut werden.", originalTextEn: "Build at least 3 factories." },
  { id: "mission-large-fleet", title: "Große Flotte", titleEn: "Large Fleet", category: "blueWhite", conditionKey: "twoShipsInFlightAtWin", originalText: "Bei Erreichen der 15 Siegpunkte müssen sich noch 2 Schiffe (Kolonie- oder Handelsschiff) im Flug befinden.", originalTextEn: "When you reach 15 victory points, 2 ships (colony or trade ships) must still be in flight." },
  { id: "mission-mining", title: "Bergbau", titleEn: "Mining", category: "yellow", conditionKey: "coloniesOnResource:ore:3", originalText: "Es müssen mindestens 3 eigene Kolonien an Erz-Planeten gegründet werden (ohne Alpha bis Delta).", originalTextEn: "Found at least 3 of your own colonies on ore planets (excluding Alpha through Delta)." },
  { id: "mission-prestige-fleet", title: "Prestige Flotte", titleEn: "Prestige Fleet", category: "red", conditionKey: "battleShips:3", originalText: "Es müssen alle drei Schlachtschiffe gebaut und auch erhalten werden (Vorsicht bei Raumschlachten).", originalTextEn: "Build and retain all three battleships (beware of space battles)." },
  { id: "mission-conqueror", title: "Eroberer", titleEn: "Conqueror", category: "redWhite", conditionKey: "conquestVp:2", originalText: "Es müssen mindestens 2 Siegpunkte durch Planeteneroberung gewonnen werden (Piraten-, Eis-Diplomatie).", originalTextEn: "Gain at least 2 victory points through planetary conquest (pirate or ice diplomacy)." },
  { id: "mission-trade-almost-everyone", title: "Handel mit (fast) jedem", titleEn: "Trade with (Almost) Everyone", category: "green", conditionKey: "tradeStationsAtPeople:3", originalText: "Es müssen bei mindestens 3 verschiedenen Völkern Handelsstationen gegründet werden.", originalTextEn: "Establish trade stations with at least 3 different peoples." },
  { id: "mission-trade-production", title: "Handel und Produktion", titleEn: "Trade and Production", category: "green", conditionKey: "tradeStationsAndAdjacentColony", originalText: "Es muss mindestens je eine Handelsstation bei zwei verschiedenen Völkern gebaut und an dem jeweils angrenzenden Planetensystem je eine Kolonie gegründet werden.", originalTextEn: "Build a trade station with each of two different peoples and found a colony in each adjacent planetary system." },
  { id: "mission-gunner", title: "Kanonier", titleEn: "Gunner", category: "blueWhite", conditionKey: "allCannons", originalText: "Es müssen alle 6 Bordkanonen am Mutterschiff ausgebaut werden.", originalTextEn: "Install all 6 cannons on the mothership." },
  { id: "mission-fuel-factory", title: "Treibstoff Fabrikant", titleEn: "Fuel Manufacturer", category: "violet", conditionKey: "factoryCard:fuel", originalText: "Es muss die Siegpunktkarte \"Raffination\" in Besitz sein.", originalTextEn: "You must own the Refining victory point card." },
  { id: "mission-ore-factory", title: "Erz Fabrikant", titleEn: "Ore Manufacturer", category: "violet", conditionKey: "factoryCard:ore", originalText: "Es muss die Siegpunktkarte \"Minenbesitzer\" in Besitz sein.", originalTextEn: "You must own the Mine Owner victory point card." },
  { id: "mission-engine", title: "Triebwerk", titleEn: "Engine", category: "blue", conditionKey: "allDrives", originalText: "Es müssen alle 6 Antriebe am Mutterschiff ausgebaut werden.", originalTextEn: "Install all 6 drives on the mothership." },
  { id: "mission-fame-honor", title: "Ruhm und Ehre", titleEn: "Fame and Honor", category: "blueWhite", conditionKey: "halfMedals:7", originalText: "Es müssen mindestens 7 halbe Medaillen erreicht werden (Kampf um halbe Medaillen ist erlaubt).", originalTextEn: "Earn at least 7 half medals (fighting for half medals is allowed)." },
  { id: "mission-bases", title: "Stütz Punkte", titleEn: "Bases", category: "red", conditionKey: "spaceports:3", originalText: "Es müssen alle 3 Raumhäfen gebaut werden.", originalTextEn: "Build all 3 spaceports." },
  { id: "mission-carbon-factory", title: "Carbon Fabrikant", titleEn: "Carbon Manufacturer", category: "violet", conditionKey: "factoryCard:carbon", originalText: "Es muss die Siegpunktkarte \"Carbonschürfer\" in Besitz sein.", originalTextEn: "You must own the Carbon Miner victory point card." },
  { id: "mission-trade-fleet", title: "Handels Flotte", titleEn: "Trade Fleet", category: "green", conditionKey: "tradeShipsAtPeople:3", originalText: "Es müssen bei einem Volk mindestens 3 Handelspunkte mit eigenen Handelsschiffen besiedelt werden.", originalTextEn: "Occupy at least 3 trade points at one people with your own trade ships." }
];

export const supernovaFactoryTypes = [
  { id: "ore", title: "Mine", titleEn: "Mine", resource: "ore", victoryCardId: "factory-majority-ore", cost: { ore: 3, carbon: 1 } },
  { id: "fuel", title: "Raffinerie", titleEn: "Refinery", resource: "fuel", victoryCardId: "factory-majority-fuel", cost: { ore: 1, carbon: 1, fuel: 2 } },
  { id: "food", title: "Nahrungsfabrik", titleEn: "Food Factory", resource: "food", victoryCardId: "factory-majority-food", cost: { ore: 1, carbon: 1, food: 2 } },
  { id: "carbon", title: "Carbonreinigung", titleEn: "Carbon Scrubber", resource: "carbon", victoryCardId: "factory-majority-carbon", cost: { ore: 1, carbon: 3 } },
  { id: "goods", title: "Handelsstation", titleEn: "Trade Station", resource: "goods", victoryCardId: "factory-majority-goods", cost: { ore: 1, carbon: 1, fuel: 1, goods: 2 } }
];

export const supernovaFactoryVictoryCards = [
  { id: "factory-majority-food", title: "Landwirt", titleEn: "Farmer", type: "food", victoryPoints: 1, originalText: "Die meisten Nahrungsfabriken.", originalTextEn: "The most food factories." },
  { id: "factory-majority-carbon", title: "Carbonschürfer", titleEn: "Carbon Miner", type: "carbon", victoryPoints: 1, originalText: "Die meisten Carbonfabriken.", originalTextEn: "The most carbon factories." },
  { id: "factory-majority-ore", title: "Minenbesitzer", titleEn: "Mine Owner", type: "ore", victoryPoints: 1, originalText: "Die meisten Erzminen.", originalTextEn: "The most ore mines." },
  { id: "factory-majority-goods", title: "Handelsmeister", titleEn: "Trade Master", type: "goods", victoryPoints: 1, originalText: "Die meisten Handelswarenfabriken.", originalTextEn: "The most trade-goods factories." },
  { id: "factory-majority-fuel", title: "Raffination", titleEn: "Refining", type: "fuel", victoryPoints: 1, originalText: "Die meisten Treibstoffraffinerien.", originalTextEn: "The most fuel refineries." }
];

export function getSupernovaLocalizedTitle(entry, language = "de") {
  if (!entry) return "";
  return language === "en" ? entry.titleEn ?? entry.title : entry.title;
}

export function getSupernovaLocalizedText(entry, language = "de") {
  if (!entry) return "";
  return language === "en" ? entry.originalTextEn ?? entry.originalText : entry.originalText;
}

export function getSupernovaFactoryType(factoryTypeId) {
  return supernovaFactoryTypes.find((factoryType) => factoryType.id === factoryTypeId) ?? null;
}

export function getSupernovaFactoryVictoryCard(cardId) {
  return supernovaFactoryVictoryCards.find((card) => card.id === cardId) ?? null;
}
