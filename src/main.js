import { boardLayout, resourceColors } from "./data/boardLayout.js";
import { defaultLanguage, getText, languages } from "./i18n.js";

const languageStorageKey = "star-odyssey-language";
const savesStorageKey = "star-odyssey-saves";
const svgNamespace = "http://www.w3.org/2000/svg";
const app = document.querySelector("#app");

const state = {
  language: loadLanguage(),
  view: "menu",
  selectedPlayers: null,
  modal: null,
  notice: ""
};

function loadLanguage() {
  try {
    const storedLanguage = localStorage.getItem(languageStorageKey);
    return languages.includes(storedLanguage) ? storedLanguage : defaultLanguage;
  } catch {
    return defaultLanguage;
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    // The UI still works when storage is unavailable.
  }
}

function readSaves() {
  try {
    const parsedSaves = JSON.parse(localStorage.getItem(savesStorageKey) ?? "[]");
    return Array.isArray(parsedSaves) ? parsedSaves.filter((save) => save && save.id) : [];
  } catch {
    return [];
  }
}

function writeSaves(saves) {
  localStorage.setItem(savesStorageKey, JSON.stringify(saves));
}

function t(key) {
  return getText(state.language, key);
}

function setLanguage(language) {
  state.language = language;
  state.notice = "";
  saveLanguage(language);
  render();
}

function setView(view) {
  state.view = view;
  state.modal = null;
  state.notice = "";
  render();
}

function openModal(modal) {
  state.modal = modal;
  state.notice = "";
  render();
}

function closeModal() {
  state.modal = null;
  render();
}

function startNewGameSetup() {
  state.selectedPlayers = null;
  setView("players");
}

function createButton(label, onClick, className = "menu-button") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function renderLanguageToggle() {
  const wrapper = document.createElement("div");
  wrapper.className = "language-toggle";
  wrapper.setAttribute("aria-label", t("languageToggle"));

  for (const language of languages) {
    const button = createButton(language.toUpperCase(), () => setLanguage(language), "language-button");
    button.setAttribute("aria-pressed", String(language === state.language));
    wrapper.append(button);
  }

  return wrapper;
}

function renderMenu() {
  const screen = document.createElement("section");
  screen.className = "menu-screen";
  screen.setAttribute("aria-labelledby", "screen-title");

  const titleGroup = document.createElement("div");
  titleGroup.className = "title-group";

  const title = document.createElement("h1");
  title.id = "screen-title";
  title.textContent = "Star Odyssey";

  const subtitle = document.createElement("p");
  subtitle.className = "subtitle";
  subtitle.textContent = t("subtitle");

  titleGroup.append(title, subtitle);

  const actions = document.createElement("div");
  actions.className = "menu-actions";
  actions.append(
    createButton(t("newGame"), startNewGameSetup),
    createButton(t("loadGame"), () => openModal("load"))
  );

  screen.append(renderLanguageToggle(), titleGroup, actions, renderNotice());
  return screen;
}

function renderPlayerSelect() {
  const screen = document.createElement("section");
  screen.className = "menu-screen";
  screen.setAttribute("aria-labelledby", "screen-title");

  const title = document.createElement("h1");
  title.id = "screen-title";
  title.className = "setup-title";
  title.textContent = t("selectPlayers");

  const options = document.createElement("div");
  options.className = "player-options";

  for (const count of [2, 3, 4]) {
    const button = createButton(String(count), () => {
      state.selectedPlayers = count;
      render();
    }, "player-button");
    button.setAttribute("aria-label", t("playersLabel").replace("{count}", count));
    button.setAttribute("aria-pressed", String(count === state.selectedPlayers));
    options.append(button);
  }

  const actions = document.createElement("div");
  actions.className = "setup-actions";
  const continueButton = createButton(t("continue"), () => setView("controllers"), "menu-button");
  continueButton.disabled = state.selectedPlayers === null;
  actions.append(
    createButton(t("back"), () => setView("menu"), "secondary-button"),
    continueButton
  );

  screen.append(renderLanguageToggle(), title, options, actions, renderNotice());
  return screen;
}

function renderControllerConnect() {
  const screen = document.createElement("section");
  screen.className = "menu-screen controller-screen";
  screen.setAttribute("aria-labelledby", "screen-title");

  const title = document.createElement("h1");
  title.id = "screen-title";
  title.className = "setup-title";
  title.textContent = t("connectControllers");

  const qrGrid = document.createElement("div");
  qrGrid.className = "qr-grid";

  for (let index = 1; index <= state.selectedPlayers; index += 1) {
    qrGrid.append(renderQrPlaceholder(index));
  }

  const hint = document.createElement("p");
  hint.className = "subtitle small-subtitle";
  hint.textContent = t("qrPlaceholderHint");

  const actions = document.createElement("div");
  actions.className = "setup-actions";
  actions.append(
    createButton(t("back"), () => setView("players"), "secondary-button"),
    createButton(t("startGameNow"), () => setView("board"), "menu-button")
  );

  screen.append(renderLanguageToggle(), title, qrGrid, hint, actions);
  return screen;
}

function renderQrPlaceholder(playerNumber) {
  const card = document.createElement("article");
  card.className = "qr-card";

  const label = document.createElement("h2");
  label.textContent = t("playerNumber").replace("{number}", playerNumber);

  const qrBox = document.createElement("div");
  qrBox.className = "qr-placeholder";
  qrBox.setAttribute("aria-hidden", "true");

  card.append(label, qrBox);
  return card;
}

function renderBoardShell() {
  const screen = document.createElement("section");
  screen.className = "board-screen";
  screen.setAttribute("aria-labelledby", "board-title");

  const hiddenTitle = document.createElement("h1");
  hiddenTitle.id = "board-title";
  hiddenTitle.className = "visually-hidden";
  hiddenTitle.textContent = "Star Odyssey";

  const controls = document.createElement("div");
  controls.className = "board-overlay-controls";
  controls.append(renderLanguageToggle(), createButton("⚙", () => openModal("settings"), "icon-button"));

  const board = document.createElement("div");
  board.className = "board-placeholder";
  board.setAttribute("aria-label", t("boardAreaLabel"));
  board.append(renderBoardSvg());

  screen.append(hiddenTitle, board, controls, renderNotice());
  return screen;
}

function renderBoardSvg() {
  const svg = createSvgElement("svg", {
    class: "board-svg",
    viewBox: `0 0 ${boardLayout.width} ${boardLayout.height}`,
    role: "img",
    "aria-label": t("boardAreaLabel")
  });

  svg.append(renderGridLayer(), renderLinksLayer(), renderSystemsLayer(), renderPointsLayer(), renderBoardLabels());
  return svg;
}

function renderGridLayer() {
  const group = createSvgElement("g", { class: "board-grid-layer" });

  for (const quadrant of boardLayout.spaceQuadrants) {
    group.append(createSvgElement("polygon", {
      class: `quadrant quadrant--${quadrant.kind}`,
      points: hexPoints(quadrant.x, quadrant.y, 96)
    }));
  }

  return group;
}

function renderLinksLayer() {
  const group = createSvgElement("g", { class: "board-links-layer" });
  const pointsById = new Map(boardLayout.points.map((point) => [point.id, point]));

  for (const [fromId, toId] of boardLayout.links) {
    const from = pointsById.get(fromId);
    const to = pointsById.get(toId);
    if (!from || !to) continue;
    group.append(createSvgElement("line", {
      class: "board-link",
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y
    }));
  }

  return group;
}

function renderSystemsLayer() {
  const group = createSvgElement("g", { class: "board-systems-layer" });

  for (const system of boardLayout.startSystems) {
    group.append(renderPlanetSystem(system, "start-system"));
  }

  for (const system of boardLayout.planetSystems) {
    group.append(renderPlanetSystem(system, system.hidden ? "hidden-system" : "planet-system"));
  }

  for (const outpost of boardLayout.outposts) {
    group.append(renderOutpost(outpost));
  }

  return group;
}

function renderPlanetSystem(system, className) {
  const group = createSvgElement("g", { class: className });
  const offsets = [
    { x: -42, y: 34 },
    { x: 0, y: -38 },
    { x: 45, y: 35 }
  ];

  system.resources.forEach((resource, index) => {
    const offset = offsets[index];
    group.append(createSvgElement("circle", {
      class: `planet planet--${resource}`,
      cx: system.x + offset.x,
      cy: system.y + offset.y,
      r: className === "start-system" ? 32 : 28,
      fill: resourceColors[resource]
    }));
  });

  if (system.hidden) {
    group.append(createSvgElement("circle", {
      class: "hidden-marker",
      cx: system.x,
      cy: system.y,
      r: 18
    }));
  }

  return group;
}

function renderOutpost(outpost) {
  const group = createSvgElement("g", { class: "outpost" });
  group.append(createSvgElement("circle", {
    class: "outpost-ring",
    cx: outpost.x,
    cy: outpost.y,
    r: 52
  }));
  group.append(createSvgElement("rect", {
    class: "outpost-core",
    x: outpost.x - 28,
    y: outpost.y - 28,
    width: 56,
    height: 56,
    rx: 8
  }));
  group.append(createSvgElement("text", {
    class: "outpost-label",
    x: outpost.x,
    y: outpost.y + 8,
    "text-anchor": "middle"
  }));
  group.lastChild.textContent = outpost.name;
  return group;
}

function renderPointsLayer() {
  const group = createSvgElement("g", { class: "board-points-layer" });

  for (const point of boardLayout.points) {
    group.append(createSvgElement("circle", {
      class: `space-point space-point--${point.type}`,
      cx: point.x,
      cy: point.y,
      r: point.type === "space" ? 9 : 13
    }));
  }

  return group;
}

function renderBoardLabels() {
  const group = createSvgElement("g", { class: "board-label-layer" });
  const labels = [
    { x: 64, y: 82, text: t("startArea"), anchor: "start" },
    { x: 1510, y: 82, text: t("progressRight"), anchor: "end" },
    { x: 790, y: 850, text: t("quadrantCount"), anchor: "middle" }
  ];

  for (const label of labels) {
    const text = createSvgElement("text", {
      class: "board-map-label",
      x: label.x,
      y: label.y,
      "text-anchor": label.anchor
    });
    text.textContent = label.text;
    group.append(text);
  }

  return group;
}

function hexPoints(cx, cy, radius) {
  const points = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return points.join(" ");
}

function renderModal() {
  if (!state.modal) return null;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const modal = document.createElement("section");
  modal.className = "modal-panel";
  modal.append(renderModalContent());

  overlay.append(modal);
  return overlay;
}

function renderModalContent() {
  if (state.modal === "save") return renderSaveDialog();
  if (state.modal === "load") return renderLoadDialog();
  return renderSettingsMenu();
}

function renderSettingsMenu() {
  const wrapper = document.createElement("div");
  wrapper.className = "modal-content";

  const title = document.createElement("h2");
  title.textContent = t("ingameMenu");

  const modalNotice = document.createElement("p");
  modalNotice.className = "modal-notice";
  modalNotice.textContent = state.notice;
  modalNotice.hidden = state.notice.length === 0;

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  actions.append(
    createButton(t("save"), () => openModal("save"), "menu-button"),
    createButton(t("loadGame"), () => openModal("load"), "menu-button"),
    createButton(t("backToMenu"), confirmBackToMenu, "secondary-button"),
    createButton(t("close"), closeModal, "secondary-button")
  );

  wrapper.append(title, modalNotice, actions);
  return wrapper;
}

function renderSaveDialog() {
  const wrapper = document.createElement("form");
  wrapper.className = "modal-content";
  wrapper.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentGame(new FormData(wrapper).get("save-name")?.toString() ?? "");
  });

  const title = document.createElement("h2");
  title.textContent = t("saveGame");

  const input = document.createElement("input");
  input.name = "save-name";
  input.type = "text";
  input.maxLength = 48;
  input.placeholder = t("saveNamePlaceholder");
  input.autocomplete = "off";

  const actions = document.createElement("div");
  actions.className = "modal-actions modal-actions--row";
  const saveButton = createButton(t("save"), () => {}, "menu-button");
  saveButton.type = "submit";
  actions.append(
    createButton(t("back"), () => openModal("settings"), "secondary-button"),
    saveButton
  );

  wrapper.append(title, input, actions);
  return wrapper;
}

function renderLoadDialog() {
  const wrapper = document.createElement("div");
  wrapper.className = "modal-content";

  const title = document.createElement("h2");
  title.textContent = t("loadGame");

  const saves = readSaves().sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
  const list = document.createElement("div");
  list.className = "save-list";

  if (saves.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-saves";
    empty.textContent = t("noSaves");
    list.append(empty);
  } else {
    for (const save of saves) {
      list.append(renderSaveItem(save));
    }
  }

  const actions = document.createElement("div");
  actions.className = "modal-actions modal-actions--row";
  actions.append(
    createButton(t("back"), () => state.view === "board" ? openModal("settings") : closeModal(), "secondary-button"),
    createButton(t("close"), closeModal, "secondary-button")
  );

  wrapper.append(title, list, actions);
  return wrapper;
}

function renderSaveItem(save) {
  const item = document.createElement("article");
  item.className = "save-item";

  const details = document.createElement("div");
  details.className = "save-details";

  const name = document.createElement("strong");
  name.textContent = save.name || t("unnamedSave");

  const meta = document.createElement("span");
  meta.textContent = [
    formatSavedAt(save.savedAt),
    save.playerCount ? t("savePlayers").replace("{count}", save.playerCount) : ""
  ].filter(Boolean).join(" · ");

  details.append(name, meta);

  const actions = document.createElement("div");
  actions.className = "save-actions";
  actions.append(
    createButton(t("load"), () => loadSave(save), "small-button"),
    createButton(t("delete"), () => deleteSave(save.id), "small-button secondary-small-button")
  );

  item.append(details, actions);
  return item;
}

function saveCurrentGame(name) {
  const now = new Date();
  const save = {
    id: `save-${now.getTime()}`,
    name: name.trim() || t("defaultSaveName"),
    savedAt: now.toISOString(),
    displayDate: formatSavedAt(now.toISOString()),
    language: state.language,
    playerCount: state.selectedPlayers,
    view: state.view,
    boardState: {
      layoutVersion: boardLayout.layoutVersion,
      exploredSystems: [],
      placeholder: true
    },
    gameState: {
      placeholder: true
    }
  };

  writeSaves([save, ...readSaves()]);
  state.notice = t("saveSuccess");
  state.modal = "settings";
  render();
}

function loadSave(save) {
  const language = languages.includes(save.language) ? save.language : state.language;
  const savedView = ["menu", "players", "controllers", "board"].includes(save.view) ? save.view : "board";
  state.language = language;
  saveLanguage(language);
  state.selectedPlayers = Number.isInteger(save.playerCount) ? save.playerCount : null;
  state.view = savedView;
  state.modal = null;
  state.notice = t("loadSuccess");
  render();
}

function deleteSave(saveId) {
  writeSaves(readSaves().filter((save) => save.id !== saveId));
  render();
}

function confirmBackToMenu() {
  if (window.confirm(t("confirmBackToMenu"))) {
    setView("menu");
  }
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("unknownDate");

  return new Intl.DateTimeFormat(state.language === "de" ? "de-DE" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function renderNotice() {
  const notice = document.createElement("p");
  notice.className = "notice";
  notice.textContent = state.notice;
  notice.hidden = state.notice.length === 0;
  return notice;
}

function render() {
  document.documentElement.lang = state.language;
  app.classList.toggle("app-shell--board", state.view === "board");

  const views = {
    board: renderBoardShell,
    controllers: renderControllerConnect,
    menu: renderMenu,
    players: renderPlayerSelect
  };

  const renderedView = (views[state.view] ?? renderMenu)();
  const renderedModal = renderModal();

  app.replaceChildren(...[renderedView, renderedModal].filter(Boolean));
}

render();
