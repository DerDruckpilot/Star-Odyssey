export const gameVariants = {
  classic: "classic",
  supernova: "supernova"
};

export const supernovaMissionCounts = {
  standard: 3,
  professional: 2
};

export const supernovaFactoryLimitPerPlayer = 5;

export const supernovaMissionCards = [
  { id: "mission-freighter", title: "Frachter", titleEn: "Freighter", category: "blue", conditionKey: "allCargo", originalText: "Baue alle 5 Frachtringe am Mutterschiff aus.", originalTextEn: "Install all 5 cargo rings on your mothership." },
  { id: "mission-food-factory", title: "Nahrungsfabrikant", titleEn: "Food Manufacturer", category: "violet", conditionKey: "factoryCard:food", originalText: "Besitze die Siegpunktkarte „Landwirt“. Du erhältst sie, wenn du allein die meisten Nahrungsfabriken besitzt. Bei Gleichstand erhält niemand die Karte.", originalTextEn: "Own the Farmer victory point card. You receive it when you alone own the most food factories. Nobody receives the card in a tie." },
  { id: "mission-goods-factory", title: "Handelswaren-Fabrikant", titleEn: "Trade Goods Manufacturer", category: "violet", conditionKey: "factoryCard:goods", originalText: "Besitze die Siegpunktkarte „Handelsmeister“. Du erhältst sie, wenn du allein die meisten Handelsstationen besitzt. Bei Gleichstand erhält niemand die Karte.", originalTextEn: "Own the Trade Master victory point card. You receive it when you alone own the most trade stations. Nobody receives the card in a tie." },
  { id: "mission-goods-trader", title: "Händler", titleEn: "Trader", category: "yellow", conditionKey: "coloniesOnResource:goods:3", originalText: "Gründe mindestens 3 eigene Kolonien an Handelswarenplaneten außerhalb der Systeme Alpha bis Delta.", originalTextEn: "Found at least 3 of your own colonies on trade-goods planets outside the Alpha through Delta systems." },
  { id: "mission-carbon-miner", title: "Carbonschürfer", titleEn: "Carbon Miner", category: "yellow", conditionKey: "coloniesOnResource:carbon:3", originalText: "Gründe mindestens 3 eigene Kolonien an Carbonplaneten außerhalb der Systeme Alpha bis Delta.", originalTextEn: "Found at least 3 of your own colonies on carbon planets outside the Alpha through Delta systems." },
  { id: "mission-explorer", title: "Entdecker", titleEn: "Explorer", category: "green", conditionKey: "farSystemsColony", originalText: "Gründe an jedem der entferntesten Planetensysteme mindestens eine eigene Kolonie.", originalTextEn: "Found at least one of your own colonies in each of the most distant planetary systems." },
  { id: "mission-fuel-depot", title: "Treibstoffdepot", titleEn: "Fuel Depot", category: "yellow", conditionKey: "coloniesOnResource:fuel:3", originalText: "Gründe mindestens 3 eigene Kolonien an Treibstoffplaneten außerhalb der Systeme Alpha bis Delta.", originalTextEn: "Found at least 3 of your own colonies on fuel planets outside the Alpha through Delta systems." },
  { id: "mission-star-empire", title: "Sternenreich", titleEn: "Star Empire", category: "green", conditionKey: "fullNonStartSystem", originalText: "Besiedle mindestens ein Drei-Planeten-System außerhalb von Alpha bis Delta vollständig mit eigenen Kolonien.", originalTextEn: "Fully settle at least one three-planet system outside Alpha through Delta with your own colonies." },
  { id: "mission-food-supplier", title: "Nahrungslieferant", titleEn: "Food Supplier", category: "yellow", conditionKey: "coloniesOnResource:food:3", originalText: "Gründe mindestens 3 eigene Kolonien an Nahrungsplaneten außerhalb der Systeme Alpha bis Delta.", originalTextEn: "Found at least 3 of your own colonies on food planets outside the Alpha through Delta systems." },
  { id: "mission-hermit", title: "Einsiedler", titleEn: "Hermit", category: "green", conditionKey: "oneColonyPerNonStartSystem", originalText: "Gründe außerhalb der Systeme Alpha bis Delta in keinem Drei-Planeten-System mehr als eine eigene Kolonie.", originalTextEn: "Outside the Alpha through Delta systems, do not found more than one of your own colonies in any three-planet system." },
  { id: "mission-big-manufacturer", title: "Großfabrikant", titleEn: "Major Manufacturer", category: "red", conditionKey: "factories:3", originalText: "Baue mindestens 3 eigene Fabriken beliebiger Art.", originalTextEn: "Build at least 3 of your own factories of any type." },
  { id: "mission-large-fleet", title: "Große Flotte", titleEn: "Large Fleet", category: "blueWhite", conditionKey: "twoShipsInFlightAtWin", originalText: "Wenn du 15 Siegpunkte erreichst, müssen sich mindestens 2 eigene Kolonie- oder Handelsschiffe im Flug befinden.", originalTextEn: "When you reach 15 victory points, at least 2 of your colony or trade ships must still be in flight." },
  { id: "mission-mining", title: "Bergbau", titleEn: "Mining", category: "yellow", conditionKey: "coloniesOnResource:ore:3", originalText: "Gründe mindestens 3 eigene Kolonien an Erzplaneten außerhalb der Systeme Alpha bis Delta.", originalTextEn: "Found at least 3 of your own colonies on ore planets outside the Alpha through Delta systems." },
  { id: "mission-prestige-fleet", title: "Prestigeflotte", titleEn: "Prestige Fleet", category: "red", conditionKey: "battleShips:3", originalText: "Baue alle 3 Schlachtschiffe und behalte sie im Spiel. In Raumschlachten verlorene Schlachtschiffe zählen nicht.", originalTextEn: "Build all 3 battleships and keep them in play. Battleships lost in space battles do not count." },
  { id: "mission-conqueror", title: "Eroberer", titleEn: "Conqueror", category: "redWhite", conditionKey: "conquestVp:2", originalText: "Gewinne mindestens 2 Siegpunkte durch Planeteneroberungen, etwa durch Piraten-, Eis- oder Diplomatieeffekte.", originalTextEn: "Gain at least 2 victory points through planetary conquest, such as pirate, ice, or diplomacy effects." },
  { id: "mission-trade-almost-everyone", title: "Handel mit (fast) jedem", titleEn: "Trade with (Almost) Everyone", category: "green", conditionKey: "tradeStationsAtPeople:3", originalText: "Gründe Handelsstationen bei mindestens 3 verschiedenen Völkern.", originalTextEn: "Establish trade stations with at least 3 different peoples." },
  { id: "mission-trade-production", title: "Handel und Produktion", titleEn: "Trade and Production", category: "green", conditionKey: "tradeStationsAndAdjacentColony", originalText: "Baue bei 2 verschiedenen Völkern je eine Handelsstation und gründe in jedem angrenzenden Planetensystem mindestens eine eigene Kolonie.", originalTextEn: "Build a trade station with each of 2 different peoples and found at least one of your own colonies in each adjacent planetary system." },
  { id: "mission-gunner", title: "Kanonier", titleEn: "Gunner", category: "blueWhite", conditionKey: "allCannons", originalText: "Baue alle 6 Bordkanonen am Mutterschiff aus.", originalTextEn: "Install all 6 cannons on your mothership." },
  { id: "mission-fuel-factory", title: "Treibstofffabrikant", titleEn: "Fuel Manufacturer", category: "violet", conditionKey: "factoryCard:fuel", originalText: "Besitze die Siegpunktkarte „Raffination“. Du erhältst sie, wenn du allein die meisten Raffinerien besitzt. Bei Gleichstand erhält niemand die Karte.", originalTextEn: "Own the Refining victory point card. You receive it when you alone own the most refineries. Nobody receives the card in a tie." },
  { id: "mission-ore-factory", title: "Erzfabrikant", titleEn: "Ore Manufacturer", category: "violet", conditionKey: "factoryCard:ore", originalText: "Besitze die Siegpunktkarte „Minenbesitzer“. Du erhältst sie, wenn du allein die meisten Minen besitzt. Bei Gleichstand erhält niemand die Karte.", originalTextEn: "Own the Mine Owner victory point card. You receive it when you alone own the most mines. Nobody receives the card in a tie." },
  { id: "mission-engine", title: "Triebwerk", titleEn: "Engine", category: "blue", conditionKey: "allDrives", originalText: "Baue alle 6 Antriebe am Mutterschiff aus.", originalTextEn: "Install all 6 drives on your mothership." },
  { id: "mission-fame-honor", title: "Ruhm und Ehre", titleEn: "Fame and Honor", category: "blueWhite", conditionKey: "halfMedals:7", originalText: "Erhalte mindestens 7 halbe Medaillen. Halbe Medaillen aus Kämpfen zählen mit.", originalTextEn: "Earn at least 7 half medals. Half medals gained from battles count." },
  { id: "mission-bases", title: "Stützpunkte", titleEn: "Bases", category: "red", conditionKey: "spaceports:3", originalText: "Baue alle 3 eigenen Raumhäfen.", originalTextEn: "Build all 3 of your spaceports." },
  { id: "mission-carbon-factory", title: "Carbonfabrikant", titleEn: "Carbon Manufacturer", category: "violet", conditionKey: "factoryCard:carbon", originalText: "Besitze die Siegpunktkarte „Carbonschürfer“. Du erhältst sie, wenn du allein die meisten Carbonreinigungen besitzt. Bei Gleichstand erhält niemand die Karte.", originalTextEn: "Own the Carbon Miner victory point card. You receive it when you alone own the most carbon scrubbers. Nobody receives the card in a tie." },
  { id: "mission-trade-fleet", title: "Handelsflotte", titleEn: "Trade Fleet", category: "green", conditionKey: "tradeShipsAtPeople:3", originalText: "Besetze bei einem Volk mindestens 3 Handelspunkte mit eigenen Handelsschiffen.", originalTextEn: "Occupy at least 3 trade points of one people with your own trade ships." }
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
