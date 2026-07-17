import { boardLayout } from "./data/boardLayout.js";
import {
  assetLoadStates,
  assetManager,
  collectAssetUrls,
  selectAssetUrlsForColors
} from "./asset-preloader.js";
import { appSoundIds, audioManager, gameplaySoundIds, soundDefinitions } from "./audio-manager.js";
import { animationScheduler } from "./animation-scheduler.js";
import { buildActionDefinitions, resourceTypes, upgradeDefinitions } from "./data/buildCosts.js";
import { getEncounterCardById } from "./data/encounterCards.js";
import {
  factoryAssetPaths,
  factoryBlueprintAssetPaths,
  getFactoryAssetPath,
  getFactoryBlueprintAssetPath
} from "./data/factoryVisuals.js";
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
  outpostAssetPaths,
  tradeStationAssetPaths,
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
  getBattleShipAssetPath,
  getTradeShipAssetPath,
  battleShipAssetPaths,
  colonyShipAssetPaths,
  tradeShipAssetPaths,
  playerColonyAssetPaths,
  playerSpaceportAssetPaths,
  playerPieceColors,
  playerPieceVisualDefaults
} from "./data/playerPieceVisuals.js";
import { getBattleShipVfxAnchors, getShipEngineTemplate, getShipVfxAnchors, getTradeShipVfxAnchors } from "./data/shipVfxData.js";
import { MOTHERSHIP_SPEED_ANIMATION_CONFIG } from "./data/mothershipSpeedAnimationConfig.js";
import {
  gameVariants,
  getSupernovaLocalizedTitle,
  supernovaFactoryLimitPerPlayer,
  supernovaFactoryTypes,
  supernovaMissionCounts
} from "./data/supernova.js";
import { menuButtonDefinitions } from "./menu-button-utils.js";
import { getPlayerGrammarParams, normalizePlayerGender, playerGenders } from "./player-profile.js";
import {
  applyDebugLayoutTransform,
  getStructureVisualPosition,
  structureVisualReferenceLayouts
} from "./data/structureVisualLayouts.js";
import { mothershipUpgradeSlots, upgradeMenuAssetPaths, upgradeMenuOrder } from "./data/upgradeVisuals.js";
import {
  advanceToFlightPhase,
  beginSupernovaFactoryPlacement,
  buildSupernovaFactory,
  buildShip,
  buyUpgrade,
  canFoundColonyWithShip as canFoundColonyInGame,
  canFoundTradeStationWithShip as canFoundTradeStationInGame,
  canDrawSupply,
  cancelPendingFactoryPlacement,
  cancelPendingShipPlacement,
  cancelPendingSpaceportUpgrade,
  cancelPendingTradeStationPlacement,
  cancelTradeOffer,
  confirmPendingTradeStationPlacement,
  confirmPendingSpaceportUpgrade,
  completeSupernovaShipBattleReveal,
  completeShipExploration,
  createTradeOffer,
  createGameState,
  currentGameStorageKey,
  calculateVictoryPoints,
  determineFlightSpeed,
  drawSupply,
  distributeSevenSupply,
  endCurrentTurn,
  finishSupernovaShipBattle,
  finishEncounter,
  foundColony,
  foundTradeStation,
  getCargoValueForPlayer,
  getBuildableSupernovaFactoryOptions,
  getEffectiveUpgradeValue,
  getAvailableBoardActions,
  getFriendshipUpgradeBonus,
  getRealUpgradeValue,
  getReachableNodes,
  getSupernovaMissionsForPlayer,
  getShipDestinationState,
  getSupplyDrawCount as getGameSupplyDrawCount,
  getTradeRatesForPlayer,
  isSupernovaGame,
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
  submitSupernovaShipBattleRoll,
  resolveSevenSteal,
  rollProduction,
  rollPlacementStart,
  selectPendingFriendshipCard,
  setSevenStealTarget,
  startPendingFlightEncounter,
  startPendingSpaceportUpgrade,
  submitSevenDiscard,
  touchGameState,
  tradeWithSupply,
  updateSevenDiscardSelection,
  updateEncounterResourceSelection,
  chooseSupernovaShipBattleUpgrade,
  useBoughtFame,
  useRichHelpsPoor,
} from "./game/gameState.js";
import { defaultLanguage, getText, languages } from "./i18n.js";
import { createControllerStatesByPlayerId } from "./remote/controllerState.js";
import {
  createSaveBackup,
  getSaveBackupFilename,
  parseSaveBackup,
  saveBackupErrorCodes,
  saveBackupMaxBytes
} from "./save-portability.js";

const languageStorageKey = "star-odyssey-language";
const savesStorageKey = "star-odyssey-saves";
const autosaveStorageKey = "starOdyssey.autosave.v1";
const autosaveVersion = 1;
const controllerSessionStorageKey = "star-odyssey-controller-session";
const controllerAccessStoragePrefix = "star-odyssey-controller-access-v1";
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
const boardBackgroundAssetPath = "./assets/backgrounds/space-background-4k.png";
const mainMenuAssetPaths = {
  background: "./public/assets/ui/backgrounds/star-odyssey-menu-hero-4k.webp",
  interfaceBackground: "./public/assets/ui/backgrounds/star-odyssey-interface-4k.webp",
  frame: "./public/assets/ui/frames/star-odyssey-frame-ornate-4k.webp",
  compass: "./public/assets/ui/brand/star-odyssey-compass.png",
  buttonPlate: "./public/assets/ui/buttons/star-odyssey-button-plate.png",
};
const boardPointsById = new Map((boardLayout.points ?? []).map((point) => [point.id, point]));
const boardHexesById = new Map((boardLayout.hexes ?? boardLayout.spaceQuadrants ?? []).map((hex) => [hex.id, hex]));
const boardConnections = boardLayout.connections ?? boardLayout.links.map(([from, to], index) => ({
  id: `connection-${index + 1}`,
  from,
  to
}));
const staticBoardLayerTemplates = new Map();
const runtimePerformanceMetrics = {
  appRenders: 0,
  boardSvgBuilds: 0,
  staticBoardLayerBuilds: 0,
  remoteBoardFallbackBuilds: 0,
  placementAnimationFrames: 0,
  controllerStatePublications: 0,
  animation: animationScheduler.stats
};
globalThis.__starOdysseyPerformance = runtimePerformanceMetrics;
const startupLoader = document.querySelector("#app-startup-loader");
const startupProgressFill = document.querySelector("#app-startup-progress-fill");
const startupProgressText = document.querySelector("#app-startup-progress-text");
const startupError = document.querySelector("#app-startup-error");
const startupRetryButton = document.querySelector("#app-startup-retry");
let appAssetsReady = false;
let appAssetsStatus = assetLoadStates.idle;
let gameAssetsReady = false;
let gameAssetsStatus = assetLoadStates.idle;
let gameAssetsPreloadPromise = null;
let gameAssetsPreloadRevision = 0;
let gameAssetsPreloadRequestKey = "";
let preparedControllerGameState = null;
let preparedControllerGameKey = "";
let controllerGamePreparationRevision = 0;
let controllerGamePreparationStatus = assetLoadStates.idle;
let controllerGamePreparationError = null;
let controllerAutoStartTimer = null;
let controllerAutoStartPending = false;
let applicationBootRevision = 0;
let applicationStarted = false;
let remoteFocusIndex = 0;
let remoteFocusContext = "";
let remoteFocusKey = "";

const initialLanguage = loadLanguage();
const startupAutosaveReset = consumeAutosaveResetUrlParam();
const initialGame = loadInitialGameState(initialLanguage);
let previousAudioGamePhase = initialGame.gameState?.phase ?? null;
let previousAudioEncounterCardId = initialGame.gameState?.activeEncounter?.cardId ?? null;
let lastAudioFocusElement = null;
let lastAudioFocusAt = 0;
const DRIVE_COMPARISON_PREVIEW_MS = 2000;
const SUPERNOVA_BATTLE_REVEAL_MS = 3200;

const state = {
  language: initialGame.language,
  view: initialGame.gameState ? "board" : "menu",
  selectedPlayers: initialGame.gameState?.playerCount ?? null,
  selectedGameVariant: initialGame.gameState?.gameVariant ?? gameVariants.classic,
  selectedSupernovaMissionCount: initialGame.gameState?.supernova?.missionCount ?? supernovaMissionCounts.standard,
  playerSetup: [],
  gameState: initialGame.gameState,
  tradeFromResource: "ore",
  tradeToResource: "food",
  tradeOfferTargetPlayerId: null,
  tradeOfferedResources: createEmptyResourceSelection(),
  tradeRequestedResources: createEmptyResourceSelection(),
  modal: initialGame.fromAutosave && initialGame.controllerMode && initialGame.gameState ? "controllers" : null,
  hudPlayerId: null,
  hudTab: "turn",
  hudScrollPositions: {},
  encounterBoardSelectionActive: false,
  notice: startupAutosaveReset
    ? (initialGame.language === "de" ? "Autosave verworfen." : "Autosave discarded.")
    : initialGame.fromAutosave ? (initialGame.language === "de" ? "Autosave geladen." : "Autosave loaded.") : "",
  controllerMode: initialGame.controllerMode,
  controllerLobby: initialGame.fromAutosave && initialGame.controllerMode && initialGame.gameState
    ? createControllerReconnectLobby(initialGame.gameState)
    : null,
  loadingProgress: 0,
  driveComparisonPreviewKey: null,
  driveComparisonPreviewStartedAt: 0,
  singleMothershipRollAnimationKey: null,
  supernovaBattleRevealKey: null
};

const controllerSessionId = loadOrCreateControllerSessionId();
const remoteHost = {
  sessionId: controllerSessionId,
  controllerTokensByPlayerId: loadControllerAccessTokens(controllerSessionId),
  socket: null,
  localChannel: null,
  localTransport: "",
  localControllers: new Map(),
  connected: false,
  controllerCount: 0,
  controllerSlots: [],
  reconnectTimer: null,
  lastStateJson: "",
  lastAccessJson: ""
};

const controllerReconnectMs = 1600;
const localControllerStoragePrefix = "star-odyssey-controller-channel";
let autosaveTimer = null;
let storageRetryTimer = null;
let storageStatusRenderFrame = null;
let pendingManualSaves = null;
const storageWriteFailures = new Set();
const storageRetryDelayMs = 5000;

const placementVfxDuration = 1650;
const placementVfx = {
  items: [],
  currentTime: 0,
  nextId: 1
};
const placementAnimationId = "placement-vfx";
const diceAnimationId = "dice-roll";
const mothershipAnimationId = "mothership-speed";
const shipFlightAnimationId = "ship-flight";
const shipVfxAnimationId = "ship-vfx";
const DICE_RESULT_HOLD_MS = 1100;
const DICE_RESULT_FADE_MS = 320;
const PRODUCTION_HIGHLIGHT_MS = 1500;
const PRODUCTION_CHIP_PULSE_MS = 1050;
const PRODUCTION_TRAIL_MS = 1250;
const PRODUCTION_TARGET_PULSE_MS = 980;
const PRODUCTION_LABEL_MS = 1150;
const PRODUCTION_STAGGER_MS = 1150;
const PRODUCTION_WRAPUP_MS = 650;
const PRODUCTION_MAX_STAGGER_STEPS = 2;
const PRODUCTION_CHIP_DELAY_MS = 120;
const PRODUCTION_TRAIL_DELAY_MS = 420;
const PRODUCTION_TARGET_DELAY_MS = 620;
const PRODUCTION_LABEL_DELAY_MS = 720;
const PRODUCTION_EVENT_TOTAL_MS = Math.max(
  PRODUCTION_HIGHLIGHT_MS,
  PRODUCTION_CHIP_DELAY_MS + PRODUCTION_CHIP_PULSE_MS,
  PRODUCTION_TRAIL_DELAY_MS + PRODUCTION_TRAIL_MS,
  PRODUCTION_TRAIL_DELAY_MS + PRODUCTION_TARGET_DELAY_MS + PRODUCTION_TARGET_PULSE_MS,
  PRODUCTION_TRAIL_DELAY_MS + PRODUCTION_LABEL_DELAY_MS + PRODUCTION_LABEL_MS
);
const productionVfx = {
  items: [],
  resourceFlashes: [],
  timeoutId: null,
  nextId: 1
};
const productionResourceColors = {
  ore: "#ef4444",
  fuel: "#facc15",
  carbon: "#38bdf8",
  food: "#22c55e",
  goods: "#c084fc"
};
const planetRenderFallbackOffsets = [
  { x: -42, y: 34 },
  { x: 0, y: -38 },
  { x: 45, y: 35 }
];
const shipFlightAnimation = {
  items: [],
  currentTime: 0
};
const shipEngineTrailDuration = 1250;
const shipEngineTrails = [];
const shipWeaponBurstDuration = 1100;
const shipWeaponBursts = [];
const shipVfxCanvasLayers = ["behind", "inline", "front"];
const shipVfxAnimation = {
  currentTime: 0
};
const diceRollAnimation = {
  item: null,
  currentTime: 0
};
const mothershipSpeedAnimation = {
  item: null,
  currentTime: 0
};
const MOTHERSHIP_SPEED_APPEAR_MS = 160;
const MOTHERSHIP_SPEED_SHAKE_MS = 620;
const MOTHERSHIP_SPEED_REVEAL_MS = MOTHERSHIP_SPEED_ANIMATION_CONFIG.balls.slideDurationMs;
const MOTHERSHIP_SPEED_HOLD_MS = 1200;
const MOTHERSHIP_SPEED_FADE_MS = 260;
const MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES = 1;
const MOTHERSHIP_SPEED_MAX_SHAKE_CYCLES = 2;
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

function consumeAutosaveResetUrlParam() {
  const url = new URL(window.location.href);
  const resetKeys = ["resetAutosave", "reset", "newGame"];
  const shouldResetAutosave = resetKeys.some((key) => url.searchParams.get(key) === "1");
  if (!shouldResetAutosave) return false;

  clearStoredAutosaveState();

  resetKeys.forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
}

function clearStoredAutosaveState() {
  try {
    localStorage.removeItem(autosaveStorageKey);
    localStorage.removeItem(currentGameStorageKey);
  } catch {
    // ignore storage cleanup failures
  }
}

function repairLoadedGameState(gameState) {
  if (!gameState?.activeEncounter) return gameState;

  const card = getEncounterCardById(gameState.activeEncounter.cardId);
  const pendingStep = gameState.activeEncounter.pendingStep;
  const hasChoices = Array.isArray(card?.choices) && card.choices.length > 0;
  const canFinish = gameState.activeEncounter.status === "resolved";
  if (card && (pendingStep || hasChoices || canFinish)) return gameState;

  return touchGameState({
    ...gameState,
    activeEncounter: null,
    encounterStep: null,
    encounterTriggered: false,
    pendingFlightEncounter: null
  });
}

function loadCurrentGameState() {
  try {
    const parsedGameState = JSON.parse(localStorage.getItem(currentGameStorageKey) ?? "null");
    if (!parsedGameState) return null;

    return repairLoadedGameState(normalizeGameState(parsedGameState, {
      language: parsedGameState.language || loadLanguage(),
      playerCount: parsedGameState.playerCount || 3,
      boardLayout
    }));
  } catch {
    return null;
  }
}

function loadInitialGameState(fallbackLanguage = defaultLanguage) {
  const autosave = loadAutosaveGameState(fallbackLanguage);
  if (autosave.gameState) {
    return {
      gameState: autosave.gameState,
      language: languages.includes(autosave.gameState.language) ? autosave.gameState.language : fallbackLanguage,
      fromAutosave: true,
      controllerMode: autosave.controllerMode
    };
  }

  const currentGameState = loadCurrentGameState();
  return {
    gameState: currentGameState,
    language: languages.includes(currentGameState?.language) ? currentGameState.language : fallbackLanguage,
    fromAutosave: false,
    controllerMode: false
  };
}

function loadAutosaveGameState(fallbackLanguage = defaultLanguage) {
  try {
    const parsedAutosave = JSON.parse(localStorage.getItem(autosaveStorageKey) ?? "null");
    if (!parsedAutosave || parsedAutosave.version !== autosaveVersion || !parsedAutosave.gameState) {
      return { gameState: null, controllerMode: false };
    }

    return {
      gameState: repairLoadedGameState(normalizeGameState(parsedAutosave.gameState, {
        language: parsedAutosave.gameState.language || parsedAutosave.language || fallbackLanguage,
        playerCount: parsedAutosave.gameState.playerCount || 3,
        boardLayout
      })),
      controllerMode: Boolean(parsedAutosave.controllerMode)
    };
  } catch {
    return { gameState: null, controllerMode: false };
  }
}

function saveCurrentGameState() {
  if (!state.gameState) return true;

  try {
    localStorage.setItem(currentGameStorageKey, JSON.stringify(state.gameState));
    clearStorageWriteFailure("currentGame");
  } catch {
    recordStorageWriteFailure("currentGame");
    scheduleStorageRetry();
    scheduleAutosave();
    return false;
  }
  scheduleAutosave();
  return true;
}

function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(writeAutosaveNow, 250);
}

function writeAutosaveNow() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  if (!state.gameState || state.view !== "board") return true;

  try {
    localStorage.setItem(autosaveStorageKey, JSON.stringify({
      version: autosaveVersion,
      savedAt: new Date().toISOString(),
      language: state.language,
      view: "board",
      controllerMode: state.controllerMode,
      gameState: state.gameState
    }));
    clearStorageWriteFailure("autosave");
    return true;
  } catch {
    recordStorageWriteFailure("autosave");
    scheduleStorageRetry();
    return false;
  }
}

function recordStorageWriteFailure(scope) {
  const wasEmpty = storageWriteFailures.size === 0;
  storageWriteFailures.add(scope);
  if (wasEmpty) queueStorageStatusRender();
}

function clearStorageWriteFailure(scope) {
  if (!storageWriteFailures.delete(scope)) return;
  queueStorageStatusRender();
}

function queueStorageStatusRender() {
  if (storageStatusRenderFrame || document.visibilityState === "hidden") return;
  storageStatusRenderFrame = requestAnimationFrame(() => {
    storageStatusRenderFrame = null;
    render();
  });
}

function scheduleStorageRetry() {
  if (storageRetryTimer) return;
  storageRetryTimer = setTimeout(() => {
    storageRetryTimer = null;
    retryStorageWrites();
  }, storageRetryDelayMs);
}

function retryStorageWrites() {
  const hadFailures = storageWriteFailures.size > 0;

  if (storageWriteFailures.has("manualSave") && pendingManualSaves) {
    writeSaves(pendingManualSaves);
  }
  if (storageWriteFailures.has("currentGame")) {
    saveCurrentGameState();
  }
  if (storageWriteFailures.has("autosave")) {
    writeAutosaveNow();
  }

  if (storageWriteFailures.size > 0) {
    scheduleStorageRetry();
    return false;
  }

  if (hadFailures) {
    state.notice = t("storageWriteRestored");
    queueStorageStatusRender();
  }
  return true;
}

function clearAutosave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  clearStoredAutosaveState();
}

function loadOrCreateControllerSessionId() {
  try {
    const existingSessionId = localStorage.getItem(controllerSessionStorageKey)
      || sessionStorage.getItem(controllerSessionStorageKey);
    if (existingSessionId) {
      localStorage.setItem(controllerSessionStorageKey, existingSessionId);
      sessionStorage.setItem(controllerSessionStorageKey, existingSessionId);
      return existingSessionId;
    }
    const nextSessionId = Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem(controllerSessionStorageKey, nextSessionId);
    sessionStorage.setItem(controllerSessionStorageKey, nextSessionId);
    return nextSessionId;
  } catch {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}

function getControllerAccessStorageKey(sessionId = "") {
  return `${controllerAccessStoragePrefix}:${sessionId || controllerSessionId}`;
}

function loadControllerAccessTokens(sessionId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getControllerAccessStorageKey(sessionId)) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([playerId, token]) => (
      /^player-\d+$/.test(playerId)
      && typeof token === "string"
      && token.length >= 16
    )));
  } catch {
    return {};
  }
}

function saveControllerAccessTokens() {
  try {
    localStorage.setItem(
      getControllerAccessStorageKey(remoteHost.sessionId),
      JSON.stringify(remoteHost.controllerTokensByPlayerId)
    );
  } catch {
    // Controller URLs still work for the current page when persistent storage is unavailable.
  }
}

function createControllerAccessToken() {
  try {
    const bytes = new Uint8Array(24);
    globalThis.crypto.getRandomValues(bytes);
    return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }
}

function getControllerAccessPlayerIds() {
  const lobbyPlayerIds = (state.controllerLobby?.slots ?? []).map((slot) => slot.playerId).filter(Boolean);
  if (lobbyPlayerIds.length > 0) return lobbyPlayerIds;
  const gamePlayerIds = (state.gameState?.players ?? []).map((player) => player.id).filter(Boolean);
  if (gamePlayerIds.length > 0) return gamePlayerIds;
  return [];
}

function ensureControllerAccessTokens(playerIds = getControllerAccessPlayerIds()) {
  const allowedPlayerIds = new Set(playerIds);
  let changed = false;
  for (const playerId of Object.keys(remoteHost.controllerTokensByPlayerId)) {
    if (allowedPlayerIds.has(playerId)) continue;
    delete remoteHost.controllerTokensByPlayerId[playerId];
    changed = true;
  }
  for (const playerId of playerIds) {
    if (remoteHost.controllerTokensByPlayerId[playerId]) continue;
    remoteHost.controllerTokensByPlayerId[playerId] = createControllerAccessToken();
    changed = true;
  }
  if (changed) saveControllerAccessTokens();
  return { ...remoteHost.controllerTokensByPlayerId };
}

function replaceControllerAccessTokens(playerIds) {
  remoteHost.controllerTokensByPlayerId = Object.fromEntries(
    playerIds.map((playerId) => [playerId, createControllerAccessToken()])
  );
  saveControllerAccessTokens();
  revokeInvalidLocalControllers();
  syncRemoteControllerAccess({ force: true });
}

function syncRemoteControllerAccess({ force = false } = {}) {
  const controllerTokensByPlayerId = ensureControllerAccessTokens();
  const accessJson = JSON.stringify(controllerTokensByPlayerId);
  if (
    remoteHost.socket?.readyState === 1
    && (force || accessJson !== remoteHost.lastAccessJson)
  ) {
    remoteHost.socket.send(JSON.stringify({
      type: "controllerAccess",
      sessionId: remoteHost.sessionId,
      controllerTokensByPlayerId
    }));
    remoteHost.lastAccessJson = accessJson;
  }
}

function getControllerUrl(playerId = null) {
  const url = new URL("controller.html", document.baseURI);
  url.searchParams.set("session", remoteHost.sessionId);
  if (playerId) {
    const playerIds = [...new Set([...getControllerAccessPlayerIds(), playerId])];
    ensureControllerAccessTokens(playerIds);
    url.searchParams.set("player", getControllerSlotNumber(playerId));
    url.searchParams.set("token", remoteHost.controllerTokensByPlayerId[playerId]);
  }
  return url.toString();
}

function getControllerSlotNumber(playerId) {
  const match = String(playerId).match(/^player-(\d+)$/);
  return match ? match[1] : String(playerId);
}

function getQrCodeUrl(text) {
  const url = new URL("api/qr", document.baseURI);
  url.searchParams.set("text", text);
  return url.toString();
}

function getSelectedGameAssetColors() {
  const colors = state.controllerLobby?.slots?.map((slot) => slot.color)
    ?? state.gameState?.players?.map((player) => player.color)
    ?? state.playerSetup?.map((player) => player.color)
    ?? [];
  return [...new Set(colors.filter((color) => playerPieceColors.includes(color)))];
}

function getPreloadGameVariant() {
  return state.controllerLobby?.gameVariant
    ?? state.gameState?.gameVariant
    ?? state.selectedGameVariant
    ?? gameVariants.classic;
}

function getAppAssetUrls() {
  return [...new Set(collectAssetUrls([
    mainMenuAssetPaths,
    menuButtonDefinitions.map((definition) => definition.icon)
  ]).filter(Boolean))];
}

function getGameAssetUrls() {
  return [...new Set(getGameAssetGroups().flatMap((group) => group.required))];
}

function getGameAssetGroups() {
  const selectedColors = getSelectedGameAssetColors();
  const isSupernova = getPreloadGameVariant() === gameVariants.supernova;
  const playerAssets = [
    selectAssetUrlsForColors(colonyShipAssetPaths, selectedColors),
    selectAssetUrlsForColors(tradeShipAssetPaths, selectedColors),
    selectAssetUrlsForColors(playerColonyAssetPaths, selectedColors),
    selectAssetUrlsForColors(playerSpaceportAssetPaths, selectedColors),
    selectAssetUrlsForColors(tradeStationAssetPaths, selectedColors),
    // The three-player setup always renders neutral yellow starting structures.
    state.controllerLobby?.playerCount === 3 || state.gameState?.playerCount === 3 || state.selectedPlayers === 3
      ? [playerColonyAssetPaths.yellow, playerSpaceportAssetPaths.yellow]
      : []
  ];
  const supernovaAssets = [];
  if (isSupernova) {
    supernovaAssets.push(selectAssetUrlsForColors(battleShipAssetPaths, selectedColors));
    supernovaAssets.push(Object.values(factoryAssetPaths).map((assets) => selectAssetUrlsForColors(assets, selectedColors)));
  }
  const upgradeAssets = collectAssetUrls(upgradeMenuAssetPaths)
    .filter((url) => isSupernova || url !== upgradeMenuAssetPaths.buildBlueprints.battleShip);

  return [
    {
      id: "board-core",
      required: [...new Set(collectAssetUrls([
        boardBackgroundAssetPath,
        planetAssetPaths,
        outpostAssetPaths
      ]).filter(Boolean))]
    },
    {
      id: "player-pieces",
      required: [...new Set(collectAssetUrls(playerAssets).filter(Boolean))]
    },
    {
      id: "build-ui",
      required: [...new Set(collectAssetUrls([
        upgradeAssets,
        isSupernova ? factoryBlueprintAssetPaths : null
      ]).filter(Boolean))]
    },
    {
      id: "supernova",
      required: [...new Set(collectAssetUrls(supernovaAssets).filter(Boolean))]
    }
  ];
}

function isAssetPreloadComplete(url) {
  return assetManager.isReady(url);
}

async function preloadAppAssets({ onProgress = null, retry = false } = {}) {
  if (appAssetsReady && !retry) {
    onProgress?.(1);
    return assetManager.getGroupStatus("app-shell");
  }

  appAssetsStatus = assetLoadStates.loading;
  let fontReady = !document.fonts?.ready;
  let assetProgress = 0;
  let audioProgress = 0;
  const reportProgress = () => {
    const progress = assetProgress * 0.88 + audioProgress * 0.06 + (fontReady ? 0.06 : 0);
    onProgress?.(Math.min(1, progress));
  };
  reportProgress();

  try {
    const [group] = await Promise.all([
      assetManager.preloadGroup("app-shell", {
        required: getAppAssetUrls()
      }, {
        retry,
        onProgress: (snapshot) => {
          assetProgress = snapshot.progress;
          reportProgress();
        }
      }),
      Promise.resolve(document.fonts?.ready).then(() => {
        fontReady = true;
        reportProgress();
      }),
      audioManager.preload(appSoundIds, {
        retry,
        onProgress: (snapshot) => {
          audioProgress = snapshot.progress;
          reportProgress();
        }
      })
    ]);
    appAssetsReady = true;
    appAssetsStatus = assetLoadStates.ready;
    onProgress?.(1);
    return group;
  } catch (error) {
    appAssetsReady = false;
    appAssetsStatus = assetLoadStates.error;
    throw error;
  }
}

async function preloadGameAssets({ onProgress = null, retry = false } = {}) {
  const initialGroups = getGameAssetGroups();
  const initialUrls = initialGroups.flatMap((group) => group.required);
  const requestKey = initialGroups
    .map((group) => `${group.id}:${group.required.join("|")}`)
    .concat(`audio:${gameplaySoundIds.map((id) => soundDefinitions[id]?.src ?? id).join("|")}`)
    .join("\n");
  if (gameAssetsStatus === "loading" && requestKey === gameAssetsPreloadRequestKey) {
    onProgress?.(state.loadingProgress ?? 0);
    return gameAssetsPreloadPromise;
  }
  if (initialUrls.every(isAssetPreloadComplete) && audioManager.areSettled(gameplaySoundIds)) {
    gameAssetsPreloadRevision += 1;
    gameAssetsReady = true;
    gameAssetsStatus = assetLoadStates.ready;
    onProgress?.(1);
    return assetManager.getGroupStatus("game-runtime");
  }

  const revision = ++gameAssetsPreloadRevision;
  gameAssetsPreloadRequestKey = requestKey;
  gameAssetsReady = false;
  gameAssetsStatus = assetLoadStates.loading;
  const preloadPromise = (async () => {
    try {
      const progressByGroup = new Map(initialGroups.map((group) => [group.id, {
        completed: group.required.filter(isAssetPreloadComplete).length,
        total: group.required.length
      }]));
      progressByGroup.set("audio", {
        completed: gameplaySoundIds.filter((id) => audioManager.isSettled(id)).length,
        total: gameplaySoundIds.length
      });
      const reportProgress = () => {
        if (revision !== gameAssetsPreloadRevision) return;
        const totals = [...progressByGroup.values()];
        const total = totals.reduce((sum, entry) => sum + entry.total, 0);
        const completed = totals.reduce((sum, entry) => sum + entry.completed, 0);
        onProgress?.(total === 0 ? 1 : completed / total);
      };
      reportProgress();

      const [groups, audioResult] = await Promise.all([
        Promise.all(initialGroups.map((group) => assetManager.preloadGroup(
          `game-${group.id}`,
          { required: group.required },
          {
            retry,
            onProgress: (snapshot) => {
              progressByGroup.set(group.id, {
                completed: snapshot.completed,
                total: snapshot.total
              });
              reportProgress();
            }
          }
        ))),
        audioManager.preload(gameplaySoundIds, {
          retry,
          onProgress: (snapshot) => {
            progressByGroup.set("audio", {
              completed: snapshot.completed,
              total: snapshot.total
            });
            reportProgress();
          }
        })
      ]);
      if (revision === gameAssetsPreloadRevision) {
        gameAssetsReady = initialUrls.every(isAssetPreloadComplete) && audioManager.areSettled(gameplaySoundIds);
        gameAssetsStatus = gameAssetsReady ? assetLoadStates.ready : assetLoadStates.error;
        onProgress?.(gameAssetsReady ? 1 : state.loadingProgress ?? 0);
      }
      return [...groups, audioResult];
    } catch (error) {
      if (revision === gameAssetsPreloadRevision) {
        gameAssetsReady = false;
        gameAssetsStatus = assetLoadStates.error;
      }
      throw error;
    }
  })();
  gameAssetsPreloadPromise = preloadPromise;
  return preloadPromise;
}

function updateStartupLoader(progress) {
  const normalized = Math.max(0, Math.min(1, Number(progress) || 0));
  const percent = Math.round(normalized * 100);
  if (startupProgressFill) startupProgressFill.style.width = `${percent}%`;
  if (startupProgressText) startupProgressText.textContent = `${percent} %`;
  startupProgressFill?.parentElement?.setAttribute("aria-valuenow", String(percent));
}

function resetStartupLoader() {
  if (startupLoader) startupLoader.hidden = false;
  if (startupError) {
    startupError.hidden = true;
    startupError.textContent = "";
  }
  if (startupRetryButton) startupRetryButton.hidden = true;
  document.body.classList.add("is-app-booting");
  updateStartupLoader(0);
}

function showStartupLoaderError(error) {
  console.error("Star Odyssey konnte nicht vollständig gestartet werden.", error);
  if (startupError) {
    startupError.hidden = false;
    startupError.textContent = state.language === "en"
      ? "Important game files could not be loaded."
      : "Wichtige Spieldateien konnten nicht geladen werden.";
  }
  if (startupRetryButton) {
    startupRetryButton.hidden = false;
    startupRetryButton.textContent = state.language === "en" ? "Retry" : "Erneut versuchen";
  }
}

function finishStartupLoader() {
  updateStartupLoader(1);
  window.requestAnimationFrame(() => {
    startupLoader?.setAttribute("hidden", "");
    document.body.classList.remove("is-app-booting");
  });
}

async function bootstrapApplication({ retry = false } = {}) {
  const revision = ++applicationBootRevision;
  resetStartupLoader();

  try {
    if (state.gameState) {
      await preloadAppAssets({
        retry,
        onProgress: (progress) => updateStartupLoader(progress * 0.34)
      });
      await preloadGameAssets({
        retry,
        onProgress: (progress) => updateStartupLoader(0.34 + progress * 0.66)
      });
    } else {
      await preloadAppAssets({ retry, onProgress: updateStartupLoader });
    }
    if (revision !== applicationBootRevision) return;

    if (!applicationStarted) {
      applicationStarted = true;
      connectRemoteHost();
    }
    render();
    finishStartupLoader();
  } catch (error) {
    if (revision !== applicationBootRevision) return;
    showStartupLoaderError(error);
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
  try {
    localStorage.setItem(savesStorageKey, JSON.stringify(saves));
    pendingManualSaves = null;
    clearStorageWriteFailure("manualSave");
    return true;
  } catch {
    pendingManualSaves = saves;
    recordStorageWriteFailure("manualSave");
    scheduleStorageRetry();
    return false;
  }
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
  state.hudScrollPositions = {};
  state.modal = null;
  state.notice = "";
  render();
}

function closePlayerHud() {
  state.hudPlayerId = null;
  state.hudScrollPositions = {};
  render();
}

function getHudScrollKey(playerId = state.hudPlayerId, tabId = state.hudTab) {
  return playerId && tabId ? `${playerId}:${tabId}` : null;
}

function capturePlayerHudScrollPosition() {
  const content = document.querySelector(".player-hud-content");
  const key = content?.dataset.scrollKey;
  if (!key || !content) return;
  state.hudScrollPositions = {
    ...state.hudScrollPositions,
    [key]: content.scrollTop
  };
}

function restorePlayerHudScrollPosition() {
  const key = getHudScrollKey();
  const content = document.querySelector(".player-hud-content");
  if (!key || !content) return;
  content.scrollTop = state.hudScrollPositions[key] ?? 0;
}

function createEmptyResourceSelection() {
  return Object.fromEntries(resourceTypes.map((resource) => [resource, 0]));
}

function resetTradeOfferDraft() {
  state.tradeOfferTargetPlayerId = null;
  state.tradeOfferedResources = createEmptyResourceSelection();
  state.tradeRequestedResources = createEmptyResourceSelection();
}

async function runWithAssetLoading(afterLoad) {
  state.loadingProgress = gameAssetsReady ? 1 : 0;
  setView("loading");
  await preloadGameAssets({
    onProgress: (progress) => {
      state.loadingProgress = progress;
      render();
    }
  });
  afterLoad();
}

function startNewGameSetup() {
  clearAutosave();
  state.gameState = null;
  state.controllerMode = false;
  state.controllerLobby = null;
  state.selectedPlayers = null;
  state.selectedGameVariant = gameVariants.classic;
  state.selectedSupernovaMissionCount = supernovaMissionCounts.standard;
  state.playerSetup = [];
  resetControllerGamePreparation();
  replaceControllerAccessTokens([]);
  setView("players");
}

function enterControllerLobby() {
  if (!state.selectedPlayers) return;
  state.controllerMode = true;
  state.controllerLobby = createControllerLobby(
    state.selectedPlayers,
    state.selectedGameVariant,
    state.selectedSupernovaMissionCount
  );
  state.playerSetup = [];
  resetControllerGamePreparation();
  replaceControllerAccessTokens(state.controllerLobby.slots.map((slot) => slot.playerId));
  setView("controllers");
  startControllerLobbyAssetPreload();
}

function resetControllerGamePreparation() {
  clearTimeout(controllerAutoStartTimer);
  controllerAutoStartTimer = null;
  controllerAutoStartPending = false;
  controllerGamePreparationRevision += 1;
  preparedControllerGameState = null;
  preparedControllerGameKey = "";
  controllerGamePreparationStatus = assetLoadStates.idle;
  controllerGamePreparationError = null;
}

function getControllerGamePreparationKey() {
  const lobby = state.controllerLobby;
  if (!lobby) return "";
  return JSON.stringify({
    playerCount: lobby.playerCount,
    gameVariant: lobby.gameVariant,
    supernovaMissionCount: lobby.supernovaMissionCount,
    players: lobby.slots.map((slot) => ({
      playerId: slot.playerId,
      name: slot.name.trim(),
      color: slot.color,
      gender: normalizePlayerGender(slot.gender)
    }))
  });
}

function waitForGamePreparationSlot() {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(resolve, { timeout: 180 });
      return;
    }
    window.setTimeout(resolve, 0);
  });
}

async function prepareControllerGame() {
  if (!state.controllerLobby || state.controllerLobby.started) return false;
  if (!areControllerLobbySlotsReady() || !gameAssetsReady) return false;
  if (controllerGamePreparationStatus === assetLoadStates.loading) return false;

  const preparationKey = getControllerGamePreparationKey();
  if (preparedControllerGameState && preparedControllerGameKey === preparationKey) {
    schedulePreparedControllerGameStart();
    return true;
  }
  const revision = ++controllerGamePreparationRevision;
  controllerGamePreparationStatus = assetLoadStates.loading;
  controllerGamePreparationError = null;
  state.loadingProgress = Math.max(0.96, state.loadingProgress ?? 0);
  render();

  try {
    await waitForGamePreparationSlot();
    const lobby = state.controllerLobby;
    if (!lobby || revision !== controllerGamePreparationRevision || preparationKey !== getControllerGamePreparationKey()) return false;
    const playerSetup = lobby.slots.map((slot) => ({
      name: slot.name.trim(),
      color: slot.color,
      gender: normalizePlayerGender(slot.gender)
    }));
    const nextGameState = createGameState({
      language: state.language,
      playerCount: lobby.playerCount,
      boardLayout,
      playerSetup,
      gameVariant: lobby.gameVariant ?? gameVariants.classic,
      supernovaMissionCount: lobby.supernovaMissionCount ?? supernovaMissionCounts.standard
    });
    if (revision !== controllerGamePreparationRevision || preparationKey !== getControllerGamePreparationKey()) return false;

    preparedControllerGameState = nextGameState;
    preparedControllerGameKey = preparationKey;
    controllerGamePreparationStatus = assetLoadStates.ready;
    state.loadingProgress = 1;
    schedulePreparedControllerGameStart();
    return true;
  } catch (error) {
    if (revision !== controllerGamePreparationRevision) return false;
    preparedControllerGameState = null;
    controllerGamePreparationStatus = assetLoadStates.error;
    controllerGamePreparationError = error;
    console.error("Spielvorbereitung fehlgeschlagen.", error);
    render();
    return false;
  }
}

function canStartPreparedControllerGame() {
  return Boolean(
    state.controllerLobby &&
    !state.controllerLobby.started &&
    areControllerLobbySlotsReady() &&
    gameAssetsReady &&
    controllerGamePreparationStatus === assetLoadStates.ready &&
    preparedControllerGameState &&
    preparedControllerGameKey === getControllerGamePreparationKey()
  );
}

function startPreparedControllerGame() {
  if (!canStartPreparedControllerGame()) return;
  const lobby = state.controllerLobby;
  const nextGameState = preparedControllerGameState;
  state.controllerLobby = { ...lobby, started: true };
  state.gameState = nextGameState;
  state.playerSetup = [];
  state.selectedPlayers = nextGameState.playerCount;
  state.selectedGameVariant = nextGameState.gameVariant ?? gameVariants.classic;
  state.selectedSupernovaMissionCount = nextGameState.supernova?.missionCount ?? supernovaMissionCounts.standard;
  state.controllerMode = true;
  resetTradeOfferDraft();
  resetControllerGamePreparation();
  saveCurrentGameState();
  setView("board");
}

function schedulePreparedControllerGameStart() {
  if (!canStartPreparedControllerGame() || controllerAutoStartPending) return false;
  controllerAutoStartPending = true;
  render();
  controllerAutoStartTimer = window.setTimeout(() => {
    controllerAutoStartTimer = null;
    if (!controllerAutoStartPending) return;
    controllerAutoStartPending = false;
    if (!canStartPreparedControllerGame()) {
      render();
      return;
    }
    startPreparedControllerGame();
  }, 0);
  return true;
}

function createControllerLobby(
  playerCount,
  gameVariant = gameVariants.classic,
  supernovaMissionCount = supernovaMissionCounts.standard
) {
  return {
    playerCount,
    gameVariant,
    supernovaMissionCount,
    started: false,
    slots: Array.from({ length: playerCount }, (_, index) => ({
      playerId: `player-${index + 1}`,
      slotNumber: index + 1,
      name: "",
      color: "",
      gender: "male",
      ready: false,
      connected: false,
      connectionState: "disconnected"
    }))
  };
}

function createControllerReconnectLobby(gameState) {
  const players = gameState?.players ?? [];
  const playerCount = players.length || gameState?.playerCount || 2;
  return {
    playerCount,
    gameVariant: gameState?.gameVariant ?? gameVariants.classic,
    supernovaMissionCount: gameState?.supernova?.missionCount ?? supernovaMissionCounts.standard,
    started: true,
    slots: Array.from({ length: playerCount }, (_, index) => {
      const player = players[index] ?? {};
      return {
        playerId: player.id ?? `player-${index + 1}`,
        slotNumber: index + 1,
        name: player.name ?? "",
        color: player.color ?? "",
        gender: normalizePlayerGender(player.gender),
        ready: true,
        connected: false,
        connectionState: "lost"
      };
    })
  };
}

function getControllerLobbySlot(playerId) {
  return state.controllerLobby?.slots?.find((slot) => slot.playerId === playerId) ?? null;
}

function getControllerLobbyColorsInUse(exceptPlayerId = null) {
  return new Set((state.controllerLobby?.slots ?? [])
    .filter((slot) => slot.playerId !== exceptPlayerId && slot.color)
    .map((slot) => slot.color));
}

function updateControllerLobbyConnections() {
  if (!state.controllerLobby) return;
  const connectedPlayerIds = new Set((remoteHost.controllerSlots ?? [])
    .filter((slot) => slot.connected)
    .map((slot) => slot.playerId));
  state.controllerLobby = {
    ...state.controllerLobby,
    slots: state.controllerLobby.slots.map((slot) => ({
      ...slot,
      connected: connectedPlayerIds.has(slot.playerId),
      connectionState: connectedPlayerIds.has(slot.playerId)
        ? (slot.ready ? "ready" : "connected")
        : (slot.ready ? "lost" : "disconnected")
    }))
  };
}

function updateControllerLobbySlot(playerId, changes) {
  if (!state.controllerLobby?.slots?.some((slot) => slot.playerId === playerId)) return false;
  state.controllerLobby = {
    ...state.controllerLobby,
    slots: state.controllerLobby.slots.map((slot) => {
      if (slot.playerId !== playerId) return slot;
      return {
        ...slot,
        ...changes,
        ready: changes.ready ?? (changes.name !== undefined || changes.color !== undefined || changes.gender !== undefined ? false : slot.ready)
      };
    })
  };
  updateControllerLobbyConnections();
  resetControllerGamePreparation();
  startControllerLobbyAssetPreload();
  render();
  return true;
}

function areControllerLobbySlotsReady(slots = state.controllerLobby?.slots ?? []) {
  return slots.length === state.controllerLobby?.playerCount
    && slots.every((slot) => slot.connected && slot.ready && slot.name.trim() && slot.color && playerGenders.includes(slot.gender))
    && new Set(slots.map((slot) => slot.name.trim().toLocaleLowerCase(state.language))).size === slots.length
    && new Set(slots.map((slot) => slot.color)).size === slots.length;
}

function startControllerLobbyAssetPreload({ retry = false } = {}) {
  state.loadingProgress = gameAssetsReady ? 1 : 0;
  void preloadGameAssets({
    retry,
    onProgress: (progress) => {
      state.loadingProgress = progress;
      updateControllerLobbyPreloadStatus();
    }
  }).then(async () => {
    if (gameAssetsReady) state.loadingProgress = 1;
    if (state.view === "controllers" || state.modal === "controllers") render();
    if (gameAssetsReady) await prepareControllerGame();
  }).catch((error) => {
    controllerGamePreparationStatus = assetLoadStates.error;
    controllerGamePreparationError = error;
    console.error("Spielassets konnten nicht vollständig vorbereitet werden.", error);
    if (state.view === "controllers" || state.modal === "controllers") render();
  });
}

async function startGameNow(options = {}) {
  const validation = validatePlayerSetup();
  if (!validation.valid) {
    state.notice = t(validation.messageKey);
    render();
    return;
  }

  if (!options.skipAssetPreload && !gameAssetsReady) {
    await runWithAssetLoading(() => {
      startGameNow({ ...options, skipAssetPreload: true });
    });
    return;
  }

  state.gameState = createGameState({
    language: state.language,
    playerCount: state.selectedPlayers,
    boardLayout,
    playerSetup: getSanitizedPlayerSetup(),
    gameVariant: state.selectedGameVariant,
    supernovaMissionCount: state.selectedSupernovaMissionCount
  });
  resetTradeOfferDraft();
  state.selectedPlayers = state.gameState.playerCount;
  state.playerSetup = [];
  state.controllerMode = options.fromControllerLobby ? true : state.controllerMode;
  saveCurrentGameState();
  setView("board");
}

function createDefaultPlayerSetup(playerCount) {
  return Array.from({ length: playerCount }, (_, index) => ({
    name: t("playerNumber").replace("{number}", index + 1),
    color: playerPieceColors[index] ?? playerPieceColors[0],
    gender: "male"
  }));
}

function ensurePlayerSetup(playerCount) {
  const defaults = createDefaultPlayerSetup(playerCount);
  state.playerSetup = defaults.map((fallback, index) => ({
    ...fallback,
    ...(state.playerSetup[index] ?? {}),
    color: playerPieceColors.includes(state.playerSetup[index]?.color)
      ? state.playerSetup[index].color
      : fallback.color,
    gender: normalizePlayerGender(state.playerSetup[index]?.gender)
  }));
  return state.playerSetup;
}

function getSanitizedPlayerSetup() {
  return ensurePlayerSetup(state.selectedPlayers ?? 3).map((player) => ({
    name: String(player.name ?? "").trim(),
    color: player.color,
    gender: normalizePlayerGender(player.gender)
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
  if ([t("back"), t("close"), t("backToMenu")].includes(label)) button.dataset.sound = "uiBack";
  button.addEventListener("click", onClick);
  return button;
}

function getRemoteFocusControls() {
  const scope = state.modal ? app.querySelector(".modal-overlay") : app;
  if (!scope) return [];
  return [...scope.querySelectorAll([
    "button:not(:disabled)",
    "[role='button'][tabindex='0']",
    "input:not(:disabled)",
    "select:not(:disabled)",
    "textarea:not(:disabled)"
  ].join(","))].filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
  });
}

function getRemoteFocusContext() {
  return `${state.view}:${state.modal ?? ""}:${state.hudPlayerId ?? ""}`;
}

function getRemoteControlKey(control, controls = getRemoteFocusControls()) {
  if (!control) return "";
  const explicitKey = control.dataset.remoteId || control.id || control.getAttribute("name");
  if (explicitKey) return explicitKey;
  const semanticKey = [
    control.tagName.toLowerCase(),
    control.getAttribute("aria-label") || "",
    control.dataset.action || "",
    control.textContent?.trim() || ""
  ].join(":");
  const matchingControls = controls.filter((candidate) => [
    candidate.tagName.toLowerCase(),
    candidate.getAttribute("aria-label") || "",
    candidate.dataset.action || "",
    candidate.textContent?.trim() || ""
  ].join(":") === semanticKey);
  return `${semanticKey}:${Math.max(0, matchingControls.indexOf(control))}`;
}

function captureRemoteFocus() {
  const controls = getRemoteFocusControls();
  const active = document.activeElement;
  if (!controls.includes(active)) return;
  remoteFocusIndex = controls.indexOf(active);
  remoteFocusKey = getRemoteControlKey(active, controls);
}

function setRemoteFocus(control, controls = getRemoteFocusControls()) {
  if (!control) return;
  remoteFocusIndex = Math.max(0, controls.indexOf(control));
  remoteFocusKey = getRemoteControlKey(control, controls);
  controls.forEach((candidate) => candidate.classList.toggle("is-remote-focused", candidate === control));
  control.focus({ preventScroll: true });
}

function findRemoteControlInDirection(controls, current, direction) {
  const currentRect = current.getBoundingClientRect();
  const origin = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2
  };
  const vertical = direction === "up" || direction === "down";
  const sign = direction === "up" || direction === "left" ? -1 : 1;
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of controls) {
    if (candidate === current) continue;
    const rect = candidate.getBoundingClientRect();
    const deltaX = rect.left + rect.width / 2 - origin.x;
    const deltaY = rect.top + rect.height / 2 - origin.y;
    const primary = vertical ? deltaY * sign : deltaX * sign;
    if (primary <= 1) continue;
    const cross = Math.abs(vertical ? deltaX : deltaY);
    const score = primary + cross * 2.5;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function prepareRemoteNavigation() {
  if (state.view === "board" && !state.modal && !state.hudPlayerId) {
    remoteFocusContext = getRemoteFocusContext();
    return;
  }
  const controls = getRemoteFocusControls();
  if (controls.length === 0) return;
  const context = getRemoteFocusContext();
  const enteredContext = context !== remoteFocusContext;
  if (!enteredContext && controls.includes(document.activeElement)) return;
  let target = null;
  if (enteredContext) {
    remoteFocusContext = context;
    target = controls.find((control) => control.dataset.remoteAutofocus === "true")
      ?? controls.find((control) => control.getAttribute("aria-pressed") === "true")
      ?? controls[0];
  } else if (remoteFocusKey) {
    target = controls.find((control) => getRemoteControlKey(control, controls) === remoteFocusKey) ?? null;
  }
  target ??= controls[Math.min(remoteFocusIndex, controls.length - 1)] ?? controls[0];
  setRemoteFocus(target, controls);
}

function handleRemoteBack() {
  if (state.modal) {
    closeModal();
    return true;
  }
  if (state.hudPlayerId) {
    closePlayerHud();
    return true;
  }
  if (state.view === "players") {
    setView("menu");
    return true;
  }
  if (state.view === "controllers") {
    state.controllerLobby = null;
    state.controllerMode = false;
    setView("players");
    return true;
  }
  if (state.view === "playerSetup") {
    setView("controllers");
    return true;
  }
  if (state.view === "menu") {
    requestAppExit();
    return true;
  }
  return false;
}

function handleRemoteKeydown(event) {
  if (event.defaultPrevented) return;
  if (["Escape", "BrowserBack", "GoBack"].includes(event.key) || event.keyCode === 4) {
    if (handleRemoteBack()) event.preventDefault();
    return;
  }
  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  };
  const keyCodeDirections = {
    19: "up",
    20: "down",
    21: "left",
    22: "right",
    37: "left",
    38: "up",
    39: "right",
    40: "down"
  };
  const direction = directions[event.key] ?? keyCodeDirections[event.keyCode];
  const active = document.activeElement;
  const isNativeEnter = ["Enter", "NumpadEnter"].includes(event.key) || event.keyCode === 13;
  const isFireTvSelect = event.key === "Select" || [23, 66, 160].includes(event.keyCode);
  if (!direction && isFireTvSelect && !isNativeEnter && active instanceof HTMLElement) {
    const controls = getRemoteFocusControls();
    if (controls.includes(active)) {
      event.preventDefault();
      active.click();
    }
    return;
  }
  if (!direction) return;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
  const controls = getRemoteFocusControls();
  if (controls.length === 0) return;
  const current = controls.includes(active) ? active : controls[Math.min(remoteFocusIndex, controls.length - 1)];
  const next = findRemoteControlInDirection(controls, current, direction);
  if (!next) return;
  event.preventDefault();
  setRemoteFocus(next, controls);
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
  element.dataset.boardType = type;
  element.dataset.boardId = id;
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

  if (type === "planet" && placePendingFactoryAt(id)) return;
  if (type === "planet" && state.gameState.supernova?.pendingFactoryPlacement) return;
  if (type === "ship" && confirmEncounterJumpShip(id)) return;
  if (type === "ship" && confirmEncounterBlockShip(id)) return;
  if (type === "spacePoint" && confirmEncounterTargetAt(id)) return;
  if (type === "spacePoint" && state.gameState.activeEncounter?.pendingStep?.type === "boardTargetSelection") return;
  if (type === "spacePoint" && confirmPendingTradeStationAt(id)) return;
  if (type === "spacePoint" && state.gameState.board?.pendingTradeStationPlacement) return;
  if (type === "spacePoint" && placePendingShipAt(id)) return;
  if (type === "structure" && confirmPendingSpaceportAt(id)) return;
  if (state.gameState.phase === "placement") {
    if (type === "spacePoint") handlePlacementPointSelection(id);
    return;
  }
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

  const rollingPlayer = getActivePlayer();
  const nextGameState = determineFlightSpeed(state.gameState);
  state.hudPlayerId = null;
  state.hudTab = "turn";
  state.encounterBoardSelectionActive = false;
  const queued = queueMothershipSpeedAnimation(rollingPlayer, nextGameState.flightRoll, {
    totalSpeed: nextGameState.flightSpeedTotal,
    onComplete: () => {
      state.gameState = nextGameState;
      if (state.gameState?.phase === "flight" && state.gameState.pendingFlightEncounter) {
        state.gameState = startPendingFlightEncounter(state.gameState);
        state.hudPlayerId = null;
        state.encounterBoardSelectionActive = false;
      }
      saveCurrentGameState();
    }
  });
  if (!queued) {
    state.gameState = nextGameState;
    if (state.gameState.pendingFlightEncounter) {
      state.gameState = startPendingFlightEncounter(state.gameState);
    }
    saveCurrentGameState();
  }
  render();
}

function resolveActiveEncounterChoice(choiceId, payload = {}) {
  if (!state.gameState?.activeEncounter) return;
  state.hudPlayerId = null;
  state.encounterBoardSelectionActive = false;

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
  state.encounterBoardSelectionActive = false;

  state.gameState = submitEncounterPending(state.gameState, payload);
  saveCurrentGameState();
  render();
}

function confirmEncounterJumpShip(shipId) {
  const pendingStep = state.gameState?.activeEncounter?.pendingStep;
  if (
    !state.encounterBoardSelectionActive ||
    pendingStep?.type !== "shipJumpSelection" ||
    !pendingStep.shipIds?.includes(shipId)
  ) {
    return false;
  }

  state.gameState = submitEncounterPending(state.gameState, { shipId });
  state.encounterBoardSelectionActive = true;
  state.gameState = touchGameState({
    ...state.gameState,
    board: {
      ...state.gameState.board,
      selectedElement: { type: "ship", id: shipId }
    }
  });
  saveCurrentGameState();
  render();
  return true;
}

function confirmEncounterBlockShip(shipId) {
  const pendingStep = state.gameState?.activeEncounter?.pendingStep;
  if (
    !state.encounterBoardSelectionActive ||
    pendingStep?.type !== "shipBlockSelection" ||
    !pendingStep.shipIds?.includes(shipId)
  ) {
    return false;
  }

  state.gameState = submitEncounterPending(state.gameState, { shipId });
  state.encounterBoardSelectionActive = false;
  saveCurrentGameState();
  render();
  return true;
}

function confirmEncounterTargetAt(nodeId) {
  const pendingStep = state.gameState?.activeEncounter?.pendingStep;
  if (!state.encounterBoardSelectionActive || pendingStep?.type !== "boardTargetSelection") return false;
  if (!pendingStep.validNodeIds?.includes(nodeId)) return false;

  const previousGameState = state.gameState;
  const jumpShip = previousGameState.board?.ships?.find((ship) => ship.id === pendingStep.shipId);
  if (jumpShip) {
    queuePlacementVfx("ship", jumpShip);
  }
  state.gameState = submitEncounterPending(state.gameState, { targetNodeId: nodeId });
  state.encounterBoardSelectionActive = false;
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
  state.encounterBoardSelectionActive = false;
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
  const destinationState = getSelectedShipDestinationState(targetNodeId);
  const battleWeaponBurst = destinationState?.endpointType === "battle" && selectedShip.type === "battleShip" && toPoint
    ? createShipWeaponBurstSnapshot(selectedShip, toPoint, fromPoint)
    : null;
  state.gameState = moveShip(state.gameState, boardLayout, selectedShip.id, targetNodeId, { deferExploration: true });
  queueShipFlightAnimation(selectedShip, fromPoint, toPoint, () => {
    if (battleWeaponBurst) queueShipWeaponBurst(battleWeaponBurst);
    state.gameState = completeShipExploration(state.gameState, boardLayout, selectedShip.id);
    saveCurrentGameState();
  });
  render();
  return true;
}

function commitProductionRollResult(nextGameState, { renderNow = false } = {}) {
  const productionData = nextGameState?.productionVfx ?? null;
  state.gameState = stripTransientProductionVfx(nextGameState);
  saveCurrentGameState();
  startProductionVfx(productionData);
  if (renderNow) render();
}

function stripTransientProductionVfx(gameState) {
  if (!gameState?.productionVfx) return gameState;
  return {
    ...gameState,
    productionVfx: null
  };
}

function startProductionVfx(productionData) {
  if (productionVfx.timeoutId) {
    clearTimeout(productionVfx.timeoutId);
    productionVfx.timeoutId = null;
  }

  const events = buildProductionVfxItems(productionData);
  const flashes = (productionData?.resourceFlashes ?? []).map((flash) => ({
    ...flash,
    id: `production-resource-${productionVfx.nextId++}`
  }));

  if (events.length === 0 && flashes.length === 0) {
    productionVfx.items = [];
    productionVfx.resourceFlashes = [];
    return;
  }

  audioManager.play("resourceGain");
  productionVfx.items = events;
  productionVfx.resourceFlashes = flashes;
  const latestDelay = events.reduce((maxDelay, event) => Math.max(maxDelay, event.delay ?? 0), 0);
  productionVfx.timeoutId = setTimeout(() => {
    productionVfx.items = [];
    productionVfx.resourceFlashes = [];
    productionVfx.timeoutId = null;
    render();
  }, latestDelay + PRODUCTION_EVENT_TOTAL_MS + PRODUCTION_WRAPUP_MS);
}

function buildProductionVfxItems(productionData) {
  return (productionData?.events ?? [])
    .map((event, index) => {
      const planetPosition = getProductionPlanetRenderPoint(event.planetId);
      if (!planetPosition) return null;

      const color = productionResourceColors[event.resource] ?? "#f8fafc";
      const recipients = (event.recipients ?? [])
        .map((recipient) => {
          const structure = getStructureById(recipient.structureId);
          const structurePosition = structure ? getStructureRenderPoint(structure) : null;
          if (!structurePosition) return null;
          const player = state.gameState?.players?.find((candidate) => candidate.id === recipient.playerId);
          return {
            ...recipient,
            x: structurePosition.x,
            y: structurePosition.y,
            playerColor: playerDiceColors[player?.color] ?? "#f8fafc"
          };
        })
        .filter(Boolean);

      return {
        ...event,
        id: `production-vfx-${productionVfx.nextId++}`,
        x: planetPosition.x,
        y: planetPosition.y,
        delay: Math.min(index, PRODUCTION_MAX_STAGGER_STEPS) * PRODUCTION_STAGGER_MS,
        color,
        recipients
      };
    })
    .filter(Boolean);
}

function getProductionPlanetRenderPoint(planetId) {
  for (const system of [...(boardLayout.startSystems ?? []), ...getVisiblePlanetSystems()]) {
    const planets = system.planets ?? system.resources?.map((resource, index) => ({
      id: `${system.id}-planet-${index + 1}`,
      resource
    })) ?? [];
    const index = planets.findIndex((planet) => planet.id === planetId);
    if (index < 0) continue;
    return getPlanetRenderPosition(system, planets[index], planetRenderFallbackOffsets[index] ?? { x: 0, y: 0 });
  }
  return null;
}

function isResourceGainFlashing(playerId, resource) {
  return productionVfx.resourceFlashes.some((flash) => flash.playerId === playerId && flash.resource === resource);
}

function rollProductionForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "production") return;
  if (state.gameState.sevenResolution?.active) return;
  if (isDiceRollAnimating()) return;

  const rollingPlayer = getActivePlayer();
  const nextGameState = rollProduction(state.gameState, boardLayout);
  const queued = queueDiceRollAnimation(rollingPlayer, nextGameState.lastRoll?.dice, () => {
    commitProductionRollResult(nextGameState);
  });
  if (!queued) {
    commitProductionRollResult(nextGameState, { renderNow: true });
    return;
  }
  render();
}

function rollPlacementForActivePlayer() {
  if (!state.gameState || state.gameState.phase !== "placement") return;
  if (isDiceRollAnimating()) return;

  const previousGameState = state.gameState;
  const rollingPlayerId = previousGameState.placement?.rollPlayerIds?.[previousGameState.placement?.currentRollIndex ?? 0];
  const rollingPlayer = previousGameState.players.find((player) => player.id === rollingPlayerId) ?? getActivePlayer();
  const nextGameState = rollPlacementStart(state.gameState);
  const queued = queueDiceRollAnimation(rollingPlayer, getPlacementRollDice(nextGameState, rollingPlayerId), () => {
    state.gameState = nextGameState;
    saveCurrentGameState();
  });
  if (!queued) {
    state.gameState = nextGameState;
    saveCurrentGameState();
  }
  render();
}

function drawSupplyForActivePlayer() {
  if (!canDrawSupply(state.gameState)) return;

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
  if (!state.gameState || state.gameState.supernova?.pendingFactoryPlacement) return;
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
  if (
    !state.gameState ||
    state.gameState.phase !== "tradeBuild" ||
    state.gameState.supernova?.pendingFactoryPlacement
  ) return;

  state.gameState = advanceToFlightPhase(state.gameState);
  state.hudPlayerId = null;
  state.encounterBoardSelectionActive = false;
  saveCurrentGameState();
  determineSpeedForActivePlayer();
}

function tradeActivePlayerWithSupply() {
  if (!state.gameState || state.gameState.phase !== "tradeBuild" || state.gameState.supernova?.pendingFactoryPlacement) return;

  state.gameState = tradeWithSupply(state.gameState, {
    fromResource: state.tradeFromResource,
    toResource: state.tradeToResource
  });
  saveCurrentGameState();
  render();
}

function buyActivePlayerUpgrade(upgradeId) {
  if (!state.gameState || state.gameState.phase !== "tradeBuild" || state.gameState.supernova?.pendingFactoryPlacement) return;

  state.gameState = buyUpgrade(state.gameState, upgradeId);
  saveCurrentGameState();
  render();
}

function buildActivePlayerShip(shipType) {
  if (!state.gameState || state.gameState.phase !== "tradeBuild" || state.gameState.supernova?.pendingFactoryPlacement) return;

  state.gameState = buildShip(state.gameState, boardLayout, shipType);
  saveCurrentGameState();
  render();
}

function beginActivePlayerSupernovaFactoryPlacement(factoryType) {
  if (!state.gameState || state.gameState.phase !== "tradeBuild") return;

  state.gameState = beginSupernovaFactoryPlacement(state.gameState, boardLayout, factoryType);
  saveCurrentGameState();
  render();
}

function placePendingFactoryAt(planetId) {
  const pending = state.gameState?.supernova?.pendingFactoryPlacement;
  if (!pending || state.gameState?.phase !== "tradeBuild") return false;
  const previousGameState = state.gameState;
  state.gameState = buildSupernovaFactory(state.gameState, boardLayout, pending.factoryType, planetId);
  if (state.gameState === previousGameState) return false;
  queuePlacementVfxForStateChange(previousGameState, state.gameState);
  saveCurrentGameState();
  render();
  return true;
}

function cancelActiveFactoryPlacement() {
  if (!state.gameState?.supernova?.pendingFactoryPlacement) return;
  state.gameState = cancelPendingFactoryPlacement(state.gameState);
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
  if (!state.gameState || state.gameState.phase !== "tradeBuild" || state.gameState.supernova?.pendingFactoryPlacement) return;

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

function foundColonyWithShip(shipId) {
  const ship = (state.gameState?.board?.ships ?? []).find((candidate) => candidate.id === shipId);
  if (!state.gameState || !ship || !canFoundColonyWithShip(ship)) return;

  const previousGameState = state.gameState;
  state.gameState = foundColony(state.gameState, boardLayout, ship.id);
  queuePlacementVfxForStateChange(previousGameState, state.gameState);
  saveCurrentGameState();
  render();
}

function foundTradeStationWithShip(shipId) {
  const ship = (state.gameState?.board?.ships ?? []).find((candidate) => candidate.id === shipId);
  if (!state.gameState || !ship || !canFoundTradeStationWithShip(ship)) return;

  state.gameState = foundTradeStation(state.gameState, boardLayout, ship.id);
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
  clearAutosave();
  resetTradeOfferDraft();
  setView("menu");
}

function isSelectedElement(type, id) {
  if (state.gameState?.phase === "placement" && ["planet", "planetSystem"].includes(type)) return false;
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
    button.dataset.remoteId = `language-${language}`;
    button.setAttribute("aria-pressed", String(language === state.language));
    wrapper.append(button);
  }

  return wrapper;
}

function renderMenuLayer(name, src, classes = []) {
  const image = document.createElement("img");
  image.className = ["main-menu-layer", ...classes].join(" ");
  image.dataset.menuLayer = name;
  image.src = src;
  image.alt = "";
  image.decoding = "async";
  image.draggable = false;
  return image;
}

function getMainMenuDefinitions() {
  const labels = {
    newGame: t("newGame"),
    loadGame: t("loadGame"),
    quitGame: t("exitGame"),
    settings: state.language === "en" ? "Settings" : "Einstellungen"
  };
  return menuButtonDefinitions.map((definition) => ({
    ...definition,
    label: labels[definition.id] ?? definition.label
  }));
}

function runMainMenuAction(actionId) {
  const actions = {
    newGame: startNewGameSetup,
    loadGame: () => openModal("load"),
    quitGame: requestAppExit,
    settings: () => openModal("settings")
  };
  actions[actionId]?.();
}

function renderMainMenuActionButton(definition, index) {
  const button = createButton("", () => runMainMenuAction(definition.id), "menu-composite-button main-menu-action-button");
  button.dataset.action = definition.id;
  button.dataset.remoteId = `menu-${definition.id}`;
  button.setAttribute("aria-label", definition.label);
  if (index === 0) button.dataset.remoteAutofocus = "true";

  const icon = document.createElement("span");
  icon.className = "main-menu-action-icon";
  icon.dataset.iconSource = definition.icon;
  icon.style.setProperty("--main-menu-icon", `url("${new URL(definition.icon, document.baseURI).href}")`);
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "main-menu-action-label";
  label.textContent = definition.label;
  button.append(icon, label);
  return button;
}

function renderMainMenuRotateHint() {
  const hint = document.createElement("aside");
  hint.className = "main-menu-rotate-hint";
  hint.setAttribute("role", "status");
  hint.setAttribute("aria-live", "polite");

  const icon = document.createElement("div");
  icon.className = "main-menu-rotate-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "↻";

  const title = document.createElement("strong");
  title.textContent = state.language === "en" ? "Please rotate your device" : "Bitte Gerät drehen";

  const copy = document.createElement("span");
  copy.textContent = state.language === "en"
    ? "Star Odyssey is designed for landscape play."
    : "Star Odyssey ist für die Querformat-Ansicht ausgelegt.";

  hint.append(icon, title, copy);
  return hint;
}

function renderMenu() {
  const screen = document.createElement("section");
  screen.className = "menu-screen main-menu-screen";
  screen.setAttribute("aria-labelledby", "screen-title");
  screen.tabIndex = -1;

  const scene = document.createElement("div");
  scene.className = "main-menu-scene";

  const brand = document.createElement("header");
  brand.className = "main-menu-brand";
  const emblem = renderMenuLayer("logo", mainMenuAssetPaths.compass, ["main-menu-brand-emblem"]);
  const title = document.createElement("h1");
  title.id = "screen-title";
  title.className = "main-menu-title";
  title.textContent = "Star Odyssey";
  brand.append(emblem, title);

  const buttonList = document.createElement("nav");
  buttonList.className = "main-menu-button-list";
  buttonList.setAttribute("aria-label", "Hauptmenü");

  scene.append(
    renderMenuLayer("background", mainMenuAssetPaths.background, ["main-menu-layer--fill"]),
    renderMenuLayer("frame", mainMenuAssetPaths.frame, ["main-menu-frame"]),
    brand,
    buttonList,
    renderNotice()
  );

  getMainMenuDefinitions().forEach((definition, index) => {
    buttonList.append(renderMainMenuActionButton(definition, index));
  });

  screen.append(scene, renderMainMenuRotateHint());
  return screen;
}

function renderLoadingScreen() {
  const screen = document.createElement("section");
  screen.className = "menu-screen shell-screen loading-screen";
  screen.setAttribute("aria-labelledby", "screen-title");

  const title = document.createElement("h1");
  title.id = "screen-title";
  title.className = "setup-title";
  title.textContent = t("loadingAssets");

  const progress = Math.max(0, Math.min(1, state.loadingProgress ?? 0));
  const percent = Math.round(progress * 100);

  const progressText = document.createElement("p");
  progressText.className = "loading-progress-text";
  progressText.textContent = t("loadingAssetsProgress").replace("{percent}", percent);

  const progressTrack = document.createElement("div");
  progressTrack.className = "loading-progress-track";
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", "100");
  progressTrack.setAttribute("aria-valuenow", String(percent));

  const progressFill = document.createElement("div");
  progressFill.className = "loading-progress-fill";
  progressFill.style.width = `${percent}%`;
  progressTrack.append(progressFill);

  const panel = document.createElement("div");
  panel.className = "loading-panel";
  panel.append(progressText, progressTrack);

  screen.append(title, panel);
  return screen;
}

function renderPlayerSelect() {
  const screen = document.createElement("section");
  screen.className = "menu-screen shell-screen setup-screen player-select-screen";
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
    button.dataset.remoteId = `players-${count}`;
    if (count === 2) button.dataset.remoteAutofocus = "true";
    options.append(button);
  }

  const variantGroup = document.createElement("div");
  variantGroup.className = "player-options variant-options";

  const variantLabel = document.createElement("h2");
  variantLabel.className = "setup-section-label";
  variantLabel.textContent = t("selectGameVariant");
  for (const variant of [gameVariants.classic, gameVariants.supernova]) {
    const button = createButton(t(`gameVariant_${variant}`), () => {
      state.selectedGameVariant = variant;
      render();
    }, "player-button variant-button");
    button.dataset.remoteId = `variant-${variant}`;
    button.setAttribute("aria-pressed", String(variant === state.selectedGameVariant));
    variantGroup.append(button);
  }

  const supernovaMissionElements = [];
  if (state.selectedGameVariant === gameVariants.supernova) {
    const missionModeLabel = document.createElement("h2");
    missionModeLabel.className = "setup-section-label";
    missionModeLabel.textContent = t("selectSupernovaMissionMode");

    const missionModeGroup = document.createElement("div");
    missionModeGroup.className = "player-options variant-options mission-mode-options";
    const missionModes = [
      ["standard", supernovaMissionCounts.standard],
      ["professional", supernovaMissionCounts.professional]
    ];
    for (const [mode, missionCount] of missionModes) {
      const button = createButton(t(`supernovaMissionMode_${mode}`), () => {
        state.selectedSupernovaMissionCount = missionCount;
        render();
      }, "player-button variant-button mission-mode-button");
      button.dataset.remoteId = `missions-${mode}`;
      button.setAttribute("aria-pressed", String(missionCount === state.selectedSupernovaMissionCount));
      missionModeGroup.append(button);
    }
    supernovaMissionElements.push(missionModeLabel, missionModeGroup);
  }

  const actions = document.createElement("div");
  actions.className = "setup-actions";
  const continueButton = createButton(t("continue"), enterControllerLobby, "menu-button");
  continueButton.dataset.remoteId = "setup-continue";
  continueButton.disabled = state.selectedPlayers === null;
  const backButton = createButton(t("back"), () => setView("menu"), "secondary-button");
  backButton.dataset.remoteId = "setup-back";
  actions.append(
    backButton,
    continueButton
  );

  screen.append(
    title,
    options,
    variantLabel,
    variantGroup,
    ...supernovaMissionElements,
    actions,
    renderNotice()
  );
  return screen;
}

function renderControllerConnect() {
  if (!state.controllerLobby && state.selectedPlayers) {
    state.controllerLobby = createControllerLobby(
      state.selectedPlayers,
      state.selectedGameVariant,
      state.selectedSupernovaMissionCount
    );
  }
  updateControllerLobbyConnections();

  const screen = document.createElement("section");
  screen.className = "menu-screen shell-screen controller-screen lobby-screen";
  screen.setAttribute("aria-labelledby", "screen-title");

  const title = document.createElement("h1");
  title.id = "screen-title";
  title.className = "setup-title";
  title.textContent = t("connectControllers");

  const qrGrid = document.createElement("div");
  qrGrid.className = "qr-grid";

  const slots = state.controllerLobby?.slots ?? [];
  for (let index = 1; index <= (state.selectedPlayers ?? slots.length); index += 1) {
    qrGrid.append(renderQrPlaceholder(index));
  }

  const hint = document.createElement("p");
  hint.className = "subtitle small-subtitle";
  hint.textContent = t("qrPlaceholderHint");

  const preloadStatus = renderControllerLobbyPreloadStatus();

  const actions = document.createElement("div");
  actions.className = "setup-actions";
  const backButton = createButton(t("back"), () => {
    state.controllerLobby = null;
    state.controllerMode = false;
    resetControllerGamePreparation();
    setView("players");
  }, "secondary-button");
  backButton.dataset.remoteId = "lobby-back";
  backButton.dataset.remoteAutofocus = "true";
  actions.append(backButton);

  if (controllerGamePreparationStatus === assetLoadStates.error) {
    const retryButton = createButton(t("retryLoad"), () => {
      resetControllerGamePreparation();
      startControllerLobbyAssetPreload({ retry: true });
      render();
    }, "secondary-button");
    retryButton.dataset.remoteId = "lobby-retry";
    actions.append(retryButton);
  }

  screen.append(title, qrGrid, hint, preloadStatus, actions);
  return screen;
}

function renderControllerLobbyPreloadStatus() {
  const wrapper = document.createElement("div");
  wrapper.className = "lobby-preload-status";
  const status = getControllerLobbyPreloadStatus();

  const players = document.createElement("p");
  players.className = "lobby-preload-players";
  players.textContent = status.playersText;

  const text = document.createElement("p");
  text.className = "lobby-preload-text";
  text.textContent = status.text;

  const track = document.createElement("div");
  track.className = "lobby-preload-track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", String(status.percent));

  const fill = document.createElement("div");
  fill.className = "lobby-preload-fill";
  fill.style.width = `${status.percent}%`;
  track.append(fill);

  wrapper.append(players, text, track);
  return wrapper;
}

function getControllerLobbyPreloadStatus() {
  const assetsProgress = Math.max(0, Math.min(1, state.loadingProgress ?? 0));
  const progress = controllerGamePreparationStatus === assetLoadStates.ready
    ? 1
    : gameAssetsReady
      ? Math.max(0.94, Math.min(0.99, assetsProgress))
      : assetsProgress * 0.94;
  const percent = Math.round(progress * 100);
  const connectedCount = (state.controllerLobby?.slots ?? []).filter((slot) => slot.connected).length;
  const playerCount = state.controllerLobby?.playerCount ?? 0;
  let text;
  if (controllerGamePreparationStatus === assetLoadStates.error) {
    text = t("assetPreloadFailed");
  } else if (controllerAutoStartPending) {
    text = t("controllerLobbyStarting");
  } else if (controllerGamePreparationStatus === assetLoadStates.ready) {
    text = t("assetPreloadReady");
  } else if (areControllerLobbySlotsReady()) {
    text = t("assetPreloadAllPlayersReady").replace("{percent}", percent);
  } else {
    text = t("assetPreloadProgress").replace("{percent}", percent);
  }
  return {
    percent,
    text,
    playersText: t("lobbyPlayersConnected")
      .replace("{connected}", connectedCount)
      .replace("{total}", playerCount)
  };
}

function updateControllerLobbyPreloadStatus() {
  if (state.view !== "controllers" && state.modal !== "controllers") return;
  const wrapper = app.querySelector(".lobby-preload-status");
  if (!wrapper) return;
  const status = getControllerLobbyPreloadStatus();
  const players = wrapper.querySelector(".lobby-preload-players");
  const text = wrapper.querySelector(".lobby-preload-text");
  const track = wrapper.querySelector(".lobby-preload-track");
  const fill = wrapper.querySelector(".lobby-preload-fill");
  if (players) players.textContent = status.playersText;
  if (text) text.textContent = status.text;
  track?.setAttribute("aria-valuenow", String(status.percent));
  if (fill) fill.style.width = `${status.percent}%`;
}

function renderPlayerSetup() {
  ensurePlayerSetup(state.selectedPlayers ?? 2);

  const screen = document.createElement("section");
  screen.className = "menu-screen shell-screen setup-screen player-setup-screen";
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
  startButton.dataset.remoteId = "player-setup-start";
  const backButton = createButton(t("back"), () => setView("controllers"), "secondary-button");
  backButton.dataset.remoteId = "player-setup-back";
  actions.append(
    backButton,
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
    nameInput.dataset.remoteId = `player-${index + 1}-name`;
    if (index === 0) nameInput.dataset.remoteAutofocus = "true";
    nameInput.addEventListener("input", () => {
      state.playerSetup[index].name = nameInput.value;
      updateValidation();
    });
    nameLabel.append(nameInput);

    const colorLabel = document.createElement("label");
    colorLabel.textContent = t("playerSetupColor");
    const colorSelect = document.createElement("select");
    colorSelect.dataset.remoteId = `player-${index + 1}-color`;
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

    const genderLabel = document.createElement("label");
    genderLabel.textContent = t("playerSetupGender");
    const genderSelect = document.createElement("select");
    genderSelect.dataset.remoteId = `player-${index + 1}-gender`;
    for (const gender of playerGenders) {
      const option = document.createElement("option");
      option.value = gender;
      option.textContent = t(`playerGender_${gender}`);
      option.selected = playerSetup.gender === gender;
      genderSelect.append(option);
    }
    genderSelect.addEventListener("change", () => {
      state.playerSetup[index].gender = normalizePlayerGender(genderSelect.value);
      updateValidation();
    });
    genderLabel.append(genderSelect);

    row.append(heading, nameLabel, colorLabel, genderLabel);
    form.append(row);
  });

  updateValidation();
  screen.append(title, form, hint, actions);
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

  const playerId = state.gameState?.players?.[playerNumber - 1]?.id ?? `player-${playerNumber}`;
  const slot = getControllerLobbySlot(playerId);
  const controllerUrl = getControllerUrl(playerId);
  const qrImage = document.createElement("img");
  qrImage.className = "qr-image";
  qrImage.alt = t("controllerQrAlt").replace("{player}", label.textContent);
  qrImage.src = getQrCodeUrl(controllerUrl);
  qrImage.title = controllerUrl;
  qrImage.addEventListener("error", () => {
    const placeholder = document.createElement("div");
    placeholder.className = "qr-placeholder";
    placeholder.setAttribute("aria-label", qrImage.alt);
    placeholder.title = controllerUrl;
    qrImage.replaceWith(placeholder);
  }, { once: true });

  const urlText = document.createElement("p");
  urlText.className = "qr-url";
  urlText.textContent = controllerUrl;

  const status = document.createElement("p");
  status.className = `qr-status qr-status--${getControllerSlotStatusClass(slot)}`;
  status.textContent = getControllerSlotStatusLabel(slot);

  card.append(label, qrImage, urlText, status);
  card.title = controllerUrl;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "-1");
  card.setAttribute("aria-label", qrImage.alt);
  card.addEventListener("click", () => openControllerWindow(controllerUrl));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openControllerWindow(controllerUrl);
    }
  });
  return card;
}

function openControllerWindow(controllerUrl) {
  const testUrl = new URL(controllerUrl);
  testUrl.searchParams.set("testWindow", "iphone16promax-landscape");
  const opened = window.open(testUrl.toString(), "_blank", "noopener,noreferrer,width=1000,height=460");
  if (!opened) console.warn("Controller-Fenster wurde vom Browser blockiert.", controllerUrl);
}

function getControllerSlotStatusClass(slot) {
  if (!slot) return "disconnected";
  if (slot.ready && slot.connected) return "ready";
  if (slot.ready && !slot.connected) return "lost";
  return slot.connectionState ?? "disconnected";
}

function getControllerSlotStatusLabel(slot) {
  if (!slot) return t("controllerSlotDisconnected");
  if (slot.ready && slot.connected) return t("controllerSlotReady").replace("{name}", slot.name || "-");
  if (slot.ready && !slot.connected) return t("controllerSlotLost").replace("{name}", slot.name || "-");
  if (slot.connected && (slot.name || slot.color)) return t("controllerSlotConfigured");
  if (slot.connected) return t("controllerSlotConnected");
  return t("controllerSlotDisconnected");
}

function renderProductionVfxOverlay() {
  if (productionVfx.items.length === 0) return null;

  const overlay = createSvgElement("svg", {
    class: "production-vfx-overlay",
    viewBox: `0 0 ${boardLayout.width} ${boardLayout.height}`,
    preserveAspectRatio: "xMidYMid meet",
    "aria-hidden": "true"
  });

  for (const event of productionVfx.items) {
    const delay = event.delay ?? 0;
    overlay.append(createSvgElement("circle", {
      class: "production-vfx-planet-pulse",
      cx: event.x,
      cy: event.y,
      r: 48,
      style: `--production-color: ${event.color}; --production-planet-ms: ${PRODUCTION_HIGHLIGHT_MS}ms; animation-delay: ${delay}ms;`
    }));
    overlay.append(createSvgElement("circle", {
      class: "production-vfx-chip-pulse",
      cx: event.x,
      cy: event.y,
      r: 19,
      style: `--production-color: ${event.color}; --production-chip-ms: ${PRODUCTION_CHIP_PULSE_MS}ms; animation-delay: ${delay + PRODUCTION_CHIP_DELAY_MS}ms;`
    }));

    for (const recipient of event.recipients ?? []) {
      const trailDelay = delay + PRODUCTION_TRAIL_DELAY_MS;
      overlay.append(createSvgElement("path", {
        class: "production-vfx-trail",
        d: `M ${event.x} ${event.y} L ${recipient.x} ${recipient.y}`,
        pathLength: "1",
        style: `--production-color: ${event.color}; --production-trail-ms: ${PRODUCTION_TRAIL_MS}ms; animation-delay: ${trailDelay}ms;`
      }));
      overlay.append(createSvgElement("circle", {
        class: "production-vfx-target-pulse",
        cx: recipient.x,
        cy: recipient.y,
        r: 26,
        style: `--production-color: ${recipient.playerColor}; --production-target-ms: ${PRODUCTION_TARGET_PULSE_MS}ms; animation-delay: ${trailDelay + PRODUCTION_TARGET_DELAY_MS}ms;`
      }));
      const label = createSvgElement("text", {
        class: "production-vfx-label",
        x: recipient.x,
        y: recipient.y - 32,
        "text-anchor": "middle",
        style: `--production-color: ${event.color}; --production-label-ms: ${PRODUCTION_LABEL_MS}ms; animation-delay: ${trailDelay + PRODUCTION_LABEL_DELAY_MS}ms;`
      });
      label.textContent = `+${Math.max(1, Number(recipient.amount) || 1)}`;
      overlay.append(label);
    }
  }

  return overlay;
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
  if (!state.controllerMode) {
    controls.append(createButton("⚙", () => openModal("settings"), "icon-button"));
  }

  const board = document.createElement("div");
  board.className = "board-placeholder";
  board.setAttribute("aria-label", t("boardAreaLabel"));
  board.append(...[
    renderShipEngineVfxCanvas("behind"),
    renderBoardSvg(),
    renderShipEngineVfxCanvas("inline"),
    renderProductionVfxOverlay(),
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
    state.controllerMode ? document.createDocumentFragment() : renderPlayerHudButtons(),
    renderPlayerHudModal(),
    renderSupernovaShipBattleModal(),
    renderEncounterModal(),
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
  content.dataset.scrollKey = getHudScrollKey(player.id, state.hudTab) ?? "";
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

function renderSupernovaShipBattleModal() {
  const battle = state.gameState?.supernova?.shipBattle;
  if (state.view !== "board" || !battle || battle.stage === "rolling") {
    return document.createDocumentFragment();
  }

  const overlay = document.createElement("div");
  overlay.className = `supernova-battle-overlay supernova-battle-overlay--${battle.stage}`;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const panel = document.createElement("section");
  panel.className = "supernova-battle-panel";
  const title = document.createElement("h2");
  title.textContent = t("supernovaBattleTitle");
  panel.append(title);

  const players = document.createElement("div");
  players.className = "supernova-battle-player-grid";
  players.append(
    renderSupernovaBattlePlayer(battle.attackerPlayerId, battle.attackerRoll, battle.attackerStrength, t("supernovaBattleAttacker")),
    renderSupernovaBattlePlayer(battle.defenderPlayerId, battle.defenderRoll, battle.defenderStrength, t("supernovaBattleDefender"))
  );
  panel.append(players);

  const status = document.createElement("p");
  status.className = "supernova-battle-status";
  if (battle.stage === "upgradeLoss") {
    const pendingPlayer = state.gameState.players.find((player) => player.id === battle.pendingUpgradePlayerId);
    status.textContent = t("supernovaBattleWaitingForUpgrade")
      .replace("{player}", pendingPlayer?.name ?? "");
  } else if (battle.stage === "completed") {
    status.textContent = getSupernovaBattleOutcomeText(battle);
  } else if (!battle.winnerPlayerId) {
    status.textContent = t("supernovaBattleTie");
  } else {
    const winner = state.gameState.players.find((player) => player.id === battle.winnerPlayerId);
    status.textContent = t("supernovaBattleWinner")
      .replace("{player}", winner?.name ?? "")
      .replace("{attack}", battle.attackerStrength ?? "-")
      .replace("{defense}", battle.defenderStrength ?? "-");
  }
  panel.append(status);
  if (battle.stage === "completed") {
    panel.append(createButton(t("supernovaBattleAcknowledge"), finishDisplayedSupernovaBattle, "menu-button"));
  }
  overlay.append(panel);
  return overlay;
}

function getSupernovaBattleOutcomeText(battle) {
  if (!battle?.winnerPlayerId) return "";
  const attacker = state.gameState?.players?.find((player) => player.id === battle.attackerPlayerId);
  const defender = state.gameState?.players?.find((player) => player.id === battle.defenderPlayerId);
  const winner = state.gameState?.players?.find((player) => player.id === battle.winnerPlayerId);
  const loser = state.gameState?.players?.find((player) => player.id === battle.loserPlayerId);
  const consequences = battle.consequences ?? {};
  const parts = [formatLocalizedText("supernovaBattleOutcomeRoll", {
    winner: winner?.name ?? "",
    attack: battle.attackerStrength ?? "-",
    defense: battle.defenderStrength ?? "-"
  })];

  if (consequences.lostUpgrade) {
    parts.push(formatLocalizedText("supernovaBattleOutcomeUpgradeLost", {
      player: loser?.name ?? "",
      upgrade: consequences.lostUpgrade
    }));
  } else if (consequences.upgradeLossSkipped) {
    parts.push(formatLocalizedText("supernovaBattleOutcomeNoUpgrade", { player: loser?.name ?? "" }));
  }
  if (consequences.transferredResourceCount !== undefined && battle.defenderShipType === "tradeShip") {
    parts.push(formatLocalizedText("supernovaBattleOutcomeResources", {
      winner: winner?.name ?? "",
      loser: loser?.name ?? "",
      count: consequences.transferredResourceCount
    }));
  }
  if (consequences.blockedShipId) {
    parts.push(formatLocalizedText("supernovaBattleOutcomeBlocked", {
      player: defender?.name ?? "",
      ...getPlayerGrammarParams(defender, state.language),
      ship: battle.defenderShipType
    }));
  }
  if (consequences.medalPlayerId) {
    parts.push(formatLocalizedText("supernovaBattleOutcomeMedal", { player: winner?.name ?? "" }));
  }
  if (consequences.destroyedShipId) {
    parts.push(formatLocalizedText("supernovaBattleOutcomeDestroyed", {
      player: loser?.name ?? "",
      ...getPlayerGrammarParams(loser, state.language)
    }));
  }
  return parts.filter(Boolean).join(" ");
}

function finishDisplayedSupernovaBattle() {
  const nextGameState = finishSupernovaShipBattle(state.gameState);
  if (nextGameState === state.gameState) return;
  state.gameState = nextGameState;
  saveCurrentGameState();
  render();
}

function renderSupernovaBattlePlayer(playerId, roll, strength, roleLabel) {
  const player = state.gameState?.players?.find((candidate) => candidate.id === playerId);
  const card = document.createElement("article");
  card.className = "supernova-battle-player";
  const role = document.createElement("span");
  role.className = "supernova-battle-role";
  role.textContent = roleLabel;
  const name = document.createElement("strong");
  name.textContent = player?.name ?? "";
  const visual = player ? renderMothershipUpgradeVisual(player) : document.createElement("div");
  visual.classList.add("supernova-battle-mothership");
  if (roll?.balls?.length === 2) {
    const pocket = document.createElement("div");
    pocket.className = "mothership-speed-ball-pocket supernova-battle-ball-pocket";
    applyMothershipSpeedSlotStyle(pocket);
    roll.balls.forEach((ball, index) => pocket.append(renderMothershipSpeedBall(ball, index, 1)));
    visual.append(pocket);
  }
  const value = document.createElement("span");
  value.className = "supernova-battle-value";
  value.textContent = strength === null || strength === undefined
    ? (roll ? t("supernovaBattleRollReady") : t("supernovaBattleRollPending"))
    : t("supernovaBattleStrength").replace("{value}", strength);
  card.append(role, name, visual, value);
  return card;
}

function renderEncounterModal() {
  const encounter = state.gameState?.activeEncounter;
  if (state.view !== "board" || !encounter) return document.createDocumentFragment();
  if (encounter.pendingStep?.type === "singleMothershipRoll" && encounter.pendingStep.roll) {
    return document.createDocumentFragment();
  }

  const overlay = document.createElement("div");
  const isBoardSelection = ["shipJumpSelection", "boardTargetSelection", "shipBlockSelection"].includes(encounter.pendingStep?.type);
  if (isBoardSelection && state.encounterBoardSelectionActive) return document.createDocumentFragment();
  overlay.className = `encounter-modal-overlay${isBoardSelection ? " encounter-modal-overlay--board-selection" : ""}`;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", isBoardSelection ? "false" : "true");

  const panel = document.createElement("section");
  panel.className = "encounter-modal-panel";
  panel.append(renderEncounterActions(getEncounterActionPlayer()));
  overlay.append(panel);
  return overlay;
}

function getEncounterActionPlayer() {
  const encounter = state.gameState?.activeEncounter;
  let pendingOwnerPlayerId = getActivePlayer()?.id;
  if (encounter?.pendingStep?.type === "opponentResourceGiftSelection") {
    pendingOwnerPlayerId = encounter.pendingStep.currentGiverPlayerId;
  } else if (encounter?.pendingStep?.type === "globalUpgradeLossSelection") {
    pendingOwnerPlayerId = encounter.pendingStep.currentTargetPlayerId;
  } else if (encounter?.pendingStep?.type === "dualMothershipRoll") {
    pendingOwnerPlayerId = getDualMothershipRollActionPlayerId(encounter.pendingStep) ?? pendingOwnerPlayerId;
  } else if (encounter?.pendingStep?.type === "singleMothershipRoll") {
    pendingOwnerPlayerId = encounter.pendingStep.activePlayerId ?? pendingOwnerPlayerId;
  } else if (encounter?.pendingStep?.type === "driveComparisonPreview") {
    pendingOwnerPlayerId = encounter.pendingStep.activePlayerId ?? pendingOwnerPlayerId;
  }

  return state.gameState?.players?.find((player) => player.id === pendingOwnerPlayerId)
    ?? getActivePlayer();
}

function getDualMothershipRollActionPlayerId(pendingStep) {
  if (!pendingStep || pendingStep.type !== "dualMothershipRoll") return null;
  if (!pendingStep.activeRoll) return pendingStep.activePlayerId ?? null;
  if (!pendingStep.targetRoll) return pendingStep.targetPlayerId ?? null;
  return pendingStep.activePlayerId ?? null;
}

function isDualMothershipRollParticipant(pendingStep, playerId) {
  return Boolean(
    pendingStep?.type === "dualMothershipRoll" &&
    playerId &&
    (pendingStep.activePlayerId === playerId || pendingStep.targetPlayerId === playerId)
  );
}

function hasDualMothershipRollForPlayer(pendingStep, playerId) {
  if (!isDualMothershipRollParticipant(pendingStep, playerId)) return false;
  return pendingStep.activePlayerId === playerId
    ? Boolean(pendingStep.activeRoll)
    : Boolean(pendingStep.targetRoll);
}

function isDriveComparisonParticipant(pendingStep, playerId) {
  return Boolean(
    pendingStep?.type === "driveComparisonPreview" &&
    playerId &&
    (pendingStep.activePlayerId === playerId || pendingStep.targetPlayerId === playerId)
  );
}

function renderPlayerHudTabs() {
  const tabs = document.createElement("div");
  tabs.className = "player-hud-tabs";
  const tabDefinitions = [
    ["turn", t("tabTurn")],
    ["resources", t("tabTrade")],
    ["upgrades", t("tabUpgrades")],
    ["build", t("tabBuild")],
    ["outposts", t("tabOutposts")],
    ["overview", t("tabOverview")]
  ];

  for (const [tabId, label] of tabDefinitions) {
    const button = createButton(label, () => {
      if (state.hudTab !== tabId) {
        state.hudScrollPositions = {
          ...state.hudScrollPositions,
          [`${state.hudPlayerId}:${tabId}`]: 0
        };
      }
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
  } else if (state.hudTab === "build") {
    content.append(renderBuildControls(player));
  } else if (state.hudTab === "outposts") {
    content.append(renderFriendshipSummary(player));
  } else if (state.hudTab === "overview") {
    content.append(renderPlayerOverview(player));
  } else {
    content.append(renderPhaseActions(player));
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
    value.className = isResourceGainFlashing(player?.id, resource) ? "is-resource-gain-flash" : "";
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
    gameState?.activeEncounter ? `${t("encounter")}` : null,
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
    value.className = isResourceGainFlashing(player?.id, resource) ? "is-resource-gain-flash" : "";
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

function renderPlayerOverview(player = getActivePlayer()) {
  const wrapper = document.createElement("div");
  wrapper.className = "fleet-summary player-overview";

  const title = document.createElement("strong");
  title.textContent = t("tabOverview");

  const structures = state.gameState?.board?.structures?.filter((structure) => structure.ownerPlayerId === player?.id) ?? [];
  const ships = state.gameState?.board?.ships?.filter((ship) => ship.ownerPlayerId === player?.id) ?? [];
  const rows = [
    [t("victoryPoints"), player ? calculateVictoryPoints(state.gameState, player.id) : 0],
    [t("ships"), ships.length],
    ...(isSupernovaGame(state.gameState) ? [[t("battleShips"), ships.filter((ship) => ship.type === "battleShip").length]] : []),
    [t("colonies"), structures.filter((structure) => structure.type === "colony").length],
    [t("spaceports"), structures.filter((structure) => structure.type === "spaceport").length],
    [t("tradeStations"), structures.filter((structure) => structure.type === "tradeStation").length],
    [t("medals"), formatMedals(player)]
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

function formatMedals(player) {
  const medals = Math.max(0, player?.halfMedals ?? 0) / 2;
  return medals.toLocaleString(state.language === "de" ? "de-DE" : "en-US", {
    minimumFractionDigits: medals % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  });
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
    const flightButton = createButton(t("toFlightPhase"), goToFlightPhase, "small-button");
    flightButton.disabled = Boolean(state.gameState.supernova?.pendingFactoryPlacement);
    wrapper.append(flightButton);
  } else if (state.gameState.phase === "flight") {
    if (!state.gameState.hasRolledFlightSpeed) {
      wrapper.append(renderSupplyDrawControls());
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

  if (drawCount > 0 && canDrawSupply(state.gameState)) {
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
  if (encounter.pendingStep?.type === "message") {
    wrapper.append(renderEncounterMessage(
      encounter.pendingStep,
      !state.controllerMode && player?.id === activePlayer?.id
    ));
    return wrapper;
  }
  const hasAdvancedEncounter = Boolean(encounter.choiceId || encounter.pendingStep || encounter.status === "resolved");
  const currentText = getLocalizedEncounterText(hasAdvancedEncounter ? encounter.resultText : card.prompt);
  if (currentText) {
    const prompt = document.createElement("p");
    prompt.className = "encounter-prompt";
    prompt.textContent = currentText;
    wrapper.append(prompt);
  }

  const stepResultText = getLocalizedEncounterText(encounter.resultText);
  if (encounter.status !== "resolved" && stepResultText && stepResultText !== currentText) {
    const stepResult = document.createElement("p");
    stepResult.className = "encounter-step-result";
    stepResult.textContent = stepResultText;
    wrapper.append(stepResult);
  }

  if (encounter.status === "resolved") {
    if (!currentText) {
      const result = document.createElement("p");
      result.textContent = t("movementAfterEncounter");
      wrapper.append(result);
    }
    if (state.controllerMode) {
      return wrapper;
    }
    if (player?.id === activePlayer?.id) {
      wrapper.append(createButton(t("finishEncounter"), finishActiveEncounter, "small-button"));
    } else {
      const waiting = document.createElement("p");
      waiting.textContent = t("notYourTurn");
      wrapper.append(waiting);
    }
    return wrapper;
  }

  if (state.controllerMode) {
    return wrapper;
  }

  if (encounter.pendingStep?.type === "dualMothershipRoll") {
    wrapper.append(renderEncounterDualMothershipRoll(encounter.pendingStep, player));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "singleMothershipRoll") {
    wrapper.append(renderEncounterSingleMothershipRoll(encounter.pendingStep, player));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "driveComparisonPreview") {
    wrapper.append(renderEncounterDriveComparisonPreview(encounter.pendingStep, player));
    return wrapper;
  }

  const pendingOwnerPlayerId = encounter.pendingStep?.type === "opponentResourceGiftSelection"
    ? encounter.pendingStep.currentGiverPlayerId
    : encounter.pendingStep?.type === "globalUpgradeLossSelection"
      ? encounter.pendingStep.currentTargetPlayerId
      : activePlayer?.id;

  if (player?.id !== pendingOwnerPlayerId) {
    const waiting = document.createElement("p");
    waiting.textContent = t("notYourTurn");
    wrapper.append(waiting);
    return wrapper;
  }

  if (encounter.pendingStep?.type === "choiceSelection") {
    wrapper.append(renderEncounterChoiceSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "resourceSelection") {
    wrapper.append(renderEncounterResourceSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "upgradeSelection") {
    wrapper.append(renderEncounterUpgradeSelection(encounter.pendingStep));
    return wrapper;
  }

  if (encounter.pendingStep?.type === "shipBlockSelection") {
    wrapper.append(renderEncounterShipBlockSelection(encounter.pendingStep));
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
  const chooseHint = document.createElement("p");
  chooseHint.textContent = t("encounterChoose");
  choiceList.append(chooseHint);
  for (const choice of card.choices ?? []) {
    const label = getLocalizedEncounterText(choice.label) || choice.id;
    const button = createButton(label, () => resolveActiveEncounterChoice(choice.id), "small-button");
    button.disabled = !isEncounterChoiceAvailable(choice, activePlayer);
    choiceList.append(button);
  }
  wrapper.append(choiceList);
  return wrapper;
}

function renderEncounterMessage(pendingStep, canContinue) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-message-step";
  const titleText = getLocalizedEncounterText(pendingStep.titleText);
  const bodyText = getLocalizedEncounterText(pendingStep.bodyText);
  const detailText = getLocalizedEncounterText(pendingStep.detailText);
  if (titleText) {
    const title = document.createElement("h2");
    title.textContent = titleText;
    wrapper.append(title);
  }
  for (const text of [bodyText, detailText]) {
    if (!text) continue;
    const paragraph = document.createElement("p");
    paragraph.className = "encounter-prompt";
    paragraph.textContent = text;
    wrapper.append(paragraph);
  }
  if (canContinue) {
    wrapper.append(createButton(t("continue"), () => submitEncounterPendingAction(), "small-button"));
  }
  return wrapper;
}

function renderEncounterDualMothershipRoll(pendingStep, player) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const prompt = document.createElement("p");
  prompt.textContent = t("encounterMothershipRollPrompt");
  wrapper.append(prompt);

  if (!isDualMothershipRollParticipant(pendingStep, player?.id)) {
    const waiting = document.createElement("p");
    waiting.textContent = t("notYourTurn");
    wrapper.append(waiting);
    return wrapper;
  }

  if (hasDualMothershipRollForPlayer(pendingStep, player.id)) {
    const waiting = document.createElement("p");
    waiting.textContent = t("encounterMothershipRollDone");
    wrapper.append(waiting);
    return wrapper;
  }

  wrapper.append(createButton(
    t("encounterMothershipRollButton"),
    () => submitEncounterPendingAction({ playerId: player.id }),
    "small-button"
  ));
  return wrapper;
}

function renderEncounterSingleMothershipRoll(pendingStep, player) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const prompt = document.createElement("p");
  prompt.textContent = t("encounterSingleMothershipRollPrompt");
  wrapper.append(prompt);

  if (player?.id !== pendingStep.activePlayerId) {
    const waiting = document.createElement("p");
    waiting.textContent = t("notYourTurn");
    wrapper.append(waiting);
    return wrapper;
  }

  if (pendingStep.roll) {
    const waiting = document.createElement("p");
    waiting.textContent = t("encounterSingleMothershipRollDone");
    wrapper.append(waiting);
    return wrapper;
  }

  wrapper.append(createButton(
    t("encounterMothershipRollButton"),
    () => submitEncounterPendingAction({ playerId: player.id }),
    "small-button"
  ));
  return wrapper;
}

function renderEncounterDriveComparisonPreview(pendingStep, player) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-drive-preview";
  const previewReady = isDriveComparisonPreviewReady(pendingStep);
  const title = document.createElement("strong");
  title.textContent = t("encounterDriveComparisonTitle");
  wrapper.append(title);

  const activePlayer = state.gameState?.players?.find((candidate) => candidate.id === pendingStep.activePlayerId);
  const targetPlayer = state.gameState?.players?.find((candidate) => candidate.id === pendingStep.targetPlayerId);
  const grid = document.createElement("div");
  grid.className = "encounter-drive-preview-grid";
  grid.append(
    renderEncounterDriveComparisonPlayer(activePlayer, pendingStep.active),
    renderEncounterDriveComparisonPlayer(targetPlayer, pendingStep.target)
  );
  wrapper.append(grid);

  const hint = document.createElement("p");
  hint.className = "encounter-step-result";
  hint.textContent = previewReady
    ? getLocalizedEncounterText(state.gameState?.activeEncounter?.resultText) || ""
    : t("encounterDriveComparisonActiveWait");
  wrapper.append(hint);

  if (player?.id === pendingStep.activePlayerId) {
    const continueButton = createButton(t("continue"), () => submitEncounterPendingAction(), "small-button");
    continueButton.disabled = !previewReady;
    wrapper.append(continueButton);
  } else {
    const waiting = document.createElement("p");
    waiting.textContent = isDriveComparisonParticipant(pendingStep, player?.id)
      ? t("encounterDriveComparisonPassiveWait").replace("{player}", pendingStep.active?.playerName ?? "")
      : t("notYourTurn");
    wrapper.append(waiting);
  }
  return wrapper;
}

function isDriveComparisonPreviewReady(pendingStep) {
  const key = [
    pendingStep?.activePlayerId ?? "",
    pendingStep?.targetPlayerId ?? "",
    pendingStep?.outcome ?? "",
    pendingStep?.active?.effectiveDrives ?? 0,
    pendingStep?.target?.effectiveDrives ?? 0
  ].join(":");
  const now = Date.now();
  if (state.driveComparisonPreviewKey !== key) {
    state.driveComparisonPreviewKey = key;
    state.driveComparisonPreviewStartedAt = now;
    window.setTimeout(render, DRIVE_COMPARISON_PREVIEW_MS);
    return false;
  }
  return now - state.driveComparisonPreviewStartedAt >= DRIVE_COMPARISON_PREVIEW_MS;
}

function renderEncounterDriveComparisonPlayer(player, entry) {
  const card = document.createElement("div");
  card.className = "encounter-drive-preview-card";
  const name = document.createElement("strong");
  name.textContent = entry?.playerName || player?.name || "";
  card.append(name);
  if (player) card.append(renderMothershipUpgradeVisual(player));

  const value = document.createElement("p");
  value.className = "encounter-drive-preview-value";
  value.textContent = formatDriveComparisonValue(entry);
  card.append(value);
  return card;
}

function formatDriveComparisonValue(entry) {
  const physicalDrives = entry?.physicalDrives ?? 0;
  const friendshipBonus = entry?.friendshipBonus ?? 0;
  const effectiveDrives = entry?.effectiveDrives ?? physicalDrives + friendshipBonus;
  if (friendshipBonus > 0) {
    return `Antriebe: ${physicalDrives} + ${friendshipBonus} Bonus = ${effectiveDrives}`;
  }
  return `Antriebe: ${physicalDrives}`;
}

function renderEncounterChoiceSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const promptText = getLocalizedEncounterText(pendingStep.promptText);
  if (promptText) {
    const prompt = document.createElement("p");
    prompt.textContent = promptText;
    wrapper.append(prompt);
  }

  for (const choice of pendingStep.choices ?? []) {
    const label = getLocalizedEncounterText(choice.label) || choice.id;
    wrapper.append(createButton(label, () => submitEncounterPendingAction({ choiceId: choice.id }), "small-button"));
  }
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

  wrapper.append(createButton(t("encounterSelectJumpShip"), () => {
    state.encounterBoardSelectionActive = true;
    render();
  }, "small-button"));

  return wrapper;
}

function renderEncounterTargetSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";

  wrapper.append(createButton(t("encounterSelectTargetPoint"), () => {
    state.encounterBoardSelectionActive = true;
    render();
  }, "small-button"));
  return wrapper;
}

function renderEncounterShipBlockSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const hintText = getLocalizedEncounterText(pendingStep.hint);
  if (hintText) {
    const hint = document.createElement("p");
    hint.textContent = hintText;
    wrapper.append(hint);
  }

  wrapper.append(createButton(t("encounterSelectJumpShip"), () => {
    state.encounterBoardSelectionActive = true;
    render();
  }, "small-button"));
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
  const pendingFactoryPlacement = state.gameState?.supernova?.pendingFactoryPlacement;
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
  if (pendingFactoryPlacement) {
    const pending = document.createElement("p");
    const factoryType = supernovaFactoryTypes.find((candidate) => candidate.id === pendingFactoryPlacement.factoryType);
    pending.textContent = t("supernovaFactoryChoosePlanet")
      .replace("{factory}", getSupernovaLocalizedTitle(factoryType, state.language));
    wrapper.append(pending, createButton(t("cancelFactoryBuild"), cancelActiveFactoryPlacement, "small-button secondary-small-button"));
  }

  for (const action of buildActionDefinitions.filter((definition) => !definition.variant || isSupernovaGame(state.gameState))) {
    const card = document.createElement("article");
    card.className = "upgrade-card upgrade-card--menu build-action-card";

    const preview = document.createElement("div");
    preview.className = "upgrade-card-preview build-action-card-preview blueprint-preview";

    const image = document.createElement("img");
    image.className = "upgrade-card-blueprint build-action-blueprint";
    image.src = upgradeMenuAssetPaths.buildBlueprints[action.id];
    image.alt = "";
    image.loading = "lazy";
    preview.append(image);

    const body = document.createElement("div");
    body.className = "upgrade-card-body";

    const label = document.createElement("strong");
    label.className = "upgrade-card-title";
    label.textContent = getBuildActionLabel(action.id);

    const cost = document.createElement("small");
    cost.className = "upgrade-card-cost";
    cost.textContent = `${t("cost")}: ${formatCost(action.cost)}`;

    const disabledReasonKey = getBuildUnavailableReason(player, action);
    const button = createButton(t("build"), () => runBuildAction(action.id), "small-button");
    button.disabled = Boolean(pendingShipPlacement) || Boolean(pendingSpaceportUpgrade) || Boolean(pendingFactoryPlacement) || !canTradeBuildActions(player) || !canPlayerBuild(player, action);

    const actions = document.createElement("div");
    actions.className = "upgrade-card-actions";
    actions.append(button, cost);

    body.append(label);
    if (disabledReasonKey) {
      const hint = document.createElement("small");
      hint.className = "upgrade-card-bonus";
      hint.textContent = t(disabledReasonKey);
      body.append(hint);
    }
    body.append(actions);
    card.append(preview, body);
    wrapper.append(card);
  }

  if (isSupernovaGame(state.gameState)) {
    const factoryOptions = getBuildableSupernovaFactoryOptions(state.gameState, boardLayout, player?.id);
    const factoryCount = (state.gameState.supernova?.factories ?? [])
      .filter((factory) => factory.ownerPlayerId === player?.id)
      .length;
    const factoryLimitReached = factoryCount >= supernovaFactoryLimitPerPlayer;
    const factoryTitle = document.createElement("strong");
    factoryTitle.textContent = t("supernovaFactories");
    const factoryStock = document.createElement("small");
    factoryStock.className = "upgrade-card-bonus";
    factoryStock.textContent = t("supernovaFactoryStock")
      .replace("{built}", factoryCount)
      .replace("{limit}", supernovaFactoryLimitPerPlayer);
    wrapper.append(factoryTitle, factoryStock);
    for (const factoryType of supernovaFactoryTypes) {
      const option = factoryOptions.find((candidate) => candidate.factoryType === factoryType.id);
      const card = document.createElement("article");
      card.className = "upgrade-card upgrade-card--menu build-action-card";
      const preview = document.createElement("div");
      preview.className = "upgrade-card-preview factory-build-preview blueprint-preview";
      const image = document.createElement("img");
      image.className = "upgrade-card-blueprint factory-build-blueprint";
      image.src = getFactoryBlueprintAssetPath(factoryType.id) ?? "";
      image.alt = "";
      preview.append(image);
      const body = document.createElement("div");
      body.className = "upgrade-card-body";
      const label = document.createElement("strong");
      label.className = "upgrade-card-title";
      label.textContent = getSupernovaLocalizedTitle(factoryType, state.language);
      const cost = document.createElement("small");
      cost.className = "upgrade-card-cost";
      cost.textContent = `${t("cost")}: ${formatCost(factoryType.cost)}`;
      const hint = document.createElement("small");
      hint.className = "upgrade-card-bonus";
      const availability = factoryLimitReached
        ? t("supernovaFactoryLimitReached")
        : option ? t("supernovaFactorySiteAvailable") : t("noFactorySiteAvailable");
      hint.textContent = `${t("supernovaFactoryProduces").replace("{resource}", t(`resource_${factoryType.resource}`))} · ${availability}`;
      const button = createButton(t("build"), () => beginActivePlayerSupernovaFactoryPlacement(factoryType.id), "small-button");
      button.disabled = Boolean(pendingShipPlacement) || Boolean(pendingSpaceportUpgrade) || Boolean(pendingFactoryPlacement) || !option?.canBuild;
      const actions = document.createElement("div");
      actions.className = "upgrade-card-actions";
      actions.append(button, cost);
      body.append(label, hint, actions);
      card.append(preview, body);
      wrapper.append(card);
    }
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
    preview.className = "upgrade-card-preview blueprint-preview";

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

function getControllerPlacementTurnHint(step) {
  if (step === "placeSpaceport") return t("controllerPlacementTurnSpaceport");
  if (step === "placeColonyShip") return t("controllerPlacementTurnColonyShip");
  if (["placeFirstColony", "placeSecondColony"].includes(step)) return t("controllerPlacementTurnColony");
  return "";
}

function getControllerPlacementBoardHint(step) {
  if (step === "placeSpaceport") return t("controllerPlacementBoardSpaceport");
  if (step === "placeColonyShip") return t("controllerPlacementBoardColonyShip");
  if (["placeFirstColony", "placeSecondColony"].includes(step)) return t("controllerPlacementBoardColony");
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

function formatLocalizedText(key, params = {}) {
  return Object.entries(params).reduce(
    (text, [paramKey, value]) => text.replaceAll(`{${paramKey}}`, formatMessageParam(paramKey, value)),
    t(key)
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
    const point = boardPointsById.get(selectedElement.id);
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
    ?? boardPointsById.get(structure.locationId);
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
    .map((hexId) => boardHexesById.get(hexId))
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

  const previousFactoryIds = new Set((previousGameState.supernova?.factories ?? []).map((factory) => factory.id));
  for (const factory of nextGameState.supernova?.factories ?? []) {
    if (!previousFactoryIds.has(factory.id)) queuePlacementVfx("factory", factory);
  }
}

function queuePlacementVfx(targetType, target) {
  const position = targetType === "ship"
    ? getPlacementVfxShipPosition(target)
    : targetType === "factory"
      ? getFactoryRenderPlacement(target)
      : getPlacementVfxStructurePosition(target);
  if (!position) return;

  audioManager.play("buildComplete");
  const now = getAnimationNow();
  const owner = state.gameState?.players?.find((player) => player.id === target.ownerPlayerId);
  placementVfx.items.push({
    id: `placement-vfx-${placementVfx.nextId++}`,
    targetType,
    targetId: target.id,
    objectType: target.type,
    x: position.x,
    y: position.y,
    playerColor: playerDiceColors[owner?.color] ?? "#7dd3fc",
    reducedMotion: Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
    startTime: now,
    seed: createPlacementVfxSeed(target.id, now)
  });
  startPlacementVfxLoop();
}

function getPlacementVfxShipPosition(ship) {
  const point = boardPointsById.get(ship.locationId);
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
  if (animationScheduler.has(placementAnimationId) || placementVfx.items.length === 0) return;
  animationScheduler.start(placementAnimationId, updatePlacementVfx);
}

function updatePlacementVfx(now) {
  const affectedItems = placementVfx.items.slice();
  placementVfx.currentTime = now;
  placementVfx.items = placementVfx.items.filter((item) => now - item.startTime < getPlacementVfxDuration(item));
  runtimePerformanceMetrics.placementAnimationFrames += 1;
  updatePlacementVfxDom(affectedItems);
  if (placementVfx.items.length === 0) placementVfx.currentTime = 0;
  return placementVfx.items.length > 0;
}

function updatePlacementVfxDom(affectedItems) {
  if (state.view !== "board") return;
  const boardSvg = document.querySelector(".board-placeholder .board-svg");
  if (!boardSvg) return;

  const currentLayer = boardSvg.querySelector(".placement-vfx-layer");
  currentLayer?.replaceWith(renderPlacementVfxLayer());

  for (const item of affectedItems) {
    const target = boardSvg.querySelector(
      `[data-board-type='${item.targetType}'][data-board-id='${cssEscape(item.targetId)}']`
    );
    if (!target) continue;
    if (item.targetType === "ship") {
      updatePlacedShipElement(target, item.targetId);
    } else if (item.targetType === "structure") {
      updatePlacedStructureElement(target, item.targetId);
    } else if (item.targetType === "factory") {
      updatePlacedFactoryElement(target, item.targetId);
    }
  }
}

function updatePlacedShipElement(group, shipId) {
  const ship = state.gameState?.board?.ships?.find((candidate) => candidate.id === shipId);
  const point = ship ? boardPointsById.get(ship.locationId) : null;
  if (!ship || !point) return;
  const visual = getShipVisualDefaults(ship);
  const pop = getPlacementAssetPop("ship", ship.id);
  const pose = { x: point.x, y: point.y, angle: getShipVisualAngle(ship.id) };
  const image = group.querySelector(".ship-image");
  if (image) {
    image.setAttribute("x", String(pose.x - visual.width / 2));
    image.setAttribute("y", String(pose.y - visual.height / 2));
    image.setAttribute("opacity", String(pop.opacity));
    image.setAttribute("transform", [
      createPlacementTransform(pose.x, pose.y, 0, pop),
      `rotate(${(pose.angle * 180) / Math.PI} ${pose.x} ${pose.y})`
    ].filter(Boolean).join(" "));
  }
  group.querySelector(".ship-coil-vfx")?.setAttribute("opacity", String(pop.opacity));
}

function updatePlacedStructureElement(group, structureId) {
  const structure = state.gameState?.board?.structures?.find((candidate) => candidate.id === structureId);
  const site = structure ? getStructureRenderPoint(structure) : null;
  if (!structure || !site || !["colony", "spaceport"].includes(structure.type)) return;
  const visual = structure.type === "spaceport"
    ? playerPieceVisualDefaults.spaceport
    : playerPieceVisualDefaults.colony;
  const placement = getStructureVisualPlacement(structure, site, visual);
  const pop = getPlacementAssetPop("structure", structure.id);
  const image = group.querySelector(structure.type === "spaceport" ? ".spaceport-image" : ".colony-image");
  if (!image) return;
  image.setAttribute("opacity", String(pop.opacity));
  image.setAttribute("transform", createPlacementTransform(placement.x, placement.y, placement.rotation, pop));
}

function updatePlacedFactoryElement(group, factoryId) {
  const factory = state.gameState?.supernova?.factories?.find((candidate) => candidate.id === factoryId);
  const placement = factory ? getFactoryRenderPlacement(factory) : null;
  if (!factory || !placement) return;
  const pop = getPlacementAssetPop("factory", factory.id);
  group.setAttribute("opacity", String(pop.opacity));
  group.setAttribute(
    "transform",
    `translate(${placement.x + pop.wobbleX} ${placement.y + pop.wobbleY}) scale(${pop.scale})`
  );
}

function getAnimationNow() {
  return animationScheduler.now();
}

function getPlacementVfxTime() {
  return placementVfx.currentTime || getAnimationNow();
}

function getActivePlacementVfx(targetType, targetId) {
  const now = getPlacementVfxTime();
  return placementVfx.items
    .filter((item) => item.targetType === targetType && item.targetId === targetId && now - item.startTime < getPlacementVfxDuration(item))
    .at(-1) ?? null;
}

function getPlacementVfxDuration(item) {
  return item?.reducedMotion ? 280 : placementVfxDuration;
}

function getPlacementAssetPop(targetType, targetId) {
  const item = getActivePlacementVfx(targetType, targetId);
  if (!item) return { opacity: 1, scale: 1, wobbleX: 0, wobbleY: 0 };

  const progress = clamp01((getPlacementVfxTime() - item.startTime) / getPlacementVfxDuration(item));
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

function queueDiceRollAnimation(player, dice, onComplete = null) {
  if (!player || !Array.isArray(dice) || dice.length !== 2 || isDiceRollAnimating()) return false;

  const now = getAnimationNow();
  const seed = createDiceRollSeed(player.id, dice, now);
  const duration = 760 + seededRandom(seed, 1) * 360;
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
    onComplete,
    start: {
      x: 0.24 + seededRandom(seed, 2) * 0.2,
      y: 0.16 + seededRandom(seed, 3) * 0.18
    },
    end: {
      x: 0.5 + (seededRandom(seed, 4) - 0.5) * 0.18,
      y: 0.47 + (seededRandom(seed, 5) - 0.5) * 0.16
    },
    spread: 0.16 + seededRandom(seed, 6) * 0.055,
    direction: (seededRandom(seed, 7) - 0.5) * Math.PI * 0.55,
    fallHeight: 42 + seededRandom(seed, 12) * 34,
    spin: [
      createDice3dSpin(seed, 0),
      createDice3dSpin(seed, 1)
    ]
  };
  audioManager.play("diceRoll");
  startDiceRollLoop();
  return true;
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
  if (animationScheduler.has(diceAnimationId) || !diceRollAnimation.item) return;
  animationScheduler.start(diceAnimationId, updateDiceRollAnimation);
}

function updateDiceRollAnimation(now) {
  diceRollAnimation.currentTime = now;
  const item = diceRollAnimation.item;
  if (item && !item.resultSoundPlayed && now - item.startTime >= item.duration) {
    item.resultSoundPlayed = true;
    audioManager.play("diceResult");
  }
  if (!item || now - item.startTime >= item.duration + item.holdDuration + item.fadeDuration) {
    const onComplete = item?.onComplete;
    diceRollAnimation.item = null;
    diceRollAnimation.currentTime = 0;
    if (typeof onComplete === "function") onComplete();
    render();
    return false;
  }
  updateDice3dOverlayDom();
  return true;
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

function ensurePendingSingleMothershipRollAnimation() {
  const encounter = state.gameState?.activeEncounter;
  const pendingStep = encounter?.pendingStep;
  if (state.view !== "board" || pendingStep?.type !== "singleMothershipRoll" || !pendingStep.roll) {
    state.singleMothershipRollAnimationKey = null;
    return;
  }

  const key = [
    encounter.cardId ?? "",
    pendingStep.activePlayerId ?? "",
    pendingStep.roll.balls?.join("-") ?? "",
    pendingStep.roll.total ?? 0
  ].join(":");
  if (state.singleMothershipRollAnimationKey === key) return;

  const player = state.gameState?.players?.find((candidate) => candidate.id === pendingStep.activePlayerId);
  if (!player) return;

  state.singleMothershipRollAnimationKey = key;
  const queued = queueMothershipSpeedAnimation(player, {
    balls: pendingStep.roll.balls,
    baseSpeed: pendingStep.roll.total,
    encounterTriggered: false
  }, {
    totalSpeed: pendingStep.roll.total,
    onComplete: () => {
      const currentEncounter = state.gameState?.activeEncounter;
      const currentPendingStep = currentEncounter?.pendingStep;
      const currentKey = currentPendingStep?.type === "singleMothershipRoll" && currentPendingStep.roll
        ? [
          currentEncounter.cardId ?? "",
          currentPendingStep.activePlayerId ?? "",
          currentPendingStep.roll.balls?.join("-") ?? "",
          currentPendingStep.roll.total ?? 0
        ].join(":")
        : "";
      if (currentKey !== key) return;

      state.gameState = submitEncounterPending(state.gameState, {
        playerId: currentPendingStep.activePlayerId,
        completeRoll: true
      });
      saveCurrentGameState();
    }
  });
  if (!queued) state.singleMothershipRollAnimationKey = null;
}

function ensureSupernovaBattleReveal() {
  const battle = state.gameState?.supernova?.shipBattle;
  if (state.view !== "board" || battle?.stage !== "reveal") {
    state.supernovaBattleRevealKey = null;
    return;
  }
  const key = [
    battle.id ?? "",
    battle.round ?? 1,
    battle.attackerRoll?.balls?.join("-") ?? "",
    battle.defenderRoll?.balls?.join("-") ?? ""
  ].join(":");
  if (state.supernovaBattleRevealKey === key) return;
  state.supernovaBattleRevealKey = key;
  audioManager.play("battleImpact");

  window.setTimeout(() => {
    const currentBattle = state.gameState?.supernova?.shipBattle;
    const currentKey = currentBattle?.stage === "reveal"
      ? [
        currentBattle.id ?? "",
        currentBattle.round ?? 1,
        currentBattle.attackerRoll?.balls?.join("-") ?? "",
        currentBattle.defenderRoll?.balls?.join("-") ?? ""
      ].join(":")
      : "";
    if (currentKey !== key) return;
    state.gameState = completeSupernovaShipBattleReveal(state.gameState);
    saveCurrentGameState();
    render();
  }, SUPERNOVA_BATTLE_REVEAL_MS);
}

function queueMothershipSpeedAnimation(player, flightRoll, options = {}) {
  if (!player || !Array.isArray(flightRoll?.balls) || flightRoll.balls.length !== 2) return false;

  const now = getAnimationNow();
  const animationOptions = typeof options === "function" ? { onComplete: options } : options;
  const seed = createMothershipSpeedSeed(player.id, flightRoll.balls, now);
  const shakeCycles = MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES
    + Math.floor(Math.random() * (MOTHERSHIP_SPEED_MAX_SHAKE_CYCLES - MOTHERSHIP_SPEED_MIN_SHAKE_CYCLES + 1));
  mothershipSpeedAnimation.currentTime = now;
  mothershipSpeedAnimation.item = {
    playerId: player.id,
    balls: flightRoll.balls.slice(0, 2),
    baseSpeed: flightRoll.baseSpeed,
    totalSpeed: animationOptions.totalSpeed ?? state.gameState?.flightSpeedTotal ?? flightRoll.baseSpeed,
    encounterTriggered: Boolean(flightRoll.encounterTriggered),
    startTime: now,
    seed,
    shakeCycles,
    resultSoundPlayed: false,
    onComplete: animationOptions.onComplete
  };
  audioManager.play("diceRoll");
  startMothershipSpeedLoop();
  return true;
}

function isMothershipSpeedAnimating() {
  const item = mothershipSpeedAnimation.item;
  if (!item) return false;
  return getAnimationNow() - item.startTime < getMothershipSpeedTotalDuration(item);
}

function startMothershipSpeedLoop() {
  if (animationScheduler.has(mothershipAnimationId) || !mothershipSpeedAnimation.item) return;
  animationScheduler.start(mothershipAnimationId, updateMothershipSpeedAnimation);
}

function updateMothershipSpeedAnimation(now) {
  mothershipSpeedAnimation.currentTime = now;
  const item = mothershipSpeedAnimation.item;
  if (
    item
    && !item.resultSoundPlayed
    && now - item.startTime >= MOTHERSHIP_SPEED_APPEAR_MS + getMothershipSpeedShakeDuration(item)
  ) {
    item.resultSoundPlayed = true;
    audioManager.play("diceResult");
  }
  if (!item || now - item.startTime >= getMothershipSpeedTotalDuration(item)) {
    const onComplete = item?.onComplete;
    mothershipSpeedAnimation.item = null;
    mothershipSpeedAnimation.currentTime = 0;
    if (typeof onComplete === "function") {
      onComplete();
    } else if (state.gameState?.phase === "flight" && state.gameState.pendingFlightEncounter) {
      state.gameState = startPendingFlightEncounter(state.gameState);
      state.hudPlayerId = null;
      state.encounterBoardSelectionActive = false;
      saveCurrentGameState();
    }
    render();
    return false;
  }
  updateMothershipSpeedOverlayDom();
  return true;
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
  pruneShipWeaponBursts(getShipVfxTime());
  if (shipFlightAnimation.items.length === 0 && shipEngineTrails.length === 0 && shipWeaponBursts.length === 0) return;

  targetContext.setTransform(width / boardLayout.width, 0, 0, height / boardLayout.height, 0, 0);
  const time = getShipVfxTime();
  for (const ship of state.gameState?.board?.ships ?? []) {
    if (!isShipFlightAnimating(ship.id)) continue;
    const point = boardPointsById.get(ship.locationId);
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
  for (const burst of shipWeaponBursts) {
    drawShipWeaponBurstVfx(targetContext, burst, layerName, time);
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
  const dice = [...scene.querySelectorAll(".dice3d-die")];
  if (dice.length !== 2) {
    scene.replaceChildren(
      renderDice3dDie(item, 0, rollingProgress),
      renderDice3dDie(item, 1, rollingProgress)
    );
    return;
  }
  dice.forEach((die, index) => applyDice3dDiePose(die, item, index, rollingProgress));
}

function renderDice3dDie(item, index, progress) {
  const die = document.createElement("div");
  die.className = "dice3d-die";
  die.dataset.dieIndex = String(index);
  die.style.setProperty("--dice-color", item.color);
  die.style.setProperty("--dice-light", lightenHex(item.color, 0.24));
  die.style.setProperty("--dice-dark", darkenHex(item.color, 0.2));
  die.style.setProperty("--pip-color", getContrastingPipColor(item.color));

  const shadow = document.createElement("div");
  shadow.className = "dice3d-shadow";

  const cube = document.createElement("div");
  cube.className = "dice3d-cube";
  for (const face of getDice3dFaces()) {
    cube.append(createDice3dFace(face.value, face.className));
  }

  die.append(shadow, cube);
  applyDice3dDiePose(die, item, index, progress);
  return die;
}

function applyDice3dDiePose(die, item, index, progress) {
  const pose = getDice3dPose(item, index, progress);
  die.style.left = `${pose.x}%`;
  die.style.top = `${pose.y}%`;
  die.style.setProperty("--dice-size", `${pose.size}px`);
  die.style.setProperty("--shadow-scale", pose.shadowScale.toFixed(3));
  die.style.setProperty("--shadow-alpha", pose.shadowAlpha.toFixed(3));
  die.style.transform = [
    "translate(-50%, -50%)",
    `translate3d(${pose.wobbleX.toFixed(2)}px, ${pose.bounceY.toFixed(2)}px, ${pose.depth.toFixed(2)}px)`,
    `scale(${pose.scaleX.toFixed(3)}, ${pose.scaleY.toFixed(3)})`
  ].join(" ");
  const cube = die.querySelector(".dice3d-cube");
  if (cube) cube.style.transform = getDice3dCubeTransform(item, index, progress);
}

function getDice3dPose(item, index, progress) {
  const progressEased = easeOutCubic(progress);
  const perpendicular = item.direction + Math.PI / 2;
  const side = index === 0 ? -1 : 1;
  const offset = side * Math.max(0.16, item.spread) * 100;
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

function queueShipFlightAnimation(ship, fromPoint, toPoint, onComplete = null) {
  if (!ship || !fromPoint || !toPoint || fromPoint.id === toPoint.id) return;

  const distance = getDistance(fromPoint, toPoint);
  const startAngle = getShipVisualAngle(ship.id);
  const targetAngle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
  const duration = Math.max(720, Math.min(2600, 520 + distance * 6.8));
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
    duration,
    onComplete
  });
  audioManager.playLoop("shipEngine", `ship-engine-${ship.id}`, {
    volume: 0.78,
    playbackRate: Math.max(0.86, Math.min(1.18, 0.92 + distance / 1500))
  });
  startShipFlightLoop();
}

function startShipFlightLoop() {
  if (animationScheduler.has(shipFlightAnimationId) || shipFlightAnimation.items.length === 0) return;
  animationScheduler.start(shipFlightAnimationId, updateShipFlightAnimations);
}

function updateShipFlightAnimations(now) {
  shipFlightAnimation.currentTime = now;
  const activeAnimations = [];
  const completedCallbacks = [];
  for (const item of shipFlightAnimation.items) {
    if (now - item.startTime >= item.duration) {
      audioManager.stopChannel(`ship-engine-${item.shipId}`);
      const finalPose = getShipFlightPose(item, 1);
      shipVisualAngles.set(item.shipId, finalPose.angle);
      queueShipEngineTrail(item.shipId, finalPose, now);
      if (typeof item.onComplete === "function") completedCallbacks.push(item.onComplete);
    } else {
      activeAnimations.push(item);
    }
  }
  shipFlightAnimation.items = activeAnimations;
  for (const callback of completedCallbacks) callback();
  if (completedCallbacks.length > 0) {
    render();
  } else {
    updateShipFlightAnimationDom();
    drawShipEngineVfxOverlays();
  }
  return shipFlightAnimation.items.length > 0;
}

function updateShipFlightAnimationDom() {
  const boardSvg = document.querySelector(".board-placeholder .board-svg");
  if (!boardSvg || !state.gameState) return;
  for (const item of shipFlightAnimation.items) {
    const ship = state.gameState.board?.ships?.find((candidate) => candidate.id === item.shipId);
    const fallbackPoint = ship ? boardPointsById.get(ship.locationId) : null;
    const group = boardSvg.querySelector(`[data-board-type='ship'][data-board-id='${cssEscape(item.shipId)}']`);
    if (!ship || !fallbackPoint || !group) continue;
    const pose = getShipRenderPose(ship, fallbackPoint);
    updateShipElementPose(group, ship, pose);
  }
}

function updateShipElementPose(group, ship, pose) {
  const visual = getShipVisualDefaults(ship);
  const pop = getPlacementAssetPop("ship", ship.id);
  const transform = [
    createPlacementTransform(pose.x, pose.y, 0, pop),
    `rotate(${(pose.angle * 180) / Math.PI} ${pose.x} ${pose.y})`
  ].filter(Boolean).join(" ");

  const hitArea = group.querySelector(".ship-hit-area");
  if (hitArea) {
    hitArea.setAttribute("cx", String(pose.x));
    hitArea.setAttribute("cy", String(pose.y));
  }

  const image = group.querySelector(".ship-image");
  if (image) {
    image.setAttribute("x", String(pose.x - visual.width / 2));
    image.setAttribute("y", String(pose.y - visual.height / 2));
    image.setAttribute("transform", transform);
    image.setAttribute("opacity", String(pop.opacity));
  }

  group.querySelector(".ship-coil-vfx")?.setAttribute("opacity", "0");
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
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

function createShipWeaponBurstSnapshot(ship, targetPoint, sourcePoint = null) {
  const owner = state.gameState?.players?.find((player) => player.id === ship.ownerPlayerId) ?? null;
  const anchors = getShipVfxAnchorsForRender(owner, ship);
  if (!anchors?.shots?.length || !targetPoint) return null;
  const angle = sourcePoint
    ? Math.atan2(targetPoint.y - sourcePoint.y, targetPoint.x - sourcePoint.x)
    : getShipVisualAngle(ship.id);
  return {
    shipId: ship.id,
    ownerColor: owner?.color,
    anchors,
    visual: getShipVisualDefaults(ship),
    pose: {
      x: targetPoint.x,
      y: targetPoint.y,
      angle
    }
  };
}

function queueShipWeaponBurst(snapshot) {
  if (!snapshot?.anchors?.shots?.length) return;
  const weaponTypes = new Set(snapshot.anchors.shots.map((shot) => shot.weaponType));
  if (weaponTypes.has("plasmaMachineGun")) {
    audioManager.play("weaponPlasma");
  } else if (weaponTypes.has("rocket")) {
    audioManager.play("battleImpact", { volume: 0.72 });
  } else {
    audioManager.play("weaponLaser");
  }
  shipWeaponBursts.push({
    ...snapshot,
    startTime: getAnimationNow(),
    duration: Math.max(
      shipWeaponBurstDuration,
      ...snapshot.anchors.shots.map((shot) => Number(shot.duration) || 0)
    )
  });
  startShipVfxLoop();
}

function pruneShipEngineTrails(now) {
  for (let index = shipEngineTrails.length - 1; index >= 0; index -= 1) {
    if (shipEngineTrails[index].expiresAt <= now) {
      shipEngineTrails.splice(index, 1);
    }
  }
}

function pruneShipWeaponBursts(now) {
  for (let index = shipWeaponBursts.length - 1; index >= 0; index -= 1) {
    const burst = shipWeaponBursts[index];
    if (now - burst.startTime >= burst.duration) {
      shipWeaponBursts.splice(index, 1);
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
  if (animationScheduler.has(shipVfxAnimationId) || !shouldRunShipVfxLoop()) return;
  animationScheduler.start(shipVfxAnimationId, updateShipVfxAnimation);
}

function stopShipVfxLoop() {
  animationScheduler.stop(shipVfxAnimationId);
}

function updateShipVfxAnimation(now) {
  shipVfxAnimation.currentTime = now;
  pruneShipEngineTrails(now);
  pruneShipWeaponBursts(now);
  drawShipEngineVfxOverlays();
  const shouldContinue = shouldRunShipVfxLoop();
  if (!shouldContinue) {
    shipVfxAnimation.currentTime = 0;
  }
  return shouldContinue;
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
  if (shipWeaponBursts.length > 0) return true;
  if (shipFlightAnimation.items.length > 0) return false;
  return state.gameState.phase === "flight" && state.gameState.hasRolledFlightSpeed;
}

function drawShipEngineVfx(targetContext, ship, owner, anchors, pose, layerName, time, options = {}) {
  const visual = getShipVisualDefaults(ship);
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
  const count = Math.max(4, Math.min(96, Math.round(
    (emitter.count ?? 18) * 1.32 * animationScheduler.getQualityScale()
  )));
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

function drawShipWeaponBurstVfx(targetContext, burst, layerName, time) {
  const progress = clamp01((time - burst.startTime) / burst.duration);
  if (progress >= 1) return;
  const anchors = burst.anchors;
  const visual = burst.visual;
  for (const shot of anchors.shots ?? []) {
    const shotLayer = normalizeShipVfxLayer(shot.layer ?? "front");
    if (shotLayer !== layerName) continue;
    const origin = getShipVfxWorldPoint(anchors, visual, burst.pose, shot.x, shot.y);
    const direction = burst.pose.angle + degreesToRadians(shot.direction ?? 0);
    const color = shot.color ?? getShipVfxColor(burst.ownerColor);
    if (shot.weaponType === "rocket") {
      drawShipRocketBurst(targetContext, origin, direction, shot, color, progress, anchors, visual);
    } else if (shot.weaponType === "laser") {
      drawShipLaserBurst(targetContext, origin, direction, shot, color, progress, anchors, visual);
    } else {
      drawShipPlasmaBurst(targetContext, origin, direction, shot, color, progress, anchors, visual);
    }
  }
}

function getShipShotScale(anchors, visual) {
  return getShipVfxFitScale(anchors, visual);
}

function drawShipLaserBurst(targetContext, origin, direction, shot, color, progress, anchors, visual) {
  const scale = getShipShotScale(anchors, visual);
  const length = Math.max(4, (Number(shot.length) || 150) * scale);
  const alpha = Math.sin(progress * Math.PI) * (Number(shot.intensity) || 1);
  const end = {
    x: origin.x + Math.cos(direction) * length,
    y: origin.y + Math.sin(direction) * length
  };
  const gradient = targetContext.createLinearGradient(origin.x, origin.y, end.x, end.y);
  gradient.addColorStop(0, rgbaFromHex("#ffffff", Math.min(0.95, alpha)));
  gradient.addColorStop(0.38, rgbaFromHex(color, Math.min(0.9, alpha)));
  gradient.addColorStop(1, rgbaFromHex(color, 0));
  targetContext.save();
  targetContext.globalCompositeOperation = "lighter";
  targetContext.strokeStyle = gradient;
  targetContext.lineCap = "round";
  targetContext.lineWidth = Math.max(1.2, (Number(shot.size) || 8) * scale * 0.42);
  targetContext.beginPath();
  targetContext.moveTo(origin.x, origin.y);
  targetContext.lineTo(end.x, end.y);
  targetContext.stroke();
  targetContext.restore();
}

function drawShipPlasmaBurst(targetContext, origin, direction, shot, color, progress, anchors, visual) {
  const scale = getShipShotScale(anchors, visual);
  const count = Math.max(1, Math.round(Number(shot.salvoCount) || 6));
  const length = Math.max(8, (Number(shot.length) || 190) * scale);
  const spread = (Number(shot.spread) || 0) * scale;
  const intensity = Number(shot.intensity) || 1;
  const size = Math.max(1.1, (Number(shot.size) || 7) * scale);
  const side = direction + Math.PI / 2;
  targetContext.save();
  targetContext.globalCompositeOperation = "lighter";
  for (let index = 0; index < count; index += 1) {
    const phase = (progress * 1.15 + index / Math.max(2, count + 1)) % 1;
    const travel = phase * length;
    const lateral = Math.sin(index * 1.7 + progress * Math.PI * 4) * spread * 0.42;
    const x = origin.x + Math.cos(direction) * travel + Math.cos(side) * lateral;
    const y = origin.y + Math.sin(direction) * travel + Math.sin(side) * lateral;
    const alpha = (1 - phase) * intensity * Math.sin(progress * Math.PI);
    if (alpha <= 0.02) continue;
    const radius = size * (0.65 + (1 - phase) * 0.35);
    const glow = targetContext.createRadialGradient(x, y, 0, x, y, radius * 3.4);
    glow.addColorStop(0, rgbaFromHex("#ffffff", Math.min(0.92, alpha)));
    glow.addColorStop(0.42, rgbaFromHex(color, Math.min(0.85, alpha)));
    glow.addColorStop(1, rgbaFromHex(color, 0));
    targetContext.fillStyle = glow;
    targetContext.beginPath();
    targetContext.arc(x, y, radius * 3.4, 0, Math.PI * 2);
    targetContext.fill();
  }
  targetContext.restore();
}

function drawShipRocketBurst(targetContext, origin, direction, shot, color, progress, anchors, visual) {
  const scale = getShipShotScale(anchors, visual);
  const count = Math.max(1, Math.round(Number(shot.salvoCount) || 3));
  const length = Math.max(8, (Number(shot.length) || 220) * scale);
  const spread = (Number(shot.spread) || 8) * scale;
  const size = Math.max(1.4, (Number(shot.size) || 9) * scale);
  const side = direction + Math.PI / 2;
  targetContext.save();
  targetContext.globalCompositeOperation = "lighter";
  for (let index = 0; index < count; index += 1) {
    const phase = clamp01(progress * 1.18 - index * 0.08);
    if (phase <= 0 || phase >= 1) continue;
    const lateral = (index - (count - 1) / 2) * spread;
    const x = origin.x + Math.cos(direction) * phase * length + Math.cos(side) * lateral;
    const y = origin.y + Math.sin(direction) * phase * length + Math.sin(side) * lateral;
    const tailX = x - Math.cos(direction) * size * 5;
    const tailY = y - Math.sin(direction) * size * 5;
    targetContext.strokeStyle = rgbaFromHex(color, (1 - phase) * 0.8);
    targetContext.lineWidth = Math.max(1, size * 0.8);
    targetContext.beginPath();
    targetContext.moveTo(tailX, tailY);
    targetContext.lineTo(x, y);
    targetContext.stroke();
    targetContext.fillStyle = rgbaFromHex("#ffffff", 0.86);
    targetContext.beginPath();
    targetContext.arc(x, y, size, 0, Math.PI * 2);
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
  return boardPointsById.get(pointId) ?? null;
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
  if (type === "battleShip") return t("battleShip");
  return type === "tradeShip" ? t("tradeShip") : t("colonyShip");
}

function getShipAssetPath(owner, ship) {
  if (ship.type === "battleShip") return getBattleShipAssetPath(owner?.color, ship);
  return ship.type === "tradeShip"
    ? getTradeShipAssetPath(owner?.color, ship)
    : getPlayerShipAssetPath(owner?.color, ship);
}

function getShipVfxAnchorsForRender(owner, ship) {
  if (ship.type === "battleShip") return getBattleShipVfxAnchors(owner?.color, ship);
  return ship.type === "tradeShip"
    ? getTradeShipVfxAnchors(owner?.color, ship)
    : getShipVfxAnchors(owner?.color, ship);
}

function getShipVisualDefaults(ship) {
  return ship?.type === "battleShip"
    ? playerPieceVisualDefaults.battleShip
    : playerPieceVisualDefaults.ship;
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
  return Boolean(
    !isShipFlightAnimating(ship.id) &&
    canFoundColonyInGame(state.gameState, boardLayout, ship.id)
  );
}

function canFoundTradeStationWithShip(ship) {
  return Boolean(
    !isShipFlightAnimating(ship.id) &&
    canFoundTradeStationInGame(state.gameState, boardLayout, ship.id)
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
  if (state.encounterBoardSelectionActive && pendingEncounterStep?.type === "boardTargetSelection") {
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

function isEncounterJumpShipTarget(shipId) {
  const pendingEncounterStep = state.gameState?.activeEncounter?.pendingStep;
  return state.encounterBoardSelectionActive
    && ["shipJumpSelection", "shipBlockSelection"].includes(pendingEncounterStep?.type)
    && pendingEncounterStep.shipIds?.includes(shipId);
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
  return getGameSupplyDrawCount(state.gameState, player);
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
    !state.gameState?.pendingFriendshipAction &&
    !state.gameState?.supernova?.pendingFactoryPlacement
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
  if (["colonyShip", "tradeShip", "battleShip"].includes(action.id)) return Boolean(findFreeLaunchPointForActivePlayer(player.id));
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

  if (action.id === "battleShip") {
    if (!isSupernovaGame(state.gameState)) return "limitReached";
    if ((stock.battleShip?.available ?? 0) <= 0) return "limitReached";
    if ((player.upgrades?.cannon ?? 0) <= 0) return "requiresCannon";
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
  runtimePerformanceMetrics.boardSvgBuilds += 1;
  const svg = createSvgElement("svg", {
    class: "board-svg",
    viewBox: `0 0 ${boardLayout.width} ${boardLayout.height}`,
    width: boardLayout.width,
    height: boardLayout.height,
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-label": t("boardAreaLabel")
  });

  svg.append(
    cloneStaticBoardLayer("defs", renderPlacementVfxDefs),
    cloneStaticBoardLayer("grid", renderGridLayer),
    cloneStaticBoardLayer("links", renderLinksLayer),
    renderSystemsLayer(),
    renderFactoriesLayer(),
    renderPointsLayer(),
    renderPlacementVfxLayer(),
    renderShipsLayer(),
    renderStructuresLayer(),
    renderOutpostsLayer()
  );
  return svg;
}

function cloneStaticBoardLayer(key, createLayer) {
  if (!staticBoardLayerTemplates.has(key)) {
    staticBoardLayerTemplates.set(key, createLayer());
    runtimePerformanceMetrics.staticBoardLayerBuilds += 1;
  }
  return staticBoardLayerTemplates.get(key).cloneNode(true);
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
    createSvgElement("feMerge")
  );
  filter.querySelector("feMerge").append(
    createSvgElement("feMergeNode", { in: "blur" }),
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
    const progress = clamp01((now - item.startTime) / getPlacementVfxDuration(item));
    if (progress >= 1) continue;
    group.append(renderPlacementVfxItem(item, progress));
  }

  return group;
}

function renderPlacementVfxItem(item, progress) {
  const group = createSvgElement("g", {
    class: `placement-vfx placement-vfx--${item.objectType} placement-vfx--${item.targetType}`,
    "data-placement-vfx-id": item.id,
    "data-placement-vfx-target-type": item.targetType,
    style: `--placement-color: ${item.playerColor || "#7dd3fc"};`
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

  if (!item.reducedMotion && progress >= 0.34 && progress <= 0.74) {
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
  const armCount = Math.max(3, Math.round(
    (5 + Math.floor(seededRandom(item.seed, 1) * 3)) * animationScheduler.getQualityScale()
  ));

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
  const sparkCount = Math.max(8, Math.round(14 * animationScheduler.getQualityScale()));

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
  for (const connection of boardConnections) {
    const from = boardPointsById.get(connection.from);
    const to = boardPointsById.get(connection.to);
    if (!from || !to) continue;
    const nebulaClass = (connection.hexIds ?? []).some((hexId) => boardHexesById.get(hexId)?.kind === "nebula")
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

  const planets = system.planets ?? system.resources.map((resource, index) => ({
    id: `${system.id}-planet-${index + 1}`,
    resource
  }));

  planets.forEach((planet, index) => {
    const fallbackOffset = planetRenderFallbackOffsets[index] ?? { x: 0, y: 0 };
    const position = getPlanetRenderPosition(system, planet, fallbackOffset);
    const selectedClass = isSelectedElement("planet", planet.id) ? " is-selected" : "";
    const factoryTargetClass = isValidPendingFactoryPlanet(planet.id) ? " is-factory-target" : "";
    const imageSize = className === "start-system" ? 82 : 72;
    const planetElement = createSvgElement("g", {
      class: `planet planet--${planet.resource}${selectedClass}${factoryTargetClass}`,
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

function renderFactoriesLayer() {
  const group = createSvgElement("g", {
    class: "board-factories-layer",
    "aria-hidden": isSupernovaGame(state.gameState) ? "false" : "true"
  });
  if (!isSupernovaGame(state.gameState)) return group;

  for (const factory of state.gameState?.supernova?.factories ?? []) {
    const placement = getFactoryRenderPlacement(factory);
    if (!placement) continue;
    const owner = state.gameState?.players?.find((player) => player.id === factory.ownerPlayerId);
    const factoryType = supernovaFactoryTypes.find((candidate) => candidate.id === factory.type);
    const assetPath = getFactoryAssetPath(factory.type, owner?.color);
    const pop = getPlacementAssetPop("factory", factory.id);
    const factoryGroup = createSvgElement("g", {
      class: `factory-marker factory-marker--${factory.type}`,
      "data-board-type": "factory",
      "data-board-id": factory.id,
      "data-factory-id": factory.id,
      "data-factory-type": factory.type,
      "data-planet-id": factory.planetId,
      "data-owner-player-id": factory.ownerPlayerId,
      opacity: pop.opacity,
      transform: `translate(${placement.x + pop.wobbleX} ${placement.y + pop.wobbleY}) scale(${pop.scale})`
    });
    const title = createSvgElement("title");
    title.textContent = `${getSupernovaLocalizedTitle(factoryType, state.language) || factory.type} - ${owner?.name ?? factory.ownerPlayerId}`;
    factoryGroup.append(title);
    if (assetPath) {
      factoryGroup.append(createSvgElement("image", {
        class: "factory-marker-image",
        href: assetPath,
        x: -30,
        y: -30,
        width: 60,
        height: 60,
        preserveAspectRatio: "xMidYMid meet"
      }));
    }
    const token = getPlanetToken(state.gameState?.board?.numberTokens, factory.planetId);
    const tokenLabel = formatTokenLabel(token);
    if (tokenLabel) {
      const marker = createSvgElement("text", {
        class: `number-marker factory-number-marker${isActiveSpecialToken(token) ? " number-marker--special" : ""}`,
        x: 0,
        y: 7,
        "text-anchor": "middle"
      });
      marker.textContent = tokenLabel;
      factoryGroup.append(marker);
    }
    group.append(factoryGroup);
  }

  return group;
}

function getFactoryRenderPlacement(factory) {
  const systems = [...(boardLayout.startSystems ?? []), ...getVisiblePlanetSystems()];
  const system = systems.find((candidate) => (candidate.planets ?? []).some((planet) => planet.id === factory.planetId));
  const planet = system?.planets?.find((candidate) => candidate.id === factory.planetId);
  if (!system || !planet) return null;
  const planetIndex = system.planets.indexOf(planet);
  const position = getPlanetRenderPosition(system, planet, planetRenderFallbackOffsets[planetIndex] ?? { x: 0, y: 0 });
  return {
    x: position.x,
    y: position.y
  };
}

function isValidPendingFactoryPlanet(planetId) {
  const pending = state.gameState?.supernova?.pendingFactoryPlacement;
  if (!pending || pending.ownerPlayerId !== getActivePlayer()?.id) return false;
  return getBuildableSupernovaFactoryOptions(state.gameState, boardLayout, pending.ownerPlayerId)
    .some((option) => option.factoryType === pending.factoryType && option.planetId === planetId && option.canBuild);
}

function getPlanetRenderPosition(system, planet, fallbackOffset) {
  const hex = planet.coordinate
    ? boardHexesById.get(planet.coordinate)
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
  const pendingEncounterStep = state.gameState?.activeEncounter?.pendingStep;
  const encounterTargetNodeIds = new Set(
    pendingEncounterStep?.type === "boardTargetSelection"
      ? (pendingEncounterStep.validNodeIds ?? [])
      : []
  );

  for (const point of boardLayout.points) {
    if (blockedNodeIds.has(point.id) && !encounterTargetNodeIds.has(point.id)) continue;
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
    const owner = state.gameState?.players?.find((player) => player.id === structure.ownerPlayerId);
    const structureColor = owner?.color ?? structure.color;
    const ownerIndex = owner
      ? Number.parseInt(structure.ownerPlayerId.replace("player-", ""), 10)
      : playerPieceColors.indexOf(structureColor) + 1;
    const structureGroup = createSvgElement("g", {
      class: `structure structure--${structure.type}${structure.isNeutral ? " structure--neutral" : ""}${selectedClass}${pendingSpaceportClass}`
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
        href: getPlayerSpaceportAssetPath(structureColor),
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
        href: getPlayerColonyAssetPath(structureColor),
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
  const visual = getShipVisualDefaults(ship);
  const time = getShipVfxTime();
  const coilIntensityScale = 1 / Math.sqrt(Math.max(1, anchors.coils.length));

  anchors.coils.forEach((coil, index) => {
    const point = getShipVfxWorldPoint(anchors, visual, pose, coil.x, coil.y, pop);
    const pulse = coilState.active
      ? 0.88 + Math.sin(time / 210 + index * 0.9) * 0.24
      : 0.48;
    const opacity = coilState.opacity * pulse * coilIntensityScale;
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
  const movementLeft = getShipRemainingMovement(ship.id);
  if (isFlying) return { visible: true, active: true, opacity: 0.95 };
  if (ship.type === "tradeShip" && state.gameState?.phase === "flight" && isActivePlayerShip && movementLeft > 0) {
    return { visible: true, active: true, opacity: 0.82 };
  }
  if (relevantFlightPhase && isActivePlayerShip) {
    const hasMovementLeft = movementLeft > 0;
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

  for (const ship of state.gameState?.board?.ships ?? []) {
    const point = boardPointsById.get(ship.locationId);
    if (!point) continue;
    const selectedClass = isSelectedElement("ship", ship.id) ? " is-selected" : "";
    const encounterJumpClass = isEncounterJumpShipTarget(ship.id) ? " is-encounter-jump-target" : "";
    const shipGroup = createSvgElement("g", {
      class: `ship ship--${ship.type}${selectedClass}${encounterJumpClass}`
    });
    enableBoardElementSelection(shipGroup, "ship", ship.id);

    const ownerIndex = Number.parseInt(ship.ownerPlayerId.replace("player-", ""), 10);
    const owner = state.gameState?.players?.find((player) => player.id === ship.ownerPlayerId);
    const visual = getShipVisualDefaults(ship);
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
  modal.className = `modal-panel${state.modal === "controllers" ? " modal-panel--controller" : ""}`;
  modal.append(renderModalContent());

  overlay.append(modal);
  return overlay;
}

function renderModalContent() {
  if (state.modal === "save") return renderSaveDialog();
  if (state.modal === "load") return renderLoadDialog();
  if (state.modal === "controllers") return renderControllerPairingDialog();
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

  const soundSettings = audioManager.getSettings();
  const soundSection = document.createElement("section");
  soundSection.className = "settings-audio";
  const soundTitle = document.createElement("strong");
  soundTitle.textContent = t("soundEffects");

  const soundToggle = createButton(
    soundSettings.enabled ? t("soundEffectsOn") : t("soundEffectsOff"),
    () => {
      const enabled = !audioManager.getSettings().enabled;
      audioManager.setEnabled(enabled);
      if (enabled) audioManager.play("uiConfirm");
      render();
    },
    "secondary-button"
  );
  soundToggle.dataset.remoteId = "settings-sound-toggle";
  soundToggle.setAttribute("aria-pressed", String(soundSettings.enabled));

  const volumeRow = document.createElement("label");
  volumeRow.className = "settings-audio-volume";
  const volumeLabel = document.createElement("span");
  volumeLabel.textContent = t("soundVolume");
  const volumeInput = document.createElement("input");
  volumeInput.className = "settings-audio-volume-input";
  volumeInput.type = "range";
  volumeInput.min = "0";
  volumeInput.max = "100";
  volumeInput.step = "5";
  volumeInput.value = String(Math.round(soundSettings.volume * 100));
  volumeInput.disabled = !soundSettings.enabled;
  volumeInput.dataset.remoteId = "settings-sound-volume";
  volumeInput.setAttribute("aria-label", t("soundVolume"));
  const volumeOutput = document.createElement("output");
  volumeOutput.value = `${volumeInput.value} %`;
  volumeOutput.textContent = volumeOutput.value;
  volumeInput.addEventListener("input", () => {
    audioManager.setVolume(Number(volumeInput.value) / 100);
    volumeOutput.value = `${volumeInput.value} %`;
    volumeOutput.textContent = volumeOutput.value;
  });
  volumeInput.addEventListener("change", () => audioManager.play("uiConfirm"));
  volumeRow.append(volumeLabel, volumeInput, volumeOutput);

  const soundTest = createButton(t("soundTest"), () => audioManager.play("uiConfirm"), "secondary-button");
  soundTest.disabled = !soundSettings.enabled;
  soundTest.dataset.remoteId = "settings-sound-test";
  soundTest.dataset.sound = "none";
  soundSection.append(soundTitle, soundToggle, volumeRow, soundTest);

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  const settingsButtons = [
    ["settings-connect", t("connectControllers"), () => openModal("controllers"), "menu-button"],
    ["settings-save", t("save"), () => openModal("save"), "menu-button"],
    ["settings-load", t("loadGame"), () => openModal("load"), "menu-button"],
    ["settings-discard", t("discardAutosave"), confirmDiscardAutosave, "secondary-button"],
    ["settings-menu", t("backToMenu"), confirmBackToMenu, "secondary-button"],
    ["settings-close", t("close"), closeModal, "secondary-button"]
  ].map(([remoteId, label, handler, className], index) => {
    const button = createButton(label, handler, className);
    button.dataset.remoteId = remoteId;
    if (index === 0) button.dataset.remoteAutofocus = "true";
    return button;
  });
  actions.append(...settingsButtons);

  wrapper.append(title, modalNotice, languageSection, soundSection, actions);
  return wrapper;
}

function renderControllerPairingDialog() {
  const wrapper = document.createElement("div");
  wrapper.className = "modal-content controller-pairing-dialog";

  const title = document.createElement("h2");
  title.textContent = t("controllerPairingTitle");

  const status = document.createElement("p");
  status.className = "controller-pairing-status";
  status.textContent = t("controllerPairingStatus")
    .replace("{count}", remoteHost.controllerCount)
    .replace("{status}", remoteHost.connected ? t("controllerBridgeConnected") : t("controllerBridgeDisconnected"));

  const qrGrid = document.createElement("div");
  qrGrid.className = "qr-grid qr-grid--modal";
  const players = state.gameState?.players?.length
    ? state.gameState.players
    : Array.from({ length: state.selectedPlayers || 2 }, (_, index) => ({
      id: `player-${index + 1}`,
      name: t("playerNumber").replace("{number}", index + 1)
    }));

  players.forEach((player, index) => {
    const card = renderQrPlaceholder(index + 1);
    card.querySelector("h2").textContent = player.name;
    const controllerUrl = getControllerUrl(player.id);
    const image = card.querySelector(".qr-image");
    const urlText = card.querySelector(".qr-url");
    if (image) {
      image.alt = t("controllerQrAlt").replace("{player}", player.name);
      image.src = getQrCodeUrl(controllerUrl);
    }
    if (urlText) urlText.textContent = controllerUrl;
    qrGrid.append(card);
  });

  const actions = document.createElement("div");
  actions.className = "modal-actions modal-actions--row";
  const backButton = createButton(t("back"), () => openModal("settings"), "secondary-button");
  backButton.dataset.remoteId = "controller-dialog-back";
  backButton.dataset.remoteAutofocus = "true";
  const closeButton = createButton(t("close"), closeModal, "secondary-button");
  closeButton.dataset.remoteId = "controller-dialog-close";
  actions.append(backButton, closeButton);

  wrapper.append(title, status, qrGrid, actions);
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
  input.dataset.remoteId = "save-name";
  input.dataset.remoteAutofocus = "true";

  const actions = document.createElement("div");
  actions.className = "modal-actions modal-actions--row";
  const saveButton = createButton(t("save"), () => {}, "menu-button");
  saveButton.type = "submit";
  saveButton.dataset.remoteId = "save-confirm";
  const backButton = createButton(t("back"), () => openModal("settings"), "secondary-button");
  backButton.dataset.remoteId = "save-back";
  actions.append(backButton, saveButton);

  wrapper.append(title, input, actions);
  return wrapper;
}

function renderLoadDialog() {
  const wrapper = document.createElement("div");
  wrapper.className = "modal-content";

  const title = document.createElement("h2");
  title.textContent = t("loadGame");

  const modalNotice = document.createElement("p");
  modalNotice.className = "modal-notice";
  modalNotice.textContent = state.notice;
  modalNotice.hidden = state.notice.length === 0;

  const importInput = document.createElement("input");
  importInput.className = "visually-hidden";
  importInput.type = "file";
  importInput.accept = ".json,application/json";
  importInput.dataset.saveImportInput = "true";
  importInput.setAttribute("aria-label", t("importSave"));
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (file) void importSaveBackup(file);
  });

  const importButton = createButton(t("importSave"), () => importInput.click(), "secondary-button");
  importButton.dataset.remoteId = "load-import";

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
  const backButton = createButton(t("back"), () => state.view === "board" ? openModal("settings") : closeModal(), "secondary-button");
  backButton.dataset.remoteId = "load-back";
  if (saves.length === 0) backButton.dataset.remoteAutofocus = "true";
  const closeButton = createButton(t("close"), closeModal, "secondary-button");
  closeButton.dataset.remoteId = "load-close";
  actions.append(backButton, closeButton);

  wrapper.append(title, modalNotice, importButton, importInput, list, actions);
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
  const loadButton = createButton(t("load"), () => loadSave(save), "small-button");
  loadButton.dataset.remoteId = `load-${save.id}`;
  loadButton.dataset.remoteAutofocus = "true";
  const exportButton = createButton(t("exportSave"), () => exportSaveBackup(save), "small-button secondary-small-button");
  exportButton.dataset.remoteId = `export-${save.id}`;
  const deleteButton = createButton(t("delete"), () => deleteSave(save.id), "small-button secondary-small-button");
  deleteButton.dataset.remoteId = `delete-${save.id}`;
  actions.append(loadButton, exportButton, deleteButton);

  item.append(details, actions);
  return item;
}

function saveCurrentGame(name, options = {}) {
  if (!state.gameState) {
    state.gameState = createGameState({
      language: state.language,
      playerCount: state.selectedPlayers || 3,
      boardLayout,
      gameVariant: state.selectedGameVariant,
      supernovaMissionCount: state.selectedSupernovaMissionCount
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

  if (!writeSaves([save, ...readSaves()])) {
    state.notice = t("saveFailed");
    render();
    return;
  }
  state.notice = t("saveSuccess");
  if (options.returnToSettings !== false) {
    state.modal = "settings";
  }
  render();
}

function exportSaveBackup(save) {
  try {
    const backup = createSaveBackup(save);
    const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getSaveBackupFilename(save);
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    state.notice = t("saveExportFailed");
    render();
  }
}

async function importSaveBackup(file) {
  try {
    if (file.size > saveBackupMaxBytes) {
      state.notice = t("saveImportTooLarge");
      render();
      return;
    }

    const backup = parseSaveBackup(await file.text());
    const importedSave = normalizeImportedSave(backup.save);
    if (!writeSaves([importedSave, ...readSaves()])) {
      state.notice = t("saveImportFailed");
      render();
      return;
    }

    state.notice = t("saveImportSuccess").replace("{name}", importedSave.name);
    render();
  } catch (error) {
    if (error?.code === saveBackupErrorCodes.unsupportedVersion) {
      state.notice = t("saveImportUnsupportedVersion");
    } else if (error?.code === saveBackupErrorCodes.tooLarge) {
      state.notice = t("saveImportTooLarge");
    } else {
      state.notice = t("saveImportInvalid");
    }
    render();
  }
}

function normalizeImportedSave(save) {
  const fallbackLanguage = languages.includes(save.gameState.language)
    ? save.gameState.language
    : languages.includes(save.language) ? save.language : state.language;
  const fallbackPlayerCount = getSavePlayerCount(save) || 3;
  const restoredGameState = repairLoadedGameState(normalizeGameState(save.gameState, {
    language: fallbackLanguage,
    playerCount: fallbackPlayerCount,
    boardLayout
  }));
  const existingIds = new Set(readSaves().map((existingSave) => existingSave.id));
  const idBase = `save-import-${Date.now()}`;
  let id = idBase;
  let suffix = 1;
  while (existingIds.has(id)) {
    id = `${idBase}-${suffix}`;
    suffix += 1;
  }
  const sourceSavedAt = new Date(save.savedAt);
  const savedAt = Number.isNaN(sourceSavedAt.getTime()) ? new Date().toISOString() : sourceSavedAt.toISOString();
  const name = typeof save.name === "string" && save.name.trim()
    ? save.name.trim().slice(0, 48)
    : t("defaultSaveName");

  return {
    id,
    name,
    savedAt,
    displayDate: formatSavedAt(savedAt),
    language: restoredGameState.language,
    playerCount: restoredGameState.playerCount,
    view: "board",
    boardState: restoredGameState.board,
    gameState: restoredGameState
  };
}

function loadSave(save) {
  const sourceGameState = save.gameState && !save.gameState.placeholder
    ? save.gameState
    : {
      language: save.language || state.language,
      playerCount: getSavePlayerCount(save) || 3,
      board: save.boardState
    };
  const restoredGameState = normalizeGameState(sourceGameState, {
    language: save.language || state.language,
    playerCount: getSavePlayerCount(save) || 3,
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
  state.selectedGameVariant = state.gameState.gameVariant ?? gameVariants.classic;
  state.selectedSupernovaMissionCount = state.gameState.supernova?.missionCount ?? supernovaMissionCounts.standard;
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
    state.gameState = null;
    clearAutosave();
    setView("menu");
  }
}

function confirmDiscardAutosave() {
  if (!window.confirm(t("confirmDiscardAutosave"))) return;

  state.gameState = null;
  state.controllerMode = false;
  clearAutosave();
  state.view = "menu";
  state.modal = null;
  state.hudPlayerId = null;
  state.notice = t("autosaveDiscarded");
  render();
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

function renderStorageWarning() {
  if (storageWriteFailures.size === 0) return null;

  const warning = document.createElement("aside");
  warning.className = "storage-warning";
  warning.dataset.storageWarning = "true";
  warning.setAttribute("role", "alert");
  warning.setAttribute("aria-live", "assertive");

  const message = document.createElement("span");
  message.textContent = t("storageWriteFailed");

  const retryButton = createButton(t("retrySave"), retryStorageWrites, "small-button storage-warning__retry");
  retryButton.dataset.remoteId = "storage-retry";

  warning.append(message, retryButton);
  return warning;
}

function connectRemoteHost() {
  initializeLocalHostChannel();
  if (!("WebSocket" in window)) return;
  if (remoteHost.socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(remoteHost.socket.readyState)) return;

  clearTimeout(remoteHost.reconnectTimer);
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
  remoteHost.socket = socket;

  socket.addEventListener("open", () => {
    remoteHost.connected = true;
    const controllerTokensByPlayerId = ensureControllerAccessTokens();
    socket.send(JSON.stringify({
      type: "hello",
      role: "host",
      sessionId: remoteHost.sessionId,
      controllerTokensByPlayerId
    }));
    remoteHost.lastAccessJson = JSON.stringify(controllerTokensByPlayerId);
    remoteHost.lastStateJson = "";
    publishRemoteHostState();
    render();
  });

  socket.addEventListener("message", (event) => handleRemoteHostMessage(event.data));
  socket.addEventListener("close", () => {
    if (remoteHost.socket !== socket) return;
    remoteHost.connected = false;
    remoteHost.controllerCount = 0;
    remoteHost.controllerSlots = [];
    syncLocalControllerSlots();
    remoteHost.socket = null;
    remoteHost.lastAccessJson = "";
    remoteHost.reconnectTimer = setTimeout(connectRemoteHost, controllerReconnectMs);
    if (state.modal === "controllers") render();
  });
  socket.addEventListener("error", () => {
    socket.close();
  });
}

function handleRemoteHostMessage(rawData) {
  let message;
  try {
    message = JSON.parse(rawData);
  } catch {
    return;
  }

  if (message.type === "helloAck" || message.type === "controllerCount") {
    remoteHost.controllerCount = message.controllerCount ?? remoteHost.controllerCount;
    remoteHost.controllerSlots = Array.isArray(message.controllerSlots) ? message.controllerSlots : remoteHost.controllerSlots;
    syncLocalControllerSlots();
    if (state.modal === "controllers" || state.view === "controllers") render();
    return;
  }

  if (message.type === "controllerAction") {
    executeRemoteAction(message.actionId, message.payload || {});
  }
}

function publishRemoteHostState() {
  const controllerStatesByPlayerId = createControllerStatesByPlayerId(getRemoteControllerState());
  const stateJson = JSON.stringify(controllerStatesByPlayerId);
  if (stateJson === remoteHost.lastStateJson) return;
  remoteHost.lastStateJson = stateJson;
  runtimePerformanceMetrics.controllerStatePublications += 1;
  const message = {
    type: "state",
    sessionId: remoteHost.sessionId,
    statesByPlayerId: controllerStatesByPlayerId
  };
  if (remoteHost.connected && remoteHost.socket?.readyState === WebSocket.OPEN) {
    remoteHost.socket.send(JSON.stringify(message));
  }
  if (remoteHost.localControllers.size > 0) {
    for (const controller of remoteHost.localControllers.values()) {
      const controllerState = controllerStatesByPlayerId[controller.playerId];
      if (!controllerState) continue;
      sendLocalPrivateControllerMessage(controller.controllerId, {
        type: "state",
        sessionId: remoteHost.sessionId,
        state: controllerState
      }, controller.connectionId);
    }
  }
}

function initializeLocalHostChannel() {
  if (remoteHost.localTransport) return;
  if ("BroadcastChannel" in window) {
    remoteHost.localTransport = "broadcast";
    remoteHost.localChannel = new BroadcastChannel(getLocalControllerChannelName());
    remoteHost.localChannel.addEventListener("message", (event) => handleLocalControllerMessage(event.data));
    return;
  }
  remoteHost.localTransport = "storage";
  window.addEventListener("storage", (event) => {
    if (event.key !== getLocalControllerStorageKey("controller") || !event.newValue) return;
    try {
      handleLocalControllerMessage(JSON.parse(event.newValue));
    } catch {
      // Ignore unrelated or partial local controller messages.
    }
  });
}

function handleLocalControllerMessage(message) {
  if (!message || message.sessionId !== remoteHost.sessionId || message.source !== "controller") return;
  if (message.type === "hello") {
    const controllerId = message.controllerId || `controller-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const playerId = message.playerId || null;
    const connectionId = message.connectionId || controllerId;
    const expectedAccessToken = ensureControllerAccessTokens()[playerId];
    if (!expectedAccessToken || message.accessToken !== expectedAccessToken) {
      sendLocalControllerMessage({
        type: "accessDenied",
        sessionId: remoteHost.sessionId,
        targetControllerId: controllerId,
        targetConnectionId: connectionId
      });
      return;
    }
    const occupiedSlot = remoteHost.controllerSlots.some((slot) => slot.connected && slot.playerId === playerId)
      || [...remoteHost.localControllers.values()].some((controller) => controller.playerId === playerId);
    if (occupiedSlot) {
      sendLocalControllerMessage({
        type: "slotOccupied",
        sessionId: remoteHost.sessionId,
        targetControllerId: controllerId,
        targetConnectionId: connectionId
      });
      return;
    }
    remoteHost.localControllers.set(connectionId, {
      controllerId,
      connectionId,
      playerId,
      accessToken: message.accessToken,
      lastSeen: Date.now()
    });
    syncLocalControllerSlots();
    sendLocalControllerMessage({
      type: "helloAck",
      sessionId: remoteHost.sessionId,
      targetControllerId: controllerId,
      targetConnectionId: connectionId,
      controllerId,
      controllerCount: remoteHost.controllerCount,
      controllerSlots: remoteHost.controllerSlots
    });
    remoteHost.lastStateJson = "";
    publishRemoteHostState();
    if (state.modal === "controllers" || state.view === "controllers") render();
    return;
  }

  if (message.type === "action") {
    const controller = remoteHost.localControllers.get(message.connectionId);
    if (!controller || controller.controllerId !== message.controllerId) return;
    executeRemoteAction(message.actionId, {
      ...(message.payload || {}),
      playerId: controller.playerId
    });
    return;
  }

  if (message.type === "disconnect") {
    const controller = remoteHost.localControllers.get(message.connectionId);
    if (!controller || controller.controllerId !== message.controllerId) return;
    remoteHost.localControllers.delete(message.connectionId);
    syncLocalControllerSlots();
    if (state.modal === "controllers" || state.view === "controllers") render();
  }
}

function revokeInvalidLocalControllers() {
  let changed = false;
  for (const [connectionId, controller] of remoteHost.localControllers.entries()) {
    if (remoteHost.controllerTokensByPlayerId[controller.playerId] === controller.accessToken) continue;
    sendLocalPrivateControllerMessage(controller.controllerId, {
      type: "accessRevoked",
      sessionId: remoteHost.sessionId
    }, controller.connectionId);
    remoteHost.localControllers.delete(connectionId);
    changed = true;
  }
  if (changed) syncLocalControllerSlots();
}

function syncLocalControllerSlots() {
  const socketSlots = remoteHost.controllerSlots.filter((slot) => (
    ![...remoteHost.localControllers.values()].some((controller) => controller.playerId === slot.playerId)
  ));
  const localSlots = [...remoteHost.localControllers.values()].map((controller) => ({
    controllerId: controller.controllerId,
    playerId: controller.playerId,
    connected: true
  }));
  remoteHost.controllerSlots = [...socketSlots, ...localSlots];
  remoteHost.controllerCount = remoteHost.controllerSlots.length;
  updateControllerLobbyConnections();
  if (controllerGamePreparationStatus === assetLoadStates.ready) {
    schedulePreparedControllerGameStart();
  } else if (
    gameAssetsReady && areControllerLobbySlotsReady() &&
    controllerGamePreparationStatus === assetLoadStates.idle
  ) {
    void prepareControllerGame();
  }
}

function sendLocalControllerMessage(message) {
  const payload = {
    ...message,
    source: "host",
    sentAt: Date.now()
  };
  if (remoteHost.localTransport === "broadcast" && remoteHost.localChannel) {
    remoteHost.localChannel.postMessage(payload);
    return;
  }
  if (remoteHost.localTransport === "storage") {
    try {
      localStorage.setItem(getLocalControllerStorageKey("host"), JSON.stringify(payload));
    } catch {
      // Local test transport is best-effort.
    }
  }
}

function sendLocalPrivateControllerMessage(controllerId, message, connectionId = "") {
  const payload = {
    ...message,
    source: "host",
    targetControllerId: controllerId,
    targetConnectionId: connectionId,
    sentAt: Date.now()
  };
  if (remoteHost.localTransport === "broadcast") {
    const channel = new BroadcastChannel(getLocalControllerPrivateChannelName(controllerId));
    channel.postMessage(payload);
    setTimeout(() => channel.close(), 0);
    return;
  }
  if (remoteHost.localTransport === "storage") {
    try {
      localStorage.setItem(getLocalControllerPrivateStorageKey(controllerId), JSON.stringify(payload));
    } catch {
      // Local test transport is best-effort.
    }
  }
}

function getLocalControllerChannelName() {
  return `${localControllerStoragePrefix}:${remoteHost.sessionId}`;
}

function getLocalControllerStorageKey(direction) {
  return `${localControllerStoragePrefix}:${remoteHost.sessionId}:${direction}`;
}

function getLocalControllerPrivateChannelName(controllerId) {
  return `${getLocalControllerChannelName()}:host:${controllerId}`;
}

function getLocalControllerPrivateStorageKey(controllerId) {
  return `${getLocalControllerStorageKey("host")}:${controllerId}`;
}

function getRemoteControllerState() {
  const activePlayer = getActivePlayer();
  return {
    language: state.language,
    view: state.view,
    controllerMode: state.controllerMode,
    controllerLobby: getControllerLobbyStateForRemote(),
    phase: state.gameState?.phase ?? null,
    phaseLabel: state.gameState ? getPhaseLabel(state.gameState.phase) : "",
    gameVariant: state.gameState?.gameVariant ?? gameVariants.classic,
    activePlayerId: activePlayer?.id ?? null,
    activePlayerName: activePlayer?.name ?? "",
    placement: getRemotePlacementStateForController(),
    flight: getRemoteFlightStateForController(),
    sevenResolution: state.gameState?.sevenResolution ?? null,
    players: (state.gameState?.players ?? []).map((player) => getRemotePlayerState(player)),
    trade: getRemoteTradeState(),
    encounter: getRemoteEncounterStateForController(),
    supernovaBattle: getRemoteSupernovaBattleState(),
    factoryPlacement: getRemoteFactoryPlacementState(),
    board: getRemoteBoardState(),
    saves: getRemoteSaveList(),
    actions: getRemoteControllerActions()
  };
}

function getRemoteSupernovaBattleState() {
  const battle = state.gameState?.supernova?.shipBattle;
  if (!battle) return null;
  const attacker = state.gameState.players.find((player) => player.id === battle.attackerPlayerId);
  const defender = state.gameState.players.find((player) => player.id === battle.defenderPlayerId);
  return {
    active: true,
    id: battle.id,
    stage: battle.stage,
    round: battle.round,
    attackerPlayerId: battle.attackerPlayerId,
    attackerName: attacker?.name ?? "",
    defenderPlayerId: battle.defenderPlayerId,
    defenderName: defender?.name ?? "",
    defenderShipType: battle.defenderShipType,
    attackerRolled: Boolean(battle.attackerRoll),
    defenderRolled: Boolean(battle.defenderRoll),
    attackerStrength: battle.attackerStrength,
    defenderStrength: battle.defenderStrength,
    winnerPlayerId: battle.winnerPlayerId,
    loserPlayerId: battle.loserPlayerId,
    pendingUpgradePlayerId: battle.pendingUpgradePlayerId,
    removableUpgradeIds: battle.removableUpgradeIds ?? [],
    outcomeText: battle.stage === "completed" ? getSupernovaBattleOutcomeText(battle) : "",
    consequences: battle.stage === "completed"
      ? {
        battleType: battle.consequences?.battleType ?? battle.defenderShipType,
        lostUpgrade: battle.consequences?.lostUpgrade ?? null,
        upgradeLossSkipped: Boolean(battle.consequences?.upgradeLossSkipped),
        transferredResourceCount: battle.consequences?.transferredResourceCount ?? 0,
        blockedShipId: battle.consequences?.blockedShipId ?? null,
        medalPlayerId: battle.consequences?.medalPlayerId ?? null,
        destroyedShipId: battle.consequences?.destroyedShipId ?? null
      }
      : null
  };
}

function getRemoteFactoryPlacementState() {
  const pending = state.gameState?.supernova?.pendingFactoryPlacement;
  if (!pending) return null;
  const factoryType = supernovaFactoryTypes.find((candidate) => candidate.id === pending.factoryType);
  const validPlanetIds = getBuildableSupernovaFactoryOptions(state.gameState, boardLayout, pending.ownerPlayerId)
    .filter((option) => option.factoryType === pending.factoryType && option.canBuild)
    .map((option) => option.planetId);
  return {
    ownerPlayerId: pending.ownerPlayerId,
    factoryType: pending.factoryType,
    factoryTitle: getSupernovaLocalizedTitle(factoryType, state.language),
    validPlanetIds,
    hint: t("supernovaFactoryChoosePlanet")
      .replace("{factory}", getSupernovaLocalizedTitle(factoryType, state.language))
  };
}

function getRemoteFlightStateForController() {
  if (state.view !== "board" || !state.gameState || state.gameState.phase !== "flight") return null;
  const activePlayer = getActivePlayer();
  const selectedShip = getSelectedShip();
  const movableShips = getMovableShipsForActivePlayer();
  const reachableNodes = selectedShip ? [...getReachableNodeMap().values()] : [];
  const totalSpeed = Number(state.gameState.flightSpeedTotal);
  const selectedShipRemaining = selectedShip ? getShipRemainingMovement(selectedShip.id) : null;
  const selectedShipTotal = selectedShip && Number.isFinite(totalSpeed) ? Math.max(0, totalSpeed) : null;
  const selectedShipBlocked = Boolean(
    selectedShip && (state.gameState.supernova?.blockedShipIds ?? []).includes(selectedShip.id)
  );
  const selectedShipBlockReason = selectedShip
    ? (state.gameState.supernova?.blockedShipDetails ?? []).find((entry) => entry.shipId === selectedShip.id)?.reason ?? null
    : null;
  return {
    hasRolledSpeed: Boolean(state.gameState.hasRolledFlightSpeed),
    totalSpeed: Number.isFinite(totalSpeed) ? totalSpeed : null,
    activePlayerId: activePlayer?.id ?? null,
    activePlayerName: activePlayer?.name ?? "",
    movableShipCount: movableShips.length,
    movableShipIds: movableShips.map((ship) => ship.id),
    selectedShipId: selectedShip?.id ?? null,
    selectedShipType: selectedShip?.type ?? null,
    selectedShipTotal,
    selectedShipUsed: selectedShip && selectedShipTotal !== null && selectedShipRemaining !== null
      ? Math.max(0, selectedShipTotal - selectedShipRemaining)
      : null,
    selectedShipRemaining,
    selectedShipBlocked,
    selectedShipBlockReason,
    reachableNodeIds: reachableNodes.map((node) => node.id),
    turnHint: getControllerFlightTurnHint(),
    boardHint: getControllerFlightBoardHint(),
    waitHint: t("controllerFlightWait").replace("{playerName}", activePlayer?.name ?? t("activePlayer"))
  };
}

function getRemotePlacementStateForController() {
  if (state.view !== "board" || !state.gameState || state.gameState.phase !== "placement") return null;

  const step = state.gameState.placement?.step ?? "";
  const actionPlayer = getActivePlayer();
  return {
    step,
    actionPlayerId: actionPlayer?.id ?? null,
    actionPlayerName: actionPlayer?.name ?? "",
    activeTurnHint: getControllerPlacementTurnHint(step),
    boardHint: getControllerPlacementBoardHint(step),
    waitHint: t("controllerPlacementWait").replace("{playerName}", actionPlayer?.name ?? t("activePlayer"))
  };
}

function getRemotePlayerState(player) {
  const structures = (state.gameState?.board?.structures ?? [])
    .filter((structure) => structure.ownerPlayerId === player.id);
  const ships = (state.gameState?.board?.ships ?? [])
    .filter((ship) => ship.ownerPlayerId === player.id);
  const upgradeBonuses = Object.fromEntries(
    upgradeDefinitions.map((upgrade) => [upgrade.id, getFriendshipUpgradeBonus(state.gameState, player.id, upgrade.id)])
  );
  const effectiveUpgrades = Object.fromEntries(
    upgradeDefinitions.map((upgrade) => [upgrade.id, getEffectiveUpgradeValue(state.gameState, player.id, upgrade.id)])
  );

  return {
    id: player.id,
    name: player.name,
    color: player.color,
    resources: player.resources,
    upgrades: player.upgrades,
    upgradeBonuses,
    effectiveUpgrades,
    tradeRates: Object.fromEntries(resourceTypes.map((resource) => [resource, getBankTradeRate(player, resource)])),
    victoryPoints: state.gameState ? calculateVictoryPoints(state.gameState, player.id) : 0,
    halfMedals: player.halfMedals ?? 0,
    medalLabel: formatMedals(player),
    counts: {
      ships: ships.length,
      colonyShips: ships.filter((ship) => ship.type === "colonyShip").length,
      tradeShips: ships.filter((ship) => ship.type === "tradeShip").length,
      battleShips: ships.filter((ship) => ship.type === "battleShip").length,
      colonies: structures.filter((structure) => structure.type === "colony").length,
      spaceports: structures.filter((structure) => structure.type === "spaceport").length,
      tradeStations: structures.filter((structure) => structure.type === "tradeStation").length,
      factories: isSupernovaGame(state.gameState)
        ? (state.gameState?.supernova?.factories ?? [])
          .filter((factory) => factory.ownerPlayerId === player.id)
          .length
        : 0
    },
    friendship: getRemoteFriendshipState(player, structures),
    supernovaMissions: isSupernovaGame(state.gameState) ? getSupernovaMissionsForPlayer(state.gameState, player.id) : []
  };
}

function getRemoteTradeState() {
  return {
    bankFromResource: state.tradeFromResource,
    bankToResource: state.tradeToResource,
    offerTargetPlayerId: state.tradeOfferTargetPlayerId,
    offeredResources: state.tradeOfferedResources,
    requestedResources: state.tradeRequestedResources,
    activeTradeOffer: state.gameState?.activeTradeOffer ?? null
  };
}

function getRemoteFriendshipState(player, structures) {
  const tradeStations = structures.filter((structure) => structure.type === "tradeStation");
  const representedOutposts = [...new Set(tradeStations.map((structure) => structure.outpostId))]
    .map((outpostId) => getOutpostById(outpostId))
    .filter(Boolean)
    .map((outpost) => formatOutpostLabel(outpost));
  const markers = (player.friendshipMarkers ?? [])
    .map((outpostId) => getOutpostById(outpostId))
    .filter(Boolean)
    .map((outpost) => formatOutpostLabel(outpost));
  const cards = (player.friendshipCards ?? [])
    .map((cardId) => getFriendshipCardById(cardId))
    .filter(Boolean)
    .map((card) => ({
      id: card.id,
      title: getFriendshipCardTitle(card, state.language),
      summary: getFriendshipCardSummary(card, state.language),
      implemented: card.implemented
    }));

  return { representedOutposts, markers, cards };
}

function getControllerLobbyStateForRemote() {
  if (!state.controllerLobby) return null;
  return {
    playerCount: state.controllerLobby.playerCount,
    gameVariant: state.controllerLobby.gameVariant ?? gameVariants.classic,
    supernovaMissionCount: state.controllerLobby.supernovaMissionCount ?? supernovaMissionCounts.standard,
    started: state.controllerLobby.started,
    colors: playerPieceColors.map((color) => ({
      id: color,
      label: getPlayerColorLabel(color)
    })),
    slots: (state.controllerLobby.slots ?? []).map((slot) => ({
      playerId: slot.playerId,
      slotNumber: slot.slotNumber,
      name: slot.name,
      color: slot.color,
      gender: normalizePlayerGender(slot.gender),
      ready: slot.ready,
      connected: slot.connected,
      connectionState: slot.connectionState
    }))
  };
}

function getRemoteEncounterStateForController() {
  const encounter = state.gameState?.activeEncounter;
  if (!encounter) return null;
  const card = getEncounterCardById(encounter.cardId);
  const activePlayer = getActivePlayer();
  const hasAdvancedEncounter = Boolean(encounter.choiceId || encounter.pendingStep || encounter.status === "resolved");
  const promptText = getLocalizedEncounterText(hasAdvancedEncounter ? encounter.resultText : card?.prompt);
  const resultText = getLocalizedEncounterText(encounter.resultText);
  const canChoose = !encounter.pendingStep && encounter.status !== "resolved";
  return {
    active: true,
    playerId: getEncounterActionPlayer()?.id ?? getActivePlayer()?.id ?? null,
    prompt: promptText || "",
    resultText: resultText || "",
    pendingType: encounter.pendingStep?.type ?? null,
    pendingStep: getRemoteEncounterPendingStep(encounter.pendingStep),
    status: encounter.status,
    choices: canChoose ? (card?.choices ?? []).map((choice) => ({
      id: choice.id,
      label: getLocalizedEncounterText(choice.label) || choice.id,
      available: isEncounterChoiceAvailable(choice, activePlayer)
    })) : []
  };
}

function getRemoteEncounterPendingStep(pendingStep) {
  if (!pendingStep) return null;
  if (pendingStep.type === "message") {
    return {
      type: "message",
      titleText: getLocalizedEncounterText(pendingStep.titleText),
      bodyText: getLocalizedEncounterText(pendingStep.bodyText),
      detailText: getLocalizedEncounterText(pendingStep.detailText),
      continueLabel: t("continue")
    };
  }
  if (pendingStep.type === "singleMothershipRoll") {
    return {
      type: "singleMothershipRoll",
      activePlayerId: pendingStep.activePlayerId,
      rolled: Boolean(pendingStep.roll)
    };
  }
  if (pendingStep.type === "dualMothershipRoll") {
    return {
      type: "dualMothershipRoll",
      mode: pendingStep.mode,
      activePlayerId: pendingStep.activePlayerId,
      targetPlayerId: pendingStep.targetPlayerId,
      activeRolled: Boolean(pendingStep.activeRoll),
      targetRolled: Boolean(pendingStep.targetRoll)
    };
  }
  if (pendingStep.type === "driveComparisonPreview") {
    return {
      type: "driveComparisonPreview",
      activePlayerId: pendingStep.activePlayerId,
      targetPlayerId: pendingStep.targetPlayerId,
      active: pendingStep.active,
      target: pendingStep.target,
      outcome: pendingStep.outcome,
      success: Boolean(pendingStep.success)
    };
  }
  if (pendingStep.type === "choiceSelection") {
    return {
      type: "choiceSelection",
      promptText: getLocalizedEncounterText(pendingStep.promptText),
      choices: (pendingStep.choices ?? []).map((choice) => ({
        id: choice.id,
        label: getLocalizedEncounterText(choice.label) || choice.id,
        available: true
      }))
    };
  }
  if (pendingStep.type === "resourceSelection") {
    return {
      type: "resourceSelection",
      mode: pendingStep.mode,
      amount: pendingStep.amount,
      selectedResources: pendingStep.selectedResources ?? {}
    };
  }
  if (pendingStep.type === "shipBlockSelection") {
    return {
      type: "shipBlockSelection",
      shipIds: pendingStep.shipIds ?? [],
      hint: getLocalizedEncounterText(pendingStep.hint)
    };
  }
  if (pendingStep.type === "upgradeSelection") {
    return {
      type: "upgradeSelection",
      mode: pendingStep.mode,
      amount: pendingStep.amount
    };
  }
  if (pendingStep.type === "opponentResourceGiftSelection") {
    return {
      type: "opponentResourceGiftSelection",
      amount: pendingStep.amount,
      receiverPlayerId: pendingStep.receiverPlayerId,
      currentGiverPlayerId: pendingStep.currentGiverPlayerId
    };
  }
  if (pendingStep.type === "globalUpgradeLossSelection") {
    return {
      type: "globalUpgradeLossSelection",
      amount: pendingStep.amount,
      currentTargetPlayerId: pendingStep.currentTargetPlayerId
    };
  }
  if (pendingStep.type === "shipJumpSelection") {
    return {
      type: "shipJumpSelection",
      shipIds: pendingStep.shipIds ?? [],
      hint: getLocalizedEncounterText(pendingStep.hint)
    };
  }
  if (pendingStep.type === "boardTargetSelection") {
    return {
      type: "boardTargetSelection",
      shipId: pendingStep.shipId,
      validNodeIds: pendingStep.validNodeIds ?? [],
      hint: getLocalizedEncounterText(pendingStep.hint)
    };
  }
  return {
    type: pendingStep.type
  };
}

function getRemoteBoardState() {
  if (state.view !== "board" || !state.gameState) return null;
  return {
    mode: getRemoteBoardMode(),
    actionPlayerId: getRemoteBoardActionPlayerId(),
    svg: serializeBoardSvgForController()
  };
}

function getRemoteBoardActionPlayerId() {
  if (state.gameState?.supernova?.shipBattle) return null;
  const pendingEncounterStep = state.gameState?.activeEncounter?.pendingStep;
  if (
    state.encounterBoardSelectionActive &&
    ["shipJumpSelection", "boardTargetSelection", "shipBlockSelection"].includes(pendingEncounterStep?.type)
  ) {
    return getEncounterActionPlayer()?.id ?? null;
  }
  if (state.gameState?.board?.pendingShipPlacement) {
    return state.gameState.board.pendingShipPlacement.ownerPlayerId ?? null;
  }
  if (state.gameState?.board?.pendingSpaceportUpgrade) {
    return state.gameState.board.pendingSpaceportUpgrade.ownerPlayerId ?? null;
  }
  if (state.gameState?.supernova?.pendingFactoryPlacement) {
    return state.gameState.supernova.pendingFactoryPlacement.ownerPlayerId ?? null;
  }
  if (state.gameState?.phase === "placement") {
    return ["placeSpaceport", "placeColonyShip", "placeFirstColony", "placeSecondColony"].includes(state.gameState.placement?.step)
      ? getActivePlayer()?.id ?? null
      : null;
  }
  if (
    state.gameState?.phase === "flight" &&
    state.gameState.hasRolledFlightSpeed &&
    !state.gameState.activeEncounter &&
    getMovableShipsForActivePlayer().length > 0
  ) {
    return getActivePlayer()?.id ?? null;
  }
  return null;
}

function getRemoteBoardMode() {
  const pendingEncounterStep = state.gameState?.activeEncounter?.pendingStep;
  if (state.encounterBoardSelectionActive && pendingEncounterStep?.type === "shipJumpSelection") return t("selectOwnShip");
  if (state.encounterBoardSelectionActive && pendingEncounterStep?.type === "shipBlockSelection") return t("selectOwnShip");
  if (state.encounterBoardSelectionActive && pendingEncounterStep?.type === "boardTargetSelection") return t("encounterSelectTargetPoint");
  if (state.gameState?.board?.pendingShipPlacement) return t("chooseStartPointHint");
  if (state.gameState?.board?.pendingSpaceportUpgrade) return t("chooseStartPointHint");
  if (state.gameState?.supernova?.pendingFactoryPlacement) {
    return getRemoteFactoryPlacementState()?.hint ?? t("supernovaFactoryChoosePlanet");
  }
  if (state.gameState?.phase === "placement") {
    const hint = getControllerPlacementBoardHint(state.gameState.placement?.step);
    if (hint) return hint;
  }
  if (state.gameState?.phase === "flight") return getControllerFlightBoardHint();
  return t("boardViewOnly");
}

function getMovableShipsForActivePlayer() {
  const activePlayer = getActivePlayer();
  if (
    !activePlayer ||
    state.gameState?.phase !== "flight" ||
    !state.gameState.hasRolledFlightSpeed ||
    state.gameState.activeEncounter ||
    state.gameState.supernova?.shipBattle
  ) {
    return [];
  }

  return (state.gameState.board?.ships ?? [])
    .filter((ship) => ship.ownerPlayerId === activePlayer.id)
    .filter((ship) => !isShipFlightAnimating(ship.id))
    .filter((ship) => getShipRemainingMovement(ship.id) > 0);
}

function getControllerFlightTurnHint() {
  if (state.gameState?.phase !== "flight") return "";
  const activePlayer = getActivePlayer();
  if (!state.gameState.hasRolledFlightSpeed) return "";
  if (getMovableShipsForActivePlayer().length === 0) return t("controllerFlightNoMovableShips");
  const speed = Number(state.gameState.flightSpeedTotal);
  return `${t("controllerFlightTurnMoveShips")} ${t("controllerFlightSpeed").replace("{speed}", Number.isFinite(speed) ? speed : "-")} ${t("controllerFlightTurnChooseTarget")}`;
}

function getControllerFlightBoardHint() {
  if (state.gameState?.phase !== "flight") return t("boardViewOnly");
  const activePlayer = getActivePlayer();
  if (!activePlayer) return t("boardViewOnly");
  if (!state.gameState.hasRolledFlightSpeed) return t("boardViewOnly");
  if (state.gameState.activeEncounter) return t("boardViewOnly");
  if (getSelectedShip()) {
    const remaining = getShipRemainingMovement(getSelectedShip().id);
    if ((state.gameState.supernova?.blockedShipIds ?? []).includes(getSelectedShip().id)) {
      const blockReason = (state.gameState.supernova?.blockedShipDetails ?? [])
        .find((entry) => entry.shipId === getSelectedShip().id)?.reason;
      return t(blockReason === "lostBattleshipCombat"
        ? "controllerFlightShipBlockedByBattle"
        : "controllerFlightShipBlocked");
    }
    if (remaining <= 0) return t("controllerFlightNoMovementRemaining");
    const key = remaining === 1 ? "controllerFlightMovementRemainingOne" : "controllerFlightMovementRemainingMany";
    return t(key).replace("{count}", remaining);
  }
  if (getMovableShipsForActivePlayer().length > 0) return t("controllerFlightBoardChooseShip");
  return t("controllerFlightNoMovableShips");
}

function serializeBoardSvgForController() {
  try {
    const renderedSvg = document.querySelector(".board-placeholder .board-svg");
    if (renderedSvg) return renderedSvg.outerHTML;
    runtimePerformanceMetrics.remoteBoardFallbackBuilds += 1;
    return renderBoardSvg().outerHTML;
  } catch {
    return "";
  }
}

function getRemoteControllerActions() {
  const actions = [];

  if (state.view === "menu") {
    actions.push(createRemoteAction("newGame", t("newGame")));
    return actions;
  }

  if (state.view !== "board" || !state.gameState) {
    actions.push(createRemoteAction("backToMenu", t("backToMenu")));
    return actions;
  }

  if (state.modal) {
    actions.push(createRemoteAction("closeModal", t("close")));
  }
  if (state.hudPlayerId) {
    actions.push(createRemoteAction("closeHud", t("close")));
    actions.push(
      createRemoteAction("hudTab", t("tabTurn"), { tab: "turn" }),
      createRemoteAction("hudTab", t("tabTrade"), { tab: "resources" }),
      createRemoteAction("hudTab", t("tabUpgrades"), { tab: "upgrades" }),
      createRemoteAction("hudTab", t("tabBuild"), { tab: "build" }),
      createRemoteAction("hudTab", t("tabOutposts"), { tab: "outposts" }),
      createRemoteAction("hudTab", t("tabOverview"), { tab: "overview" })
    );
  }

  for (const player of state.gameState.players ?? []) {
    actions.push(createRemoteAction("openPlayerHud", player.name, { targetPlayerId: player.id }));
  }

  actions.push(
    createRemoteAction("save.quick", t("save"), {}, { adminOnly: true }),
    createRemoteAction("save.named", t("save"), {}, { adminOnly: true }),
    createRemoteAction("openControllers", t("connectControllers"), {}, { adminOnly: true }),
    createRemoteAction("admin.backToMenu", t("backToMenu"), {}, { adminOnly: true }),
    createRemoteAction("admin.tvReload", "TV neu laden", {}, { adminOnly: true }),
    createRemoteAction("admin.tvHardReload", "Hard Reload / Cache löschen", {}, { adminOnly: true })
  );

  const shipBattle = state.gameState.supernova?.shipBattle;
  if (shipBattle) {
    if (shipBattle.stage === "rolling") {
      if (!shipBattle.attackerRoll) {
        actions.push(createRemoteAction(
          "supernova.battle.roll",
          t("encounterMothershipRollButton"),
          {},
          { forPlayerId: shipBattle.attackerPlayerId }
        ));
      }
      if (!shipBattle.defenderRoll) {
        actions.push(createRemoteAction(
          "supernova.battle.roll",
          t("encounterMothershipRollButton"),
          {},
          { forPlayerId: shipBattle.defenderPlayerId }
        ));
      }
    } else if (shipBattle.stage === "upgradeLoss") {
      for (const upgradeId of shipBattle.removableUpgradeIds ?? []) {
        actions.push(createRemoteAction(
          "supernova.battle.chooseUpgrade",
          `${t("chooseUpgrade")} · ${getUpgradeLabel(upgradeId)}`,
          { upgrade: upgradeId },
          { forPlayerId: shipBattle.pendingUpgradePlayerId }
        ));
      }
    } else if (shipBattle.stage === "completed") {
      actions.push(createRemoteAction(
        "supernova.battle.finish",
        t("supernovaBattleAcknowledge"),
        {},
        { forPlayerId: shipBattle.attackerPlayerId }
      ));
    }
    return actions;
  }

  if (state.gameState.activeEncounter) {
    for (const choice of getRemoteEncounterStateForController()?.choices ?? []) {
      actions.push(createRemoteAction("encounter.choose", choice.label, { choiceId: choice.id }, {
        disabled: !choice.available,
        requiresActivePlayer: true
      }));
    }
    const pendingEncounterStep = state.gameState.activeEncounter.pendingStep;
    const hasNoEncounterTargets =
      (pendingEncounterStep?.type === "shipJumpSelection" && (pendingEncounterStep.shipIds ?? []).length === 0) ||
      (pendingEncounterStep?.type === "shipBlockSelection" && (pendingEncounterStep.shipIds ?? []).length === 0) ||
      (pendingEncounterStep?.type === "boardTargetSelection" && (pendingEncounterStep.validNodeIds ?? []).length === 0);
    if (hasNoEncounterTargets) {
      actions.push(createRemoteAction("finishEncounter", t("finishEncounter"), {}, { requiresActivePlayer: true }));
    }
    if (state.gameState.activeEncounter.status === "resolved") {
      actions.push(createRemoteAction("finishEncounter", t("finishEncounter"), {}, { requiresActivePlayer: true }));
    }
    return actions;
  }

  if (state.gameState.phase === "placement" && state.gameState.placement?.step === "rollStartPlayer" && !isDiceRollAnimating()) {
    actions.push(createRemoteAction("rollPlacement", t("rollStartPlayer"), {}, { requiresActivePlayer: true }));
  }

  if (state.gameState.sevenResolution?.active) {
    return actions;
  }

  if (state.gameState.phase === "production" && !isDiceRollAnimating()) {
    actions.push(createRemoteAction("rollProduction", t("rollProduction"), {}, { requiresActivePlayer: true }));
  }

  if (state.gameState.phase === "tradeBuild") {
    const pendingFactoryPlacement = state.gameState.supernova?.pendingFactoryPlacement;
    const drawCount = getSupplyDrawCount(getActivePlayer());
    if (drawCount > 0 && canDrawSupply(state.gameState)) {
      actions.push(createRemoteAction("drawSupply", t("drawSupply").replace("{count}", drawCount), {}, { requiresActivePlayer: true }));
    }
    actions.push(createRemoteAction("toFlightPhase", t("toFlightPhase"), {}, {
      requiresActivePlayer: true,
      disabled: Boolean(pendingFactoryPlacement)
    }));
    actions.push(
      createRemoteAction("build.colonyShip", t("build_colonyShip"), {}, { requiresActivePlayer: true, disabled: Boolean(pendingFactoryPlacement) }),
      createRemoteAction("build.tradeShip", t("build_tradeShip"), {}, { requiresActivePlayer: true, disabled: Boolean(pendingFactoryPlacement) }),
      createRemoteAction("build.spaceport", t("build_spaceport"), {}, { requiresActivePlayer: true, disabled: Boolean(pendingFactoryPlacement) })
    );
    if (isSupernovaGame(state.gameState)) {
      actions.push(createRemoteAction("build.battleShip", t("build_battleShip"), {}, { requiresActivePlayer: true, disabled: Boolean(pendingFactoryPlacement) }));
      if (pendingFactoryPlacement) {
        actions.push(createRemoteAction("supernova.factory.cancel", t("cancelFactoryBuild"), {}, { requiresActivePlayer: true }));
      }
      const factoryOptions = getBuildableSupernovaFactoryOptions(state.gameState, boardLayout, getActivePlayer()?.id);
      for (const factoryType of supernovaFactoryTypes) {
        const options = factoryOptions.filter((option) => option.factoryType === factoryType.id);
        const option = options.find((candidate) => candidate.canBuild) ?? options[0];
        if (!option) continue;
        actions.push(createRemoteAction(
          "supernova.factory",
          `${getSupernovaLocalizedTitle(factoryType, state.language)} ${t("build")}`,
          {
            factoryType: factoryType.id,
            factoryTitle: getSupernovaLocalizedTitle(factoryType, state.language),
            resource: factoryType.resource,
            cost: factoryType.cost,
            validPlanetIds: options.filter((candidate) => candidate.canBuild).map((candidate) => candidate.planetId)
          },
          { requiresActivePlayer: true, disabled: Boolean(pendingFactoryPlacement) || !options.some((candidate) => candidate.canBuild) }
        ));
      }
    }
    for (const upgrade of upgradeDefinitions) {
      actions.push(createRemoteAction("upgrade.buy", `${t("build")} ${getUpgradeLabel(upgrade.id)}`, { upgradeId: upgrade.id }, {
        requiresActivePlayer: true,
        disabled: Boolean(pendingFactoryPlacement)
      }));
    }
  }

  if (state.gameState.phase === "flight") {
    if (!state.gameState.hasRolledFlightSpeed && !isMothershipSpeedAnimating()) {
      if (canDrawSupply(state.gameState)) {
        const drawCount = getSupplyDrawCount(getActivePlayer());
        actions.push(createRemoteAction("drawSupply", t("drawSupply").replace("{count}", drawCount), {}, { requiresActivePlayer: true }));
      }
      actions.push(createRemoteAction("determineSpeed", t("determineSpeed"), {}, { requiresActivePlayer: true }));
    }
    const boardActions = getAvailableBoardActions(
      state.gameState,
      boardLayout,
      getActivePlayer()?.id
    ).filter((action) => !isShipFlightAnimating(action.shipId));
    for (const action of boardActions) {
      const labelKey = action.id === "found.colony" ? "foundColony" : "foundTradeStation";
      actions.push(createRemoteAction(action.id, t(labelKey), { shipId: action.shipId }, { requiresActivePlayer: true }));
    }
    actions.push(createRemoteAction("endTurn", t("endTurn"), {}, { requiresActivePlayer: true }));
  }

  if (state.gameState.players?.[0]) {
    actions.push(createRemoteAction("app.exit", t("exitGame"), {}, { adminOnly: true }));
  }

  return actions;
}

function createRemoteAction(id, label, payload = {}, options = {}) {
  return { id, label, payload, ...options };
}

function getRemoteSaveList() {
  return readSaves()
    .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))
    .map((save) => ({
      id: save.id,
      name: save.name || t("unnamedSave"),
      savedAt: save.savedAt,
      displayDate: save.displayDate || formatSavedAt(save.savedAt),
      playerCount: getSavePlayerCount(save)
    }));
}

function isPlayerAdmin(playerId) {
  return Boolean(playerId && state.gameState?.players?.[0]?.id === playerId);
}

function isRemoteActionPlayerActive(playerId) {
  return Boolean(playerId && getActivePlayer()?.id === playerId);
}

function isRemoteEncounterActionPlayer(playerId) {
  const pendingStep = state.gameState?.activeEncounter?.pendingStep;
  if (pendingStep?.type === "singleMothershipRoll") {
    return Boolean(playerId && pendingStep.activePlayerId === playerId && !pendingStep.roll);
  }
  if (pendingStep?.type === "dualMothershipRoll") {
    return isDualMothershipRollParticipant(pendingStep, playerId)
      && !hasDualMothershipRollForPlayer(pendingStep, playerId);
  }
  return Boolean(playerId && getEncounterActionPlayer()?.id === playerId);
}

function executeRemoteAction(actionId, payload = {}) {
  const playerId = payload.playerId;
  switch (actionId) {
    case "player.setName":
      updateControllerName(playerId, payload.name);
      break;
    case "player.selectColor":
      updateControllerColor(playerId, payload.color);
      break;
    case "player.selectGender":
      updateControllerGender(playerId, payload.gender);
      break;
    case "player.ready":
      if (typeof payload.name === "string") updateControllerName(playerId, payload.name);
      setControllerReady(playerId, true);
      break;
    case "player.edit":
      setControllerReady(playerId, false);
      break;
    case "newGame":
      startNewGameSetup();
      break;
    case "backToMenu":
      setView("menu");
      break;
    case "openSettings":
      if (isPlayerAdmin(playerId)) openModal("settings");
      break;
    case "openControllers":
      if (isPlayerAdmin(playerId)) openModal("controllers");
      break;
    case "closeModal":
      closeModal();
      break;
    case "closeHud":
      closePlayerHud();
      break;
    case "openPlayerHud":
      openPlayerHud(payload.targetPlayerId || playerId);
      break;
    case "hudTab":
      if (payload.tab) {
        state.hudTab = payload.tab;
        render();
      }
      break;
    case "rollPlacement":
      if (isRemoteActionPlayerActive(playerId)) rollPlacementForActivePlayer();
      break;
    case "rollProduction":
      if (isRemoteActionPlayerActive(playerId)) rollProductionForActivePlayer();
      break;
    case "drawSupply":
      if (isRemoteActionPlayerActive(playerId)) drawSupplyForActivePlayer();
      break;
    case "seven.discardResource":
      if (payload.resource && Number.isInteger(payload.delta)) updateSevenDiscardForPlayer(playerId, payload.resource, payload.delta);
      break;
    case "seven.submitDiscard":
      submitSevenDiscardForPlayer(playerId);
      break;
    case "seven.selectStealTarget":
      if (isRemoteActionPlayerActive(playerId) && payload.targetPlayerId) chooseSevenStealTarget(payload.targetPlayerId);
      break;
    case "seven.resolveSteal":
      if (isRemoteActionPlayerActive(playerId)) resolveSevenStealForActivePlayer();
      break;
    case "seven.distributeSupply":
      if (isRemoteActionPlayerActive(playerId)) distributeSevenSupplyForActivePlayer();
      break;
    case "trade.setBankResources":
      if (isRemoteActionPlayerActive(playerId)) {
        if (resourceTypes.includes(payload.fromResource)) state.tradeFromResource = payload.fromResource;
        if (resourceTypes.includes(payload.toResource)) state.tradeToResource = payload.toResource;
        render();
      }
      break;
    case "trade.bankTrade":
      if (isRemoteActionPlayerActive(playerId)) tradeActivePlayerWithSupply();
      break;
    case "trade.setOfferTarget":
      if (isRemoteActionPlayerActive(playerId)) setTradeOfferTarget(payload.targetPlayerId || null);
      break;
    case "trade.updateOfferResource":
      if (isRemoteActionPlayerActive(playerId) && ["offered", "requested"].includes(payload.side) && resourceTypes.includes(payload.resource)) {
        updateTradeOfferResource(payload.side, payload.resource, Number(payload.delta) || 0);
      }
      break;
    case "trade.createOffer":
      if (isRemoteActionPlayerActive(playerId)) offerTradeToPlayer();
      break;
    case "trade.acceptOffer":
      if (state.gameState?.activeTradeOffer?.toPlayerId === playerId) acceptTradeOffer(playerId);
      break;
    case "trade.declineOffer":
      if (state.gameState?.activeTradeOffer?.toPlayerId === playerId) declineTradeOffer(playerId);
      break;
    case "trade.cancelOffer":
      if (state.gameState?.activeTradeOffer?.fromPlayerId === playerId) cancelOpenTradeOffer();
      break;
    case "toFlightPhase":
      if (isRemoteActionPlayerActive(playerId)) goToFlightPhase();
      break;
    case "found.colony":
      if (isRemoteActionPlayerActive(playerId) && payload.shipId) foundColonyWithShip(payload.shipId);
      break;
    case "found.tradeStation":
      if (isRemoteActionPlayerActive(playerId) && payload.shipId) foundTradeStationWithShip(payload.shipId);
      break;
    case "determineSpeed":
      if (isRemoteActionPlayerActive(playerId)) determineSpeedForActivePlayer();
      break;
    case "endTurn":
      if (isRemoteActionPlayerActive(playerId)) endTurn();
      break;
    case "save.quick":
      if (isPlayerAdmin(playerId)) saveCurrentGame(t("defaultSaveName"), { returnToSettings: false });
      break;
    case "save.named":
      if (isPlayerAdmin(playerId)) saveCurrentGame(String(payload.name || ""), { returnToSettings: false });
      break;
    case "save.load":
      if (isPlayerAdmin(playerId) && payload.saveId) {
        const save = readSaves().find((candidate) => candidate.id === payload.saveId);
        if (save) loadSave(save);
      }
      break;
    case "save.delete":
      if (isPlayerAdmin(playerId) && payload.saveId) deleteSave(payload.saveId);
      break;
    case "admin.backToMenu":
      if (isPlayerAdmin(playerId)) {
        writeAutosaveNow();
        state.modal = null;
        state.hudPlayerId = null;
        setView("menu");
      }
      break;
    case "admin.tvReload":
      if (isPlayerAdmin(playerId)) requestTvReload();
      break;
    case "admin.tvHardReload":
      if (isPlayerAdmin(playerId)) requestTvHardReload();
      break;
    case "finishEncounter":
      if (isRemoteActionPlayerActive(playerId)) finishActiveEncounter();
      break;
    case "build.colonyShip":
      if (isRemoteActionPlayerActive(playerId)) buildActivePlayerShip("colonyShip");
      break;
    case "build.tradeShip":
      if (isRemoteActionPlayerActive(playerId)) buildActivePlayerShip("tradeShip");
      break;
    case "build.battleShip":
      if (isRemoteActionPlayerActive(playerId)) buildActivePlayerShip("battleShip");
      break;
    case "build.spaceport":
      if (isRemoteActionPlayerActive(playerId)) buildActivePlayerSpaceport();
      break;
    case "supernova.factory":
      if (isRemoteActionPlayerActive(playerId) && payload.factoryType) {
        beginActivePlayerSupernovaFactoryPlacement(payload.factoryType);
      }
      break;
    case "supernova.factory.cancel":
      if (isRemoteActionPlayerActive(playerId)) cancelActiveFactoryPlacement();
      break;
    case "supernova.battle.roll": {
      const nextGameState = submitSupernovaShipBattleRoll(state.gameState, { playerId });
      if (nextGameState !== state.gameState) {
        state.gameState = nextGameState;
        saveCurrentGameState();
        render();
      }
      break;
    }
    case "supernova.battle.chooseUpgrade": {
      const nextGameState = chooseSupernovaShipBattleUpgrade(state.gameState, {
        playerId,
        upgrade: payload.upgrade
      });
      if (nextGameState !== state.gameState) {
        state.gameState = nextGameState;
        saveCurrentGameState();
        render();
      }
      break;
    }
    case "supernova.battle.finish": {
      const nextGameState = finishSupernovaShipBattle(state.gameState, { playerId });
      if (nextGameState !== state.gameState) {
        state.gameState = nextGameState;
        saveCurrentGameState();
        render();
      }
      break;
    }
    case "upgrade.buy":
      if (isRemoteActionPlayerActive(playerId) && payload.upgradeId) buyActivePlayerUpgrade(payload.upgradeId);
      break;
    case "encounter.choose":
      if (isRemoteActionPlayerActive(playerId) && payload.choiceId) resolveActiveEncounterChoice(payload.choiceId);
      break;
    case "encounter.resourceDelta":
      if (isRemoteEncounterActionPlayer(playerId) && payload.resource && Number.isInteger(payload.delta)) {
        updateEncounterPendingResourceChoice(payload.resource, payload.delta);
      }
      break;
    case "encounter.submitPending":
      if (isRemoteEncounterActionPlayer(playerId)) {
        const { completeRoll: _completeRoll, forcedRoll: _forcedRoll, ...safePayload } = payload;
        submitEncounterPendingAction(safePayload);
      }
      break;
    case "encounter.startBoardSelection":
      if (
        isRemoteActionPlayerActive(playerId) &&
        ["shipJumpSelection", "boardTargetSelection", "shipBlockSelection"].includes(state.gameState?.activeEncounter?.pendingStep?.type)
      ) {
        state.encounterBoardSelectionActive = true;
        render();
      }
      break;
    case "board.select":
      if (isRemoteActionPlayerActive(playerId) && payload.type && payload.id) {
        if (payload.type === "ship" && confirmEncounterJumpShip(payload.id)) {
          break;
        }
        if (payload.type === "ship" && confirmEncounterBlockShip(payload.id)) {
          break;
        }
        if (payload.type === "spacePoint" && confirmEncounterTargetAt(payload.id)) {
          break;
        }
        if (payload.type === "ship" && state.gameState?.phase === "flight") {
          selectRemoteFlightShip(playerId, payload.id);
        } else {
          selectBoardElement(payload.type, payload.id);
        }
      }
      break;
    case "board.moveShip":
      if (isRemoteActionPlayerActive(playerId) && typeof payload.targetNodeId === "string") {
        moveRemoteSelectedShip(playerId, payload.targetNodeId);
      }
      break;
    case "placement.select":
      if (isRemoteActionPlayerActive(playerId) && typeof payload.nodeId === "string") {
        handlePlacementPointSelection(payload.nodeId);
      }
      break;
    case "app.exit":
      if (isPlayerAdmin(playerId)) requestAppExit();
      break;
    default:
      break;
  }
}

function selectRemoteFlightShip(playerId, shipId) {
  if (
    !state.gameState ||
    state.gameState.phase !== "flight" ||
    state.gameState.activeEncounter ||
    !state.gameState.hasRolledFlightSpeed
  ) {
    return;
  }

  const ship = state.gameState.board?.ships?.find((candidate) => candidate.id === shipId);
  if (!ship || ship.ownerPlayerId !== playerId || getShipRemainingMovement(ship.id) <= 0 || isShipFlightAnimating(ship.id)) {
    return;
  }

  selectBoardElement("ship", ship.id);
}

function moveRemoteSelectedShip(playerId, targetNodeId) {
  const selectedShip = getSelectedShip();
  if (!selectedShip || selectedShip.ownerPlayerId !== playerId) return;
  moveSelectedShipTo(targetNodeId);
}

function updateControllerName(playerId, name) {
  const trimmedName = String(name || "").trim().slice(0, 32);
  updateControllerLobbySlot(playerId, { name: trimmedName });
}

function updateControllerColor(playerId, color) {
  if (!playerPieceColors.includes(color)) return;
  if (getControllerLobbyColorsInUse(playerId).has(color)) return;
  updateControllerLobbySlot(playerId, { color });
}

function updateControllerGender(playerId, gender) {
  if (!playerGenders.includes(gender)) return;
  updateControllerLobbySlot(playerId, { gender });
}

function setControllerReady(playerId, ready) {
  const slot = getControllerLobbySlot(playerId);
  if (!slot) return;
  if (ready && (!slot.name.trim() || !slot.color || !playerGenders.includes(slot.gender) || getControllerLobbyColorsInUse(playerId).has(slot.color))) return;
  updateControllerLobbySlot(playerId, { ready });
}

function requestAppExit() {
  if (window.FireTvBridge?.closeApp) {
    window.FireTvBridge.closeApp();
    return;
  }
  audioManager.play("uiError");
  state.notice = t("fireTvExitUnavailable");
  render();
}

function requestTvReload() {
  if (window.FireTvBridge?.reload) {
    window.FireTvBridge.reload();
    return;
  }
  window.location.reload();
}

function requestTvHardReload() {
  if (window.FireTvBridge?.hardReload) {
    window.FireTvBridge.hardReload();
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("tvReload", String(Date.now()));
  window.location.replace(url.toString());
}

function render() {
  runtimePerformanceMetrics.appRenders += 1;
  captureRemoteFocus();
  capturePlayerHudScrollPosition();
  document.documentElement.lang = state.language;
  app.classList.toggle("app-shell--board", state.view === "board");
  app.classList.toggle("app-shell--main-menu", state.view === "menu");
  app.classList.toggle("app-shell--shell", ["controllers", "loading", "playerSetup", "players"].includes(state.view));
  ensurePendingSingleMothershipRollAnimation();
  ensureSupernovaBattleReveal();

  const views = {
    board: renderBoardShell,
    controllers: renderControllerConnect,
    loading: renderLoadingScreen,
    menu: renderMenu,
    playerSetup: renderPlayerSetup,
    players: renderPlayerSelect
  };

  const renderedView = (views[state.view] ?? renderMenu)();
  const renderedModal = renderModal();

  const storageWarning = renderStorageWarning();
  app.replaceChildren(...[renderedView, renderedModal, storageWarning].filter(Boolean));
  restorePlayerHudScrollPosition();
  drawShipEngineVfxOverlays();
  syncShipVfxLoop();
  syncGameAudioState();
  publishRemoteHostState();
  prepareRemoteNavigation();
}

function syncGameAudioState() {
  const phase = state.gameState?.phase ?? null;
  if (phase === "gameOver" && previousAudioGamePhase !== "gameOver") {
    audioManager.play("victory");
  }
  previousAudioGamePhase = phase;

  const encounterCardId = state.gameState?.activeEncounter?.cardId ?? null;
  if (encounterCardId && encounterCardId !== previousAudioEncounterCardId) {
    audioManager.play("uiOpen");
  }
  previousAudioEncounterCardId = encounterCardId;
}

function getAudioControl(target) {
  return target instanceof Element
    ? target.closest("button, [role='button'], input, select, textarea")
    : null;
}

function handleAudioFocus(event) {
  const control = getAudioControl(event.target);
  if (!control || control === lastAudioFocusElement || control.matches(":disabled")) return;
  const now = performance.now();
  lastAudioFocusElement = control;
  if (now - lastAudioFocusAt < 45) return;
  lastAudioFocusAt = now;
  audioManager.play("uiFocus");
}

function handleAudioActivation(event) {
  const control = getAudioControl(event.target);
  if (
    !control
    || !control.matches("button, [role='button']")
    || control.matches(":disabled")
    || control.dataset.sound === "none"
  ) return;
  audioManager.play(control.dataset.sound || "uiConfirm");
}

function requestAudioUnlock() {
  void audioManager.unlock();
}

document.addEventListener("keydown", handleRemoteKeydown);
document.addEventListener("keydown", requestAudioUnlock, { capture: true });
document.addEventListener("pointerdown", requestAudioUnlock, { capture: true, passive: true });
document.addEventListener("touchstart", requestAudioUnlock, { capture: true, passive: true });
document.addEventListener("click", handleAudioActivation, true);
document.addEventListener("focusin", handleAudioFocus);
document.addEventListener("focusin", () => {
  const controls = getRemoteFocusControls();
  const index = controls.indexOf(document.activeElement);
  if (index >= 0) {
    remoteFocusIndex = index;
    remoteFocusKey = getRemoteControlKey(document.activeElement, controls);
    controls.forEach((control) => control.classList.toggle("is-remote-focused", control === document.activeElement));
  }
});
window.addEventListener("firetvback", handleRemoteBack);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    audioManager.stopAll();
    writeAutosaveNow();
  } else if (storageWriteFailures.size > 0) {
    queueStorageStatusRender();
  }
});
window.addEventListener("pagehide", writeAutosaveNow);
window.addEventListener("beforeunload", writeAutosaveNow);
startupRetryButton?.addEventListener("click", () => {
  void bootstrapApplication({ retry: true });
});

globalThis.__starOdysseyAudio = {
  getSettings: () => audioManager.getSettings(),
  getStats: () => audioManager.getStats(),
  unlock: () => audioManager.unlock()
};

void bootstrapApplication();
