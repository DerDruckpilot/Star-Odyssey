import { defaultLanguage, getText, languages } from "./i18n.js";

const storageKey = "star-odyssey-language";
const app = document.querySelector("#app");

const state = {
  language: loadLanguage(),
  view: "menu",
  selectedPlayers: 2,
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
    createButton(t("newGame"), () => setView("players")),
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
  actions.append(
    createButton(t("back"), () => setView("menu"), "secondary-button"),
    createButton(t("continue"), () => {
      state.notice = t("continuePlaceholder").replace("{count}", state.selectedPlayers);
      render();
    }, "menu-button")
  );

  screen.append(renderLanguageToggle(), title, options, actions, renderNotice());
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
  app.replaceChildren(state.view === "players" ? renderPlayerSelect() : renderMenu());
}

render();
