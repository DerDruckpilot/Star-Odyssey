import { getAllEncounterCards, getEncounterDeckIds } from "./data/encounterCards.js";

const cards = getAllEncounterCards();
const activeDeckIds = new Set(getEncounterDeckIds());
const state = {
  search: "",
  type: "all",
  implemented: "all",
  simulationCardId: cards.find((card) => activeDeckIds.has(card.id))?.id ?? cards[0]?.id ?? null,
  selectedChoiceId: null
};

const searchInput = document.querySelector("#card-search");
const typeFilter = document.querySelector("#type-filter");
const implementedFilter = document.querySelector("#implemented-filter");
const statsTarget = document.querySelector("#card-stats");
const listTarget = document.querySelector("#card-list");
const simulatorTarget = document.querySelector("#encounter-simulator");

initializeFilters();
bindControls();
render();

function initializeFilters() {
  const types = [...new Set(cards.map((card) => card.type))].sort();
  typeFilter.replaceChildren(
    createOption("all", "Alle"),
    ...types.map((type) => createOption(type, type))
  );
}

function bindControls() {
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim().toLowerCase();
    render();
  });
  typeFilter.addEventListener("change", () => {
    state.type = typeFilter.value;
    render();
  });
  implementedFilter.addEventListener("change", () => {
    state.implemented = implementedFilter.value;
    render();
  });
  document.querySelector("#expand-all").addEventListener("click", () => setAllDetails(true));
  document.querySelector("#collapse-all").addEventListener("click", () => setAllDetails(false));
}

function render() {
  const visibleCards = getVisibleCards();
  renderStats(visibleCards);
  renderCards(visibleCards);
  renderSimulator();
}

function getVisibleCards() {
  return cards.filter((card) => {
    if (state.type !== "all" && card.type !== state.type) return false;
    if (state.implemented === "implemented" && !card.implemented) return false;
    if (state.implemented === "pending" && card.implemented) return false;
    if (!state.search) return true;

    return normalizeSearchText([
      card.id,
      card.type,
      card.titleDe,
      card.titleEn,
      card.promptDe,
      card.promptEn,
      card.resultsDe,
      card.resultsEn,
      card.notes,
      JSON.stringify(card.choices),
      JSON.stringify(card.effects),
      JSON.stringify(card.results)
    ]).includes(state.search);
  });
}

function renderStats(visibleCards) {
  const implementedCount = cards.filter((card) => card.implemented).length;
  const pendingCount = cards.length - implementedCount;
  statsTarget.replaceChildren(
    renderStat("Gesamt", cards.length),
    renderStat("Aktives Deck", activeDeckIds.size),
    renderStat("Implementiert", implementedCount),
    renderStat("Nicht implementiert", pendingCount),
    renderStat("Sichtbar", visibleCards.length)
  );
}

function renderCards(visibleCards) {
  listTarget.replaceChildren();

  if (visibleCards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "debug-field";
    empty.textContent = "Keine Karten passen zu den aktuellen Filtern.";
    listTarget.append(empty);
    return;
  }

  for (const card of visibleCards) {
    listTarget.append(renderCard(card));
  }
}

function renderCard(card) {
  const details = document.createElement("details");
  details.dataset.cardId = card.id;

  const summary = document.createElement("summary");
  summary.append(
    renderTitle(card.id, card.titleDe, card.titleEn),
    renderPill(card.type),
    renderPill(activeDeckIds.has(card.id) ? "deck" : "reserve", activeDeckIds.has(card.id) ? "debug-pill--ok" : "")
  );

  const body = document.createElement("div");
  body.className = "debug-card-body";
  body.append(
    renderFieldGrid([
      ["Karten-ID", card.id],
      ["Typ / Kategorie", card.type],
      ["Titel DE", card.titleDe],
      ["Titel EN", card.titleEn],
      ["Prompt DE", card.promptDe],
      ["Prompt EN", card.promptEn],
      ["Result DE", card.resultsDe || "-"],
      ["Result EN", card.resultsEn || "-"],
      ["Implementiert", String(card.implemented)],
      ["Im aktiven Deck", String(activeDeckIds.has(card.id))],
      ["Notes / TODO", card.notes || "-"]
    ]),
    renderChoices(card),
    renderJsonBlock("Rohdaten", card)
  );

  const simulateButton = document.createElement("button");
  simulateButton.className = "debug-pill";
  simulateButton.type = "button";
  simulateButton.textContent = "In Simulation öffnen";
  simulateButton.addEventListener("click", () => {
    state.simulationCardId = card.id;
    state.selectedChoiceId = null;
    renderSimulator();
  });
  body.prepend(simulateButton);

  details.append(summary, body);
  return details;
}

function renderChoices(card) {
  const wrapper = document.createElement("div");
  wrapper.className = "debug-choice-list";

  if (!card.choices?.length) {
    wrapper.append(renderField("Choices / Entscheidungen", "Keine Choices hinterlegt."));
    return wrapper;
  }

  card.choices.forEach((choice, index) => {
    const row = document.createElement("div");
    row.className = "debug-choice";
    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${choice.labelDe} / ${choice.labelEn}`;
    row.append(title, renderEffectList(choice.effects));
    wrapper.append(row);
  });

  return wrapper;
}

function renderSimulator() {
  const card = cards.find((candidate) => candidate.id === state.simulationCardId) ?? cards[0];
  simulatorTarget.replaceChildren();

  if (!card) {
    simulatorTarget.textContent = "Keine Begegnungskarten vorhanden.";
    return;
  }

  const title = document.createElement("h2");
  title.textContent = "Ablauf-Simulator";

  const cardTitle = document.createElement("h3");
  cardTitle.textContent = card.titleDe;

  const meta = document.createElement("p");
  meta.textContent = `${card.id} · ${card.type}`;

  const prompt = document.createElement("p");
  prompt.textContent = card.promptDe;

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Simulation zurücksetzen";
  resetButton.addEventListener("click", () => {
    state.selectedChoiceId = null;
    renderSimulator();
  });

  const choices = document.createElement("div");
  choices.className = "debug-sim-choice-row";

  if (!card.choices?.length) {
    choices.append(renderField("Startzustand", "Diese Karte hat keine Choices."));
  } else {
    for (const choice of card.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.labelDe;
      button.disabled = choice.id === state.selectedChoiceId;
      button.addEventListener("click", () => {
        state.selectedChoiceId = choice.id;
        renderSimulator();
      });
      choices.append(button);
    }
  }

  simulatorTarget.append(title, cardTitle, meta, prompt, choices);

  const selectedChoice = card.choices?.find((choice) => choice.id === state.selectedChoiceId);
  if (selectedChoice) {
    const stepTitle = document.createElement("h3");
    stepTitle.textContent = `Gewählte Entscheidung: ${selectedChoice.labelDe}`;
    simulatorTarget.append(stepTitle, renderEffectList(selectedChoice.effects));
  } else {
    simulatorTarget.append(renderField("Startzustand", "Wähle eine Entscheidung, um die Effektkette trocken nachzuvollziehen."));
  }

  simulatorTarget.append(resetButton);
}

function renderEffectList(effects = []) {
  const wrapper = document.createElement("div");
  wrapper.className = "debug-choice-list";

  if (!effects.length) {
    wrapper.append(renderEffect({ type: "none" }));
    return wrapper;
  }

  effects.forEach((effect, index) => {
    wrapper.append(renderEffect(effect, index + 1));
  });
  return wrapper;
}

function renderEffect(effect, index = null) {
  const wrapper = document.createElement("div");
  wrapper.className = "debug-sim-effect";

  const title = document.createElement("strong");
  title.textContent = `${index ? `${index}. ` : ""}${effect.type ?? "unknown"}`;

  const summary = document.createElement("span");
  summary.textContent = describeEffect(effect);

  wrapper.append(title, summary);

  const nested = [];
  if (effect.onSuccess?.length) nested.push(["Erfolg / Success", effect.onSuccess]);
  if (effect.onFailure?.length) nested.push(["Fehlschlag / Failure", effect.onFailure]);
  if (effect.onWin?.length) nested.push(["Sieg / Win", effect.onWin]);
  if (effect.onLose?.length) nested.push(["Niederlage / Lose", effect.onLose]);
  if (effect.outcomes?.length) {
    for (const outcome of effect.outcomes) {
      nested.push([`Wurf ${outcome.range?.join("-") ?? "?"}`, outcome.effects ?? []]);
    }
  }

  for (const [label, childEffects] of nested) {
    const group = document.createElement("details");
    group.open = true;
    const groupTitle = document.createElement("summary");
    groupTitle.textContent = label;
    group.append(groupTitle, renderEffectList(childEffects));
    wrapper.append(group);
  }

  return wrapper;
}

function describeEffect(effect) {
  const details = Object.entries(effect)
    .filter(([key]) => !["onSuccess", "onFailure", "onWin", "onLose", "outcomes"].includes(key))
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
  return details.length ? details.join(" · ") : "Kein weiterer Effekt.";
}

function renderFieldGrid(fields) {
  const grid = document.createElement("dl");
  grid.className = "debug-card-grid";
  for (const [label, value] of fields) {
    grid.append(renderField(label, value));
  }
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

function renderJsonBlock(title, value) {
  const details = document.createElement("details");
  details.className = "debug-json-details";

  const summary = document.createElement("summary");
  summary.className = "debug-pill";
  summary.textContent = title;

  const pre = document.createElement("pre");
  pre.className = "debug-json";
  pre.textContent = JSON.stringify(value, null, 2);

  details.append(summary, pre);
  return details;
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

function normalizeSearchText(parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function setAllDetails(open) {
  listTarget.querySelectorAll("details").forEach((details) => {
    details.open = open;
  });
}
