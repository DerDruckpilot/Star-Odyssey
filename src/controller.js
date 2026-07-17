import { buildActionDefinitions, resourceTypes, upgradeDefinitions } from "./data/buildCosts.js";
import { getFriendshipCardById, getFriendshipCardSummary, getFriendshipCardTitle } from "./data/friendshipCards.js";
import { getFactoryBlueprintAssetPath } from "./data/factoryVisuals.js";
import {
  getSupernovaLocalizedText,
  getSupernovaLocalizedTitle,
  supernovaFactoryLimitPerPlayer,
  supernovaFactoryTypes
} from "./data/supernova.js";
import { mothershipUpgradeSlots, upgradeMenuAssetPaths, upgradeMenuOrder } from "./data/upgradeVisuals.js";
import { getText } from "./i18n.js";
import { getControllerFlightStatus } from "./controller-flight-status.js";

const root = document.querySelector("#controller-root");
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session") || "";
const accessToken = params.get("token") || "";
const reconnectDelayMs = 1400;
const localControllerStoragePrefix = "star-odyssey-controller-channel";
const iosInstallHintStorageKey = "star-odyssey-ios-install-hint-dismissed";

let socket = null;
let localChannel = null;
let localPrivateChannel = null;
let localTransport = "";
let localFallbackActive = false;
let webSocketConnectedOnce = false;
let reconnectTimer = null;
let selectedPlayerId = normalizePlayerParam(params.get("player"));
let controllerId = loadStoredControllerId(selectedPlayerId);
const connectionId = createControllerConnectionId();
let connectionStatus = "connecting";
let replacedByReconnect = false;
let connectionRetryBlocked = false;
let waitingForHostAccess = false;
let gameState = null;
let activeTab = "turn";
let boardFullscreen = false;
let boardScale = 1;
let boardOffset = { x: 0, y: 0 };
let boardPointers = new Map();
let boardPanStart = null;
let boardViewFitted = false;
let boardGestureMoved = false;
const tabScrollPositions = new Map();
const setupNameDrafts = new Map();
let saveNameDraft = "";
let controllerRenderFrameId = null;
let cachedBoardSvgMarkup = "";
let cachedBoardSvgTemplate = null;
const controllerPerformanceMetrics = {
  renders: 0,
  scheduledStateRenders: 0,
  coalescedStateRenders: 0,
  boardSvgParses: 0,
  boardSvgClones: 0
};
globalThis.__starOdysseyControllerPerformance = controllerPerformanceMetrics;

function t(key, replacements = {}) {
  const language = gameState?.language === "en" ? "en" : "de";
  let text = getText(language, key);
  for (const [name, value] of Object.entries(replacements)) {
    text = text.split(`{${name}}`).join(String(value));
  }
  return text;
}

function getStoredControllerIdKey(playerId) {
  return `star-odyssey-controller-id-${sessionId || "default"}-${playerId || "unknown"}`;
}

function loadStoredControllerId(playerId) {
  const storedControllerIdKey = getStoredControllerIdKey(playerId);
  try {
    const existing = localStorage.getItem(storedControllerIdKey);
    if (existing) return existing;
    const next = `controller-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(storedControllerIdKey, next);
    return next;
  } catch {
    return `controller-${Date.now()}`;
  }
}

function createControllerConnectionId() {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `connection-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function normalizePlayerParam(value) {
  if (!value) return "";
  return /^\d+$/.test(value) ? `player-${value}` : value;
}

function saveSelectedPlayerId(playerId) {
  if (selectedPlayerId === playerId) return;
  selectedPlayerId = playerId;
  controllerId = loadStoredControllerId(playerId);
}

function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function connect(manualRetry = false) {
  if (manualRetry === true) {
    connectionRetryBlocked = false;
    replacedByReconnect = false;
  } else if (connectionRetryBlocked) {
    return;
  }
  if (!sessionId) {
    connectionStatus = "missing-session";
    render();
    return;
  }
  if (!accessToken) {
    connectionStatus = "missing-access";
    render();
    return;
  }
  if (!selectedPlayerId) {
    connectionStatus = "missing-player";
    render();
    return;
  }

  clearTimeout(reconnectTimer);
  localFallbackActive = false;
  webSocketConnectedOnce = false;
  waitingForHostAccess = false;
  connectionStatus = "connecting";
  render();

  try {
    socket = new WebSocket(getWebSocketUrl());
  } catch {
    activateLocalFallback();
    return;
  }
  socket.addEventListener("open", () => {
    replacedByReconnect = false;
    webSocketConnectedOnce = true;
    connectionStatus = "waiting";
    sendHello();
    render();
  });
  socket.addEventListener("message", (event) => {
    handleMessage(event.data);
  });
  socket.addEventListener("close", () => {
    if (replacedByReconnect || connectionRetryBlocked) return;
    if (webSocketConnectedOnce) {
      connectionStatus = waitingForHostAccess ? "waiting" : "lost";
      render();
      reconnectTimer = setTimeout(connect, reconnectDelayMs);
    } else {
      activateLocalFallback();
    }
  });
  socket.addEventListener("error", () => {
    if (socket?.readyState !== WebSocket.OPEN) activateLocalFallback();
  });
}

function sendHello() {
  send({
    type: "hello",
    role: "controller",
    sessionId,
    controllerId,
    playerId: selectedPlayerId,
    accessToken,
    connectionId
  });
}

function send(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    return;
  }
  if (localFallbackActive) {
    sendLocalHostMessage(data);
  }
}

function activateLocalFallback() {
  if (!sessionId) return;
  if (localFallbackActive) return;
  initializeLocalControllerChannel();
  localFallbackActive = true;
  connectionStatus = "waiting";
  render();
  sendHello();
}

function initializeLocalControllerChannel() {
  if (localTransport) return;
  if ("BroadcastChannel" in window) {
    localTransport = "broadcast";
    localChannel = new BroadcastChannel(getLocalControllerChannelName());
    localPrivateChannel = new BroadcastChannel(getLocalControllerPrivateChannelName());
    localChannel.addEventListener("message", (event) => handleLocalHostMessage(event.data));
    localPrivateChannel.addEventListener("message", (event) => handleLocalHostMessage(event.data));
    return;
  }
  localTransport = "storage";
  window.addEventListener("storage", (event) => {
    if (
      ![getLocalControllerStorageKey("host"), getLocalControllerPrivateStorageKey()].includes(event.key) ||
      !event.newValue
    ) return;
    try {
      handleLocalHostMessage(JSON.parse(event.newValue));
    } catch {
      // Ignore unrelated local host messages.
    }
  });
}

function sendLocalHostMessage(data) {
  const payload = {
    ...data,
    source: "controller",
    controllerId,
    connectionId,
    playerId: selectedPlayerId,
    accessToken,
    sessionId,
    sentAt: Date.now()
  };
  if (localTransport === "broadcast" && localChannel) {
    localChannel.postMessage(payload);
    return;
  }
  if (localTransport === "storage") {
    try {
      localStorage.setItem(getLocalControllerStorageKey("controller"), JSON.stringify(payload));
    } catch {
      // Local test transport is best-effort.
    }
  }
}

function handleLocalHostMessage(message) {
  if (!message || message.source !== "host" || message.sessionId !== sessionId) return;
  if (message.targetControllerId && message.targetControllerId !== controllerId) return;
  if (message.targetConnectionId && message.targetConnectionId !== connectionId) return;
  handleMessage(JSON.stringify(message));
}

function getLocalControllerChannelName() {
  return `${localControllerStoragePrefix}:${sessionId}`;
}

function getLocalControllerStorageKey(direction) {
  return `${localControllerStoragePrefix}:${sessionId}:${direction}`;
}

function getLocalControllerPrivateChannelName() {
  return `${getLocalControllerChannelName()}:host:${controllerId}`;
}

function getLocalControllerPrivateStorageKey() {
  return `${getLocalControllerStorageKey("host")}:${controllerId}`;
}

function handleMessage(rawData) {
  let message;
  try {
    message = JSON.parse(rawData);
  } catch {
    return;
  }

  if (message.type === "helloAck") {
    controllerId = message.controllerId || controllerId;
    connectionRetryBlocked = false;
    waitingForHostAccess = false;
    connectionStatus = "connected";
    render();
    return;
  }

  if (message.type === "state") {
    gameState = message.state || null;
    if (!selectedPlayerId && gameState?.players?.[0]?.id) {
      saveSelectedPlayerId(gameState.players[0].id);
      sendHello();
    }
    connectionStatus = "connected";
    scheduleControllerStateRender();
    return;
  }

  if (message.type === "replaced") {
    replacedByReconnect = true;
    connectionRetryBlocked = true;
    connectionStatus = "replaced";
    render();
    socket?.close();
    return;
  }

  if (message.type === "accessPending") {
    waitingForHostAccess = true;
    connectionStatus = "waiting";
    render();
    socket?.close();
    return;
  }

  if (["accessDenied", "accessRevoked", "slotOccupied"].includes(message.type)) {
    connectionRetryBlocked = true;
    waitingForHostAccess = false;
    connectionStatus = message.type === "slotOccupied" ? "occupied" : "access-denied";
    render();
    socket?.close();
  }
}

function scheduleControllerStateRender() {
  if (controllerRenderFrameId !== null) {
    controllerPerformanceMetrics.coalescedStateRenders += 1;
    return;
  }
  controllerPerformanceMetrics.scheduledStateRenders += 1;
  controllerRenderFrameId = requestAnimationFrame(() => {
    controllerRenderFrameId = null;
    render();
  });
}

function sendAction(action) {
  send({
    type: "action",
    sessionId,
    actionId: action.id,
    payload: {
      ...(action.payload || {}),
      playerId: selectedPlayerId
    }
  });
}

function sendNamedAction(actionId, payload = {}) {
  send({
    type: "action",
    sessionId,
    actionId,
    payload: {
      ...payload,
      playerId: selectedPlayerId
    }
  });
}

function createButton(label, onClick, className = "controller-button") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function isStandaloneController() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.matchMedia("(display-mode: fullscreen)").matches
    || window.navigator.standalone === true;
}

function isIosController() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function shouldShowIosInstallHint() {
  if (!isIosController() || isStandaloneController()) return false;
  try {
    return localStorage.getItem(iosInstallHintStorageKey) !== "true";
  } catch {
    return true;
  }
}

function renderIosInstallHint() {
  if (!shouldShowIosInstallHint()) return null;
  const hint = document.createElement("aside");
  hint.className = "controller-ios-install-hint";
  hint.setAttribute("role", "note");

  const text = document.createElement("span");
  text.textContent = t("controllerIosInstallHint");
  const close = createButton("×", () => {
    try {
      localStorage.setItem(iosInstallHintStorageKey, "true");
    } catch {
      // The hint can still be dismissed for the current render.
    }
    hint.remove();
  }, "controller-ios-install-close");
  close.setAttribute("aria-label", t("controllerIosInstallHintClose"));
  hint.append(text, close);
  return hint;
}

function canUseControllerFullscreen() {
  return Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
}

async function toggleControllerFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
  } catch {
    // Browsers may reject fullscreen even after a user gesture.
  }
}

function renderFullscreenButton() {
  if (!canUseControllerFullscreen()) return null;
  const active = Boolean(document.fullscreenElement);
  const button = createButton(active ? "↙" : "⛶", toggleControllerFullscreen, "small-button controller-fullscreen-button");
  const label = t(active ? "controllerFullscreenClose" : "controllerFullscreenOpen");
  button.setAttribute("aria-label", label);
  button.title = label;
  return button;
}

function render() {
  controllerPerformanceMetrics.renders += 1;
  document.documentElement.lang = gameState?.language === "en" ? "en" : "de";
  captureControllerScrollPosition();
  const focusedInput = captureFocusedInput();

  if (boardFullscreen && gameState?.view !== "controllers") {
    root.replaceChildren(renderBoardFullscreen());
    restoreFocusedInput(focusedInput);
    return;
  }

  const shell = document.createElement("section");
  shell.className = "player-hud-panel controller-panel";

  const currentPlayer = getSelectedPlayer();
  const header = renderControllerHeader(currentPlayer);
  const content = document.createElement("div");
  content.className = `player-hud-content controller-content controller-content--${activeTab}`;

  if (gameState?.view === "controllers" && gameState.controllerLobby) {
    content.append(renderSetupPanel());
    shell.append(header, content);
    const installHint = renderIosInstallHint();
    root.replaceChildren(...(installHint ? [installHint, shell] : [shell]));
    restoreControllerScrollPosition();
    restoreFocusedInput(focusedInput);
    return;
  }

  const tabs = renderTabs();
  const activeContent = renderActiveTab(currentPlayer);

  content.append(tabs, activeContent);
  shell.append(header, content);
  const installHint = renderIosInstallHint();
  root.replaceChildren(...(installHint ? [installHint, shell] : [shell]));
  restoreControllerScrollPosition();
  restoreFocusedInput(focusedInput);
}

function captureControllerScrollPosition() {
  const content = root.querySelector(".controller-content");
  if (!content || boardFullscreen) return;
  tabScrollPositions.set(activeTab, content.scrollTop);
}

function restoreControllerScrollPosition() {
  const scrollTop = tabScrollPositions.get(activeTab) ?? 0;
  requestAnimationFrame(() => {
    const content = root.querySelector(".controller-content");
    if (content) content.scrollTop = scrollTop;
  });
}

function captureFocusedInput() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLInputElement) && !(activeElement instanceof HTMLTextAreaElement)) return null;
  const key = activeElement.dataset.controllerInputKey;
  if (!key) return null;
  return {
    key,
    start: activeElement.selectionStart,
    end: activeElement.selectionEnd
  };
}

function restoreFocusedInput(snapshot) {
  if (!snapshot) return;
  requestAnimationFrame(() => {
    const input = root.querySelector(`[data-controller-input-key="${snapshot.key}"]`);
    if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) return;
    input.focus({ preventScroll: true });
    if (Number.isInteger(snapshot.start) && Number.isInteger(snapshot.end)) {
      input.setSelectionRange(snapshot.start, snapshot.end);
    }
  });
}

function renderControllerHeader(player) {
  const header = document.createElement("header");
  header.className = "player-hud-header controller-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "player-hud-title controller-title";
  const title = document.createElement("h2");
  title.textContent = player?.name || getFallbackPlayerName();

  const status = document.createElement("div");
  status.className = `controller-status-line controller-status-line--${connectionStatus}`;
  const statusDot = document.createElement("span");
  statusDot.className = "controller-status-dot";
  statusDot.setAttribute("aria-hidden", "true");
  const statusLabel = document.createElement("span");
  statusLabel.className = "controller-status";
  statusLabel.textContent = getStatusLabel();
  status.append(statusDot, statusLabel, createButton(
    t("controllerReconnect"),
    () => connect(true),
    "small-button controller-reconnect-inline"
  ));

  titleGroup.append(title, status, renderControllerResources(player));

  const actions = document.createElement("div");
  actions.className = "controller-header-actions";
  const fullscreenButton = renderFullscreenButton();
  if (fullscreenButton) actions.append(fullscreenButton);
  if (player && gameState?.view === "board") {
    actions.append(createButton(t("close"), () => {
      boardFullscreen = true;
      render();
    }, "small-button controller-close-button"));
  }

  header.append(titleGroup, actions);
  return header;
}

function renderControllerResources(player) {
  const list = document.createElement("dl");
  list.className = "player-hud-resources controller-resource-list";
  const resources = player?.resources ?? {};
  for (const resource of resourceTypes) {
    const term = document.createElement("dt");
    term.textContent = getResourceLabel(resource);
    const value = document.createElement("dd");
    value.textContent = String(resources[resource] ?? 0);
    list.append(term, value);
  }
  return list;
}

function renderSetupPanel() {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section controller-setup";
  const slot = getOwnLobbySlot();
  const title = document.createElement("h2");
  title.textContent = slot
    ? t("controllerConnectedAsPlayer", { number: slot.slotNumber })
    : t("controllerSetupTitle");

  const nameLabel = document.createElement("label");
  nameLabel.className = "controller-field";
  nameLabel.textContent = t("playerSetupName");
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  const draftName = setupNameDrafts.has(selectedPlayerId)
    ? setupNameDrafts.get(selectedPlayerId)
    : (slot?.name ?? "");
  nameInput.value = draftName;
  nameInput.disabled = Boolean(slot?.ready);
  nameInput.placeholder = t("playerNumber", { number: slot?.slotNumber ?? "" });
  nameInput.dataset.controllerInputKey = `setup-name-${selectedPlayerId || "unknown"}`;
  nameInput.addEventListener("input", () => {
    setupNameDrafts.set(selectedPlayerId, nameInput.value);
  });
  nameInput.addEventListener("blur", () => commitSetupNameDraft(slot, nameInput.value));
  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") nameInput.blur();
  });
  nameLabel.append(nameInput);

  const colorGrid = document.createElement("div");
  colorGrid.className = "controller-color-grid";
  for (const color of gameState.controllerLobby.colors ?? []) {
    const isOwnColor = slot?.color === color.id;
    const usedByOther = (gameState.controllerLobby.slots ?? [])
      .some((candidate) => candidate.playerId !== selectedPlayerId && candidate.color === color.id);
    const button = createButton(color.label, () => sendNamedAction("player.selectColor", { color: color.id }), `controller-color-button controller-color-button--${color.id}${isOwnColor ? " is-active" : ""}`);
    button.disabled = Boolean(slot?.ready || usedByOther);
    if (usedByOther) button.title = t("controllerColorTaken");
    colorGrid.append(button);
  }

  const genderGroup = document.createElement("div");
  genderGroup.className = "controller-gender-group";
  const genderLabel = document.createElement("span");
  genderLabel.className = "controller-field-label";
  genderLabel.textContent = t("playerSetupGender");
  const genderGrid = document.createElement("div");
  genderGrid.className = "controller-gender-grid";
  for (const gender of ["male", "female"]) {
    const isSelected = slot?.gender === gender;
    const button = createButton(
      t(`playerGender_${gender}`),
      () => sendNamedAction("player.selectGender", { gender }),
      `controller-gender-button${isSelected ? " is-active" : ""}`
    );
    button.disabled = Boolean(slot?.ready);
    button.setAttribute("aria-pressed", String(isSelected));
    genderGrid.append(button);
  }
  genderGroup.append(genderLabel, genderGrid);

  const status = document.createElement("p");
  status.className = "controller-empty";
  status.textContent = getSetupStatus(slot);

  const readyButton = createButton(t(slot?.ready ? "controllerEdit" : "controllerReady"), () => {
    if (!slot?.ready) commitSetupNameDraft(slot, nameInput.value);
    sendNamedAction(slot?.ready ? "player.edit" : "player.ready", { name: nameInput.value });
  });
  readyButton.disabled = !slot || (!slot.ready && (!nameInput.value.trim() || !slot.color || !slot.gender));

  section.append(title, nameLabel, colorGrid, genderGroup, status, readyButton);
  return section;
}

function renderTabs() {
  const tabs = document.createElement("nav");
  tabs.className = "player-hud-tabs controller-tabs controller-tabbar";
  const definitions = [
    ["turn", t("tabTurn")],
    ["trade", t("tabTrade")],
    ["mothership", t("tabUpgrades")],
    ["build", t("tabBuild")],
    ["outposts", t("tabOutposts")],
    ...(gameState?.gameVariant === "supernova" ? [["missions", t("tabMissions")]] : []),
    ["overview", t("tabOverview")],
    ["board", t("controllerBoard")]
  ];
  if (isSelectedPlayerAdmin()) definitions.push(["settings", t("controllerSettings")]);

  for (const [tabId, label] of definitions) {
    const button = createButton(label, () => {
      if (tabId === "board") {
        boardFullscreen = true;
        boardViewFitted = false;
      } else if (activeTab !== tabId) {
        captureControllerScrollPosition();
        activeTab = tabId;
        tabScrollPositions.set(activeTab, 0);
      } else {
        activeTab = tabId;
      }
      render();
    }, "hud-tab-button controller-tab-button");
    button.setAttribute("aria-pressed", String(activeTab === tabId && !boardFullscreen));
    tabs.append(button);
  }
  return tabs;
}

function commitSetupNameDraft(slot, name) {
  if (!slot || slot.ready) return;
  const nextName = String(name || "").trim();
  if (nextName !== (slot.name ?? "")) {
    sendNamedAction("player.setName", { name: nextName });
  }
}

function renderActiveTab(player) {
  if (gameState?.encounter?.active || gameState?.supernovaBattle?.active) return renderTurnTab(player);
  if (activeTab === "settings") return renderSettingsTab();
  if (activeTab === "missions" && gameState?.gameVariant === "supernova") return renderMissionsTab(player);
  if (activeTab === "overview") return renderOverviewTab(player);
  if (activeTab === "build") return renderBuildTab(player);
  if (activeTab === "mothership") return renderMothershipTab(player);
  if (activeTab === "outposts") return renderOutpostsTab(player);
  if (activeTab === "trade") return renderTradeTab(player);
  return renderTurnTab(player);
}

function renderTurnTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = gameState?.phaseLabel || t("tabTurn");
  if (gameState?.sevenResolution?.active) {
    section.append(title, renderSevenResolutionPanel(player));
    return section;
  }
  if (gameState?.encounter?.active) {
    section.append(title, renderTurnHint(player), renderEncounterPanel());
    return section;
  }
  if (gameState?.supernovaBattle?.active) {
    section.append(title, renderSupernovaBattlePanel(player));
    return section;
  }
  const actions = getTurnActions();
  const placementHint = getPlacementTurnHint();
  const flightHint = getFlightTurnHint();
  section.append(title, renderTurnHint(player), renderEncounterPanel());
  if (placementHint && actions.length === 0) {
    const hint = document.createElement("div");
    hint.className = "turn-summary controller-summary";
    hint.textContent = placementHint;
    section.append(hint);
    return section;
  }
  if (flightHint) {
    const hint = document.createElement("div");
    hint.className = "turn-summary controller-summary";
    hint.textContent = flightHint;
    section.append(hint);
  }
  section.append(renderActionGrid(actions));
  return section;
}

function renderSupernovaBattlePanel(player) {
  const battle = gameState?.supernovaBattle;
  const panel = document.createElement("div");
  panel.className = "selection-panel controller-encounter-panel controller-supernova-battle-panel";
  const title = document.createElement("strong");
  title.textContent = t("supernovaBattleTitle");
  panel.append(title);
  if (!battle) return panel;

  const isAttacker = selectedPlayerId === battle.attackerPlayerId;
  const isDefender = selectedPlayerId === battle.defenderPlayerId;
  const isParticipant = isAttacker || isDefender;
  const description = document.createElement("p");
  description.className = "encounter-prompt";
  description.textContent = t("controllerBattleDescription", {
    attacker: battle.attackerName,
    defender: battle.defenderName
  });
  panel.append(description);

  if (!isParticipant) {
    const waiting = document.createElement("p");
    waiting.textContent = t("controllerBattleObserver", { attacker: battle.attackerName });
    panel.append(waiting);
    return panel;
  }

  if (battle.stage === "rolling") {
    const alreadyRolled = isAttacker ? battle.attackerRolled : battle.defenderRolled;
    const status = document.createElement("p");
    status.textContent = alreadyRolled
      ? t("controllerBattleRolledWait")
      : t("controllerBattleRollRound", { round: battle.round });
    panel.append(status);
    if (!alreadyRolled) {
      const rollAction = findAction("supernova.battle.roll");
      if (rollAction) panel.append(renderActionGrid([rollAction]));
    }
    return panel;
  }

  if (battle.stage === "reveal") {
    const status = document.createElement("p");
    status.textContent = t(battle.winnerPlayerId ? "controllerBattleReveal" : "controllerBattleTieReveal", {
      attack: battle.attackerStrength,
      defense: battle.defenderStrength
    });
    panel.append(status);
    return panel;
  }

  if (battle.stage === "upgradeLoss") {
    const mustChoose = selectedPlayerId === battle.pendingUpgradePlayerId;
    const status = document.createElement("p");
    status.textContent = t(mustChoose
      ? "controllerBattleUpgradeLossChoose"
      : "controllerBattleUpgradeLossWait");
    panel.append(status);
    if (mustChoose) {
      const actions = getFilteredActions().filter((action) => action.id === "supernova.battle.chooseUpgrade");
      panel.append(renderActionGrid(actions));
    }
  }
  return panel;
}

function renderSevenResolutionPanel(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-resolution";
  const sevenResolution = gameState?.sevenResolution;
  const heading = document.createElement("strong");
  heading.textContent = t("sevenRolled");
  const step = document.createElement("p");
  step.textContent = `${t("sevenStep")}: ${getSevenStepLabel(sevenResolution?.step)}`;
  wrapper.append(heading, step);

  if (sevenResolution?.step === "discard") {
    wrapper.append(renderSevenDiscardPanel(player, sevenResolution));
  } else if (sevenResolution?.step === "steal") {
    wrapper.append(renderSevenStealPanel(sevenResolution));
  } else if (sevenResolution?.step === "supply") {
    wrapper.append(renderSevenSupplyPanel());
  }
  return wrapper;
}

function renderSevenDiscardPanel(player, sevenResolution) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--discard";
  const playerId = player?.id;
  const required = sevenResolution?.discardRequirements?.[playerId] ?? 0;
  const alreadyDone = Boolean(sevenResolution?.discardedPlayerIds?.includes(playerId));
  const selection = sevenResolution?.discardSelections?.[playerId] ?? {};

  if (required > 0 && !alreadyDone) {
    const instruction = document.createElement("p");
    instruction.textContent = t("sevenDiscardInstruction", { count: required });
    wrapper.append(instruction, renderSevenDiscardSelectors(player, selection, required));
    const selected = countSelectedResources(selection);
    const selectedInfo = document.createElement("p");
    selectedInfo.textContent = t("sevenDiscardSelected", { selected, count: required });
    const submit = createButton(t("sevenStepDiscard"), () => sendNamedAction("seven.submitDiscard"), "small-button");
    submit.disabled = selected !== required;
    wrapper.append(selectedInfo, submit);
  } else {
    const info = document.createElement("p");
    info.textContent = t(alreadyDone ? "sevenDiscardDone" : "sevenNoDiscardRequired");
    wrapper.append(info);
  }

  const statusList = document.createElement("ul");
  statusList.className = "seven-status-list";
  for (const candidate of gameState?.players ?? []) {
    const needed = sevenResolution?.discardRequirements?.[candidate.id] ?? 0;
    const done = Boolean(sevenResolution?.discardedPlayerIds?.includes(candidate.id));
    const item = document.createElement("li");
    item.textContent = needed <= 0
      ? `${candidate.name}: ${t("sevenNoDiscardRequired")}`
      : done
      ? `${candidate.name}: ${t("sevenDiscardDone")}`
      : `${candidate.name}: ${t("sevenDiscardInstruction", { count: needed })}`;
    statusList.append(item);
  }
  wrapper.append(statusList);
  return wrapper;
}

function renderSevenDiscardSelectors(player, selection, required) {
  const grid = document.createElement("div");
  grid.className = "seven-discard-grid";
  for (const resource of resourceTypes) {
    const selected = selection?.[resource] ?? 0;
    const owned = player?.resources?.[resource] ?? 0;
    const row = document.createElement("div");
    row.className = "seven-discard-row";
    const label = document.createElement("span");
    label.textContent = `${getResourceLabel(resource)}: ${selected}/${owned}`;
    const decrease = createButton("-", () => sendNamedAction("seven.discardResource", { resource, delta: -1 }), "small-button secondary-small-button");
    decrease.disabled = selected <= 0;
    const increase = createButton("+", () => sendNamedAction("seven.discardResource", { resource, delta: 1 }), "small-button");
    increase.disabled = selected >= owned || countSelectedResources(selection) >= required;
    row.append(label, decrease, increase);
    grid.append(row);
  }
  return grid;
}

function renderSevenStealPanel(sevenResolution) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--steal";
  const isActive = isSelectedPlayerActive();
  if (!isActive) {
    const waiting = document.createElement("p");
    waiting.textContent = t("sevenWaitingForActivePlayer");
    wrapper.append(waiting);
    return wrapper;
  }

  const candidates = (gameState?.players ?? [])
    .filter((player) => player.id !== gameState.activePlayerId && getPlayerResourceTotal(player) > 0);
  if (candidates.length === 0) {
    const hint = document.createElement("p");
    hint.textContent = t("sevenNoOpponentResources");
    wrapper.append(hint, createButton(t("continue"), () => sendNamedAction("seven.resolveSteal"), "small-button"));
    return wrapper;
  }

  const instruction = document.createElement("p");
  instruction.textContent = t("sevenChooseOpponent");
  const targetList = document.createElement("div");
  targetList.className = "seven-target-list";
  for (const candidate of candidates) {
    const button = createButton(candidate.name, () => sendNamedAction("seven.selectStealTarget", { targetPlayerId: candidate.id }), "small-button secondary-small-button");
    button.setAttribute("aria-pressed", String(sevenResolution?.stealTargetPlayerId === candidate.id));
    targetList.append(button);
  }
  const draw = createButton(t("drawCard"), () => sendNamedAction("seven.resolveSteal"), "small-button");
  draw.disabled = !sevenResolution?.stealTargetPlayerId;
  wrapper.append(instruction, targetList, draw);
  return wrapper;
}

function renderSevenSupplyPanel() {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--supply";
  const hint = document.createElement("p");
  hint.textContent = t("sevenSupplyInstruction");
  wrapper.append(hint);
  if (isSelectedPlayerActive()) {
    wrapper.append(createButton(t("sevenDistributeSupply"), () => sendNamedAction("seven.distributeSupply"), "small-button"));
  } else {
    const waiting = document.createElement("p");
    waiting.textContent = t("sevenWaitingForActivePlayer");
    wrapper.append(waiting);
  }
  return wrapper;
}

function getSevenStepLabel(step) {
  if (step === "discard") return t("sevenStepDiscard");
  if (step === "steal") return t("sevenStepSteal");
  if (step === "supply") return t("sevenStepSupply");
  return "-";
}

function countSelectedResources(selection = {}) {
  return Object.values(selection).reduce((sum, amount) => sum + (amount ?? 0), 0);
}

function getPlayerResourceTotal(player) {
  if (Number.isFinite(player?.resourceCount)) return player.resourceCount;
  return Object.values(player?.resources ?? {}).reduce((sum, amount) => sum + (amount ?? 0), 0);
}

function renderMothershipTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  section.append(renderMothershipMenu(player));
  return section;
}

function renderBuildTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = t("tabBuild");
  section.append(title, renderBuildControls(player));
  return section;
}

function renderOverviewTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = t("tabOverview");
  section.append(title, renderPlayerOverview(player));
  return section;
}

function renderOutpostsTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = t("tabOutposts");
  section.append(title, renderFriendshipSummary(player));
  return section;
}

function renderTradeTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = t("tabTrade");
  section.append(title, renderBankTradeControls(player), renderPlayerTradeControls(player));
  return section;
}

function renderSettingsTab() {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = t("controllerSettings");
  const adminActions = getFilteredActions().filter((action) => [
    "openControllers",
    "admin.backToMenu",
    "admin.tvReload",
    "admin.tvHardReload",
    "app.exit"
  ].includes(action.id));
  section.append(title, renderSaveControls(), renderActionGrid(adminActions));
  return section;
}

function renderSaveControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section controller-save-controls";

  const title = document.createElement("strong");
  title.textContent = t("saveGame");

  const label = document.createElement("label");
  label.className = "controller-field";
  label.textContent = t("playerSetupName");
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 48;
  input.autocomplete = "off";
  input.dataset.controllerInputKey = "save-name";
  if (!saveNameDraft) saveNameDraft = createDefaultSaveName();
  input.value = saveNameDraft;
  input.addEventListener("input", () => {
    saveNameDraft = input.value;
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendNamedAction("save.named", { name: input.value });
    }
  });
  label.append(input);

  const saveButton = createButton(t("save"), () => {
    saveNameDraft = input.value;
    sendNamedAction("save.named", { name: saveNameDraft });
  }, "small-button");

  wrapper.append(title, label, saveButton, renderSaveList());
  return wrapper;
}

function renderSaveList() {
  const list = document.createElement("div");
  list.className = "controller-save-list";
  const saves = gameState?.saves ?? [];
  if (saves.length === 0) {
    const empty = document.createElement("p");
    empty.className = "controller-empty";
    empty.textContent = t("noSaves");
    list.append(empty);
    return list;
  }

  for (const save of saves) {
    const item = document.createElement("article");
    item.className = "controller-save-item";
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = save.name || t("unnamedSave");
    const meta = document.createElement("small");
    meta.textContent = [save.displayDate, save.playerCount ? t("savePlayers", { count: save.playerCount }) : ""].filter(Boolean).join(" · ");
    details.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "save-actions";
    actions.append(
      createButton(t("load"), () => sendNamedAction("save.load", { saveId: save.id }), "small-button"),
      createButton(t("delete"), () => sendNamedAction("save.delete", { saveId: save.id }), "small-button secondary-small-button")
    );
    item.append(details, actions);
    list.append(item);
  }
  return list;
}

function createDefaultSaveName() {
  const now = new Date();
  const locale = gameState?.language === "en" ? "en-US" : "de-DE";
  const date = now.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const round = gameState?.phaseLabel ? ` - ${gameState.phaseLabel}` : "";
  return `${t("defaultSaveName")} ${date} ${time}${round}`;
}

function renderEncounterPanel() {
  if (!gameState?.encounter?.active) return document.createDocumentFragment();
  const panel = document.createElement("div");
  panel.className = "selection-panel controller-encounter-panel";
  const title = document.createElement("strong");
  title.textContent = t("encounter");
  const isOwner = gameState.encounter.playerId === selectedPlayerId;
  const pendingStep = gameState.encounter.pendingStep;
  const isSingleRollStep = pendingStep?.type === "singleMothershipRoll";
  const isSingleRollParticipant = isSingleRollStep && pendingStep.activePlayerId === selectedPlayerId;
  const isDualRollStep = pendingStep?.type === "dualMothershipRoll";
  const isDualRollParticipant = isDualRollStep && isControllerDualMothershipRollParticipant(pendingStep);
  const isDriveComparisonStep = pendingStep?.type === "driveComparisonPreview";
  const isDriveComparisonParticipant = isDriveComparisonStep && isControllerDriveComparisonParticipant(pendingStep);
  panel.append(title);

  if (!isOwner && !isSingleRollParticipant && !isDualRollParticipant && !isDriveComparisonParticipant) {
    const activeName = gameState.activePlayerName || t("controllerOtherPlayer");
    const neutral = document.createElement("p");
    neutral.className = "encounter-prompt";
    neutral.textContent = t("controllerEncounterObserver", { player: activeName });
    const wait = document.createElement("p");
    wait.textContent = t("controllerEncounterWaitForCompletion", { player: activeName });
    panel.append(neutral, wait);
    return panel;
  }

  if (isOwner && pendingStep?.type === "message") {
    panel.append(renderControllerEncounterMessage(pendingStep));
    return panel;
  }

  const promptText = gameState.encounter.pendingStep?.type === "choiceSelection"
    ? (gameState.encounter.pendingStep.promptText || gameState.encounter.resultText || gameState.encounter.prompt || "")
    : (gameState.encounter.resultText || gameState.encounter.prompt || "");
  if (promptText) {
    const prompt = document.createElement("p");
    prompt.className = "encounter-prompt";
    prompt.textContent = promptText;
    panel.append(prompt);
  }

  const hint = document.createElement("p");
  hint.textContent = getEncounterStatusLabel();
  panel.append(hint);

  if (isOwner && gameState.encounter.status === "resolved") {
    const finishAction = findAction("finishEncounter");
    if (finishAction) panel.append(renderActionGrid([finishAction]));
  } else if (isSingleRollParticipant) {
    panel.append(renderControllerEncounterSingleMothershipRoll(pendingStep));
  } else if (isDualRollParticipant) {
    panel.append(renderControllerEncounterDualMothershipRoll(pendingStep));
  } else if (isDriveComparisonParticipant) {
    panel.append(renderControllerEncounterDriveComparisonPreview(pendingStep));
  } else if (isOwner && gameState.encounter.pendingStep?.type === "choiceSelection") {
    panel.append(renderActionGrid((gameState.encounter.pendingStep.choices ?? []).map((choice) => ({
      id: "encounter.submitPending",
      label: choice.label,
      payload: { choiceId: choice.id },
      disabled: !choice.available,
      requiresActivePlayer: true
    }))));
  } else if (isOwner && gameState.encounter.pendingStep?.type === "resourceSelection") {
    panel.append(renderControllerEncounterResourceSelection(gameState.encounter.pendingStep));
  } else if (isOwner && gameState.encounter.pendingStep?.type === "upgradeSelection") {
    panel.append(renderControllerEncounterUpgradeSelection(gameState.encounter.pendingStep));
  } else if (isOwner && gameState.encounter.pendingStep?.type === "opponentResourceGiftSelection") {
    panel.append(renderControllerEncounterOpponentGiftSelection(gameState.encounter.pendingStep));
  } else if (isOwner && gameState.encounter.pendingStep?.type === "globalUpgradeLossSelection") {
    panel.append(renderControllerEncounterGlobalUpgradeSelection(gameState.encounter.pendingStep));
  } else if (isOwner && ["shipJumpSelection", "boardTargetSelection", "shipBlockSelection"].includes(gameState.encounter.pendingType)) {
    const pendingStep = gameState.encounter.pendingStep ?? {};
    const hasTargets = gameState.encounter.pendingType === "boardTargetSelection"
      ? (pendingStep.validNodeIds ?? []).length > 0
      : (pendingStep.shipIds ?? []).length > 0;
    if (hasTargets) {
      panel.append(createButton(
        gameState.encounter.pendingType === "boardTargetSelection" ? t("encounterSelectTargetPoint") : t("controllerSelectShip"),
        () => {
          sendNamedAction("encounter.startBoardSelection");
          boardFullscreen = true;
          render();
        },
        "controller-button"
      ));
    } else {
      const empty = document.createElement("p");
      empty.textContent = t("controllerNoValidTargets");
      panel.append(empty);
      const finishAction = findAction("finishEncounter");
      if (finishAction) panel.append(renderActionGrid([finishAction]));
    }
  } else if (isOwner && (gameState.encounter.choices ?? []).length > 0) {
    panel.append(renderActionGrid((gameState.encounter.choices ?? []).map((choice) => ({
      id: "encounter.choose",
      label: choice.label,
      payload: { choiceId: choice.id },
      disabled: !choice.available,
      requiresActivePlayer: true
    }))));
  }
  return panel;
}

function renderControllerEncounterMessage(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list encounter-message-step";
  if (pendingStep.titleText) {
    const title = document.createElement("h3");
    title.textContent = pendingStep.titleText;
    wrapper.append(title);
  }
  for (const text of [pendingStep.bodyText, pendingStep.detailText]) {
    if (!text) continue;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    wrapper.append(paragraph);
  }
  wrapper.append(createButton(
    pendingStep.continueLabel || t("continue"),
    () => sendNamedAction("encounter.submitPending"),
    "small-button"
  ));
  return wrapper;
}

function isControllerDualMothershipRollParticipant(pendingStep) {
  return Boolean(
    selectedPlayerId &&
    pendingStep?.type === "dualMothershipRoll" &&
    (pendingStep.activePlayerId === selectedPlayerId || pendingStep.targetPlayerId === selectedPlayerId)
  );
}

function isControllerDriveComparisonParticipant(pendingStep) {
  return Boolean(
    selectedPlayerId &&
    pendingStep?.type === "driveComparisonPreview" &&
    (pendingStep.activePlayerId === selectedPlayerId || pendingStep.targetPlayerId === selectedPlayerId)
  );
}

function hasControllerDualMothershipRoll(pendingStep) {
  if (!isControllerDualMothershipRollParticipant(pendingStep)) return false;
  return pendingStep.activePlayerId === selectedPlayerId
    ? Boolean(pendingStep.activeRolled)
    : Boolean(pendingStep.targetRolled);
}

function renderControllerEncounterDriveComparisonPreview(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const message = document.createElement("p");
  message.textContent = pendingStep.activePlayerId === selectedPlayerId
    ? t("encounterDriveComparisonActiveWait")
    : t("encounterDriveComparisonPassiveWait", {
      player: pendingStep.active?.playerName ?? t("activePlayer")
    });
  wrapper.append(message);

  const activeSummary = document.createElement("p");
  activeSummary.textContent = formatControllerDriveComparisonValue(pendingStep.active);
  const targetSummary = document.createElement("p");
  targetSummary.textContent = formatControllerDriveComparisonValue(pendingStep.target);
  wrapper.append(activeSummary, targetSummary);
  return wrapper;
}

function formatControllerDriveComparisonValue(entry) {
  if (!entry) return "";
  const bonusText = entry.friendshipBonus > 0
    ? t("controllerDriveBonus", { bonus: entry.friendshipBonus, effective: entry.effectiveDrives })
    : "";
  return t("controllerDriveValue", {
    player: entry.playerName,
    physical: entry.physicalDrives,
    bonus: bonusText
  });
}

function renderControllerEncounterDualMothershipRoll(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";

  const prompt = document.createElement("p");
  prompt.textContent = t("encounterMothershipRollPrompt");
  wrapper.append(prompt);

  if (hasControllerDualMothershipRoll(pendingStep)) {
    const waiting = document.createElement("p");
    waiting.textContent = t("encounterMothershipRollDone");
    wrapper.append(waiting);
    return wrapper;
  }

  wrapper.append(createButton(
    t("encounterMothershipRollButton"),
    () => sendNamedAction("encounter.submitPending"),
    "small-button"
  ));
  return wrapper;
}

function renderControllerEncounterSingleMothershipRoll(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";

  const prompt = document.createElement("p");
  prompt.textContent = t("encounterSingleMothershipRollPrompt");
  wrapper.append(prompt);

  if (pendingStep.rolled) {
    const waiting = document.createElement("p");
    waiting.textContent = t("encounterSingleMothershipRollDone");
    wrapper.append(waiting);
    return wrapper;
  }

  wrapper.append(createButton(
    t("encounterMothershipRollButton"),
    () => sendNamedAction("encounter.submitPending"),
    "small-button"
  ));
  return wrapper;
}

function getEncounterStatusLabel() {
  if (gameState?.encounter?.status === "resolved") return t("finishEncounter");
  if (gameState?.encounter?.pendingStep?.type === "singleMothershipRoll") return t("controllerEncounterRollStatus");
  if (gameState?.encounter?.pendingStep?.type === "dualMothershipRoll") return t("controllerEncounterRollStatus");
  if (gameState?.encounter?.pendingStep?.type === "driveComparisonPreview") return t("encounterDriveComparisonActiveWait");
  if (gameState?.encounter?.pendingStep?.hint) return gameState.encounter.pendingStep.hint;
  if (gameState?.encounter?.pendingType) return t("controllerEncounterFollowSteps");
  return t("controllerEncounterChooseAnswer");
}

function renderControllerEncounterResourceSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "seven-step seven-step--discard";
  const player = getSelectedPlayer();
  const selectedResources = pendingStep.selectedResources ?? {};
  const selectedTotal = countSelectedResources(selectedResources);
  const amount = pendingStep.amount ?? 0;
  const isLoss = pendingStep.mode === "loss";

  const instruction = document.createElement("p");
  instruction.textContent = isLoss
    ? t("sevenDiscardInstruction", { count: amount })
    : t("encounterResourceSelectionHint", { mode: t("chooseResource"), count: amount });

  const selectionInfo = document.createElement("p");
  selectionInfo.textContent = t("encounterSelectionCount", { selected: selectedTotal, count: amount });

  const grid = document.createElement("div");
  grid.className = "seven-discard-grid";
  for (const resource of resourceTypes) {
    const owned = player?.resources?.[resource] ?? 0;
    const selected = selectedResources?.[resource] ?? 0;
    const row = document.createElement("div");
    row.className = "seven-discard-row";

    const label = document.createElement("span");
    label.textContent = t(isLoss ? "controllerResourceOwnedSelected" : "controllerResourceSelected", {
      resource: getResourceLabel(resource),
      owned,
      selected
    });

    const decrease = createButton("-", () => {
      sendNamedAction("encounter.resourceDelta", { resource, delta: -1 });
    }, "small-button secondary-small-button");
    decrease.disabled = selected <= 0;

    const increase = createButton("+", () => {
      sendNamedAction("encounter.resourceDelta", { resource, delta: 1 });
    }, "small-button");
    increase.disabled = selectedTotal >= amount || (isLoss && selected >= owned);

    row.append(label, decrease, increase);
    grid.append(row);
  }

  const submit = createButton(
    t(isLoss ? "sevenStepDiscard" : "chooseResource"),
    () => sendNamedAction("encounter.submitPending"),
    "small-button"
  );
  submit.disabled = selectedTotal !== amount;
  wrapper.append(instruction, selectionInfo, grid, submit);
  return wrapper;
}

function renderControllerEncounterUpgradeSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const player = getSelectedPlayer();
  const isLoss = pendingStep.mode === "loss";
  const hasLossTarget = upgradeDefinitions.some((upgrade) => (player?.upgrades?.[upgrade.id] ?? 0) > 0);

  if (isLoss && !hasLossTarget) {
    wrapper.append(createButton(t("continue"), () => sendNamedAction("encounter.submitPending"), "small-button"));
    return wrapper;
  }

  for (const upgrade of upgradeDefinitions) {
    const currentAmount = player?.upgrades?.[upgrade.id] ?? 0;
    const button = createButton(
      `${t(isLoss ? "controllerUpgradeGive" : "chooseUpgrade")} · ${getUpgradeLabel(upgrade.id)}`,
      () => sendNamedAction("encounter.submitPending", { upgrade: upgrade.id }),
      "small-button"
    );
    button.disabled = isLoss ? currentAmount <= 0 : currentAmount >= upgrade.limit;
    wrapper.append(button);
  }
  return wrapper;
}

function renderControllerEncounterOpponentGiftSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const giver = gameState?.players?.find((player) => player.id === pendingStep.currentGiverPlayerId);
  const receiver = gameState?.players?.find((player) => player.id === pendingStep.receiverPlayerId);
  const hint = document.createElement("p");
  hint.textContent = t("controllerGiftResource", {
    giver: giver?.name ?? t("controllerTeammate"),
    receiver: receiver?.name ?? t("controllerActivePlayerAccusative")
  });
  wrapper.append(hint);

  let hasResource = false;
  for (const resource of resourceTypes) {
    const owned = giver?.resources?.[resource] ?? 0;
    const button = createButton(
      `${getResourceLabel(resource)} (${owned})`,
      () => sendNamedAction("encounter.submitPending", { resource }),
      "small-button"
    );
    button.disabled = owned <= 0;
    if (owned > 0) hasResource = true;
    wrapper.append(button);
  }
  if (!hasResource) {
    wrapper.append(createButton(t("continue"), () => sendNamedAction("encounter.submitPending", { skip: true }), "small-button"));
  }
  return wrapper;
}

function renderControllerEncounterGlobalUpgradeSelection(pendingStep) {
  const wrapper = document.createElement("div");
  wrapper.className = "encounter-choice-list";
  const targetPlayer = gameState?.players?.find((player) => player.id === pendingStep.currentTargetPlayerId);
  const hint = document.createElement("p");
  hint.textContent = t("controllerAffectedPlayer", { player: targetPlayer?.name ?? t("none") });
  wrapper.append(hint);

  if (!targetPlayer) {
    wrapper.append(createButton(t("continue"), () => sendNamedAction("encounter.submitPending"), "small-button"));
    return wrapper;
  }

  let hasUpgrade = false;
  for (const upgrade of upgradeDefinitions) {
    const currentAmount = targetPlayer.upgrades?.[upgrade.id] ?? 0;
    const button = createButton(
      `${getUpgradeLabel(upgrade.id)} (${currentAmount})`,
      () => sendNamedAction("encounter.submitPending", { upgrade: upgrade.id }),
      "small-button"
    );
    button.disabled = currentAmount <= 0;
    if (currentAmount > 0) hasUpgrade = true;
    wrapper.append(button);
  }
  if (!hasUpgrade) {
    wrapper.append(createButton(t("continue"), () => sendNamedAction("encounter.submitPending"), "small-button"));
  }
  return wrapper;
}

function renderTurnHint(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "turn-summary controller-summary";
  if (!player) {
    wrapper.textContent = t("controllerWaitForState");
    return wrapper;
  }
  const activeText = isSelectedPlayerActive()
    ? t("controllerYourTurn")
    : t("controllerOtherPlayerTurn", { player: gameState?.activePlayerName || t("controllerOtherPlayer") });
  wrapper.append(createMetaItem(t("phase"), gameState?.phaseLabel || "-"));
  wrapper.append(createMetaItem(t("status"), activeText));
  return wrapper;
}

function renderMothershipMenu(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "upgrade-menu controller-upgrade-menu";

  const shipPanel = document.createElement("section");
  shipPanel.className = "upgrade-ship-panel";
  shipPanel.append(renderMothershipUpgradeVisual(player));
  wrapper.append(shipPanel, renderUpgradeControls(player));
  return wrapper;
}

function renderMothershipUpgradeVisual(player) {
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

function renderUpgradeControls(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section upgrade-controls";

  const orderedUpgrades = upgradeMenuOrder
    .map((upgradeId) => upgradeDefinitions.find((upgrade) => upgrade.id === upgradeId))
    .filter(Boolean);

  for (const upgrade of orderedUpgrades) {
    const action = findAction("upgrade.buy", (candidate) => candidate.payload?.upgradeId === upgrade.id);
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

    const bonus = player?.upgradeBonuses?.[upgrade.id] ?? 0;
    const bonusText = document.createElement("small");
    bonusText.className = "upgrade-card-bonus";
    if (bonus > 0) {
      bonusText.textContent = `${t("friendshipUpgradeBonus")} +${bonus} · ${t("effectiveUpgradeValue")}: ${player?.effectiveUpgrades?.[upgrade.id] ?? ((player?.upgrades?.[upgrade.id] ?? 0) + bonus)}`;
    }

    const cost = document.createElement("small");
    cost.className = "upgrade-card-cost";
    cost.textContent = `${t("cost")}: ${formatCost(upgrade.cost)}`;

    const button = createButton(t("build"), () => action && sendAction(action), "small-button");
    button.disabled = !action || Boolean(action.disabled);

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

function renderBuildControls(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section build-controls";

  const isSupernova = gameState?.gameVariant === "supernova";
  for (const actionDefinition of buildActionDefinitions.filter((definition) => !definition.variant || isSupernova)) {
    const remoteAction = findAction(`build.${actionDefinition.id}`);
    const card = document.createElement("article");
    card.className = "upgrade-card upgrade-card--menu build-action-card";

    const preview = document.createElement("div");
    preview.className = "upgrade-card-preview build-action-card-preview";
    const image = document.createElement("img");
    image.className = "upgrade-card-blueprint build-action-blueprint";
    image.src = upgradeMenuAssetPaths.buildBlueprints[actionDefinition.id];
    image.alt = "";
    image.loading = "lazy";
    preview.append(image);

    const body = document.createElement("div");
    body.className = "upgrade-card-body";
    const label = document.createElement("strong");
    label.className = "upgrade-card-title";
    label.textContent = getBuildActionLabel(actionDefinition.id);

    const cost = document.createElement("small");
    cost.className = "upgrade-card-cost";
    cost.textContent = `${t("cost")}: ${formatCost(actionDefinition.cost)}`;

    const button = createButton(t("build"), () => remoteAction && sendAction(remoteAction), "small-button");
    button.disabled = !remoteAction || Boolean(remoteAction.disabled);

    const actions = document.createElement("div");
    actions.className = "upgrade-card-actions";
    actions.append(button, cost);
    body.append(label, actions);
    card.append(preview, body);
    wrapper.append(card);
  }

  if (isSupernova) {
    const factoryCount = player?.counts?.factories ?? 0;
    const factoryLimitReached = factoryCount >= supernovaFactoryLimitPerPlayer;
    const pendingFactoryPlacement = gameState?.factoryPlacement;
    const title = document.createElement("strong");
    title.textContent = t("supernovaFactories");
    const stock = document.createElement("small");
    stock.className = "upgrade-card-bonus";
    stock.textContent = t("supernovaFactoryStock", { built: factoryCount, limit: supernovaFactoryLimitPerPlayer });
    wrapper.append(title, stock);
    if (pendingFactoryPlacement?.ownerPlayerId === selectedPlayerId) {
      const placement = document.createElement("p");
      placement.className = "controller-factory-placement-hint";
      placement.textContent = pendingFactoryPlacement.hint || t("supernovaFactoryChoosePlanet", {
        factory: pendingFactoryPlacement.factoryTitle || ""
      });
      const cancelAction = findAction("supernova.factory.cancel");
      const controls = document.createElement("div");
      controls.className = "upgrade-card-actions";
      controls.append(
        createButton(t("controllerBoard"), () => {
          boardFullscreen = true;
          boardViewFitted = false;
          render();
        }, "small-button"),
        createButton(t("cancelFactoryBuild"), () => cancelAction && sendAction(cancelAction), "small-button secondary-small-button")
      );
      wrapper.append(placement, controls);
    }

    for (const factoryType of supernovaFactoryTypes) {
      const remoteAction = findAction(
        "supernova.factory",
        (action) => action.payload?.factoryType === factoryType.id
      );
      const card = document.createElement("article");
      card.className = "upgrade-card upgrade-card--menu build-action-card factory-build-card";

      const preview = document.createElement("div");
      preview.className = "upgrade-card-preview factory-build-preview";
      preview.setAttribute("aria-hidden", "true");
      const previewImage = document.createElement("img");
      previewImage.className = "upgrade-card-blueprint factory-build-blueprint";
      previewImage.src = getFactoryBlueprintAssetPath(factoryType.id) ?? "";
      previewImage.alt = "";
      preview.append(previewImage);

      const body = document.createElement("div");
      body.className = "upgrade-card-body";
      const label = document.createElement("strong");
      label.className = "upgrade-card-title";
      label.textContent = getSupernovaLocalizedTitle(factoryType, gameState?.language);

      const hint = document.createElement("small");
      hint.className = "upgrade-card-bonus";
      hint.textContent = factoryLimitReached
        ? t("supernovaFactoryLimitReached")
        : remoteAction
          ? `${t("supernovaFactoryProduces", { resource: getResourceLabel(factoryType.resource) })} · ${t("supernovaFactorySiteAvailable")}`
          : t("noFactorySiteAvailable");

      const cost = document.createElement("small");
      cost.className = "upgrade-card-cost";
      cost.textContent = `${t("cost")}: ${formatCost(factoryType.cost)}`;

      const button = createButton(t("build"), () => {
        if (!remoteAction) return;
        sendAction(remoteAction);
        boardFullscreen = true;
        boardViewFitted = false;
        render();
      }, "small-button");
      button.disabled = factoryLimitReached || Boolean(pendingFactoryPlacement) || !remoteAction || Boolean(remoteAction.disabled);

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

function renderResourceOverview(player) {
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

function renderBankTradeControls(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section";
  const title = document.createElement("strong");
  title.textContent = t("bankTrade");

  const fields = document.createElement("div");
  fields.className = "trade-fields";
  const fromResource = gameState?.trade?.bankFromResource ?? "ore";
  const toResource = gameState?.trade?.bankToResource ?? "food";
  fields.append(
    renderResourceSelect(t("give"), fromResource, (resource) => {
      sendNamedAction("trade.setBankResources", { fromResource: resource, toResource });
    }),
    renderResourceSelect(t("receive"), toResource, (resource) => {
      sendNamedAction("trade.setBankResources", { fromResource, toResource: resource });
    })
  );

  const rate = player?.tradeRates?.[fromResource] ?? 3;
  const hint = document.createElement("p");
  hint.textContent = `${rate}:1`;

  const button = createButton(t("trade"), () => sendNamedAction("trade.bankTrade"), "small-button");
  button.disabled = !canUseTradeBuildActions(player) || fromResource === toResource || (player?.resources?.[fromResource] ?? 0) < rate;

  wrapper.append(title, fields, hint, button);
  return wrapper;
}

function renderPlayerTradeControls(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section player-trade-controls";
  const title = document.createElement("strong");
  title.textContent = t("playerTrade");
  wrapper.append(title);

  const activeTradeOffer = gameState?.trade?.activeTradeOffer;
  if (activeTradeOffer) {
    wrapper.append(renderActiveTradeOffer(player, activeTradeOffer));
    return wrapper;
  }

  if (!canUseTradeBuildActions(player)) {
    const hint = document.createElement("p");
    hint.textContent = t(isSelectedPlayerActive() ? "tradeOnlyInTradeBuild" : "notYourTurn");
    wrapper.append(hint);
    return wrapper;
  }

  wrapper.append(
    renderTradeTargetSelect(),
    renderTradeResourceConfigurator("offered"),
    renderTradeResourceConfigurator("requested")
  );

  const offerButton = createButton(t("offerTrade"), () => sendNamedAction("trade.createOffer"), "small-button");
  offerButton.disabled = !canCreateTradeOffer(player);
  wrapper.append(offerButton);
  return wrapper;
}

function renderActiveTradeOffer(player, activeTradeOffer) {
  const wrapper = document.createElement("div");
  wrapper.className = "active-trade-offer";
  const fromPlayer = getPlayerById(activeTradeOffer.fromPlayerId);
  const toPlayer = getPlayerById(activeTradeOffer.toPlayerId);
  const isRecipientView = player?.id === activeTradeOffer.toPlayerId;
  const giveResources = isRecipientView ? activeTradeOffer.requestedResources : activeTradeOffer.offeredResources;
  const receiveResources = isRecipientView ? activeTradeOffer.offeredResources : activeTradeOffer.requestedResources;

  const title = document.createElement("p");
  title.textContent = t("openTradeOffer");
  const summary = document.createElement("p");
  summary.textContent = `${fromPlayer?.name ?? activeTradeOffer.fromPlayerId} -> ${toPlayer?.name ?? activeTradeOffer.toPlayerId}`;
  const offered = document.createElement("p");
  offered.textContent = `${t("youGive")}: ${formatResourceSelection(giveResources)}`;
  const requested = document.createElement("p");
  requested.textContent = `${t("youReceive")}: ${formatResourceSelection(receiveResources)}`;
  wrapper.append(title, summary, offered, requested);

  const actions = document.createElement("div");
  actions.className = "trade-offer-actions";
  if (player?.id === activeTradeOffer.toPlayerId) {
    actions.append(
      createButton(t("accept"), () => sendNamedAction("trade.acceptOffer"), "small-button"),
      createButton(t("decline"), () => sendNamedAction("trade.declineOffer"), "small-button secondary-small-button")
    );
  } else if (player?.id === activeTradeOffer.fromPlayerId) {
    actions.append(createButton(t("cancelOffer"), () => sendNamedAction("trade.cancelOffer"), "small-button secondary-small-button"));
  }
  if (actions.childElementCount > 0) wrapper.append(actions);
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

  for (const player of gameState?.players ?? []) {
    if (player.id === selectedPlayerId) continue;
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = player.name;
    select.append(option);
  }
  select.value = gameState?.trade?.offerTargetPlayerId ?? "";
  select.addEventListener("change", () => sendNamedAction("trade.setOfferTarget", { targetPlayerId: select.value || null }));
  label.append(caption, select);
  return label;
}

function renderTradeResourceConfigurator(side) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-resource-configurator";
  const title = document.createElement("strong");
  title.textContent = t(side === "offered" ? "youGive" : "youReceive");
  wrapper.append(title);

  const selection = side === "offered"
    ? gameState?.trade?.offeredResources ?? {}
    : gameState?.trade?.requestedResources ?? {};

  for (const resource of resourceTypes) {
    const row = document.createElement("div");
    row.className = "seven-discard-row";
    const label = document.createElement("span");
    label.textContent = `${getResourceLabel(resource)}: ${selection[resource] ?? 0}`;
    const decreaseButton = createButton("-", () => sendNamedAction("trade.updateOfferResource", { side, resource, delta: -1 }), "small-button secondary-small-button");
    decreaseButton.disabled = (selection[resource] ?? 0) <= 0;
    const increaseButton = createButton("+", () => sendNamedAction("trade.updateOfferResource", { side, resource, delta: 1 }), "small-button");
    row.append(label, decreaseButton, increaseButton);
    wrapper.append(row);
  }

  return wrapper;
}

function renderPlayerOverview(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "fleet-summary player-overview";
  const title = document.createElement("strong");
  title.textContent = t("tabOverview");
  const counts = player?.counts ?? {};
  const rows = [
    [t("victoryPoints"), player?.victoryPoints ?? 0],
    [t("ships"), counts.ships ?? 0],
    ...(player?.supernovaMissions?.length ? [[t("battleShips"), counts.battleShips ?? 0]] : []),
    [t("colonies"), counts.colonies ?? 0],
    [t("spaceports"), counts.spaceports ?? 0],
    [t("tradeStations"), counts.tradeStations ?? 0],
    [t("medals"), player?.medalLabel ?? formatMedals(player)]
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

function renderMissionsTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section controller-missions";
  const title = document.createElement("h2");
  title.textContent = t("supernovaMissions");
  const explanation = document.createElement("p");
  explanation.className = "controller-mission-explanation";
  explanation.textContent = t("supernovaMissionWinCondition");
  const missions = document.createElement("div");
  missions.className = "friendship-card-list controller-mission-list";
  for (const mission of player?.supernovaMissions ?? []) {
    const item = document.createElement("article");
    item.className = `friendship-card controller-mission-card${mission.fulfilled ? " is-fulfilled" : ""}`;
    const heading = document.createElement("strong");
    heading.textContent = getSupernovaLocalizedTitle(mission, gameState?.language);
    const text = document.createElement("p");
    text.textContent = getSupernovaLocalizedText(mission, gameState?.language);
    const status = document.createElement("small");
    status.className = "controller-mission-status";
    status.textContent = t(mission.fulfilled ? "missionFulfilled" : "missionOpen");
    item.append(heading, text, status);
    missions.append(item);
  }
  if (!missions.childElementCount) {
    const empty = document.createElement("p");
    empty.className = "controller-empty";
    empty.textContent = t("supernovaMissionNone");
    missions.append(empty);
  }
  section.append(title, explanation, missions);
  return section;
}

function renderFriendshipSummary(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "friendship-summary fleet-summary";
  const title = document.createElement("strong");
  title.textContent = t("friendship");

  const friendship = player?.friendship ?? {};
  const rows = [
    [t("tradeStations"), player?.counts?.tradeStations ?? 0],
    [t("outpost"), formatList(friendship.representedOutposts)],
    [t("friendshipMarkers"), formatList(friendship.markers)]
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

  const cards = friendship.cards ?? [];
  if (cards.length > 0) {
    const cardTitle = document.createElement("p");
    cardTitle.textContent = t("activeFriendshipCards");
    const cardList = document.createElement("div");
    cardList.className = "friendship-card-list";
    for (const cardInfo of cards) {
      const card = getFriendshipCardById(cardInfo.id) ?? cardInfo;
      const cardElement = document.createElement("article");
      cardElement.className = "friendship-card";
      const titleElement = document.createElement("strong");
      titleElement.textContent = cardInfo.title || getFriendshipCardTitle(card, gameState?.language);
      const summary = document.createElement("p");
      summary.textContent = cardInfo.summary || getFriendshipCardSummary(card, gameState?.language);
      cardElement.append(titleElement, summary);
      cardList.append(cardElement);
    }
    wrapper.append(cardTitle, cardList);
  } else {
    const empty = document.createElement("p");
    empty.textContent = t("controllerNoFriendshipCards");
    wrapper.append(empty);
  }

  return wrapper;
}

function renderBoardFullscreen() {
  const section = document.createElement("section");
  section.className = "controller-board-fullscreen";
  const header = document.createElement("div");
  header.className = "controller-board-header";
  const title = document.createElement("h2");
  title.textContent = t("controllerBoard");
  const mode = document.createElement("p");
  mode.textContent = getControllerBoardModeLabel();
  const backButton = createButton(t("backToMenu"), () => {
    boardFullscreen = false;
    render();
  }, "controller-board-back-button");
  header.append(title, mode, backButton);

  const viewport = document.createElement("div");
  viewport.className = "controller-board-viewport";
  const content = document.createElement("div");
  content.className = "controller-board-content";
  appendCachedControllerBoardSvg(content, gameState?.board?.svg || "");
  prepareControllerBoardSvg(content);
  scrubBoardSelectionForInactivePlayer(content);
  applyBoardTransform(content);
  attachBoardGestures(viewport, content);
  viewport.append(content);
  section.append(header, viewport);
  requestAnimationFrame(() => fitControllerBoardToViewport(viewport, content));
  return section;
}

function appendCachedControllerBoardSvg(content, markup) {
  if (!markup) return;
  if (markup !== cachedBoardSvgMarkup || !cachedBoardSvgTemplate) {
    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    cachedBoardSvgTemplate = template.content.firstElementChild;
    cachedBoardSvgMarkup = markup;
    controllerPerformanceMetrics.boardSvgParses += 1;
  }
  if (!cachedBoardSvgTemplate) return;
  content.append(cachedBoardSvgTemplate.cloneNode(true));
  controllerPerformanceMetrics.boardSvgClones += 1;
}

function renderPlayerSummary(player) {
  const summary = document.createElement("div");
  summary.className = "turn-summary controller-summary";
  if (!player) {
    summary.textContent = t("controllerWaitForState");
    return summary;
  }
  const resourceText = Object.entries(player.resources ?? {})
    .map(([resource, amount]) => `${getResourceLabel(resource)}: ${amount}`)
    .join(" · ");
  summary.append(createMetaItem(t("controllerPlayer"), player.name));
  summary.append(createMetaItem(t("victoryPoints"), String(player.victoryPoints ?? 0)));
  summary.append(createMetaItem(t("medals"), String(player.medals ?? 0).replace(".", ",")));
  summary.append(createMetaItem(t("resources"), resourceText || "-"));
  return summary;
}

function renderActionGrid(actions) {
  const actionGrid = document.createElement("div");
  actionGrid.className = "phase-actions controller-action-grid";
  if (actions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "controller-empty";
    empty.textContent = t(isSelectedPlayerActive() ? "controllerNoActions" : "notYourTurn");
    actionGrid.append(empty);
    return actionGrid;
  }
  for (const action of actions) {
    const button = createButton(action.label, () => sendAction(action));
    button.disabled = Boolean(action.disabled);
    actionGrid.append(button);
  }
  return actionGrid;
}

function getFilteredActions() {
  return (gameState?.actions ?? []).filter((action) => {
    if (action.adminOnly && !isSelectedPlayerAdmin()) return false;
    if (action.forPlayerId && action.forPlayerId !== selectedPlayerId) return false;
    if (action.requiresActivePlayer && !isSelectedPlayerActive()) return false;
    return true;
  });
}

function getTurnActions() {
  return getFilteredActions().filter((action) => {
    if (action.id.startsWith("build.")) return false;
    if (action.id.startsWith("upgrade.")) return false;
    if (action.adminOnly) return false;
    return ![
      "openControllers",
      "admin.tvReload",
      "admin.tvHardReload",
      "openPlayerHud",
      "closeHud",
      "hudTab",
      "save.quick",
      "save.named",
      "encounter.choose",
      "finishEncounter",
      "admin.backToMenu",
      "app.exit"
    ].includes(action.id);
  });
}

function findAction(actionId, predicate = () => true) {
  return getFilteredActions().find((action) => action.id === actionId && predicate(action)) ?? null;
}

function canUseTradeBuildActions(player) {
  return Boolean(player?.id === selectedPlayerId && isSelectedPlayerActive() && gameState?.phase === "tradeBuild");
}

function canCreateTradeOffer(player) {
  if (!canUseTradeBuildActions(player) || !gameState?.trade?.offerTargetPlayerId) return false;
  const offered = gameState?.trade?.offeredResources ?? {};
  const requested = gameState?.trade?.requestedResources ?? {};
  const totalOffered = Object.values(offered).reduce((sum, amount) => sum + (amount ?? 0), 0);
  const totalRequested = Object.values(requested).reduce((sum, amount) => sum + (amount ?? 0), 0);
  if (totalOffered <= 0 && totalRequested <= 0) return false;
  return resourceTypes.every((resource) => (offered[resource] ?? 0) <= (player?.resources?.[resource] ?? 0));
}

function getSelectedPlayer() {
  return (gameState?.players ?? []).find((player) => player.id === selectedPlayerId) ?? null;
}

function getPlayerById(playerId) {
  return (gameState?.players ?? []).find((player) => player.id === playerId) ?? null;
}

function getOwnLobbySlot() {
  return (gameState?.controllerLobby?.slots ?? []).find((slot) => slot.playerId === selectedPlayerId) ?? null;
}

function getFallbackPlayerName() {
  const slot = getOwnLobbySlot();
  if (slot) return t("playerNumber", { number: slot.slotNumber });
  const match = /^player-(\d+)$/.exec(selectedPlayerId || "");
  if (match) return t("playerNumber", { number: match[1] });
  return t("controllerWaitForState");
}

function getSetupStatus(slot) {
  if (!slot) return t("controllerSetupWaiting");
  if (slot.ready) return t("controllerSetupReady");
  if (!slot.name?.trim()) return t("controllerSetupEnterName");
  if (!slot.color) return t("controllerSetupChooseColor");
  if (!slot.gender) return t("controllerSetupChooseGender");
  return t("controllerSetupConfirm");
}

function isSelectedPlayerActive() {
  return gameState?.activePlayerId === selectedPlayerId;
}

function isSelectedPlayerAdmin() {
  return gameState?.players?.[0]?.id === selectedPlayerId;
}

function applyBoardTransform(content) {
  content.style.transform = `translate(${boardOffset.x}px, ${boardOffset.y}px) scale(${boardScale})`;
}

function prepareControllerBoardSvg(content) {
  const svg = content.querySelector("svg");
  const dimensions = getControllerBoardSvgDimensions(svg);
  if (!svg || !dimensions) return;
  svg.setAttribute("width", String(dimensions.width));
  svg.setAttribute("height", String(dimensions.height));
  applyStructuredFlightBoardState(content);
  applyStructuredEncounterBoardState(content);

  if (isPlacementBoardMode() || isFlightMovementBoardMode() || isEncounterBoardSelectionMode() || isFactoryPlacementBoardMode()) {
    svg.classList.add("controller-board-svg--placement");
    content.querySelectorAll(".planet.is-selected, .planet-system.is-selected, .start-system.is-selected").forEach((element) => {
      element.classList.remove("is-selected");
    });
    content.querySelectorAll(".planet, .planet-system, .start-system, .hidden-system").forEach((element) => {
      element.style.pointerEvents = "none";
      element.removeAttribute("role");
      element.removeAttribute("tabindex");
    });
  }
  if (isFactoryPlacementBoardMode()) {
    for (const planetId of gameState.factoryPlacement?.validPlanetIds ?? []) {
      const planet = content.querySelector(`[data-board-type='planet'][data-board-id='${cssEscape(planetId)}']`);
      if (!planet) continue;
      planet.classList.add("is-factory-target");
      planet.style.pointerEvents = "auto";
      planet.setAttribute("role", "button");
      planet.setAttribute("tabindex", "0");
    }
  }
}

function applyStructuredEncounterBoardState(content) {
  const pendingStep = gameState?.encounter?.pendingStep;
  if (!gameState?.encounter?.active || !pendingStep) return;

  if (["shipJumpSelection", "shipBlockSelection"].includes(pendingStep.type)) {
    for (const shipId of pendingStep.shipIds ?? []) {
      const ship = content.querySelector(`[data-board-type='ship'][data-board-id='${cssEscape(shipId)}']`);
      ship?.classList.add("is-encounter-jump-target");
    }
  }

  if (pendingStep.type === "boardTargetSelection") {
    if (pendingStep.shipId) {
      const ship = content.querySelector(`[data-board-type='ship'][data-board-id='${cssEscape(pendingStep.shipId)}']`);
      ship?.classList.add("is-selected");
    }
    for (const nodeId of pendingStep.validNodeIds ?? []) {
      const target = content.querySelector(`[data-board-type='spacePoint'][data-board-id='${cssEscape(nodeId)}']`);
      target?.classList.add("is-reachable");
    }
  }
}

function applyStructuredFlightBoardState(content) {
  if (gameState?.encounter?.active) return;
  const flight = gameState?.flight;
  if (!flight?.hasRolledSpeed) return;

  const selectedShipId = flight.selectedShipId;
  if (selectedShipId) {
    const selectedShip = content.querySelector(`[data-board-type='ship'][data-board-id='${cssEscape(selectedShipId)}']`);
    selectedShip?.classList.add("is-selected");
  }

  const movableShipIds = new Set(Array.isArray(flight.movableShipIds) ? flight.movableShipIds : []);
  for (const shipId of movableShipIds) {
    const ship = content.querySelector(`[data-board-type='ship'][data-board-id='${cssEscape(shipId)}']`);
    ship?.classList.add("is-controller-movable-ship");
  }

  const reachableNodeIds = new Set(Array.isArray(flight.reachableNodeIds) ? flight.reachableNodeIds : []);
  for (const nodeId of reachableNodeIds) {
    const target = content.querySelector(`[data-board-type='spacePoint'][data-board-id='${cssEscape(nodeId)}']`);
    target?.classList.add("is-reachable");
  }
}

function getControllerBoardSvgDimensions(svg) {
  const viewBox = svg?.getAttribute("viewBox")?.trim().split(/\s+/).map(Number);
  if (!viewBox || viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value))) return null;
  return {
    width: Math.max(1, viewBox[2]),
    height: Math.max(1, viewBox[3])
  };
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}

function fitControllerBoardToViewport(viewport, content) {
  if (boardViewFitted) return;
  const dimensions = getControllerBoardSvgDimensions(content.querySelector("svg"));
  const rect = viewport.getBoundingClientRect();
  if (!dimensions || rect.width <= 0 || rect.height <= 0) return;

  boardScale = clampBoardScale(Math.min(rect.width / dimensions.width, rect.height / dimensions.height) * 0.94);
  boardOffset = {
    x: (rect.width - dimensions.width * boardScale) / 2,
    y: (rect.height - dimensions.height * boardScale) / 2
  };
  boardViewFitted = true;
  applyBoardTransform(content);
}

function clampBoardScale(scale) {
  return Math.min(4, Math.max(0.18, scale));
}

function attachBoardGestures(viewport, content) {
  viewport.addEventListener("click", (event) => {
    if (!isPlacementBoardMode() && !isFlightMovementBoardMode() && !isEncounterBoardSelectionMode() && !isFactoryPlacementBoardMode()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (boardGestureMoved) {
      boardGestureMoved = false;
      return;
    }
    if (!canUseBoardSelection()) {
      flashBoardFeedback(viewport);
      return;
    }
    if (isFactoryPlacementBoardMode()) {
      const factoryTarget = getFactoryPlanetTargetElement(getBoardElementFromEventTarget(event.target));
      if (factoryTarget) {
        sendFactoryPlacementSelection(factoryTarget.dataset.boardId);
        return;
      }
      flashBoardFeedback(viewport);
      return;
    }
    if (isEncounterShipJumpBoardMode()) {
      const directElement = getBoardElementFromEventTarget(event.target);
      const directShip = getEncounterJumpShipElement(directElement);
      if (directShip) {
        sendEncounterJumpShipSelection(directShip.dataset.boardId);
        return;
      }
      const nearestShip = findNearestEncounterJumpShip(content, event.clientX, event.clientY);
      if (nearestShip) {
        sendEncounterJumpShipSelection(nearestShip.dataset.boardId);
        return;
      }
      flashBoardFeedback(viewport);
      return;
    }
    if (isEncounterTargetBoardMode()) {
      const directElement = getBoardElementFromEventTarget(event.target);
      const directReachableTarget = getReachableTargetElement(directElement);
      if (directReachableTarget) {
        sendEncounterTargetSelection(directReachableTarget.dataset.boardId);
        return;
      }
      const reachableTarget = findNearestReachableTarget(content, event.clientX, event.clientY);
      if (reachableTarget) {
        sendEncounterTargetSelection(reachableTarget.dataset.boardId);
        return;
      }
      flashBoardFeedback(viewport);
      return;
    }
    if (isFlightMovementBoardMode()) {
      const directElement = getBoardElementFromEventTarget(event.target);
      const directShip = getMovableShipElement(directElement);
      if (directShip) {
        sendFlightShipSelection(directShip.dataset.boardId);
        return;
      }

      const directReachableTarget = getReachableTargetElement(directElement);
      if (directReachableTarget) {
        sendFlightMoveSelection(directReachableTarget.dataset.boardId);
        return;
      }

      const nearestShip = findNearestMovableShip(content, event.clientX, event.clientY);
      if (nearestShip) {
        sendFlightShipSelection(nearestShip.dataset.boardId);
        return;
      }

      const reachableTarget = findNearestReachableTarget(content, event.clientX, event.clientY);
      if (reachableTarget) {
        sendFlightMoveSelection(reachableTarget.dataset.boardId);
        return;
      }
    }
    const placementTarget = findNearestPlacementTarget(content, event.clientX, event.clientY);
    if (!placementTarget) {
      flashBoardFeedback(viewport);
      return;
    }
    sendPlacementSelection(placementTarget.dataset.boardId);
  }, true);

  content.querySelectorAll("[data-board-type][data-board-id]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!canUseBoardSelection()) {
        flashBoardFeedback(viewport);
        return;
      }
      if (isFactoryPlacementBoardMode()) {
        const factoryTarget = getFactoryPlanetTargetElement(element);
        if (factoryTarget) {
          sendFactoryPlacementSelection(factoryTarget.dataset.boardId);
          return;
        }
        flashBoardFeedback(viewport);
        return;
      }
      if (isPlacementBoardMode()) {
        const placementTarget = getPlacementTargetElement(element) ?? findNearestPlacementTarget(content, event.clientX, event.clientY);
        if (!placementTarget) {
          flashBoardFeedback(viewport);
          return;
        }
        sendPlacementSelection(placementTarget.dataset.boardId);
        return;
      }
      if (isEncounterShipJumpBoardMode()) {
        const jumpShip = getEncounterJumpShipElement(element) ?? findNearestEncounterJumpShip(content, event.clientX, event.clientY);
        if (jumpShip) {
          sendEncounterJumpShipSelection(jumpShip.dataset.boardId);
          return;
        }
        flashBoardFeedback(viewport);
        return;
      }
      if (isEncounterTargetBoardMode()) {
        const reachableTarget = getReachableTargetElement(element) ?? findNearestReachableTarget(content, event.clientX, event.clientY);
        if (reachableTarget) {
          sendEncounterTargetSelection(reachableTarget.dataset.boardId);
          return;
        }
        flashBoardFeedback(viewport);
        return;
      }
      if (isFlightMovementBoardMode()) {
        if (element.dataset.boardType === "ship") {
          sendFlightShipSelection(element.dataset.boardId);
          return;
        }
        const reachableTarget = getReachableTargetElement(element) ?? findNearestReachableTarget(content, event.clientX, event.clientY);
        if (reachableTarget) {
          sendFlightMoveSelection(reachableTarget.dataset.boardId);
          return;
        }
        flashBoardFeedback(viewport);
        return;
      }
      sendNamedAction("board.select", {
        type: element.dataset.boardType,
        id: element.dataset.boardId
      });
    });
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (boardPointers.size === 0) boardGestureMoved = false;
    boardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const midpoint = getPointerMidpoint();
    boardPanStart = {
      x: boardOffset.x,
      y: boardOffset.y,
      pointerX: midpoint?.x ?? event.clientX,
      pointerY: midpoint?.y ?? event.clientY,
      distance: getPointerDistance()
    };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!boardPointers.has(event.pointerId)) return;
    boardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (
      boardPanStart &&
      Math.hypot(event.clientX - boardPanStart.pointerX, event.clientY - boardPanStart.pointerY) > 8
    ) {
      boardGestureMoved = true;
      if (!viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId);
    }
    if (boardPointers.size >= 2) {
      const nextDistance = getPointerDistance();
      const midpoint = getPointerMidpoint();
      if (boardPanStart?.distance && nextDistance > 0 && midpoint) {
        zoomBoardAtClientPoint(viewport, midpoint.x, midpoint.y, boardScale * (nextDistance / boardPanStart.distance));
        boardPanStart.distance = nextDistance;
        boardPanStart.pointerX = midpoint.x;
        boardPanStart.pointerY = midpoint.y;
      }
    } else if (boardPanStart) {
      boardOffset = {
        x: boardPanStart.x + event.clientX - boardPanStart.pointerX,
        y: boardPanStart.y + event.clientY - boardPanStart.pointerY
      };
    }
    applyBoardTransform(content);
  });
  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomBoardAtClientPoint(viewport, event.clientX, event.clientY, boardScale * (event.deltaY < 0 ? 1.12 : 0.89));
    applyBoardTransform(content);
  }, { passive: false });
  viewport.addEventListener("pointerup", (event) => {
    boardPointers.delete(event.pointerId);
    resetBoardPanStartAfterPointerEnd();
  });
  viewport.addEventListener("pointercancel", (event) => {
    boardPointers.delete(event.pointerId);
    resetBoardPanStartAfterPointerEnd();
  });
}

function getControllerBoardModeLabel() {
  if (!gameState?.board) return t("boardViewOnly");
  if (gameState.phase === "flight" && !gameState.encounter?.active) return getControllerFlightMovementStatus();
  if (canUseBoardSelection()) return gameState.board.mode || t("encounterSelectTargetPoint");
  if (gameState.phase === "flight" && gameState.flight?.activePlayerName) {
    return gameState.flight.waitHint || t("controllerFlightWait", { playerName: gameState.flight.activePlayerName });
  }
  if (gameState.phase === "placement" && gameState.placement?.waitHint) {
    return gameState.placement.waitHint;
  }
  if (gameState.board.actionPlayerId && gameState.board.actionPlayerId !== selectedPlayerId) {
    return t("controllerOtherPlayerTurn", { player: gameState.activePlayerName || t("controllerOtherPlayer") });
  }
  return t("boardViewOnly");
}

function getControllerFlightMovementStatus() {
  const status = getControllerFlightStatus(gameState?.flight, selectedPlayerId, isSelectedPlayerActive());
  return status.fallback || t(status.key, status.replacements);
}

function isPlacementBoardMode() {
  return Boolean(
    gameState?.phase === "placement" &&
    gameState?.placement &&
    ["placeSpaceport", "placeColonyShip", "placeFirstColony", "placeSecondColony"].includes(gameState.placement.step)
  );
}

function isFlightMovementBoardMode() {
  return Boolean(
    gameState?.phase === "flight" &&
    gameState?.flight?.hasRolledSpeed &&
    !gameState?.encounter?.active
  );
}

function isEncounterBoardSelectionMode() {
  return Boolean(
    gameState?.encounter?.active &&
    ["shipJumpSelection", "boardTargetSelection", "shipBlockSelection"].includes(gameState.encounter.pendingType)
  );
}

function isFactoryPlacementBoardMode() {
  return Boolean(
    gameState?.phase === "tradeBuild" &&
    gameState?.factoryPlacement?.ownerPlayerId
  );
}

function isEncounterShipJumpBoardMode() {
  return Boolean(["shipJumpSelection", "shipBlockSelection"].includes(gameState?.encounter?.pendingType));
}

function isEncounterTargetBoardMode() {
  return Boolean(gameState?.encounter?.pendingType === "boardTargetSelection");
}

function getPlacementTargetElement(element) {
  const candidate = element?.closest?.("[data-board-type='spacePoint'][data-board-id]");
  if (!candidate?.classList?.contains("is-placement-target")) return null;
  return candidate;
}

function getFactoryPlanetTargetElement(element) {
  const candidate = element?.closest?.("[data-board-type='planet'][data-board-id]");
  if (!candidate || !gameState?.factoryPlacement?.validPlanetIds?.includes(candidate.dataset.boardId)) return null;
  return candidate;
}

function getBoardElementFromEventTarget(target) {
  return target?.closest?.("[data-board-type][data-board-id]") ?? null;
}

function getMovableShipElement(element) {
  const candidate = element?.closest?.("[data-board-type='ship'][data-board-id]");
  if (!candidate || !isMovableShipId(candidate.dataset.boardId)) return null;
  return candidate;
}

function getEncounterJumpShipElement(element) {
  const candidate = element?.closest?.("[data-board-type='ship'][data-board-id]");
  if (!candidate || !isEncounterJumpShipId(candidate.dataset.boardId)) return null;
  return candidate;
}

function findNearestPlacementTarget(content, clientX, clientY) {
  let nearest = null;
  let nearestDistance = Infinity;
  content.querySelectorAll("[data-board-type='spacePoint'][data-board-id].is-placement-target").forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const threshold = Math.max(18, Math.max(rect.width, rect.height) * 2.35);
    if (distance <= threshold && distance < nearestDistance) {
      nearest = element;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function getReachableTargetElement(element) {
  const candidate = element?.closest?.("[data-board-type='spacePoint'][data-board-id]");
  if (!candidate || !isReachableTargetId(candidate.dataset.boardId)) return null;
  return candidate;
}

function findNearestReachableTarget(content, clientX, clientY) {
  let nearest = null;
  let nearestDistance = Infinity;
  content.querySelectorAll("[data-board-type='spacePoint'][data-board-id]").forEach((element) => {
    if (!isReachableTargetId(element.dataset.boardId)) return;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const threshold = Math.max(18, Math.max(rect.width, rect.height) * 2.2);
    if (distance <= threshold && distance < nearestDistance) {
      nearest = element;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function findNearestMovableShip(content, clientX, clientY) {
  let nearest = null;
  let nearestDistance = Infinity;
  content.querySelectorAll("[data-board-type='ship'][data-board-id]").forEach((element) => {
    if (!isMovableShipId(element.dataset.boardId)) return;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const threshold = Math.max(24, Math.max(rect.width, rect.height) * 0.72);
    if (distance <= threshold && distance < nearestDistance) {
      nearest = element;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function findNearestEncounterJumpShip(content, clientX, clientY) {
  let nearest = null;
  let nearestDistance = Infinity;
  content.querySelectorAll("[data-board-type='ship'][data-board-id]").forEach((element) => {
    if (!isEncounterJumpShipId(element.dataset.boardId)) return;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const threshold = Math.max(28, Math.max(rect.width, rect.height) * 0.85);
    if (distance <= threshold && distance < nearestDistance) {
      nearest = element;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function isMovableShipId(shipId) {
  if (!shipId) return false;
  return Boolean(gameState?.flight?.movableShipIds?.includes(shipId));
}

function isEncounterJumpShipId(shipId) {
  if (!shipId) return false;
  return Boolean(gameState?.encounter?.pendingStep?.shipIds?.includes(shipId));
}

function isReachableTargetId(nodeId) {
  if (!nodeId) return false;
  if (gameState?.encounter?.pendingStep?.validNodeIds?.includes(nodeId)) return true;
  if (gameState?.flight?.reachableNodeIds?.includes(nodeId)) return true;
  return Boolean(document.querySelector(`[data-board-type='spacePoint'][data-board-id='${cssEscape(nodeId)}'].is-reachable`));
}

function sendFlightShipSelection(shipId) {
  if (!shipId) return;
  sendNamedAction("board.select", {
    type: "ship",
    id: shipId
  });
}

function sendFlightMoveSelection(nodeId) {
  if (!nodeId) return;
  sendNamedAction("board.moveShip", { targetNodeId: nodeId });
}

function sendEncounterJumpShipSelection(shipId) {
  if (!shipId) return;
  sendNamedAction("board.select", {
    type: "ship",
    id: shipId
  });
}

function sendEncounterTargetSelection(nodeId) {
  if (!nodeId) return;
  sendNamedAction("board.select", {
    type: "spacePoint",
    id: nodeId
  });
}

function sendPlacementSelection(nodeId) {
  if (!nodeId) return;
  sendNamedAction("placement.select", { nodeId });
}

function sendFactoryPlacementSelection(planetId) {
  if (!planetId) return;
  sendNamedAction("board.select", {
    type: "planet",
    id: planetId
  });
}

function getPlacementTurnHint() {
  if (gameState?.phase !== "placement" || !gameState.placement) return "";
  if (gameState.placement.actionPlayerId === selectedPlayerId && isSelectedPlayerActive()) {
    return gameState.placement.activeTurnHint || "";
  }
  if (gameState.placement.actionPlayerId && gameState.placement.actionPlayerId !== selectedPlayerId) {
    return gameState.placement.waitHint || "";
  }
  return "";
}

function getFlightTurnHint() {
  if (gameState?.phase !== "flight" || !gameState.flight?.hasRolledSpeed || gameState.encounter?.active) return "";
  if (gameState.flight.activePlayerId === selectedPlayerId && isSelectedPlayerActive()) {
    return gameState.flight.turnHint || "";
  }
  if (gameState.flight.activePlayerName) {
    return gameState.flight.waitHint || t("controllerFlightWait", { playerName: gameState.flight.activePlayerName });
  }
  return "";
}

function canUseBoardSelection() {
  return Boolean(
    gameState?.board?.actionPlayerId &&
    gameState.board.actionPlayerId === selectedPlayerId &&
    isSelectedPlayerActive()
  );
}

function scrubBoardSelectionForInactivePlayer(content) {
  if (canUseBoardSelection()) return;
  const selectionClasses = [
    "is-reachable",
    "is-colony-target",
    "is-dock-target",
    "is-foundable",
    "is-placement-target",
    "is-ship-build-target",
    "is-trade-station-target",
    "is-spaceport-build-target",
    "is-encounter-jump-target"
  ];
  content.querySelectorAll(selectionClasses.map((className) => `.${className}`).join(",")).forEach((element) => {
    element.classList.remove(...selectionClasses);
  });
}

function flashBoardFeedback(viewport) {
  viewport.classList.remove("controller-board-viewport--invalid");
  void viewport.offsetWidth;
  viewport.classList.add("controller-board-viewport--invalid");
}

function getPointerDistance() {
  const points = [...boardPointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function getPointerMidpoint() {
  const points = [...boardPointers.values()];
  if (points.length === 0) return null;
  if (points.length === 1) return { ...points[0] };
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
}

function zoomBoardAtClientPoint(viewport, clientX, clientY, nextScale) {
  const rect = viewport.getBoundingClientRect();
  const anchorX = clientX - rect.left;
  const anchorY = clientY - rect.top;
  const previousScale = boardScale;
  const boardX = (anchorX - boardOffset.x) / previousScale;
  const boardY = (anchorY - boardOffset.y) / previousScale;
  boardScale = clampBoardScale(nextScale);
  boardOffset = {
    x: anchorX - boardX * boardScale,
    y: anchorY - boardY * boardScale
  };
}

function resetBoardPanStartAfterPointerEnd() {
  const midpoint = getPointerMidpoint();
  if (!midpoint) {
    boardPanStart = null;
    return;
  }
  boardPanStart = {
    x: boardOffset.x,
    y: boardOffset.y,
    pointerX: midpoint.x,
    pointerY: midpoint.y,
    distance: getPointerDistance()
  };
}

function createMetaItem(label, value) {
  const item = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  item.append(strong, document.createTextNode(value));
  return item;
}

function getResourceLabel(resource) {
  return t(`resource_${resource}`);
}

function getUpgradeLabel(upgradeId) {
  return t(`upgrade_${upgradeId}`);
}

function getBuildActionLabel(actionId) {
  return t(`build_${actionId}`);
}

function formatCost(cost = {}) {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${getResourceLabel(resource)}`)
    .join(", ");
}

function formatResourceSelection(resources = {}) {
  const entries = Object.entries(resources)
    .filter(([, amount]) => amount > 0)
    .map(([resource, amount]) => `${amount} ${getResourceLabel(resource)}`);
  return entries.length > 0 ? entries.join(", ") : t("none");
}

function formatUpgradeValue(player, upgrade) {
  const realValue = player?.upgrades?.[upgrade.id] ?? 0;
  const bonus = player?.upgradeBonuses?.[upgrade.id] ?? 0;
  return bonus > 0
    ? `${realValue}/${upgrade.limit} (+${bonus}, ${t("effectiveUpgradeValue")}: ${realValue + bonus})`
    : `${realValue}/${upgrade.limit}`;
}

function formatMedals(player) {
  const medals = Math.max(0, player?.halfMedals ?? 0) / 2;
  return medals.toLocaleString(gameState?.language === "en" ? "en-US" : "de-DE", {
    minimumFractionDigits: medals % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  });
}

function formatList(items = []) {
  return items.length > 0 ? items.join(", ") : t("none");
}

function getStatusLabel() {
  if (connectionStatus === "connected") return t("controllerSlotConnected");
  if (connectionStatus === "waiting") return t("controllerStatusWaiting");
  if (connectionStatus === "lost") return t("controllerStatusLost");
  if (connectionStatus === "replaced") return t("controllerStatusReplaced");
  if (connectionStatus === "occupied") return t("controllerStatusOccupied");
  if (connectionStatus === "access-denied") return t("controllerStatusAccessDenied");
  if (connectionStatus === "missing-session") return t("controllerStatusMissingSession");
  if (connectionStatus === "missing-player") return t("controllerStatusMissingPlayer");
  if (connectionStatus === "missing-access") return t("controllerStatusMissingAccess");
  return t("controllerStatusConnecting");
}

function updateControllerViewportHeight() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--controller-viewport-height", `${Math.round(viewportHeight)}px`);
}

updateControllerViewportHeight();
window.addEventListener("resize", updateControllerViewportHeight);
window.addEventListener("orientationchange", updateControllerViewportHeight);
window.visualViewport?.addEventListener("resize", updateControllerViewportHeight);
window.visualViewport?.addEventListener("scroll", updateControllerViewportHeight);
document.addEventListener("fullscreenchange", render);
window.addEventListener("pagehide", () => {
  if (controllerRenderFrameId !== null) cancelAnimationFrame(controllerRenderFrameId);
  controllerRenderFrameId = null;
  if (!localFallbackActive) return;
  sendLocalHostMessage({ type: "disconnect" });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        // The controller remains usable when service workers are unavailable.
      });
  }, { once: true });
}

render();
connect();
