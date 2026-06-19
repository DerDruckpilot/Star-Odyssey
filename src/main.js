import { boardLayout } from "./data/boardLayout.js";
import { buildActionDefinitions, resourceTypes, upgradeDefinitions } from "./data/buildCosts.js";
import { getEncounterCardById } from "./data/encounterCards.js";
import { getFriendshipCardById, getFriendshipCardSummary, getFriendshipCardTitle } from "./data/friendshipCards.js";
import {
  formatTokenLabel,
  getPlanetToken,
  getTokenGroupLabel,
  isActiveSpecialToken
} from "./data/numberTokens.js";
import {
  getOutpostAssetPath,
  getTradeStationAssetPath,
  outpostVisualDefaults
} from "./data/outpostVisuals.js";
import {
  getPlayerColonyAssetPath,
  getPlayerShipAssetPath,
  getPlayerSpaceportAssetPath,
  playerPieceVisualDefaults
} from "./data/playerPieceVisuals.js";
import {
  getStructureVisualPosition,
  structureVisualReferenceLayouts
} from "./data/structureVisualLayouts.js";
import { mothershipUpgradeSlots, upgradeMenuAssetPaths, upgradeMenuOrder } from "./data/upgradeVisuals.js";
import {
  advanceToFlightPhase,
  buildShip,
  buyUpgrade,
  cancelPendingShipPlacement,
  cancelPendingSpaceportUpgrade,
  cancelPendingTradeStationPlacement,
  cancelTradeOffer,
  confirmPendingTradeStationPlacement,
  confirmPendingSpaceportUpgrade,
  createTradeOffer,
  createGameState,
  currentGameStorageKey,
  calculateVictoryPoints,
  determineFlightSpeed,
  drawSupply,
  distributeSevenSupply,
  endCurrentTurn,
  finishEncounter,
  foundColony,
  foundTradeStation,
  getCargoValueForPlayer,
  getEffectiveUpgradeValue,
  getFriendshipUpgradeBonus,
  getRealUpgradeValue,
  getReachableNodes,
  getShipDestinationState,
  getTradeRatesForPlayer,
  normalizeGameState,
  moveShip,
  placePendingShip,
  placeInitialColony,
  placeInitialColonyShip,
  placeInitialSpaceport,
  respondToTradeOffer,
  resolvePendingFriendshipAction,
  resolveEncounterChoice,
  submitEncounterPending,
  resolveSevenSteal,
  rollProduction,
  rollPlacementStart,
  selectPendingFriendshipCard,
  setSevenStealTarget,
  startPendingSpaceportUpgrade,
  submitSevenDiscard,
  touchGameState,
  tradeWithSupply,
  updateSevenDiscardSelection,
  updateEncounterResourceSelection,
  useBoughtFame,
  useRichHelpsPoor,
} from "./game/gameState.js";
import { defaultLanguage, getText, languages } from "./i18n.js";

const languageStorageKey = "star-odyssey-language";
const savesStorageKey = "star-odyssey-saves";
const svgNamespace = "http://www.w3.org/2000/svg";
const showBoardDebugLabels = false;
const showBoardNodeDebugLabels = false;
const app = document.querySelector("#app");
const planetAssetPaths = {
  ore: "./assets/generated/planets/planet-ore.png",
  fuel: "./assets/generated/planets/planet-fuel.png",
  carbon: "./assets/generated/planets/planet-carbon.png",
  food: "./assets/generated/planets/planet-food.png",
  goods: "./assets/generated/planets/planet-trade.png"
};

const state = {
  language: loadLanguage(),
  view: "menu",
  selectedPlayers: null,
  gameState: loadCurrentGameState(),
  tradeFromResource: "ore",
  tradeToResource: "food",
  tradeOfferTargetPlayerId: null,
  tradeOfferedResources: createEmptyResourceSelection(),
  tradeRequestedResources: createEmptyResourceSelection(),
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

function createEmptyResourceSelection() {
  return Object.fromEntries(resourceTypes.map((resource) => [resource, 0]));
}

function resetTradeOfferDraft() {
  state.tradeOfferTargetPlayerId = null;
  state.tradeOfferedResources = createEmptyResourceSelection();
  state.tradeRequestedResources = createEmptyResourceSelection();
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
  resetTradeOfferDraft();
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

  if (type === "spacePoint" && confirmEncounterTargetAt(id)) return;
  if (type === "spacePoint" && state.gameState.activeEncounter?.pendingStep?.type === "boardTargetSelection") return;
  if (type === "spacePoint" && confirmPendingTradeStationAt(id)) return;
  if (type === "spacePoint" && state.gameState.board?.pendingTradeStationPlacement) return;
  if (type === "spacePoint" && placePendingShipAt(id)) return;
  if (type === "structure" && confirmPendingSpaceportAt(id)) return;
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

function resolveActiveEncounterChoice(choiceId, payload = {}) {
  if (!state.gameState?.activeEncounter) return;

  state.gameState = resolveEncounterChoice(state.gameState, {
    choiceId,
    ...payload
  });
  saveCurrentGameState();
  render();
}

function updateEncounterPendingResourceChoice(resource, delta) {
  if (!state.gameState?.activeEncounter) return;

  state.gameState = updateEncounterResourceSelection(state.gameState, resource, delta);
  saveCurrentGameState();
  render();
}

function submitEncounterPendingAction(payload = {}) {
  if (!state.gameState?.activeEncounter) return;

  state.gameState = submitEncounterPending(state.gameState, payload);
  saveCurrentGameState();
  render();
}

function confirmEncounterTargetAt(nodeId) {
  const pendingStep = state.gameState?.activeEncounter?.pendingStep;
  if (pendingStep?.type !== "boardTargetSelection") return false;
  if (!pendingStep.validNodeIds?.includes(nodeId)) return false;

  state.gameState = submitEncounterPending(state.gameState, { targetNodeId: nodeId });
  saveCurrentGameState();
  render();
  return true;
}

function finishActiveEncounter() {
  if (!state.gameState?.activeEncounter) return;

  state.gameState = finishEncounter(state.gameState);
  saveCurrentGameState();
  render();
}

function moveSelectedShipTo(targetNodeId) {
  const selectedShip = getSelectedShip();
  if (!selectedShip) return false;
  if (!canMoveSelectedShipTo(targetNodeId)) {
    const destination = getSelectedShipDestinationState(targetNodeId);
    if (destination?.reason === "occupied") {
      state.notice = t("destinationOccupied");
    } else if (destination?.passable) {
      state.notice = t("shipCannotLandHere");
    } else {
      state.notice = t("invalidDestination");
    }
    return false;
  }

  state.notice = "";
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

function chooseFriendshipCard(cardId) {
  if (!state.gameState) return;
  state.gameState = selectPendingFriendshipCard(state.gameState, cardId);
  saveCurrentGameState();
  render();
}

function useBoughtFameCard() {
  if (!state.gameState) return;
  state.gameState = useBoughtFame(state.gameState);
  saveCurrentGameState();
  render();
}

function useRichHelpsPoorCard(targetPlayerIds) {
  if (!state.gameState) return;
  state.gameState = useRichHelpsPoor(state.gameState, targetPlayerIds);
  saveCurrentGameState();
  render();
}

function resolveGalacticAid(resource) {
  if (!state.gameState) return;
  state.gameState = resolvePendingFriendshipAction(state.gameState, { resource });
  saveCurrentGameState();
  render();
}

function updateTradeOfferResource(side, resource, delta) {
  const target = side === "requested" ? state.tradeRequestedResources : state.tradeOfferedResources;
  const nextValue = Math.max(0, (target[resource] ?? 0) + delta);
  target[resource] = nextValue;
  render();
}

function setTradeOfferTarget(playerId) {
  state.tradeOfferTargetPlayerId = playerId;
  render();
}

function offerTradeToPlayer() {
  if (!state.gameState) return;
  const activePlayer = getActivePlayer();
  state.gameState = createTradeOffer(state.gameState, {
    fromPlayerId: activePlayer?.id,
    toPlayerId: state.tradeOfferTargetPlayerId,
    offeredResources: state.tradeOfferedResources,
    requestedResources: state.tradeRequestedResources
  });
  resetTradeOfferDraft();
  saveCurrentGameState();
  render();
}

function acceptTradeOffer(playerId) {
  if (!state.gameState) return;
  const previousLogLength = state.gameState.log?.length ?? 0;
  state.gameState = respondToTradeOffer(state.gameState, playerId, "accept");
  const latestLog = state.gameState.log?.[previousLogLength];
  state.notice = latestLog?.messageKey === "logTradeInvalid" ? t("tradeNotPossible") : "";
  saveCurrentGameState();
  render();
}

function declineTradeOffer(playerId) {
  if (!state.gameState) return;
  state.gameState = respondToTradeOffer(state.gameState, playerId, "decline");
  saveCurrentGameState();
  render();
}

function cancelOpenTradeOffer() {
  if (!state.gameState) return;
  state.gameState = cancelTradeOffer(state.gameState, getActivePlayer()?.id);
  saveCurrentGameState();
  render();
}

function updateSevenDiscardForPlayer(playerId, resource, delta) {
  if (!state.gameState?.sevenResolution?.active) return;
  state.gameState = updateSevenDiscardSelection(state.gameState, playerId, resource, delta);
  saveCurrentGameState();
  render();
}

function submitSevenDiscardForPlayer(playerId) {
  if (!state.gameState?.sevenResolution?.active) return;
  state.gameState = submitSevenDiscard(state.gameState, playerId);
  saveCurrentGameState();
  render();
}

function chooseSevenStealTarget(targetPlayerId) {
  if (!state.gameState?.sevenResolution?.active) return;
  state.gameState = setSevenStealTarget(state.gameState, targetPlayerId);
  saveCurrentGameState();
  render();
}

function resolveSevenStealForActivePlayer() {
  if (!state.gameState?.sevenResolution?.active) return;
  state.gameState = resolveSevenSteal(state.gameState);
  saveCurrentGameState();
  render();
}

function distributeSevenSupplyForActivePlayer() {
  if (!state.gameState?.sevenResolution?.active) return;
  state.gameState = distributeSevenSupply(state.gameState);
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

function placePendingShipAt(nodeId) {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return false;
  if (!state.gameState.board?.pendingShipPlacement || !isValidPendingShipLaunchNode(nodeId)) return false;

  state.gameState = placePendingShip(state.gameState, boardLayout, nodeId);
  saveCurrentGameState();
  render();
  return true;
}

function cancelActiveShipBuild() {
  if (!state.gameState) return;

  state.gameState = cancelPendingShipPlacement(state.gameState);
  saveCurrentGameState();
  render();
}

function buildActivePlayerSpaceport() {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = startPendingSpaceportUpgrade(state.gameState);
  saveCurrentGameState();
  render();
}

function confirmPendingSpaceportAt(structureId) {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return false;
  if (!state.gameState.board?.pendingSpaceportUpgrade || !isValidPendingSpaceportTarget(structureId)) return false;

  state.gameState = confirmPendingSpaceportUpgrade(state.gameState, structureId);
  saveCurrentGameState();
  render();
  return true;
}

function cancelActiveSpaceportBuild() {
  if (!state.gameState?.board?.pendingSpaceportUpgrade) return;

  state.gameState = cancelPendingSpaceportUpgrade(state.gameState);
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

function confirmPendingTradeStationAt(nodeId) {
  if (!state.gameState?.board?.pendingTradeStationPlacement) return false;
  const nextState = confirmPendingTradeStationPlacement(state.gameState, boardLayout, nodeId);
  if (nextState === state.gameState) return false;
  state.gameState = nextState;
  saveCurrentGameState();
  render();
  return true;
}

function cancelActiveTradeStationPlacement() {
  if (!state.gameState) return;

  state.gameState = cancelPendingTradeStationPlacement(state.gameState);
  saveCurrentGameState();
  render();
}

function endTurn() {
  if (!state.gameState || state.gameState.phase !== "flight") return;

  state.gameState = endCurrentTurn(state.gameState);
  saveCurrentGameState();
  render();
}

function returnToMenuFromGameOver() {
  state.gameState = null;
  try {
    localStorage.removeItem(currentGameStorageKey);
  } catch {
    // ignore storage cleanup failures
  }
  resetTradeOfferDraft();
  setView("menu");
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

  screen.append(
    hiddenTitle,
    board,
    renderCompactBoardStatus(),
    renderVictoryPointList(),
    renderBoardEventLog(),
    renderPlayerHudButtons(),
    renderPlayerHudModal(),
    renderGameOverOverlay(),
    controls,
    renderNotice()
  );
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

function renderVictoryPointList() {
  const list = document.createElement("div");
  list.className = "victory-point-list";

  for (const [index, player] of (state.gameState?.players ?? []).entries()) {
    const row = document.createElement("div");
    const points = calculateVictoryPoints(state.gameState, player.id);
    row.className = [
      player.id === getActivePlayer()?.id ? "is-active" : "",
      points >= 15 ? "is-winner" : ""
    ].filter(Boolean).join(" ");
    row.textContent = `${t("playerNumber").replace("{number}", index + 1)}: ${points} ${t("victoryPointShort")}`;
    list.append(row);
  }

  return list;
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
  panel.className = `player-hud-panel${state.hudTab === "upgrades" ? " player-hud-panel--upgrades" : ""}`;
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

function renderGameOverOverlay() {
  if (state.view !== "board" || state.gameState?.phase !== "gameOver" || !state.gameState?.winnerPlayerId) {
    return document.createDocumentFragment();
  }

  const winner = state.gameState.players.find((player) => player.id === state.gameState.winnerPlayerId);
  const points = winner ? calculateVictoryPoints(state.gameState, winner.id) : 0;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const panel = document.createElement("section");
  panel.className = "modal-panel";

  const content = document.createElement("div");
  content.className = "modal-content";

  const title = document.createElement("h2");
  title.textContent = t("gameOverTitle");
  const body = document.createElement("p");
  body.textContent = t("gameOverMessage")
    .replace("{player}", winner?.name ?? "")
    .replace("{points}", points);

  content.append(title, body, createButton(t("backToMenu"), returnToMenuFromGameOver, "menu-button"));
  panel.append(content);
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
    ["fleet", t("tabFleet")]
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
    content.append(renderPlayerTradeControls(player), renderBankTradeControls(player));
  } else if (state.hudTab === "upgrades") {
    content.append(renderUpgradeMenu(player));
  } else if (state.hudTab === "fleet") {
    content.append(renderFleetSummary(player));
    content.append(renderFriendshipSummary(player));
    content.append(renderBuildControls(player));
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
    gameState?.sevenResolution?.active ? `${t("sevenStep")}: ${getSevenStepLabel(gameState.sevenResolution.step)}` : null,
    gameState?.activeEncounter ? `${t("encounter")}: ${getEncounterTitle(gameState.activeEncounter.cardId)}` : null,
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
    value.textContent = formatUpgradeValue(player, upgrade);
    list.append(label, value);
  }

  wrapper.append(title, list);
  return wrapper;
}

function renderUpgradeMenu(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "upgrade-menu";

  const shipPanel = document.createElement("section");
  shipPanel.className = "upgrade-ship-panel";
  shipPanel.append(renderMothershipUpgradeVisual(player));
  wrapper.append(shipPanel, renderUpgradeControls(player));
  return wrapper;
}

function renderMothershipUpgradeVisual(player = getActivePlayer()) {
  const visual = document.createElement("div");
  visual.className = "mothership-visual";

  const shipImage = document.createElement("img");
  shipImage.className = "mothership-base";
  shipImage.src = upgradeMenuAssetPaths.mothership;
  shipImage.alt = "";
  shipImage.loading = "lazy";
  shipImage.style.zIndex = "100";
  visual.append(shipImage);

  for (const slot of mothershipUpgradeSlots) {
    const upgradeValue = player?.upgrades?.[slot.upgradeId] ?? 0;
    const assetPath = upgradeMenuAssetPaths.overlays[slot.assetId];
    if (upgradeValue < slot.minValue || !assetPath) continue;

    const overlay = document.createElement("img");
    overlay.className = `mothership-overlay mothership-overlay--${slot.id}`;
    overlay.src = assetPath;
    overlay.alt = "";
    overlay.loading = "lazy";
    overlay.style.width = `${slot.widthPercent}%`;
    overlay.style.transform = `translate(${slot.x}%, ${slot.y}%) scale(${slot.scale ?? 1})`;
    overlay.style.zIndex = String(slot.z ?? (slot.layer === "back" ? 50 : 150));
    visual.append(overlay);
  }

  return visual;
}

function renderFleetSummary(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "fleet-summary";

  const title = document.createElement("strong");
  title.textContent = t("playerAssets");

  const structures = state.gameState?.board?.structures?.filter((structure) => structure.ownerPlayerId === player?.id) ?? [];
  const ships = state.gameState?.board?.ships?.filter((ship) => ship.ownerPlayerId === player?.id) ?? [];
  const rows = [
    [t("victoryPoints"), player ? calculateVictoryPoints(state.gameState, player.id) : 0],
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

function renderFriendshipSummary(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "friendship-summary";

  const title = document.createElement("strong");
  title.textContent = t("friendship");

  const stations = (state.gameState?.board?.structures ?? [])
    .filter((structure) => structure.ownerPlayerId === player?.id && structure.type === "tradeStation");
  const representedOutposts = [...new Set(stations.map((structure) => structure.outpostId))]
    .map((outpostId) => getOutpostById(outpostId))
    .filter(Boolean)
    .map((outpost) => formatOutpostLabel(outpost));
  const friendshipMarkers = (player?.friendshipMarkers ?? [])
    .map((outpostId) => getOutpostById(outpostId))
    .filter(Boolean)
    .map((outpost) => formatOutpostLabel(outpost));
  const friendshipCards = (player?.friendshipCards ?? [])
    .map((cardId) => getFriendshipCardById(cardId))
    .filter(Boolean);

  const rows = [
    [t("tradeStations"), stations.length],
    [t("outpostsRepresented"), representedOutposts.length > 0 ? representedOutposts.join(", ") : t("none")],
    [t("friendshipMarkers"), friendshipMarkers.length > 0 ? friendshipMarkers.join(", ") : t("none")]
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

  if (friendshipCards.length > 0) {
    const cardList = document.createElement("div");
    cardList.className = "friendship-card-list";

    const cardListTitle = document.createElement("p");
    cardListTitle.textContent = t("activeFriendshipCards");
    wrapper.append(cardListTitle);

    for (const card of friendshipCards) {
      const cardElement = document.createElement("article");
      cardElement.className = "friendship-card";
      const cardTitle = document.createElement("strong");
      cardTitle.textContent = getFriendshipCardTitle(card, state.language);
      const cardSummary = document.createElement("p");
      cardSummary.textContent = getFriendshipCardSummary(card, state.language);
      cardElement.append(cardTitle, cardSummary);
      if (!card.implemented) {
        const status = document.createElement("small");
        status.textContent = t("notImplementedYet");
        cardElement.append(status);
      }
      cardList.append(cardElement);
    }

    wrapper.append(cardList);
  }

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

  if (state.gameState.sevenResolution?.active) {
    wrapper.append(renderSevenResolutionActions(player));
    return wrapper;
  }

  if (state.gameState.board?.pendingFriendshipCardSelection) {
    wrapper.append(renderPendingFriendshipCardSelection(player));
    return wrapper;
  }

  if (state.gameState.pendingFriendshipAction) {
    wrapper.append(renderPendingFriendshipAction(player));
    return wrapper;
  }

  if (state.gameState.phase === "flight" && state.gameState.activeEncounter) {
    wrapper.append(renderEncounterActions(player));
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
    const endTurnButton = createButton(t("endTurn"), endTurn, "small-button");
    endTurnButton.disabled = Boolean(
      state.gameState.board?.pendingTradeStationPlacement ||
      state.gameState.board?.pendingFriendshipCardSelection ||
      state.gameState.activeEncounter
    );
    wrapper.append(endTurnButton);
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

function renderPendingFriendshipCardSelection(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "friendship-card-selection";
  const pending = state.gameState?.board?.pendingFriendshipCardSelection;
  if (!pending) return wrapper;

  const title = document.createElement("p");
  title.textContent = t("chooseFriendshipCard");
  wrapper.append(title);

  const hint = document.createElement("p");
  hint.textContent = t("chooseFriendshipCardHint");
  wrapper.append(hint);

  if (player?.id !== pending.ownerPlayerId) {
    const wait = document.createElement("p");
    wait.textContent = t("notYourTurn");
    wrapper.append(wait);
    return wrapper;
  }

  for (const cardId of pending.availableCardIds ?? []) {
    const card = getFriendshipCardById(cardId);
    if (!card) continue;
    const cardButton = document.createElement("button");
    cardButton.type = "button";
    cardButton.className = "friendship-choice-button";
    cardButton.addEventListener("click", () => chooseFriendshipCard(cardId));

    const cardTitle = document.createElement("strong");
    cardTitle.textContent = getFriendshipCardTitle(card, state.language);
    const cardSummary = document.createElement("span");
    cardSummary.textContent = getFriendshipCardSummary(card, state.language);
    cardButton.append(cardTitle, cardSummary);

    if (!card.implemented) {
      const status = document.createElement("small");
      status.textContent = t("notImplementedYet");
      cardButton.append(status);
    }

    wrapper.append(cardButton);
  }

  return wrapper;
}

function renderSevenResolutionActions(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-resolution";
  const sevenResolution = state.gameState?.sevenResolution;
  if (!sevenResolution?.active) return wrapper;

  const title = document.createElement("p");
  title.textContent = t("sevenRolled");
  wrapper.append(title);

  const step = document.createElement("p");
  step.textContent = `${t("sevenStep")}: ${getSevenStepLabel(sevenResolution.step)}`;
  wrapper.append(step);

  if (sevenResolution.step === "discard") {
    wrapper.append(renderSevenDiscardStep(player, sevenResolution));
  } else if (sevenResolution.step === "steal") {
    wrapper.append(renderSevenStealStep(player, sevenResolution));
  } else if (sevenResolution.step === "supply") {
    wrapper.append(renderSevenSupplyStep(player, sevenResolution));
  }

  return wrapper;
}

function renderSevenDiscardStep(player, sevenResolution) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--discard";
  const playerId = player?.id;
  const requiredCount = getSevenDiscardRequirement(playerId);
  const selectedCounts = getSevenDiscardSelection(playerId);
  const selectedTotal = getSelectedResourceCount(selectedCounts);

  const requirementInfo = document.createElement("p");
  requirementInfo.textContent = getPlayersNeedingSevenDiscard().length > 0
    ? t("sevenDiscardPending")
    : t("sevenDiscardComplete");
  wrapper.append(requirementInfo);

  if (requiredCount > 0 && !hasPlayerFinishedSevenDiscard(playerId)) {
    const instruction = document.createElement("p");
    instruction.textContent = t("sevenDiscardInstruction").replace("{count}", requiredCount);
    wrapper.append(instruction, renderSevenDiscardSelectors(player, selectedCounts));

    const selectionInfo = document.createElement("p");
    selectionInfo.textContent = t("sevenDiscardSelected")
      .replace("{selected}", selectedTotal)
      .replace("{count}", requiredCount);
    wrapper.append(selectionInfo);

    const submitButton = createButton(t("discardCards"), () => submitSevenDiscardForPlayer(playerId), "small-button");
    submitButton.disabled = selectedTotal !== requiredCount;
    wrapper.append(submitButton);
  } else if (requiredCount > 0) {
    const done = document.createElement("p");
    done.textContent = t("sevenDiscardDone");
    wrapper.append(done);
  } else {
    const noDiscard = document.createElement("p");
    noDiscard.textContent = t("sevenNoDiscardRequired");
    wrapper.append(noDiscard);
  }

  wrapper.append(renderSevenDiscardStatusList());
  return wrapper;
}

function renderSevenDiscardSelectors(player, selectedCounts) {
  const grid = document.createElement("div");
  grid.className = "seven-discard-grid";

  for (const resource of resourceTypes) {
    const row = document.createElement("div");
    row.className = "seven-discard-row";

    const label = document.createElement("span");
    const owned = player?.resources?.[resource] ?? 0;
    const selected = selectedCounts?.[resource] ?? 0;
    label.textContent = `${getResourceLabel(resource)}: ${owned} (${selected})`;

    const decreaseButton = createButton("-", () => updateSevenDiscardForPlayer(player?.id, resource, -1), "small-button secondary-small-button");
    decreaseButton.disabled = selected <= 0;

    const increaseButton = createButton("+", () => updateSevenDiscardForPlayer(player?.id, resource, 1), "small-button");
    increaseButton.disabled = selected >= owned || getSelectedResourceCount(selectedCounts) >= getSevenDiscardRequirement(player?.id);

    row.append(label, decreaseButton, increaseButton);
    grid.append(row);
  }

  return grid;
}

function renderSevenDiscardStatusList() {
  const list = document.createElement("div");
  list.className = "seven-status-list";

  for (const player of state.gameState?.players ?? []) {
    const item = document.createElement("p");
    const requiredCount = getSevenDiscardRequirement(player.id);
    if (requiredCount <= 0) {
      item.textContent = `${player.name}: ${t("sevenNoDiscardRequired")}`;
    } else if (hasPlayerFinishedSevenDiscard(player.id)) {
      item.textContent = `${player.name}: ${t("sevenDiscardDone")}`;
    } else {
      item.textContent = `${player.name}: ${t("sevenDiscardInstruction").replace("{count}", requiredCount)}`;
    }
    list.append(item);
  }

  return list;
}

function renderSevenStealStep(player, sevenResolution) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--steal";
  const activePlayer = getActivePlayer();
  const candidates = getSevenStealCandidates();

  if (player?.id !== activePlayer?.id) {
    const waiting = document.createElement("p");
    waiting.textContent = t("sevenWaitingForActivePlayer");
    wrapper.append(waiting);
    return wrapper;
  }

  if (candidates.length === 0) {
    const hint = document.createElement("p");
    hint.textContent = t("sevenNoOpponentResources");
    wrapper.append(hint, createButton(t("continue"), resolveSevenStealForActivePlayer, "small-button"));
    return wrapper;
  }

  const instruction = document.createElement("p");
  instruction.textContent = t("sevenChooseOpponent");
  wrapper.append(instruction);

  const targetList = document.createElement("div");
  targetList.className = "seven-target-list";

  for (const candidate of candidates) {
    const button = createButton(candidate.name, () => chooseSevenStealTarget(candidate.id), "small-button secondary-small-button");
    button.setAttribute("aria-pressed", String(sevenResolution.stealTargetPlayerId === candidate.id));
    targetList.append(button);
  }

  const drawButton = createButton(t("drawCard"), resolveSevenStealForActivePlayer, "small-button");
  drawButton.disabled = !sevenResolution.stealTargetPlayerId;
  wrapper.append(targetList, drawButton);
  return wrapper;
}

function renderSevenSupplyStep(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--supply";

  const hint = document.createElement("p");
  hint.textContent = t("sevenSupplyInstruction");
  wrapper.append(hint);

  if (player?.id === getActivePlayer()?.id) {
    wrapper.append(createButton(t("sevenDistributeSupply"), distributeSevenSupplyForActivePlayer, "small-button"));
  } else {
    const waiting = document.createElement("p");
    waiting.textContent = t("sevenWaitingForActivePlayer");
    wrapper.append(waiting);
  }

  return wrapper;
}

function renderPendingFriendshipAction(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "friendship-card-selection";
  const pending = state.gameState?.pendingFriendshipAction;
  if (!pending) return wrapper;

  if (pending.type === "galacticAid") {
    const title = document.createElement("p");
    title.textContent = getFriendshipCardTitle(getFriendshipCardById(pending.cardId), state.language) || t("friendship");
    wrapper.append(title);

    const hint = document.createElement("p");
    hint.textContent = t("galacticAidPrompt");
    wrapper.append(hint);

    if (player?.id !== pending.ownerPlayerId) {
      const wait = document.createElement("p");
      wait.textContent = t("notYourTurn");
      wrapper.append(wait);
      return wrapper;
    }

    const buttonRow = document.createElement("div");
    buttonRow.className = "trade-offer-actions";
    for (const resource of resourceTypes) {
      buttonRow.append(
        createButton(getResourceLabel(resource), () => resolveGalacticAid(resource), "small-button")
      );
    }
    wrapper.append(buttonRow);
  }

  return wrapper;
}

function renderEncounterActions(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-panel";
  const encounter = state.gameState?.activeEncounter;
  const card = encounter ? getEncounterCardById(encounter.cardId) : null;
  if (!encounter || !card) return wrapper;

  const activePlayer = getActivePlayer();
  const title = document.createElement("p");
  title.textContent = `${t("encounterCard")}: ${getEncounterTitle(encounter.cardId)}`;
  const prompt = document.createElement("p");
  prompt.textContent = getLocalizedEncounterText(card.prompt);
  wrapper.append(title, prompt);

  if (encounter.status === "resolved") {
    const result = document.createElement("p");
    result.textContent = getLocalizedEncounterText(encounter.resultText) || t("movementAfterEncounter");
    wrapper.append(result);
    if (player?.id === activePlayer?.id) {
      wrapper.append(createButton(t("finishEncounter"), finishActiveEncounter, "small-button"));
    } else {
      const waiting = document.createElement("p");
      waiting.textContent = t("notYourTurn");
      wrapper.append(waiting);
    }
    return wrapper;
  }

  if (player?.id !== activePlayer?.id) {
    const waiting = document.createElement("p");
    waiting.textContent = t("notYourTurn");
    wrapper.append(waiting);
    return wrapper;
  }

  const chooseHint = document.createElement("p");
  chooseHint.textContent = t("encounterChoose");
  wrapper.append(chooseHint);

  if (encounter.pendingStep?.type === "resourceSelection") {
    wrapper.append(renderEncounterResourceSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "upgradeSelection") {
    wrapper.append(renderEncounterUpgradeSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "boardTargetSelection") {
    wrapper.append(renderEncounterTargetSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "globalUpgradeLossSelection") {
    wrapper.append(renderEncounterGlobalUpgradeSelection(encounter.pendingStep));
    return wrapper;
  }

  const choiceList = document.createElement("div");
  choiceList.className = "encounter-choice-list";
  for (const choice of card.choices ?? []) {
    const label = getLocalizedEncounterText(choice.label) || choice.id;
    const button = createButton(label, () => resolveActiveEncounterChoice(choice.id), "small-button");
    button.disabled = !isEncounterChoiceAvailable(choice, activePlayer);
    choiceList.append(button);
  }
  wrapper.append(choiceList);
  return wrapper;
}

function renderEncounterResourceSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--discard";
  const activePlayer = getActivePlayer();
  const selectedResources = pendingStep.selectedResources ?? createEmptyResourceSelection();
  const selectedTotal = getSelectedResourceCount(selectedResources);
  const amount = pendingStep.amount ?? 0;

  const hint = document.createElement("p");
  hint.textContent = t("encounterResourceSelectionHint")
    .replace("{mode}", pendingStep.mode === "loss" ? t("give") : t("receive"))
    .replace("{count}", amount);
  wrapper.append(hint);

  const selectionInfo = document.createElement("p");
  selectionInfo.textContent = t("encounterSelectionCount")
    .replace("{selected}", selectedTotal)
    .replace("{count}", amount);
  wrapper.append(selectionInfo);

  const grid = document.createElement("div");
  grid.className = "seven-discard-grid";
  for (const resource of resourceTypes) {
    const row = document.createElement("div");
    row.className = "seven-discard-row";

    const label = document.createElement("span");
    const owned = activePlayer?.resources?.[resource] ?? 0;
    const selected = selectedResources?.[resource] ?? 0;
    label.textContent = pendingStep.mode === "loss"
      ? `${getResourceLabel(resource)}: ${owned} (${selected})`
      : `${getResourceLabel(resource)}: ${selected}`;

    const decreaseButton = createButton("-", () => updateEncounterPendingResourceChoice(resource, -1), "small-button secondary-small-button");
    decreaseButton.disabled = selected <= 0;

    const increaseButton = createButton("+", () => updateEncounterPendingResourceChoice(resource, 1), "small-button");
    const cannotAddMore = pendingStep.mode === "loss"
      ? selected >= owned
      : selectedTotal >= amount;
    increaseButton.disabled = cannotAddMore || selectedTotal >= amount;

    row.append(label, decreaseButton, increaseButton);
    grid.append(row);
  }

  const submitButton = createButton(t("confirmEncounterSelection"), () => submitEncounterPendingAction(), "small-button");
  submitButton.disabled = selectedTotal !== amount;
  wrapper.append(grid, submitButton);
  return wrapper;
}

function renderEncounterUpgradeSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const activePlayer = getActivePlayer();
  const hasAvailableLoss = upgradeDefinitions.some((upgrade) => (activePlayer?.upgrades?.[upgrade.id] ?? 0) > 0);

  if (pendingStep.mode === "loss" && !hasAvailableLoss) {
    wrapper.append(createButton(t("continue"), () => submitEncounterPendingAction(), "small-button"));
    return wrapper;
  }

  for (const upgrade of upgradeDefinitions) {
    const button = createButton(
      `${t("chooseUpgrade")} · ${getUpgradeLabel(upgrade.id)}`,
      () => submitEncounterPendingAction({ upgrade: upgrade.id }),
      "small-button"
    );
    const currentAmount = activePlayer?.upgrades?.[upgrade.id] ?? 0;
    if (pendingStep.mode === "loss" && currentAmount <= 0) {
      button.disabled = true;
    }
    if (pendingStep.mode === "gain" && currentAmount >= upgrade.limit) {
      button.disabled = true;
    }
    wrapper.append(button);
  }
  return wrapper;
}

function renderEncounterTargetSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";

  const hint = document.createElement("p");
  hint.textContent = getLocalizedEncounterText(pendingStep.hint) || t("encounterSelectTargetPoint");
  wrapper.append(hint);

  const selection = document.createElement("p");
  selection.textContent = t("encounterChooseBoardTarget");
  wrapper.append(selection);
  return wrapper;
}

function renderEncounterGlobalUpgradeSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const targetPlayer = state.gameState?.players?.find((player) => player.id === pendingStep.currentTargetPlayerId);

  const hint = document.createElement("p");
  hint.textContent = t("encounterAffectedPlayer").replace("{player}", targetPlayer?.name ?? t("none"));
  wrapper.append(hint);

  if (!targetPlayer) {
    wrapper.append(createButton(t("continue"), () => submitEncounterPendingAction(), "small-button"));
    return wrapper;
  }

  for (const upgrade of upgradeDefinitions) {
    const currentAmount = targetPlayer.upgrades?.[upgrade.id] ?? 0;
    const button = createButton(
      `${t("chooseUpgrade")} · ${targetPlayer.name} · ${getUpgradeLabel(upgrade.id)}`,
      () => submitEncounterPendingAction({ upgrade: upgrade.id }),
      "small-button"
    );
    button.disabled = currentAmount <= 0;
    wrapper.append(button);
  }

  return wrapper;
}

function isEncounterChoiceAvailable(choice, player) {
  if (!choice || !player) return false;
  const totalResources = getTotalResourceCount(player.resources);

  return (choice.effects ?? []).every((effect) => {
    if (effect.type === "chooseResourceLoss") {
      return totalResources >= (effect.amount ?? 1);
    }
    return true;
  });
}

function renderFlightControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "flight-controls";

  const selectedShip = getSelectedShip();
  const pendingTradeStationPlacement = state.gameState?.board?.pendingTradeStationPlacement;
  const summary = document.createElement("p");
  summary.textContent = getShipsInSpaceForPlayer().length === 0
    ? t("noShipsInSpace")
    : selectedShip
    ? `${getShipTypeLabel(selectedShip.type)} · ${t("remainingMovement")}: ${getShipRemainingMovement(selectedShip.id)}`
    : t("selectOwnShip");

  wrapper.append(summary);
  if (pendingTradeStationPlacement) {
    const pending = document.createElement("p");
    pending.textContent = `${t("selectDock")}: ${t("chooseTradeStationDockHint")}`;
    wrapper.append(pending, createButton(t("cancelTradeStationBuild"), cancelActiveTradeStationPlacement, "small-button secondary-small-button"));
    return wrapper;
  }
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

  const pendingShipPlacement = state.gameState?.board?.pendingShipPlacement;
  const pendingSpaceportUpgrade = state.gameState?.board?.pendingSpaceportUpgrade;
  if (pendingShipPlacement) {
    const pending = document.createElement("p");
    pending.textContent = `${t("chooseStartPoint")}: ${getShipTypeLabel(pendingShipPlacement.shipType)}. ${t("chooseStartPointHint")}`;
    wrapper.append(pending, createButton(t("cancelShipBuild"), cancelActiveShipBuild, "small-button secondary-small-button"));
  }
  if (pendingSpaceportUpgrade) {
    const pending = document.createElement("p");
    pending.textContent = `${t("selectColony")}: ${t("chooseSpaceportColonyHint")}`;
    wrapper.append(pending, createButton(t("cancelSpaceportBuild"), cancelActiveSpaceportBuild, "small-button secondary-small-button"));
  }

  for (const action of buildActionDefinitions) {
    const card = document.createElement("article");
    card.className = "upgrade-card";

    const label = document.createElement("span");
    label.textContent = getBuildActionLabel(action.id);

    const cost = document.createElement("small");
    cost.textContent = `${t("cost")}: ${formatCost(action.cost)}`;

    const disabledReasonKey = getBuildUnavailableReason(player, action);
    const button = createButton(t("build"), () => runBuildAction(action.id), "small-button");
    button.disabled = Boolean(pendingShipPlacement) || Boolean(pendingSpaceportUpgrade) || !canTradeBuildActions(player) || !canPlayerBuild(player, action);

    card.append(label, cost);
    if (disabledReasonKey) {
      const hint = document.createElement("small");
      hint.textContent = t(disabledReasonKey);
      card.append(hint);
    }
    card.append(button);
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

  const rate = getBankTradeRate(player, state.tradeFromResource);
  const tradeButton = createButton(t("trade"), tradeActivePlayerWithSupply, "small-button");
  tradeButton.disabled = !canTradeBuildActions(player) || !canPlayerTrade(player);

  const hint = document.createElement("p");
  hint.textContent = t("tradeRateHint")
    .replace("{give}", rate)
    .replace("{receive}", "1");

  wrapper.append(title, fields, hint, tradeButton);
  return wrapper;
}

function renderPlayerTradeControls(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section player-trade-controls";

  const title = document.createElement("strong");
  title.textContent = t("playerTrade");
  wrapper.append(title);

  const activeTradeOffer = state.gameState?.activeTradeOffer;
  const activePlayer = getActivePlayer();

  const boughtFameCard = (player?.friendshipCards ?? [])
    .map((cardId) => getFriendshipCardById(cardId))
    .find((card) => card?.implemented && card.effectType === "buyHalfMedal");
  const richHelpsPoorCard = (player?.friendshipCards ?? [])
    .map((cardId) => getFriendshipCardById(cardId))
    .find((card) => card?.implemented && card.effectType === "drawFromLeaders");

  if (boughtFameCard) {
    const fameHint = document.createElement("p");
    fameHint.textContent = getFriendshipCardSummary(boughtFameCard, state.language);
    const fameButton = createButton(t("buyHalfMedal"), useBoughtFameCard, "small-button");
    fameButton.disabled = !canUseBoughtFame(player, boughtFameCard);
    wrapper.append(fameHint, fameButton);
  }

  if (richHelpsPoorCard) {
    wrapper.append(renderRichHelpsPoorControls(player, richHelpsPoorCard));
  }

  if (activeTradeOffer) {
    wrapper.append(renderActiveTradeOffer(player, activeTradeOffer));
    return wrapper;
  }

  if (!canTradeBuildActions(player)) {
    const hint = document.createElement("p");
    hint.textContent = player?.id === activePlayer?.id ? t("tradeOnlyInTradeBuild") : t("notYourTurn");
    wrapper.append(hint);
    return wrapper;
  }

  wrapper.append(renderTradeTargetSelect(), renderTradeResourceConfigurator("offered"), renderTradeResourceConfigurator("requested"));

  const offerButton = createButton(t("offerTrade"), offerTradeToPlayer, "small-button");
  offerButton.disabled = !canCreatePlayerTradeOffer(activePlayer);
  wrapper.append(offerButton);
  return wrapper;
}

function renderRichHelpsPoorControls(player, card) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-resource-configurator";

  const hint = document.createElement("p");
  hint.textContent = getFriendshipCardSummary(card, state.language);
  wrapper.append(hint);

  const eligiblePlayers = getRichHelpsPoorEligiblePlayers(player);
  if (eligiblePlayers.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = t("noLeadingPlayers");
    wrapper.append(empty);
    return wrapper;
  }

  const choiceHint = document.createElement("p");
  choiceHint.textContent = t("chooseLeadingPlayers");
  wrapper.append(choiceHint);

  const checkboxWrap = document.createElement("div");
  checkboxWrap.className = "save-list";
  for (const targetPlayer of eligiblePlayers) {
    const label = document.createElement("label");
    label.className = "resource-select";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = targetPlayer.id;
    label.append(input, document.createTextNode(targetPlayer.name));
    checkboxWrap.append(label);
  }
  wrapper.append(checkboxWrap);

  const getSelectedTargets = () => [...checkboxWrap.querySelectorAll("input:checked")]
    .map((input) => input.value)
    .slice(0, card.effectValue?.maxTargets ?? 2);
  const actionButton = createButton(t("drawFromLeaders"), () => {
    useRichHelpsPoorCard(getSelectedTargets());
  }, "small-button");
  const updateActionState = () => {
    actionButton.disabled = !canUseRichHelpsPoor(player, card) || getSelectedTargets().length === 0;
  };
  checkboxWrap.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", updateActionState);
  });
  updateActionState();
  wrapper.append(actionButton);

  return wrapper;
}

function renderActiveTradeOffer(player, activeTradeOffer) {
  const wrapper = document.createElement("div");
  wrapper.className = "active-trade-offer";
  const fromPlayer = state.gameState?.players?.find((candidate) => candidate.id === activeTradeOffer.fromPlayerId);
  const toPlayer = state.gameState?.players?.find((candidate) => candidate.id === activeTradeOffer.toPlayerId);

  const title = document.createElement("p");
  title.textContent = t("openTradeOffer");
  const summary = document.createElement("p");
  summary.textContent = `${fromPlayer?.name ?? activeTradeOffer.fromPlayerId} -> ${toPlayer?.name ?? activeTradeOffer.toPlayerId}`;
  const offered = document.createElement("p");
  offered.textContent = `${t("youGive")}: ${formatResourceSelection(activeTradeOffer.offeredResources)}`;
  const requested = document.createElement("p");
  requested.textContent = `${t("youReceive")}: ${formatResourceSelection(activeTradeOffer.requestedResources)}`;
  wrapper.append(title, summary, offered, requested);

  if (player?.id === activeTradeOffer.toPlayerId) {
    const actions = document.createElement("div");
    actions.className = "trade-offer-actions";
    actions.append(
      createButton(t("accept"), () => acceptTradeOffer(player.id), "small-button"),
      createButton(t("decline"), () => declineTradeOffer(player.id), "small-button secondary-small-button")
    );
    wrapper.append(actions);
  } else if (player?.id === activeTradeOffer.fromPlayerId) {
    wrapper.append(createButton(t("cancelOffer"), cancelOpenTradeOffer, "small-button secondary-small-button"));
  } else {
    const waiting = document.createElement("p");
    waiting.textContent = t("tradeOfferPending");
    wrapper.append(waiting);
  }

  return wrapper;
}

function renderTradeTargetSelect() {
  const label = document.createElement("label");
  label.className = "resource-select";
  const caption = document.createElement("span");
  caption.textContent = t("targetPlayer");

  const select = document.createElement("select");
  select.value = state.tradeOfferTargetPlayerId ?? "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = t("selectTargetPlayer");
  select.append(emptyOption);

  for (const player of state.gameState?.players ?? []) {
    if (player.id === getActivePlayer()?.id) continue;
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = player.name;
    select.append(option);
  }

  select.addEventListener("change", (event) => {
    setTradeOfferTarget(event.target.value || null);
  });

  label.append(caption, select);
  return label;
}

function renderTradeResourceConfigurator(side) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-resource-configurator";
  const title = document.createElement("strong");
  title.textContent = side === "offered" ? t("youGive") : t("youReceive");
  wrapper.append(title);

  const selection = side === "offered" ? state.tradeOfferedResources : state.tradeRequestedResources;

  for (const resource of resourceTypes) {
    const row = document.createElement("div");
    row.className = "seven-discard-row";
    const label = document.createElement("span");
    label.textContent = `${getResourceLabel(resource)}: ${selection[resource] ?? 0}`;
    const decreaseButton = createButton("-", () => updateTradeOfferResource(side, resource, -1), "small-button secondary-small-button");
    decreaseButton.disabled = (selection[resource] ?? 0) <= 0;
    const increaseButton = createButton("+", () => updateTradeOfferResource(side, resource, 1), "small-button");
    row.append(label, decreaseButton, increaseButton);
    wrapper.append(row);
  }

  return wrapper;
}

function renderUpgradeControls(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section upgrade-controls";

  const title = document.createElement("strong");
  title.textContent = t("buildUpgrades");
  wrapper.append(title);

  const orderedUpgrades = upgradeMenuOrder
    .map((upgradeId) => upgradeDefinitions.find((upgrade) => upgrade.id === upgradeId))
    .filter(Boolean);

  for (const upgrade of orderedUpgrades) {
    const card = document.createElement("article");
    card.className = "upgrade-card upgrade-card--menu";

    const preview = document.createElement("div");
    preview.className = "upgrade-card-preview";

    const image = document.createElement("img");
    image.className = "upgrade-card-blueprint";
    image.src = upgradeMenuAssetPaths.blueprints[upgrade.id];
    image.alt = "";
    image.loading = "lazy";
    preview.append(image);

    const body = document.createElement("div");
    body.className = "upgrade-card-body";

    const label = document.createElement("strong");
    label.className = "upgrade-card-title";
    label.textContent = `${getUpgradeLabel(upgrade.id)} ${formatUpgradeValue(player, upgrade)}`;

    const bonus = player ? getFriendshipUpgradeBonus(state.gameState, player.id, upgrade.id) : 0;
    const bonusText = document.createElement("small");
    bonusText.className = "upgrade-card-bonus";
    bonusText.textContent = bonus > 0
      ? `${t("friendshipUpgradeBonus")} +${bonus} · ${t("effectiveUpgradeValue")}: ${getEffectiveUpgradeValue(state.gameState, player.id, upgrade.id)}`
      : "";

    const cost = document.createElement("small");
    cost.className = "upgrade-card-cost";
    cost.textContent = `${t("cost")}: ${formatCost(upgrade.cost)}`;

    const button = createButton(t("build"), () => buyActivePlayerUpgrade(upgrade.id), "small-button");
    button.disabled = !canTradeBuildActions(player) || !canPlayerBuyUpgrade(player, upgrade);

    const actions = document.createElement("div");
    actions.className = "upgrade-card-actions";
    actions.append(button, cost);

    body.append(label);
    if (bonus > 0) body.append(bonusText);
    body.append(actions);
    card.append(preview, body);
    wrapper.append(card);
  }

  return wrapper;
}

function formatUpgradeValue(player, upgrade) {
  const realValue = getRealUpgradeValue(player, upgrade.id);
  const bonus = player ? getFriendshipUpgradeBonus(state.gameState, player.id, upgrade.id) : 0;
  return bonus > 0
    ? `${realValue}/${upgrade.limit} (+${bonus}, ${t("effectiveUpgradeValue")}: ${realValue + bonus})`
    : `${realValue}/${upgrade.limit}`;
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

function renderBoardEventLog() {
  return renderEventLog({
    className: "board-event-log event-log",
    limit: 10,
    titleKey: "tabLog"
  });
}

function renderEventLog({ className = "event-log", limit = 5, titleKey = "eventLog" } = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = className;

  const title = document.createElement("strong");
  title.textContent = t(titleKey);

  const list = document.createElement("ol");
  const entries = (state.gameState?.log ?? []).slice(-limit).reverse();

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
    turnEnd: t("phaseTurnEnd"),
    gameOver: t("phaseGameOver")
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
  if (!Number.isInteger(gameState.flightSpeedTotal) || !Number.isInteger(gameState.flightSpeedBase)) return t("noShipsInSpace");
  return `${gameState.flightSpeedTotal} (${gameState.flightSpeedBase} + ${getDisplayedFlightBonus(getActivePlayer())})`;
}

function getDisplayedFlightBonus(player) {
  if (!player) return 0;
  return getEffectiveUpgradeValue(state.gameState, player.id, "drive");
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
  if (key === "metric") {
    return value === "speed" ? t("encounterMetricSpeed") : value === "drive" ? t("encounterMetricDrive") : String(value);
  }
  if (key === "outcome") {
    return value === "success" ? t("encounterOutcomeSuccess") : value === "failure" ? t("encounterOutcomeFailure") : String(value);
  }
  if (key === "card") {
    const card = getFriendshipCardById(value);
    return card ? getFriendshipCardTitle(card, state.language) : (t(`friendshipCardTitle_${value}`) || String(value));
  }
  return String(value);
}

function resolveSelectedBoardElement() {
  const selectedElement = state.gameState?.board?.selectedElement;
  if (!selectedElement) return null;

  if (selectedElement.type === "planet") {
    const planet = getPlanetById(selectedElement.id);
    if (!planet) return null;
    const token = getPlanetToken(state.gameState?.board?.numberTokens, planet.id);
    return {
      id: planet.id,
      typeLabel: t("planet"),
      details: [
        `${t("resource")}: ${getResourceLabel(planet.resource)}`,
        `${t("numberMarker")}: ${formatTokenLabel(token) || t("none")}`,
        isActiveSpecialToken(token) ? `${t("specialMarker")}: ${getSpecialMarkerLabel(token)}` : null,
        `${t("adjacentSites")}: ${formatIdList(planet.adjacentSiteIds)}`
      ].filter(Boolean)
    };
  }

  if (selectedElement.type === "planetSystem") {
    const system = [...boardLayout.startSystems, ...getVisiblePlanetSystems()]
      .find((candidate) => candidate.id === selectedElement.id);
    if (!system) return null;
    const explored = isSystemExplored(system.id);
    const planetDetails = (system.planets ?? [])
      .map((planet) => {
        const token = getPlanetToken(state.gameState?.board?.numberTokens, planet.id);
        const label = explored ? formatTokenLabel(token) : getTokenGroupLabel(planet.tokenGroup);
        return `${getResourceLabel(planet.resource)}${label ? ` ${label}` : ""}`;
      })
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
    const holder = outpost.friendshipHolderPlayerId ? getOwnerName(outpost.friendshipHolderPlayerId) : t("none");
    return {
      id: outpost.id,
      typeLabel: t("outpost"),
      details: [
        `${t("outpostType")}: ${getOutpostTypeLabel(outpost.outpostType)}`,
        `${t("tradeStations")}: ${stations.length}`,
        `${t("requiredCargoModules")}: ${stations.length + 1}`,
        `${t("friendshipHolder")}: ${holder}`,
        `${t("stationsByPlayer")}: ${formatStationsByPlayer(outpost.id)}`
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
    const dockingOutpost = getDockingOutpostForNode(point.id);
    const destination = getSelectedShipDestinationState(point.id);
    const details = [
      `${t("type")}: ${colonySite ? t("colonySite") : point.type}`,
      `${t("occupied")}: ${occupyingShip || occupyingStructure ? t("yes") : t("no")}`
    ];
    if (destination) {
      details.push(`${t("validDestination")}: ${destination.validDestination ? t("yes") : t("no")}`);
      details.push(`${t("passablePoint")}: ${destination.passable ? t("yes") : t("no")}`);
      if (!destination.validDestination) {
        details.push(destination.reason === "occupied" ? t("destinationOccupied") : t("shipCannotLandHere"));
      }
    }
    if (colonySite) {
      details.push(`${t("colonySite")}: ${occupyingStructure ? t("occupied") : t("free")}`);
      details.push(`${t("planetSystem")}: ${colonySite.systemId}`);
      details.push(`${t("adjacentPlanets")}: ${formatIdList(colonySite.adjacentPlanetIds)}`);
      if (isColonySiteBlockedBySpecial(colonySite)) details.push(t("siteBlockedBySpecial"));
    }
    if (dock) {
      details.push(`${t("dock")}: ${occupyingStructure ? t("occupied") : t("free")}`);
      details.push(`${t("requiredCargoModules")}: ${getTradeStationRequirement(point.id)}`);
      details.push(`${t("outpost")}: ${formatOutpostLabel(getOutpostById(dock.outpostId))}`);
    }
    if (dockingOutpost) {
      details.push(`${t("outpost")}: ${formatOutpostLabel(dockingOutpost)}`);
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
        structure.outpostId ? `${t("outpost")}: ${formatOutpostLabel(getOutpostById(structure.outpostId))}` : null,
        `${t("adjacentPlanets")}: ${formatIdList(structure.adjacentPlanetIds)}`
      ].filter(Boolean)
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

function getVisibleDocks() {
  return getVisibleOutposts().flatMap((outpost) => outpost.docks ?? []);
}

function getOutpostById(outpostId) {
  return getVisibleOutposts().find((outpost) => outpost.id === outpostId) ?? null;
}

function formatOutpostLabel(outpost) {
  if (!outpost) return t("none");
  return `${outpost.name} · ${getOutpostTypeLabel(outpost.outpostType)}`;
}

function formatStationsByPlayer(outpostId) {
  const counts = new Map();
  for (const station of getTradeStationsAtOutpost(outpostId)) {
    counts.set(station.ownerPlayerId, (counts.get(station.ownerPlayerId) ?? 0) + 1);
  }
  if (counts.size === 0) return t("none");
  return [...counts.entries()]
    .map(([playerId, count]) => `${getOwnerName(playerId)} (${count})`)
    .join(", ");
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
  return getVisibleColonySites().find((site) => site.id === structure.locationId || site.nodeId === structure.locationId)
    ?? (boardLayout.points ?? []).find((point) => point.id === structure.locationId);
}

function getStructureRenderSite(structure) {
  return getVisibleColonySites().find((site) => site.id === structure.locationId || site.nodeId === structure.locationId) ?? null;
}

function getStructureVisualPlacement(structure, site, defaults) {
  if (!["colony", "spaceport"].includes(structure.type)) {
    return {
      x: site.x,
      y: site.y,
      width: defaults.width,
      height: defaults.height,
      hitRadius: defaults.hitRadius,
      rotation: 0,
      z: 0
    };
  }

  const layoutType = site.visualLayoutType;
  const siteIndex = site.siteIndex;
  const visualPosition = getStructureVisualPosition(structure.type, layoutType, siteIndex);
  const system = getPlanetSystemForSite(site);
  const mappedPosition = visualPosition && system
    ? mapStructureVisualPosition(system, layoutType, visualPosition)
    : { x: site.x, y: site.y };

  const scale = visualPosition?.scale ?? 1;
  return {
    x: mappedPosition.x,
    y: mappedPosition.y,
    width: defaults.width * scale,
    height: defaults.height * scale,
    hitRadius: defaults.hitRadius * scale,
    rotation: visualPosition?.rotation ?? 0,
    z: visualPosition?.z ?? 0
  };
}

function getStructureRenderZ(structure) {
  if (!["colony", "spaceport"].includes(structure.type)) return 0;
  const site = getStructureRenderSite(structure);
  if (!site) return 0;
  const visualPosition = getStructureVisualPosition(structure.type, site.visualLayoutType, site.siteIndex);
  return visualPosition?.z ?? 0;
}

function getPlanetSystemForSite(site) {
  return [
    ...(boardLayout.startSystems ?? []),
    ...getVisiblePlanetSystems()
  ].find((system) => system.id === site.systemId) ?? null;
}

function mapStructureVisualPosition(system, layoutType, visualPosition) {
  const reference = structureVisualReferenceLayouts[layoutType];
  const actualCenters = getCanonicalSystemPlanetCenters(system, layoutType);
  if (!reference || actualCenters.length !== 3) {
    return { x: system.x, y: system.y };
  }

  const referenceCenter = averageRenderPoints(reference.centers);
  const actualCenter = averageRenderPoints(actualCenters);
  const referenceBounds = getRenderBounds(reference.centers);
  const actualBounds = getRenderBounds(actualCenters);
  const scaleX = actualBounds.width / referenceBounds.width;
  const scaleY = actualBounds.height / referenceBounds.height;
  const referenceX = (visualPosition.x / 100) * reference.width;
  const referenceY = (visualPosition.y / 100) * reference.height;

  return {
    x: actualCenter.x + (referenceX - referenceCenter.x) * scaleX,
    y: actualCenter.y + (referenceY - referenceCenter.y) * scaleY
  };
}

function getCanonicalSystemPlanetCenters(system, layoutType) {
  const planets = (system.planets ?? [])
    .map((planet, index) => ({
      ...getPlanetRenderPosition(system, planet, { x: 0, y: 0 }),
      index
    }))
    .sort((left, right) => left.y - right.y || left.x - right.x);
  const topY = planets[0]?.y ?? 0;
  const topPlanets = planets.filter((planet) => Math.abs(planet.y - topY) < 1).sort((left, right) => left.x - right.x);
  const bottomPlanets = planets.filter((planet) => Math.abs(planet.y - topY) >= 1).sort((left, right) => left.x - right.x);

  if (layoutType === "twoTopOneBottom" && topPlanets.length === 2 && bottomPlanets.length === 1) {
    return [topPlanets[0], topPlanets[1], bottomPlanets[0]];
  }
  if (layoutType === "oneTopTwoBottom" && topPlanets.length === 1 && bottomPlanets.length === 2) {
    return [topPlanets[0], bottomPlanets[0], bottomPlanets[1]];
  }
  return planets;
}

function averageRenderPoints(points) {
  const total = points.reduce((sum, point) => ({
    x: sum.x + point.x,
    y: sum.y + point.y
  }), { x: 0, y: 0 });

  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
}

function getRenderBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    width: Math.max(...xs) - Math.min(...xs) || 1,
    height: Math.max(...ys) - Math.min(...ys) || 1
  };
}

function getOwnerName(ownerPlayerId) {
  return state.gameState?.players?.find((player) => player.id === ownerPlayerId)?.name ?? ownerPlayerId;
}

function getStructureTypeLabel(type) {
  if (type === "spaceport") return t("spaceport");
  if (type === "tradeStation") return t("tradeStation");
  return t("colony");
}

function getOutpostTypeLabel(outpostType) {
  return t(`outpostType_${outpostType}`);
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

function getPlanetAssetPath(resource) {
  return planetAssetPaths[resource] ?? null;
}

function getSpecialMarkerLabel(token) {
  if (token?.type === "pirate") return t("pirateBase").replace("{value}", token.value);
  if (token?.type === "ice") return t("icePlanet").replace("{value}", token.value);
  return t("none");
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

function getShipsInSpaceForPlayer(playerId = getActivePlayer()?.id) {
  return (state.gameState?.board?.ships ?? []).filter((ship) => ship.ownerPlayerId === playerId);
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

function isColonySiteBlockedBySpecial(colonySite) {
  return (colonySite?.adjacentPlanetIds ?? [])
    .some((planetId) => isActiveSpecialToken(getPlanetToken(state.gameState?.board?.numberTokens, planetId)));
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
  return getVisibleDocks().find((dock) => dock.nodeId === nodeId);
}

function isSystemExplored(systemId) {
  return (state.gameState?.board?.exploredSystems ?? []).includes(systemId);
}

function isShipAtDock(ship) {
  return Boolean(getDockingOutpostForNode(ship.locationId));
}

function canFoundColonyWithShip(ship) {
  const colonySite = getColonySiteAtNode(ship.locationId);
  return Boolean(
    state.gameState?.phase === "flight" &&
    ship.type === "colonyShip" &&
    colonySite &&
    isSystemExplored(colonySite.systemId) &&
    !isColonySiteBlockedBySpecial(colonySite) &&
    !getStructureAtLocation(colonySite.nodeId)
  );
}

function canFoundTradeStationWithShip(ship) {
  const outpost = getDockingOutpostForNode(ship.locationId);
  return Boolean(
    state.gameState?.phase === "flight" &&
    ship.type === "tradeShip" &&
    outpost &&
    getAvailableTradeStationDocks(outpost.id).length > 0 &&
    getCargoValueForPlayer(state.gameState, getActivePlayer()?.id) >= getTradeStationRequirement(ship.locationId)
  );
}

function getTradeStationRequirement(nodeId) {
  const outpost = getDockingOutpostForNode(nodeId) ?? getOutpostById(getDockAtNode(nodeId)?.outpostId);
  if (!outpost) return 1;
  return getTradeStationsAtOutpost(outpost.id).length + 1;
}

function getTradeStationsAtOutpost(outpostId) {
  return (state.gameState?.board?.structures ?? [])
    .filter((structure) => structure.type === "tradeStation" && structure.outpostId === outpostId);
}

function getDockById(dockId) {
  return getVisibleDocks().find((dock) => dock.id === dockId) ?? null;
}

function getDockingOutpostForNode(nodeId) {
  return getVisibleOutposts().find((outpost) => outpost.dockNodeId === nodeId) ?? null;
}

function getSelectedShipDestinationState(targetNodeId) {
  const selectedShip = getSelectedShip();
  if (!selectedShip || !state.gameState) return null;
  return getShipDestinationState(state.gameState, boardLayout, selectedShip.id, targetNodeId);
}

function getPendingTradeStationPlacement() {
  return state.gameState?.board?.pendingTradeStationPlacement ?? null;
}

function getAvailableTradeStationDocks(outpostId) {
  const occupiedDockIds = new Set((state.gameState?.board?.structures ?? []).map((structure) => structure.dockId).filter(Boolean));
  return getVisibleDocks()
    .filter((dock) => dock.outpostId === outpostId && !occupiedDockIds.has(dock.id));
}

function isValidPendingTradeStationNode(nodeId) {
  const pending = getPendingTradeStationPlacement();
  if (!pending) return false;
  const targetDock = getVisibleDocks().find((dock) => dock.nodeId === nodeId);
  return Boolean(targetDock && pending.availableDockIds?.includes(targetDock.id));
}

function getReachableNodeMap() {
  const pendingEncounterStep = state.gameState?.activeEncounter?.pendingStep;
  if (pendingEncounterStep?.type === "boardTargetSelection") {
    const ship = (state.gameState?.board?.ships ?? []).find((candidate) => candidate.id === pendingEncounterStep.shipId);
    return new Map((pendingEncounterStep.validNodeIds ?? []).map((nodeId) => [
      nodeId,
      {
        ...(ship ? getShipDestinationState(state.gameState, boardLayout, ship.id, nodeId) : {}),
        id: nodeId,
        validDestination: true
      }
    ]));
  }

  const selectedShip = getSelectedShip();
  if (!selectedShip || state.gameState?.phase !== "flight" || !state.gameState.hasRolledFlightSpeed || state.gameState?.activeEncounter) return new Map();

  return new Map(getReachableNodes(
    boardLayout,
    state.gameState.board?.ships ?? [],
    selectedShip.id,
    getShipRemainingMovement(selectedShip.id),
    state.gameState.board?.structures ?? [],
    getBlockedSystemNodeIds(),
    state.gameState
  ).map((node) => [node.id, node]));
}

function canMoveSelectedShipTo(targetNodeId) {
  return getReachableNodeMap().get(targetNodeId)?.validDestination === true;
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

function getSevenStepLabel(step) {
  const labels = {
    discard: t("sevenStepDiscard"),
    steal: t("sevenStepSteal"),
    supply: t("sevenStepSupply")
  };
  return labels[step] ?? step;
}

function getEncounterTitle(cardId) {
  const card = getEncounterCardById(cardId);
  return getLocalizedEncounterText(card?.title) || t("noEncounter");
}

function getLocalizedEncounterText(text) {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[state.language] ?? text.de ?? text.en ?? "";
}

function getSevenDiscardRequirement(playerId) {
  return state.gameState?.sevenResolution?.discardRequirements?.[playerId] ?? 0;
}

function getSevenDiscardSelection(playerId) {
  return state.gameState?.sevenResolution?.discardSelections?.[playerId] ?? {};
}

function hasPlayerFinishedSevenDiscard(playerId) {
  return Boolean(state.gameState?.sevenResolution?.discardedPlayerIds?.includes(playerId));
}

function getPlayersNeedingSevenDiscard() {
  const sevenResolution = state.gameState?.sevenResolution;
  if (!sevenResolution?.active) return [];
  return (state.gameState?.players ?? []).filter((player) =>
    getSevenDiscardRequirement(player.id) > 0 && !hasPlayerFinishedSevenDiscard(player.id)
  );
}

function getSelectedResourceCount(resources) {
  return resourceTypes.reduce((sum, resource) => sum + (resources?.[resource] ?? 0), 0);
}

function getTotalResourceCount(resources) {
  return resourceTypes.reduce((sum, resource) => sum + (resources?.[resource] ?? 0), 0);
}

function getSevenStealCandidates() {
  const activePlayerId = getActivePlayer()?.id;
  return (state.gameState?.players ?? []).filter((player) =>
    player.id !== activePlayerId && getTotalResourceCount(player.resources) > 0
  );
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

function getPendingShipPlacementClass(nodeId) {
  return isValidPendingShipLaunchNode(nodeId) ? " is-ship-build-target" : "";
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

function isValidPendingShipLaunchNode(nodeId) {
  const pending = state.gameState?.board?.pendingShipPlacement;
  if (!pending || state.gameState?.phase !== "tradeBuild") return false;
  return findFreeLaunchPointsForPlayer(pending.ownerPlayerId).some((point) => point.id === nodeId);
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

function getBankTradeRate(player, resource) {
  const baseRate = getTradeRatesForPlayer(state.gameState, player?.id)?.[resource] ?? 3;
  if (resource !== "goods") return baseRate;

  const goodsCard = (player?.friendshipCards ?? [])
    .map((cardId) => getFriendshipCardById(cardId))
    .find((card) => card?.implemented && card.effectType === "tradeRate" && card.effectValue?.resource === "goods" && card.effectValue?.oncePerTurn);
  const alreadyUsed = goodsCard && state.gameState?.friendshipTurnState?.usedActionKeys?.includes(goodsCard.id);
  return alreadyUsed ? 2 : baseRate;
}

function canTradeBuildActions(player) {
  return Boolean(
    player?.id === getActivePlayer()?.id &&
    state.gameState?.phase === "tradeBuild" &&
    !state.gameState?.pendingFriendshipAction
  );
}

function canCreatePlayerTradeOffer(player) {
  if (!canTradeBuildActions(player) || !state.tradeOfferTargetPlayerId) return false;
  const totalOffered = getSelectedResourceCount(state.tradeOfferedResources);
  const totalRequested = getSelectedResourceCount(state.tradeRequestedResources);
  if (totalOffered <= 0 && totalRequested <= 0) return false;
  return resourceTypes.every((resource) => (state.tradeOfferedResources?.[resource] ?? 0) <= (player?.resources?.[resource] ?? 0));
}

function canPlayerTrade(player) {
  if (!player || state.tradeFromResource === state.tradeToResource) return false;
  return (player.resources?.[state.tradeFromResource] ?? 0) >= getBankTradeRate(player, state.tradeFromResource);
}

function canUseBoughtFame(player, card) {
  if (!player || !card || !canTradeBuildActions(player)) return false;
  const cost = card.effectValue?.cost ?? {};
  const alreadyUsed = card.effectValue?.oncePerTurn && state.gameState?.friendshipTurnState?.usedActionKeys?.includes(card.id);
  return !alreadyUsed && Object.entries(cost).every(([resource, amount]) => (player.resources?.[resource] ?? 0) >= amount);
}

function getRichHelpsPoorEligiblePlayers(player) {
  const currentPoints = player?.victoryPoints ?? 0;
  return (state.gameState?.players ?? []).filter((candidate) => (
    candidate.id !== player?.id &&
    (candidate.victoryPoints ?? 0) > currentPoints &&
    getTotalResourceCount(candidate.resources) > 0
  ));
}

function canUseRichHelpsPoor(player, card) {
  if (!player || !card || !canTradeBuildActions(player)) return false;
  if (state.gameState?.friendshipTurnState?.usedActionKeys?.includes(card.id)) return false;
  return getRichHelpsPoorEligiblePlayers(player).length > 0;
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
  if (getBuildUnavailableReason(player, action)) return false;
  if (action.id === "spaceport") return hasUpgradeableColony(player.id);
  if (["colonyShip", "tradeShip"].includes(action.id)) return Boolean(findFreeLaunchPointForActivePlayer(player.id));
  return false;
}

function getBuildUnavailableReason(player, action) {
  if (!player) return "";

  const stock = player.stock ?? {};
  if (action.id === "colonyShip") {
    if ((stock.transporter?.available ?? 0) <= 0) return "noTransporterAvailable";
    if ((stock.colony?.available ?? 0) <= 0) return "noColonyAvailable";
  }

  if (action.id === "tradeShip") {
    if ((stock.transporter?.available ?? 0) <= 0) return "noTransporterAvailable";
    if ((stock.tradeStation?.available ?? 0) <= 0) return "noTradeStationAvailable";
  }

  if (action.id === "spaceport" && (stock.spaceport?.available ?? 0) <= 0) {
    return "limitReached";
  }

  return "";
}

function canPlayerPay(player, cost) {
  return Object.entries(cost)
    .every(([resource, amount]) => (player.resources?.[resource] ?? 0) >= amount);
}

function hasUpgradeableColony(playerId) {
  return (state.gameState?.board?.structures ?? [])
    .some((structure) => structure.ownerPlayerId === playerId && structure.type === "colony");
}

function isValidPendingSpaceportTarget(structureId) {
  const pending = state.gameState?.board?.pendingSpaceportUpgrade;
  if (!pending || state.gameState?.phase !== "tradeBuild") return false;
  const structure = getStructureById(structureId);
  return Boolean(
    structure &&
    structure.ownerPlayerId === pending.ownerPlayerId &&
    structure.type === "colony"
  );
}

function findFreeLaunchPointForActivePlayer(playerId) {
  return findFreeLaunchPointsForPlayer(playerId)[0] ?? null;
}

function findFreeLaunchPointsForPlayer(playerId) {
  const occupiedLocationIds = new Set([
    ...(state.gameState?.board?.ships ?? []).map((ship) => ship.locationId),
    ...(state.gameState?.board?.structures ?? []).map((structure) => structure.locationId)
  ]);
  const ownSpaceportLocationIds = new Set(
    (state.gameState?.board?.structures ?? [])
      .filter((structure) => structure.ownerPlayerId === playerId && structure.type === "spaceport")
      .map((structure) => structure.locationId)
  );

  return (boardLayout.spaceportLaunchPoints ?? [])
    .filter((point) => ownSpaceportLocationIds.has(point.spaceportLocationId) && !occupiedLocationIds.has(point.id));
}

function formatCost(cost) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${getResourceLabel(resource)}`)
    .join(", ");
}

function formatResourceSelection(resources) {
  const entries = Object.entries(resources ?? {})
    .filter(([, amount]) => amount > 0)
    .map(([resource, amount]) => `${amount} ${getResourceLabel(resource)}`);
  return entries.length > 0 ? entries.join(", ") : t("none");
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
    const imageSize = className === "start-system" ? 82 : 72;
    const planetElement = createSvgElement("g", {
      class: `planet planet--${planet.resource}${selectedClass}`,
      "data-planet-id": planet.id,
    });
    const planetAssetPath = getPlanetAssetPath(planet.resource);
    if (planetAssetPath) {
      planetElement.append(createSvgElement("image", {
        class: "planet-image",
        href: planetAssetPath,
        x: position.x - imageSize / 2,
        y: position.y - imageSize / 2,
        width: imageSize,
        height: imageSize,
        preserveAspectRatio: "xMidYMid meet"
      }));
    }
    planetElement.append(createSvgElement("circle", {
      class: "planet-hit-area",
      cx: position.x,
      cy: position.y,
      r: imageSize / 2,
      fill: "transparent"
    }));
    enableBoardElementSelection(planetElement, "planet", planet.id);
    group.append(planetElement);

    const token = getPlanetToken(state.gameState?.board?.numberTokens, planet.id);
    const tokenLabel = explored ? formatTokenLabel(token) : "";
    if (tokenLabel) {
      const marker = createSvgElement("text", {
        class: `number-marker${isActiveSpecialToken(token) ? " number-marker--special" : ""}`,
        x: position.x,
        y: position.y + 7,
        "text-anchor": "middle"
      });
      marker.textContent = tokenLabel;
      group.append(marker);
    }
  });

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
  const visual = outpostVisualDefaults.outpost;
  const imageWidth = visual.width;
  const imageHeight = visual.height;
  enableBoardElementSelection(group, "outpost", outpost.id);
  group.append(createSvgElement("circle", {
    class: "outpost-hit-area",
    cx: outpost.x,
    cy: outpost.y,
    r: visual.hitRadius
  }));
  group.append(createSvgElement("image", {
    class: "outpost-image",
    href: getOutpostAssetPath(outpost.outpostType),
    x: outpost.x - imageWidth / 2,
    y: outpost.y - imageHeight / 2,
    width: imageWidth,
    height: imageHeight,
    preserveAspectRatio: "xMidYMid meet"
  }));
  group.append(createSvgElement("circle", {
    class: "outpost-ring",
    cx: outpost.x,
    cy: outpost.y,
    r: visual.hitRadius
  }));
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
    const reachableState = reachableNodes.get(point.id);
    const reachableClass = reachableState ? " is-reachable" : "";
    const endpointClass = reachableState?.endpointType === "colonySite"
      ? " is-colony-target"
      : reachableState?.endpointType === "dock"
        ? " is-dock-target"
        : "";
    const occupiedClass = getShipAtLocation(point.id) ? " is-occupied" : "";
    const foundableClass = isFoundablePoint(point.id) ? " is-foundable" : "";
    const placementClass = getPlacementPointClass(point.id);
    const shipBuildClass = getPendingShipPlacementClass(point.id);
    const tradeStationClass = isValidPendingTradeStationNode(point.id) ? " is-trade-station-target" : "";
    const colonySiteClass = colonySite ? " space-point--colony-site" : "";
    const visualType = point.type === "boundary" ? "boundary" : "space";
    const radius = colonySite ? 10 : visualType === "boundary" ? 5 : 7;
    const pointElement = createSvgElement("circle", {
      class: `space-point space-point--${visualType}${colonySiteClass}${selectedClass}${reachableClass}${endpointClass}${occupiedClass}${foundableClass}${placementClass}${shipBuildClass}${tradeStationClass}`,
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
  const structures = [...(state.gameState?.board?.structures ?? [])]
    .sort((left, right) => getStructureRenderZ(left) - getStructureRenderZ(right));

  for (const structure of structures) {
    const site = getStructureRenderPoint(structure);
    if (!site) continue;
    const selectedClass = isSelectedElement("structure", structure.id) ? " is-selected" : "";
    const pendingSpaceportClass = isValidPendingSpaceportTarget(structure.id) ? " is-spaceport-build-target" : "";
    const ownerIndex = Number.parseInt(structure.ownerPlayerId.replace("player-", ""), 10);
    const owner = state.gameState?.players?.find((player) => player.id === structure.ownerPlayerId);
    const structureGroup = createSvgElement("g", {
      class: `structure structure--${structure.type}${selectedClass}${pendingSpaceportClass}`
    });
    enableBoardElementSelection(structureGroup, "structure", structure.id);

    if (structure.type === "tradeStation") {
      const visual = outpostVisualDefaults.tradeStation;
      structureGroup.append(createSvgElement("circle", {
        class: "trade-station-hit-area",
        cx: site.x,
        cy: site.y,
        r: visual.hitRadius
      }));
      structureGroup.append(createSvgElement("image", {
        class: `trade-station-image player-color-${ownerIndex}`,
        href: getTradeStationAssetPath(owner?.color),
        x: site.x - visual.width / 2,
        y: site.y - visual.height / 2,
        width: visual.width,
        height: visual.height,
        preserveAspectRatio: "xMidYMid meet"
      }));
    } else if (structure.type === "spaceport") {
      const visual = playerPieceVisualDefaults.spaceport;
      const placement = getStructureVisualPlacement(structure, site, visual);
      structureGroup.append(createSvgElement("circle", {
        class: "structure-hit-area",
        cx: placement.x,
        cy: placement.y,
        r: placement.hitRadius
      }));
      structureGroup.append(createSvgElement("image", {
        class: `spaceport-image player-color-${ownerIndex}`,
        href: getPlayerSpaceportAssetPath(owner?.color),
        x: placement.x - placement.width / 2,
        y: placement.y - placement.height / 2,
        width: placement.width,
        height: placement.height,
        transform: `rotate(${placement.rotation} ${placement.x} ${placement.y})`,
        preserveAspectRatio: "xMidYMid meet"
      }));
    } else {
      const visual = playerPieceVisualDefaults.colony;
      const placement = getStructureVisualPlacement(structure, site, visual);
      structureGroup.append(createSvgElement("circle", {
        class: "structure-hit-area",
        cx: placement.x,
        cy: placement.y,
        r: placement.hitRadius
      }));
      structureGroup.append(createSvgElement("image", {
        class: `colony-image player-color-${ownerIndex}`,
        href: getPlayerColonyAssetPath(owner?.color),
        x: placement.x - placement.width / 2,
        y: placement.y - placement.height / 2,
        width: placement.width,
        height: placement.height,
        transform: `rotate(${placement.rotation} ${placement.x} ${placement.y})`,
        preserveAspectRatio: "xMidYMid meet"
      }));
    }

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

    const ownerIndex = Number.parseInt(ship.ownerPlayerId.replace("player-", ""), 10);
    const owner = state.gameState?.players?.find((player) => player.id === ship.ownerPlayerId);
    const visual = playerPieceVisualDefaults.ship;
    shipGroup.append(createSvgElement("circle", {
      class: "ship-hit-area",
      cx: point.x,
      cy: point.y,
      r: visual.hitRadius
    }));
    shipGroup.append(createSvgElement("image", {
      class: `ship-image player-color-${ownerIndex}`,
      href: getPlayerShipAssetPath(owner?.color, ship.id),
      x: point.x - visual.width / 2,
      y: point.y - visual.height / 2,
      width: visual.width,
      height: visual.height,
      preserveAspectRatio: "xMidYMid meet"
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
  resetTradeOfferDraft();
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
