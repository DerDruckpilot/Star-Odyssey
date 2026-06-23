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
  getOutpostTradeStationSlot,
  getOutpostVisualLayout
} from "./data/outpostVisualLayouts.js";
import {
  getPlayerColonyAssetPath,
  getPlayerShipAssetPath,
  getPlayerSpaceportAssetPath,
  getTradeShipAssetPath,
  playerPieceColors,
  playerPieceVisualDefaults
} from "./data/playerPieceVisuals.js";
import { getShipEngineTemplate, getShipVfxAnchors, getTradeShipVfxAnchors } from "./data/shipVfxData.js";
import { MOTHERSHIP_SPEED_ANIMATION_CONFIG } from "./data/mothershipSpeedAnimationConfig.js";
import {
  applyDebugLayoutTransform,
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
const showViewportDebug = new URLSearchParams(window.location.search).get("debugViewport") === "1";
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
  playerSetup: [],
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

const placementVfxDuration = 1650;
const placementVfx = {
  items: [],
  frameRequestId: null,
  currentTime: 0,
  nextId: 1
};
const shipFlightAnimation = {
  items: [],
  frameRequestId: null,
  currentTime: 0
};
const shipEngineTrailDuration = 1250;
const shipEngineTrails = [];
const shipVfxCanvasLayers = ["behind", "inline", "front"];
const shipVfxAnimation = {
  frameRequestId: null,
  currentTime: 0
};
const diceRollAnimation = {
  item: null,
  frameRequestId: null,
  currentTime: 0
};
const DICE_RESULT_HOLD_MS = 4000;
const DICE_RESULT_FADE_MS = 320;
const mothershipSpeedAnimation = {
  item: null,
  frameRequestId: null,
  currentTime: 0
};
const MOTHERSHIP_SPEED_APPEAR_MS = 220;
const MOTHERSHIP_SPEED_SHAKE_MS = 980;
const MOTHERSHIP_SPEED_REVEAL_MS = MOTHERSHIP_SPEED_ANIMATION_CONFIG.balls.slideDurationMs;
const MOTHERSHIP_SPEED_HOLD_MS = 2000;
const MOTHERSHIP_SPEED_FADE_MS = 360;
const MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES = 1;
const MOTHERSHIP_SPEED_MAX_SHAKE_CYCLES = 3;
const MOTHERSHIP_SPEED_GAME_BALL_SCALE = 1.725;
const mothershipBallVisuals = {
  yellow: { color: "#fde047", light: "#fff176", dark: "#ca8a04" },
  blue: { color: "#38bdf8", light: "#7dd3fc", dark: "#0369a1" },
  red: { color: "#ef4444", light: "#f87171", dark: "#991b1b" },
  black: { color: "#111827", light: "#4b5563", dark: "#020617" }
};
const shipVisualAngles = new Map();
const playerDiceColors = {
  red: "#ef4444",
  blue: "#38bdf8",
  yellow: "#facc15",
  green: "#22c55e"
};
const shipVfxDefaultColorByPlayerColor = {
  red: "#ef4444",
  blue: "#38bdf8",
  yellow: "#facc15",
  green: "#4ade80",
  white: "#4ade80"
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
  state.playerSetup = [];
  setView("players");
}

function startGameNow() {
  const validation = validatePlayerSetup();
  if (!validation.valid) {
    state.notice = t(validation.messageKey);
    render();
    return;
  }

  state.gameState = createGameState({
    language: state.language,
    playerCount: state.selectedPlayers,
    boardLayout,
    playerSetup: getSanitizedPlayerSetup()
  });
  resetTradeOfferDraft();
  state.selectedPlayers = state.gameState.playerCount;
  state.playerSetup = [];
  saveCurrentGameState();
  setView("board");
}

function createDefaultPlayerSetup(playerCount) {
  return Array.from({ length: playerCount }, (_, index) => ({
    name: t("playerNumber").replace("{number}", index + 1),
    color: playerPieceColors[index] ?? playerPieceColors[0]
  }));
}

function ensurePlayerSetup(playerCount) {
  const defaults = createDefaultPlayerSetup(playerCount);
  state.playerSetup = defaults.map((fallback, index) => ({
    ...fallback,
    ...(state.playerSetup[index] ?? {}),
    color: playerPieceColors.includes(state.playerSetup[index]?.color)
      ? state.playerSetup[index].color
      : fallback.color
  }));
  return state.playerSetup;
}

function getSanitizedPlayerSetup() {
  return ensurePlayerSetup(state.selectedPlayers ?? 2).map((player) => ({
    name: String(player.name ?? "").trim(),
    color: player.color
  }));
}

function validatePlayerSetup() {
  const playerCount = state.selectedPlayers ?? 0;
  if (![2, 3, 4].includes(playerCount)) {
    return { valid: false, messageKey: "selectPlayers" };
  }

  const setup = getSanitizedPlayerSetup();
  if (setup.some((player) => player.name.length === 0)) {
    return { valid: false, messageKey: "playerSetupNameRequired" };
  }

  const normalizedNames = setup.map((player) => player.name.toLocaleLowerCase(state.language));
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    return { valid: false, messageKey: "playerSetupNameDuplicate" };
  }

  const colors = setup.map((player) => player.color);
  if (new Set(colors).size !== colors.length) {
    return { valid: false, messageKey: "playerSetupColorDuplicate" };
  }

  return { valid: true, messageKey: "" };
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

  const previousGameState = state.gameState;
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

  queuePlacementVfxForStateChange(previousGameState, state.gameState);
  saveCurrentGameState();
  render();
  return true;
}

function determineSpeedForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "flight") return;
  if (state.gameState.hasRolledFlightSpeed || isMothershipSpeedAnimating()) return;

  state.gameState = determineFlightSpeed(state.gameState);
  state.hudPlayerId = null;
  state.hudTab = "turn";
  queueMothershipSpeedAnimation(getActivePlayer(), state.gameState.flightRoll);
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

  const previousGameState = state.gameState;
  const jumpShip = previousGameState.board?.ships?.find((ship) => ship.id === pendingStep.shipId);
  if (jumpShip) {
    queuePlacementVfx("ship", jumpShip);
  }
  state.gameState = submitEncounterPending(state.gameState, { targetNodeId: nodeId });
  const shiftedShip = state.gameState.board?.ships?.find((ship) => ship.id === pendingStep.shipId);
  if (shiftedShip) {
    queuePlacementVfx("ship", shiftedShip);
  }
  saveCurrentGameState();
  render();
  return true;
}

function finishActiveEncounter() {
  if (!state.gameState?.activeEncounter) return;

  state.gameState = finishEncounter(state.gameState);
  state.hudPlayerId = null;
  saveCurrentGameState();
  render();
}

function moveSelectedShipTo(targetNodeId) {
  const selectedShip = getSelectedShip();
  if (!selectedShip) return false;
  if (isShipFlightAnimating(selectedShip.id)) return false;
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
  const fromPoint = getBoardPointById(selectedShip.locationId);
  const toPoint = getBoardPointById(targetNodeId);
  state.gameState = moveShip(state.gameState, boardLayout, selectedShip.id, targetNodeId);
  queueShipFlightAnimation(selectedShip, fromPoint, toPoint);
  saveCurrentGameState();
  render();
  return true;
}

function rollProductionForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "production") return;
  if (isDiceRollAnimating()) return;

  const rollingPlayer = getActivePlayer();
  state.gameState = rollProduction(state.gameState, boardLayout);
  queueDiceRollAnimation(rollingPlayer, state.gameState.lastRoll?.dice);
  saveCurrentGameState();
  render();
}

function rollPlacementForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "placement") return;
  if (isDiceRollAnimating()) return;

  const previousGameState = state.gameState;
  const rollingPlayer = getActivePlayer();
  const rollingPlayerId = previousGameState.placement?.rollPlayerIds?.[previousGameState.placement?.currentRollIndex ?? 0];
  state.gameState = rollPlacementStart(state.gameState);
  queueDiceRollAnimation(rollingPlayer, getPlacementRollDice(state.gameState, rollingPlayerId));
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

  const previousGameState = state.gameState;
  state.gameState = placePendingShip(state.gameState, boardLayout, nodeId);
  queuePlacementVfxForStateChange(previousGameState, state.gameState);
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

  const previousGameState = state.gameState;
  state.gameState = confirmPendingSpaceportUpgrade(state.gameState, structureId);
  queuePlacementVfxForStateChange(previousGameState, state.gameState);
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
  if (isShipFlightAnimating(selectedShip.id)) return;

  const previousGameState = state.gameState;
  state.gameState = foundColony(state.gameState, boardLayout, selectedShip.id);
  queuePlacementVfxForStateChange(previousGameState, state.gameState);
  saveCurrentGameState();
  render();
}

function foundTradeStationWithSelectedShip() {
  const selectedShip = getSelectedShip();
  if (!state.gameState || !selectedShip) return;
  if (isShipFlightAnimating(selectedShip.id)) return;

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
      ensurePlayerSetup(count);
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
    createButton(t("continue"), () => setView("playerSetup"), "menu-button")
  );

  screen.append(renderLanguageToggle(), title, qrGrid, hint, actions);
  return screen;
}

function renderPlayerSetup() {
  ensurePlayerSetup(state.selectedPlayers ?? 2);

  const screen = document.createElement("section");
  screen.className = "menu-screen player-setup-screen";
  screen.setAttribute("aria-labelledby", "screen-title");

  const title = document.createElement("h1");
  title.id = "screen-title";
  title.className = "setup-title";
  title.textContent = t("playerSetupTitle");

  const form = document.createElement("div");
  form.className = "player-setup-form";

  const hint = document.createElement("p");
  hint.className = "player-setup-hint";

  const actions = document.createElement("div");
  actions.className = "setup-actions";
  const startButton = createButton(t("startGame"), startGameNow, "menu-button");
  actions.append(
    createButton(t("back"), () => setView("controllers"), "secondary-button"),
    startButton
  );

  const updateValidation = () => {
    const validation = validatePlayerSetup();
    startButton.disabled = !validation.valid;
    hint.textContent = validation.valid ? "" : t(validation.messageKey);
  };

  state.playerSetup.forEach((playerSetup, index) => {
    const row = document.createElement("article");
    row.className = "player-setup-row";

    const heading = document.createElement("strong");
    heading.textContent = t("playerNumber").replace("{number}", index + 1);

    const nameLabel = document.createElement("label");
    nameLabel.textContent = t("playerSetupName");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = playerSetup.name;
    nameInput.autocomplete = "off";
    nameInput.addEventListener("input", () => {
      state.playerSetup[index].name = nameInput.value;
      updateValidation();
    });
    nameLabel.append(nameInput);

    const colorLabel = document.createElement("label");
    colorLabel.textContent = t("playerSetupColor");
    const colorSelect = document.createElement("select");
    for (const color of playerPieceColors) {
      const option = document.createElement("option");
      option.value = color;
      option.textContent = getPlayerColorLabel(color);
      option.selected = playerSetup.color === color;
      colorSelect.append(option);
    }
    colorSelect.addEventListener("change", () => {
      state.playerSetup[index].color = colorSelect.value;
      updateValidation();
    });
    colorLabel.append(colorSelect);

    row.append(heading, nameLabel, colorLabel);
    form.append(row);
  });

  updateValidation();
  screen.append(renderLanguageToggle(), title, form, hint, actions);
  return screen;
}

function getPlayerColorLabel(color) {
  return t(`playerColor_${color}`);
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
  controls.append(createButton("⚙", () => openModal("settings"), "icon-button"));

  const board = document.createElement("div");
  board.className = "board-placeholder";
  board.setAttribute("aria-label", t("boardAreaLabel"));
  board.append(...[
    renderShipEngineVfxCanvas("behind"),
    renderBoardSvg(),
    renderShipEngineVfxCanvas("inline"),
    renderShipEngineVfxCanvas("front"),
    renderDice3dOverlay(),
    renderMothershipSpeedOverlay()
  ].filter(Boolean));

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
    renderNotice(),
    renderViewportDebugPanel()
  );
  return screen;
}

function renderViewportDebugPanel() {
  if (!showViewportDebug) return document.createDocumentFragment();

  const panel = document.createElement("pre");
  panel.className = "viewport-debug-panel";

  const update = () => {
    if (!panel.isConnected) return;

    const visualViewport = window.visualViewport;
    const boardRect = document.querySelector(".board-placeholder")?.getBoundingClientRect();
    const screenRect = document.querySelector(".board-screen")?.getBoundingClientRect();
    const orientation = window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait";
    const isMobile = window.matchMedia("(max-height: 560px), (max-width: 760px)").matches;

    panel.textContent = [
      `inner: ${Math.round(window.innerWidth)} x ${Math.round(window.innerHeight)}`,
      `visual: ${Math.round(visualViewport?.width ?? 0)} x ${Math.round(visualViewport?.height ?? 0)}`,
      `dpr: ${window.devicePixelRatio || 1}`,
      `mode: ${isMobile ? "mobile" : "desktop"} / ${orientation}`,
      `screen: ${Math.round(screenRect?.width ?? 0)} x ${Math.round(screenRect?.height ?? 0)}`,
      `board: ${Math.round(boardRect?.left ?? 0)},${Math.round(boardRect?.top ?? 0)} ${Math.round(boardRect?.width ?? 0)} x ${Math.round(boardRect?.height ?? 0)}`
    ].join("\n");

    window.requestAnimationFrame(update);
  };

  window.requestAnimationFrame(update);
  return panel;
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
    const rollButton = createButton(t("rollProduction"), rollProductionForActivePlayer, "small-button");
    rollButton.disabled = isDiceRollAnimating();
    wrapper.append(rollButton);
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
      const speedButton = createButton(t("determineSpeed"), determineSpeedForActivePlayer, "small-button");
      speedButton.disabled = isMothershipSpeedAnimating();
      wrapper.append(speedButton);
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
    const rollButton = createButton(t("rollStartPlayer"), rollPlacementForActivePlayer, "small-button");
    rollButton.disabled = isDiceRollAnimating();
    wrapper.append(rollButton);
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

  const pendingOwnerPlayerId = encounter.pendingStep?.type === "opponentResourceGiftSelection"
    ? encounter.pendingStep.currentGiverPlayerId
    : activePlayer?.id;

  if (player?.id !== pendingOwnerPlayerId) {
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

  if (encounter.pendingStep?.type === "shipJumpSelection") {
    wrapper.append(renderEncounterShipJumpSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "boardTargetSelection") {
    wrapper.append(renderEncounterTargetSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "opponentResourceGiftSelection") {
    wrapper.append(renderEncounterOpponentGiftSelection(encounter.pendingStep));
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

function renderEncounterShipJumpSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const ships = state.gameState?.board?.ships ?? [];

  const hint = document.createElement("p");
  hint.textContent = getLocalizedEncounterText(pendingStep.hint) || t("encounterSelectJumpShip");
  wrapper.append(hint);

  for (const shipId of pendingStep.shipIds ?? []) {
    const ship = ships.find((candidate) => candidate.id === shipId);
    const button = createButton(
      `${getShipTypeLabel(ship?.type)} · ${ship?.coilCount ?? ship?.shipVariant ?? ""}`,
      () => submitEncounterPendingAction({ shipId }),
      "small-button"
    );
    button.disabled = !ship;
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

function renderEncounterOpponentGiftSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const giver = state.gameState?.players?.find((player) => player.id === pendingStep.currentGiverPlayerId);
  const receiver = state.gameState?.players?.find((player) => player.id === pendingStep.receiverPlayerId);

  const hint = document.createElement("p");
  hint.textContent = t("encounterResourceGiftHint")
    .replace("{player}", giver?.name ?? t("none"))
    .replace("{target}", receiver?.name ?? t("none"));
  wrapper.append(hint);

  let hasResource = false;
  for (const resource of resourceTypes) {
    const owned = giver?.resources?.[resource] ?? 0;
    const button = createButton(
      `${getResourceLabel(resource)} (${owned})`,
      () => submitEncounterPendingAction({ resource }),
      "small-button"
    );
    button.disabled = owned <= 0;
    if (owned > 0) hasResource = true;
    wrapper.append(button);
  }

  if (!hasResource) {
    wrapper.append(createButton(t("continue"), () => submitEncounterPendingAction({ skip: true }), "small-button"));
  }

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
  const isRecipientView = player?.id === activeTradeOffer.toPlayerId;
  const giveResources = isRecipientView ? activeTradeOffer.requestedResources : activeTradeOffer.offeredResources;
  const receiveResources = isRecipientView ? activeTradeOffer.offeredResources : activeTradeOffer.requestedResources;
  const offered = document.createElement("p");
  offered.textContent = `${t("youGive")}: ${formatResourceSelection(giveResources)}`;
  const requested = document.createElement("p");
  requested.textContent = `${t("youReceive")}: ${formatResourceSelection(receiveResources)}`;
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
  select.value = state.tradeOfferTargetPlayerId ?? "";

  select.addEventListener("change", (event) => {
    setTradeOfferTarget(event.target.value || null);
  });
  select.addEventListener("input", (event) => {
    setTradeOfferTarget(event.target.value || null);
  });
  select.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
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
  if (key === "shipOrdinal") return t(`shipOrdinal_${value}`);
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
  const exploredSystemIds = new Set(state.gameState?.board?.exploredSystems ?? []);
  const systems = Array.isArray(state.gameState?.board?.placedSystems)
    ? state.gameState.board.placedSystems
    : (boardLayout.planetSystems ?? []);
  return systems.filter((system) => exploredSystemIds.has(system.id));
}

function getVisibleOutposts() {
  const exploredOutpostIds = new Set(state.gameState?.board?.exploredOutposts ?? []);
  const outposts = Array.isArray(state.gameState?.board?.placedOutposts)
    ? state.gameState.board.placedOutposts
    : (boardLayout.outposts ?? []);
  return outposts.filter((outpost) => exploredOutpostIds.has(outpost.id));
}

function getVisibleDocks() {
  return getVisibleOutposts().flatMap((outpost) => outpost.docks ?? []);
}

function getOutpostById(outpostId) {
  return getVisibleOutposts().find((outpost) => outpost.id === outpostId) ?? null;
}

function formatOutpostLabel(outpost) {
  if (!outpost) return t("none");
  return getOutpostTypeLabel(outpost.outpostType);
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

function getPlacedPlanetSystems() {
  return Array.isArray(state.gameState?.board?.placedSystems)
    ? state.gameState.board.placedSystems
    : (boardLayout.planetSystems ?? []);
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
  const transform = visualPosition && system
    ? applyDebugLayoutTransform({
      referenceLayout: structureVisualReferenceLayouts[layoutType],
      actualCenters: getCanonicalSystemPlanetCenters(system, layoutType),
      visualPosition,
      baseWidth: defaults.width,
      baseHeight: defaults.height,
      baseHitRadius: defaults.hitRadius
    })
    : null;

  return transform ?? {
    x: site.x,
    y: site.y,
    width: defaults.width,
    height: defaults.height,
    hitRadius: defaults.hitRadius,
    rotation: 0,
    z: 0
  };
}

function getOutpostVisualPlacement(outpost, defaults) {
  const layoutType = getOutpostVisualLayoutType(outpost);
  const visualPosition = getOutpostVisualLayout(outpost.outpostType, layoutType)?.outpost;
  const transform = visualPosition
    ? applyDebugLayoutTransform({
      referenceLayout: structureVisualReferenceLayouts[layoutType],
      actualCenters: getCanonicalOutpostHexCenters(outpost, layoutType),
      visualPosition,
      baseWidth: defaults.width,
      baseHeight: defaults.height,
      baseHitRadius: defaults.hitRadius
    })
    : null;

  return transform ?? {
    x: outpost.x,
    y: outpost.y,
    width: defaults.width,
    height: defaults.height,
    hitRadius: defaults.hitRadius,
    rotation: 0,
    z: 0
  };
}

function getTradeStationVisualPlacement(structure, site, defaults) {
  const outpost = getOutpostById(structure.outpostId);
  const layoutType = getOutpostVisualLayoutType(outpost);
  const slotIndex = getTradeStationSlotIndex(structure, outpost);
  const visualPosition = outpost
    ? getOutpostTradeStationSlot(outpost.outpostType, layoutType, slotIndex)
    : null;
  const transform = visualPosition && outpost
    ? applyDebugLayoutTransform({
      referenceLayout: structureVisualReferenceLayouts[layoutType],
      actualCenters: getCanonicalOutpostHexCenters(outpost, layoutType),
      visualPosition,
      baseWidth: defaults.width,
      baseHeight: defaults.height,
      baseHitRadius: defaults.hitRadius
    })
    : null;

  return transform ?? {
    x: site.x,
    y: site.y,
    width: defaults.width,
    height: defaults.height,
    hitRadius: defaults.hitRadius,
    rotation: 0,
    z: 0
  };
}

function getStructureRenderZ(structure) {
  if (structure.type === "tradeStation") {
    const outpost = getOutpostById(structure.outpostId);
    const layoutType = getOutpostVisualLayoutType(outpost);
    const slotIndex = getTradeStationSlotIndex(structure, outpost);
    return getOutpostTradeStationSlot(outpost?.outpostType, layoutType, slotIndex)?.z ?? 0;
  }
  if (!["colony", "spaceport"].includes(structure.type)) return 0;
  const site = getStructureRenderSite(structure);
  if (!site) return 0;
  const visualPosition = getStructureVisualPosition(structure.type, site.visualLayoutType, site.siteIndex);
  return visualPosition?.z ?? 0;
}

function getOutpostRenderZ(outpost) {
  const layoutType = getOutpostVisualLayoutType(outpost);
  return getOutpostVisualLayout(outpost.outpostType, layoutType)?.outpost?.z ?? 0;
}

function getPlanetSystemForSite(site) {
  return [
    ...(boardLayout.startSystems ?? []),
    ...getVisiblePlanetSystems()
  ].find((system) => system.id === site.systemId) ?? null;
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

function getOutpostVisualLayoutType(outpost) {
  const centers = getOutpostHexCenters(outpost).sort((left, right) => left.y - right.y || left.x - right.x);
  const topY = centers[0]?.y ?? 0;
  const topCount = centers.filter((center) => Math.abs(center.y - topY) < 1).length;
  return topCount === 1 ? "oneTopTwoBottom" : "twoTopOneBottom";
}

function getCanonicalOutpostHexCenters(outpost, layoutType) {
  const centers = getOutpostHexCenters(outpost).sort((left, right) => left.y - right.y || left.x - right.x);
  const topY = centers[0]?.y ?? 0;
  const topCenters = centers.filter((center) => Math.abs(center.y - topY) < 1).sort((left, right) => left.x - right.x);
  const bottomCenters = centers.filter((center) => Math.abs(center.y - topY) >= 1).sort((left, right) => left.x - right.x);

  if (layoutType === "twoTopOneBottom" && topCenters.length === 2 && bottomCenters.length === 1) {
    return [topCenters[0], topCenters[1], bottomCenters[0]];
  }
  if (layoutType === "oneTopTwoBottom" && topCenters.length === 1 && bottomCenters.length === 2) {
    return [topCenters[0], bottomCenters[0], bottomCenters[1]];
  }
  return centers;
}

function getOutpostHexCenters(outpost) {
  return (outpost?.slotHexIds ?? [])
    .map((hexId) => (boardLayout.hexes ?? []).find((hex) => hex.id === hexId))
    .filter(Boolean)
    .map((hex) => ({ x: hex.x, y: hex.y }));
}

function getTradeStationSlotIndex(structure, outpost = getOutpostById(structure.outpostId)) {
  const dockMatch = /-dock-(\d+)$/.exec(structure.dockId ?? "");
  const dockIndex = Number(dockMatch?.[1]);
  if (dockIndex >= 1 && dockIndex <= 5) return dockIndex;
  const outpostIndex = (outpost?.tradeStationIds ?? []).indexOf(structure.id);
  return outpostIndex >= 0 ? outpostIndex + 1 : 1;
}

function queuePlacementVfxForStateChange(previousGameState, nextGameState) {
  if (!previousGameState || previousGameState === nextGameState) return;

  const previousStructuresById = new Map((previousGameState.board?.structures ?? []).map((structure) => [structure.id, structure]));
  for (const structure of nextGameState.board?.structures ?? []) {
    const previousStructure = previousStructuresById.get(structure.id);
    if (!previousStructure && ["colony", "spaceport"].includes(structure.type)) {
      queuePlacementVfx("structure", structure);
    } else if (previousStructure?.type === "colony" && structure.type === "spaceport") {
      queuePlacementVfx("structure", structure);
    }
  }

  const previousShipIds = new Set((previousGameState.board?.ships ?? []).map((ship) => ship.id));
  for (const ship of nextGameState.board?.ships ?? []) {
    if (!previousShipIds.has(ship.id)) queuePlacementVfx("ship", ship);
  }
}

function queuePlacementVfx(targetType, target) {
  const position = targetType === "ship"
    ? getPlacementVfxShipPosition(target)
    : getPlacementVfxStructurePosition(target);
  if (!position) return;

  const now = getAnimationNow();
  placementVfx.items.push({
    id: `placement-vfx-${placementVfx.nextId++}`,
    targetType,
    targetId: target.id,
    objectType: target.type,
    x: position.x,
    y: position.y,
    startTime: now,
    seed: createPlacementVfxSeed(target.id, now)
  });
  startPlacementVfxLoop();
}

function getPlacementVfxShipPosition(ship) {
  const point = (boardLayout.points ?? []).find((candidate) => candidate.id === ship.locationId);
  return point ? { x: point.x, y: point.y } : null;
}

function getPlacementVfxStructurePosition(structure) {
  const site = getStructureRenderPoint(structure);
  if (!site) return null;
  const defaults = structure.type === "spaceport"
    ? playerPieceVisualDefaults.spaceport
    : playerPieceVisualDefaults.colony;
  const placement = getStructureVisualPlacement(structure, site, defaults);
  return { x: placement.x, y: placement.y };
}

function createPlacementVfxSeed(id, now) {
  let seed = Math.floor(now);
  for (const character of String(id)) {
    seed = (seed * 33 + character.charCodeAt(0)) >>> 0;
  }
  return seed || 1;
}

function startPlacementVfxLoop() {
  if (placementVfx.frameRequestId || placementVfx.items.length === 0) return;
  placementVfx.frameRequestId = requestAnimationFrame(updatePlacementVfx);
}

function updatePlacementVfx(now) {
  placementVfx.currentTime = now;
  placementVfx.items = placementVfx.items.filter((item) => now - item.startTime < placementVfxDuration);
  placementVfx.frameRequestId = null;
  render();
  if (placementVfx.items.length > 0) {
    placementVfx.frameRequestId = requestAnimationFrame(updatePlacementVfx);
  }
}

function getAnimationNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function getPlacementVfxTime() {
  return placementVfx.currentTime || getAnimationNow();
}

function getActivePlacementVfx(targetType, targetId) {
  const now = getPlacementVfxTime();
  return placementVfx.items
    .filter((item) => item.targetType === targetType && item.targetId === targetId && now - item.startTime < placementVfxDuration)
    .at(-1) ?? null;
}

function getPlacementAssetPop(targetType, targetId) {
  const item = getActivePlacementVfx(targetType, targetId);
  if (!item) return { opacity: 1, scale: 1, wobbleX: 0, wobbleY: 0 };

  const progress = clamp01((getPlacementVfxTime() - item.startTime) / placementVfxDuration);
  const revealStart = 0.72;
  if (progress < revealStart) return { opacity: 0, scale: 0.25, wobbleX: 0, wobbleY: 0 };

  const localProgress = clamp01((progress - revealStart) / (1 - revealStart));
  const popScale = localProgress < 0.45
    ? 0.25 + easeOutCubic(localProgress / 0.45) * 0.9
    : 1.15 - easeOutCubic((localProgress - 0.45) / 0.55) * 0.15;
  const wobble = Math.sin(localProgress * Math.PI * 6) * (1 - localProgress) * 2;
  return {
    opacity: clamp01(localProgress * 8),
    scale: popScale,
    wobbleX: wobble,
    wobbleY: -wobble * 0.45
  };
}

function createPlacementTransform(centerX, centerY, rotation, pop) {
  const transforms = [];
  if (pop.wobbleX || pop.wobbleY) transforms.push(`translate(${pop.wobbleX} ${pop.wobbleY})`);
  if (rotation) transforms.push(`rotate(${rotation} ${centerX} ${centerY})`);
  if (pop.scale !== 1) transforms.push(`translate(${centerX} ${centerY}) scale(${pop.scale}) translate(${-centerX} ${-centerY})`);
  return transforms.join(" ");
}

function queueDiceRollAnimation(player, dice) {
  if (!player || !Array.isArray(dice) || dice.length !== 2 || isDiceRollAnimating()) return;

  const now = getAnimationNow();
  const seed = createDiceRollSeed(player.id, dice, now);
  const duration = 1000 + seededRandom(seed, 1) * 800;
  diceRollAnimation.currentTime = now;
  diceRollAnimation.item = {
    playerId: player.id,
    color: playerDiceColors[player.color] ?? playerDiceColors.red,
    dice: dice.map((value) => Math.max(1, Math.min(6, Number(value) || 1))),
    startTime: now,
    duration,
    holdDuration: DICE_RESULT_HOLD_MS,
    fadeDuration: DICE_RESULT_FADE_MS,
    seed,
    start: {
      x: 0.24 + seededRandom(seed, 2) * 0.2,
      y: 0.16 + seededRandom(seed, 3) * 0.18
    },
    end: {
      x: 0.5 + (seededRandom(seed, 4) - 0.5) * 0.18,
      y: 0.47 + (seededRandom(seed, 5) - 0.5) * 0.16
    },
    spread: 0.075 + seededRandom(seed, 6) * 0.035,
    direction: (seededRandom(seed, 7) - 0.5) * Math.PI * 0.55,
    fallHeight: 42 + seededRandom(seed, 12) * 34,
    spin: [
      createDice3dSpin(seed, 0),
      createDice3dSpin(seed, 1)
    ]
  };
  startDiceRollLoop();
}

function getPlacementRollDice(gameState, playerId) {
  if (!playerId) return null;
  const currentRoll = gameState.placement?.rolls?.[playerId];
  if (Array.isArray(currentRoll?.dice) && currentRoll.dice.length === 2) return currentRoll.dice;
  const historyRoll = gameState.placement?.rollHistory?.at(-1)?.[playerId];
  return Array.isArray(historyRoll?.dice) && historyRoll.dice.length === 2 ? historyRoll.dice : null;
}

function isDiceRollAnimating() {
  const item = diceRollAnimation.item;
  if (!item) return false;
  return getAnimationNow() - item.startTime < item.duration + item.holdDuration + item.fadeDuration;
}

function startDiceRollLoop() {
  if (diceRollAnimation.frameRequestId || !diceRollAnimation.item) return;
  diceRollAnimation.frameRequestId = requestAnimationFrame(updateDiceRollAnimation);
}

function updateDiceRollAnimation(now) {
  diceRollAnimation.currentTime = now;
  const item = diceRollAnimation.item;
  diceRollAnimation.frameRequestId = null;
  if (!item || now - item.startTime >= item.duration + item.holdDuration + item.fadeDuration) {
    diceRollAnimation.item = null;
    diceRollAnimation.currentTime = 0;
    render();
    return;
  }
  updateDice3dOverlayDom();
  diceRollAnimation.frameRequestId = requestAnimationFrame(updateDiceRollAnimation);
}

function renderShipEngineVfxCanvas(layerName) {
  const canvasElement = document.createElement("canvas");
  canvasElement.className = `ship-engine-vfx-overlay ship-engine-vfx-overlay--${layerName}`;
  canvasElement.dataset.layer = layerName;
  canvasElement.setAttribute("aria-hidden", "true");
  return canvasElement;
}

function drawShipEngineVfxOverlays() {
  if (state.view !== "board") return;
  for (const layerName of shipVfxCanvasLayers) {
    drawShipEngineVfxLayer(layerName);
  }
}

function queueMothershipSpeedAnimation(player, flightRoll) {
  if (!player || !Array.isArray(flightRoll?.balls) || flightRoll.balls.length !== 2) return;

  const now = getAnimationNow();
  const seed = createMothershipSpeedSeed(player.id, flightRoll.balls, now);
  const shakeCycles = MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES
    + Math.floor(Math.random() * (MOTHERSHIP_SPEED_MAX_SHAKE_CYCLES - MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES + 1));
  mothershipSpeedAnimation.currentTime = now;
  mothershipSpeedAnimation.item = {
    playerId: player.id,
    balls: flightRoll.balls.slice(0, 2),
    baseSpeed: flightRoll.baseSpeed,
    totalSpeed: state.gameState?.flightSpeedTotal ?? flightRoll.baseSpeed,
    encounterTriggered: Boolean(flightRoll.encounterTriggered),
    startTime: now,
    seed,
    shakeCycles
  };
  startMothershipSpeedLoop();
}

function isMothershipSpeedAnimating() {
  const item = mothershipSpeedAnimation.item;
  if (!item) return false;
  return getAnimationNow() - item.startTime < getMothershipSpeedTotalDuration(item);
}

function startMothershipSpeedLoop() {
  if (mothershipSpeedAnimation.frameRequestId || !mothershipSpeedAnimation.item) return;
  mothershipSpeedAnimation.frameRequestId = requestAnimationFrame(updateMothershipSpeedAnimation);
}

function updateMothershipSpeedAnimation(now) {
  mothershipSpeedAnimation.currentTime = now;
  const item = mothershipSpeedAnimation.item;
  mothershipSpeedAnimation.frameRequestId = null;
  if (!item || now - item.startTime >= getMothershipSpeedTotalDuration(item)) {
    mothershipSpeedAnimation.item = null;
    mothershipSpeedAnimation.currentTime = 0;
    if (state.gameState?.phase === "flight" && state.gameState.activeEncounter) {
      state.hudPlayerId = getActivePlayer()?.id ?? null;
      state.hudTab = "turn";
    }
    render();
    return;
  }
  updateMothershipSpeedOverlayDom();
  mothershipSpeedAnimation.frameRequestId = requestAnimationFrame(updateMothershipSpeedAnimation);
}

function getMothershipSpeedTotalDuration(item = mothershipSpeedAnimation.item) {
  return MOTHERSHIP_SPEED_APPEAR_MS
    + getMothershipSpeedShakeDuration(item)
    + MOTHERSHIP_SPEED_REVEAL_MS
    + MOTHERSHIP_SPEED_HOLD_MS
    + MOTHERSHIP_SPEED_FADE_MS;
}

function getMothershipSpeedShakeDuration(item = mothershipSpeedAnimation.item) {
  return MOTHERSHIP_SPEED_SHAKE_MS * getMothershipSpeedShakeCycles(item);
}

function getMothershipSpeedTime() {
  return mothershipSpeedAnimation.currentTime || getAnimationNow();
}

function createMothershipSpeedSeed(playerId, balls, now) {
  let seed = Math.floor(now) + balls.join("").length * 97;
  for (const character of `${playerId}:${balls.join("-")}`) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }
  return seed || 1;
}

function renderMothershipSpeedOverlay() {
  const item = mothershipSpeedAnimation.item;
  if (!item || state.view !== "board") return null;

  const metrics = getMothershipSpeedMetrics(item);
  const player = state.gameState?.players?.find((candidate) => candidate.id === item.playerId) ?? getActivePlayer();

  const overlay = document.createElement("div");
  overlay.className = "mothership-speed-overlay";
  overlay.style.opacity = metrics.opacity.toFixed(3);
  overlay.setAttribute("aria-hidden", "true");

  const panel = document.createElement("section");
  panel.className = "mothership-speed-panel";

  const visualWrap = document.createElement("div");
  visualWrap.className = "mothership-speed-visual-wrap";
  visualWrap.style.transformOrigin = `${MOTHERSHIP_SPEED_ANIMATION_CONFIG.shake.pivot.x}% ${MOTHERSHIP_SPEED_ANIMATION_CONFIG.shake.pivot.y}%`;
  visualWrap.style.transform = getMothershipSpeedVisualTransform(metrics);

  const visual = renderMothershipUpgradeVisual(player);
  visual.classList.add("mothership-speed-visual");
  const pocket = document.createElement("div");
  pocket.className = "mothership-speed-ball-pocket";
  applyMothershipSpeedSlotStyle(pocket);
  item.balls.forEach((ball, index) => {
    pocket.append(renderMothershipSpeedBall(ball, index, metrics.revealProgress));
  });
  visual.append(pocket);
  visualWrap.append(visual);

  panel.append(visualWrap);
  overlay.append(panel);
  return overlay;
}

function updateMothershipSpeedOverlayDom() {
  const overlay = document.querySelector(".mothership-speed-overlay");
  const item = mothershipSpeedAnimation.item;
  if (!overlay || !item) {
    render();
    return;
  }

  const metrics = getMothershipSpeedMetrics(item);
  overlay.style.opacity = metrics.opacity.toFixed(3);
  const visualWrap = overlay.querySelector(".mothership-speed-visual-wrap");
  if (visualWrap) {
    visualWrap.style.transformOrigin = `${MOTHERSHIP_SPEED_ANIMATION_CONFIG.shake.pivot.x}% ${MOTHERSHIP_SPEED_ANIMATION_CONFIG.shake.pivot.y}%`;
    visualWrap.style.transform = getMothershipSpeedVisualTransform(metrics);
  }
  const pocket = overlay.querySelector(".mothership-speed-ball-pocket");
  if (pocket) applyMothershipSpeedSlotStyle(pocket);
  const balls = overlay.querySelectorAll(".mothership-speed-ball");
  balls.forEach((ballElement, index) => {
    applyMothershipSpeedBallStyle(ballElement, index, metrics.revealProgress);
  });
  const status = overlay.querySelector(".mothership-speed-result");
  if (status) {
    status.hidden = metrics.revealProgress <= 0;
  }
}

function getMothershipSpeedMetrics(item) {
  const elapsed = getMothershipSpeedTime() - item.startTime;
  const appearProgress = easeOutCubic(clamp01(elapsed / MOTHERSHIP_SPEED_APPEAR_MS));
  const shakeStart = MOTHERSHIP_SPEED_APPEAR_MS;
  const revealStart = shakeStart + getMothershipSpeedShakeDuration(item);
  const fadeStart = revealStart + MOTHERSHIP_SPEED_REVEAL_MS + MOTHERSHIP_SPEED_HOLD_MS;
  const revealProgress = clamp01((elapsed - revealStart) / MOTHERSHIP_SPEED_REVEAL_MS);
  const fadeProgress = clamp01((elapsed - fadeStart) / MOTHERSHIP_SPEED_FADE_MS);
  return {
    appearProgress,
    revealProgress,
    opacity: appearProgress * (1 - easeOutCubic(fadeProgress)),
    shake: getMothershipSpeedShake(item, elapsed)
  };
}

function getMothershipSpeedVisualTransform(metrics) {
  return [
    "translate(-50%, -50%)",
    `translate(${metrics.shake.x.toFixed(2)}px, ${metrics.shake.y.toFixed(2)}px)`,
    `rotate(${metrics.shake.rotation.toFixed(3)}deg)`,
    `scale(${(0.9 + metrics.appearProgress * 0.1).toFixed(3)})`
  ].join(" ");
}

function getMothershipSpeedShake(item, elapsed) {
  const shakeElapsed = elapsed - MOTHERSHIP_SPEED_APPEAR_MS;
  const shakeDuration = getMothershipSpeedShakeDuration(item);
  if (shakeElapsed <= 0 || shakeElapsed >= shakeDuration) return { x: 0, y: 0, rotation: 0 };
  const cycles = getMothershipSpeedShakeCycles(item);
  const shakeProgress = clamp01(shakeElapsed / shakeDuration);

  const config = MOTHERSHIP_SPEED_ANIMATION_CONFIG.shake;
  const falloff = Math.sin(shakeProgress * Math.PI);
  const phase = shakeProgress * Math.PI * 5.2 * config.speed * cycles;
  const secondaryPhase = shakeProgress * Math.PI * 18 * cycles;
  const arc = Math.sin(phase);
  const lift = Math.cos(phase);
  const leverAxis = getMothershipSpeedLeverAxis(config);
  const tangent = { x: -leverAxis.y, y: leverAxis.x };
  const primary = arc * config.amplitude;
  const secondary = -lift * config.amplitude * 0.62;
  return {
    x: (
      tangent.x * primary
      + leverAxis.x * secondary
      + Math.sin(secondaryPhase + item.seed) * config.secondaryVibration
    ) * falloff,
    y: (
      tangent.y * primary
      + leverAxis.y * secondary
      + Math.cos(secondaryPhase) * config.secondaryVibration * 0.55
    ) * falloff,
    rotation: (arc * config.rotationAngle + Math.sin(secondaryPhase + 0.7) * config.secondaryVibration * 0.18) * falloff
  };
}

function getMothershipSpeedLeverAxis(config) {
  const dx = config.lever.x - config.pivot.x;
  const dy = config.lever.y - config.pivot.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: dx / length,
    y: dy / length
  };
}

function getMothershipSpeedShakeCycles(item) {
  return Number.isInteger(item?.shakeCycles)
    ? Math.max(MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES, Math.min(MOTHERSHIP_SPEED_MAX_SHAKE_CYCLES, item.shakeCycles))
    : MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES;
}

function applyMothershipSpeedSlotStyle(pocket) {
  const slot = MOTHERSHIP_SPEED_ANIMATION_CONFIG.slot;
  pocket.style.left = `${slot.x}%`;
  pocket.style.top = `${slot.y}%`;
  pocket.style.width = `${slot.width}%`;
  pocket.style.height = `${slot.height}%`;
  pocket.style.borderRadius = `${slot.radius}%`;
}

function renderMothershipSpeedBall(ball, index, revealProgress) {
  const visual = mothershipBallVisuals[ball] ?? mothershipBallVisuals.yellow;
  const ballElement = document.createElement("span");
  ballElement.className = `mothership-speed-ball mothership-speed-ball--${ball}`;
  ballElement.style.setProperty("--ball-color", visual.color);
  ballElement.style.setProperty("--ball-light", visual.light);
  ballElement.style.setProperty("--ball-dark", visual.dark);
  applyMothershipSpeedBallStyle(ballElement, index, revealProgress);
  return ballElement;
}

function applyMothershipSpeedBallStyle(ballElement, index, revealProgress) {
  const progress = easeOutCubic(clamp01(revealProgress));
  const slot = MOTHERSHIP_SPEED_ANIMATION_CONFIG.slot;
  const ballConfig = index === 0
    ? MOTHERSHIP_SPEED_ANIMATION_CONFIG.balls.ball1
    : MOTHERSHIP_SPEED_ANIMATION_CONFIG.balls.ball2;
  const x = lerp(ballConfig.start.x, ballConfig.end.x, progress);
  const y = lerp(ballConfig.start.y, ballConfig.end.y, progress);
  const localX = ((x - slot.x) / slot.width) * 100;
  const localY = ((y - slot.y) / slot.height) * 100;
  const ballSize = (MOTHERSHIP_SPEED_ANIMATION_CONFIG.balls.size * MOTHERSHIP_SPEED_GAME_BALL_SCALE / slot.width) * 100;
  ballElement.style.left = `${localX.toFixed(3)}%`;
  ballElement.style.top = `${localY.toFixed(3)}%`;
  ballElement.style.width = `${ballSize.toFixed(3)}%`;
  ballElement.style.opacity = progress.toFixed(3);
  ballElement.style.transform = "translate(-50%, -50%)";
}

function drawShipEngineVfxLayer(layerName) {
  const canvasElement = document.querySelector(`.ship-engine-vfx-overlay--${layerName}`);
  if (!(canvasElement instanceof HTMLCanvasElement)) return;

  const targetContext = canvasElement.getContext("2d");
  const rect = canvasElement.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvasElement.width !== width || canvasElement.height !== height) {
    canvasElement.width = width;
    canvasElement.height = height;
  }

  targetContext.setTransform(1, 0, 0, 1, 0, 0);
  targetContext.clearRect(0, 0, width, height);
  pruneShipEngineTrails(getShipVfxTime());
  if (shipFlightAnimation.items.length === 0 && shipEngineTrails.length === 0) return;

  targetContext.setTransform(width / boardLayout.width, 0, 0, height / boardLayout.height, 0, 0);
  const pointsById = new Map((boardLayout.points ?? []).map((point) => [point.id, point]));
  const time = getShipVfxTime();
  for (const ship of state.gameState?.board?.ships ?? []) {
    if (!isShipFlightAnimating(ship.id)) continue;
    const point = pointsById.get(ship.locationId);
    const owner = state.gameState?.players?.find((player) => player.id === ship.ownerPlayerId);
    const anchors = getShipVfxAnchorsForRender(owner, ship);
    if (!point || !anchors) continue;
    drawShipEngineVfx(targetContext, ship, owner, anchors, getShipRenderPose(ship, point), layerName, time);
  }
  for (const trail of shipEngineTrails) {
    const ship = state.gameState?.board?.ships?.find((candidate) => candidate.id === trail.shipId);
    if (!ship || isShipFlightAnimating(ship.id)) continue;
    const owner = state.gameState?.players?.find((player) => player.id === ship.ownerPlayerId);
    const anchors = getShipVfxAnchorsForRender(owner, ship);
    if (!anchors) continue;
    drawShipEngineVfx(targetContext, ship, owner, anchors, trail.pose, layerName, time, {
      inactiveSince: trail.inactiveSince
    });
  }
  targetContext.setTransform(1, 0, 0, 1, 0, 0);
}

function renderDice3dOverlay() {
  const item = diceRollAnimation.item;
  if (!item || state.view !== "board") return null;

  const elapsed = getDiceRollTime() - item.startTime;
  const rollingProgress = clamp01(elapsed / item.duration);
  const fadeElapsed = Math.max(0, elapsed - item.duration - item.holdDuration);
  const fadeProgress = clamp01(fadeElapsed / item.fadeDuration);
  const fade = 1 - easeOutCubic(fadeProgress);
  const overlay = document.createElement("div");
  overlay.className = "dice3d-overlay";
  overlay.style.opacity = fade.toFixed(3);
  overlay.setAttribute("aria-hidden", "true");

  const scene = document.createElement("div");
  scene.className = "dice3d-scene";
  for (let index = 0; index < 2; index += 1) {
    scene.append(renderDice3dDie(item, index, rollingProgress));
  }
  overlay.append(scene);
  return overlay;
}

function updateDice3dOverlayDom() {
  const overlay = document.querySelector(".dice3d-overlay");
  const item = diceRollAnimation.item;
  if (!overlay || !item || state.view !== "board") return;

  const elapsed = getDiceRollTime() - item.startTime;
  const rollingProgress = clamp01(elapsed / item.duration);
  const fadeElapsed = Math.max(0, elapsed - item.duration - item.holdDuration);
  const fadeProgress = clamp01(fadeElapsed / item.fadeDuration);
  const fade = 1 - easeOutCubic(fadeProgress);
  overlay.style.opacity = fade.toFixed(3);

  const scene = overlay.querySelector(".dice3d-scene");
  if (!scene) return;
  scene.replaceChildren(
    renderDice3dDie(item, 0, rollingProgress),
    renderDice3dDie(item, 1, rollingProgress)
  );
}

function renderDice3dDie(item, index, progress) {
  const pose = getDice3dPose(item, index, progress);
  const die = document.createElement("div");
  die.className = "dice3d-die";
  die.style.left = `${pose.x}%`;
  die.style.top = `${pose.y}%`;
  die.style.setProperty("--dice-size", `${pose.size}px`);
  die.style.setProperty("--dice-color", item.color);
  die.style.setProperty("--dice-light", lightenHex(item.color, 0.24));
  die.style.setProperty("--dice-dark", darkenHex(item.color, 0.2));
  die.style.setProperty("--pip-color", getContrastingPipColor(item.color));
  die.style.setProperty("--shadow-scale", pose.shadowScale.toFixed(3));
  die.style.setProperty("--shadow-alpha", pose.shadowAlpha.toFixed(3));
  die.style.transform = [
    "translate(-50%, -50%)",
    `translate3d(${pose.wobbleX.toFixed(2)}px, ${pose.bounceY.toFixed(2)}px, ${pose.depth.toFixed(2)}px)`,
    `scale(${pose.scaleX.toFixed(3)}, ${pose.scaleY.toFixed(3)})`
  ].join(" ");

  const shadow = document.createElement("div");
  shadow.className = "dice3d-shadow";

  const cube = document.createElement("div");
  cube.className = "dice3d-cube";
  cube.style.transform = getDice3dCubeTransform(item, index, progress);
  for (const face of getDice3dFaces()) {
    cube.append(createDice3dFace(face.value, face.className));
  }

  die.append(shadow, cube);
  return die;
}

function getDice3dPose(item, index, progress) {
  const progressEased = easeOutCubic(progress);
  const perpendicular = item.direction + Math.PI / 2;
  const side = index === 0 ? -1 : 1;
  const offset = side * item.spread * 100;
  const startX = item.start.x * 100 + Math.cos(perpendicular) * offset;
  const startY = item.start.y * 100 + Math.sin(perpendicular) * offset;
  const endX = item.end.x * 100 + Math.cos(perpendicular) * offset * 0.72;
  const endY = item.end.y * 100 + Math.sin(perpendicular) * offset * 0.72;
  const bouncePhase = Math.sin(progress * Math.PI * (4.1 + seededRandom(item.seed, 20 + index) * 0.8));
  const bounceY = -Math.max(0, bouncePhase) * (1 - progress) * item.fallHeight;
  const wobbleX = Math.sin(progress * Math.PI * 5.5 + item.seed + index) * (1 - progress) * 16;
  const impact = Math.max(0, Math.cos(progress * Math.PI * 4.1)) * (1 - progress);
  const viewportSize = Math.min(window.innerWidth || 900, window.innerHeight || 600);
  const size = Math.max(48, Math.min(84, viewportSize * 0.11));

  return {
    x: lerp(startX, endX, progressEased),
    y: lerp(startY, endY, progressEased),
    bounceY,
    wobbleX,
    depth: Math.sin(progress * Math.PI) * (42 + seededRandom(item.seed, 21 + index) * 24),
    size,
    scaleX: 1 + impact * 0.06,
    scaleY: 1 - impact * 0.08,
    shadowScale: 0.62 + progress * 0.38 + impact * 0.16,
    shadowAlpha: 0.2 + progress * 0.34 + impact * 0.18
  };
}

function getDice3dCubeTransform(item, index, progress) {
  const finalRotation = getDice3dFinalRotation(item.dice[index], index);
  const settleProgress = easeOutCubic(clamp01((progress - 0.68) / 0.32));
  const spinFactor = 1 - settleProgress;
  const rollProgress = 1 - progress * 0.24;
  const spin = item.spin[index];
  return [
    `rotateX(${(finalRotation.x + spin.x * spinFactor * rollProgress).toFixed(2)}deg)`,
    `rotateY(${(finalRotation.y + spin.y * spinFactor * rollProgress).toFixed(2)}deg)`,
    `rotateZ(${(finalRotation.z + spin.z * spinFactor * rollProgress).toFixed(2)}deg)`
  ].join(" ");
}

function getDice3dFinalRotation(value, index) {
  const finalTilt = index === 0 ? -7 : 6;
  const finalRoll = index === 0 ? 5 : -4;
  const rotations = {
    1: { x: -12, y: 0, z: finalRoll },
    2: { x: -12, y: -90, z: finalRoll },
    3: { x: -102, y: 0, z: finalRoll },
    4: { x: 78, y: 0, z: finalRoll },
    5: { x: -12, y: 90, z: finalRoll },
    6: { x: -12, y: 180, z: finalRoll }
  };
  const rotation = rotations[value] ?? rotations[1];
  return {
    ...rotation,
    x: rotation.x + finalTilt
  };
}

function getDice3dFaces() {
  return [
    { value: 1, className: "front" },
    { value: 6, className: "back" },
    { value: 2, className: "right" },
    { value: 5, className: "left" },
    { value: 3, className: "top" },
    { value: 4, className: "bottom" }
  ];
}

function createDice3dFace(value, className) {
  const face = document.createElement("div");
  face.className = `dice3d-face dice3d-face--${className}`;
  for (const pipPosition of getDicePipPositions(value)) {
    const pip = document.createElement("span");
    pip.className = `dice3d-pip dice3d-pip--${pipPosition}`;
    face.append(pip);
  }
  return face;
}

function getDicePipPositions(value) {
  const pipLayouts = {
    1: ["center"],
    2: ["top-left", "bottom-right"],
    3: ["top-left", "center", "bottom-right"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]
  };
  return pipLayouts[value] ?? pipLayouts[1];
}

function createDice3dSpin(seed, index) {
  const offset = index * 23;
  return {
    x: (seededRandom(seed, 8 + offset) > 0.5 ? 1 : -1) * (720 + seededRandom(seed, 9 + offset) * 1260),
    y: (seededRandom(seed, 10 + offset) > 0.5 ? 1 : -1) * (900 + seededRandom(seed, 11 + offset) * 1440),
    z: (seededRandom(seed, 12 + offset) > 0.5 ? 1 : -1) * (180 + seededRandom(seed, 13 + offset) * 540)
  };
}

function getDiceRollTime() {
  return diceRollAnimation.currentTime || getAnimationNow();
}

function createDiceRollSeed(playerId, dice, now) {
  let seed = Math.floor(now) + dice[0] * 31 + dice[1] * 71;
  for (const character of String(playerId)) {
    seed = (seed * 33 + character.charCodeAt(0)) >>> 0;
  }
  return seed || 1;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function easeOutCubic(value) {
  const progress = clamp01(value);
  return 1 - ((1 - progress) ** 3);
}

function getContrastingPipColor(hex) {
  const { red, green, blue } = hexToRgb(hex);
  const luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
  return luminance > 0.58 ? "#0f172a" : "#f8fafc";
}

function lightenHex(hex, amount) {
  const { red, green, blue } = hexToRgb(hex);
  return rgbToHex(
    red + (255 - red) * amount,
    green + (255 - green) * amount,
    blue + (255 - blue) * amount
  );
}

function darkenHex(hex, amount) {
  const { red, green, blue } = hexToRgb(hex);
  return rgbToHex(red * (1 - amount), green * (1 - amount), blue * (1 - amount));
}

function rgbaFromHex(hex, alpha) {
  const { red, green, blue } = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${clamp01(alpha)})`;
}

function getShipVfxColor(playerColor) {
  return shipVfxDefaultColorByPlayerColor[playerColor] ?? shipVfxDefaultColorByPlayerColor.red;
}

function hexToRgb(hex) {
  const clean = String(hex).replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255
  };
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function seededRandom(seed, index) {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function queueShipFlightAnimation(ship, fromPoint, toPoint) {
  if (!ship || !fromPoint || !toPoint || fromPoint.id === toPoint.id) return;

  const distance = getDistance(fromPoint, toPoint);
  const startAngle = getShipVisualAngle(ship.id);
  const targetAngle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
  const duration = Math.max(1500, Math.min(5800, (460 + distance * 6.4) * 2.65));
  const noseDistance = Math.max(56, Math.min(170, distance * 0.42));
  const controlDistance = Math.max(48, Math.min(150, distance * 0.34));
  const controlPoint1 = {
    x: fromPoint.x + Math.cos(startAngle) * noseDistance,
    y: fromPoint.y + Math.sin(startAngle) * noseDistance
  };
  const controlPoint2 = {
    x: toPoint.x - Math.cos(targetAngle) * controlDistance,
    y: toPoint.y - Math.sin(targetAngle) * controlDistance
  };

  shipFlightAnimation.items = shipFlightAnimation.items.filter((item) => item.shipId !== ship.id);
  shipFlightAnimation.items.push({
    shipId: ship.id,
    from: { x: fromPoint.x, y: fromPoint.y },
    to: { x: toPoint.x, y: toPoint.y },
    controlPoint1,
    controlPoint2,
    startAngle,
    startTime: getAnimationNow(),
    duration
  });
  startShipFlightLoop();
}

function startShipFlightLoop() {
  if (shipFlightAnimation.frameRequestId || shipFlightAnimation.items.length === 0) return;
  shipFlightAnimation.frameRequestId = requestAnimationFrame(updateShipFlightAnimations);
}

function updateShipFlightAnimations(now) {
  shipFlightAnimation.currentTime = now;
  const activeAnimations = [];
  for (const item of shipFlightAnimation.items) {
    if (now - item.startTime >= item.duration) {
      const finalPose = getShipFlightPose(item, 1);
      shipVisualAngles.set(item.shipId, finalPose.angle);
      queueShipEngineTrail(item.shipId, finalPose, now);
    } else {
      activeAnimations.push(item);
    }
  }
  shipFlightAnimation.items = activeAnimations;
  shipFlightAnimation.frameRequestId = null;
  render();
  if (shipFlightAnimation.items.length > 0) {
    shipFlightAnimation.frameRequestId = requestAnimationFrame(updateShipFlightAnimations);
  }
}

function queueShipEngineTrail(shipId, pose, inactiveSince) {
  const existingIndex = shipEngineTrails.findIndex((trail) => trail.shipId === shipId);
  const trail = {
    shipId,
    pose,
    inactiveSince,
    expiresAt: inactiveSince + shipEngineTrailDuration
  };
  if (existingIndex >= 0) {
    shipEngineTrails[existingIndex] = trail;
  } else {
    shipEngineTrails.push(trail);
  }
}

function pruneShipEngineTrails(now) {
  for (let index = shipEngineTrails.length - 1; index >= 0; index -= 1) {
    if (shipEngineTrails[index].expiresAt <= now) {
      shipEngineTrails.splice(index, 1);
    }
  }
}

function getShipFlightPose(animation, progress) {
  const easedProgress = easeInOutCubic(clamp01(progress));
  const point = getCubicBezierPoint(
    animation.from,
    animation.controlPoint1,
    animation.controlPoint2,
    animation.to,
    easedProgress
  );
  const tangent = getCubicBezierTangent(
    animation.from,
    animation.controlPoint1,
    animation.controlPoint2,
    animation.to,
    easedProgress
  );
  const tangentAngle = Math.atan2(tangent.y, tangent.x);
  const rotationBlend = easeOutCubic(Math.min(1, progress * 1.4));

  return {
    x: point.x,
    y: point.y,
    angle: lerpAngle(animation.startAngle, tangentAngle, rotationBlend)
  };
}

function getShipRenderPose(ship, fallbackPoint) {
  const animation = getShipFlightAnimation(ship.id);
  if (!animation) {
    return {
      x: fallbackPoint.x,
      y: fallbackPoint.y,
      angle: getShipVisualAngle(ship.id)
    };
  }

  const progress = clamp01((getShipFlightTime() - animation.startTime) / animation.duration);
  return getShipFlightPose(animation, progress);
}

function getShipFlightAnimation(shipId) {
  return shipFlightAnimation.items.find((item) => item.shipId === shipId) ?? null;
}

function isShipFlightAnimating(shipId) {
  return Boolean(getShipFlightAnimation(shipId));
}

function getShipFlightTime() {
  return shipFlightAnimation.currentTime || getAnimationNow();
}

function getShipVfxTime() {
  return shipVfxAnimation.currentTime || shipFlightAnimation.currentTime || getAnimationNow();
}

function startShipVfxLoop() {
  if (shipVfxAnimation.frameRequestId || !shouldRunShipVfxLoop()) return;
  shipVfxAnimation.frameRequestId = requestAnimationFrame(updateShipVfxAnimation);
}

function stopShipVfxLoop() {
  if (shipVfxAnimation.frameRequestId) {
    cancelAnimationFrame(shipVfxAnimation.frameRequestId);
  }
  shipVfxAnimation.frameRequestId = null;
}

function updateShipVfxAnimation(now) {
  shipVfxAnimation.currentTime = now;
  shipVfxAnimation.frameRequestId = null;
  pruneShipEngineTrails(now);
  drawShipEngineVfxOverlays();
  if (shouldRunShipVfxLoop()) {
    startShipVfxLoop();
  } else {
    shipVfxAnimation.currentTime = 0;
  }
}

function syncShipVfxLoop() {
  if (shouldRunShipVfxLoop()) {
    startShipVfxLoop();
  } else {
    stopShipVfxLoop();
  }
}

function shouldRunShipVfxLoop() {
  if (state.view !== "board" || !state.gameState) return false;
  if (shipEngineTrails.length > 0) return true;
  if (shipFlightAnimation.items.length > 0) return false;
  return state.gameState.phase === "flight" && state.gameState.hasRolledFlightSpeed;
}

function drawShipEngineVfx(targetContext, ship, owner, anchors, pose, layerName, time, options = {}) {
  const visual = playerPieceVisualDefaults.ship;
  for (const engine of anchors.engines ?? []) {
    const template = engine.templateId ? getShipEngineTemplate(engine.templateId) : null;
    const emitters = template?.emitters?.length ? template.emitters : [engine];
    for (const emitter of emitters) {
      const emitterLayer = normalizeShipVfxLayer(emitter.layer ?? engine.layer);
      if (emitterLayer !== layerName) continue;
      drawShipEngineEmitter(targetContext, anchors, visual, pose, engine, emitter, owner, time, options);
    }
  }
}

function drawShipEngineEmitter(targetContext, anchors, visual, pose, engine, emitter, owner, time, options = {}) {
  const localPoint = {
    x: engine.x + (emitter.x ?? 0),
    y: engine.y + (emitter.y ?? 0)
  };
  const fitScale = getShipVfxFitScale(anchors, visual);
  const origin = getShipVfxWorldPoint(anchors, visual, pose, localPoint.x, localPoint.y);
  const direction = pose.angle + degreesToRadians((engine.direction ?? 0) + (emitter.direction ?? 0));
  const color = emitter.color ?? engine.color ?? getShipVfxColor(owner?.color);
  const trailProgress = options.inactiveSince
    ? clamp01((time - options.inactiveSince) / shipEngineTrailDuration)
    : 0;
  const trailFade = options.inactiveSince ? 1 - easeOutCubic(trailProgress) : 1;
  const intensity = Math.max(0.05, emitter.intensity ?? 0.75) * trailFade;
  if (intensity <= 0.01) return;
  const size = Math.max(1.2, (emitter.size ?? engine.size ?? 8) * fitScale * 1.18);
  const length = Math.max(5, (emitter.length ?? engine.length ?? 44) * fitScale * 1.16);
  const spread = Math.max(0, (emitter.spread ?? 18) * 1.18);
  const count = Math.max(6, Math.min(96, Math.round((emitter.count ?? 18) * 1.32)));
  const speed = Math.max(0.08, (emitter.speed ?? 0.5) * 1.95);
  const jitter = Math.max(0, (emitter.jitter ?? 0.25) * 1.35);
  const seed = createShipEmitterSeed(engine.id, emitter.id, color);
  const flicker = 0.82 + seededRandom(seed, Math.floor(time / 96)) * 0.28;

  if (!options.inactiveSince) {
    drawShipEngineGlow(targetContext, origin, color, size * flicker, intensity, emitter.type);
  }
  drawShipEngineParticles(targetContext, {
    origin,
    direction,
    color,
    intensity,
    size,
    length,
    spread,
    count,
    speed,
    jitter,
    type: emitter.type ?? "plasma",
    seed,
    time,
    inactiveSince: options.inactiveSince
  });
}

function drawShipEngineGlow(targetContext, origin, color, radius, intensity, type) {
  const alpha = type === "smoke" ? 0.14 : 0.34;
  const gradient = targetContext.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, radius * 2.8);
  gradient.addColorStop(0, rgbaFromHex(color, Math.min(0.72, alpha * intensity * 2.4)));
  gradient.addColorStop(0.36, rgbaFromHex(color, alpha * intensity));
  gradient.addColorStop(1, rgbaFromHex(color, 0));
  targetContext.save();
  targetContext.globalCompositeOperation = type === "smoke" ? "source-over" : "lighter";
  targetContext.fillStyle = gradient;
  targetContext.beginPath();
  targetContext.arc(origin.x, origin.y, radius * 2.8, 0, Math.PI * 2);
  targetContext.fill();
  targetContext.restore();
}

function drawShipEngineParticles(targetContext, options) {
  const perpendicular = options.direction + Math.PI / 2;
  const spreadScale = options.length * 0.006;
  targetContext.save();
  targetContext.globalCompositeOperation = ["smoke", "mist", "haze"].includes(options.type) ? "source-over" : "lighter";

  for (let index = 0; index < options.count; index += 1) {
    const phaseOffset = seededRandom(options.seed, index * 5 + 1);
    const cutoffLoop = options.inactiveSince
      ? ((options.inactiveSince * 0.001 * options.speed + phaseOffset) % 1 + 1) % 1
      : null;
    const loop = cutoffLoop === null
      ? ((options.time * 0.001 * options.speed + phaseOffset) % 1 + 1) % 1
      : cutoffLoop + Math.max(0, options.time - options.inactiveSince) * 0.001 * options.speed;
    if (loop >= 1) continue;
    const travel = loop * options.length;
    const spreadDirection = (seededRandom(options.seed, index * 5 + 2) - 0.5) * degreesToRadians(options.spread);
    const lateral = (seededRandom(options.seed, index * 5 + 3) - 0.5)
      * options.spread
      * spreadScale
      * loop
      * (1 + Math.sin(options.time * 0.006 + index) * options.jitter);
    const direction = options.direction + spreadDirection * loop;
    const x = options.origin.x + Math.cos(direction) * travel + Math.cos(perpendicular) * lateral;
    const y = options.origin.y + Math.sin(direction) * travel + Math.sin(perpendicular) * lateral;
    const alpha = getEmitterParticleAlpha(options.type, loop, options.intensity);
    const radius = getEmitterParticleRadius(options.type, options.size, loop, options.seed, index);
    if (alpha <= 0 || radius <= 0) continue;

    targetContext.fillStyle = rgbaFromHex(options.color, alpha);
    targetContext.beginPath();
    targetContext.arc(x, y, radius, 0, Math.PI * 2);
    targetContext.fill();
  }

  targetContext.restore();
}

function getEmitterParticleAlpha(type, progress, intensity) {
  if (type === "smoke") return (1 - progress) * 0.26 * intensity;
  if (type === "ember" || type === "spark") return (1 - progress) * 1.0 * intensity;
  if (type === "glow") return (1 - progress) * 0.34 * intensity;
  return (1 - progress) * 0.76 * intensity;
}

function getEmitterParticleRadius(type, size, progress, seed, index) {
  const randomScale = 0.72 + seededRandom(seed, index * 5 + 4) * 0.68;
  if (type === "smoke") return size * (0.18 + progress * 0.58) * randomScale;
  if (type === "ember" || type === "spark") return size * 0.24 * randomScale;
  if (type === "glow") return size * 0.42 * randomScale;
  return size * (0.24 + (1 - progress) * 0.26) * randomScale;
}

function getShipVfxFitScale(anchors, visual) {
  return Math.min(visual.width / anchors.assetWidth, visual.height / anchors.assetHeight);
}

function getShipVfxWorldPoint(anchors, visual, pose, localX, localY, pop = null) {
  const fitScale = getShipVfxFitScale(anchors, visual);
  const popScale = pop?.scale ?? 1;
  const offsetX = (localX - anchors.assetWidth / 2) * fitScale * popScale;
  const offsetY = (localY - anchors.assetHeight / 2) * fitScale * popScale;
  const cos = Math.cos(pose.angle);
  const sin = Math.sin(pose.angle);
  return {
    x: pose.x + (pop?.wobbleX ?? 0) + offsetX * cos - offsetY * sin,
    y: pose.y + (pop?.wobbleY ?? 0) + offsetX * sin + offsetY * cos
  };
}

function normalizeShipVfxLayer(layerName) {
  return shipVfxCanvasLayers.includes(layerName) ? layerName : "behind";
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function createShipEmitterSeed(engineId, emitterId, color) {
  let seed = 17;
  for (const character of `${engineId}:${emitterId}:${color}`) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }
  return seed || 1;
}

function getShipVisualAngle(shipId) {
  return shipVisualAngles.get(shipId) ?? 0;
}

function getBoardPointById(pointId) {
  return (boardLayout.points ?? []).find((point) => point.id === pointId) ?? null;
}

function getDistance(fromPoint, toPoint) {
  return Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
}

function getCubicBezierPoint(p0, p1, p2, p3, progress) {
  const inverse = 1 - progress;
  const inverse2 = inverse * inverse;
  const progress2 = progress * progress;
  return {
    x: inverse2 * inverse * p0.x + 3 * inverse2 * progress * p1.x + 3 * inverse * progress2 * p2.x + progress2 * progress * p3.x,
    y: inverse2 * inverse * p0.y + 3 * inverse2 * progress * p1.y + 3 * inverse * progress2 * p2.y + progress2 * progress * p3.y
  };
}

function getCubicBezierTangent(p0, p1, p2, p3, progress) {
  const inverse = 1 - progress;
  return {
    x: 3 * inverse * inverse * (p1.x - p0.x) + 6 * inverse * progress * (p2.x - p1.x) + 3 * progress * progress * (p3.x - p2.x),
    y: 3 * inverse * inverse * (p1.y - p0.y) + 6 * inverse * progress * (p2.y - p1.y) + 3 * progress * progress * (p3.y - p2.y)
  };
}

function lerpAngle(fromAngle, toAngle, progress) {
  const delta = Math.atan2(Math.sin(toAngle - fromAngle), Math.cos(toAngle - fromAngle));
  return fromAngle + delta * clamp01(progress);
}

function easeInOutCubic(value) {
  const progress = clamp01(value);
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - ((-2 * progress + 2) ** 3) / 2;
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

function getShipAssetPath(owner, ship) {
  return ship.type === "tradeShip"
    ? getTradeShipAssetPath(owner?.color, ship)
    : getPlayerShipAssetPath(owner?.color, ship);
}

function getShipVfxAnchorsForRender(owner, ship) {
  return ship.type === "tradeShip"
    ? getTradeShipVfxAnchors(owner?.color, ship)
    : getShipVfxAnchors(owner?.color, ship);
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
    ...getPlacedPlanetSystems()
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
    !isShipFlightAnimating(ship.id) &&
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
    !isShipFlightAnimating(ship.id) &&
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
  if (isShipFlightAnimating(selectedShip.id)) return null;
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
  if (
    !selectedShip ||
    isShipFlightAnimating(selectedShip.id) ||
    state.gameState?.phase !== "flight" ||
    !state.gameState.hasRolledFlightSpeed ||
    state.gameState?.activeEncounter
  ) {
    return new Map();
  }

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
    renderPlacementVfxDefs(),
    renderGridLayer(),
    renderLinksLayer(),
    renderSystemsLayer(),
    renderPointsLayer(),
    renderPlacementVfxLayer(),
    renderShipsLayer(),
    renderStructuresLayer(),
    renderOutpostsLayer()
  );
  return svg;
}

function renderPlacementVfxDefs() {
  const defs = createSvgElement("defs");
  const filter = createSvgElement("filter", {
    id: "placement-vfx-glow",
    x: "-120%",
    y: "-120%",
    width: "340%",
    height: "340%"
  });
  filter.append(
    createSvgElement("feGaussianBlur", {
      in: "SourceGraphic",
      stdDeviation: 5,
      result: "blur"
    }),
    createSvgElement("feColorMatrix", {
      in: "blur",
      type: "matrix",
      values: "0 0 0 0 0.45 0 0 0 0 0.86 0 0 0 0 1 0 0 0 1 0",
      result: "glow"
    }),
    createSvgElement("feMerge")
  );
  filter.querySelector("feMerge").append(
    createSvgElement("feMergeNode", { in: "glow" }),
    createSvgElement("feMergeNode", { in: "SourceGraphic" })
  );
  const coilFilter = createSvgElement("filter", {
    id: "ship-coil-glow",
    x: "-180%",
    y: "-180%",
    width: "460%",
    height: "460%"
  });
  coilFilter.append(
    createSvgElement("feGaussianBlur", {
      in: "SourceGraphic",
      stdDeviation: 2.4,
      result: "blur"
    }),
    createSvgElement("feMerge")
  );
  coilFilter.querySelector("feMerge").append(
    createSvgElement("feMergeNode", { in: "blur" }),
    createSvgElement("feMergeNode", { in: "SourceGraphic" })
  );
  defs.append(filter, coilFilter);
  return defs;
}

function renderPlacementVfxLayer() {
  const group = createSvgElement("g", {
    class: "placement-vfx-layer",
    "aria-hidden": "true"
  });
  const now = getPlacementVfxTime();

  for (const item of placementVfx.items) {
    const progress = clamp01((now - item.startTime) / placementVfxDuration);
    if (progress >= 1) continue;
    group.append(renderPlacementVfxItem(item, progress));
  }

  return group;
}

function renderPlacementVfxItem(item, progress) {
  const group = createSvgElement("g", {
    class: `placement-vfx placement-vfx--${item.objectType}`,
    "data-placement-vfx-id": item.id
  });
  const pulse = 1 + Math.sin(progress * Math.PI * 12) * 0.1;
  const coreOpacity = progress < 0.78 ? 1 - progress * 0.45 : Math.max(0, 1 - (progress - 0.78) / 0.12);
  const coreRadius = progress < 0.7
    ? 3 + easeOutCubic(progress / 0.7) * 19 * pulse
    : 18 + easeOutCubic((progress - 0.7) / 0.3) * 40;

  group.append(createSvgElement("circle", {
    class: "placement-vfx-glow",
    cx: item.x,
    cy: item.y,
    r: coreRadius * 1.7,
    opacity: coreOpacity * 0.42
  }));
  group.append(createSvgElement("circle", {
    class: "placement-vfx-core",
    cx: item.x,
    cy: item.y,
    r: coreRadius,
    opacity: coreOpacity
  }));

  if (progress >= 0.34 && progress <= 0.74) {
    renderPlacementLightning(group, item, progress);
    renderPlacementSparks(group, item, progress);
  }

  if (progress >= 0.68 && progress <= 0.9) {
    const flashProgress = clamp01((progress - 0.68) / 0.22);
    const flashOpacity = 1 - flashProgress;
    group.append(createSvgElement("circle", {
      class: "placement-vfx-flash",
      cx: item.x,
      cy: item.y,
      r: 16 + flashProgress * 66,
      opacity: flashOpacity
    }));
    group.append(createSvgElement("circle", {
      class: "placement-vfx-flash-ring",
      cx: item.x,
      cy: item.y,
      r: 10 + flashProgress * 76,
      opacity: flashOpacity
    }));
  }

  return group;
}

function renderPlacementLightning(group, item, progress) {
  const lightningProgress = clamp01((progress - 0.34) / 0.4);
  const fade = Math.sin(lightningProgress * Math.PI);
  const flicker = 0.55 + seededRandom(item.seed, Math.floor(progress * 46)) * 0.45;
  const armCount = 5 + Math.floor(seededRandom(item.seed, 1) * 3);

  for (let armIndex = 0; armIndex < armCount; armIndex += 1) {
    const angle = seededRandom(item.seed, armIndex + 3) * Math.PI * 2;
    const length = 20 + seededRandom(item.seed, armIndex + 11) * 42;
    const segmentCount = 3 + Math.floor(seededRandom(item.seed, armIndex + 21) * 3);
    const points = [[item.x, item.y]];

    for (let segmentIndex = 1; segmentIndex <= segmentCount; segmentIndex += 1) {
      const distance = (length * segmentIndex) / segmentCount;
      const jitter = (seededRandom(item.seed, armIndex * 17 + segmentIndex) - 0.5) * 18;
      const segmentAngle = angle + jitter * 0.02;
      points.push([
        item.x + Math.cos(segmentAngle) * distance,
        item.y + Math.sin(segmentAngle) * distance
      ]);
    }

    group.append(createSvgElement("polyline", {
      class: "placement-vfx-lightning",
      points: points.map(([x, y]) => `${x},${y}`).join(" "),
      opacity: fade * flicker
    }));
  }
}

function renderPlacementSparks(group, item, progress) {
  const sparkProgress = clamp01((progress - 0.34) / 0.4);
  const sparkCount = 14;

  for (let sparkIndex = 0; sparkIndex < sparkCount; sparkIndex += 1) {
    const angle = seededRandom(item.seed, sparkIndex + 40) * Math.PI * 2;
    const speed = 18 + seededRandom(item.seed, sparkIndex + 60) * 42;
    const distance = speed * sparkProgress;
    const radius = 1.2 + seededRandom(item.seed, sparkIndex + 80) * 1.8;
    group.append(createSvgElement("circle", {
      class: "placement-vfx-spark",
      cx: item.x + Math.cos(angle) * distance,
      cy: item.y + Math.sin(angle) * distance,
      r: radius,
      opacity: (1 - sparkProgress) * 0.85
    }));
  }
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

  return group;
}

function renderOutpostsLayer() {
  const group = createSvgElement("g", { class: "board-outposts-layer" });

  for (const outpost of [...getVisibleOutposts()].sort((left, right) => getOutpostRenderZ(left) - getOutpostRenderZ(right))) {
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
  const placement = getOutpostVisualPlacement(outpost, visual);
  enableBoardElementSelection(group, "outpost", outpost.id);
  group.append(createSvgElement("circle", {
    class: "outpost-hit-area",
    cx: placement.x,
    cy: placement.y,
    r: placement.hitRadius
  }));
  group.append(createSvgElement("image", {
    class: "outpost-image",
    href: getOutpostAssetPath(outpost.outpostType),
    x: placement.x - placement.width / 2,
    y: placement.y - placement.height / 2,
    width: placement.width,
    height: placement.height,
    transform: createPlacementTransform(placement.x, placement.y, placement.rotation, { opacity: 1, scale: 1, wobbleX: 0, wobbleY: 0 }),
    preserveAspectRatio: "xMidYMid meet"
  }));
  group.append(createSvgElement("circle", {
    class: "outpost-ring",
    cx: placement.x,
    cy: placement.y,
    r: placement.hitRadius
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
      const placement = getTradeStationVisualPlacement(structure, site, visual);
      structureGroup.append(createSvgElement("circle", {
        class: "trade-station-hit-area",
        cx: placement.x,
        cy: placement.y,
        r: placement.hitRadius
      }));
      structureGroup.append(createSvgElement("image", {
        class: `trade-station-image player-color-${ownerIndex}`,
        href: getTradeStationAssetPath(owner?.color),
        x: placement.x - placement.width / 2,
        y: placement.y - placement.height / 2,
        width: placement.width,
        height: placement.height,
        transform: createPlacementTransform(placement.x, placement.y, placement.rotation, { opacity: 1, scale: 1, wobbleX: 0, wobbleY: 0 }),
        preserveAspectRatio: "xMidYMid meet"
      }));
    } else if (structure.type === "spaceport") {
      const visual = playerPieceVisualDefaults.spaceport;
      const placement = getStructureVisualPlacement(structure, site, visual);
      const pop = getPlacementAssetPop("structure", structure.id);
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
        opacity: pop.opacity,
        transform: createPlacementTransform(placement.x, placement.y, placement.rotation, pop),
        preserveAspectRatio: "xMidYMid meet"
      }));
    } else {
      const visual = playerPieceVisualDefaults.colony;
      const placement = getStructureVisualPlacement(structure, site, visual);
      const pop = getPlacementAssetPop("structure", structure.id);
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
        opacity: pop.opacity,
        transform: createPlacementTransform(placement.x, placement.y, placement.rotation, pop),
        preserveAspectRatio: "xMidYMid meet"
      }));
    }

    group.append(structureGroup);
  }

  return group;
}

function renderShipCoilVfx(owner, ship, anchors, pose, pop) {
  const coilState = getShipCoilVfxState(ship);
  if (!coilState.visible || !anchors?.coils?.length) return null;

  const group = createSvgElement("g", {
    class: `ship-coil-vfx${coilState.active ? " ship-coil-vfx--active" : ""}`,
    "aria-hidden": "true"
  });
  const color = getShipVfxColor(owner?.color);
  const visual = playerPieceVisualDefaults.ship;
  const time = getShipVfxTime();

  anchors.coils.forEach((coil, index) => {
    const point = getShipVfxWorldPoint(anchors, visual, pose, coil.x, coil.y, pop);
    const pulse = coilState.active
      ? 0.88 + Math.sin(time / 210 + index * 0.9) * 0.24
      : 0.48;
    const opacity = coilState.opacity * pulse;
    const radius = (coilState.active ? 4.8 : 3.0) * (0.94 + pulse * 0.24);
    group.append(
      createSvgElement("circle", {
        class: "ship-coil-vfx__halo ship-coil-vfx__halo--outer",
        cx: point.x,
        cy: point.y,
        r: radius * 4.2,
        fill: color,
        opacity: opacity * 0.14,
        filter: "url(#ship-coil-glow)"
      }),
      createSvgElement("circle", {
        class: "ship-coil-vfx__halo ship-coil-vfx__halo--middle",
        cx: point.x,
        cy: point.y,
        r: radius * 2.2,
        fill: color,
        opacity: opacity * 0.34,
        filter: "url(#ship-coil-glow)"
      }),
      createSvgElement("circle", {
        class: "ship-coil-vfx__core",
        cx: point.x,
        cy: point.y,
        r: radius * 0.55,
        fill: color,
        opacity: opacity * 0.78,
        filter: "url(#ship-coil-glow)"
      })
    );
  });

  return group;
}

function getShipCoilVfxState(ship) {
  const activePlayer = getActivePlayer();
  const relevantFlightPhase = state.gameState?.phase === "flight"
    && state.gameState.hasRolledFlightSpeed
    && !state.gameState.activeEncounter;
  const isActivePlayerShip = ship.ownerPlayerId === activePlayer?.id;
  const isFlying = isShipFlightAnimating(ship.id);
  if (isFlying) return { visible: true, active: true, opacity: 0.95 };
  if (relevantFlightPhase && isActivePlayerShip) {
    const hasMovementLeft = getShipRemainingMovement(ship.id) > 0;
    return {
      visible: true,
      active: hasMovementLeft,
      opacity: hasMovementLeft ? 0.82 : 0.2
    };
  }
  return { visible: true, active: false, opacity: 0.12 };
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
    const pop = getPlacementAssetPop("ship", ship.id);
    const pose = getShipRenderPose(ship, point);
    const anchors = getShipVfxAnchorsForRender(owner, ship);
    const transform = [
      createPlacementTransform(pose.x, pose.y, 0, pop),
      `rotate(${(pose.angle * 180) / Math.PI} ${pose.x} ${pose.y})`
    ].filter(Boolean).join(" ");
    shipGroup.append(createSvgElement("circle", {
      class: "ship-hit-area",
      cx: pose.x,
      cy: pose.y,
      r: visual.hitRadius
    }));
    shipGroup.append(createSvgElement("image", {
      class: `ship-image player-color-${ownerIndex}`,
      href: getShipAssetPath(owner, ship),
      x: pose.x - visual.width / 2,
      y: pose.y - visual.height / 2,
      width: visual.width,
      height: visual.height,
      opacity: pop.opacity,
      transform,
      preserveAspectRatio: "xMidYMid meet"
    }));
    const coilVfx = renderShipCoilVfx(owner, ship, anchors, pose, pop);
    if (coilVfx) shipGroup.append(coilVfx);
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

  const languageSection = document.createElement("section");
  languageSection.className = "settings-language";
  const languageTitle = document.createElement("strong");
  languageTitle.textContent = t("language");
  languageSection.append(languageTitle, renderLanguageToggle());

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  actions.append(
    createButton(t("save"), () => openModal("save"), "menu-button"),
    createButton(t("loadGame"), () => openModal("load"), "menu-button"),
    createButton(t("backToMenu"), confirmBackToMenu, "secondary-button"),
    createButton(t("close"), closeModal, "secondary-button")
  );

  wrapper.append(title, modalNotice, languageSection, actions);
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
    playerSetup: renderPlayerSetup,
    players: renderPlayerSelect
  };

  const renderedView = (views[state.view] ?? renderMenu)();
  const renderedModal = renderModal();

  app.replaceChildren(...[renderedView, renderedModal].filter(Boolean));
  drawShipEngineVfxOverlays();
  syncShipVfxLoop();
}

render();
