const R = {
  ore: "ore",
  fuel: "fuel",
  carbon: "carbon",
  food: "food",
  goods: "goods"
};

const U = {
  drive: "drive",
  cargo: "cargo",
  cannon: "cannon"
};

const gainHalf = { type: "gainHalfMedal", amount: 1 };
const loseHalf = { type: "loseHalfMedal", amount: 1 };
const loseWholeMedal = { type: "loseHalfMedal", amount: 2 };
const grantTradeShip = { type: "grantShip", shipType: "tradeShip" };
const chooseShipBlock = { type: "chooseShipBlock" };
const chooseUpgradeGain = { type: "chooseUpgradeGain", amount: 1 };
const chooseUpgradeLoss = { type: "chooseUpgradeLoss", amount: 1 };
const jumpShip = { type: "jumpShip" };
const drawNextEncounter = { type: "drawNextEncounter" };

const encounterCards = [
  createMerchantCard(1, "haendler-geschenk-1", [
    merchantAmountChoice(0, "Der Händler erzählt allen von deiner Armut. Jeder Mitspieler schenkt dir einen Rohstoff. Du verlierst aber eine ganze Medaille.", [
      { type: "collectGiftsFromOpponents", amount: 1 },
      loseWholeMedal
    ]),
    merchantAmountChoice(1, "Der Händler bedauert deine Armut und schenkt dir eine Nahrung. Du verlierst aber eine halbe Medaille.", [
      payResources(1),
      { type: "gainResource", resource: R.food, amount: 1 },
      loseHalf
    ]),
    merchantAmountChoice(2, "Der Händler ist zufrieden. Du erhältst 1 beliebigen Rohstoff und 1 halbe Medaille.", [
      payResources(2),
      { type: "chooseResourceGain", amount: 1 },
      gainHalf
    ]),
    merchantAmountChoice(3, "Der Händler ist begeistert. Du erhältst 2 beliebige Rohstoffe und 1 halbe Medaille.", [
      payResources(3),
      { type: "chooseResourceGain", amount: 2 },
      gainHalf
    ])
  ]),
  createMerchantCard(2, "haendler-geschenk-2", [
    merchantAmountChoice(0, "Der Händler ist enttäuscht. Du verlierst eine halbe Medaille.", [loseHalf]),
    merchantAmountChoice(1, "Der Händler gibt dir einen beliebigen Rohstoff.", [
      payResources(1),
      { type: "chooseResourceGain", amount: 1 }
    ]),
    merchantAmountChoice(2, "Der Händler ist zufrieden. Du erhältst 1 beliebigen Rohstoff und 1 halbe Medaille.", [
      payResources(2),
      { type: "chooseResourceGain", amount: 1 },
      gainHalf
    ]),
    merchantAmountChoice(3, "Der Händler schenkt dir einen beliebigen Mutterschiff-Ausbau und 1 halbe Medaille.", [
      payResources(3),
      chooseUpgradeGain,
      gainHalf
    ])
  ]),
  createMerchantCard(3, "haendler-geschenk-3", [
    merchantAmountChoice(0, "Der Händler ist enttäuscht. Du verlierst eine halbe Medaille.", [loseHalf]),
    merchantAmountChoice(1, "Der Händler nimmt deinen Rohstoff an.", [payResources(1)]),
    merchantAmountChoice(2, "Der Händler dankt dir. Du erhältst 1 halbe Medaille.", [
      payResources(2),
      gainHalf
    ]),
    merchantAmountChoice(3, "Der Händler belohnt dich mit 1 Handelsware und 1 halben Medaille.", [
      payResources(3),
      { type: "gainResource", resource: R.goods, amount: 1 },
      gainHalf
    ])
  ]),
  createMerchantCard(4, "haendler-geschenk-4", [
    merchantAmountChoice(0, "Der Händler schenkt dir eine Handelsware.", [
      { type: "gainResource", resource: R.goods, amount: 1 }
    ]),
    merchantAmountChoice(1, "Der Händler schenkt dir 1 beliebigen Rohstoff und 1 halbe Medaille.", [
      payResources(1),
      { type: "chooseResourceGain", amount: 1 },
      gainHalf
    ]),
    merchantAmountChoice(2, "Der Händler schenkt dir 2 beliebige Rohstoffe und 1 halbe Medaille.", [
      payResources(2),
      { type: "chooseResourceGain", amount: 2 },
      gainHalf
    ]),
    merchantAmountChoice(3, "Der Händler gibt dir deine Rohstoffe zurück.", [
      payResources(3),
      { type: "gainSelectedResources" }
    ])
  ]),
  createMerchantCard(5, "haendler-geschenk-5", [
    merchantAmountChoice(0, "Der Händler wendet sich ab. Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen. Du verlierst eine halbe Medaille.", [
      chooseShipBlock,
      loseHalf
    ]),
    merchantAmountChoice(1, "Der Händler nimmt deinen Rohstoff. Du verlierst eine halbe Medaille.", [
      payResources(1),
      loseHalf
    ]),
    merchantAmountChoice(2, "Der Händler schenkt dir 1 beliebigen Rohstoff und 1 halbe Medaille.", [
      payResources(2),
      { type: "chooseResourceGain", amount: 1 },
      gainHalf
    ]),
    merchantAmountChoice(3, "Der Händler schenkt dir ein Handelsschiff.", [
      payResources(3),
      grantTradeShip
    ])
  ]),
  createMerchantCard(6, "haendler-geschenk-6", [
    merchantAmountChoice(0, "Der Händler wendet sich ab. Wähle eins deiner Schiffe. Es darf in dieser Runde nicht fliegen. Du verlierst eine halbe Medaille.", [
      chooseShipBlock,
      loseHalf
    ]),
    merchantAmountChoice(1, "Der Händler nimmt deinen Rohstoff. Du verlierst eine halbe Medaille.", [
      payResources(1),
      loseHalf
    ]),
    merchantAmountChoice(2, "Der Händler schenkt dir 1 beliebigen Rohstoff und 1 halbe Medaille.", [
      payResources(2),
      { type: "chooseResourceGain", amount: 1 },
      gainHalf
    ]),
    merchantAmountChoice(3, "Der Händler schenkt dir ein Handelsschiff.", [
      payResources(3),
      grantTradeShip
    ])
  ]),
  createMerchantPirateCard(7, "haendler-raumpirat-rechts", 1),
  createMerchantPirateCard(8, "haendler-raumpirat-links", -1),
  createPirateDemandCard(9, "raumpirat-forderung-rechts", 1, [
    grantTradeShip
  ], [
    chooseUpgradeLoss,
    gainHalf
  ], false),
  createPirateDemandCard(10, "raumpirat-forderung-zweiter-rechts", 2, [
    { type: "gainResource", resource: R.ore, amount: 2 },
    gainHalf
  ], [
    chooseShipBlock,
    gainHalf
  ], false),
  createPirateDemandCard(11, "raumpirat-forderung-links", -1, [
    { type: "gainResource", resource: R.ore, amount: 2 },
    gainHalf
  ], [
    chooseUpgradeLoss
  ], true),
  createPirateTradeCard(12, "raumpirat-hehlerei-1", [gainHalf], [
    { range: [1, 2], resultText: L("Die Hehlerei misslingt. Du verlierst eine halbe Medaille."), effects: [loseHalf] },
    { range: [3, 3], resultText: L("Die Hehlerei fliegt auf. Du verlierst die erhaltenen Rohstoffe und eine halbe Medaille."), effects: [{ type: "loseSelectedResources" }, loseHalf] },
    { range: [4, 5], resultText: L("Der Tausch gelingt."), effects: [] }
  ]),
  createPirateTradeCard(13, "raumpirat-hehlerei-2", [], [
    { range: [1, 2], resultText: L("Der Tausch gelingt."), effects: [] },
    { range: [3, 3], resultText: L("Die Hehlerei fliegt auf. Du verlierst die erhaltenen Rohstoffe und eine halbe Medaille."), effects: [{ type: "loseSelectedResources" }, loseHalf] },
    { range: [4, 5], resultText: L("Der Raumpirat verschwindet. Du verlierst eine halbe Medaille."), effects: [loseHalf] }
  ]),
  createPirateRaidCard(14, "piratenangriff-hehler-1", [gainHalf], [
    { range: [1, 2], resultText: L("Der Überfall misslingt. Du verlierst eine halbe Medaille."), effects: [loseHalf] },
    { range: [3, 3], resultText: L("Der Überfall gelingt, aber du verlierst eine halbe Medaille."), effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }, loseHalf] },
    { range: [4, 5], resultText: L("Der Überfall gelingt."), effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }] }
  ]),
  createPirateRaidCard(15, "piratenangriff-hehler-2", [], [
    { range: [1, 2], resultText: L("Der Überfall gelingt."), effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }] },
    { range: [3, 3], resultText: L("Der Überfall gelingt, aber du verlierst eine halbe Medaille."), effects: [{ type: "drawFromOpponents", amountPerOpponent: 1 }, loseHalf] },
    { range: [4, 5], resultText: L("Der Überfall misslingt. Du verlierst eine halbe Medaille."), effects: [loseHalf] }
  ]),
  createFleeCombatCard(16, "raumpirat-flucht-rechts", 1, [
    chooseUpgradeGain,
    gainHalf
  ], [
    chooseUpgradeLoss
  ]),
  createFleeCombatCard(17, "raumpirat-flucht-zweiter-links", -2, [
    { type: "gainResource", resource: R.ore, amount: 2 },
    gainHalf
  ], [
    chooseUpgradeLoss,
    gainHalf
  ]),
  createFleeCombatCard(18, "raumpirat-flucht-links", -1, [
    grantTradeShip
  ], [
    chooseShipBlock
  ]),
  createDistressCard(19, "notruf-rettung-1", 2, [], [
    grantTradeShip
  ], [
    chooseUpgradeLoss
  ]),
  createDistressCard(20, "notruf-diplomat", -1, [loseHalf], [
    gainHalf,
    { type: "drawFromOpponents", amountPerOpponent: 1 }
  ], [
    chooseUpgradeLoss,
    gainHalf
  ]),
  createDistressCard(21, "notruf-wissendes-volk", 1, [loseHalf], [
    chooseUpgradeGain,
    gainHalf
  ], [
    chooseUpgradeLoss
  ]),
  createPirateHelpCard(22, "piratenangriff-hilfe", 2, [], [
    { type: "gainResource", resource: R.goods, amount: 2 },
    gainHalf
  ], [
    chooseShipBlock
  ]),
  createPirateHelpCard(23, "piratenangriff-gruenes-volk", 1, [loseHalf], [
    { type: "chooseResourceGain", amount: 2 },
    gainHalf
  ], [
    chooseUpgradeLoss,
    gainHalf
  ]),
  createPirateHelpCard(24, "piratenangriff-wanderndes-volk", -1, [loseHalf], [
    jumpShip,
    gainHalf
  ], [
    chooseShipBlock,
    gainHalf
  ]),
  createSpaceDistortionCard(25, "raumzerrung-raumsprung-1", -1, [
    jumpShip
  ], [
    chooseShipBlock
  ]),
  createSpaceDistortionCard(26, "raumzerrung-raumsprung-2", 1, [
    jumpShip
  ], [
    chooseShipBlock
  ]),
  createSpaceDistortionCard(27, "raumzerrung-raumsprung-3", 2, [
    jumpShip
  ], [
    chooseUpgradeLoss
  ]),
  createWanderingCard(28, "wanderndes-volk-raumsprung-1", [
    merchantAmountChoice(0, "Der Fluch des wandernden Volkes trifft dich. Wähle einen beliebigen Ausbau deines Mutterschiffs und entferne ihn. Außerdem verlierst du eine halbe Medaille.", [
      chooseUpgradeLoss,
      loseHalf
    ]),
    merchantAmountChoice(1, "Du erhältst den Segen des wandernden Volkes und eine halbe Medaille.", [
      payResources(1),
      gainHalf
    ]),
    merchantAmountChoice(2, "Als Dank wird ein Raumsprung gewährt. Wähle eines deiner Schiffe, mit diesem darfst du einen Raumsprung ausführen.", [
      payResources(2),
      jumpShip
    ]),
    merchantAmountChoice(3, "Als Dank wird ein Raumsprung gewährt. Wähle eines deiner Schiffe, mit diesem darfst du einen Raumsprung ausführen.", [
      payResources(3),
      jumpShip
    ])
  ]),
  createWanderingCard(29, "wanderndes-volk-handelsschiff", [
    merchantAmountChoice(0, "Das wandernde Volk zieht weiter.", []),
    merchantAmountChoice(1, "Das wandernde Volk dankt dir. Du erhältst eine halbe Medaille.", [
      payResources(1),
      gainHalf
    ]),
    merchantAmountChoice(2, "Das wandernde Volk dankt dir. Du erhältst eine halbe Medaille.", [
      payResources(2),
      gainHalf
    ]),
    merchantAmountChoice(3, "Das wandernde Volk schenkt dir ein Handelsschiff.", [
      payResources(3),
      grantTradeShip
    ])
  ]),
  createWanderingCard(30, "wanderndes-volk-raumsprung-2", [
    merchantAmountChoice(0, "Das wandernde Volk ist enttäuscht. Du verlierst eine halbe Medaille.", [loseHalf]),
    merchantAmountChoice(1, "Das wandernde Volk ist nicht zufrieden. Du verlierst eine halbe Medaille.", [
      payResources(1),
      loseHalf
    ]),
    merchantAmountChoice(2, "Das wandernde Volk dankt dir. Du erhältst eine halbe Medaille.", [
      payResources(2),
      gainHalf
    ]),
    merchantAmountChoice(3, "Das wandernde Volk dankt dir mit einer halben Medaille und einem Raumsprung.", [
      payResources(3),
      gainHalf,
      jumpShip
    ])
  ]),
  createToothOfTimeCard(31, "zahn-der-zeit", 8, false),
  createToothOfTimeCard(32, "zahn-der-zeit-galaktischer-rat", 6, true)
];

export function getAllEncounterCards() {
  return encounterCards.map((card) => ({ ...card }));
}

export function getEncounterDeckIds() {
  return encounterCards.filter((card) => card.inDeck !== false).map((card) => card.id);
}

export function getEncounterCardById(cardId) {
  return encounterCards.find((card) => card.id === cardId) ?? null;
}

function createEncounterCard({
  number,
  id,
  type,
  titleDe,
  titleEn = titleDe,
  promptDe,
  promptEn = promptDe,
  choices,
  resultsDe = "Die Begegnung ist abgeschlossen.",
  resultsEn = "The encounter is resolved.",
  notes = ""
}) {
  return {
    id: `spreadsheet-${String(number).padStart(2, "0")}`,
    slug: id,
    cardNumber: number,
    number,
    type,
    title: L(titleDe, titleEn),
    titleDe,
    titleEn,
    prompt: L(promptDe, promptEn),
    promptDe,
    promptEn,
    choices,
    effects: [],
    results: L(resultsDe, resultsEn),
    resultsDe,
    resultsEn,
    implemented: true,
    inDeck: true,
    source: `docs/encounter-card-markdown/begegnung_karte_${String(number).padStart(2, "0")}_*.md`,
    notes
  };
}

function createChoice(id, labelDe, labelEn = labelDe, effects = [], options = {}) {
  return {
    id,
    label: L(labelDe, labelEn),
    effects: flattenEffects(effects),
    resultText: options.resultText ? normalizeText(options.resultText) : null
  };
}

function createMerchantCard(number, id, choices) {
  return createEncounterCard({
    number,
    id,
    type: "merchant",
    titleDe: `Händler ${number}`,
    titleEn: `Merchant ${number}`,
    promptDe: "Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?",
    promptEn: "You meet a merchant. How many resources, up to 3, do you give him?",
    choices,
    notes: "Markdown replacement card: merchant donation flow."
  });
}

function createWanderingCard(number, id, choices) {
  return createEncounterCard({
    number,
    id,
    type: "wandering-people",
    titleDe: "Wanderndes Volk",
    titleEn: "Wandering People",
    promptDe: "Du triffst ein Raumschiff des wandernden Volkes. Dieses in der ganzen Galaxie verehrte Volk bittet dich um eine Spende. Wie viele Rohstoffe (bis zu 3) schenkst du?",
    promptEn: "You meet a ship of the wandering people. This revered people asks for a donation. How many resources, up to 3, do you give?",
    choices,
    notes: "Markdown replacement card: wandering people donation flow."
  });
}

function merchantAmountChoice(amount, resultDe, effects) {
  return createChoice(
    `gift-${amount}`,
    `${amount} Rohstoff${amount === 1 ? "" : "e"}`,
    `${amount} resource${amount === 1 ? "" : "s"}`,
    effects,
    { resultText: L(resultDe) }
  );
}

function createMerchantPirateCard(number, id, neighborOffset) {
  const attackPrompt = L("Der Händler entpuppt sich als Raumpirat. Greifst du ihn an?");
  const branch = {
    type: "branchChoice",
    promptText: attackPrompt,
    choices: [
      createChoice("attack", "Ja", "Yes", [
        {
          type: "combat",
          neighborOffset,
          winText: L("Sieg. Du erhältst deine Geschenke zurück und dazu eine halbe Medaille."),
          loseText: L("Niederlage. Hast du dem Piraten Rohstoffe gegeben, verschwinden sie. Außerdem wählst du eins deiner Schiffe. Es darf in dieser Runde nicht fliegen."),
          onWin: [
            { type: "gainSelectedResources" },
            gainHalf
          ],
          onLose: [
            chooseShipBlock
          ]
        }
      ], { resultText: L("Du musst kämpfen.") }),
      createChoice("decline", "Nein", "No", [], {
        resultText: L("Der Pirat verschwindet. Hast du ihm Rohstoffe gegeben, nimmt er sie mit.")
      })
    ]
  };

  return createEncounterCard({
    number,
    id,
    type: "merchant-pirate",
    titleDe: "Händler / Raumpirat",
    titleEn: "Merchant / Space Pirate",
    promptDe: "Du begegnest einem Händler. Wie viele Rohstoffe (bis zu 3) schenkst du ihm?",
    promptEn: "You meet a merchant. How many resources, up to 3, do you give him?",
    choices: [0, 1, 2, 3].map((amount) => merchantAmountChoice(amount, attackPrompt.de, [
      payResources(amount),
      branch
    ])),
    notes: "The amount choice is followed by exact resource payment and an attack/decline branch."
  });
}

function createPirateDemandCard(number, id, neighborOffset, winEffects, loseEffects, payThenBlock) {
  const payEffects = [
    payResources(2),
    ...(payThenBlock ? [chooseShipBlock] : [])
  ];
  return createEncounterCard({
    number,
    id,
    type: "space-pirate",
    titleDe: "Raumpirat",
    titleEn: "Space Pirate",
    promptDe: "Ein Raumpirat fordert zwei deiner Rohstoffe. Gibst du ihm die Rohstoffe?",
    promptEn: "A space pirate demands two of your resources. Do you give them to him?",
    choices: [
      createChoice("pay", "Ja", "Yes", payEffects, {
        resultText: L(payThenBlock
          ? "Der Raumpirat nimmt die Rohstoffe. Außerdem wählst du eins deiner Schiffe. Es darf in dieser Runde nicht fliegen."
          : "Der Raumpirat nimmt die Rohstoffe und verschwindet.")
      }),
      createChoice("fight", "Nein", "No", [
        {
          type: "combat",
          neighborOffset,
          winText: L("Sieg. Der Raumpirat wird vertrieben."),
          loseText: L("Niederlage. Der Raumpirat beschädigt dein Mutterschiff."),
          onWin: winEffects,
          onLose: loseEffects
        }
      ], { resultText: L("Du stellst dich dem Raumpiraten.") })
    ],
    notes: "Pirate demand card from Markdown."
  });
}

function createPirateTradeCard(number, id, declineEffects, outcomes) {
  return createEncounterCard({
    number,
    id,
    type: "pirate-fence",
    titleDe: "Raumpirat / Hehlerei",
    titleEn: "Space Pirate / Fence",
    promptDe: "Du triffst einen Raumpiraten, der dir anbietet, einen deiner Rohstoffe gegen zwei beliebige andere umzutauschen. Willigst du ein?",
    promptEn: "You meet a space pirate who offers to trade one of your resources for two resources of your choice. Do you accept?",
    choices: [
      createChoice("accept", "Ja", "Yes", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 2 },
        { type: "mothershipOutcomeRoll", outcomes }
      ], { resultText: L("Du lässt dich auf den Handel ein.") }),
      createChoice("decline", "Nein", "No", declineEffects, {
        resultText: L("Du lehnst den Handel ab.")
      })
    ],
    notes: "Hehlerei rolls use only the colored ball value."
  });
}

function createPirateRaidCard(number, id, declineEffects, outcomes) {
  return createEncounterCard({
    number,
    id,
    type: "pirate-raid",
    titleDe: "Raumpirat / Überfall",
    titleEn: "Space Pirate / Raid",
    promptDe: "Du begegnest einem Raumpiraten, der dir anbietet, für einen beliebigen Rohstoff deine Mitspieler zu überfallen. Bist du einverstanden?",
    promptEn: "You meet a space pirate who offers to raid your opponents for one resource of your choice. Do you agree?",
    choices: [
      createChoice("accept", "Ja", "Yes", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "mothershipOutcomeRoll", outcomes }
      ], { resultText: L("Du gibst dem Raumpiraten einen Rohstoff.") }),
      createChoice("decline", "Nein", "No", declineEffects, {
        resultText: L("Du lehnst den Überfall ab.")
      })
    ],
    notes: "Pirate raid rolls use only the colored ball value."
  });
}

function createFleeCombatCard(number, id, neighborOffset, winEffects, loseEffects) {
  return createEncounterCard({
    number,
    id,
    type: "pirate-flee-combat",
    titleDe: "Raumpirat / Flucht oder Kampf",
    titleEn: "Space Pirate / Flee or Fight",
    promptDe: "Ein Raumpirat greift dich an. Möchtest du fliehen?",
    promptEn: "A space pirate attacks you. Do you want to flee?",
    choices: [
      createChoice("flee", "Ja", "Yes", [
        {
          type: "comparison",
          metric: "drive",
          neighborOffset,
          successText: L("Deine Flucht gelingt."),
          failureText: L("Die Flucht misslingt. Du musst kämpfen."),
          onSuccess: [],
          onFailure: [
            {
              type: "combat",
              neighborOffset,
              winText: L("Sieg. Der Raumpirat ist besiegt."),
              loseText: L("Niederlage. Der Raumpirat trifft dich hart."),
              onWin: winEffects,
              onLose: loseEffects
            }
          ]
        }
      ], { resultText: L("Du versuchst zu fliehen.") }),
      createChoice("fight", "Nein", "No", [
        {
          type: "combat",
          neighborOffset,
          winText: L("Sieg. Der Raumpirat ist besiegt."),
          loseText: L("Niederlage. Der Raumpirat trifft dich hart."),
          onWin: winEffects,
          onLose: loseEffects
        }
      ], { resultText: L("Du stellst dich dem Kampf.") })
    ],
    notes: "Flee uses drive comparison without a special roll; combat uses mothership combat."
  });
}

function createDistressCard(number, id, neighborOffset, declineEffects, successEffects, failureEffects) {
  return createEncounterCard({
    number,
    id,
    type: "distress-call",
    titleDe: "Notruf",
    titleEn: "Distress Call",
    promptDe: "Du erhältst den Notruf eines Raumschiffes, das antriebslos auf eine Sonne zutreibt. Möchtest du helfen?",
    promptEn: "You receive the distress call of a ship drifting helplessly toward a sun. Do you want to help?",
    choices: [
      createChoice("help", "Ja", "Yes", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset,
          successText: L("Die Rettung gelingt."),
          failureText: L("Die Rettung misslingt."),
          onSuccess: successEffects,
          onFailure: failureEffects
        }
      ], { resultText: L("Du versuchst zu helfen.") }),
      createChoice("decline", "Nein", "No", declineEffects, {
        resultText: L("Du antwortest nicht auf den Notruf.")
      })
    ],
    notes: "Distress card with special speed comparison roll."
  });
}

function createPirateHelpCard(number, id, neighborOffset, declineEffects, winEffects, loseEffects) {
  return createEncounterCard({
    number,
    id,
    type: "pirate-attack-help",
    titleDe: "Piratenangriff",
    titleEn: "Pirate Attack",
    promptDe: "Du siehst ein Raumschiff, das von einem Piraten angegriffen wird. Möchtest du helfen?",
    promptEn: "You see a ship being attacked by a pirate. Do you want to help?",
    choices: [
      createChoice("help", "Ja", "Yes", [
        {
          type: "combat",
          neighborOffset,
          winText: L("Sieg. Du hast geholfen."),
          loseText: L("Niederlage. Der Pirat setzt dir zu."),
          onWin: winEffects,
          onLose: loseEffects
        }
      ], { resultText: L("Du greifst in den Kampf ein.") }),
      createChoice("decline", "Nein", "No", declineEffects, {
        resultText: L("Du greifst nicht ein.")
      })
    ],
    notes: "Pirate help card with combat against the specified neighbor."
  });
}

function createSpaceDistortionCard(number, id, neighborOffset, successEffects, failureEffects) {
  return createEncounterCard({
    number,
    id,
    type: "space-distortion",
    titleDe: "Raumzerrung",
    titleEn: "Space Distortion",
    promptDe: "Du gerätst in die Nähe einer Raumzerrung. Willst du einen Raumsprung versuchen?",
    promptEn: "You drift close to a space distortion. Do you want to attempt a spatial jump?",
    choices: [
      createChoice("attempt", "Ja", "Yes", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset,
          successText: L("Der Raumsprung gelingt."),
          failureText: L("Der Raumsprung misslingt."),
          onSuccess: successEffects,
          onFailure: failureEffects
        }
      ], { resultText: L("Du wagst den Raumsprung.") }),
      createChoice("decline", "Nein", "No", [drawNextEncounter], {
        resultText: L("Du wagst den Raumsprung nicht. Ziehe eine neue Begegnungskarte.")
      })
    ],
    notes: "Spatial jump attempts use a special speed comparison and do not consume normal movement."
  });
}

function createToothOfTimeCard(number, id, threshold, hasGalacticCouncil) {
  const effects = [
    {
      type: "globalUpgradeLossAbove",
      threshold,
      amount: 1
    }
  ];
  if (hasGalacticCouncil) {
    effects.push({
      type: "globalLeaderHalfMedal",
      metric: "cargo",
      amount: 1,
      showResult: true,
      titleText: L("Galaktischer Rat", "Galactic Council"),
      bodyText: L(
        "Die Spieler, deren Mutterschiffe über die meisten Frachtringe verfügen, erhalten eine halbe Medaille.",
        "The players whose motherships have the most cargo rings receive half a medal."
      )
    });
  }
  effects.push(
    {
      type: "showEncounterMessage",
      titleText: L("Neue Begegnung", "New Encounter"),
      bodyText: L("Die Begegnungen wurden neu gemischt.", "The encounters were reshuffled.")
    },
    { type: "drawNextEncounter", reshuffleAll: true }
  );

  return createEncounterCard({
    number,
    id,
    type: "time-tooth",
    titleDe: hasGalacticCouncil ? "Zahn der Zeit / Galaktischer Rat" : "Zahn der Zeit",
    titleEn: hasGalacticCouncil ? "Tooth of Time / Galactic Council" : "Tooth of Time",
    promptDe: hasGalacticCouncil
      ? "Jeder, dessen Mutterschiff mehr als sechs Ausbauten besitzt, wählt einen beliebigen Ausbau und entfernt ihn. Die Spieler, deren Mutterschiffe über die meisten Frachtringe verfügen, erhalten eine halbe Medaille."
      : "Jeder, dessen Mutterschiff mehr als acht Ausbauten besitzt, wählt einen beliebigen Ausbau und entfernt ihn.",
    promptEn: hasGalacticCouncil
      ? "Everyone whose mothership has more than six upgrades chooses one upgrade and removes it. The players with the most cargo rings receive half a medal."
      : "Everyone whose mothership has more than eight upgrades chooses one upgrade and removes it.",
    choices: [
      createChoice("continue", "Weiter", "Continue", effects)
    ],
    resultsDe: "Die Begegnungen wurden neu gemischt.",
    resultsEn: "The encounters were reshuffled.",
    notes: "Counts only real physical mothership upgrades. Friendship bonuses are ignored."
  });
}

function payResources(amount) {
  return amount > 0 ? { type: "chooseResourceLoss", amount } : { type: "none" };
}

function L(de, en = de) {
  return { de, en };
}

function normalizeText(text) {
  if (!text) return null;
  if (typeof text === "string") return L(text);
  return {
    de: typeof text.de === "string" ? text.de : "",
    en: typeof text.en === "string" ? text.en : (typeof text.de === "string" ? text.de : "")
  };
}

function flattenEffects(effects) {
  return effects.flatMap((effect) => {
    if (!effect) return [];
    if (Array.isArray(effect)) return flattenEffects(effect);
    if (effect.type === "none") return [];
    return [effect];
  });
}
