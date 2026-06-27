import { getAllEncounterCards, getEncounterDeckIds } from "./data/encounterCards.js";
import {
  STEP_KIND_LABELS,
  STEP_KINDS,
  cloneFlow,
  createEncounterFlows,
  describeEffect,
  exportFlow,
  getNextStepId,
  getStartStep,
  getStep,
  validateFlow
} from "./debug-encounter-flow-utils.js";

const cards = getAllEncounterCards();
const activeDeckIds = new Set(getEncounterDeckIds());
const localStorageKey = "starOdyssey.debug.encounterFlows.v1";
const baseFlows = createEncounterFlows(cards);
const storedFlows = readStoredFlows();
const flows = mergeStoredFlows(baseFlows, storedFlows);

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
const otherPreviewButton = document.querySelector("#preview-other-player");

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
  document.querySelector("#export-selected").addEventListener("click", () => exportSelectedFlow());
  document.querySelector("#export-all").addEventListener("click", () => exportAllFlows());
  document.querySelector("#save-local").addEventListener("click", () => saveFlowsToLocalStorage());
  activePreviewButton.addEventListener("click", () => {
    state.previewMode = "active";
    renderPreviews();
  });
  otherPreviewButton.addEventListener("click", () => {
    state.previewMode = "other";
    renderPreviews();
  });
}

function render() {
  renderListAndStats();
  renderPreviews();
  renderEditor();
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

  for (const flow of visibleFlows) {
    listTarget.append(renderFlowDetails(flow));
  }
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
  summary.addEventListener("click", () => selectFlow(flow.id));

  const body = document.createElement("div");
  body.className = "debug-card-body";
  const stepList = document.createElement("div");
  stepList.className = "encounter-step-list";

  for (const step of flow.steps) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `encounter-step-row${step.stepId === state.selectedStepId ? " is-active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(step.stepId)}</strong><span>${escapeHtml(STEP_KIND_LABELS[step.kind] ?? step.kind)}</span><small>${escapeHtml(step.playerText || step.boardText || "-")}</small>`;
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
  otherPreviewButton.classList.toggle("is-active", state.previewMode === "other");
  selectedCardLabel.textContent = flow ? `${flow.number}. ${flow.title}` : "";
  boardPreviewStepTarget.textContent = step ? step.stepId : "";

  renderBoardPreview(flow, step);
  renderPlayerPreview(flow, step);
}

function renderBoardPreview(flow, step) {
  boardPreviewTarget.replaceChildren();
  const overlay = document.createElement("div");
  overlay.className = "encounter-board-overlay-preview";
  const title = document.createElement("strong");
  title.textContent = flow ? `Begegnung ${flow.number}` : "Keine Begegnung";
  const text = document.createElement("p");
  text.textContent = step?.boardText || "Kein oeffentlicher Spielfeldtext fuer diesen Step.";
  overlay.append(title, text);
  boardPreviewTarget.append(renderMiniBoard(), overlay);
}

function renderPlayerPreview(flow, step) {
  playerPreviewTarget.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "encounter-controller-preview-panel";

  const heading = document.createElement("h3");
  heading.textContent = state.previewMode === "active" ? "Aktiver Spieler" : "Nicht aktiver Spieler";
  panel.append(heading);

  if (!flow || !step) {
    panel.append(renderNotice("Keine Begegnung ausgewaehlt."));
    playerPreviewTarget.append(panel);
    return;
  }

  if (state.previewMode === "other") {
    panel.append(
      renderNotice("Spieler X hat eine Begegnung ausgeloest."),
      renderNotice("Warte, bis Spieler X die Begegnung abgeschlossen hat.")
    );
    playerPreviewTarget.append(panel);
    return;
  }

  if (step.playerText) {
    const text = document.createElement("p");
    text.textContent = step.playerText;
    panel.append(text);
  }

  if (step.effect?.type) {
    panel.append(renderNotice(describeEffect(step.effect)));
  }

  const choiceRow = document.createElement("div");
  choiceRow.className = "encounter-preview-actions";
  const choices = getStepChoices(step);
  if (choices.length === 0) {
    choiceRow.append(renderNotice("Keine Aktionen verfuegbar."));
  }
  for (const choice of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.label || choice.id;
    button.addEventListener("click", () => advanceSimulation(choice.id));
    choiceRow.append(button);
  }
  panel.append(choiceRow);

  if (state.simulationHistory.length > 0) {
    const history = document.createElement("p");
    history.className = "debug-sim-history";
    history.textContent = `Verlauf: ${state.simulationHistory.join(" -> ")}`;
    panel.append(history);
  }
  playerPreviewTarget.append(panel);
}

function renderEditor() {
  const flow = getSelectedFlow();
  const step = getSelectedStep();
  validationTarget.replaceChildren();
  editorForm.replaceChildren();

  if (!flow || !step) {
    validationTarget.append(renderNotice("Keine Begegnung ausgewaehlt."));
    return;
  }

  const warnings = validateFlow(flow);
  validationTarget.append(renderValidation(warnings));

  const stepSelectField = createSelect("Aktueller Step", "stepId", flow.steps.map((candidate) => ({
    value: candidate.stepId,
    label: candidate.stepId
  })), step.stepId);
  const stepSelect = stepSelectField.control;
  stepSelect.addEventListener("change", () => {
    state.selectedStepId = stepSelect.value;
    state.simulationStepId = stepSelect.value;
    render();
  });

  const kindSelectField = createSelect("Step-Typ", "kind", STEP_KINDS.map((kind) => ({
    value: kind,
    label: STEP_KIND_LABELS[kind] ?? kind
  })), step.kind);
  const kindSelect = kindSelectField.control;
  kindSelect.addEventListener("change", () => updateStep({ kind: kindSelect.value }));

  editorForm.append(
    stepSelectField,
    createTextInput("stepId", "Step-ID", step.stepId, (value) => renameStep(step.stepId, value)),
    kindSelectField,
    createTextarea("boardText", "Spielfeld-Text", step.boardText, (value) => updateStep({ boardText: value })),
    createTextarea("playerText", "Aktiver-Spieler-Text", step.playerText, (value) => updateStep({ playerText: value })),
    createSelect("Sichtbarkeit", "visibility", [
      { value: "public", label: "oeffentlich" },
      { value: "activePlayer", label: "nur aktiver Spieler" },
      { value: "private", label: "privat" }
    ], step.visibility ?? "public", (value) => updateStep({ visibility: value })),
    createCheckbox("requiresInput", "Eingabe erforderlich", Boolean(step.requiresInput), (checked) => updateStep({ requiresInput: checked })),
    createTextInput("effectType", "Effekt/Mechanik", step.effect?.type ?? "", (value) => {
      updateStep({ effect: value ? { ...(step.effect ?? {}), type: value } : null });
    }),
    createSelect("nextStep", "Default-Folge-Step", [{ value: "", label: "-" }, ...flow.steps.map((candidate) => ({
      value: candidate.stepId,
      label: candidate.stepId
    }))], step.nextStep ?? "", (value) => updateStep({ nextStep: value })),
    createTextarea("notes", "Notizen", step.notes ?? "", (value) => updateStep({ notes: value })),
    renderChoiceEditor(flow, step)
  );
}

function renderChoiceEditor(flow, step) {
  const wrapper = document.createElement("section");
  wrapper.className = "encounter-choice-editor";
  const title = document.createElement("h3");
  title.textContent = "Choices";
  wrapper.append(title);

  (step.choices ?? []).forEach((choice, index) => {
    const row = document.createElement("div");
    row.className = "encounter-choice-editor-row";
    row.append(
      createTextInput(`choice-${index}-label`, "Label", choice.label ?? "", (value) => updateChoice(index, { label: value })),
      createSelect(`choice-${index}-next`, "Ziel-Step", [{ value: "", label: "-" }, ...flow.steps.map((candidate) => ({
        value: candidate.stepId,
        label: candidate.stepId
      }))], choice.nextStep ?? "", (value) => updateChoice(index, { nextStep: value }))
    );
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Choice entfernen";
    remove.addEventListener("click", () => removeChoice(index));
    row.append(remove);
    wrapper.append(row);
  });

  const add = document.createElement("button");
  add.type = "button";
  add.textContent = "Choice hinzufuegen";
  add.addEventListener("click", () => {
    const selected = getSelectedStep();
    selected.choices = [...(selected.choices ?? []), { id: `choice-${Date.now()}`, label: "Weiter", nextStep: selected.nextStep ?? "" }];
    selected.nextStep = "";
    saveFlowsToLocalStorage(false);
    render();
  });
  wrapper.append(add);
  return wrapper;
}

function advanceSimulation(choiceId) {
  const flow = getSelectedFlow();
  const step = getCurrentStep();
  const nextStepId = getNextStepId(step, choiceId);
  state.simulationHistory.push(step?.stepId ?? "?");
  if (nextStepId) {
    state.simulationStepId = nextStepId;
    state.selectedStepId = nextStepId;
  }
  render();
}

function getStepChoices(step) {
  if (!step) return [];
  if (step.choices?.length) return step.choices;
  if (step.nextStep) return [{ id: "continue", label: "Weiter", nextStep: step.nextStep }];
  return [];
}

function updateStep(patch) {
  Object.assign(getSelectedStep(), patch);
  saveFlowsToLocalStorage(false);
  renderPreviews();
  renderListAndStats();
}

function updateChoice(index, patch) {
  const step = getSelectedStep();
  step.choices[index] = { ...step.choices[index], ...patch };
  saveFlowsToLocalStorage(false);
  renderPreviews();
}

function removeChoice(index) {
  const step = getSelectedStep();
  step.choices.splice(index, 1);
  saveFlowsToLocalStorage(false);
  render();
}

function renameStep(oldStepId, newStepId) {
  const normalized = newStepId.trim();
  if (!normalized || normalized === oldStepId) return;
  const flow = getSelectedFlow();
  if (flow.steps.some((step) => step.stepId === normalized)) return;
  const step = getSelectedStep();
  step.stepId = normalized;
  if (flow.startStepId === oldStepId) flow.startStepId = normalized;
  for (const candidate of flow.steps) {
    if (candidate.nextStep === oldStepId) candidate.nextStep = normalized;
    for (const choice of candidate.choices ?? []) {
      if (choice.nextStep === oldStepId) choice.nextStep = normalized;
    }
  }
  state.selectedStepId = normalized;
  state.simulationStepId = normalized;
  saveFlowsToLocalStorage(false);
  render();
}

function exportSelectedFlow() {
  const payload = exportFlow(getSelectedFlow());
  writeExport(payload, `encounter-${String(payload.encounterNumber).padStart(2, "0")}-flow.json`);
}

function exportAllFlows() {
  writeExport({
    exportedAt: new Date().toISOString(),
    source: "debug-encounter-cards.html",
    encounters: flows.map(exportFlow)
  }, "encounter-flow-overrides.json");
}

function writeExport(payload, fileName) {
  const text = JSON.stringify(payload, null, 2);
  exportOutput.value = text;
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function saveFlowsToLocalStorage(showExport = true) {
  localStorage.setItem(localStorageKey, JSON.stringify(flows.map(exportFlow)));
  if (showExport) {
    exportOutput.value = JSON.stringify({ savedAt: new Date().toISOString(), encounters: flows.map(exportFlow) }, null, 2);
  }
}

function readStoredFlows() {
  try {
    const raw = localStorage.getItem(localStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeStoredFlows(base, stored) {
  if (!Array.isArray(stored)) return base;
  return base.map((flow) => {
    const storedFlow = stored.find((candidate) => candidate.encounterId === flow.id || candidate.id === flow.id);
    if (!storedFlow?.steps) return flow;
    return {
      ...flow,
      startStepId: storedFlow.startStepId ?? flow.startStepId,
      steps: storedFlow.steps.map((step) => cloneFlow({ steps: [step] }).steps[0])
    };
  });
}

function selectFlow(flowId) {
  if (state.selectedFlowId === flowId) return;
  state.selectedFlowId = flowId;
  state.selectedStepId = null;
  state.simulationStepId = null;
  state.simulationHistory = [];
  ensureSelectedStep();
  render();
}

function ensureSelectedStep() {
  const flow = getSelectedFlow();
  if (!flow) return;
  const current = state.selectedStepId ? getStep(flow, state.selectedStepId) : null;
  if (!current) state.selectedStepId = getStartStep(flow)?.stepId ?? flow.steps[0]?.stepId ?? null;
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
  return getStep(flow, state.simulationStepId) ?? getSelectedStep();
}

function getCardForFlow(flow) {
  return cards.find((card) => card.id === flow.id) ?? null;
}

function formatExcelRows(card) {
  if (!Array.isArray(card?.excelRows) || card.excelRows.length === 0) return "-";
  return card.excelRows.map((row) => row.cells.filter(Boolean).join(" | ")).filter(Boolean).join("\n");
}

function renderValidation(warnings) {
  const wrapper = document.createElement("div");
  wrapper.className = warnings.length ? "encounter-validation-list is-warning" : "encounter-validation-list";
  const title = document.createElement("strong");
  title.textContent = warnings.length ? `${warnings.length} Hinweis(e)` : "Keine Validierungshinweise";
  wrapper.append(title);
  warnings.slice(0, 8).forEach((warning) => {
    const item = document.createElement("p");
    item.textContent = warning;
    wrapper.append(item);
  });
  return wrapper;
}

function renderMiniBoard() {
  const board = document.createElement("div");
  board.className = "debug-mini-board";
  for (let index = 0; index < 16; index += 1) {
    const dot = document.createElement("span");
    dot.style.left = `${8 + (index % 4) * 26}%`;
    dot.style.top = `${14 + Math.floor(index / 4) * 23}%`;
    board.append(dot);
  }
  return board;
}

function renderNotice(text) {
  const notice = document.createElement("p");
  notice.className = "debug-field";
  notice.textContent = text;
  return notice;
}

function renderFieldGrid(fields) {
  const grid = document.createElement("dl");
  grid.className = "debug-card-grid";
  for (const [label, value] of fields) grid.append(renderField(label, value));
  return grid;
}

function renderField(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "debug-field";
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = value ?? "-";
  wrapper.append(term, description);
  return wrapper;
}

function createTextInput(id, label, value, onChange) {
  const field = createFieldWrapper(label);
  const input = document.createElement("input");
  input.id = id;
  input.value = value ?? "";
  input.addEventListener("change", () => onChange(input.value));
  field.append(input);
  return field;
}

function createTextarea(id, label, value, onChange) {
  const field = createFieldWrapper(label);
  const input = document.createElement("textarea");
  input.id = id;
  input.value = value ?? "";
  input.addEventListener("change", () => onChange(input.value));
  field.append(input);
  return field;
}

function createSelect(label, id, options, value, onChange = null) {
  const field = createFieldWrapper(label);
  const select = document.createElement("select");
  select.id = id;
  select.replaceChildren(...options.map((option) => createOption(option.value, option.label)));
  select.value = value ?? "";
  if (onChange) select.addEventListener("change", () => onChange(select.value));
  field.append(select);
  field.control = select;
  return field;
}

function createCheckbox(id, label, value, onChange) {
  const field = createFieldWrapper(label);
  const input = document.createElement("input");
  input.id = id;
  input.type = "checkbox";
  input.checked = value;
  input.addEventListener("change", () => onChange(input.checked));
  field.append(input);
  return field;
}

function createFieldWrapper(labelText) {
  const label = document.createElement("label");
  label.className = "encounter-editor-field";
  const span = document.createElement("span");
  span.textContent = labelText;
  label.append(span);
  return label;
}

function renderTitle(id, titleDe, titleEn) {
  const wrapper = document.createElement("span");
  wrapper.className = "debug-card-title";
  const title = document.createElement("strong");
  title.textContent = titleDe;
  const meta = document.createElement("span");
  meta.textContent = `${id} · ${titleEn}`;
  wrapper.append(title, meta);
  return wrapper;
}

function renderPill(text, extraClass = "") {
  const pill = document.createElement("span");
  pill.className = `debug-pill ${extraClass}`.trim();
  pill.textContent = text;
  return pill;
}

function renderStat(label, value) {
  const stat = document.createElement("div");
  stat.className = "debug-stat";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  stat.append(labelNode, valueNode);
  return stat;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function setAllDetails(open) {
  listTarget.querySelectorAll("details").forEach((details) => {
    details.open = open;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
