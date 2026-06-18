import { getAllFriendshipCards } from "./data/friendshipCards.js";

const cards = getAllFriendshipCards();
const state = {
  search: "",
  peopleId: "all",
  implemented: "all"
};

const searchInput = document.querySelector("#card-search");
const peopleFilter = document.querySelector("#people-filter");
const implementedFilter = document.querySelector("#implemented-filter");
const statsTarget = document.querySelector("#card-stats");
const listTarget = document.querySelector("#card-list");

initializeFilters();
bindControls();
render();

function initializeFilters() {
  const peopleIds = [...new Set(cards.map((card) => card.peopleId))].sort();
  peopleFilter.replaceChildren(
    createOption("all", "Alle"),
    ...peopleIds.map((peopleId) => createOption(peopleId, peopleId))
  );
}

function bindControls() {
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim().toLowerCase();
    render();
  });
  peopleFilter.addEventListener("change", () => {
    state.peopleId = peopleFilter.value;
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
}

function getVisibleCards() {
  return cards.filter((card) => {
    if (state.peopleId !== "all" && card.peopleId !== state.peopleId) return false;
    if (state.implemented === "implemented" && !card.implemented) return false;
    if (state.implemented === "pending" && card.implemented) return false;
    if (!state.search) return true;

    return normalizeSearchText([
      card.id,
      card.peopleId,
      card.outpostType,
      card.titleDe,
      card.titleEn,
      card.summaryDe,
      card.summaryEn,
      card.effectType,
      card.timing,
      card.notes,
      JSON.stringify(card.effectValue)
    ]).includes(state.search);
  });
}

function renderStats(visibleCards) {
  const implementedCount = cards.filter((card) => card.implemented).length;
  const pendingCount = cards.length - implementedCount;
  statsTarget.replaceChildren(
    renderStat("Gesamt", cards.length),
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
    renderPill(card.peopleId),
    renderPill(card.implemented ? "implemented" : "pending", card.implemented ? "debug-pill--ok" : "debug-pill--warn")
  );

  const body = document.createElement("div");
  body.className = "debug-card-body";
  body.append(
    renderFieldGrid([
      ["Karten-ID", card.id],
      ["Volk / Außenposten", card.peopleId],
      ["Titel DE", card.titleDe],
      ["Titel EN", card.titleEn],
      ["Beschreibung DE", card.summaryDe],
      ["Beschreibung EN", card.summaryEn],
      ["Effekt-Typ", card.effectType],
      ["Regelhinweis", getUpgradeBoostRuleNote(card)],
      ["Timing", card.timing],
      ["Implementiert", String(card.implemented)],
      ["Notes / TODO", card.notes || "-"]
    ]),
    renderJsonBlock("Effekt-Wert", card.effectValue),
    renderJsonBlock("Rohdaten", card)
  );

  details.append(summary, body);
  return details;
}

function getUpgradeBoostRuleNote(card) {
  if (card.effectType !== "upgradeBoost") return "-";
  return "Bonus ist kein echter Mutterschiff-Anbau, zählt nicht gegen Anbau-Limits und wird bei Zahn-der-Zeit-/Anbauverlust-Effekten nicht entfernt.";
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
