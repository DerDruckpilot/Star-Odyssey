import { boardLayout, resourceColors } from "./data/boardLayout.js";
import { bankTradeRates, buildActionDefinitions, resourceTypes, upgradeDefinitions } from "./data/buildCosts.js";
import {
  advanceToFlightPhase,
  buildShip,
  buyUpgrade,
  createGameState,
  currentGameStorageKey,
  determineFlightSpeed,
  drawSupply,
  endCurrentTurn,
  foundColony,
  foundTradeStation,
  getReachableNodes,
  normalizeGameState,
  moveShip,
  placeInitialColony,
  placeInitialColonyShip,
  placeInitialSpaceport,
  rollProduction,
  rollPlacementStart,
  touchGameState,
  tradeWithSupply,
  upgradeColonyToSpaceport
} from "./game/gameState.js";
import { defaultLanguage, getText, languages } from "./i18n.js";

const languageStorageKey = "star-odyssey-language";
const savesStorageKey = "star-odyssey-saves";
const svgNamespace = "http://www.w3.org/2000/svg";
const showBoardDebugLabels = false;
const showBoardNodeDebugLabels = false;
const app = document.querySelector("#app");

const state = {
  language: loadLanguage(),
  view: "menu",
  selectedPlayers: null,
  gameState: loadCurrentGameState(),
  tradeFromResource: "ore",
  tradeToResource: "food",
  modal: null,
  hudPlayerId: null,
  hudTab: "turn",
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

function loadCurrentGameState() {
  try {
    const parsedGameState = JSON.parse(localStorage.getItem(currentGameStorageKey) ?? "null");
    if (!parsedGameState) return null;

    return normalizeGameState(parsedGameState, {
      language: parsedGameState.language || loadLanguage(),
      playerCount: parsedGameState.playerCount || 2,
      boardLayout
    });
  } catch {
    return null;
  }
}

function saveCurrentGameState() {
  if (!state.gameState) return;

  try {
    localStorage.setItem(currentGameStorageKey, JSON.stringify(state.gameState));
  } catch {
    // Saving the current game is best-effort for the browser prototype.
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
  if (state.gameState) {
    state.gameState = touchGameState({
      ...state.gameState,
      language
    });
    saveCurrentGameState();
  }
  saveLanguage(language);
  render();
}

function setView(view) {
  state.view = view;
  state.modal = null;
  state.hudPlayerId = null;
  state.notice = "";
  render();
}

function openModal(modal) {
  state.modal = modal;
  state.hudPlayerId = null;
  state.notice = "";
  render();
}

function closeModal() {
  state.modal = null;
  render();
}

function openPlayerHud(playerId) {
  state.hudPlayerId = playerId;
  state.hudTab = "turn";
  state.modal = null;
  state.notice = "";
  render();
}

function closePlayerHud() {
  state.hudPlayerId = null;
  render();
}

function startNewGameSetup() {
  state.selectedPlayers = null;
  setView("players");
}

function startGameNow() {
  state.gameState = createGameState({
    language: state.language,
    playerCount: state.selectedPlayers,
    boardLayout
  });
  state.selectedPlayers = state.gameState.playerCount;
  saveCurrentGameState();
  setView("board");
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

function enableBoardElementSelection(element, type, id) {
  element.classList.add("board-element");
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");
  element.setAttribute("aria-label", `${getBoardElementTypeLabel(type)} ${id}`);
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    selectBoardElement(type, id);
  });
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectBoardElement(type, id);
    }
  });
  return element;
}

function selectBoardElement(type, id) {
  if (!state.gameState) return;

  if (type === "spacePoint" && handlePlacementPointSelection(id)) return;
  if (type === "spacePoint" && moveSelectedShipTo(id)) return;

  state.gameState = touchGameState({
    ...state.gameState,
    board: {
      ...state.gameState.board,
      selectedElement: { type, id }
    }
  });
  saveCurrentGameState();
  render();
}

function handlePlacementPointSelection(nodeId) {
  if (state.gameState?.phase !== "placement") return false;

  const step = state.gameState.placement?.step;
  if (step === "placeSpaceport") {
    const site = getStartColonySiteAtNode(nodeId);
    if (!site || !isValidPlacementColonySite(site)) return false;
    state.gameState = placeInitialSpaceport(state.gameState, boardLayout, site.id);
  } else if (step === "placeColonyShip") {
    if (!isValidPlacementLaunchNode(nodeId)) return false;
    state.gameState = placeInitialColonyShip(state.gameState, boardLayout, nodeId);
  } else if (["placeFirstColony", "placeSecondColony"].includes(step)) {
    const site = getStartColonySiteAtNode(nodeId);
    if (!site || !isValidPlacementColonySite(site)) return false;
    state.gameState = placeInitialColony(state.gameState, boardLayout, site.id);
  } else {
    return false;
  }

  saveCurrentGameState();
  render();
  return true;
}

function determineSpeedForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "flight") return;

  state.gameState = determineFlightSpeed(state.gameState);
  saveCurrentGameState();
  render();
}

function moveSelectedShipTo(targetNodeId) {
  const selectedShip = getSelectedShip();
  if (!selectedShip || !canMoveSelectedShipTo(targetNodeId)) return false;

  state.gameState = moveShip(state.gameState, boardLayout, selectedShip.id, targetNodeId);
  saveCurrentGameState();
  render();
  return true;
}

function rollProductionForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "production") return;

  state.gameState = rollProduction(state.gameState, boardLayout);
  saveCurrentGameState();
  render();
}

function rollPlacementForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "placement") return;

  state.gameState = rollPlacementStart(state.gameState);
  saveCurrentGameState();
  render();
}

function drawSupplyForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = drawSupply(state.gameState);
  saveCurrentGameState();
  render();
}

function goToFlightPhase() {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = advanceToFlightPhase(state.gameState);
  saveCurrentGameState();
  render();
}

function tradeActivePlayerWithSupply() {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = tradeWithSupply(state.gameState, {
    fromResource: state.tradeFromResource,
    toResource: state.tradeToResource
  });
  saveCurrentGameState();
  render();
}

function buyActivePlayerUpgrade(upgradeId) {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = buyUpgrade(state.gameState, upgradeId);
  saveCurrentGameState();
  render();
}

function buildActivePlayerShip(shipType) {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = buildShip(state.gameState, boardLayout, shipType);
  saveCurrentGameState();
  render();
}

function buildActivePlayerSpaceport() {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = upgradeColonyToSpaceport(state.gameState);
  saveCurrentGameState();
  render();
}

function foundColonyWithSelectedShip() {
  const selectedShip = getSelectedShip();
  if (!state.gameState || !selectedShip) return;

  state.gameState = foundColony(state.gameState, boardLayout, selectedShip.id);
  saveCurrentGameState();
  render();
}

function foundTradeStationWithSelectedShip() {
  const selectedShip = getSelectedShip();
  if (!state.gameState || !selectedShip) return;

  state.gameState = foundTradeStation(state.gameState, boardLayout, selectedShip.id);
  saveCurrentGameState();
  render();
}

function endTurn() {
  if (!state.gameState || state.gameState.phase !== "flight") return;

  state.gameState = endCurrentTurn(state.gameState);
  saveCurrentGameState();
  render();
}

function isSelectedElement(type, id) {
  const selectedElement = state.gameState?.board?.selectedElement;
  return selectedElement?.type === type && selectedElement?.id === id;
}

function getBoardElementTypeLabel(type) {
  const labels = {
    outpost: t("outpost"),
    planet: t("planet"),
    planetSystem: t("planetSystem"),
    ship: t("ship"),
    spacePoint: t("spacePoint"),
    structure: t("structure")
  };

  return labels[type] ?? type;
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
    createButton(t("startGameNow"), startGameNow, "menu-button")
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

  screen.append(hiddenTitle, board, renderCompactBoardStatus(), renderPlayerHudButtons(), renderPlayerHudModal(), controls, renderNotice());
  return screen;
}

function renderCompactBoardStatus() {
  const status = document.createElement("div");
  status.className = "compact-board-status";
  const activePlayer = getActivePlayer();
  status.textContent = state.gameState
    ? `${activePlayer?.name ?? ""} · ${t("round")} ${state.gameState.turnNumber} · ${getPhaseLabel(state.gameState.phase)}`
    : "";
  return status;
}

function renderPlayerHudButtons() {
  const players = state.gameState?.players ?? [];
  const wrapper = document.createElement("div");
  wrapper.className = "player-hud-launcher";

  players.forEach((player, index) => {
    const isActive = player.id === getActivePlayer()?.id;
    const label = t("playerNumber").replace("{number}", index + 1);
    const button = createButton(label, () => openPlayerHud(player.id), `player-hud-button${isActive ? " is-active" : ""}`);
    button.setAttribute("aria-pressed", String(state.hudPlayerId === player.id));
    wrapper.append(button);
  });

  return wrapper;
}

function renderPlayerHudModal() {
  if (!state.hudPlayerId || state.view !== "board") return document.createDocumentFragment();

  const player = state.gameState?.players?.find((candidate) => candidate.id === state.hudPlayerId);
  if (!player) return document.createDocumentFragment();

  const overlay = document.createElement("div");
  overlay.className = "player-hud-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.addEventListener("click", closePlayerHud);

  const panel = document.createElement("section");
  panel.className = "player-hud-panel";
  panel.addEventListener("click", (event) => event.stopPropagation());

  const header = document.createElement("header");
  header.className = "player-hud-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "player-hud-title";

  const title = document.createElement("h2");
  title.textContent = player.name;

  titleGroup.append(title, renderHudResourceStrip(player));
  header.append(titleGroup, createButton(t("close"), closePlayerHud, "small-button secondary-small-button"));

  const content = document.createElement("div");
  content.className = "player-hud-content";
  header.append(renderPlayerHudTabs());
  content.append(renderPlayerHudTabContent(player));

  panel.append(header, content);
  overlay.append(panel);
  return overlay;
}

function renderPlayerHudTabs() {
  const tabs = document.createElement("div");
  tabs.className = "player-hud-tabs";
  const tabDefinitions = [
    ["turn", t("tabTurn")],
    ["resources", t("tabTrade")],
    ["upgrades", t("tabUpgrades")],
    ["fleet", t("tabFleet")],
    ["log", t("tabLog")]
  ];

  for (const [tabId, label] of tabDefinitions) {
    const button = createButton(label, () => {
      state.hudTab = tabId;
      render();
    }, "hud-tab-button");
    button.setAttribute("aria-pressed", String(state.hudTab === tabId));
    tabs.append(button);
  }

  return tabs;
}

function renderPlayerHudTabContent(player) {
  const content = document.createElement("div");
  content.className = "player-hud-tab-content";

  if (state.hudTab === "resources") {
    content.append(renderBankTradeControls(player));
  } else if (state.hudTab === "upgrades") {
    content.append(renderUpgradeSummary(player));
    content.append(renderUpgradeControls(player));
  } else if (state.hudTab === "fleet") {
    content.append(renderFleetSummary(player));
    content.append(renderBuildControls(player));
  } else if (state.hudTab === "log") {
    content.append(renderEventLog(), renderSelectionPanel());
  } else {
    content.append(renderTurnSummary(player), renderPhaseActions(player));
  }

  return content;
}

function renderHudResourceStrip(player) {
  const list = document.createElement("dl");
  list.className = "player-hud-resources";

  for (const resource of resourceTypes) {
    const label = document.createElement("dt");
    label.textContent = getResourceLabel(resource);
    const value = document.createElement("dd");
    value.textContent = String(player?.resources?.[resource] ?? 0);
    list.append(label, value);
  }

  return list;
}

function renderTurnSummary(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "turn-summary";

  const gameState = state.gameState;
  const activePlayer = gameState?.players?.[gameState.currentPlayerIndex];
  const rows = [
    `${t("activePlayer")}: ${activePlayer?.name ?? t("noActiveGame")}`,
    player?.id !== activePlayer?.id ? `${t("selected")}: ${player?.name ?? t("noSelection")}` : null,
    `${t("round")} ${gameState?.turnNumber ?? 1}`,
    `${t("phase")}: ${getPhaseLabel(gameState?.phase)}`,
    `${t("lastRoll")}: ${formatLastRoll(gameState?.lastRoll)}`,
    `${t("flightSpeed")}: ${formatFlightSpeed(gameState)}`
  ].filter(Boolean);

  for (const row of rows) {
    const item = document.createElement("p");
    item.textContent = row;
    wrapper.append(item);
  }

  return wrapper;
}

function renderResourceSummary(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "resource-summary";

  const title = document.createElement("strong");
  title.textContent = t("resources");

  const list = document.createElement("dl");

  for (const resource of resourceTypes) {
    const label = document.createElement("dt");
    label.textContent = getResourceLabel(resource);
    const value = document.createElement("dd");
    value.textContent = String(player?.resources?.[resource] ?? 0);
    list.append(label, value);
  }

  wrapper.append(title, list);
  return wrapper;
}

function renderUpgradeSummary(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "upgrade-summary";

  const title = document.createElement("strong");
  title.textContent = t("upgrades");

  const list = document.createElement("dl");

  for (const upgrade of upgradeDefinitions) {
    const label = document.createElement("dt");
    label.textContent = getUpgradeLabel(upgrade.id);
    const value = document.createElement("dd");
    value.textContent = `${player?.upgrades?.[upgrade.id] ?? 0}/${upgrade.limit}`;
    list.append(label, value);
  }

  wrapper.append(title, list);
  return wrapper;
}

function renderFleetSummary(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "fleet-summary";

  const title = document.createElement("strong");
  title.textContent = t("playerAssets");

  const structures = state.gameState?.board?.structures?.filter((structure) => structure.ownerPlayerId === player?.id) ?? [];
  const ships = state.gameState?.board?.ships?.filter((ship) => ship.ownerPlayerId === player?.id) ?? [];
  const rows = [
    [t("victoryPoints"), player?.victoryPoints ?? 0],
    [t("colonies"), structures.filter((structure) => structure.type === "colony").length],
    [t("spaceports"), structures.filter((structure) => structure.type === "spaceport").length],
    [t("colonyShips"), ships.filter((ship) => ship.type === "colonyShip").length],
    [t("tradeShips"), ships.filter((ship) => ship.type === "tradeShip").length]
  ];
  const list = document.createElement("dl");

  for (const [labelText, valueText] of rows) {
    const label = document.createElement("dt");
    label.textContent = labelText;
    const value = document.createElement("dd");
    value.textContent = String(valueText);
    list.append(label, value);
  }

  wrapper.append(title, list);
  return wrapper;
}

function renderPhaseActions(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "phase-actions";

  const title = document.createElement("strong");
  title.textContent = getPhaseLabel(state.gameState?.phase);
  wrapper.append(title);

  if (!state.gameState) {
    const empty = document.createElement("p");
    empty.textContent = t("noActiveGame");
    wrapper.append(empty);
    return wrapper;
  }

  if (player?.id !== getActivePlayer()?.id) {
    const hint = document.createElement("p");
    hint.textContent = t("notYourTurn");
    wrapper.append(hint);
    return wrapper;
  }

  if (state.gameState.phase === "placement") {
    wrapper.append(renderPlacementActions());
  } else if (state.gameState.phase === "production") {
    wrapper.append(createButton(t("rollProduction"), rollProductionForActivePlayer, "small-button"));
  } else if (state.gameState.phase === "tradeBuild") {
    const hint = document.createElement("p");
    hint.textContent = t("tradeBuildReady");
    wrapper.append(hint);
    wrapper.append(renderSupplyDrawControls());
    wrapper.append(
      createButton(t("toFlightPhase"), goToFlightPhase, "small-button")
    );
  } else if (state.gameState.phase === "flight") {
    if (!state.gameState.hasRolledFlightSpeed) {
      wrapper.append(createButton(t("determineSpeed"), determineSpeedForActivePlayer, "small-button"));
    } else {
      wrapper.append(renderFlightControls());
    }
    wrapper.append(createButton(t("endTurn"), endTurn, "small-button"));
  }

  return wrapper;
}

function renderPlacementActions() {
  const wrapper = document.createElement("div");
  wrapper.className = "placement-actions";
  const placement = state.gameState?.placement;

  const rows = [
    `${t("placementStep")}: ${getPlacementStepLabel(placement?.step)}`,
    `${t("placementOrder")}: ${formatPlacementOrder(placement?.order)}`,
    `${t("placementRolls")}: ${formatPlacementRolls(placement)}`
  ];

  for (const row of rows) {
    const item = document.createElement("p");
    item.textContent = row;
    wrapper.append(item);
  }

  const instruction = document.createElement("p");
  instruction.textContent = getPlacementInstruction(placement);
  wrapper.append(instruction);

  if (placement?.step === "rollStartPlayer") {
    wrapper.append(createButton(t("rollStartPlayer"), rollPlacementForActivePlayer, "small-button"));
  }

  return wrapper;
}

function renderSupplyDrawControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "supply-draw-controls";
  const drawCount = getSupplyDrawCount(getActivePlayer());

  if (drawCount > 0 && !hasActivePlayerDrawnSupplyThisTurn()) {
    wrapper.append(createButton(t("drawSupply").replace("{count}", drawCount), drawSupplyForActivePlayer, "small-button"));
  } else {
    const hint = document.createElement("p");
    hint.textContent = t("noSupplyDrawAvailable");
    wrapper.append(hint);
  }

  return wrapper;
}

function renderFlightControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "flight-controls";

  const selectedShip = getSelectedShip();
  const summary = document.createElement("p");
  summary.textContent = selectedShip
    ? `${getShipTypeLabel(selectedShip.type)} · ${t("remainingMovement")}: ${getShipRemainingMovement(selectedShip.id)}`
    : t("selectOwnShip");

  wrapper.append(summary);
  if (selectedShip && canFoundColonyWithShip(selectedShip)) {
    wrapper.append(createButton(t("foundColony"), foundColonyWithSelectedShip, "small-button"));
  }
  if (selectedShip?.type === "tradeShip" && isShipAtDock(selectedShip)) {
    const tradeStationRequirement = getTradeStationRequirement(selectedShip.locationId);
    if (canFoundTradeStationWithShip(selectedShip)) {
      wrapper.append(createButton(t("foundTradeStation"), foundTradeStationWithSelectedShip, "small-button"));
    } else {
      const hint = document.createElement("p");
      hint.textContent = `${t("notEnoughCargoModules")} ${t("requiredCargoModules")}: ${tradeStationRequirement}`;
      wrapper.append(hint);
    }
  }
  return wrapper;
}

function renderBuildControls(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section build-controls";

  const title = document.createElement("strong");
  title.textContent = t("buildShipsStructures");
  wrapper.append(title);

  for (const action of buildActionDefinitions) {
    const card = document.createElement("article");
    card.className = "upgrade-card";

    const label = document.createElement("span");
    label.textContent = getBuildActionLabel(action.id);

    const cost = document.createElement("small");
    cost.textContent = `${t("cost")}: ${formatCost(action.cost)}`;

    const button = createButton(t("build"), () => runBuildAction(action.id), "small-button");
    button.disabled = !canTradeBuildActions(player) || !canPlayerBuild(player, action);

    card.append(label, cost, button);
    wrapper.append(card);
  }

  return wrapper;
}

function renderBankTradeControls(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section";

  const title = document.createElement("strong");
  title.textContent = t("bankTrade");

  const fields = document.createElement("div");
  fields.className = "trade-fields";
  fields.append(
    renderResourceSelect(t("give"), state.tradeFromResource, (resource) => {
      state.tradeFromResource = resource;
      render();
    }),
    renderResourceSelect(t("receive"), state.tradeToResource, (resource) => {
      state.tradeToResource = resource;
      render();
    })
  );

  const rate = getBankTradeRate(state.tradeFromResource);
  const tradeButton = createButton(t("trade"), tradeActivePlayerWithSupply, "small-button");
  tradeButton.disabled = !canTradeBuildActions(player) || !canPlayerTrade(player);

  const hint = document.createElement("p");
  hint.textContent = t("tradeRateHint")
    .replace("{give}", rate)
    .replace("{receive}", "1");

  wrapper.append(title, fields, hint, tradeButton);
  return wrapper;
}

function renderUpgradeControls(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section upgrade-controls";

  const title = document.createElement("strong");
  title.textContent = t("buildUpgrades");
  wrapper.append(title);

  for (const upgrade of upgradeDefinitions) {
    const card = document.createElement("article");
    card.className = "upgrade-card";

    const label = document.createElement("span");
    label.textContent = `${getUpgradeLabel(upgrade.id)} ${player?.upgrades?.[upgrade.id] ?? 0}/${upgrade.limit}`;

    const cost = document.createElement("small");
    cost.textContent = `${t("cost")}: ${formatCost(upgrade.cost)}`;

    const button = createButton(t("build"), () => buyActivePlayerUpgrade(upgrade.id), "small-button");
    button.disabled = !canTradeBuildActions(player) || !canPlayerBuyUpgrade(player, upgrade);

    card.append(label, cost, button);
    wrapper.append(card);
  }

  return wrapper;
}

function renderResourceSelect(labelText, selectedResource, onChange) {
  const label = document.createElement("label");
  label.className = "resource-select";

  const caption = document.createElement("span");
  caption.textContent = labelText;

  const select = document.createElement("select");
  for (const resource of resourceTypes) {
    const option = document.createElement("option");
    option.value = resource;
    option.textContent = getResourceLabel(resource);
    option.selected = resource === selectedResource;
    select.append(option);
  }
  select.addEventListener("change", () => onChange(select.value));

  label.append(caption, select);
  return label;
}

function renderEventLog() {
  const wrapper = document.createElement("div");
  wrapper.className = "event-log";

  const title = document.createElement("strong");
  title.textContent = t("eventLog");

  const list = document.createElement("ol");
  const entries = (state.gameState?.log ?? []).slice(-5).reverse();

  if (entries.length === 0) {
    const item = document.createElement("li");
    item.textContent = t("noLogEntries");
    list.append(item);
  } else {
    for (const entry of entries) {
      const item = document.createElement("li");
      item.textContent = formatLogEntry(entry);
      list.append(item);
    }
  }

  wrapper.append(title, list);
  return wrapper;
}

function renderSelectionPanel() {
  const wrapper = document.createElement("div");
  wrapper.className = "selection-panel";

  const title = document.createElement("strong");
  title.textContent = t("selected");

  const selection = resolveSelectedBoardElement();
  const details = document.createElement("p");
  details.textContent = selection ? `${t("type")}: ${selection.typeLabel} · ${t("id")}: ${selection.id}` : t("noSelection");

  wrapper.append(title, details);
  if (selection?.details?.length > 0) {
    const list = document.createElement("ul");
    for (const detail of selection.details) {
      const item = document.createElement("li");
      item.textContent = detail;
      list.append(item);
    }
    wrapper.append(list);
  }
  return wrapper;
}

function getPhaseLabel(phase) {
  const phaseLabels = {
    placement: t("phasePlacement"),
    setup: t("phaseSetup"),
    production: t("phaseProduction"),
    tradeBuild: t("phaseTradeBuild"),
    flight: t("phaseFlight"),
    turnEnd: t("phaseTurnEnd")
  };

  return phaseLabels[phase] ?? phase ?? t("phaseProduction");
}

function getPlacementStepLabel(step) {
  const labels = {
    rollStartPlayer: t("placementRollStartPlayer"),
    placeSpaceport: t("placementPlaceSpaceport"),
    placeColonyShip: t("placementPlaceColonyShip"),
    placeFirstColony: t("placementPlaceFirstColony"),
    placeSecondColony: t("placementPlaceSecondColony"),
    complete: t("placementComplete")
  };
  return labels[step] ?? t("phasePlacement");
}

function getPlacementInstruction(placement) {
  if (placement?.step === "rollStartPlayer") return t("placementRollInstruction");
  if (placement?.step === "placeColonyShip") return t("placementSelectLaunchNode");
  if (["placeSpaceport", "placeFirstColony", "placeSecondColony"].includes(placement?.step)) return t("placementSelectColonySite");
  return "";
}

function formatPlacementOrder(order = []) {
  return order.length > 0 ? order.map(getOwnerName).join(", ") : t("none");
}

function formatPlacementRolls(placement) {
  const rolls = placement?.rolls ?? {};
  const entries = Object.entries(rolls);
  if (entries.length === 0) return t("none");

  return entries.map(([playerId, roll]) => `${getOwnerName(playerId)} ${roll.total}`).join(", ");
}

function formatLastRoll(roll) {
  if (!roll) return t("none");
  if (Array.isArray(roll.dice) && roll.dice.length === 2) {
    return `${roll.total} (${roll.dice[0]} + ${roll.dice[1]})`;
  }

  return String(roll.total);
}

function formatFlightSpeed(gameState) {
  if (!gameState?.hasRolledFlightSpeed) return t("none");
  return `${gameState.flightSpeedTotal} (${gameState.flightSpeedBase} + ${getActivePlayer()?.upgrades?.drive ?? 0})`;
}

function formatLogEntry(entry) {
  const template = entry.messageKey ? t(entry.messageKey) : entry.message;
  if (!template) return entry.message ?? "";

  return Object.entries(entry.messageParams ?? {}).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, formatMessageParam(key, value)),
    template
  );
}

function formatMessageParam(key, value) {
  if (["resource", "giveResource", "receiveResource"].includes(key)) return getResourceLabel(value);
  if (key === "resources") return String(value).split(", ").map((resource) => getResourceLabel(resource)).join(", ");
  if (key === "upgrade") return getUpgradeLabel(value);
  if (key === "ship") return getShipTypeLabel(value);
  return String(value);
}

function resolveSelectedBoardElement() {
  const selectedElement = state.gameState?.board?.selectedElement;
  if (!selectedElement) return null;

  if (selectedElement.type === "planet") {
    const planet = getPlanetById(selectedElement.id);
    if (!planet) return null;
    return {
      id: planet.id,
      typeLabel: t("planet"),
      details: [
        `${t("resource")}: ${getResourceLabel(planet.resource)}`,
        `${t("numberMarker")}: ${planet.number ?? t("none")}`,
        `${t("adjacentSites")}: ${formatIdList(planet.adjacentSiteIds)}`
      ]
    };
  }

  if (selectedElement.type === "planetSystem") {
    const system = [...boardLayout.startSystems, ...getVisiblePlanetSystems()]
      .find((candidate) => candidate.id === selectedElement.id);
    if (!system) return null;
    const explored = isSystemExplored(system.id);
    const planetDetails = (system.planets ?? [])
      .map((planet) => `${getResourceLabel(planet.resource)}${explored && planet.number ? ` ${planet.number}` : ""}`)
      .join(", ");
    return {
      id: system.id,
      typeLabel: t("planetSystem"),
      details: [
        `${t("status")}: ${explored ? t("explored") : t("unexplored")}`,
        `${t("planets")}: ${planetDetails}`
      ]
    };
  }

  if (selectedElement.type === "outpost") {
    const outpost = getVisibleOutposts().find((candidate) => candidate.id === selectedElement.id);
    if (!outpost) return null;
    const stations = getTradeStationsAtOutpost(outpost.id);
    return {
      id: outpost.id,
      typeLabel: t("outpost"),
      details: [
        `${t("tradeStations")}: ${stations.length}`,
        `${t("requiredCargoModules")}: ${stations.length + 1}`
      ]
    };
  }

  if (selectedElement.type === "spacePoint") {
    const point = boardLayout.points.find((candidate) => candidate.id === selectedElement.id);
    if (!point) return null;
    const occupyingShip = getShipAtLocation(point.id);
    const occupyingStructure = getStructureAtLocation(point.id);
    const colonySite = getColonySiteAtNode(point.id);
    const dock = getDockAtNode(point.id);
    const details = [
      `${t("type")}: ${colonySite ? t("colonySite") : point.type}`,
      `${t("occupied")}: ${occupyingShip || occupyingStructure ? t("yes") : t("no")}`
    ];
    if (colonySite) {
      details.push(`${t("colonySite")}: ${occupyingStructure ? t("occupied") : t("free")}`);
      details.push(`${t("planetSystem")}: ${colonySite.systemId}`);
      details.push(`${t("adjacentPlanets")}: ${formatIdList(colonySite.adjacentPlanetIds)}`);
    }
    if (dock) {
      details.push(`${t("dock")}: ${occupyingStructure ? t("occupied") : t("free")}`);
      details.push(`${t("requiredCargoModules")}: ${getTradeStationRequirement(point.id)}`);
    }
    if (occupyingShip) details.push(`${t("ship")}: ${getShipTypeLabel(occupyingShip.type)} · ${getOwnerName(occupyingShip.ownerPlayerId)}`);
    if (occupyingStructure) details.push(`${t("structure")}: ${getStructureTypeLabel(occupyingStructure.type)} · ${getOwnerName(occupyingStructure.ownerPlayerId)}`);
    return {
      id: point.id,
      typeLabel: t("spacePoint"),
      details
    };
  }

  if (selectedElement.type === "structure") {
    const structure = getStructureById(selectedElement.id);
    if (!structure) return null;
    return {
      id: structure.id,
      typeLabel: t("structure"),
      details: [
        `${t("owner")}: ${getOwnerName(structure.ownerPlayerId)}`,
        `${t("type")}: ${getStructureTypeLabel(structure.type)}`,
        `${t("adjacentPlanets")}: ${formatIdList(structure.adjacentPlanetIds)}`
      ]
    };
  }

  if (selectedElement.type === "ship") {
    const ship = getShipById(selectedElement.id);
    if (!ship) return null;
    return {
      id: ship.id,
      typeLabel: t("ship"),
      details: [
        `${t("owner")}: ${getOwnerName(ship.ownerPlayerId)}`,
        `${t("type")}: ${getShipTypeLabel(ship.type)}`,
        `${t("location")}: ${ship.locationId}`,
        `${t("status")}: ${getShipStatusLabel(ship.status)}`,
        ...getShipMovementDetails(ship)
      ]
    };
  }

  return null;
}

function getPlanetById(planetId) {
  return getVisibleProductionPlanets().find((planet) => planet.id === planetId);
}

function getVisiblePlanetSystems() {
  return Array.isArray(state.gameState?.board?.placedSystems)
    ? state.gameState.board.placedSystems
    : (boardLayout.planetSystems ?? []);
}

function getVisibleOutposts() {
  return Array.isArray(state.gameState?.board?.placedOutposts)
    ? state.gameState.board.placedOutposts
    : (boardLayout.outposts ?? []);
}

function getVisibleProductionPlanets() {
  return [...(boardLayout.startSystems ?? []), ...getVisiblePlanetSystems()]
    .flatMap((system) => (system.planets ?? []).map((planet) => ({
      ...planet,
      systemId: system.id
    })));
}

function getStructureById(structureId) {
  return state.gameState?.board?.structures?.find((structure) => structure.id === structureId);
}

function getShipById(shipId) {
  return state.gameState?.board?.ships?.find((ship) => ship.id === shipId);
}

function getShipAtLocation(locationId) {
  return state.gameState?.board?.ships?.find((ship) => ship.locationId === locationId);
}

function getStructureAtLocation(locationId) {
  return state.gameState?.board?.structures?.find((structure) => structure.locationId === locationId);
}

function getStructureRenderPoint(structure) {
  return (boardLayout.startSites ?? []).find((site) => site.id === structure.locationId)
    ?? (boardLayout.points ?? []).find((point) => point.id === structure.locationId);
}

function getOwnerName(ownerPlayerId) {
  return state.gameState?.players?.find((player) => player.id === ownerPlayerId)?.name ?? ownerPlayerId;
}

function getStructureTypeLabel(type) {
  if (type === "spaceport") return t("spaceport");
  if (type === "tradeStation") return t("tradeStation");
  return t("colony");
}

function getResourceLabel(resource) {
  return t(`resource_${resource}`);
}

function getUpgradeLabel(upgrade) {
  return t(`upgrade_${upgrade}`);
}

function getBuildActionLabel(action) {
  return t(`build_${action}`);
}

function getShipTypeLabel(type) {
  return type === "tradeShip" ? t("tradeShip") : t("colonyShip");
}

function getShipStatusLabel(status) {
  return status === "active" ? t("shipStatusActive") : t("shipStatusDocked");
}

function getActivePlayer() {
  return state.gameState?.players?.[state.gameState.currentPlayerIndex] ?? null;
}

function getSelectedShip() {
  const selectedElement = state.gameState?.board?.selectedElement;
  if (selectedElement?.type !== "ship") return null;
  const ship = getShipById(selectedElement.id);
  return ship?.ownerPlayerId === getActivePlayer()?.id ? ship : null;
}

function getShipRemainingMovement(shipId) {
  return state.gameState?.remainingMovementByShipId?.[shipId] ?? 0;
}

function getShipMovementDetails(ship) {
  if (
    state.gameState?.phase !== "flight" ||
    !state.gameState.hasRolledFlightSpeed ||
    ship.ownerPlayerId !== getActivePlayer()?.id
  ) {
    return [];
  }

  return [`${t("remainingMovement")}: ${getShipRemainingMovement(ship.id)}`];
}

function getColonySiteAtNode(nodeId) {
  return getVisibleColonySites().find((site) => site.nodeId === nodeId);
}

function getStartColonySiteAtNode(nodeId) {
  return (boardLayout.startSites ?? []).find((site) => site.nodeId === nodeId);
}

function getVisibleColonySites() {
  return [
    ...(boardLayout.startSites ?? []),
    ...getVisiblePlanetSystems().flatMap((system) => system.colonySites ?? [])
  ];
}

function getBlockedSystemNodeIds() {
  return new Set([
    ...(boardLayout.startSystems ?? []),
    ...getVisiblePlanetSystems()
  ].flatMap((system) => system.blockedNodeIds ?? []));
}

function getDockAtNode(nodeId) {
  return (boardLayout.docks ?? []).find((dock) => dock.nodeId === nodeId);
}

function isSystemExplored(systemId) {
  return (state.gameState?.board?.exploredSystems ?? []).includes(systemId);
}

function isShipAtDock(ship) {
  return Boolean(getDockAtNode(ship.locationId));
}

function canFoundColonyWithShip(ship) {
  const colonySite = getColonySiteAtNode(ship.locationId);
  return Boolean(
    state.gameState?.phase === "flight" &&
    ship.type === "colonyShip" &&
    colonySite &&
    isSystemExplored(colonySite.systemId) &&
    !getStructureAtLocation(colonySite.nodeId)
  );
}

function canFoundTradeStationWithShip(ship) {
  const dock = getDockAtNode(ship.locationId);
  return Boolean(
    state.gameState?.phase === "flight" &&
    ship.type === "tradeShip" &&
    dock &&
    !getStructureAtLocation(dock.nodeId) &&
    (getActivePlayer()?.upgrades?.cargo ?? 0) >= getTradeStationRequirement(ship.locationId)
  );
}

function getTradeStationRequirement(nodeId) {
  const dock = getDockAtNode(nodeId);
  if (!dock) return 1;
  return getTradeStationsAtOutpost(dock.outpostId).length + 1;
}

function getTradeStationsAtOutpost(outpostId) {
  return (state.gameState?.board?.structures ?? [])
    .filter((structure) => structure.type === "tradeStation" && structure.outpostId === outpostId);
}

function getReachableNodeMap() {
  const selectedShip = getSelectedShip();
  if (!selectedShip || state.gameState?.phase !== "flight" || !state.gameState.hasRolledFlightSpeed) return new Map();

  return new Map(getReachableNodes(
    boardLayout,
    state.gameState.board?.ships ?? [],
    selectedShip.id,
    getShipRemainingMovement(selectedShip.id),
    state.gameState.board?.structures ?? [],
    getBlockedSystemNodeIds()
  ).map((node) => [node.id, node.distance]));
}

function canMoveSelectedShipTo(targetNodeId) {
  return getReachableNodeMap().has(targetNodeId);
}

function isFoundablePoint(nodeId) {
  const selectedShip = getSelectedShip();
  if (!selectedShip || selectedShip.locationId !== nodeId) return false;
  return canFoundColonyWithShip(selectedShip) || canFoundTradeStationWithShip(selectedShip);
}

function getActiveUpgradeLevel(upgradeId) {
  return getActivePlayer()?.upgrades?.[upgradeId] ?? 0;
}

function getSupplyDrawCount(player) {
  const victoryPoints = player?.victoryPoints ?? 0;
  if (victoryPoints >= 4 && victoryPoints <= 7) return 2;
  if (victoryPoints >= 8 && victoryPoints <= 9) return 1;
  return 0;
}

function getPlacementPointClass(nodeId) {
  if (state.gameState?.phase !== "placement") return "";
  const step = state.gameState.placement?.step;
  const site = getStartColonySiteAtNode(nodeId);

  if (["placeSpaceport", "placeFirstColony", "placeSecondColony"].includes(step) && site && isValidPlacementColonySite(site)) {
    return " is-placement-target";
  }

  if (step === "placeColonyShip" && isValidPlacementLaunchNode(nodeId)) {
    return " is-placement-target";
  }

  return "";
}

function isValidPlacementColonySite(site) {
  return Boolean(
    site?.isStartSite &&
    !getStructureAtLocation(site.nodeId) &&
    state.gameState?.phase === "placement"
  );
}

function isValidPlacementLaunchNode(nodeId) {
  const site = (boardLayout.startSites ?? [])
    .find((candidate) => candidate.id === state.gameState?.placement?.selectedSpaceportSiteId);
  return Boolean(
    site?.launchNodeIds?.includes(nodeId) &&
    !getShipAtLocation(nodeId) &&
    !getStructureAtLocation(nodeId) &&
    !getBlockedSystemNodeIds().has(nodeId)
  );
}

function hasActivePlayerDrawnSupplyThisTurn() {
  return Boolean(
    state.gameState?.hasDrawnSupplyThisTurn &&
    state.gameState?.supplyDrawTurnKey === getCurrentSupplyDrawTurnKey()
  );
}

function getCurrentSupplyDrawTurnKey() {
  return `${state.gameState?.turnNumber ?? 1}:${getActivePlayer()?.id ?? "unknown"}`;
}

function getBankTradeRate(resource) {
  return resource === "goods" ? bankTradeRates.goods : bankTradeRates.default;
}

function canTradeBuildActions(player) {
  return Boolean(player?.id === getActivePlayer()?.id && state.gameState?.phase === "tradeBuild");
}

function canPlayerTrade(player) {
  if (!player || state.tradeFromResource === state.tradeToResource) return false;
  return (player.resources?.[state.tradeFromResource] ?? 0) >= getBankTradeRate(state.tradeFromResource);
}

function canPlayerBuyUpgrade(player, upgrade) {
  if (!player) return false;
  if ((player.upgrades?.[upgrade.id] ?? 0) >= upgrade.limit) return false;

  return Object.entries(upgrade.cost)
    .every(([resource, amount]) => (player.resources?.[resource] ?? 0) >= amount);
}

function runBuildAction(actionId) {
  if (actionId === "spaceport") {
    buildActivePlayerSpaceport();
  } else {
    buildActivePlayerShip(actionId);
  }
}

function canPlayerBuild(player, action) {
  if (!player || !canPlayerPay(player, action.cost)) return false;
  if (action.id === "spaceport") return hasUpgradeableColony(player.id);
  if (["colonyShip", "tradeShip"].includes(action.id)) return Boolean(findFreeLaunchPointForActivePlayer(player.id));
  return false;
}

function canPlayerPay(player, cost) {
  return Object.entries(cost)
    .every(([resource, amount]) => (player.resources?.[resource] ?? 0) >= amount);
}

function hasUpgradeableColony(playerId) {
  return (state.gameState?.board?.structures ?? [])
    .some((structure) => structure.ownerPlayerId === playerId && structure.type === "colony");
}

function findFreeLaunchPointForActivePlayer(playerId) {
  const occupiedLocationIds = new Set((state.gameState?.board?.ships ?? []).map((ship) => ship.locationId));
  const ownSpaceportLocationIds = new Set(
    (state.gameState?.board?.structures ?? [])
      .filter((structure) => structure.ownerPlayerId === playerId && structure.type === "spaceport")
      .map((structure) => structure.locationId)
  );

  return (boardLayout.spaceportLaunchPoints ?? [])
    .find((point) => ownSpaceportLocationIds.has(point.spaceportLocationId) && !occupiedLocationIds.has(point.id));
}

function formatCost(cost) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${getResourceLabel(resource)}`)
    .join(", ");
}

function formatIdList(ids = []) {
  return ids.length > 0 ? ids.join(", ") : t("none");
}

function renderBoardSvg() {
  const svg = createSvgElement("svg", {
    class: "board-svg",
    viewBox: `0 0 ${boardLayout.width} ${boardLayout.height}`,
    role: "img",
    "aria-label": t("boardAreaLabel")
  });

  svg.append(
    renderGridLayer(),
    renderLinksLayer(),
    renderSystemsLayer(),
    renderPointsLayer(),
    renderStructuresLayer(),
    renderShipsLayer()
  );
  return svg;
}

function renderGridLayer() {
  const group = createSvgElement("g", { class: "board-grid-layer" });

  for (const quadrant of boardLayout.spaceQuadrants) {
    group.append(createSvgElement("polygon", {
      class: `quadrant quadrant--${quadrant.kind}`,
      points: formatSvgPoints(quadrant.corners ?? hexPoints(quadrant.x, quadrant.y, boardLayout.hexRadius ?? 96))
    }));
    if (showBoardDebugLabels) {
      const debugLabel = createSvgElement("text", {
        class: "hex-debug-label",
        x: quadrant.x,
        y: quadrant.y + 5,
        "text-anchor": "middle"
      });
      debugLabel.textContent = quadrant.id;
      group.append(debugLabel);
    }
  }

  return group;
}

function renderLinksLayer() {
  const group = createSvgElement("g", { class: "board-links-layer" });
  const pointsById = new Map(boardLayout.points.map((point) => [point.id, point]));
  const hexKindById = new Map((boardLayout.hexes ?? boardLayout.spaceQuadrants ?? []).map((hex) => [hex.id, hex.kind]));

  const connections = boardLayout.connections ?? boardLayout.links.map(([from, to], index) => ({
    id: `connection-${index + 1}`,
    from,
    to
  }));

  for (const connection of connections) {
    const from = pointsById.get(connection.from);
    const to = pointsById.get(connection.to);
    if (!from || !to) continue;
    const nebulaClass = (connection.hexIds ?? []).some((hexId) => hexKindById.get(hexId) === "nebula")
      ? " board-link--nebula"
      : "";
    group.append(createSvgElement("line", {
      class: `board-link${nebulaClass}`,
      "data-connection-id": connection.id,
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
    group.append(renderPlanetSystem(system, "start-system", true));
  }

  for (const system of getVisiblePlanetSystems()) {
    const explored = isSystemExplored(system.id);
    group.append(renderPlanetSystem(system, explored ? "planet-system" : "hidden-system", explored));
  }

  for (const outpost of getVisibleOutposts()) {
    group.append(renderOutpost(outpost));
  }

  return group;
}

function renderPlanetSystem(system, className, explored) {
  const selectedClass = isSelectedElement("planetSystem", system.id) ? " is-selected" : "";
  const group = createSvgElement("g", { class: `${className}${selectedClass}` });
  enableBoardElementSelection(group, "planetSystem", system.id);
  const offsets = [
    { x: -42, y: 34 },
    { x: 0, y: -38 },
    { x: 45, y: 35 }
  ];

  const planets = system.planets ?? system.resources.map((resource, index) => ({
    id: `${system.id}-planet-${index + 1}`,
    resource
  }));

  planets.forEach((planet, index) => {
    const fallbackOffset = offsets[index] ?? { x: 0, y: 0 };
    const position = getPlanetRenderPosition(system, planet, fallbackOffset);
    const selectedClass = isSelectedElement("planet", planet.id) ? " is-selected" : "";
    const planetElement = createSvgElement("circle", {
      class: `planet planet--${planet.resource}${selectedClass}`,
      "data-planet-id": planet.id,
      cx: position.x,
      cy: position.y,
      r: className === "start-system" ? 32 : 28,
      fill: resourceColors[planet.resource]
    });
    enableBoardElementSelection(planetElement, "planet", planet.id);
    group.append(planetElement);

    if (explored && planet.number) {
      const marker = createSvgElement("text", {
        class: "number-marker",
        x: position.x,
        y: position.y + 7,
        "text-anchor": "middle"
      });
      marker.textContent = planet.number;
      group.append(marker);
    }
  });

  if (!explored) {
    group.append(createSvgElement("circle", {
      class: "hidden-marker",
      cx: system.x,
      cy: system.y,
      r: 18
    }));
  }

  return group;
}

function getPlanetRenderPosition(system, planet, fallbackOffset) {
  const hex = planet.coordinate
    ? (boardLayout.hexes ?? []).find((candidate) => candidate.id === planet.coordinate)
    : null;

  return hex
    ? { x: hex.x, y: hex.y }
    : { x: system.x + fallbackOffset.x, y: system.y + fallbackOffset.y };
}

function renderOutpost(outpost) {
  const selectedClass = isSelectedElement("outpost", outpost.id) ? " is-selected" : "";
  const group = createSvgElement("g", { class: `outpost${selectedClass}` });
  enableBoardElementSelection(group, "outpost", outpost.id);
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
  const reachableNodes = getReachableNodeMap();
  const blockedNodeIds = getBlockedSystemNodeIds();

  for (const point of boardLayout.points) {
    if (blockedNodeIds.has(point.id)) continue;
    const colonySite = getColonySiteAtNode(point.id);
    const selectedClass = isSelectedElement("spacePoint", point.id) ? " is-selected" : "";
    const reachableClass = reachableNodes.has(point.id) ? " is-reachable" : "";
    const occupiedClass = getShipAtLocation(point.id) ? " is-occupied" : "";
    const foundableClass = isFoundablePoint(point.id) ? " is-foundable" : "";
    const placementClass = getPlacementPointClass(point.id);
    const colonySiteClass = colonySite ? " space-point--colony-site" : "";
    const radius = colonySite ? 10 : point.type === "boundary" ? 5 : point.type === "space" ? 7 : 11;
    const pointElement = createSvgElement("circle", {
      class: `space-point space-point--${point.type}${colonySiteClass}${selectedClass}${reachableClass}${occupiedClass}${foundableClass}${placementClass}`,
      cx: point.x,
      cy: point.y,
      r: radius
    });
    enableBoardElementSelection(pointElement, "spacePoint", point.id);
    group.append(pointElement);

    if (showBoardNodeDebugLabels) {
      const debugLabel = createSvgElement("text", {
        class: "node-debug-label",
        x: point.x,
        y: point.y - 9,
        "text-anchor": "middle"
      });
      debugLabel.textContent = point.id;
      group.append(debugLabel);
    }
  }

  return group;
}

function renderStructuresLayer() {
  const group = createSvgElement("g", { class: "board-structures-layer" });

  for (const structure of state.gameState?.board?.structures ?? []) {
    const site = getStructureRenderPoint(structure);
    if (!site) continue;
    const selectedClass = isSelectedElement("structure", structure.id) ? " is-selected" : "";
    const ownerIndex = Number.parseInt(structure.ownerPlayerId.replace("player-", ""), 10);
    const structureGroup = createSvgElement("g", {
      class: `structure structure--${structure.type}${selectedClass}`
    });
    enableBoardElementSelection(structureGroup, "structure", structure.id);

    if (structure.type === "tradeStation") {
      structureGroup.append(createSvgElement("polygon", {
        class: `structure-shape player-color-${ownerIndex}`,
        points: `${site.x},${site.y - 18} ${site.x + 18},${site.y} ${site.x},${site.y + 18} ${site.x - 18},${site.y}`
      }));
    } else if (structure.type === "spaceport") {
      structureGroup.append(createSvgElement("rect", {
        class: `structure-shape player-color-${ownerIndex}`,
        x: site.x - 16,
        y: site.y - 16,
        width: 32,
        height: 32,
        rx: 5
      }));
    } else {
      structureGroup.append(createSvgElement("circle", {
        class: `structure-shape player-color-${ownerIndex}`,
        cx: site.x,
        cy: site.y,
        r: 15
      }));
    }

    const label = createSvgElement("text", {
      class: "structure-label",
      x: site.x,
      y: site.y + 6,
      "text-anchor": "middle"
    });
    label.textContent = structure.ownerPlayerId.replace("player-", "");
    structureGroup.append(label);
    group.append(structureGroup);
  }

  return group;
}

function renderShipsLayer() {
  const group = createSvgElement("g", { class: "board-ships-layer" });
  const pointsById = new Map((boardLayout.points ?? []).map((point) => [point.id, point]));

  for (const ship of state.gameState?.board?.ships ?? []) {
    const point = pointsById.get(ship.locationId);
    if (!point) continue;
    const selectedClass = isSelectedElement("ship", ship.id) ? " is-selected" : "";
    const shipGroup = createSvgElement("g", {
      class: `ship ship--${ship.type}${selectedClass}`
    });
    enableBoardElementSelection(shipGroup, "ship", ship.id);

    const ownerIndex = Number.parseInt(ship.ownerPlayerId.replace("player-", ""), 10) - 1;
    shipGroup.append(createSvgElement("path", {
      class: `ship-shape player-color-${ownerIndex + 1}`,
      d: ship.type === "tradeShip"
        ? `M ${point.x - 14} ${point.y + 13} L ${point.x} ${point.y - 15} L ${point.x + 14} ${point.y + 13} Z`
        : `M ${point.x - 14} ${point.y} L ${point.x} ${point.y - 16} L ${point.x + 14} ${point.y} L ${point.x} ${point.y + 16} Z`
    }));
    group.append(shipGroup);
  }

  return group;
}

function hexPoints(cx, cy, radius) {
  const points = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  return points;
}

function formatSvgPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
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
  const playerCount = getSavePlayerCount(save);
  meta.textContent = [
    formatSavedAt(save.savedAt),
    playerCount ? t("savePlayers").replace("{count}", playerCount) : ""
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
  if (!state.gameState) {
    state.gameState = createGameState({
      language: state.language,
      playerCount: state.selectedPlayers || 2,
      boardLayout
    });
  }

  const now = new Date();
  state.gameState = touchGameState({
    ...state.gameState,
    language: state.language
  });
  saveCurrentGameState();

  const save = {
    id: `save-${now.getTime()}`,
    name: name.trim() || t("defaultSaveName"),
    savedAt: now.toISOString(),
    displayDate: formatSavedAt(now.toISOString()),
    language: state.language,
    playerCount: state.gameState.playerCount,
    view: "board",
    boardState: state.gameState.board,
    gameState: state.gameState
  };

  writeSaves([save, ...readSaves()]);
  state.notice = t("saveSuccess");
  state.modal = "settings";
  render();
}

function loadSave(save) {
  const sourceGameState = save.gameState && !save.gameState.placeholder
    ? save.gameState
    : {
      language: save.language || state.language,
      playerCount: getSavePlayerCount(save) || 2,
      board: save.boardState
    };
  const restoredGameState = normalizeGameState(sourceGameState, {
    language: save.language || state.language,
    playerCount: getSavePlayerCount(save) || 2,
    boardLayout
  });
  const language = languages.includes(restoredGameState.language) ? restoredGameState.language : state.language;

  state.gameState = touchGameState({
    ...restoredGameState,
    language
  });
  state.language = language;
  saveLanguage(language);
  state.selectedPlayers = state.gameState.playerCount;
  state.view = "board";
  state.modal = null;
  state.notice = t("loadSuccess");
  saveCurrentGameState();
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

function getSavePlayerCount(save) {
  if (Number.isInteger(save.playerCount)) return save.playerCount;
  if (Number.isInteger(save.gameState?.playerCount)) return save.gameState.playerCount;
  return null;
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
