import { encounterSpreadsheetTextsByNumber } from "./encounterSpreadsheetTexts.js";

const R = {
  ore: "ore",
  fuel: "fuel",
  carbon: "carbon",
  food: "food",
  goods: "goods"
};

const gainHalf = { type: "gainHalfMedal", amount: 1 };
const loseHalf = { type: "loseHalfMedal", amount: 1 };
const blockShip = { type: "blockFirstShip" };
const grantTradeShip = { type: "grantShip", shipType: "tradeShip" };
const jumpShip = { type: "jumpShip" };
const drawNextEncounter = { type: "drawNextEncounter" };

const encounterCards = [
  createEncounterCard({
    number: 1,
    id: "spreadsheet-01",
    type: "merchant",
    titleDe: "Haendlergeschenk I",
    titleEn: "Merchant Gift I",
    promptDe: "Ein Haendler bietet ein Geschenk an. Waehle, wie viele Rohstoffe du weitergibst.",
    promptEn: "A merchant offers a gift. Choose how many resources you pass on.",
    choices: [
      createChoice("gift-0", "Nichts geben", "Give nothing", [
        { type: "collectGiftsFromOpponents", amount: 1 },
        { type: "loseHalfMedal", amount: 2 }
      ]),
      createChoice("gift-1", "1 Rohstoff geben", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainResource", resource: R.food, amount: 1 },
        loseHalf
      ]),
      createChoice("gift-2", "2 Rohstoffe geben", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        gainHalf
      ]),
      createChoice("gift-3", "3 Rohstoffe geben", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "chooseResourceGain", amount: 2 },
        gainHalf
      ])
    ],
    resultsDe: "Das Haendlergeschenk wurde abgehandelt.",
    resultsEn: "The merchant gift is resolved."
  }),
  createEncounterCard({
    number: 2,
    id: "spreadsheet-02",
    type: "merchant",
    titleDe: "Haendlergeschenk II",
    titleEn: "Merchant Gift II",
    promptDe: "Ein Haendler erwartet ein Geschenk und bietet eine Gegenleistung.",
    promptEn: "A merchant expects a gift and offers something in return.",
    choices: [
      createChoice("gift-0", "Nichts geben", "Give nothing", [loseHalf]),
      createChoice("gift-1", "1 Rohstoff geben", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe geben", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        gainHalf
      ]),
      createChoice("gift-3", "3 Rohstoffe geben", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "chooseUpgradeGain", amount: 1 },
        gainHalf
      ])
    ],
    resultsDe: "Der Handel ist abgeschlossen.",
    resultsEn: "The trade is complete."
  }),
  createEncounterCard({
    number: 3,
    id: "spreadsheet-03",
    type: "merchant",
    titleDe: "Haendlergeschenk III",
    titleEn: "Merchant Gift III",
    promptDe: "Ein Haendler prueft deine Grosszuegigkeit.",
    promptEn: "A merchant tests your generosity.",
    choices: [
      createChoice("gift-0", "Nichts geben", "Give nothing", [loseHalf]),
      createChoice("gift-1", "1 Rohstoff geben", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe geben", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        gainHalf
      ]),
      createChoice("gift-3", "3 Rohstoffe geben", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 }
      ])
    ],
    resultsDe: "Das Geschenk wurde bewertet.",
    resultsEn: "The gift is judged."
  }),
  createEncounterCard({
    number: 4,
    id: "spreadsheet-04",
    type: "merchant",
    titleDe: "Haendlergeschenk IV",
    titleEn: "Merchant Gift IV",
    promptDe: "Ein Haendler bietet verschiedene Gegenleistungen fuer deine Gabe.",
    promptEn: "A merchant offers different rewards for your gift.",
    choices: [
      createChoice("gift-0", "Nichts geben", "Give nothing", [
        { type: "gainResource", resource: R.goods, amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff geben", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 1 },
        gainHalf
      ]),
      createChoice("gift-2", "2 Rohstoffe geben", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 2 },
        gainHalf
      ]),
      createChoice("gift-3", "3 Rohstoffe geben", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "gainSelectedResources" }
      ])
    ],
    resultsDe: "Der Haendler zieht weiter.",
    resultsEn: "The merchant moves on."
  }),
  createEncounterCard({
    number: 5,
    id: "spreadsheet-05",
    type: "merchant",
    titleDe: "Handelsfuerst I",
    titleEn: "Trade Lord I",
    promptDe: "Ein Handelsfuerst erwartet ein Geschenk.",
    promptEn: "A trade lord expects a gift.",
    choices: [
      createChoice("gift-0", "Nichts geben", "Give nothing", [blockShip, loseHalf]),
      createChoice("gift-1", "1 Rohstoff geben", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        loseHalf
      ]),
      createChoice("gift-2", "2 Rohstoffe geben", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        gainHalf
      ]),
      createChoice("gift-3", "3 Rohstoffe geben", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        grantTradeShip
      ])
    ],
    resultsDe: "Der Handelsfuerst reagiert auf dein Geschenk.",
    resultsEn: "The trade lord reacts to your gift."
  }),
  createEncounterCard({
    number: 6,
    id: "spreadsheet-06",
    type: "merchant",
    titleDe: "Handelsfuerst II",
    titleEn: "Trade Lord II",
    promptDe: "Ein Handelsfuerst verhandelt hart.",
    promptEn: "A trade lord bargains hard.",
    choices: [
      createChoice("gift-0", "Nichts geben", "Give nothing", [blockShip, loseHalf]),
      createChoice("gift-1", "1 Rohstoff geben", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        loseHalf
      ]),
      createChoice("gift-2", "2 Rohstoffe geben", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        gainHalf
      ]),
      createChoice("gift-3", "3 Rohstoffe geben", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        grantTradeShip
      ])
    ],
    resultsDe: "Die Verhandlung ist abgeschlossen.",
    resultsEn: "The negotiation is resolved."
  }),
  createEncounterCard({
    number: 7,
    id: "spreadsheet-07",
    type: "pirate",
    titleDe: "Piratenueberfall rechts",
    titleEn: "Pirate Raid Right",
    promptDe: "Nach einem Geschenk greift ein Pirat an. Willst du kaempfen?",
    promptEn: "After a gift, a pirate attacks. Do you want to fight?",
    choices: [
      createGiftPirateChoice("fight-0", 0, 1),
      createGiftPirateChoice("fight-1", 1, 1),
      createGiftPirateChoice("fight-2", 2, 1),
      createGiftPirateChoice("fight-3", 3, 1),
      createGiftPirateDecline("decline-0", 0),
      createGiftPirateDecline("decline-1", 1),
      createGiftPirateDecline("decline-2", 2),
      createGiftPirateDecline("decline-3", 3)
    ],
    resultsDe: "Der Piratenueberfall ist entschieden.",
    resultsEn: "The pirate raid is resolved."
  }),
  createEncounterCard({
    number: 8,
    id: "spreadsheet-08",
    type: "pirate",
    titleDe: "Piratenueberfall links",
    titleEn: "Pirate Raid Left",
    promptDe: "Nach einem Geschenk greift ein Pirat an. Willst du kaempfen?",
    promptEn: "After a gift, a pirate attacks. Do you want to fight?",
    choices: [
      createGiftPirateChoice("fight-0", 0, -1),
      createGiftPirateChoice("fight-1", 1, -1),
      createGiftPirateChoice("fight-2", 2, -1),
      createGiftPirateChoice("fight-3", 3, -1),
      createGiftPirateDecline("decline-0", 0),
      createGiftPirateDecline("decline-1", 1),
      createGiftPirateDecline("decline-2", 2),
      createGiftPirateDecline("decline-3", 3)
    ],
    resultsDe: "Der Piratenueberfall ist entschieden.",
    resultsEn: "The pirate raid is resolved."
  }),
  createEncounterCard({
    number: 9,
    id: "spreadsheet-09",
    type: "pirate",
    titleDe: "Pirat fordert Tribut I",
    titleEn: "Pirate Tribute I",
    promptDe: "Ein Pirat fordert 2 Rohstoffe. Zahlst du oder kaempfst du?",
    promptEn: "A pirate demands 2 resources. Do you pay or fight?",
    choices: [
      createChoice("pay", "2 Rohstoffe zahlen", "Pay 2 resources", [{ type: "chooseResourceLoss", amount: 2 }]),
      createChoice("fight", "Kaempfen", "Fight", [
        {
          type: "combat",
          neighborOffset: 1,
          onWin: [grantTradeShip],
          onLose: [{ type: "chooseUpgradeLoss", amount: 1 }, loseHalf]
        }
      ])
    ],
    resultsDe: "Der Konflikt mit den Piraten ist entschieden.",
    resultsEn: "The pirate conflict is resolved."
  }),
  createEncounterCard({
    number: 10,
    id: "spreadsheet-10",
    type: "pirate",
    titleDe: "Pirat fordert Tribut II",
    titleEn: "Pirate Tribute II",
    promptDe: "Ein Pirat fordert 2 Rohstoffe. Zahlst du oder kaempfst du?",
    promptEn: "A pirate demands 2 resources. Do you pay or fight?",
    choices: [
      createChoice("pay", "2 Rohstoffe zahlen", "Pay 2 resources", [{ type: "chooseResourceLoss", amount: 2 }]),
      createChoice("fight", "Kaempfen", "Fight", [
        {
          type: "combat",
          neighborOffset: 2,
          onWin: [{ type: "gainResource", resource: R.carbon, amount: 2 }, gainHalf],
          onLose: [blockShip, gainHalf]
        }
      ])
    ],
    resultsDe: "Der Pirat zieht weiter.",
    resultsEn: "The pirate moves on."
  }),
  createEncounterCard({
    number: 11,
    id: "spreadsheet-11",
    type: "pirate",
    titleDe: "Pirat fordert Tribut III",
    titleEn: "Pirate Tribute III",
    promptDe: "Ein Pirat fordert 2 Rohstoffe. Zahlst du oder kaempfst du?",
    promptEn: "A pirate demands 2 resources. Do you pay or fight?",
    choices: [
      createChoice("pay", "2 Rohstoffe zahlen", "Pay 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        blockShip
      ]),
      createChoice("fight", "Kaempfen", "Fight", [
        {
          type: "combat",
          neighborOffset: -1,
          onWin: [{ type: "gainResource", resource: R.ore, amount: 2 }, gainHalf],
          onLose: [{ type: "chooseUpgradeLoss", amount: 1 }]
        }
      ])
    ],
    resultsDe: "Der Tribut wurde geklaert.",
    resultsEn: "The tribute is resolved."
  }),
  createPirateTradeCard(12, "spreadsheet-12", [
    { range: [0, 2], effects: [loseHalf] },
    { range: [3, 3], effects: [{ type: "loseSelectedResources" }, gainHalf] },
    { range: [4, 5], effects: [] }
  ], [loseHalf]),
  createPirateTradeCard(13, "spreadsheet-13", [
    { range: [0, 2], effects: [] },
    { range: [3, 3], effects: [{ type: "loseSelectedResources" }, gainHalf] },
    { range: [4, 5], effects: [loseHalf] }
  ], []),
  createEncounterCard({
    number: 14,
    id: "spreadsheet-14",
    type: "pirate",
    titleDe: "Piratensuche I",
    titleEn: "Pirate Search I",
    promptDe: "Ein Pirat bietet Beute an. Nimmst du an?",
    promptEn: "A pirate offers loot. Do you accept?",
    choices: [
      createChoice("accept", "Annehmen", "Accept", [
        { type: "chooseResourceLoss", amount: 1 },
        {
          type: "mothershipOutcomeRoll",
          outcomes: [
            { range: [0, 2], effects: [loseHalf] },
            { range: [3, 3], effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }, loseHalf] },
            { range: [4, 5], effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }] }
          ]
        }
      ]),
      createChoice("decline", "Ablehnen", "Decline", [gainHalf])
    ],
    resultsDe: "Die Piratensuche ist abgeschlossen.",
    resultsEn: "The pirate search is complete."
  }),
  createEncounterCard({
    number: 15,
    id: "spreadsheet-15",
    type: "pirate",
    titleDe: "Piratensuche II",
    titleEn: "Pirate Search II",
    promptDe: "Ein Pirat lockt mit Beute. Nimmst du an?",
    promptEn: "A pirate tempts you with loot. Do you accept?",
    choices: [
      createChoice("accept", "Annehmen", "Accept", [
        { type: "chooseResourceLoss", amount: 1 },
        {
          type: "mothershipOutcomeRoll",
          outcomes: [
            { range: [0, 2], effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }] },
            { range: [3, 3], effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }, loseHalf] },
            { range: [4, 5], effects: [loseHalf] }
          ]
        }
      ]),
      createChoice("decline", "Ablehnen", "Decline", [])
    ],
    resultsDe: "Die Begegnung mit dem Piraten endet.",
    resultsEn: "The pirate encounter ends."
  }),
  createPirateAttackCard(16, "spreadsheet-16", 1, [{ type: "chooseUpgradeGain", amount: 1 }, gainHalf], [{ type: "chooseUpgradeLoss", amount: 1 }]),
  createPirateAttackCard(17, "spreadsheet-17", -2, [{ type: "gainResource", resource: R.ore, amount: 2 }, gainHalf], [{ type: "chooseUpgradeLoss", amount: 1 }, gainHalf]),
  createPirateAttackCard(18, "spreadsheet-18", -1, [grantTradeShip], [blockShip]),
  createDistressCard(19, "spreadsheet-19", 2, [grantTradeShip], [{ type: "chooseUpgradeLoss", amount: 1 }], []),
  createDistressCard(20, "spreadsheet-20", -1, [gainHalf, { type: "drawFromOpponents", amountPerOpponent: 1 }], [{ type: "chooseUpgradeLoss", amount: 1 }, gainHalf], [loseHalf]),
  createDistressCard(21, "spreadsheet-21", 1, [{ type: "chooseUpgradeGain", amount: 1 }, gainHalf], [{ type: "chooseUpgradeLoss", amount: 1 }], [loseHalf]),
  createRescueCard(22, "spreadsheet-22", -2, [{ type: "gainResource", resource: R.goods, amount: 2 }, gainHalf], [blockShip], []),
  createRescueCard(23, "spreadsheet-23", 1, [{ type: "chooseResourceGain", amount: 2 }, gainHalf], [{ type: "chooseUpgradeLoss", amount: 1 }, gainHalf], [loseHalf]),
  createRescueCard(24, "spreadsheet-24", -1, [jumpShip, gainHalf], [blockShip, gainHalf], [loseHalf]),
  createSpaceDistortionCard(25, "spreadsheet-25", -1, [jumpShip], [blockShip]),
  createSpaceDistortionCard(26, "spreadsheet-26", 1, [jumpShip], [blockShip]),
  createSpaceDistortionCard(27, "spreadsheet-27", 2, [jumpShip], [{ type: "chooseUpgradeLoss", amount: 1 }]),
  createEncounterCard({
    number: 28,
    id: "spreadsheet-28",
    type: "wandering",
    titleDe: "Wanderndes Volk I",
    titleEn: "Wandering People I",
    promptDe: "Ein wanderndes Volk bittet um Spenden.",
    promptEn: "A wandering people asks for donations.",
    choices: [
      createChoice("donate-0", "Nichts spenden", "Donate nothing", [{ type: "chooseUpgradeLoss", amount: 1 }, loseHalf]),
      createChoice("donate-1", "1 Rohstoff spenden", "Donate 1 resource", [{ type: "chooseResourceLoss", amount: 1 }, gainHalf]),
      createChoice("donate-2", "2 Rohstoffe spenden", "Donate 2 resources", [{ type: "chooseResourceLoss", amount: 2 }, jumpShip]),
      createChoice("donate-3", "3 Rohstoffe spenden", "Donate 3 resources", [{ type: "chooseResourceLoss", amount: 3 }, jumpShip])
    ],
    resultsDe: "Das wandernde Volk zieht weiter.",
    resultsEn: "The wandering people moves on."
  }),
  createEncounterCard({
    number: 29,
    id: "spreadsheet-29",
    type: "wandering",
    titleDe: "Wanderndes Volk II",
    titleEn: "Wandering People II",
    promptDe: "Ein wanderndes Volk bittet um Spenden.",
    promptEn: "A wandering people asks for donations.",
    choices: [
      createChoice("donate-0", "Nichts spenden", "Donate nothing", []),
      createChoice("donate-1", "1 Rohstoff spenden", "Donate 1 resource", [{ type: "chooseResourceLoss", amount: 1 }, gainHalf]),
      createChoice("donate-2", "2 Rohstoffe spenden", "Donate 2 resources", [{ type: "chooseResourceLoss", amount: 2 }, gainHalf]),
      createChoice("donate-3", "3 Rohstoffe spenden", "Donate 3 resources", [{ type: "chooseResourceLoss", amount: 3 }, grantTradeShip])
    ],
    resultsDe: "Die Spende ist abgehandelt.",
    resultsEn: "The donation is resolved."
  }),
  createEncounterCard({
    number: 30,
    id: "spreadsheet-30",
    type: "wandering",
    titleDe: "Wanderndes Volk III",
    titleEn: "Wandering People III",
    promptDe: "Ein wanderndes Volk bittet um Spenden.",
    promptEn: "A wandering people asks for donations.",
    choices: [
      createChoice("donate-0", "Nichts spenden", "Donate nothing", [loseHalf]),
      createChoice("donate-1", "1 Rohstoff spenden", "Donate 1 resource", [{ type: "chooseResourceLoss", amount: 1 }, loseHalf]),
      createChoice("donate-2", "2 Rohstoffe spenden", "Donate 2 resources", [{ type: "chooseResourceLoss", amount: 2 }, gainHalf]),
      createChoice("donate-3", "3 Rohstoffe spenden", "Donate 3 resources", [{ type: "chooseResourceLoss", amount: 3 }, jumpShip, gainHalf])
    ],
    resultsDe: "Das wandernde Volk bewertet deine Hilfe.",
    resultsEn: "The wandering people judges your help."
  }),
  createEncounterCard({
    number: 31,
    id: "spreadsheet-31",
    type: "global",
    titleDe: "Zahn der Zeit I",
    titleEn: "Tooth of Time I",
    promptDe: "Der Zahn der Zeit trifft alle mit mehr als 8 echten Anbauten.",
    promptEn: "The tooth of time affects everyone with more than 8 real upgrades.",
    choices: [
      createChoice("continue", "Ausfuehren", "Execute", [
        { type: "globalUpgradeLossAbove", threshold: 8, amount: 1 },
        { type: "drawNextEncounter", reshuffleAll: true }
      ])
    ],
    resultsDe: "Der Zahn der Zeit loest eine Folgebegegnung aus.",
    resultsEn: "The tooth of time triggers a follow-up encounter."
  }),
  createEncounterCard({
    number: 32,
    id: "spreadsheet-32",
    type: "global",
    titleDe: "Zahn der Zeit II",
    titleEn: "Tooth of Time II",
    promptDe: "Der Zahn der Zeit trifft alle mit mehr als 6 echten Anbauten. Die groessten Frachtraeume erhalten Ruhm.",
    promptEn: "The tooth of time affects everyone with more than 6 real upgrades. The largest cargo holds gain fame.",
    choices: [
      createChoice("continue", "Ausfuehren", "Execute", [
        { type: "globalUpgradeLossAbove", threshold: 6, amount: 1 },
        { type: "globalLeaderHalfMedal", metric: "cargo", amount: 1 },
        { type: "drawNextEncounter", reshuffleAll: true }
      ])
    ],
    resultsDe: "Der Zahn der Zeit loest eine Folgebegegnung aus.",
    resultsEn: "The tooth of time triggers a follow-up encounter."
  })
];

export function getAllEncounterCards() {
  return encounterCards;
}

export function getEncounterDeckIds() {
  return encounterCards
    .filter((card) => card.implemented && card.inDeck !== false)
    .map((card) => card.id);
}

export function getEncounterCardById(cardId) {
  return encounterCards.find((card) => card.id === cardId) ?? null;
}

function createEncounterCard({
  number,
  id,
  type,
  titleDe,
  titleEn,
  promptDe,
  promptEn,
  choices = [],
  resultsDe = "",
  resultsEn = "",
  implemented = true,
  inDeck = true,
  notes = "Aus Begegnungen.xlsx uebernommen."
}) {
  const spreadsheetText = encounterSpreadsheetTextsByNumber[number] ?? null;
  const exactPromptDe = spreadsheetText?.promptDe || promptDe;
  const exactResultsDe = spreadsheetText?.linesDe?.slice(1).join("\n\n") || resultsDe;
  const exactChoices = applySpreadsheetChoiceLabels(choices, spreadsheetText);

  return {
    id,
    number,
    cardNumber: number,
    type,
    titleDe,
    titleEn,
    promptDe: exactPromptDe,
    promptEn,
    title: { de: titleDe, en: titleEn },
    prompt: { de: exactPromptDe, en: promptEn },
    choices: exactChoices,
    resultsDe: exactResultsDe,
    resultsEn,
    results: { de: exactResultsDe, en: resultsEn },
    excelRows: spreadsheetText?.rows ?? [],
    excelLinesDe: spreadsheetText?.linesDe ?? [],
    requiresInput: false,
    requiresCombat: false,
    effects: [],
    implemented,
    inDeck,
    source: "Begegnungen.xlsx",
    notes
  };
}

function applySpreadsheetChoiceLabels(choices, spreadsheetText) {
  if (!spreadsheetText || !Array.isArray(choices)) return choices;

  return choices.map((choice, index) => {
    const labelDe = getSpreadsheetChoiceLabel(choice, index, spreadsheetText) ?? choice.labelDe;
    const resultDe = getSpreadsheetChoiceResultText(choice, index, spreadsheetText);
    return {
      ...choice,
      labelDe,
      label: {
        ...choice.label,
        de: labelDe
      },
      resultText: resultDe
        ? {
          ...(choice.resultText ?? {}),
          de: resultDe
        }
        : choice.resultText ?? null
    };
  });
}

function getSpreadsheetChoiceLabel(choice, index, spreadsheetText) {
  const donationMatch = choice.id.match(/(?:gift|donate)-(\d+)/);
  if (donationMatch) return donationMatch[1];

  const fightDonationMatch = choice.id.match(/^fight-(\d+)$/);
  if (fightDonationMatch) return `${fightDonationMatch[1]} · Ja`;

  const declineDonationMatch = choice.id.match(/^decline-(\d+)$/);
  if (declineDonationMatch) return `${declineDonationMatch[1]} · Nein`;

  const yesNoLabels = getFirstYesNoLabels(spreadsheetText);
  if (yesNoLabels.length >= 2) {
    if (["accept", "help", "attempt", "pay", "flee"].includes(choice.id)) return yesNoLabels[0];
    if (["decline", "fight"].includes(choice.id)) return yesNoLabels[1];
    return yesNoLabels[index] ?? null;
  }

  if (choice.id === "continue") return "Fortfahren";
  return null;
}

function getFirstYesNoLabels(spreadsheetText) {
  for (const row of spreadsheetText.rows ?? []) {
    const labels = (row.cells ?? []).filter((cell) => cell === "Ja" || cell === "Nein");
    if (labels.includes("Ja") && labels.includes("Nein")) {
      return ["Ja", "Nein"];
    }
  }
  return [];
}

function getSpreadsheetChoiceResultText(choice, index, spreadsheetText) {
  const donationMatch = choice.id.match(/(?:gift|donate)-(\d+)/);
  if (donationMatch) {
    return findSpreadsheetResultForChoiceKey(spreadsheetText, donationMatch[1]);
  }

  const yesNoKey = getSpreadsheetYesNoChoiceKey(choice, index);
  if (yesNoKey) {
    return findSpreadsheetResultForChoiceKey(spreadsheetText, yesNoKey);
  }

  if (choice.id === "continue") {
    return spreadsheetText.linesDe?.[0] ?? null;
  }

  return null;
}

function getSpreadsheetYesNoChoiceKey(choice, index) {
  if (["accept", "help", "attempt", "pay", "flee"].includes(choice.id)) return "Ja";
  if (["decline", "fight"].includes(choice.id)) return "Nein";
  return index === 0 ? "Ja" : index === 1 ? "Nein" : null;
}

function findSpreadsheetResultForChoiceKey(spreadsheetText, key) {
  const rows = spreadsheetText.rows ?? [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const cells = rows[rowIndex].cells ?? [];
    for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 1) {
      if (!spreadsheetChoiceCellMatches(cells[cellIndex], key)) continue;
      const sameRowResult = cells.slice(cellIndex + 1).find((cell) => isSpreadsheetResultText(cell));
      if (sameRowResult) return sameRowResult;
      const nextRowResult = rows[rowIndex + 1]?.cells?.[cellIndex];
      if (isSpreadsheetResultText(nextRowResult)) return nextRowResult;
      const nextRowFallback = rows[rowIndex + 1]?.cells?.find((cell) => isSpreadsheetResultText(cell));
      if (nextRowFallback) return nextRowFallback;
    }
  }
  return null;
}

function spreadsheetChoiceCellMatches(cell, key) {
  if (typeof cell !== "string") return false;
  const normalized = cell.trim();
  if (normalized === key) return true;
  if (!/^\d+$/.test(key)) return false;
  return normalized
    .split(",")
    .map((entry) => entry.trim())
    .includes(key);
}

function isSpreadsheetResultText(cell) {
  return typeof cell === "string"
    && cell.trim().length > 0
    && cell !== "Ja"
    && cell !== "Nein"
    && !/^\d+(?:\s*,\s*\d+)*$/.test(cell.trim());
}

function createChoice(id, labelDe, labelEn, effects = []) {
  return {
    id,
    labelDe,
    labelEn,
    label: { de: labelDe, en: labelEn },
    effects
  };
}

function createGiftPirateChoice(id, giftAmount, neighborOffset) {
  const effects = [];
  if (giftAmount > 0) effects.push({ type: "chooseResourceLoss", amount: giftAmount });
  effects.push({
    type: "combat",
    neighborOffset,
    onWin: [{ type: "gainSelectedResources" }, gainHalf],
    onLose: [blockShip]
  });
  return createChoice(
    id,
    `${giftAmount} Rohstoff(e) geben und kaempfen`,
    `Give ${giftAmount} resource(s) and fight`,
    effects
  );
}

function createGiftPirateDecline(id, giftAmount) {
  const effects = [];
  if (giftAmount > 0) effects.push({ type: "chooseResourceLoss", amount: giftAmount });
  return createChoice(
    id,
    `${giftAmount} Rohstoff(e) geben und nicht kaempfen`,
    `Give ${giftAmount} resource(s) and do not fight`,
    effects
  );
}

function createPirateTradeCard(number, id, outcomes, declineEffects) {
  return createEncounterCard({
    number,
    id,
    type: "pirate",
    titleDe: `Piratentausch ${number - 11}`,
    titleEn: `Pirate Trade ${number - 11}`,
    promptDe: "Ein Pirat bietet einen riskanten Tausch an: 1 Rohstoff gegen 2 Rohstoffe.",
    promptEn: "A pirate offers a risky trade: 1 resource for 2 resources.",
    choices: [
      createChoice("accept", "Tausch annehmen", "Accept trade", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 2 },
        { type: "mothershipOutcomeRoll", outcomes }
      ]),
      createChoice("decline", "Ablehnen", "Decline", declineEffects)
    ],
    resultsDe: "Der Piratentausch ist entschieden.",
    resultsEn: "The pirate trade is resolved."
  });
}

function createPirateAttackCard(number, id, neighborOffset, winEffects, loseEffects) {
  return createEncounterCard({
    number,
    id,
    type: "pirate",
    titleDe: `Piratenangriff ${number - 15}`,
    titleEn: `Pirate Attack ${number - 15}`,
    promptDe: "Piraten greifen an. Du kannst fliehen oder direkt kaempfen.",
    promptEn: "Pirates attack. You may flee or fight directly.",
    choices: [
      createChoice("flee", "Fliehen versuchen", "Try to flee", [
        {
          type: "comparison",
          metric: "drive",
          neighborOffset,
          onSuccess: [],
          onFailure: [{
            type: "combat",
            neighborOffset,
            onWin: winEffects,
            onLose: loseEffects
          }]
        }
      ]),
      createChoice("fight", "Direkt kaempfen", "Fight directly", [
        {
          type: "combat",
          neighborOffset,
          onWin: winEffects,
          onLose: loseEffects
        }
      ])
    ],
    resultsDe: "Der Piratenangriff ist abgehandelt.",
    resultsEn: "The pirate attack is resolved."
  });
}

function createDistressCard(number, id, neighborOffset, successEffects, failureEffects, declineEffects) {
  return createEncounterCard({
    number,
    id,
    type: "distress",
    titleDe: `Notruf ${number - 18}`,
    titleEn: `Distress Call ${number - 18}`,
    promptDe: "Ein Schiff sendet einen Notruf. Willst du helfen?",
    promptEn: "A ship sends a distress call. Do you help?",
    choices: [
      createChoice("help", "Helfen", "Help", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset,
          onSuccess: successEffects,
          onFailure: failureEffects
        }
      ]),
      createChoice("decline", "Nicht helfen", "Do not help", declineEffects)
    ],
    resultsDe: "Der Notruf ist abgeschlossen.",
    resultsEn: "The distress call is resolved."
  });
}

function createRescueCard(number, id, neighborOffset, winEffects, loseEffects, declineEffects) {
  return createEncounterCard({
    number,
    id,
    type: "distress",
    titleDe: `Rettung ${number - 21}`,
    titleEn: `Rescue ${number - 21}`,
    promptDe: "Ein Schiff wird von Piraten angegriffen. Willst du eingreifen?",
    promptEn: "A ship is attacked by pirates. Do you intervene?",
    choices: [
      createChoice("help", "Eingreifen", "Intervene", [
        {
          type: "combat",
          neighborOffset,
          onWin: winEffects,
          onLose: loseEffects
        }
      ]),
      createChoice("decline", "Nicht eingreifen", "Do not intervene", declineEffects)
    ],
    resultsDe: "Die Rettung ist entschieden.",
    resultsEn: "The rescue is resolved."
  });
}

function createSpaceDistortionCard(number, id, neighborOffset, successEffects, failureEffects) {
  return createEncounterCard({
    number,
    id,
    type: "space-distortion",
    titleDe: `Raumzerrung ${number - 24}`,
    titleEn: `Space Distortion ${number - 24}`,
    promptDe: "Eine Raumzerrung oeffnet sich. Willst du den Sprung wagen?",
    promptEn: "A space distortion opens. Do you risk the jump?",
    choices: [
      createChoice("attempt", "Sprung wagen", "Attempt jump", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset,
          onSuccess: successEffects,
          onFailure: failureEffects
        }
      ]),
      createChoice("decline", "Nicht springen", "Do not jump", [drawNextEncounter])
    ],
    resultsDe: "Die Raumzerrung ist abgehandelt.",
    resultsEn: "The space distortion is resolved."
  });
}
