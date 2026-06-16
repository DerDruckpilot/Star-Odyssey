const encounterCards = [
  createEncounterCard({
    id: "honor-medal",
    type: "honor",
    titleDe: "Ehrenvolle Tat",
    titleEn: "Honorable Deed",
    promptDe: "Dein Verhalten beeindruckt andere Sternenfahrer.",
    promptEn: "Your actions impress fellow starfarers.",
    choices: [
      createChoice("accept", "Belohnung annehmen", "Accept reward", [
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Du erhaeltst 1 halbe Medaille.",
    resultsEn: "You gain 1 half medal.",
    implemented: true,
    inDeck: false,
    notes: "Bleibt als einfache Referenz- und Testkarte erhalten."
  }),
  createEncounterCard({
    id: "pirate-flee-left",
    type: "pirate",
    titleDe: "Piratenangriff Backbord",
    titleEn: "Pirate Attack Portside",
    promptDe: "Ein Raumpirat greift an. Deine Flucht gelingt nur, wenn dein linker Nachbar mehr Antriebskraft hat.",
    promptEn: "A pirate attacks. Your escape only works if the player on your left has more drive power.",
    choices: [
      createChoice("resolve", "Flucht pruefen", "Check escape", [
        {
          type: "comparison",
          metric: "drive",
          neighborOffset: -1,
          onSuccess: [],
          onFailure: [
            {
              type: "combat",
              neighborOffset: -1,
              onWin: [
                { type: "chooseUpgradeGain", amount: 1 },
                { type: "gainHalfMedal", amount: 1 }
              ],
              onLose: [
                { type: "chooseUpgradeLoss", amount: 1 }
              ]
            }
          ]
        }
      ])
    ],
    resultsDe: "Die Flucht oder der Kampf wird ausgewertet.",
    resultsEn: "The escape or combat is resolved.",
    implemented: true
  }),
  createEncounterCard({
    id: "pirate-flee-right",
    type: "pirate",
    titleDe: "Piratenangriff Steuerbord",
    titleEn: "Pirate Attack Starboard",
    promptDe: "Ein Raumpirat greift an. Deine Flucht gelingt nur, wenn dein rechter Nachbar mehr Antriebskraft hat.",
    promptEn: "A pirate attacks. Your escape only works if the player on your right has more drive power.",
    choices: [
      createChoice("resolve", "Flucht pruefen", "Check escape", [
        {
          type: "comparison",
          metric: "drive",
          neighborOffset: 1,
          onSuccess: [],
          onFailure: [
            {
              type: "combat",
              neighborOffset: 1,
              onWin: [
                { type: "gainResource", resource: "ore", amount: 1 },
                { type: "gainHalfMedal", amount: 1 }
              ],
              onLose: [
                { type: "chooseUpgradeLoss", amount: 1 }
              ]
            }
          ]
        }
      ])
    ],
    resultsDe: "Die Flucht oder der Kampf wird ausgewertet.",
    resultsEn: "The escape or combat is resolved.",
    implemented: true
  }),
  createEncounterCard({
    id: "pirate-demand-left",
    type: "pirate",
    titleDe: "Piratenforderung links",
    titleEn: "Pirate Demand Left",
    promptDe: "Ein Pirat fordert 2 deiner Rohstoffe. Du kannst zahlen oder dich mit Hilfe deines linken Nachbarn wehren.",
    promptEn: "A pirate demands 2 of your resources. You may pay or fight with your left neighbor acting as pirate strength.",
    choices: [
      createChoice("pay", "2 Rohstoffe abgeben", "Give up 2 resources", [
        { type: "chooseResourceLoss", amount: 2 }
      ]),
      createChoice("fight", "Widerstehen", "Resist", [
        {
          type: "combat",
          neighborOffset: -1,
          onWin: [
            { type: "grantShip", shipType: "tradeShip" },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onLose: [
            { type: "chooseUpgradeLoss", amount: 1 },
            { type: "blockFirstShip" },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ])
    ],
    resultsDe: "Der Pirat wird bezahlt oder in den Kampf gezwungen.",
    resultsEn: "The pirate is paid off or forced into combat.",
    implemented: true
  }),
  createEncounterCard({
    id: "pirate-demand-right",
    type: "pirate",
    titleDe: "Piratenforderung rechts",
    titleEn: "Pirate Demand Right",
    promptDe: "Ein Pirat fordert 2 deiner Rohstoffe. Du kannst zahlen oder dich mit Hilfe deines rechten Nachbarn wehren.",
    promptEn: "A pirate demands 2 of your resources. You may pay or fight with your right neighbor acting as pirate strength.",
    choices: [
      createChoice("pay", "2 Rohstoffe abgeben", "Give up 2 resources", [
        { type: "chooseResourceLoss", amount: 2 }
      ]),
      createChoice("fight", "Widerstehen", "Resist", [
        {
          type: "combat",
          neighborOffset: 1,
          onWin: [
            { type: "gainResource", resource: "carbon", amount: 2 },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onLose: [
            { type: "chooseUpgradeLoss", amount: 1 },
            { type: "blockFirstShip" },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ])
    ],
    resultsDe: "Der Pirat wird bezahlt oder in den Kampf gezwungen.",
    resultsEn: "The pirate is paid off or forced into combat.",
    implemented: true
  }),
  createEncounterCard({
    id: "pirate-raid-offer",
    type: "pirate",
    titleDe: "Piratenueberfall auf Bestellung",
    titleEn: "Pirate Raid Offer",
    promptDe: "Ein Pirat bietet an, fuer 1 Rohstoff deine Mitspieler zu ueberfallen. Danach entscheidet ein Mutterschiff-Wurf ueber die Beute.",
    promptEn: "A pirate offers to raid your opponents for 1 resource. A mothership roll then decides the outcome.",
    choices: [
      createChoice("accept", "Angebot annehmen", "Accept offer", [
        { type: "chooseResourceLoss", amount: 1 },
        {
          type: "mothershipOutcomeRoll",
          outcomes: [
            {
              range: [0, 1],
              effects: [
                { type: "loseHalfMedal", amount: 1 }
              ]
            },
            {
              range: [2, 3],
              effects: [
                { type: "drawFromOpponents", amountPerOpponent: 1 },
                { type: "loseHalfMedal", amount: 1 }
              ]
            },
            {
              range: [4, 5],
              effects: [
                { type: "drawFromOpponents", amountPerOpponent: 1 }
              ]
            }
          ]
        }
      ]),
      createChoice("decline", "Weiterfliegen", "Keep flying", [
        { type: "none" }
      ])
    ],
    resultsDe: "Der Pirat fuehrt den Ueberfall entsprechend dem Wurf aus.",
    resultsEn: "The pirate carries out the raid according to the roll.",
    implemented: true
  }),
  createEncounterCard({
    id: "merchant-gift-basic",
    type: "merchant",
    titleDe: "Anspruchsvoller Haendler",
    titleEn: "Demanding Merchant",
    promptDe: "Ein Haendler erwartet ein Geschenk. Je mehr du gibst, desto besser faellt seine Reaktion aus.",
    promptEn: "A merchant expects a gift. The more you give, the better the response.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "chooseResourceGain", amount: 2 },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Der Haendler reagiert auf dein Geschenk.",
    resultsEn: "The merchant reacts to your gift.",
    implemented: true
  }),
  createEncounterCard({
    id: "merchant-gift-upgrade",
    type: "merchant",
    titleDe: "Begeisterter Handelsfuerst",
    titleEn: "Delighted Trade Lord",
    promptDe: "Ein Handelsfuerst bewertet dein Geschenk. Grosszuegigkeit kann dir sogar einen Ausbau einbringen.",
    promptEn: "A trade lord judges your gift. Generosity can even grant you an upgrade.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "chooseUpgradeGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Der Handelsfuerst beurteilt deine Gabe.",
    resultsEn: "The trade lord judges your offering.",
    implemented: true
  }),
  createEncounterCard({
    id: "merchant-trade-ship",
    type: "merchant",
    titleDe: "Grosszuegiger Haendler",
    titleEn: "Generous Merchant",
    promptDe: "Ein freundlicher Haendler belohnt ein grosszuegiges Geschenk mit Handelshilfe.",
    promptEn: "A friendly merchant rewards a generous gift with trade support.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainResource", resource: "goods", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "grantShip", shipType: "tradeShip" },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Der Haendler entscheidet sich nach deiner Gabe.",
    resultsEn: "The merchant responds to your gift.",
    implemented: true
  }),
  createEncounterCard({
    id: "merchant-ambush",
    type: "merchant",
    titleDe: "Haendlerfalle",
    titleEn: "Merchant Ambush",
    promptDe: "Ein scheinbar friedlicher Haendler lockt dich in einen Hinterhalt. Deine Entscheidung bestimmt, ob es beim Geschaeft bleibt.",
    promptEn: "A seemingly peaceful merchant leads you into an ambush. Your decision decides whether this stays a trade.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        {
          type: "combat",
          neighborOffset: 1,
          onWin: [
            { type: "gainHalfMedal", amount: 1 }
          ],
          onLose: [
            { type: "blockFirstShip" }
          ]
        }
      ])
    ],
    resultsDe: "Der Hinterhalt oder das Geschenk wird ausgewertet.",
    resultsEn: "The ambush or the gift is resolved.",
    implemented: true
  }),
  createEncounterCard({
    id: "help-green-prince",
    type: "rescue",
    titleDe: "Hilferuf des Gruenen Volkes",
    titleEn: "Green People Distress Call",
    promptDe: "Ein Schiff des Gruenen Volkes wird von Piraten bedrängt. Wenn du hilfst, entscheidet ein Kampf gegen den rechten Nachbarn.",
    promptEn: "A ship of the Green People is under pirate attack. If you help, combat is resolved against the player on your right.",
    choices: [
      createChoice("help", "Helfen", "Help", [
        {
          type: "combat",
          neighborOffset: 1,
          onWin: [
            { type: "chooseResourceGain", amount: 2 },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onLose: [
            { type: "chooseUpgradeLoss", amount: 1 },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ]),
      createChoice("decline", "Nicht eingreifen", "Do not intervene", [
        { type: "none" }
      ])
    ],
    resultsDe: "Die Rettung wird im Kampf entschieden.",
    resultsEn: "The rescue is decided in combat.",
    implemented: true
  }),
  createEncounterCard({
    id: "help-wise-prince",
    type: "rescue",
    titleDe: "Hilferuf des Wissenden Volkes",
    titleEn: "Wise People Distress Call",
    promptDe: "Ein Schiff des Wissenden Volkes braucht Hilfe. Wenn du eingreifst, entscheidet ein Kampf gegen den zweiten rechten Nachbarn.",
    promptEn: "A ship of the Wise People needs help. If you intervene, combat is resolved against the second player on your right.",
    choices: [
      createChoice("help", "Helfen", "Help", [
        {
          type: "combat",
          neighborOffset: 2,
          onWin: [
            { type: "chooseUpgradeGain", amount: 1 },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onLose: [
            { type: "chooseUpgradeLoss", amount: 1 },
            { type: "blockFirstShip" },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ]),
      createChoice("decline", "Nicht eingreifen", "Do not intervene", [
        { type: "loseHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Die Rettung wird im Kampf entschieden.",
    resultsEn: "The rescue is decided in combat.",
    implemented: true
  }),
  createEncounterCard({
    id: "distress-trader",
    type: "rescue",
    titleDe: "Notruf eines Handelsschiffs",
    titleEn: "Trader Distress Call",
    promptDe: "Ein antriebsloses Handelschiff treibt auf eine Sonne zu. Wenn du hilfst, zaehlt ein Geschwindigkeitsvergleich mit dem rechten Nachbarn.",
    promptEn: "A powerless trader drifts toward a sun. If you help, speed is compared to the player on your right.",
    choices: [
      createChoice("help", "Helfen", "Help", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset: 1,
          onSuccess: [
            { type: "grantShip", shipType: "tradeShip" },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onFailure: [
            { type: "chooseUpgradeLoss", amount: 1 },
            { type: "blockFirstShip" },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ]),
      createChoice("decline", "Nicht helfen", "Do not help", [
        { type: "loseHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Die Rettung haengt von der Geschwindigkeit ab.",
    resultsEn: "The rescue depends on speed.",
    implemented: true
  }),
  createEncounterCard({
    id: "distress-diplomat",
    type: "rescue",
    titleDe: "Notruf eines Diplomaten",
    titleEn: "Diplomat Distress Call",
    promptDe: "Ein wichtiger Diplomat braucht Hilfe. Wenn du hilfst, zaehlt ein Geschwindigkeitsvergleich mit dem linken Nachbarn.",
    promptEn: "An important diplomat needs help. If you help, speed is compared to the player on your left.",
    choices: [
      createChoice("help", "Helfen", "Help", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset: -1,
          onSuccess: [
            { type: "drawFromOpponents", amountPerOpponent: 1 },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onFailure: [
            { type: "chooseUpgradeLoss", amount: 1 },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ]),
      createChoice("decline", "Nicht helfen", "Do not help", [
        { type: "loseHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Die Rettung haengt von der Geschwindigkeit ab.",
    resultsEn: "The rescue depends on speed.",
    implemented: true
  }),
  createEncounterCard({
    id: "wandering-donation",
    type: "wandering",
    titleDe: "Wanderndes Volk",
    titleEn: "Wandering People",
    promptDe: "Das Wandernde Volk bittet um eine Spende. Wer geizt, verliert Ansehen.",
    promptEn: "The Wandering People ask for a donation. Stinginess costs reputation.",
    choices: [
      createChoice("gift-0", "Nichts spenden", "Donate nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff spenden", "Donate 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe spenden", "Donate 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe spenden", "Donate 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "grantShip", shipType: "tradeShip" },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Das Wandernde Volk reagiert auf deine Spende.",
    resultsEn: "The Wandering People react to your donation.",
    implemented: true
  }),
  createEncounterCard({
    id: "pirate-flee-second-left",
    type: "pirate",
    titleDe: "Piratenangriff zweiter Nachbar links",
    titleEn: "Pirate Attack Second Left Neighbor",
    promptDe: "Ein Raumpirat greift an. Deine Flucht gelingt nur, wenn dein zweiter linker Nachbar mehr Antriebskraft hat.",
    promptEn: "A pirate attacks. Your escape only works if the second player on your left has more drive power.",
    choices: [
      createChoice("resolve", "Flucht pruefen", "Check escape", [
        {
          type: "comparison",
          metric: "drive",
          neighborOffset: -2,
          onSuccess: [],
          onFailure: [
            {
              type: "combat",
              neighborOffset: 1,
              onWin: [
                { type: "gainResource", resource: "ore", amount: 2 },
                { type: "gainHalfMedal", amount: 1 }
              ],
              onLose: [
                { type: "blockFirstShip" },
                { type: "gainHalfMedal", amount: 1 }
              ]
            }
          ]
        }
      ])
    ],
    resultsDe: "Die Flucht oder der Kampf wird ausgewertet.",
    resultsEn: "The escape or combat is resolved.",
    implemented: true,
    notes: "Aus Fotoreferenz technisch angenaehert: zweiter linker Nachbar prueft die Flucht, der Kampf nutzt einen Nachbarwert."
  }),
  createEncounterCard({
    id: "pirate-flee-second-right",
    type: "pirate",
    titleDe: "Piratenangriff zweiter Nachbar rechts",
    titleEn: "Pirate Attack Second Right Neighbor",
    promptDe: "Ein Raumpirat greift an. Deine Flucht gelingt nur, wenn dein zweiter rechter Nachbar mehr Antriebskraft hat.",
    promptEn: "A pirate attacks. Your escape only works if the second player on your right has more drive power.",
    choices: [
      createChoice("resolve", "Flucht pruefen", "Check escape", [
        {
          type: "comparison",
          metric: "drive",
          neighborOffset: 2,
          onSuccess: [],
          onFailure: [
            {
              type: "combat",
              neighborOffset: -1,
              onWin: [
                { type: "grantShip", shipType: "tradeShip" },
                { type: "gainHalfMedal", amount: 1 }
              ],
              onLose: [
                { type: "chooseUpgradeLoss", amount: 1 },
                { type: "gainHalfMedal", amount: 1 }
              ]
            }
          ]
        }
      ])
    ],
    resultsDe: "Die Flucht oder der Kampf wird ausgewertet.",
    resultsEn: "The escape or combat is resolved.",
    implemented: true,
    notes: "Aus Fotoreferenz technisch angenaehert."
  }),
  createEncounterCard({
    id: "pirate-demand-second-left",
    type: "pirate",
    titleDe: "Piratenforderung zweiter Nachbar links",
    titleEn: "Pirate Demand Second Left Neighbor",
    promptDe: "Ein Pirat fordert 2 deiner Rohstoffe. Du kannst zahlen oder gegen den zweiten linken Nachbarn kaempfen.",
    promptEn: "A pirate demands 2 of your resources. You may pay or fight using the second player on your left as pirate strength.",
    choices: [
      createChoice("pay", "2 Rohstoffe abgeben", "Give up 2 resources", [
        { type: "chooseResourceLoss", amount: 2 }
      ]),
      createChoice("fight", "Widerstehen", "Resist", [
        {
          type: "combat",
          neighborOffset: -2,
          onWin: [
            { type: "gainResource", resource: "carbon", amount: 2 },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onLose: [
            { type: "chooseUpgradeLoss", amount: 1 }
          ]
        }
      ])
    ],
    resultsDe: "Der Pirat wird bezahlt oder in den Kampf gezwungen.",
    resultsEn: "The pirate is paid off or forced into combat.",
    implemented: true,
    notes: "An die Piratenkarten mit Nachbarvergleich aus den Fotos angelehnt."
  }),
  createEncounterCard({
    id: "pirate-smuggling",
    type: "pirate",
    titleDe: "Hehlerei im Schattenraum",
    titleEn: "Shadowspace Smuggling",
    promptDe: "Ein Pirat bietet fragwuerdige Geschaefte an. Du kannst 1 Rohstoff abgeben, 2 andere nehmen und dann den Ausgang mit dem Mutterschiff pruefen.",
    promptEn: "A pirate offers shady deals. You may give up 1 resource, gain 2 others, then resolve the outcome with a mothership roll.",
    choices: [
      createChoice("accept", "Geschaeft machen", "Take the deal", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 2 },
        {
          type: "mothershipOutcomeRoll",
          outcomes: [
            {
              range: [1, 2],
              effects: [
                { type: "loseHalfMedal", amount: 1 }
              ]
            },
            {
              range: [3, 3],
              effects: [
                { type: "none" }
              ]
            },
            {
              range: [4, 5],
              effects: [
                { type: "gainHalfMedal", amount: 1 }
              ]
            }
          ]
        }
      ]),
      createChoice("decline", "Ablehnen", "Decline", [
        { type: "none" }
      ])
    ],
    resultsDe: "Das Schmuggelgeschaeft wird ausgewertet.",
    resultsEn: "The smuggling deal is resolved.",
    implemented: true,
    notes: "Hehlerei-/Tauschkarte aus Fotoreferenz. Der Verlust der getauschten Waren ist hier als Reputationsstrafe angenaehert."
  }),
  createEncounterCard({
    id: "merchant-pity-goods",
    type: "merchant",
    titleDe: "Mitleidiger Haendler",
    titleEn: "Pitying Merchant",
    promptDe: "Ein Haendler reagiert mit einer Mischung aus Mitleid und Stolz auf dein Geschenk.",
    promptEn: "A merchant reacts to your gift with a mix of pity and pride.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "gainResource", resource: "goods", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 2 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "gainResource", resource: "goods", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Der Haendler bewertet deine Gabe.",
    resultsEn: "The merchant judges your offering.",
    implemented: true,
    notes: "An die Haendlerkarte mit Handelsware als Trost aus den Fotos angelehnt."
  }),
  createEncounterCard({
    id: "merchant-shocked",
    type: "merchant",
    titleDe: "Schockierter Haendler",
    titleEn: "Shocked Merchant",
    promptDe: "Ein Haendler ist ueber dein Geschenk enttaeuscht oder begeistert, je nach Grosszuegigkeit.",
    promptEn: "A merchant is disappointed or delighted by your gift, depending on your generosity.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "chooseResourceGain", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "chooseUpgradeGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Der Haendler reagiert auf deine Grosszuegigkeit.",
    resultsEn: "The merchant reacts to your generosity.",
    implemented: true
  }),
  createEncounterCard({
    id: "merchant-blacklist",
    type: "merchant",
    titleDe: "Schwarze Liste der Haendler",
    titleEn: "Merchant Blacklist",
    promptDe: "Ein beleidigter Handelsfuerst droht, dich bei anderen Voelkern schlecht zu machen.",
    promptEn: "An offended trade lord threatens to blacklist you among other peoples.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "gainResource", resource: "goods", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Der Handelsfuerst verbreitet Geruechte oder laesst Gnade walten.",
    resultsEn: "The trade lord spreads rumors or shows mercy.",
    implemented: true,
    notes: "An mehrere Haendler-Varianten aus den Fotos angelehnt."
  }),
  createEncounterCard({
    id: "merchant-generous-rumor",
    type: "merchant",
    titleDe: "Geruechte auf der Handelsroute",
    titleEn: "Rumors on the Trade Route",
    promptDe: "Ein Haendler testet deine Geduld. Mehr Grosszuegigkeit sichert bessere Beziehungen.",
    promptEn: "A merchant tests your patience. More generosity secures better relations.",
    choices: [
      createChoice("gift-0", "Nichts schenken", "Give nothing", [
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff schenken", "Give 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainResource", resource: "goods", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe schenken", "Give 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "chooseResourceGain", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe schenken", "Give 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "grantShip", shipType: "tradeShip" },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Die Geruechte um den Haendler ebbben ab oder werden schlimmer.",
    resultsEn: "Rumors around the merchant fade or grow worse.",
    implemented: true
  }),
  createEncounterCard({
    id: "wandering-donation-blessing",
    type: "wandering",
    titleDe: "Segen des Wandernden Volkes",
    titleEn: "Blessing of the Wandering People",
    promptDe: "Das Wandernde Volk nimmt eine Spende entgegen. Genuegend Grosszuegigkeit kann dir einen Raumsprung ermoeglichen.",
    promptEn: "The Wandering People accept a donation. Enough generosity may grant you a spatial jump.",
    choices: [
      createChoice("gift-0", "Nichts spenden", "Donate nothing", [
        { type: "chooseUpgradeLoss", amount: 1 },
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff spenden", "Donate 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe spenden", "Donate 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "jumpFirstShip" }
      ]),
      createChoice("gift-3", "3 Rohstoffe spenden", "Donate 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "jumpFirstShip" },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Das Wandernde Volk segnet oder tadelt dein Verhalten.",
    resultsEn: "The Wandering People bless or rebuke your behavior.",
    implemented: true
  }),
  createEncounterCard({
    id: "wandering-donation-upgrade-loss",
    type: "wandering",
    titleDe: "Pruefung des Wandernden Volkes",
    titleEn: "Trial of the Wandering People",
    promptDe: "Das Wandernde Volk prueft deine Freigebigkeit. Genuegend Spende kann einen Sprung oder neue Chancen bringen.",
    promptEn: "The Wandering People test your generosity. Enough charity can grant a jump or new opportunities.",
    choices: [
      createChoice("gift-0", "Nichts spenden", "Donate nothing", [
        { type: "chooseUpgradeLoss", amount: 1 },
        { type: "loseHalfMedal", amount: 1 }
      ]),
      createChoice("gift-1", "1 Rohstoff spenden", "Donate 1 resource", [
        { type: "chooseResourceLoss", amount: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-2", "2 Rohstoffe spenden", "Donate 2 resources", [
        { type: "chooseResourceLoss", amount: 2 },
        { type: "jumpFirstShip" },
        { type: "gainHalfMedal", amount: 1 }
      ]),
      createChoice("gift-3", "3 Rohstoffe spenden", "Donate 3 resources", [
        { type: "chooseResourceLoss", amount: 3 },
        { type: "drawFromOpponents", amountPerOpponent: 1 },
        { type: "gainHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Das Wandernde Volk beurteilt deine Spende.",
    resultsEn: "The Wandering People judge your donation.",
    implemented: true,
    notes: "An die Karten mit Spende und Segen aus den Fotoreferenzen angelehnt."
  }),
  createEncounterCard({
    id: "distress-merchant-convoy",
    type: "rescue",
    titleDe: "Hilferuf eines Handelskonvois",
    titleEn: "Merchant Convoy Distress Call",
    promptDe: "Ein Handelskonvoi bittet um Hilfe. Wenn du eingreifst, entscheidet ein Geschwindigkeitsvergleich mit dem zweiten rechten Nachbarn.",
    promptEn: "A merchant convoy asks for help. If you intervene, speed is compared to the second player on your right.",
    choices: [
      createChoice("help", "Helfen", "Help", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset: 2,
          onSuccess: [
            { type: "grantShip", shipType: "tradeShip" },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onFailure: [
            { type: "blockFirstShip" },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ]),
      createChoice("decline", "Nicht helfen", "Do not help", [
        { type: "loseHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Die Rettung haengt von deiner Geschwindigkeit ab.",
    resultsEn: "The rescue depends on your speed.",
    implemented: true
  }),
  createEncounterCard({
    id: "distress-diplomat-high",
    type: "rescue",
    titleDe: "Hoher Diplomat in Not",
    titleEn: "High Diplomat in Distress",
    promptDe: "Ein hoher Diplomat braucht sofortige Hilfe. Wenn du eingreifst, pruefst du deine Geschwindigkeit gegen den linken Nachbarn.",
    promptEn: "A high diplomat needs immediate help. If you intervene, your speed is compared to the player on your left.",
    choices: [
      createChoice("help", "Helfen", "Help", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset: -1,
          onSuccess: [
            { type: "drawFromOpponents", amountPerOpponent: 1 },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onFailure: [
            { type: "chooseUpgradeLoss", amount: 1 },
            { type: "gainHalfMedal", amount: 1 }
          ]
        }
      ]),
      createChoice("decline", "Nicht helfen", "Do not help", [
        { type: "loseHalfMedal", amount: 1 }
      ])
    ],
    resultsDe: "Die Rettung wird durch Geschwindigkeit entschieden.",
    resultsEn: "The rescue is decided by speed.",
    implemented: true
  }),
  createEncounterCard({
    id: "quiet-sector",
    type: "none",
    titleDe: "Ruhiger Sektor",
    titleEn: "Quiet Sector",
    promptDe: "Die Begegnung bleibt ohne Folgen.",
    promptEn: "The encounter has no lasting effect.",
    choices: [
      createChoice("continue", "Weiterfliegen", "Continue flight", [
        { type: "none" }
      ])
    ],
    resultsDe: "Du kannst deinen Flug fortsetzen.",
    resultsEn: "You may continue your flight.",
    implemented: true
  }),
  createEncounterCard({
    id: "space-distortion-left",
    type: "distortion",
    titleDe: "Raumzerrung Backbord",
    titleEn: "Spatial Distortion Portside",
    promptDe: "Eine Raumzerrung lockt zu einem Sprung. Ist dein linker Nachbar schneller, darf dein erstes Schiff an einen beliebigen erlaubten Punkt springen.",
    promptEn: "A spatial distortion tempts you into a jump. If the player on your left is faster, your first ship may jump to any legal point.",
    choices: [
      createChoice("attempt", "Raumsprung versuchen", "Attempt jump", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset: -1,
          onSuccess: [
            { type: "jumpFirstShip" }
          ],
          onFailure: [
            { type: "blockFirstShip" }
          ]
        }
      ])
    ],
    resultsDe: "Die Raumzerrung wird ausgewertet.",
    resultsEn: "The spatial distortion is resolved.",
    implemented: true,
    notes: "Freie Zielwahl des ersten Schiffs ist jetzt digital abbildbar."
  }),
  createEncounterCard({
    id: "space-distortion-right",
    type: "distortion",
    titleDe: "Raumzerrung Steuerbord",
    titleEn: "Spatial Distortion Starboard",
    promptDe: "Eine Raumzerrung lockt zu einem Sprung. Ist dein rechter Nachbar schneller, springt dein erstes Schiff zu einem erlaubten Zielpunkt. Sonst folgt sofort eine neue Begegnung.",
    promptEn: "A spatial distortion tempts you into a jump. If the player on your right is faster, your first ship jumps to a legal destination. Otherwise a new encounter begins immediately.",
    choices: [
      createChoice("attempt", "Raumsprung versuchen", "Attempt jump", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset: 1,
          onSuccess: [
            { type: "jumpFirstShip" }
          ],
          onFailure: [
            { type: "drawNextEncounter" }
          ]
        }
      ])
    ],
    resultsDe: "Die Raumzerrung wird ausgewertet.",
    resultsEn: "The spatial distortion is resolved.",
    implemented: true
  }),
  createEncounterCard({
    id: "space-distortion-second-right",
    type: "distortion",
    titleDe: "Tiefe Raumzerrung",
    titleEn: "Deep Spatial Distortion",
    promptDe: "Eine tiefe Raumzerrung erfordert Mut. Ist dein zweiter rechter Nachbar schneller, darf dein erstes Schiff springen und du erhältst eine halbe Medaille.",
    promptEn: "A deep spatial distortion requires courage. If the second player on your right is faster, your first ship may jump and you gain a half medal.",
    choices: [
      createChoice("attempt", "Sprung wagen", "Risk the jump", [
        {
          type: "comparison",
          metric: "speed",
          neighborOffset: 2,
          onSuccess: [
            { type: "jumpFirstShip" },
            { type: "gainHalfMedal", amount: 1 }
          ],
          onFailure: [
            { type: "drawNextEncounter" }
          ]
        }
      ])
    ],
    resultsDe: "Die tiefe Raumzerrung wird ausgewertet.",
    resultsEn: "The deep spatial distortion is resolved.",
    implemented: true,
    notes: "An die Raumzerrungs-Karten mit Folgebegegnung aus den Fotoreferenzen angelehnt."
  }),
  createEncounterCard({
    id: "tooth-of-time-upgrade-loss",
    type: "global",
    titleDe: "Zahn der Zeit: Zu viele Ausbauten",
    titleEn: "Tooth of Time: Too Many Upgrades",
    promptDe: "Jeder Spieler mit mehr als 8 Ausbauten entfernt 1 beliebigen Ausbau. Danach wird sofort eine neue Begegnung gezogen.",
    promptEn: "Every player with more than 8 upgrades removes 1 chosen upgrade. Another encounter is drawn immediately afterwards.",
    choices: [
      createChoice("continue", "Ausfuehren", "Execute", [
        { type: "globalUpgradeLossAbove", threshold: 8, amount: 1 },
        { type: "drawNextEncounter", reshuffleAll: true }
      ])
    ],
    resultsDe: "Der Zahn der Zeit betrifft alle ueberausgeruesteten Mutterschiffe.",
    resultsEn: "The tooth of time affects every over-equipped mothership.",
    implemented: true,
    notes: "Nach der Fotoreferenz spielbar angenaehert."
  }),
  createEncounterCard({
    id: "tooth-of-time-cargo",
    type: "global",
    titleDe: "Zahn der Zeit: Frachtringe",
    titleEn: "Tooth of Time: Cargo Rings",
    promptDe: "Jeder Spieler mit mehr als 6 Ausbauten verliert 1 Ausbau. Danach erhalten die Spieler mit den meisten Frachtmodulen 1 halbe Medaille und es wird sofort eine neue Begegnung gezogen.",
    promptEn: "Every player with more than 6 upgrades loses 1 upgrade. Afterwards the players with the most cargo modules gain 1 half medal and another encounter is drawn immediately.",
    choices: [
      createChoice("continue", "Ausfuehren", "Execute", [
        { type: "globalUpgradeLossAbove", threshold: 6, amount: 1 },
        { type: "globalLeaderHalfMedal", metric: "cargo", amount: 1 },
        { type: "drawNextEncounter", reshuffleAll: true }
      ])
    ],
    resultsDe: "Der Zahn der Zeit trifft alle und loest eine Folgebegegnung aus.",
    resultsEn: "The tooth of time affects everyone and triggers a follow-up encounter.",
    implemented: true
  })
];

export function getEncounterDeckIds() {
  return encounterCards
    .filter((card) => card.implemented && card.inDeck !== false)
    .map((card) => card.id);
}

export function getEncounterCardById(cardId) {
  return encounterCards.find((card) => card.id === cardId) ?? null;
}

function createEncounterCard({
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
  notes = ""
}) {
  return {
    id,
    type,
    titleDe,
    titleEn,
    promptDe,
    promptEn,
    title: { de: titleDe, en: titleEn },
    prompt: { de: promptDe, en: promptEn },
    choices,
    results: { de: resultsDe, en: resultsEn },
    requiresInput: false,
    requiresCombat: false,
    effects: [],
    implemented,
    inDeck,
    notes
  };
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
