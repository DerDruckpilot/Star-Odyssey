import { buildActionDefinitions, resourceTypes, upgradeDefinitions } from "./data/buildCosts.js";
import { getFriendshipCardById, getFriendshipCardSummary, getFriendshipCardTitle } from "./data/friendshipCards.js";
import { mothershipUpgradeSlots, upgradeMenuAssetPaths, upgradeMenuOrder } from "./data/upgradeVisuals.js";

const root = document.querySelector("#controller-root");
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session") || "";
const reconnectDelayMs = 1400;
const localControllerStoragePrefix = "star-odyssey-controller-channel";
const resourceLabels = {
  ore: "Erz",
  fuel: "Treibstoff",
  carbon: "Carbon",
  food: "Nahrung",
  goods: "Handelsware"
};
const upgradeLabels = {
  cannon: "Bordkanone",
  cargo: "Frachtmodul",
  drive: "Antrieb"
};
const buildLabels = {
  colonyShip: "Kolonieschiff bauen",
  tradeShip: "Handelsschiff bauen",
  spaceport: "Kolonie zu Raumhafen ausbauen"
};

let socket = null;
let localChannel = null;
let localTransport = "";
let localFallbackActive = false;
let webSocketConnectedOnce = false;
let reconnectTimer = null;
let selectedPlayerId = normalizePlayerParam(params.get("player"));
let controllerId = loadStoredControllerId(selectedPlayerId);
let connectionStatus = "connecting";
let replacedByReconnect = false;
let gameState = null;
let activeTab = "turn";
let boardFullscreen = false;
let boardScale = 1;
let boardOffset = { x: 0, y: 0 };
let boardPointers = new Map();
let boardPanStart = null;
const tabScrollPositions = new Map();
const setupNameDrafts = new Map();
let saveNameDraft = "";

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

function connect() {
  if (!sessionId) {
    connectionStatus = "missing-session";
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
    if (replacedByReconnect) return;
    if (webSocketConnectedOnce) {
      connectionStatus = "lost";
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
    playerId: selectedPlayerId
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
    localChannel.addEventListener("message", (event) => handleLocalHostMessage(event.data));
    return;
  }
  localTransport = "storage";
  window.addEventListener("storage", (event) => {
    if (event.key !== getLocalControllerStorageKey("host") || !event.newValue) return;
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
    playerId: selectedPlayerId,
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
  handleMessage(JSON.stringify(message));
}

function getLocalControllerChannelName() {
  return `${localControllerStoragePrefix}:${sessionId}`;
}

function getLocalControllerStorageKey(direction) {
  return `${localControllerStoragePrefix}:${sessionId}:${direction}`;
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
    render();
    return;
  }

  if (message.type === "replaced") {
    replacedByReconnect = true;
    connectionStatus = "replaced";
    render();
    socket?.close();
  }
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

function render() {
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
    root.replaceChildren(shell);
    restoreControllerScrollPosition();
    restoreFocusedInput(focusedInput);
    return;
  }

  const tabs = renderTabs();
  const activeContent = renderActiveTab(currentPlayer);

  content.append(tabs, activeContent);
  shell.append(header, content);
  root.replaceChildren(shell);
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
  status.append(statusDot, statusLabel, createButton("Neu verbinden", connect, "small-button controller-reconnect-inline"));

  titleGroup.append(title, status, renderControllerResources(player));

  const actions = document.createElement("div");
  actions.className = "controller-header-actions";
  if (player && gameState?.view === "board") {
    actions.append(createButton("Schließen", () => {
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
    term.textContent = resourceLabels[resource] ?? resource;
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
  title.textContent = slot ? `Verbunden als Spieler ${slot.slotNumber}` : "Spieler-Setup";

  const nameLabel = document.createElement("label");
  nameLabel.className = "controller-field";
  nameLabel.textContent = "Name";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  const draftName = setupNameDrafts.has(selectedPlayerId)
    ? setupNameDrafts.get(selectedPlayerId)
    : (slot?.name ?? "");
  nameInput.value = draftName;
  nameInput.disabled = Boolean(slot?.ready);
  nameInput.placeholder = `Spieler ${slot?.slotNumber ?? ""}`;
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
    if (usedByOther) button.title = "Bereits vergeben";
    colorGrid.append(button);
  }

  const status = document.createElement("p");
  status.className = "controller-empty";
  status.textContent = getSetupStatus(slot);

  const readyButton = createButton(slot?.ready ? "Bearbeiten" : "Bereit", () => {
    if (!slot?.ready) commitSetupNameDraft(slot, nameInput.value);
    sendNamedAction(slot?.ready ? "player.edit" : "player.ready", { name: nameInput.value });
  });
  readyButton.disabled = !slot || (!slot.ready && (!nameInput.value.trim() || !slot.color));

  section.append(title, nameLabel, colorGrid, status, readyButton);
  return section;
}

function renderTabs() {
  const tabs = document.createElement("nav");
  tabs.className = "player-hud-tabs controller-tabs controller-tabbar";
  const definitions = [
    ["turn", "Zug"],
    ["trade", "Handeln"],
    ["mothership", "Mutterschiff"],
    ["build", "Bauen"],
    ["outposts", "Außenposten"],
    ["overview", "Übersicht"],
    ["board", "Spielfeld"]
  ];
  if (isSelectedPlayerAdmin()) definitions.push(["settings", "Einstellungen"]);

  for (const [tabId, label] of definitions) {
    const button = createButton(label, () => {
      if (tabId === "board") {
        boardFullscreen = true;
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
  if (activeTab === "settings") return renderSettingsTab();
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
  title.textContent = gameState?.phaseLabel || "Zug";
  const actions = getTurnActions();
  section.append(title, renderTurnHint(player), renderEncounterPanel(), renderActionGrid(actions));
  return section;
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
  title.textContent = "Bauen";
  section.append(title, renderBuildControls(player));
  return section;
}

function renderOverviewTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = "Übersicht";
  section.append(title, renderPlayerOverview(player));
  return section;
}

function renderOutpostsTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = "Außenposten";
  section.append(title, renderFriendshipSummary(player));
  return section;
}

function renderTradeTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = "Handeln";
  section.append(title, renderBankTradeControls(player), renderPlayerTradeControls(player));
  return section;
}

function renderSettingsTab() {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = "Einstellungen";
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
  title.textContent = "Spiel speichern";

  const label = document.createElement("label");
  label.className = "controller-field";
  label.textContent = "Name";
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

  const saveButton = createButton("Speichern", () => {
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
    empty.textContent = "Keine Spielstände vorhanden.";
    list.append(empty);
    return list;
  }

  for (const save of saves) {
    const item = document.createElement("article");
    item.className = "controller-save-item";
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = save.name || "Spielstand";
    const meta = document.createElement("small");
    meta.textContent = [save.displayDate, save.playerCount ? `${save.playerCount} Spieler` : ""].filter(Boolean).join(" · ");
    details.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "save-actions";
    actions.append(
      createButton("Laden", () => sendNamedAction("save.load", { saveId: save.id }), "small-button"),
      createButton("Löschen", () => sendNamedAction("save.delete", { saveId: save.id }), "small-button secondary-small-button")
    );
    item.append(details, actions);
    list.append(item);
  }
  return list;
}

function createDefaultSaveName() {
  const now = new Date();
  const date = now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const round = gameState?.phaseLabel ? ` - ${gameState.phaseLabel}` : "";
  return `Spielstand ${date} ${time}${round}`;
}

function renderEncounterPanel() {
  if (!gameState?.encounter?.active) return document.createDocumentFragment();
  const panel = document.createElement("div");
  panel.className = "selection-panel controller-encounter-panel";
  const title = document.createElement("strong");
  title.textContent = "Begegnung";
  const isOwner = gameState.encounter.playerId === selectedPlayerId;
  panel.append(title);

  const promptText = gameState.encounter.resultText || gameState.encounter.prompt || "";
  if (promptText) {
    const prompt = document.createElement("p");
    prompt.className = "encounter-prompt";
    prompt.textContent = promptText;
    panel.append(prompt);
  }

  const hint = document.createElement("p");
  hint.textContent = isOwner ? getEncounterStatusLabel() : `${gameState.activePlayerName || "Ein anderer Spieler"} entscheidet.`;
  panel.append(hint);

  if (isOwner && gameState.encounter.status === "resolved") {
    const finishAction = findAction("finishEncounter");
    if (finishAction) panel.append(renderActionGrid([finishAction]));
  } else if (isOwner && ["shipJumpSelection", "boardTargetSelection"].includes(gameState.encounter.pendingType)) {
    panel.append(createButton(
      gameState.encounter.pendingType === "shipJumpSelection" ? "Schiff wählen" : "Ziel wählen",
      () => {
        sendNamedAction("encounter.startBoardSelection");
        boardFullscreen = true;
        render();
      },
      "controller-button"
    ));
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

function getEncounterStatusLabel() {
  if (gameState?.encounter?.status === "resolved") return "Begegnung abschließen.";
  if (gameState?.encounter?.pendingType) return "Folge den nächsten Begegnungsschritten.";
  return "Wähle eine Antwort.";
}

function renderTurnHint(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "turn-summary controller-summary";
  if (!player) {
    wrapper.textContent = "Warte auf Spielstand.";
    return wrapper;
  }
  const activeText = isSelectedPlayerActive()
    ? "Du bist am Zug."
    : `${gameState?.activePlayerName || "Ein anderer Spieler"} ist am Zug.`;
  wrapper.append(createMetaItem("Phase", gameState?.phaseLabel || "-"));
  wrapper.append(createMetaItem("Status", activeText));
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
      bonusText.textContent = `Freundschaftsbonus +${bonus} · Effektiv: ${player?.effectiveUpgrades?.[upgrade.id] ?? ((player?.upgrades?.[upgrade.id] ?? 0) + bonus)}`;
    }

    const cost = document.createElement("small");
    cost.className = "upgrade-card-cost";
    cost.textContent = `Kosten: ${formatCost(upgrade.cost)}`;

    const button = createButton("Bauen", () => action && sendAction(action), "small-button");
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

function renderBuildControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section build-controls";

  for (const actionDefinition of buildActionDefinitions) {
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
    cost.textContent = `Kosten: ${formatCost(actionDefinition.cost)}`;

    const button = createButton("Bauen", () => remoteAction && sendAction(remoteAction), "small-button");
    button.disabled = !remoteAction || Boolean(remoteAction.disabled);

    const actions = document.createElement("div");
    actions.className = "upgrade-card-actions";
    actions.append(button, cost);
    body.append(label, actions);
    card.append(preview, body);
    wrapper.append(card);
  }

  return wrapper;
}

function renderResourceOverview(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "resource-summary";
  const title = document.createElement("strong");
  title.textContent = "Rohstoffe";
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
  title.textContent = "Bankhandel";

  const fields = document.createElement("div");
  fields.className = "trade-fields";
  const fromResource = gameState?.trade?.bankFromResource ?? "ore";
  const toResource = gameState?.trade?.bankToResource ?? "food";
  fields.append(
    renderResourceSelect("Geben", fromResource, (resource) => {
      sendNamedAction("trade.setBankResources", { fromResource: resource, toResource });
    }),
    renderResourceSelect("Erhalten", toResource, (resource) => {
      sendNamedAction("trade.setBankResources", { fromResource, toResource: resource });
    })
  );

  const rate = player?.tradeRates?.[fromResource] ?? 3;
  const hint = document.createElement("p");
  hint.textContent = `${rate}:1`;

  const button = createButton("Handeln", () => sendNamedAction("trade.bankTrade"), "small-button");
  button.disabled = !canUseTradeBuildActions(player) || fromResource === toResource || (player?.resources?.[fromResource] ?? 0) < rate;

  wrapper.append(title, fields, hint, button);
  return wrapper;
}

function renderPlayerTradeControls(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "trade-build-section player-trade-controls";
  const title = document.createElement("strong");
  title.textContent = "Spielerhandel";
  wrapper.append(title);

  const activeTradeOffer = gameState?.trade?.activeTradeOffer;
  if (activeTradeOffer) {
    wrapper.append(renderActiveTradeOffer(player, activeTradeOffer));
    return wrapper;
  }

  if (!canUseTradeBuildActions(player)) {
    const hint = document.createElement("p");
    hint.textContent = isSelectedPlayerActive() ? "Handel ist nur in der Handels-/Bauphase möglich." : "Nicht am Zug.";
    wrapper.append(hint);
    return wrapper;
  }

  wrapper.append(
    renderTradeTargetSelect(),
    renderTradeResourceConfigurator("offered"),
    renderTradeResourceConfigurator("requested")
  );

  const offerButton = createButton("Handel anbieten", () => sendNamedAction("trade.createOffer"), "small-button");
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
  title.textContent = "Offenes Handelsangebot";
  const summary = document.createElement("p");
  summary.textContent = `${fromPlayer?.name ?? activeTradeOffer.fromPlayerId} -> ${toPlayer?.name ?? activeTradeOffer.toPlayerId}`;
  const offered = document.createElement("p");
  offered.textContent = `Du gibst: ${formatResourceSelection(giveResources)}`;
  const requested = document.createElement("p");
  requested.textContent = `Du erhältst: ${formatResourceSelection(receiveResources)}`;
  wrapper.append(title, summary, offered, requested);

  const actions = document.createElement("div");
  actions.className = "trade-offer-actions";
  if (player?.id === activeTradeOffer.toPlayerId) {
    actions.append(
      createButton("Annehmen", () => sendNamedAction("trade.acceptOffer"), "small-button"),
      createButton("Ablehnen", () => sendNamedAction("trade.declineOffer"), "small-button secondary-small-button")
    );
  } else if (player?.id === activeTradeOffer.fromPlayerId) {
    actions.append(createButton("Angebot zurückziehen", () => sendNamedAction("trade.cancelOffer"), "small-button secondary-small-button"));
  }
  if (actions.childElementCount > 0) wrapper.append(actions);
  return wrapper;
}

function renderTradeTargetSelect() {
  const label = document.createElement("label");
  label.className = "resource-select";
  const caption = document.createElement("span");
  caption.textContent = "Zielspieler";

  const select = document.createElement("select");
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Zielspieler wählen";
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
  title.textContent = side === "offered" ? "Du gibst" : "Du erhältst";
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
  title.textContent = "Übersicht";
  const counts = player?.counts ?? {};
  const rows = [
    ["Siegpunkte", player?.victoryPoints ?? 0],
    ["Schiffe", counts.ships ?? 0],
    ["Kolonien", counts.colonies ?? 0],
    ["Raumhäfen", counts.spaceports ?? 0],
    ["Handelsstationen", counts.tradeStations ?? 0],
    ["Medaillen", player?.medalLabel ?? formatMedals(player)]
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

function renderFriendshipSummary(player) {
  const wrapper = document.createElement("div");
  wrapper.className = "friendship-summary fleet-summary";
  const title = document.createElement("strong");
  title.textContent = "Freundschaft";

  const friendship = player?.friendship ?? {};
  const rows = [
    ["Handelsstationen", player?.counts?.tradeStations ?? 0],
    ["Außenposten", formatList(friendship.representedOutposts)],
    ["Freundschaftsmarker", formatList(friendship.markers)]
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
    cardTitle.textContent = "Aktive Freundschaftskarten";
    const cardList = document.createElement("div");
    cardList.className = "friendship-card-list";
    for (const cardInfo of cards) {
      const card = getFriendshipCardById(cardInfo.id) ?? cardInfo;
      const cardElement = document.createElement("article");
      cardElement.className = "friendship-card";
      const titleElement = document.createElement("strong");
      titleElement.textContent = cardInfo.title || getFriendshipCardTitle(card);
      const summary = document.createElement("p");
      summary.textContent = cardInfo.summary || getFriendshipCardSummary(card);
      cardElement.append(titleElement, summary);
      cardList.append(cardElement);
    }
    wrapper.append(cardTitle, cardList);
  } else {
    const empty = document.createElement("p");
    empty.textContent = "Keine Freundschaftskarten.";
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
  title.textContent = "Spielfeld";
  const mode = document.createElement("p");
  mode.textContent = getControllerBoardModeLabel();
  const backButton = createButton("Zurück zum Menü", () => {
    boardFullscreen = false;
    render();
  }, "controller-board-back-button");
  header.append(title, mode, backButton);

  const viewport = document.createElement("div");
  viewport.className = "controller-board-viewport";
  const content = document.createElement("div");
  content.className = "controller-board-content";
  content.innerHTML = gameState?.board?.svg || "";
  scrubBoardSelectionForInactivePlayer(content);
  applyBoardTransform(content);
  attachBoardGestures(viewport, content);
  viewport.append(content);
  section.append(header, viewport);
  return section;
}

function renderPlayerSummary(player) {
  const summary = document.createElement("div");
  summary.className = "turn-summary controller-summary";
  if (!player) {
    summary.textContent = "Warte auf Spielstand.";
    return summary;
  }
  const resourceText = Object.entries(player.resources ?? {})
    .map(([resource, amount]) => `${resourceLabels[resource] ?? resource}: ${amount}`)
    .join(" · ");
  summary.append(createMetaItem("Spieler", player.name));
  summary.append(createMetaItem("Siegpunkte", String(player.victoryPoints ?? 0)));
  summary.append(createMetaItem("Medaillen", String(player.medals ?? 0).replace(".", ",")));
  summary.append(createMetaItem("Rohstoffe", resourceText || "-"));
  return summary;
}

function renderActionGrid(actions) {
  const actionGrid = document.createElement("div");
  actionGrid.className = "phase-actions controller-action-grid";
  if (actions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "controller-empty";
    empty.textContent = isSelectedPlayerActive() ? "Keine Aktionen verfügbar." : "Nicht am Zug.";
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
  if (slot) return `Spieler ${slot.slotNumber}`;
  const match = /^player-(\d+)$/.exec(selectedPlayerId || "");
  if (match) return `Spieler ${match[1]}`;
  return "Warte auf Spielstand";
}

function getSetupStatus(slot) {
  if (!slot) return "Warte auf Lobby.";
  if (slot.ready) return "Bereit. Das Spiel startet automatisch, sobald alle bereit sind.";
  if (!slot.name?.trim()) return "Bitte Namen eintragen.";
  if (!slot.color) return "Bitte Farbe wählen.";
  return "Bereit drücken, wenn alles passt.";
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

function attachBoardGestures(viewport, content) {
  content.querySelectorAll("[data-board-type][data-board-id]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!canUseBoardSelection()) {
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
    viewport.setPointerCapture(event.pointerId);
    boardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    boardPanStart = {
      x: boardOffset.x,
      y: boardOffset.y,
      pointerX: event.clientX,
      pointerY: event.clientY,
      distance: getPointerDistance()
    };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!boardPointers.has(event.pointerId)) return;
    boardPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (boardPointers.size >= 2) {
      const nextDistance = getPointerDistance();
      if (boardPanStart?.distance) {
        boardScale = Math.min(3.2, Math.max(0.45, boardScale * (nextDistance / boardPanStart.distance)));
        boardPanStart.distance = nextDistance;
      }
    } else if (boardPanStart) {
      boardOffset = {
        x: boardPanStart.x + event.clientX - boardPanStart.pointerX,
        y: boardPanStart.y + event.clientY - boardPanStart.pointerY
      };
    }
    applyBoardTransform(content);
  });
  viewport.addEventListener("pointerup", (event) => boardPointers.delete(event.pointerId));
  viewport.addEventListener("pointercancel", (event) => boardPointers.delete(event.pointerId));
}

function getControllerBoardModeLabel() {
  if (!gameState?.board) return "Nur ansehen";
  if (canUseBoardSelection()) return gameState.board.mode || "Ziel wählen";
  if (gameState.board.actionPlayerId && gameState.board.actionPlayerId !== selectedPlayerId) {
    return `${gameState.activePlayerName || "Ein anderer Spieler"} ist am Zug.`;
  }
  return "Nur ansehen";
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

function createMetaItem(label, value) {
  const item = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  item.append(strong, document.createTextNode(value));
  return item;
}

function getResourceLabel(resource) {
  return resourceLabels[resource] ?? resource;
}

function getUpgradeLabel(upgradeId) {
  return upgradeLabels[upgradeId] ?? upgradeId;
}

function getBuildActionLabel(actionId) {
  return buildLabels[actionId] ?? actionId;
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
  return entries.length > 0 ? entries.join(", ") : "keine";
}

function formatUpgradeValue(player, upgrade) {
  const realValue = player?.upgrades?.[upgrade.id] ?? 0;
  const bonus = player?.upgradeBonuses?.[upgrade.id] ?? 0;
  return bonus > 0
    ? `${realValue}/${upgrade.limit} (+${bonus}, Effektiv: ${realValue + bonus})`
    : `${realValue}/${upgrade.limit}`;
}

function formatMedals(player) {
  const medals = Math.max(0, player?.halfMedals ?? 0) / 2;
  return medals.toLocaleString("de-DE", {
    minimumFractionDigits: medals % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  });
}

function formatList(items = []) {
  return items.length > 0 ? items.join(", ") : "keine";
}

function getStatusLabel() {
  if (connectionStatus === "connected") return "Verbunden";
  if (connectionStatus === "waiting") return "Warte auf Spiel";
  if (connectionStatus === "lost") return "Getrennt";
  if (connectionStatus === "replaced") return "Ersetzt";
  if (connectionStatus === "missing-session") return "Keine Session in der URL";
  if (connectionStatus === "missing-player") return "Kein Spieler in der URL";
  return "Verbinde ...";
}

render();
connect();
