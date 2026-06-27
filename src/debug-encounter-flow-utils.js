const RESOURCE_LABELS = {
  ore: "Erz",
  fuel: "Treibstoff",
  carbon: "Carbon",
  food: "Nahrung",
  goods: "Handelsware"
};

export const STEP_KINDS = [
  "text",
  "choice",
  "yesNo",
  "multiChoice",
  "resourcePayment",
  "resourceReward",
  "resourceGain",
  "opponentGift",
  "drawOpponentCard",
  "mothershipComparison",
  "combat",
  "jumpShip",
  "shipSelection",
  "grantTradeShip",
  "upgradeGain",
  "upgradeLoss",
  "halfMedal",
  "drawNextEncounter",
  "finish"
];

export const STEP_KIND_LABELS = {
  text: "Text anzeigen",
  choice: "Auswahl",
  yesNo: "Ja/Nein-Auswahl",
  multiChoice: "Mehrfachauswahl",
  resourcePayment: "Rohstoffe abgeben",
  resourceReward: "Beliebigen Rohstoff wählen",
  resourceGain: "Rohstoffe erhalten",
  opponentGift: "Mitspieler schenkt Rohstoff",
  drawOpponentCard: "Karte von Mitspieler ziehen",
  mothershipComparison: "Mutterschiff-Vergleichswurf",
  combat: "Kampf",
  jumpShip: "Raumsprung",
  shipSelection: "Schiff wählen",
  grantTradeShip: "Handelsschiff als Geschenk",
  upgradeGain: "Ausbau erhalten",
  upgradeLoss: "Ausbau verlieren",
  halfMedal: "Halbe Medaille",
  drawNextEncounter: "Neue Begegnung ziehen",
  finish: "Begegnung abschließen"
};

const BRANCH_KEYS = ["onSuccess", "onFailure", "onWin", "onLose"];

export function createEncounterFlows(cards) {
  return cards.map((card) => createFlowFromCard(card));
}

export function cloneFlow(flow) {
  return JSON.parse(JSON.stringify(flow));
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

export function getNextStepId(step, choiceId = null) {
  if (!step) return null;
  if (choiceId) {
    return step.choices?.find((choice) => choice.id === choiceId)?.nextStep ?? null;
  }
  if (step.nextStep) return step.nextStep;
  if (step.choices?.length === 1) return step.choices[0].nextStep ?? null;
  return null;
}

export function validateFlow(flow) {
  const warnings = [];
  if (!flow?.startStepId) warnings.push("Karte ohne Start-Step.");
  const stepIds = new Set();
  const duplicateIds = new Set();
  for (const step of flow?.steps ?? []) {
    if (stepIds.has(step.stepId)) duplicateIds.add(step.stepId);
    stepIds.add(step.stepId);
  }
  for (const id of duplicateIds) warnings.push(`Doppelte Step-ID: ${id}`);
  if (flow?.startStepId && !stepIds.has(flow.startStepId)) warnings.push(`Start-Step fehlt: ${flow.startStepId}`);

  for (const step of flow?.steps ?? []) {
    if (!step.boardText && !step.playerText && step.kind !== "finish") {
      warnings.push(`${step.stepId}: Step ohne Text.`);
    }
    for (const choice of step.choices ?? []) {
      if (!choice.nextStep) warnings.push(`${step.stepId}: Choice "${choice.label}" ohne Ziel-Step.`);
      if (choice.nextStep && !stepIds.has(choice.nextStep)) {
        warnings.push(`${step.stepId}: Choice "${choice.label}" zeigt auf fehlenden Step "${choice.nextStep}".`);
      }
    }
    if (step.nextStep && !stepIds.has(step.nextStep)) {
      warnings.push(`${step.stepId}: nextStep "${step.nextStep}" fehlt.`);
    }
    if (!step.nextStep && !step.choices?.length && step.kind !== "finish") {
      warnings.push(`${step.stepId}: Step ohne Choice, nextStep oder Abschluss.`);
    }
    if (step.effect?.type && !step.nextStep && !step.choices?.length && step.kind !== "finish") {
      warnings.push(`${step.stepId}: Effekt ohne Folge-Step.`);
    }
  }

  const reachable = getReachableStepIds(flow);
  for (const step of flow?.steps ?? []) {
    if (!reachable.has(step.stepId)) warnings.push(`${step.stepId}: Step ist nicht erreichbar.`);
  }
  return warnings;
}

export function exportFlow(flow) {
  return {
    encounterNumber: flow.number,
    encounterId: flow.id,
    title: flow.title,
    source: flow.source,
    startStepId: flow.startStepId,
    steps: flow.steps.map((step) => ({
      stepId: step.stepId,
      kind: step.kind,
      boardText: step.boardText,
      playerText: step.playerText,
      visibility: step.visibility,
      requiresInput: Boolean(step.requiresInput),
      effect: step.effect ?? null,
      choices: step.choices ?? [],
      nextStep: step.nextStep ?? null,
      notes: step.notes ?? ""
    }))
  };
}

export function describeEffect(effect) {
  if (!effect?.type) return "Kein Effekt.";
  switch (effect.type) {
    case "chooseResourceLoss":
      return `${effect.amount ?? 1} Rohstoff(e) abgeben.`;
    case "chooseResourceGain":
      return `${effect.amount ?? 1} beliebige(n) Rohstoff(e) wählen.`;
    case "gainResource":
      return `${effect.amount ?? 1} ${RESOURCE_LABELS[effect.resource] ?? effect.resource ?? "Rohstoff"} erhalten.`;
    case "gainSelectedResources":
      return "Die zuvor gewählten Rohstoffe erhalten.";
    case "loseSelectedResources":
      return "Die zuvor gewählten Rohstoffe verlieren.";
    case "collectGiftsFromOpponents":
      return `Mitspieler geben je ${effect.amount ?? 1} Rohstoff(e).`;
    case "drawFromOpponents":
      return `Von Mitspielern je ${effect.amountPerOpponent ?? 1} Rohstoffkarte ziehen.`;
    case "comparison":
      return `Vergleich: ${effect.metric ?? "Wert"} gegen Nachbar ${effect.neighborOffset ?? "?"}.`;
    case "combat":
      return `Kampf gegen Nachbar ${effect.neighborOffset ?? "?"}.`;
    case "mothershipOutcomeRoll":
      return "Mutterschiff-Wurf mit Ergebniszweigen.";
    case "grantShip":
      return `${effect.shipType === "tradeShip" ? "Handelsschiff" : "Schiff"} als Geschenk.`;
    case "jumpShip":
      return "Eigenes Schiff per Raumsprung versetzen.";
    case "blockFirstShip":
      return "Ein Schiff wird fuer diese Runde blockiert.";
    case "chooseUpgradeGain":
      return `${effect.amount ?? 1} Ausbau erhalten.`;
    case "chooseUpgradeLoss":
      return `${effect.amount ?? 1} Ausbau verlieren.`;
    case "globalUpgradeLossAbove":
      return `Alle mit mehr als ${effect.threshold} echten Anbauten verlieren ${effect.amount ?? 1}.`;
    case "globalLeaderHalfMedal":
      return `Fuehrende Spieler erhalten ${effect.amount ?? 1} halbe Medaille(n).`;
    case "gainHalfMedal":
      return `${effect.amount ?? 1} halbe Medaille(n) erhalten.`;
    case "loseHalfMedal":
      return `${effect.amount ?? 1} halbe Medaille(n) verlieren.`;
    case "drawNextEncounter":
      return "Neue Begegnung ziehen.";
    default:
      return `${effect.type}: ${JSON.stringify(effect)}`;
  }
}

export function getKindForEffect(effect) {
  switch (effect?.type) {
    case "chooseResourceLoss":
      return "resourcePayment";
    case "chooseResourceGain":
      return "resourceReward";
    case "gainResource":
    case "gainSelectedResources":
      return "resourceGain";
    case "collectGiftsFromOpponents":
      return "opponentGift";
    case "drawFromOpponents":
      return "drawOpponentCard";
    case "comparison":
    case "mothershipOutcomeRoll":
      return "mothershipComparison";
    case "combat":
      return "combat";
    case "jumpShip":
      return "jumpShip";
    case "grantShip":
      return "grantTradeShip";
    case "chooseUpgradeGain":
      return "upgradeGain";
    case "chooseUpgradeLoss":
    case "globalUpgradeLossAbove":
      return "upgradeLoss";
    case "gainHalfMedal":
    case "loseHalfMedal":
    case "globalLeaderHalfMedal":
      return "halfMedal";
    case "drawNextEncounter":
      return "drawNextEncounter";
    default:
      return "text";
  }
}

function createFlowFromCard(card) {
  const steps = [];
  const startStep = {
    stepId: "start",
    kind: card.choices?.length ? "choice" : "text",
    boardText: getLocalizedText(card.prompt, card.promptDe),
    playerText: getLocalizedText(card.prompt, card.promptDe),
    visibility: "public",
    requiresInput: Boolean(card.choices?.length),
    choices: (card.choices ?? []).map((choice) => ({
      id: choice.id,
      label: getLocalizedText(choice.label, choice.labelDe),
      nextStep: `choice-${safeStepId(choice.id)}`
    })),
    nextStep: card.choices?.length ? "" : "finish",
    effect: null,
    notes: "Aus aktuellem Encounter-Prompt generiert."
  };
  steps.push(startStep);

  for (const choice of card.choices ?? []) {
    const choiceStepId = `choice-${safeStepId(choice.id)}`;
    const resultText = getLocalizedText(choice.resultText, "");
    const firstEffectStepId = choice.effects?.length ? `${choiceStepId}-effect-1` : "finish";
    steps.push({
      stepId: choiceStepId,
      kind: "text",
      boardText: resultText,
      playerText: resultText || getLocalizedText(choice.label, choice.labelDe),
      visibility: "activePlayer",
      requiresInput: false,
      choices: [],
      nextStep: firstEffectStepId,
      effect: null,
      notes: "Choice-Folgetext aus aktueller Datenstruktur."
    });
    appendEffectSteps(steps, choice.effects ?? [], choiceStepId, 0, "finish");
  }

  steps.push({
    stepId: "finish",
    kind: "finish",
    boardText: getLocalizedText(card.results, card.resultsDe),
    playerText: getLocalizedText(card.results, card.resultsDe) || "Begegnung abschliessen.",
    visibility: "public",
    requiresInput: true,
    choices: [{ id: "finish", label: "Begegnung abschliessen", nextStep: "" }],
    nextStep: "",
    effect: { type: "finishEncounter" },
    notes: "Abschluss-Step."
  });

  return flattenBranchSteps({
    id: card.id,
    number: card.number,
    type: card.type,
    title: card.titleDe,
    titleEn: card.titleEn,
    source: card.source ?? "Begegnungen.xlsx",
    startStepId: "start",
    steps,
    excelRows: card.excelRows ?? [],
    rawCardId: card.id,
    notes: card.notes ?? ""
  });
}

function appendEffectSteps(steps, effects, prefix, startIndex, fallbackNextStep) {
  effects.forEach((effect, index) => {
    const stepNumber = startIndex + index + 1;
    const stepId = `${prefix}-effect-${stepNumber}`;
    const nextStep = effects[index + 1] ? `${prefix}-effect-${stepNumber + 1}` : fallbackNextStep;
    const step = createEffectStep(effect, stepId, nextStep, prefix);
    steps.push(step);
  });
}

function createEffectStep(effect, stepId, nextStep, prefix) {
  const text = getEffectText(effect);
  const step = {
    stepId,
    kind: getKindForEffect(effect),
    boardText: getPublicEffectText(effect),
    playerText: text,
    visibility: isPrivateEffect(effect) ? "activePlayer" : "public",
    requiresInput: requiresInputForEffect(effect),
    choices: [],
    nextStep,
    effect: sanitizeEffect(effect),
    notes: describeEffect(effect)
  };

  if (effect?.type === "comparison") {
    const successStep = `${stepId}-success`;
    const failureStep = `${stepId}-failure`;
    step.choices = [
      { id: "success", label: "Erfolg", nextStep: successStep },
      { id: "failure", label: "Misserfolg", nextStep: failureStep }
    ];
    step.nextStep = "";
    appendBranchStep(step, stepsForBranch(effect.onSuccess, successStep, effect.successText, nextStep, `${prefix}-success`));
    appendBranchStep(step, stepsForBranch(effect.onFailure, failureStep, effect.failureText, nextStep, `${prefix}-failure`));
  }

  if (effect?.type === "combat") {
    const winStep = `${stepId}-win`;
    const loseStep = `${stepId}-lose`;
    step.choices = [
      { id: "win", label: "Sieg", nextStep: winStep },
      { id: "lose", label: "Niederlage", nextStep: loseStep }
    ];
    step.nextStep = "";
    appendBranchStep(step, stepsForBranch(effect.onWin, winStep, effect.winText, nextStep, `${prefix}-win`));
    appendBranchStep(step, stepsForBranch(effect.onLose, loseStep, effect.loseText, nextStep, `${prefix}-lose`));
  }

  if (effect?.type === "mothershipOutcomeRoll") {
    step.choices = (effect.outcomes ?? []).map((outcome, index) => ({
      id: `outcome-${index + 1}`,
      label: `Wurf ${outcome.range?.join("-") ?? index + 1}`,
      nextStep: `${stepId}-outcome-${index + 1}`
    }));
    step.nextStep = "";
    (effect.outcomes ?? []).forEach((outcome, index) => {
      appendBranchStep(step, stepsForBranch(
        outcome.effects,
        `${stepId}-outcome-${index + 1}`,
        outcome.resultText,
        nextStep,
        `${prefix}-outcome-${index + 1}`
      ));
    });
  }

  if (step.requiresInput && !step.choices.length) {
    step.choices = [{ id: "confirm", label: getConfirmLabel(step.kind), nextStep }];
    step.nextStep = "";
  }

  return step;
}

function stepsForBranch(effects = [], branchStepId, textValue, fallbackNextStep, prefix) {
  const branchSteps = [{
    stepId: branchStepId,
    kind: "text",
    boardText: getLocalizedText(textValue, ""),
    playerText: getLocalizedText(textValue, "") || "Folgeschritt.",
    visibility: "public",
    requiresInput: false,
    choices: [],
    nextStep: effects?.length ? `${prefix}-effect-1` : fallbackNextStep,
    effect: null,
    notes: "Ergebniszweig."
  }];
  appendEffectSteps(branchSteps, effects ?? [], prefix, 0, fallbackNextStep);
  return branchSteps;
}

function appendBranchStep(parentStep, branchSteps) {
  parentStep.branchSteps = [...(parentStep.branchSteps ?? []), ...branchSteps];
}

function getEffectText(effect) {
  if (!effect) return "";
  return getLocalizedText(effect.promptText)
    || getLocalizedText(effect.resultText)
    || describeEffect(effect);
}

function getPublicEffectText(effect) {
  if (!effect) return "";
  if (["chooseResourceLoss", "chooseResourceGain", "chooseUpgradeLoss", "chooseUpgradeGain"].includes(effect.type)) {
    return "";
  }
  return getLocalizedText(effect.promptText) || getLocalizedText(effect.resultText) || "";
}

function requiresInputForEffect(effect) {
  return [
    "chooseResourceLoss",
    "chooseResourceGain",
    "chooseUpgradeGain",
    "chooseUpgradeLoss",
    "jumpShip",
    "grantShip"
  ].includes(effect?.type);
}

function isPrivateEffect(effect) {
  return [
    "chooseResourceLoss",
    "chooseResourceGain",
    "chooseUpgradeGain",
    "chooseUpgradeLoss",
    "drawFromOpponents",
    "collectGiftsFromOpponents"
  ].includes(effect?.type);
}

function getConfirmLabel(kind) {
  if (kind === "resourcePayment") return "Rohstoffe abgeben";
  if (kind === "resourceReward") return "Rohstoff wählen";
  if (kind === "upgradeGain") return "Ausbau wählen";
  if (kind === "upgradeLoss") return "Ausbau wählen";
  if (kind === "jumpShip") return "Raumsprung ausführen";
  if (kind === "grantTradeShip") return "Handelsschiff platzieren";
  return "Weiter";
}

function sanitizeEffect(effect) {
  if (!effect) return null;
  const copy = { ...effect };
  for (const key of BRANCH_KEYS) delete copy[key];
  delete copy.outcomes;
  return copy;
}

function getReachableStepIds(flow) {
  const reachable = new Set();
  const queue = [flow?.startStepId].filter(Boolean);
  const stepMap = new Map((flow?.steps ?? []).map((step) => [step.stepId, step]));
  while (queue.length) {
    const stepId = queue.shift();
    if (!stepId || reachable.has(stepId)) continue;
    reachable.add(stepId);
    const step = stepMap.get(stepId);
    if (!step) continue;
    if (step.nextStep) queue.push(step.nextStep);
    for (const choice of step.choices ?? []) {
      if (choice.nextStep) queue.push(choice.nextStep);
    }
  }
  return reachable;
}

function flattenBranchSteps(flow) {
  const flattened = [];
  const appendStep = (step) => {
    const { branchSteps = [], ...cleanStep } = step;
    flattened.push(cleanStep);
    branchSteps.forEach(appendStep);
  };
  flow.steps.forEach(appendStep);
  return { ...flow, steps: flattened };
}

function safeStepId(value) {
  return String(value ?? "step")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "step";
}
