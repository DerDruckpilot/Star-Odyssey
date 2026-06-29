import { getAllEncounterCards } from "./data/encounterCards.js";
import {
  STEP_KIND_LABELS,
  createEncounterFlows,
  describeEffect,
  getChoicesForScope,
  getNextStepId,
  getStartStep,
  getStep,
  mergeStoredEncounterFlows,
  readStoredEncounterFlows
} from "./debug-encounter-flow-utils.js";

const cards = getAllEncounterCards();
const flows = mergeStoredEncounterFlows(createEncounterFlows(cards), readStoredEncounterFlows());
const reviewStorageKey = "starOdyssey.debug.encounterReviewStatus.v1";

const state = {
  selectedFlowId: flows[0]?.id ?? null,
  currentStepId: null,
  history: [],
  menuOpen: false,
  reviewStatus: readReviewStatus(),
  simValues: {
    preset: "standard",
    activeResources: 5,
    neighborResources: 3,
    activeDrives: 2,
    leftDrives: 1,
    activeCannons: 1,
    neighborCannons: 1,
    manualRoll: 3,
    hasShips: true
  }
};

const menuToggle = document.querySelector("#encounter-menu-toggle");
const menuTarget = document.querySelector("#encounter-menu");
const boardTarget = document.querySelector("#sim-board-stage");
const controllerTarget = document.querySelector("#sim-controller");
const stateTarget = document.querySelector("#sim-state-panel");

menuToggle.addEventListener("click", () => {
  state.menuOpen = !state.menuOpen;
  render();
});

resetCurrentEncounter();
render();

function render() {
  menuToggle.setAttribute("aria-expanded", String(state.menuOpen));
  renderMenu();
  renderBoard();
  renderController();
  renderStatePanel();
}

function renderMenu() {
  menuTarget.classList.toggle("is-open", state.menuOpen);
  menuTarget.replaceChildren();

  const title = document.createElement("h2");
  title.textContent = "Begegnungen";
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = "Pruefstatus exportieren";
  exportButton.addEventListener("click", exportReviewStatus);
  menuTarget.append(title, exportButton);

  const list = document.createElement("div");
  list.className = "encounter-review-list";
  for (const flow of flows) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `encounter-review-row${flow.id === state.selectedFlowId ? " is-active" : ""}`;
    row.addEventListener("click", () => {
      state.selectedFlowId = flow.id;
      resetCurrentEncounter();
      state.menuOpen = false;
      render();
    });

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(state.reviewStatus[flow.id]?.ok);
    checkbox.addEventListener("click", (event) => event.stopPropagation());
    checkbox.addEventListener("change", () => {
      state.reviewStatus[flow.id] = {
        ...(state.reviewStatus[flow.id] ?? {}),
        ok: checkbox.checked,
        checkedAt: checkbox.checked ? new Date().toISOString() : null
      };
      saveReviewStatus();
      renderMenu();
    });

    const label = document.createElement("span");
    label.innerHTML = `<strong>${flow.number}. ${escapeHtml(flow.title)}</strong><small>${escapeHtml(getFirstLine(flow))}</small>`;
    row.append(checkbox, label);
    list.append(row);
  }
  menuTarget.append(list);
}

function renderBoard() {
  const flow = getSelectedFlow();
  const step = getCurrentStep();
  boardTarget.replaceChildren();

  const grid = document.createElement("div");
  grid.className = "encounter-sim-board-grid";
  for (let index = 0; index < 24; index += 1) {
    const point = document.createElement("button");
    point.type = "button";
    point.className = "encounter-sim-point";
    point.style.left = `${8 + (index % 6) * 16}%`;
    point.style.top = `${18 + Math.floor(index / 6) * 18}%`;
    point.textContent = index === 8 ? "S" : "";
    point.addEventListener("click", () => handleBoardPick(index));
    grid.append(point);
  }

  const ship = document.createElement("button");
  ship.type = "button";
  ship.className = "encounter-sim-ship";
  ship.textContent = "Schiff";
  ship.addEventListener("click", () => handleBoardPick("ship"));

  const overlay = document.createElement("div");
  overlay.className = "encounter-sim-board-text";
  overlay.append(
    createElement("strong", `Begegnung ${flow?.number ?? "?"}`),
    createElement("p", step?.boardText || "Kein oeffentlicher Text in diesem Step.")
  );

  boardTarget.append(grid, ship, overlay);
}

function renderController() {
  const flow = getSelectedFlow();
  const step = getCurrentStep();
  controllerTarget.replaceChildren();

  const header = document.createElement("header");
  header.append(
    createElement("p", "Aktiver Spieler"),
    createElement("h2", flow ? `${flow.number}. ${flow.title}` : "Keine Begegnung")
  );
  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => {
    resetCurrentEncounter();
    render();
  });
  header.append(resetButton);
  controllerTarget.append(header);

  if (!step) {
    controllerTarget.append(createElement("p", "Keine Begegnung ausgewaehlt."));
    return;
  }

  const stepMeta = document.createElement("p");
  stepMeta.className = "encounter-sim-step-meta";
  stepMeta.textContent = `${step.stepId} · ${STEP_KIND_LABELS[step.kind] ?? step.kind}`;
  controllerTarget.append(stepMeta);

  const playerText = step.activePlayerText || step.boardText;
  if (playerText) controllerTarget.append(createElement("p", playerText));
  for (const effect of [...(step.activePlayerEffects ?? []), ...(step.effects ?? [])]) {
    controllerTarget.append(createElement("p", describeEffect(effect), "encounter-sim-effect-note"));
  }

  const controls = document.createElement("div");
  controls.className = "encounter-sim-actions";
  renderStepControls(step, controls);
  controllerTarget.append(controls);

  if (state.history.length > 0) {
    const history = document.createElement("p");
    history.className = "encounter-sim-history";
    history.textContent = `Verlauf: ${state.history.join(" -> ")}`;
    controllerTarget.append(history);
  }
}

function renderStepControls(step, controls) {
  if (["mothershipRoll", "mothershipCompare", "combat"].includes(step.kind)) {
    const rollButton = createActionButton("Wurf simulieren", () => {
      const choice = getRollChoice(step);
      advance(choice?.id);
    });
    controls.append(rollButton);
    for (const choice of getChoicesForScope(step, "active")) {
      controls.append(createActionButton(choice.labelDe || choice.label, () => advance(choice.id)));
    }
    return;
  }

  if (step.kind === "resourcePayment") {
    controls.append(createElement("p", `Simuliert: ${state.simValues.activeResources} Rohstoffe vorhanden.`));
    controls.append(createActionButton("Rohstoffe auswaehlen und abgeben", () => advance("confirm")));
    return;
  }

  if (step.kind === "resourceRewardChoice") {
    ["Erz", "Treibstoff", "Carbon", "Nahrung", "Handelsware"].forEach((resource) => {
      controls.append(createActionButton(resource, () => advance("confirm")));
    });
    return;
  }

  if (["boardJump", "shipSelection", "giftTradeShip"].includes(step.kind)) {
    controls.append(createElement("p", "Nutze das Dummy-Board oben oder den Schnellbutton."));
    controls.append(createActionButton("Schiff / Ziel simulieren", () => advance("confirm")));
    return;
  }

  const activeChoices = getChoicesForScope(step, "active");
  const choices = activeChoices.length
    ? activeChoices
    : step.nextStep
      ? [{ id: "continue", label: "Weiter", nextStep: step.nextStep }]
      : [];

  if (!choices.length) {
    controls.append(createElement("p", "Keine Aktionen verfuegbar."));
    return;
  }

  for (const choice of choices) {
    controls.append(createActionButton(choice.labelDe || choice.label || choice.id, () => advance(choice.id)));
  }
}

function renderStatePanel() {
  stateTarget.replaceChildren();
  const title = createElement("h2", "Testzustand");
  const preset = document.createElement("select");
  preset.replaceChildren(
    createOption("standard", "Standard"),
    createOption("rich", "Viele Rohstoffe"),
    createOption("poor", "Wenig Rohstoffe"),
    createOption("strongCannons", "Starke Kanonen"),
    createOption("weakCannons", "Schwache Kanonen")
  );
  preset.value = state.simValues.preset;
  preset.addEventListener("change", () => applyPreset(preset.value));

  stateTarget.append(title, labelWrap("Preset", preset));
  stateTarget.append(
    numberInput("Aktiver Spieler Rohstoffe", "activeResources"),
    numberInput("Linker Nachbar Rohstoffe", "neighborResources"),
    numberInput("Aktiver Spieler Antriebe", "activeDrives"),
    numberInput("Linker Nachbar Antriebe", "leftDrives"),
    numberInput("Aktiver Spieler Bordkanonen", "activeCannons"),
    numberInput("Nachbar Bordkanonen", "neighborCannons"),
    numberInput("Manueller Wurf", "manualRoll")
  );
}

function numberInput(label, key) {
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = state.simValues[key];
  input.addEventListener("change", () => {
    state.simValues[key] = Number(input.value) || 0;
  });
  return labelWrap(label, input);
}

function applyPreset(preset) {
  state.simValues.preset = preset;
  const presets = {
    standard: { activeResources: 5, neighborResources: 3, activeCannons: 1, neighborCannons: 1, activeDrives: 2, leftDrives: 1 },
    rich: { activeResources: 12, neighborResources: 8 },
    poor: { activeResources: 1, neighborResources: 0 },
    strongCannons: { activeCannons: 5, neighborCannons: 1, manualRoll: 5 },
    weakCannons: { activeCannons: 0, neighborCannons: 4, manualRoll: 1 }
  };
  state.simValues = { ...state.simValues, ...(presets[preset] ?? {}) };
  render();
}

function handleBoardPick() {
  const step = getCurrentStep();
  if (!["boardJump", "shipSelection", "giftTradeShip"].includes(step?.kind)) return;
  advance("confirm");
}

function getRollChoice(step) {
  const choices = getChoicesForScope(step, "active");
  if (!choices.length) return null;
  const roll = Number(state.simValues.manualRoll) || 0;
  if (roll >= 3) return choices[0];
  return choices[1] ?? choices[0];
}

function advance(choiceId) {
  const flow = getSelectedFlow();
  const step = getCurrentStep();
  const nextStepId = getNextStepId(step, choiceId, "active");
  state.history.push(step?.stepId ?? "?");
  if (nextStepId) {
    state.currentStepId = nextStepId;
  }
  render();
}

function resetCurrentEncounter() {
  const flow = getSelectedFlow();
  state.currentStepId = getStartStep(flow)?.stepId ?? null;
  state.history = [];
}

function getSelectedFlow() {
  return flows.find((flow) => flow.id === state.selectedFlowId) ?? flows[0] ?? null;
}

function getCurrentStep() {
  const flow = getSelectedFlow();
  return getStep(flow, state.currentStepId) ?? getStartStep(flow);
}

function getFirstLine(flow) {
  const start = getStartStep(flow);
  return (start?.activePlayerText || start?.boardText || flow.title).split("\n")[0];
}

function readReviewStatus() {
  try {
    const raw = localStorage.getItem(reviewStorageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReviewStatus() {
  localStorage.setItem(reviewStorageKey, JSON.stringify(state.reviewStatus));
}

function exportReviewStatus() {
  const payload = {
    exportedAt: new Date().toISOString(),
    source: "debug-encounter-simulator.html",
    reviewStatus: state.reviewStatus
  };
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "encounter-review-status.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function createActionButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function labelWrap(label, input) {
  const wrapper = document.createElement("label");
  wrapper.append(createElement("span", label), input);
  return wrapper;
}

function createElement(tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
