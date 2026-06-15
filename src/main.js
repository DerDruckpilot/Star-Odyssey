import { defaultLanguage, getText, languages } from "./i18n.js";

const storageKey = "star-odyssey-language";
const app = document.querySelector("#app");

const state = {
  language: loadLanguage(),
  view: "menu",
  selectedPlayers: null,
  notice: ""
};

function loadLanguage() {
  try {
    const storedLanguage = localStorage.getItem(storageKey);
    return languages.includes(storedLanguage) ? storedLanguage : defaultLanguage;
  } catch {
    return defaultLanguage;
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    // The UI still works when storage is unavailable.
  }
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
  state.notice = "";
  render();
}

function startNewGameSetup() {
  state.selectedPlayers = null;
  setView("players");
}

function showLoadPlaceholder() {
  state.notice = t("loadPlaceholder");
  render();
}

function createButton(label, onClick, className = "menu-button") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
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
    createButton(t("loadGame"), showLoadPlaceholder)
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

  const header = document.createElement("header");
  header.className = "board-header";

  const title = document.createElement("h1");
  title.id = "board-title";
  title.textContent = "Star Odyssey";

  header.append(title, renderLanguageToggle());

  const board = document.createElement("div");
  board.className = "board-placeholder";
  board.setAttribute("aria-label", t("boardAreaLabel"));

  const startLabel = document.createElement("span");
  startLabel.className = "board-label start-label";
  startLabel.textContent = t("startArea");

  const directionLabel = document.createElement("span");
  directionLabel.className = "board-label direction-label";
  directionLabel.textContent = t("progressRight");

  const path = document.createElement("div");
  path.className = "star-board-path";

  for (let index = 0; index < 12; index += 1) {
    const node = document.createElement("span");
    node.className = "board-node";
    path.append(node);
  }

  board.append(startLabel, directionLabel, path);

  const actions = document.createElement("div");
  actions.className = "board-actions";
  actions.append(createButton(t("backToMenu"), () => setView("menu"), "secondary-button"));

  screen.append(header, board, actions);
  return screen;
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

  app.replaceChildren((views[state.view] ?? renderMenu)());
}

render();
