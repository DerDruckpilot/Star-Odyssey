const encounterCards = [
  createEncounterCard({
    id: "salvage-cache",
    type: "resource",
    title: {
      de: "Verlorene Fracht",
      en: "Lost Cargo"
    },
    prompt: {
      de: "Du findest treibende Kisten im All.",
      en: "You find drifting crates in space."
    },
    choices: [
      {
        id: "secure",
        label: { de: "Fracht bergen", en: "Recover cargo" },
        effects: [
          { type: "gainResource", resource: "ore", amount: 1 },
          { type: "gainResource", resource: "goods", amount: 1 }
        ]
      }
    ],
    results: {
      de: "Du bergst nuetzliche Fracht.",
      en: "You recover useful cargo."
    },
    requiresInput: false,
    requiresCombat: false,
    effects: [{ type: "gainResource", resource: "ore", amount: 1 }, { type: "gainResource", resource: "goods", amount: 1 }],
    implemented: true,
    notes: ""
  }),
  createEncounterCard({
    id: "friendly-patrol",
    type: "resourceChoice",
    title: {
      de: "Freundliche Patrouille",
      en: "Friendly Patrol"
    },
    prompt: {
      de: "Eine Patrouille bietet dir Unterstuetzung an.",
      en: "A patrol offers you support."
    },
    choices: [
      {
        id: "choose-resource",
        label: { de: "Rohstoff waehlen", en: "Choose resource" },
        effects: [{ type: "chooseResourceGain", amount: 1 }]
      }
    ],
    results: {
      de: "Du erhaeltst einen ausgewaehlten Rohstoff.",
      en: "You gain the selected resource."
    },
    requiresInput: "resourceGain",
    requiresCombat: false,
    effects: [{ type: "chooseResourceGain", amount: 1 }],
    implemented: true,
    notes: ""
  }),
  createEncounterCard({
    id: "customs-fee",
    type: "resourceLoss",
    title: {
      de: "Transitgebuehr",
      en: "Transit Fee"
    },
    prompt: {
      de: "Du musst eine kleine Gebuehr entrichten.",
      en: "You must pay a small transit fee."
    },
    choices: [
      {
        id: "pay",
        label: { de: "Gebuehr zahlen", en: "Pay fee" },
        effects: [{ type: "loseResource", resource: "fuel", amount: 1 }]
      }
    ],
    results: {
      de: "Du zahlst 1 Treibstoff, falls vorhanden.",
      en: "You pay 1 fuel if available."
    },
    requiresInput: false,
    requiresCombat: false,
    effects: [{ type: "loseResource", resource: "fuel", amount: 1 }],
    implemented: true,
    notes: ""
  }),
  createEncounterCard({
    id: "honor-medal",
    type: "halfMedal",
    title: {
      de: "Ehrenvolle Tat",
      en: "Honorable Deed"
    },
    prompt: {
      de: "Dein Verhalten beeindruckt andere Sternenfahrer.",
      en: "Your actions impress fellow starfarers."
    },
    choices: [
      {
        id: "accept",
        label: { de: "Belohnung annehmen", en: "Accept reward" },
        effects: [{ type: "gainHalfMedal", amount: 1 }]
      }
    ],
    results: {
      de: "Du erhaeltst 1 halbe Medaille.",
      en: "You gain 1 half medal."
    },
    requiresInput: false,
    requiresCombat: false,
    effects: [{ type: "gainHalfMedal", amount: 1 }],
    implemented: true,
    notes: ""
  }),
  createEncounterCard({
    id: "tribunal-warning",
    type: "halfMedalLoss",
    title: {
      de: "Verwarnung",
      en: "Formal Warning"
    },
    prompt: {
      de: "Der Rat ahndet dein riskantes Verhalten.",
      en: "The council sanctions your risky behavior."
    },
    choices: [
      {
        id: "accept-loss",
        label: { de: "Folgen tragen", en: "Accept consequence" },
        effects: [{ type: "loseHalfMedal", amount: 1 }]
      }
    ],
    results: {
      de: "Du verlierst 1 halbe Medaille, falls vorhanden.",
      en: "You lose 1 half medal if available."
    },
    requiresInput: false,
    requiresCombat: false,
    effects: [{ type: "loseHalfMedal", amount: 1 }],
    implemented: true,
    notes: ""
  }),
  createEncounterCard({
    id: "retrofit-bay",
    type: "upgradeChoice",
    title: {
      de: "Werkstatt im All",
      en: "Orbital Workshop"
    },
    prompt: {
      de: "Du darfst dein Mutterschiff verbessern.",
      en: "You may improve your mothership."
    },
    choices: [
      {
        id: "choose-upgrade",
        label: { de: "Ausbau waehlen", en: "Choose upgrade" },
        effects: [{ type: "chooseUpgradeGain", amount: 1 }]
      }
    ],
    results: {
      de: "Du erhaeltst einen Ausbau deiner Wahl.",
      en: "You gain an upgrade of your choice."
    },
    requiresInput: "upgradeGain",
    requiresCombat: false,
    effects: [{ type: "chooseUpgradeGain", amount: 1 }],
    implemented: true,
    notes: ""
  }),
  createEncounterCard({
    id: "system-damage",
    type: "upgradeLoss",
    title: {
      de: "Systemschaden",
      en: "System Damage"
    },
    prompt: {
      de: "Ein Defekt zwingt dich zu einem Verlust am Mutterschiff.",
      en: "A malfunction forces you to lose part of your mothership setup."
    },
    choices: [
      {
        id: "choose-loss",
        label: { de: "Ausbau verlieren", en: "Lose upgrade" },
        effects: [{ type: "chooseUpgradeLoss", amount: 1 }]
      }
    ],
    results: {
      de: "Du entfernst einen vorhandenen Ausbau.",
      en: "You remove one existing upgrade."
    },
    requiresInput: "upgradeLoss",
    requiresCombat: false,
    effects: [{ type: "chooseUpgradeLoss", amount: 1 }],
    implemented: true,
    notes: ""
  }),
  createEncounterCard({
    id: "pirate-ambush",
    type: "combat",
    title: {
      de: "Piratenangriff",
      en: "Pirate Ambush"
    },
    prompt: {
      de: "Piraten stellen sich deinem Kurs entgegen.",
      en: "Pirates move to intercept your course."
    },
    choices: [
      {
        id: "combat",
        label: { de: "Kampf ausfuehren", en: "Resolve combat" },
        effects: [{
          type: "combat",
          enemyStrength: 4,
          onWin: [{ type: "gainHalfMedal", amount: 1 }],
          onLose: [{ type: "loseResource", resource: "goods", amount: 1 }]
        }]
      }
    ],
    results: {
      de: "Der Ausgang haengt von deiner Kampfkraft ab.",
      en: "The result depends on your combat strength."
    },
    requiresInput: false,
    requiresCombat: true,
    effects: [{
      type: "combat",
      enemyStrength: 4,
      onWin: [{ type: "gainHalfMedal", amount: 1 }],
      onLose: [{ type: "loseResource", resource: "goods", amount: 1 }]
    }],
    implemented: true,
    notes: "Digitale Erstfassung mit festem Gegnerwert statt Nachbarspieler-Rolle."
  }),
  createEncounterCard({
    id: "ion-storm",
    type: "combat",
    title: {
      de: "Ionensturm",
      en: "Ion Storm"
    },
    prompt: {
      de: "Ein Sturm prueft die Stabilitaet deines Schiffs.",
      en: "A storm tests your ship's stability."
    },
    choices: [
      {
        id: "weather-storm",
        label: { de: "Durchhalten", en: "Hold course" },
        effects: [{
          type: "combat",
          enemyStrength: 3,
          onWin: [{ type: "gainResource", resource: "fuel", amount: 1 }],
          onLose: [{ type: "loseUpgrade", upgrade: "drive", amount: 1 }]
        }]
      }
    ],
    results: {
      de: "Ein guter Wurf bringt dich sicher hindurch.",
      en: "A strong roll gets you through safely."
    },
    requiresInput: false,
    requiresCombat: true,
    effects: [{
      type: "combat",
      enemyStrength: 3,
      onWin: [{ type: "gainResource", resource: "fuel", amount: 1 }],
      onLose: [{ type: "loseUpgrade", upgrade: "drive", amount: 1 }]
    }],
    implemented: true,
    notes: "Verwendet dieselbe Kampflogik wie Piraten als technische Basis."
  }),
  createEncounterCard({
    id: "quiet-sector",
    type: "none",
    title: {
      de: "Ruhiger Sektor",
      en: "Quiet Sector"
    },
    prompt: {
      de: "Die Begegnung bleibt ohne Folgen.",
      en: "The encounter has no lasting effect."
    },
    choices: [
      {
        id: "continue",
        label: { de: "Weiterfliegen", en: "Continue flight" },
        effects: [{ type: "none" }]
      }
    ],
    results: {
      de: "Du kannst deinen Flug fortsetzen.",
      en: "You may continue your flight."
    },
    requiresInput: false,
    requiresCombat: false,
    effects: [{ type: "none" }],
    implemented: true,
    notes: ""
  })
];

export function getEncounterDeckIds() {
  return encounterCards.map((card) => card.id);
}

export function getEncounterCardById(cardId) {
  return encounterCards.find((card) => card.id === cardId) ?? null;
}

function createEncounterCard({
  id,
  type,
  title,
  prompt,
  choices,
  results,
  requiresInput,
  requiresCombat,
  effects,
  implemented,
  notes
}) {
  return {
    id,
    type,
    title,
    prompt,
    choices,
    results,
    requiresInput,
    requiresCombat,
    effects,
    implemented,
    notes
  };
}
