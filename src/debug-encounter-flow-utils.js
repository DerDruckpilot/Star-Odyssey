const RESOURCE_LABELS = {
  ore: "Erz",
  fuel: "Treibstoff",
  carbon: "Carbon",
  food: "Nahrung",
  goods: "Handelsware"
};

export const ENCOUNTER_FLOW_STORAGE_KEY = "starOdyssey.debug.encounterFlows.v1";

export const STEP_KINDS = [
  "text",
  "choice",
  "resourcePayment",
  "resourceRewardChoice",
  "passiveResourceGift",
  "drawCardFromPlayer",
  "mothershipRoll",
  "mothershipCompare",
  "combat",
  "upgradeGain",
  "upgradeLoss",
  "halfMedalGain",
  "halfMedalLoss",
  "shipSelection",
  "boardJump",
  "giftTradeShip",
  "blockShipThisTurn",
  "drawNextEncounter",
  "globalEffect",
  "finishEncounter"
];

export const STEP_KIND_LABELS = {
  text: "Text anzeigen",
  choice: "Auswahl",
  resourcePayment: "Rohstoffe abgeben",
  resourceRewardChoice: "Beliebigen Rohstoff wählen",
  passiveResourceGift: "Passive Rohstoffgabe",
  drawCardFromPlayer: "Karte von Mitspieler ziehen",
  mothershipRoll: "Mutterschiff-Wurf",
  mothershipCompare: "Mutterschiff-Vergleich",
  combat: "Kampf",
  upgradeGain: "Ausbau erhalten",
  upgradeLoss: "Ausbau verlieren",
  halfMedalGain: "Halbe Medaille erhalten",
  halfMedalLoss: "Halbe Medaille verlieren",
  shipSelection: "Schiff wählen",
  boardJump: "Raumsprung",
  giftTradeShip: "Handelsschiff als Geschenk",
  blockShipThisTurn: "Schiff blockieren",
  drawNextEncounter: "Neue Begegnung ziehen",
  globalEffect: "Globaler Effekt",
  finishEncounter: "Begegnung abschließen"
};

export const TARGET_GROUPS = [
  "activePlayer",
  "leftNeighbor",
  "rightNeighbor",
  "secondLeftNeighbor",
  "secondRightNeighbor",
  "allOtherPlayers",
  "allPlayers",
  "selectedPlayer",
  "currentOpponent",
  "piratePlayer"
];

export const TARGET_GROUP_LABELS = {
  activePlayer: "Aktiver Spieler",
  leftNeighbor: "Linker Nachbar",
  rightNeighbor: "Rechter Nachbar",
  secondLeftNeighbor: "Zweiter linker Nachbar",
  secondRightNeighbor: "Zweiter rechter Nachbar",
  allOtherPlayers: "Alle anderen Spieler",
  allPlayers: "Alle Spieler",
  selectedPlayer: "Ausgewählter Spieler",
  currentOpponent: "Aktueller Gegner",
  piratePlayer: "Piratenspieler"
};

export const EFFECT_TYPES = [
  "gainResource",
  "loseResource",
  "chooseResourceToGain",
  "chooseResourcesToPay",
  "transferResource",
  "drawRandomResourceFromPlayer",
  "gainHalfMedal",
  "loseHalfMedal",
  "gainUpgrade",
  "loseUpgrade",
  "giftTradeShip",
  "blockShipThisTurn",
  "performMothershipRoll",
  "compareMothershipValues",
  "performCombat",
  "performBoardJump",
  "drawNextEncounter",
  "finishEncounter",
  "globalEffect"
];

export const EFFECT_TYPE_LABELS = {
  gainResource: "Rohstoff erhalten",
  loseResource: "Rohstoff verlieren",
  chooseResourceToGain: "Beliebigen Rohstoff wählen",
  chooseResourcesToPay: "Rohstoffe abgeben wählen",
  transferResource: "Rohstoff übertragen",
  drawRandomResourceFromPlayer: "Zufällige Karte ziehen",
  gainHalfMedal: "Halbe Medaille erhalten",
  loseHalfMedal: "Halbe Medaille verlieren",
  gainUpgrade: "Ausbau erhalten",
  loseUpgrade: "Ausbau verlieren",
  giftTradeShip: "Handelsschiff schenken",
  blockShipThisTurn: "Schiff blockieren",
  performMothershipRoll: "Mutterschiff-Wurf ausführen",
  compareMothershipValues: "Mutterschiff-Werte vergleichen",
  performCombat: "Kampf ausführen",
  performBoardJump: "Raumsprung ausführen",
  drawNextEncounter: "Neue Begegnung ziehen",
  finishEncounter: "Begegnung abschließen",
  globalEffect: "Generischer Effekt"
};

const KIND_ALIASES = {
  yesNo: "choice",
  multiChoice: "choice",
  resourceReward: "resourceRewardChoice",
  resourceGain: "globalEffect",
  opponentGift: "passiveResourceGift",
  drawOpponentCard: "drawCardFromPlayer",
  mothershipComparison: "mothershipCompare",
  jumpShip: "boardJump",
  grantTradeShip: "giftTradeShip",
  halfMedal: "halfMedalGain",
  finish: "finishEncounter"
};

const EFFECT_ALIASES = {
  chooseResourceLoss: "chooseResourcesToPay",
  chooseResourceGain: "chooseResourceToGain",
  gainSelectedResources: "gainResource",
  loseSelectedResources: "loseResource",
  collectGiftsFromOpponents: "transferResource",
  drawFromOpponents: "drawRandomResourceFromPlayer",
  comparison: "compareMothershipValues",
  mothershipOutcomeRoll: "performMothershipRoll",
  combat: "performCombat",
  grantShip: "giftTradeShip",
  jumpShip: "performBoardJump",
  blockFirstShip: "blockShipThisTurn",
  chooseUpgradeGain: "gainUpgrade",
  chooseUpgradeLoss: "loseUpgrade",
  globalUpgradeLossAbove: "loseUpgrade",
  globalLeaderHalfMedal: "gainHalfMedal"
};

export function createEncounterFlows(cards) {
  return cards.map((card) => normalizeFlow(createFlowFromCard(card)));
}

export function cloneFlow(flow) {
  return JSON.parse(JSON.stringify(flow));
}

export function normalizeFlow(flow) {
  const normalized = {
    encounterNumber: flow?.encounterNumber ?? flow?.number ?? 0,
    encounterId: flow?.encounterId ?? flow?.id ?? "",
    number: flow?.number ?? flow?.encounterNumber ?? 0,
    id: flow?.id ?? flow?.encounterId ?? "",
    title: flow?.title ?? "",
    type: flow?.type ?? "encounter",
    source: flow?.source ?? "debug",
    startStepId: flow?.startStepId ?? flow?.steps?.[0]?.stepId ?? "start",
    steps: (flow?.steps ?? []).map((step) => normalizeStep(step))
  };
  return normalized;
}

export function normalizeStep(step = {}) {
  const activeChoices = normalizeChoiceArray(step.activePlayerChoices ?? step.choices ?? []);
  const passiveChoices = normalizeChoiceArray(step.passivePlayerChoices ?? []);
  const legacyEffect = step.effect ? [step.effect] : [];
  const activeEffects = normalizeEffectArray(step.activePlayerEffects ?? legacyEffect);
  const passiveEffects = normalizeEffectArray(step.passivePlayerEffects ?? []);
  const genericEffects = normalizeEffectArray(step.effects ?? []);
  const kind = normalizeKind(step.kind ?? getKindForEffect(activeEffects[0]));
  return {
    stepId: String(step.stepId ?? "step"),
    kind,
    boardText: getLocalizedText(step.boardText, ""),
    activePlayerText: getLocalizedText(step.activePlayerText ?? step.playerText, ""),
    activePlayerChoices: activeChoices,
    activePlayerInputs: normalizeArray(step.activePlayerInputs),
    activePlayerEffects: activeEffects,
    passivePlayerText: getLocalizedText(step.passivePlayerText, ""),
    passivePlayerTarget: step.passivePlayerTarget ?? inferPassiveTarget(kind, passiveEffects, activeEffects),
    passivePlayerChoices: passiveChoices,
    passivePlayerInputs: normalizeArray(step.passivePlayerInputs),
    passivePlayerEffects: passiveEffects,
    observerText: getLocalizedText(step.observerText, ""),
    visibility: step.visibility ?? "public",
    requiresInput: Boolean(step.requiresInput || activeChoices.length || passiveChoices.length),
    effects: genericEffects,
    effect: activeEffects[0] ?? null,
    choices: activeChoices,
    nextStep: step.nextStep ?? "",
    notes: getLocalizedText(step.notes, "")
  };
}

export function createBlankStep(stepId = "new_step") {
  return normalizeStep({
    stepId,
    kind: "text",
    boardText: "",
    activePlayerText: "",
    passivePlayerText: "",
    passivePlayerTarget: "",
    observerText: "{activePlayerName} ist in einer Begegnung.",
    visibility: "activePlayer",
    requiresInput: false,
    nextStep: "",
    notes: ""
  });
}

export function createBlankChoice(flow) {
  return {
    id: `choice_${Date.now().toString(36)}`,
    label: "Weiter",
    labelDe: "Weiter",
    labelEn: "Continue",
    nextStep: flow?.startStepId ?? "",
    nextStepId: flow?.startStepId ?? "",
    effects: [],
    condition: "",
    notes: ""
  };
}

export function createBlankEffect() {
  return {
    effectType: "gainResource",
    type: "gainResource",
    target: "activePlayer",
    amount: 1,
    resourceType: "",
    resource: "",
    upgradeType: "",
    medalAmount: 0.5,
    publicLogText: "",
    privateLogText: "",
    nextStepAfterEffect: "",
    notes: ""
  };
}

export function getLocalizedText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value?.de) return value.de;
  if (value?.en) return value.en;
  return fallback;
}

export function getStep(flow, stepId) {
  return flow?.steps?.find((step) => step.stepId === stepId) ?? null;
}

export function getStartStep(flow) {
  return getStep(flow, flow?.startStepId) ?? flow?.steps?.[0] ?? null;
}

export function getNextStepId(step, choiceId = null, scope = "active") {
  if (!step) return null;
  if (choiceId) {
    const choices = getChoicesForScope(step, scope);
    const choice = choices.find((item) => item.id === choiceId) ?? getAllChoices(step).find((item) => item.id === choiceId);
    return choice?.nextStepId ?? choice?.nextStep ?? null;
  }
  if (step.nextStep) return step.nextStep;
  const choices = getChoicesForScope(step, scope);
  if (choices.length === 1) return choices[0].nextStepId ?? choices[0].nextStep ?? null;
  return null;
}

export function getChoicesForScope(step, scope = "active") {
  if (!step) return [];
  if (scope === "passive") return step.passivePlayerChoices ?? [];
  if (scope === "observer") return [];
  return step.activePlayerChoices ?? step.choices ?? [];
}

export function getAllChoices(step) {
  return [
    ...(step?.activePlayerChoices ?? []),
    ...(step?.passivePlayerChoices ?? []),
    ...(step?.choices ?? [])
  ];
}

export function validateFlow(flow) {
  const warnings = [];
  const normalized = normalizeFlow(flow);
  if (!normalized.startStepId) warnings.push("Karte ohne Start-Step.");
  const stepIds = new Set();
  const duplicateIds = new Set();
  for (const step of normalized.steps) {
    if (!step.stepId) warnings.push("Step ohne ID.");
    if (stepIds.has(step.stepId)) duplicateIds.add(step.stepId);
    stepIds.add(step.stepId);
  }
  for (const id of duplicateIds) warnings.push(`Doppelte Step-ID: ${id}`);
  if (normalized.startStepId && !stepIds.has(normalized.startStepId)) {
    warnings.push(`Start-Step fehlt: ${normalized.startStepId}`);
  }

  for (const step of normalized.steps) {
    const isFinish = step.kind === "finishEncounter" || hasEffect(step, "finishEncounter");
    const allChoices = getAllChoices(step);
    const allEffects = [...(step.activePlayerEffects ?? []), ...(step.passivePlayerEffects ?? []), ...(step.effects ?? [])];

    if (!step.boardText && !step.activePlayerText && !step.passivePlayerText && !step.observerText && !isFinish) {
      warnings.push(`${step.stepId}: Step ohne Text.`);
    }
    validateChoiceTargets(step, step.activePlayerChoices, "Aktiv", stepIds, warnings);
    validateChoiceTargets(step, step.passivePlayerChoices, "Passiv", stepIds, warnings);
    if (step.nextStep && !stepIds.has(step.nextStep)) warnings.push(`${step.stepId}: nextStep "${step.nextStep}" fehlt.`);
    if (!step.nextStep && !allChoices.length && !allEffects.length && !isFinish) {
      warnings.push(`${step.stepId}: Step ohne Choice, Effekt oder Abschluss.`);
    }
    if (needsPassiveTarget(step) && !step.passivePlayerTarget) {
      warnings.push(`${step.stepId}: Passive Aktion ohne passive Zielgruppe.`);
    }
    for (const effect of allEffects) validateEffect(step, effect, stepIds, warnings);
  }

  const reachable = getReachableStepIds(normalized);
  for (const step of normalized.steps) {
    if (!reachable.has(step.stepId)) warnings.push(`${step.stepId}: Step ist nicht erreichbar.`);
  }
  return warnings;
}

export function exportFlow(flow) {
  const normalized = normalizeFlow(flow);
  return {
    encounterNumber: normalized.number,
    encounterId: normalized.id,
    title: normalized.title,
    type: normalized.type,
    source: normalized.source,
    startStepId: normalized.startStepId,
    steps: normalized.steps.map((step) => ({
      stepId: step.stepId,
      kind: step.kind,
      boardText: step.boardText,
      activePlayerText: step.activePlayerText,
      activePlayerChoices: step.activePlayerChoices ?? [],
      activePlayerInputs: step.activePlayerInputs ?? [],
      activePlayerEffects: step.activePlayerEffects ?? [],
      passivePlayerText: step.passivePlayerText,
      passivePlayerTarget: step.passivePlayerTarget,
      passivePlayerChoices: step.passivePlayerChoices ?? [],
      passivePlayerInputs: step.passivePlayerInputs ?? [],
      passivePlayerEffects: step.passivePlayerEffects ?? [],
      observerText: step.observerText,
      visibility: step.visibility,
      requiresInput: Boolean(step.requiresInput),
      effects: step.effects ?? [],
      nextStep: step.nextStep ?? "",
      notes: step.notes ?? ""
    }))
  };
}

export function describeEffect(effect) {
  const type = effect?.effectType ?? effect?.type;
  if (!type) return "Kein Effekt.";
  switch (normalizeEffectType(type)) {
    case "chooseResourcesToPay":
      return `${effect.amount ?? 1} Rohstoff(e) abgeben.`;
    case "chooseResourceToGain":
      return `${effect.amount ?? 1} beliebige(n) Rohstoff(e) wählen.`;
    case "gainResource":
      return `${effect.amount ?? 1} ${RESOURCE_LABELS[effect.resourceType ?? effect.resource] ?? effect.resourceType ?? effect.resource ?? "Rohstoff"} erhalten.`;
    case "loseResource":
      return `${effect.amount ?? 1} Rohstoff(e) verlieren.`;
    case "transferResource":
      return `Rohstoff(e) an ${TARGET_GROUP_LABELS[effect.target] ?? effect.target ?? "Ziel"} übertragen.`;
    case "drawRandomResourceFromPlayer":
      return "Zufällige Rohstoffkarte von einem Mitspieler ziehen.";
    case "performMothershipRoll":
      return "Mutterschiff-Wurf ausführen.";
    case "compareMothershipValues":
      return `Mutterschiff-Vergleich: ${effect.metric ?? "Wert"}.`;
    case "performCombat":
      return "Kampf ausführen.";
    case "performBoardJump":
      return "Raumsprung auf dem Spielfeld ausführen.";
    case "giftTradeShip":
      return "Handelsschiff als Geschenk erhalten.";
    case "blockShipThisTurn":
      return "Schiff für diese Runde blockieren.";
    case "gainUpgrade":
      return `${effect.amount ?? 1} Ausbau erhalten.`;
    case "loseUpgrade":
      return `${effect.amount ?? 1} Ausbau verlieren.`;
    case "gainHalfMedal":
      return `${effect.medalAmount ?? effect.amount ?? 0.5} halbe Medaille(n) erhalten.`;
    case "loseHalfMedal":
      return `${effect.medalAmount ?? effect.amount ?? 0.5} halbe Medaille(n) verlieren.`;
    case "drawNextEncounter":
      return "Neue Begegnung ziehen.";
    case "finishEncounter":
      return "Begegnung abschließen.";
    default:
      return `${type}: ${JSON.stringify(effect)}`;
  }
}

export function getKindForEffect(effect) {
  const type = normalizeEffectType(effect?.effectType ?? effect?.type);
  switch (type) {
    case "chooseResourcesToPay":
      return "resourcePayment";
    case "chooseResourceToGain":
      return "resourceRewardChoice";
    case "transferResource":
      return "passiveResourceGift";
    case "drawRandomResourceFromPlayer":
      return "drawCardFromPlayer";
    case "performMothershipRoll":
      return "mothershipRoll";
    case "compareMothershipValues":
      return "mothershipCompare";
    case "performCombat":
      return "combat";
    case "performBoardJump":
      return "boardJump";
    case "giftTradeShip":
      return "giftTradeShip";
    case "blockShipThisTurn":
      return "blockShipThisTurn";
    case "gainUpgrade":
      return "upgradeGain";
    case "loseUpgrade":
      return "upgradeLoss";
    case "gainHalfMedal":
      return "halfMedalGain";
    case "loseHalfMedal":
      return "halfMedalLoss";
    case "drawNextEncounter":
      return "drawNextEncounter";
    case "finishEncounter":
      return "finishEncounter";
    default:
      return "text";
  }
}

export function readStoredEncounterFlows() {
  try {
    const raw = localStorage.getItem(ENCOUNTER_FLOW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function mergeStoredEncounterFlows(baseFlows, storedFlows) {
  const storedById = new Map((storedFlows ?? []).map((flow) => {
    const normalized = normalizeFlow(flow);
    return [normalized.id || normalized.encounterId, normalized];
  }));
  return baseFlows.map((flow) => {
    const stored = storedById.get(flow.id);
    return stored ? normalizeFlow({ ...flow, ...stored, number: flow.number, id: flow.id, type: flow.type, source: stored.source ?? flow.source }) : normalizeFlow(flow);
  });
}

function createFlowFromCard(card) {
  const steps = [];
  const startStep = normalizeStep({
    stepId: "start",
    kind: card.choices?.length ? "choice" : "text",
    boardText: getLocalizedText(card.prompt, card.promptDe),
    activePlayerText: getLocalizedText(card.prompt, card.promptDe),
    observerText: "{activePlayerName} hat eine Begegnung ausgelöst.",
    visibility: "public",
    requiresInput: Boolean(card.choices?.length),
    activePlayerChoices: (card.choices ?? []).map((choice) => ({
      id: choice.id,
      label: getLocalizedText(choice.label, choice.labelDe),
      labelDe: getLocalizedText(choice.label, choice.labelDe),
      labelEn: getLocalizedText(choice.label, choice.labelEn),
      nextStepId: `choice-${safeStepId(choice.id)}`
    })),
    nextStep: card.choices?.length ? "" : "finish",
    notes: "Aus aktuellem Encounter-Prompt generiert."
  });
  steps.push(startStep);

  for (const choice of card.choices ?? []) {
    const choiceStepId = `choice-${safeStepId(choice.id)}`;
    const resultText = getLocalizedText(choice.resultText, "");
    const firstEffectStepId = choice.effects?.length ? `${choiceStepId}-effect-1` : "finish";
    steps.push(normalizeStep({
      stepId: choiceStepId,
      kind: choice.effects?.[0] ? getKindForEffect(choice.effects[0]) : "text",
      boardText: resultText,
      activePlayerText: resultText,
      observerText: "{activePlayerName} ist noch in einer Begegnung.",
      visibility: "activePlayer",
      requiresInput: Boolean(choice.effects?.length),
      nextStep: firstEffectStepId,
      notes: "Folgetext aus Encounter-Choice."
    }));

    (choice.effects ?? []).forEach((effect, index) => {
      const stepId = `${choiceStepId}-effect-${index + 1}`;
      const nextStep = index + 1 < choice.effects.length ? `${choiceStepId}-effect-${index + 2}` : "finish";
      steps.push(createEffectStep(stepId, effect, nextStep));
    });
  }

  steps.push(normalizeStep({
    stepId: "finish",
    kind: "finishEncounter",
    boardText: "",
    activePlayerText: "Begegnung abschließen.",
    observerText: "{activePlayerName} hat die Begegnung abgeschlossen.",
    activePlayerChoices: [],
    activePlayerEffects: [{ ...createBlankEffect(), effectType: "finishEncounter", type: "finishEncounter", amount: "" }],
    visibility: "activePlayer",
    requiresInput: true,
    notes: "Standardabschluss."
  }));

  return {
    number: card.number,
    id: card.id,
    title: card.titleDe ?? card.title ?? `Begegnung ${card.number}`,
    type: card.type,
    source: "src/data/encounterCards.js",
    startStepId: "start",
    steps
  };
}

function createEffectStep(stepId, effect, nextStep) {
  const kind = getKindForEffect(effect);
  const normalizedEffect = normalizeEffect(effect);
  return normalizeStep({
    stepId,
    kind,
    boardText: "",
    activePlayerText: describeEffect(normalizedEffect),
    activePlayerEffects: [normalizedEffect],
    passivePlayerText: kind === "passiveResourceGift" ? "Wähle einen Rohstoff, den du {activePlayerName} schenken möchtest." : "",
    passivePlayerTarget: kind === "passiveResourceGift" ? "allOtherPlayers" : "",
    observerText: "{activePlayerName} ist noch in einer Begegnung.",
    visibility: "activePlayer",
    requiresInput: true,
    nextStep,
    notes: "Mechanik aus Encounter-Effekt generiert."
  });
}

function normalizeKind(kind) {
  const mapped = KIND_ALIASES[kind] ?? kind ?? "text";
  return STEP_KINDS.includes(mapped) ? mapped : "text";
}

function normalizeChoiceArray(choices) {
  return normalizeArray(choices).map((choice, index) => normalizeChoice(choice, index));
}

function normalizeChoice(choice, index = 0) {
  const label = getLocalizedText(choice?.label, choice?.labelDe ?? `Choice ${index + 1}`);
  const labelDe = getLocalizedText(choice?.labelDe ?? choice?.label, label);
  const labelEn = getLocalizedText(choice?.labelEn, label);
  const nextStep = choice?.nextStepId ?? choice?.nextStep ?? "";
  return {
    id: String(choice?.id ?? `choice_${index + 1}`),
    label,
    labelDe,
    labelEn,
    nextStep,
    nextStepId: nextStep,
    effects: normalizeEffectArray(choice?.effects),
    condition: choice?.condition ?? "",
    notes: getLocalizedText(choice?.notes, "")
  };
}

function normalizeEffectArray(effects) {
  return normalizeArray(effects).map((effect) => normalizeEffect(effect));
}

function normalizeEffect(effect = {}) {
  const type = normalizeEffectType(effect.effectType ?? effect.type);
  return {
    ...effect,
    effectType: type,
    type,
    target: effect.target ?? inferEffectTarget(type, effect),
    amount: normalizeNumberOrEmpty(effect.amount, type.includes("HalfMedal") ? 0.5 : 1),
    resourceType: effect.resourceType ?? effect.resource ?? "",
    resource: effect.resource ?? effect.resourceType ?? "",
    upgradeType: effect.upgradeType ?? effect.upgrade ?? "",
    medalAmount: normalizeNumberOrEmpty(effect.medalAmount ?? effect.amount, type.includes("HalfMedal") ? 0.5 : ""),
    publicLogText: getLocalizedText(effect.publicLogText, ""),
    privateLogText: getLocalizedText(effect.privateLogText, ""),
    nextStepAfterEffect: effect.nextStepAfterEffect ?? effect.nextStep ?? "",
    notes: getLocalizedText(effect.notes, "")
  };
}

function normalizeEffectType(type) {
  const mapped = EFFECT_ALIASES[type] ?? type ?? "gainResource";
  return EFFECT_TYPES.includes(mapped) ? mapped : "globalEffect";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeNumberOrEmpty(value, fallback) {
  if (value === "" || value == null) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function inferPassiveTarget(kind, passiveEffects, activeEffects) {
  if (kind === "passiveResourceGift") return "allOtherPlayers";
  const effects = [...passiveEffects, ...activeEffects];
  if (effects.some((effect) => effect.effectType === "transferResource")) return "allOtherPlayers";
  return "";
}

function inferEffectTarget(type, effect) {
  if (type === "transferResource" || type === "drawRandomResourceFromPlayer") return "allOtherPlayers";
  return effect.target ?? "activePlayer";
}

function needsPassiveTarget(step) {
  if (step.kind === "passiveResourceGift") return true;
  return [...(step.passivePlayerEffects ?? []), ...(step.effects ?? [])].some((effect) => (
    ["transferResource", "drawRandomResourceFromPlayer"].includes(effect.effectType)
  ));
}

function hasEffect(step, effectType) {
  return [...(step.activePlayerEffects ?? []), ...(step.passivePlayerEffects ?? []), ...(step.effects ?? [])]
    .some((effect) => effect.effectType === effectType || effect.type === effectType);
}

function validateChoiceTargets(step, choices, label, stepIds, warnings) {
  for (const choice of choices ?? []) {
    const choiceLabel = choice.labelDe || choice.label || choice.id;
    const target = choice.nextStepId ?? choice.nextStep;
    if (!target) warnings.push(`${step.stepId}: ${label}-Choice "${choiceLabel}" ohne Ziel-Step.`);
    if (target && !stepIds.has(target)) {
      warnings.push(`${step.stepId}: ${label}-Choice "${choiceLabel}" zeigt auf fehlenden Step "${target}".`);
    }
  }
}

function validateEffect(step, effect, stepIds, warnings) {
  const type = effect.effectType ?? effect.type;
  if (!type) warnings.push(`${step.stepId}: Effekt ohne Typ.`);
  if (["gainResource", "loseResource", "chooseResourcesToPay", "chooseResourceToGain"].includes(type) && effect.amount === "") {
    warnings.push(`${step.stepId}: Effekt "${type}" ohne Anzahl.`);
  }
  if (["gainUpgrade", "loseUpgrade"].includes(type) && !effect.upgradeType) {
    warnings.push(`${step.stepId}: Effekt "${type}" ohne Ausbau-Typ.`);
  }
  if (effect.nextStepAfterEffect && !stepIds.has(effect.nextStepAfterEffect)) {
    warnings.push(`${step.stepId}: Effekt-Folge-Step "${effect.nextStepAfterEffect}" fehlt.`);
  }
}

function getReachableStepIds(flow) {
  const reachable = new Set();
  const pending = [flow?.startStepId].filter(Boolean);
  while (pending.length) {
    const stepId = pending.shift();
    if (!stepId || reachable.has(stepId)) continue;
    reachable.add(stepId);
    const step = getStep(flow, stepId);
    if (!step) continue;
    const targets = [
      step.nextStep,
      ...getAllChoices(step).map((choice) => choice.nextStepId ?? choice.nextStep),
      ...(step.activePlayerEffects ?? []).map((effect) => effect.nextStepAfterEffect),
      ...(step.passivePlayerEffects ?? []).map((effect) => effect.nextStepAfterEffect),
      ...(step.effects ?? []).map((effect) => effect.nextStepAfterEffect)
    ].filter(Boolean);
    for (const target of targets) {
      if (!reachable.has(target)) pending.push(target);
    }
  }
  return reachable;
}

function safeStepId(value) {
  return String(value ?? "step")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "step";
}
