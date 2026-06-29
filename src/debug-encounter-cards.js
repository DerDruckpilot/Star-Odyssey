import { getAllEncounterCards, getEncounterDeckIds } from "./data/encounterCards.js";
import {
  EFFECT_TYPE_LABELS,
  EFFECT_TYPES,
  ENCOUNTER_FLOW_STORAGE_KEY,
  STEP_KIND_LABELS,
  STEP_KINDS,
  TARGET_GROUP_LABELS,
  TARGET_GROUPS,
  cloneFlow,
  createBlankChoice,
  createBlankEffect,
  createBlankStep,
  createEncounterFlows,
  describeEffect,
  exportFlow,
  getChoicesForScope,
  getNextStepId,
  getStartStep,
  getStep,
  mergeStoredEncounterFlows,
  normalizeFlow,
  readStoredEncounterFlows,
  validateFlow
} from "./debug-encounter-flow-utils.js";

const RESOURCE_TYPES = ["", "ore", "fuel", "carbon", "food", "goods"];
const RESOURCE_LABELS = {
  "": "Beliebig / nicht gesetzt",
  ore: "Erz",
  fuel: "Treibstoff",
  carbon: "Carbon",
  food: "Nahrung",
  goods: "Handelsware"
};

const cards = getAllEncounterCards();
const activeDeckIds = new Set(getEncounterDeckIds());
const baseFlows = createEncounterFlows(cards);
let flows = mergeStoredEncounterFlows(baseFlows, readStoredEncounterFlows());

const state = {
  search: "",
  type: "all",
  implemented: "all",
  selectedFlowId: flows.find((flow) => activeDeckIds.has(flow.id))?.id ?? flows[0]?.id ?? null,
  selectedStepId: null,
  previewMode: "active",
  simulationStepId: null,
  simulationHistory: []
};

const searchInput = document.querySelector("#card-search");
const typeFilter = document.querySelector("#type-filter");
const implementedFilter = document.querySelector("#implemented-filter");
const statsTarget = document.querySelector("#card-stats");
const listTarget = document.querySelector("#card-list");
const boardPreviewTarget = document.querySelector("#board-preview");
const boardPreviewStepTarget = document.querySelector("#board-preview-step");
const playerPreviewTarget = document.querySelector("#encounter-simulator");
const selectedCardLabel = document.querySelector("#selected-card-label");
const validationTarget = document.querySelector("#flow-validation");
const editorForm = document.querySelector("#step-editor");
const exportOutput = document.querySelector("#export-output");
const activePreviewButton = document.querySelector("#preview-active-player");
const passivePreviewButton = document.querySelector("#preview-passive-player");
const observerPreviewButton = document.querySelector("#preview-observer-player");
const importFileInput = document.querySelector("#import-file");

initializeFilters();
bindControls();
ensureSelectedStep();
render();

function initializeFilters() {
  const types = [...new Set(cards.map((card) => card.type))].sort();
  typeFilter.replaceChildren(createOption("all", "Alle"), ...types.map((type) => createOption(type, type)));
}

function bindControls() {
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim().toLowerCase();
    renderListAndStats();
  });
  typeFilter.addEventListener("change", () => {
    state.type = typeFilter.value;
    renderListAndStats();
  });
  implementedFilter.addEventListener("change", () => {
    state.implemented = implementedFilter.value;
    renderListAndStats();
  });
  document.querySelector("#expand-all").addEventListener("click", () => setAllDetails(true));
  document.querySelector("#collapse-all").addEventListener("click", () => setAllDetails(false));
  document.querySelector("#start-simulation").addEventListener("click", () => {
    const flow = getSelectedFlow();
    state.simulationStepId = getStartStep(flow)?.stepId ?? null;
    state.simulationHistory = [];
    state.selectedStepId = state.simulationStepId ?? state.selectedStepId;
    render();
  });
  document.querySelector("#reset-simulation").addEventListener("click", () => {
    state.simulationStepId = null;
    state.simulationHistory = [];
    ensureSelectedStep();
    render();
  });
  document.querySelector("#add-step").addEventListener("click", addStep);
  document.querySelector("#duplicate-step").addEventListener("click", duplicateStep);
  document.querySelector("#delete-step").addEventListener("click", deleteStep);
  document.querySelector("#move-step-up").addEventListener("click", () => moveStep(-1));
  document.querySelector("#move-step-down").addEventListener("click", () => moveStep(1));
  document.querySelector("#reset-selected").addEventListener("click", resetSelectedEncounter);
  document.querySelector("#export-selected").addEventListener("click", exportSelectedFlow);
  document.querySelector("#export-all").addEventListener("click", exportAllFlows);
  document.querySelector("#save-local").addEventListener("click", () => saveFlowsToLocalStorage(true));
  document.querySelector("#import-flows").addEventListener("click", importFlowsFromTextarea);
  document.querySelector("#reset-local").addEventListener("click", resetLocalEdits);
  activePreviewButton.addEventListener("click", () => setPreviewMode("active"));
  passivePreviewButton.addEventListener("click", () => setPreviewMode("passive"));
  observerPreviewButton.addEventListener("click", () => setPreviewMode("observer"));
  importFileInput.addEventListener("change", importFlowsFromFile);
}

function render() {
  renderListAndStats();
  renderPreviews();
  renderEditor();
  updateExportOutput();
}

function renderListAndStats() {
  const visibleFlows = getVisibleFlows();
  renderStats(visibleFlows);
  renderCards(visibleFlows);
}

function renderStats(visibleFlows) {
  const implementedCount = cards.filter((card) => card.implemented).length;
  statsTarget.replaceChildren(
    renderStat("Gesamt", cards.length),
    renderStat("Aktives Deck", activeDeckIds.size),
    renderStat("Implementiert", implementedCount),
    renderStat("Nicht implementiert", cards.length - implementedCount),
    renderStat("Sichtbar", visibleFlows.length)
  );
}

function getVisibleFlows() {
  return flows.filter((flow) => {
    const card = getCardForFlow(flow);
    if (state.type !== "all" && flow.type !== state.type) return false;
    if (state.implemented === "implemented" && !card?.implemented) return false;
    if (state.implemented === "pending" && card?.implemented) return false;
    if (!state.search) return true;
    return [
      flow.id,
      flow.number,
      flow.title,
      flow.type,
      JSON.stringify(flow.steps)
    ].filter(Boolean).join(" ").toLowerCase().includes(state.search);
  });
}

function renderCards(visibleFlows) {
  listTarget.replaceChildren();
  if (visibleFlows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "debug-field";
    empty.textContent = "Keine Begegnung passt zu den aktuellen Filtern.";
    listTarget.append(empty);
    return;
  }
  for (const flow of visibleFlows) listTarget.append(renderFlowDetails(flow));
}

function renderFlowDetails(flow) {
  const card = getCardForFlow(flow);
  const details = document.createElement("details");
  details.dataset.cardId = flow.id;
  details.open = flow.id === state.selectedFlowId;

  const summary = document.createElement("summary");
  summary.append(
    renderTitle(`${flow.number ?? "?"}. ${flow.id}`, flow.title, card?.titleEn ?? ""),
    renderPill(flow.type),
    renderPill(activeDeckIds.has(flow.id) ? "deck" : "reserve", activeDeckIds.has(flow.id) ? "debug-pill--ok" : "")
  );
  summary.addEventListener("click", () => {
    selectFlow(flow.id);
    ensureSelectedStep();
    queueMicrotask(render);
  });

  const body = document.createElement("div");
  body.className = "debug-card-body";
  const stepList = document.createElement("div");
  stepList.className = "encounter-step-list";
  for (const step of flow.steps) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `encounter-step-row${step.stepId === state.selectedStepId ? " is-active" : ""}`;
    button.innerHTML = [
      `<strong>${escapeHtml(step.stepId)}</strong>`,
      `<span>${escapeHtml(STEP_KIND_LABELS[step.kind] ?? step.kind)}</span>`,
      `<small>${escapeHtml(step.activePlayerText || step.passivePlayerText || step.boardText || "-")}</small>`
    ].join("");
    button.addEventListener("click", () => {
      selectFlow(flow.id);
      state.selectedStepId = step.stepId;
      state.simulationStepId = step.stepId;
      render();
    });
    stepList.append(button);
  }

  body.append(
    renderFieldGrid([
      ["Quelle", flow.source],
      ["Start-Step", flow.startStepId],
      ["Steps", flow.steps.length],
      ["Excel-Zeilen", formatExcelRows(card)]
    ]),
    stepList
  );
  details.append(summary, body);
  return details;
}

function renderPreviews() {
  const flow = getSelectedFlow();
  const step = getCurrentStep();
  activePreviewButton.classList.toggle("is-active", state.previewMode === "active");
  passivePreviewButton.classList.toggle("is-active", state.previewMode === "passive");
  observerPreviewButton.classList.toggle("is-active", state.previewMode === "observer");
  selectedCardLabel.textContent = flow ? `${flow.number}. ${flow.title}` : "";
  boardPreviewStepTarget.textContent = step ? step.stepId : "";
  renderBoardPreview(flow, step);
  renderPlayerPreview(flow, step);
}

function renderBoardPreview(flow, step) {
  boardPreviewTarget.replaceChildren();
  const overlay = document.createElement("div");
  overlay.className = "encounter-board-overlay-preview";
  overlay.append(
    createElement("strong", flow ? `Begegnung ${flow.number}` : "Keine Begegnung"),
    createElement("p", replaceTokens(step?.boardText || "Kein öffentlicher Spielfeldtext für diesen Step."))
  );
  boardPreviewTarget.append(renderMiniBoard(), overlay);
}

function renderPlayerPreview(flow, step) {
  playerPreviewTarget.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "encounter-controller-preview-panel";
  panel.append(createElement("h3", getPreviewHeading()));

  if (!flow || !step) {
    panel.append(renderNotice("Keine Begegnung ausgewählt."));
    playerPreviewTarget.append(panel);
    return;
  }

  const text = getPreviewText(step);
  if (text) panel.append(createElement("p", replaceTokens(text)));

  const effects = getPreviewEffects(step);
  for (const effect of effects) panel.append(renderNotice(describeEffect(effect)));

  const choices = getPreviewChoices(step);
  const actionRow = document.createElement("div");
  actionRow.className = "encounter-preview-actions";
  if (choices.length) {
    for (const choice of choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.labelDe || choice.label || choice.id;
      button.addEventListener("click", () => advanceSimulation(choice.id, state.previewMode));
      actionRow.append(button);
    }
  } else if (effects.length && state.previewMode !== "observer") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Aktion simulieren";
    button.addEventListener("click", () => advanceSimulation(null, state.previewMode));
    actionRow.append(button);
  } else if (state.previewMode === "active" && hasPassiveWork(step)) {
    actionRow.append(renderNotice("Warte, bis die betroffenen passiven Spieler gehandelt haben."));
  } else {
    actionRow.append(renderNotice("Keine Aktionen verfügbar."));
  }
  panel.append(actionRow);

  if (state.simulationHistory.length > 0) {
    const history = document.createElement("p");
    history.className = "debug-sim-history";
    history.textContent = `Simulation: ${state.simulationHistory.join(" -> ")}`;
    panel.append(history);
  }
  playerPreviewTarget.append(panel);
}

function renderEditor() {
  const flow = getSelectedFlow();
  const step = getSelectedStep();
  editorForm.replaceChildren();
  validationTarget.replaceChildren();
  if (!flow || !step) {
    editorForm.append(renderNotice("Keine Begegnung oder kein Step ausgewählt."));
    return;
  }

  renderValidation(flow);
  editorForm.append(
    renderEncounterMetaEditor(flow),
    renderStepBasicsEditor(flow, step),
    renderTextEditor(step),
    renderChoicesEditor(flow, step, "active", "Aktive Spieler-Choices"),
    renderChoicesEditor(flow, step, "passive", "Passive Spieler-Choices"),
    renderEffectsEditor(flow, step, "active", "Aktive Spieler-Effekte"),
    renderEffectsEditor(flow, step, "passive", "Passive Spieler-Effekte"),
    renderEffectsEditor(flow, step, "generic", "Allgemeine Effekte"),
    renderNotesEditor(step)
  );
}

function renderEncounterMetaEditor(flow) {
  const section = renderEditorSection("Begegnung");
  section.append(
    renderInput("Titel", flow.title, (value) => {
      flow.title = value;
      persistSoft();
      renderListAndStats();
      renderPreviews();
    }),
    renderSelect("Start-Step", flow.startStepId, getStepOptions(flow), (value) => {
      flow.startStepId = value;
      persistAndRender();
    })
  );
  return section;
}

function renderStepBasicsEditor(flow, step) {
  const section = renderEditorSection("Step-Eigenschaften");
  section.append(
    renderInput("Step-ID", step.stepId, (value) => {
      const oldId = step.stepId;
      step.stepId = sanitizeStepId(value);
      updateStepReferences(flow, oldId, step.stepId);
      state.selectedStepId = step.stepId;
      state.simulationStepId = step.stepId;
      persistAndRender();
    }),
    renderSelect("Step-Typ", step.kind, STEP_KINDS.map((kind) => [kind, STEP_KIND_LABELS[kind] ?? kind]), (value) => {
      step.kind = value;
      if (value === "passiveResourceGift" && !step.passivePlayerTarget) step.passivePlayerTarget = "allOtherPlayers";
      persistAndRender();
    }),
    renderSelect("Sichtbarkeit", step.visibility, [
      ["public", "Öffentlich"],
      ["activePlayer", "Nur aktiver Spieler"],
      ["passivePlayer", "Betroffene passive Spieler"],
      ["observer", "Nur unbeteiligte Spieler"]
    ], (value) => {
      step.visibility = value;
      persistAndRender();
    }),
    renderSelect("Passive Zielgruppe", step.passivePlayerTarget, [["", "Keine"], ...TARGET_GROUPS.map((target) => [target, TARGET_GROUP_LABELS[target] ?? target])], (value) => {
      step.passivePlayerTarget = value;
      persistAndRender();
    }),
    renderCheckbox("Benötigt Eingabe", step.requiresInput, (checked) => {
      step.requiresInput = checked;
      persistAndRender();
    }),
    renderSelect("Next-Step", step.nextStep, [["", "Kein direkter Next-Step"], ...getStepOptions(flow)], (value) => {
      step.nextStep = value;
      persistAndRender();
    })
  );
  return section;
}

function renderTextEditor(step) {
  const section = renderEditorSection("Vier Anzeigeebenen");
  section.append(
    renderTextarea("Public / Spielfeld", step.boardText, (value) => {
      step.boardText = value;
      persistSoft();
      renderPreviews();
    }),
    renderTextarea("Aktiver Spieler", step.activePlayerText, (value) => {
      step.activePlayerText = value;
      persistSoft();
      renderPreviews();
    }),
    renderTextarea("Betroffene passive Spieler", step.passivePlayerText, (value) => {
      step.passivePlayerText = value;
      persistSoft();
      renderPreviews();
    }),
    renderTextarea("Unbeteiligte Spieler", step.observerText, (value) => {
      step.observerText = value;
      persistSoft();
      renderPreviews();
    })
  );
  return section;
}

function renderChoicesEditor(flow, step, scope, title) {
  const choices = scope === "passive" ? step.passivePlayerChoices : step.activePlayerChoices;
  const section = renderEditorSection(title);
  const list = document.createElement("div");
  list.className = "encounter-array-editor";
  choices.forEach((choice, index) => list.append(renderChoiceRow(flow, choices, choice, index)));

  const addButton = document.createElement("button");
  addButton.id = scope === "passive" ? "add-passive-choice" : "add-active-choice";
  addButton.type = "button";
  addButton.textContent = "Choice hinzufügen";
  addButton.addEventListener("click", () => {
    choices.push(createBlankChoice(flow));
    step.requiresInput = true;
    persistAndRender();
  });
  section.append(list, addButton);
  return section;
}

function renderChoiceRow(flow, choices, choice, index) {
  const row = document.createElement("fieldset");
  row.className = "encounter-choice-editor-row";
  row.append(createElement("legend", `Choice ${index + 1}`));
  row.append(
    renderInput("ID", choice.id, (value) => {
      choice.id = sanitizeStepId(value);
      persistSoft();
    }),
    renderInput("Label DE", choice.labelDe, (value) => {
      choice.labelDe = value;
      choice.label = value;
      persistSoft();
      renderPreviews();
    }),
    renderInput("Label EN", choice.labelEn, (value) => {
      choice.labelEn = value;
      persistSoft();
    }),
    renderSelect("Ziel-Step", choice.nextStepId || choice.nextStep, [["", "Kein Ziel"], ...getStepOptions(flow)], (value) => {
      choice.nextStepId = value;
      choice.nextStep = value;
      persistAndRender();
    }),
    renderInput("Bedingung", choice.condition, (value) => {
      choice.condition = value;
      persistSoft();
    }),
    renderTextarea("Notizen", choice.notes, (value) => {
      choice.notes = value;
      persistSoft();
    })
  );
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Choice löschen";
  remove.addEventListener("click", () => {
    choices.splice(index, 1);
    persistAndRender();
  });
  row.append(remove);
  return row;
}

function renderEffectsEditor(flow, step, scope, title) {
  const effects = getEffectsForScope(step, scope);
  const section = renderEditorSection(title);
  const list = document.createElement("div");
  list.className = "encounter-array-editor";
  effects.forEach((effect, index) => list.append(renderEffectRow(flow, effects, effect, index)));

  const addButton = document.createElement("button");
  addButton.id = `add-${scope}-effect`;
  addButton.type = "button";
  addButton.textContent = "Effekt hinzufügen";
  addButton.addEventListener("click", () => {
    effects.push(createBlankEffect());
    persistAndRender();
  });
  section.append(list, addButton);
  return section;
}

function renderEffectRow(flow, effects, effect, index) {
  const row = document.createElement("fieldset");
  row.className = "encounter-effect-editor-row";
  row.append(createElement("legend", `Effekt ${index + 1}`));
  row.append(
    renderSelect("Effekt-Typ", effect.effectType ?? effect.type, EFFECT_TYPES.map((type) => [type, EFFECT_TYPE_LABELS[type] ?? type]), (value) => {
      effect.effectType = value;
      effect.type = value;
      persistAndRender();
    }),
    renderSelect("Ziel", effect.target, TARGET_GROUPS.map((target) => [target, TARGET_GROUP_LABELS[target] ?? target]), (value) => {
      effect.target = value;
      persistSoft();
      renderPreviews();
    }),
    renderInput("Anzahl", effect.amount, (value) => {
      effect.amount = value === "" ? "" : Number(value);
      persistSoft();
      renderPreviews();
    }, "number"),
    renderSelect("Rohstoff", effect.resourceType ?? effect.resource, RESOURCE_TYPES.map((type) => [type, RESOURCE_LABELS[type] ?? type]), (value) => {
      effect.resourceType = value;
      effect.resource = value;
      persistSoft();
      renderPreviews();
    }),
    renderInput("Ausbau-Typ", effect.upgradeType, (value) => {
      effect.upgradeType = value;
      persistSoft();
    }),
    renderInput("Halbe Medaillen", effect.medalAmount, (value) => {
      effect.medalAmount = value === "" ? "" : Number(value);
      persistSoft();
    }, "number"),
    renderInput("Public Log", effect.publicLogText, (value) => {
      effect.publicLogText = value;
      persistSoft();
    }),
    renderInput("Private Log", effect.privateLogText, (value) => {
      effect.privateLogText = value;
      persistSoft();
    }),
    renderSelect("Folge-Step nach Effekt", effect.nextStepAfterEffect, [["", "Keiner"], ...getStepOptions(flow)], (value) => {
      effect.nextStepAfterEffect = value;
      persistAndRender();
    }),
    renderTextarea("Notizen", effect.notes, (value) => {
      effect.notes = value;
      persistSoft();
    })
  );
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Effekt löschen";
  remove.addEventListener("click", () => {
    effects.splice(index, 1);
    persistAndRender();
  });
  row.append(remove);
  return row;
}

function renderNotesEditor(step) {
  const section = renderEditorSection("Notizen");
  section.append(renderTextarea("Notes", step.notes, (value) => {
    step.notes = value;
    persistSoft();
  }));
  return section;
}

function renderValidation(flow) {
  const warnings = validateFlow(flow);
  const title = document.createElement("strong");
  title.textContent = warnings.length ? `${warnings.length} Hinweis(e)` : "Keine Validierungshinweise";
  validationTarget.append(title);
  if (!warnings.length) return;
  const list = document.createElement("ul");
  for (const warning of warnings) {
    const item = document.createElement("li");
    item.textContent = warning;
    list.append(item);
  }
  validationTarget.append(list);
}

function setPreviewMode(mode) {
  state.previewMode = mode;
  renderPreviews();
}

function addStep() {
  const flow = getSelectedFlow();
  if (!flow) return;
  const stepId = getUniqueStepId(flow, "new_step");
  const step = createBlankStep(stepId);
  flow.steps.push(step);
  state.selectedStepId = step.stepId;
  state.simulationStepId = step.stepId;
  persistAndRender();
}

function duplicateStep() {
  const flow = getSelectedFlow();
  const step = getSelectedStep();
  if (!flow || !step) return;
  const clone = cloneFlow({ steps: [step] }).steps[0];
  clone.stepId = getUniqueStepId(flow, `${step.stepId}_copy`);
  const index = flow.steps.findIndex((item) => item.stepId === step.stepId);
  flow.steps.splice(index + 1, 0, clone);
  state.selectedStepId = clone.stepId;
  state.simulationStepId = clone.stepId;
  persistAndRender();
}

function deleteStep() {
  const flow = getSelectedFlow();
  const step = getSelectedStep();
  if (!flow || !step || flow.steps.length <= 1) return;
  const index = flow.steps.findIndex((item) => item.stepId === step.stepId);
  flow.steps.splice(index, 1);
  if (flow.startStepId === step.stepId) flow.startStepId = flow.steps[0]?.stepId ?? "";
  state.selectedStepId = flow.steps[Math.max(0, index - 1)]?.stepId ?? flow.startStepId;
  state.simulationStepId = state.selectedStepId;
  persistAndRender();
}

function moveStep(direction) {
  const flow = getSelectedFlow();
  const step = getSelectedStep();
  if (!flow || !step) return;
  const index = flow.steps.findIndex((item) => item.stepId === step.stepId);
  const target = index + direction;
  if (target < 0 || target >= flow.steps.length) return;
  const [moved] = flow.steps.splice(index, 1);
  flow.steps.splice(target, 0, moved);
  persistAndRender();
}

function resetSelectedEncounter() {
  const flow = getSelectedFlow();
  if (!flow) return;
  const base = baseFlows.find((item) => item.id === flow.id);
  if (!base) return;
  const index = flows.findIndex((item) => item.id === flow.id);
  flows[index] = normalizeFlow(cloneFlow(base));
  state.selectedStepId = getStartStep(flows[index])?.stepId ?? null;
  state.simulationStepId = state.selectedStepId;
  saveFlowsToLocalStorage(false);
  render();
}

function resetLocalEdits() {
  localStorage.removeItem(ENCOUNTER_FLOW_STORAGE_KEY);
  flows = mergeStoredEncounterFlows(baseFlows, []);
  ensureSelectedStep();
  render();
}

function advanceSimulation(choiceId = null, scope = "active") {
  const step = getCurrentStep();
  if (!step) return;
  const effectNext = getPreviewEffects(step).find((effect) => effect.nextStepAfterEffect)?.nextStepAfterEffect;
  const nextStepId = getNextStepId(step, choiceId, scope) || effectNext || step.nextStep;
  state.simulationHistory.push(step.stepId);
  if (nextStepId) {
    state.simulationStepId = nextStepId;
    state.selectedStepId = nextStepId;
  }
  render();
}

function exportSelectedFlow() {
  const flow = getSelectedFlow();
  exportOutput.value = JSON.stringify(exportFlow(flow), null, 2);
}

function exportAllFlows() {
  const payload = {
    exportedAt: new Date().toISOString(),
    source: "debug-encounter-cards.html",
    flows: flows.map(exportFlow)
  };
  exportOutput.value = JSON.stringify(payload, null, 2);
}

function importFlowsFromTextarea() {
  try {
    const parsed = JSON.parse(exportOutput.value);
    applyImportedFlows(parsed);
    setExportMessage("Import erfolgreich.");
  } catch (error) {
    setExportMessage(`Import fehlgeschlagen: ${error.message}`);
  }
}

async function importFlowsFromFile() {
  const file = importFileInput.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    applyImportedFlows(parsed);
    setExportMessage("Datei importiert.");
  } catch (error) {
    setExportMessage(`Import fehlgeschlagen: ${error.message}`);
  } finally {
    importFileInput.value = "";
  }
}

function applyImportedFlows(payload) {
  const imported = Array.isArray(payload) ? payload : payload.flows ? payload.flows : [payload];
  const normalizedById = new Map(imported.map((flow) => {
    const normalized = normalizeFlow(flow);
    return [normalized.id || normalized.encounterId, normalized];
  }));
  flows = flows.map((flow) => normalizedById.get(flow.id) ? normalizeFlow({ ...flow, ...normalizedById.get(flow.id), id: flow.id, number: flow.number, type: flow.type }) : flow);
  saveFlowsToLocalStorage(false);
  ensureSelectedStep();
  render();
}

function saveFlowsToLocalStorage(showExport = false) {
  localStorage.setItem(ENCOUNTER_FLOW_STORAGE_KEY, JSON.stringify(flows.map(exportFlow)));
  if (showExport) setExportMessage("localStorage gespeichert.");
}

function persistSoft() {
  saveFlowsToLocalStorage(false);
  updateExportOutput();
}

function persistAndRender() {
  saveFlowsToLocalStorage(false);
  render();
}

function updateExportOutput() {
  const flow = getSelectedFlow();
  if (!flow) return;
  exportOutput.value = JSON.stringify(exportFlow(flow), null, 2);
}

function setExportMessage(message) {
  const payload = {
    message,
    selectedEncounter: getSelectedFlow()?.id ?? null,
    exportedAt: new Date().toISOString()
  };
  exportOutput.value = JSON.stringify(payload, null, 2);
}

function selectFlow(flowId) {
  if (state.selectedFlowId === flowId) return;
  state.selectedFlowId = flowId;
  state.simulationStepId = null;
  state.simulationHistory = [];
  ensureSelectedStep();
}

function ensureSelectedStep() {
  const flow = getSelectedFlow();
  if (!flow) return;
  if (!getStep(flow, state.selectedStepId)) {
    state.selectedStepId = getStartStep(flow)?.stepId ?? flow.steps[0]?.stepId ?? null;
  }
  if (state.simulationStepId && !getStep(flow, state.simulationStepId)) {
    state.simulationStepId = state.selectedStepId;
  }
}

function getSelectedFlow() {
  return flows.find((flow) => flow.id === state.selectedFlowId) ?? flows[0] ?? null;
}

function getSelectedStep() {
  const flow = getSelectedFlow();
  return getStep(flow, state.selectedStepId) ?? getStartStep(flow);
}

function getCurrentStep() {
  const flow = getSelectedFlow();
  return getStep(flow, state.simulationStepId || state.selectedStepId) ?? getStartStep(flow);
}

function getPreviewHeading() {
  if (state.previewMode === "passive") return "Betroffener passiver Spieler";
  if (state.previewMode === "observer") return "Unbeteiligter Spieler";
  return "Aktiver Spieler";
}

function getPreviewText(step) {
  if (state.previewMode === "passive") return step.passivePlayerText || "Dieser Step hat keine passive Spieleraktion.";
  if (state.previewMode === "observer") return step.observerText || "{activePlayerName} ist in einer Begegnung.";
  return step.activePlayerText || step.boardText || "";
}

function getPreviewChoices(step) {
  return getChoicesForScope(step, state.previewMode);
}

function getPreviewEffects(step) {
  if (state.previewMode === "passive") return step.passivePlayerEffects ?? [];
  if (state.previewMode === "observer") return [];
  return [...(step.activePlayerEffects ?? []), ...(step.effects ?? [])];
}

function hasPassiveWork(step) {
  return Boolean(step?.passivePlayerText || step?.passivePlayerChoices?.length || step?.passivePlayerEffects?.length);
}

function getEffectsForScope(step, scope) {
  if (scope === "passive") return step.passivePlayerEffects;
  if (scope === "generic") return step.effects;
  return step.activePlayerEffects;
}

function updateStepReferences(flow, oldId, newId) {
  if (!oldId || !newId || oldId === newId) return;
  if (flow.startStepId === oldId) flow.startStepId = newId;
  for (const step of flow.steps) {
    if (step.nextStep === oldId) step.nextStep = newId;
    for (const choice of [...(step.activePlayerChoices ?? []), ...(step.passivePlayerChoices ?? []), ...(step.choices ?? [])]) {
      if (choice.nextStep === oldId) choice.nextStep = newId;
      if (choice.nextStepId === oldId) choice.nextStepId = newId;
    }
    for (const effect of [...(step.activePlayerEffects ?? []), ...(step.passivePlayerEffects ?? []), ...(step.effects ?? [])]) {
      if (effect.nextStepAfterEffect === oldId) effect.nextStepAfterEffect = newId;
    }
  }
}

function getStepOptions(flow) {
  return (flow?.steps ?? []).map((step) => [step.stepId, step.stepId]);
}

function getUniqueStepId(flow, base) {
  const ids = new Set(flow.steps.map((step) => step.stepId));
  let candidate = sanitizeStepId(base);
  let counter = 2;
  while (ids.has(candidate)) {
    candidate = `${sanitizeStepId(base)}_${counter}`;
    counter += 1;
  }
  return candidate;
}

function sanitizeStepId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_/-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "step";
}

function getCardForFlow(flow) {
  return cards.find((card) => card.id === flow?.id) ?? null;
}

function setAllDetails(open) {
  listTarget.querySelectorAll("details").forEach((details) => {
    details.open = open;
  });
}

function renderStat(label, value) {
  const stat = document.createElement("div");
  stat.className = "debug-stat";
  stat.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
  return stat;
}

function renderTitle(title, subtitle, extra = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "debug-card-title";
  wrapper.append(createElement("strong", title), createElement("span", [subtitle, extra].filter(Boolean).join(" · ")));
  return wrapper;
}

function renderPill(label, className = "") {
  const pill = document.createElement("span");
  pill.className = `debug-pill ${className}`.trim();
  pill.textContent = label ?? "-";
  return pill;
}

function renderFieldGrid(fields) {
  const grid = document.createElement("dl");
  grid.className = "debug-card-grid";
  for (const [label, value] of fields) {
    const item = document.createElement("div");
    item.className = "debug-field";
    item.append(createElement("dt", label), createElement("dd", value ?? "-"));
    grid.append(item);
  }
  return grid;
}

function renderMiniBoard() {
  const board = document.createElement("div");
  board.className = "debug-mini-board";
  for (let index = 0; index < 30; index += 1) {
    const point = document.createElement("span");
    point.style.left = `${10 + (index % 6) * 16}%`;
    point.style.top = `${12 + Math.floor(index / 6) * 17}%`;
    board.append(point);
  }
  return board;
}

function renderNotice(text) {
  const notice = document.createElement("p");
  notice.className = "debug-field";
  notice.textContent = text;
  return notice;
}

function renderEditorSection(title) {
  const section = document.createElement("section");
  section.className = "encounter-editor-section";
  section.append(createElement("h3", title));
  return section;
}

function renderInput(label, value, onChange, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  if (type === "number") input.step = "any";
  input.addEventListener("input", () => onChange(input.value));
  return labelWrap(label, input);
}

function renderTextarea(label, value, onChange) {
  const textarea = document.createElement("textarea");
  textarea.value = value ?? "";
  textarea.rows = 4;
  textarea.addEventListener("input", () => onChange(textarea.value));
  return labelWrap(label, textarea, "encounter-editor-field--wide");
}

function renderSelect(label, value, options, onChange) {
  const select = document.createElement("select");
  select.replaceChildren(...options.map(([optionValue, optionLabel]) => createOption(optionValue, optionLabel)));
  select.value = value ?? "";
  select.addEventListener("change", () => onChange(select.value));
  return labelWrap(label, select);
}

function renderCheckbox(label, checked, onChange) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.addEventListener("change", () => onChange(input.checked));
  return labelWrap(label, input, "encounter-editor-field--checkbox");
}

function labelWrap(label, input, className = "") {
  const wrapper = document.createElement("label");
  wrapper.className = `encounter-editor-field ${className}`.trim();
  wrapper.append(createElement("span", label), input);
  return wrapper;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function createElement(tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text ?? "";
  return element;
}

function formatExcelRows(card) {
  if (!card?.excelRows?.length) return "-";
  return card.excelRows.join(", ");
}

function replaceTokens(text) {
  return String(text ?? "")
    .replaceAll("{activePlayerName}", "Tina")
    .replaceAll("{playerName}", "Tina")
    .replaceAll("{passivePlayerName}", "Rob");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
