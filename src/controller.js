const root = document.querySelector("#controller-root");
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session") || "";
const storedControllerIdKey = "star-odyssey-controller-id";
const storedPlayerIdKey = `star-odyssey-controller-player-${sessionId || "default"}`;
const reconnectDelayMs = 1400;
const resourceLabels = {
  ore: "Erz",
  fuel: "Treibstoff",
  carbon: "Carbon",
  food: "Nahrung",
  goods: "Handelsware"
};

let socket = null;
let reconnectTimer = null;
let controllerId = loadStoredControllerId();
let selectedPlayerId = normalizePlayerParam(params.get("player")) || loadStoredPlayerId();
let connectionStatus = "connecting";
let replacedByReconnect = false;
let gameState = null;
let activeTab = "turn";
let boardScale = 1;
let boardOffset = { x: 0, y: 0 };
let boardPointers = new Map();
let boardPanStart = null;

function loadStoredControllerId() {
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

function loadStoredPlayerId() {
  try {
    return localStorage.getItem(storedPlayerIdKey) || "";
  } catch {
    return "";
  }
}

function normalizePlayerParam(value) {
  if (!value) return "";
  return /^\d+$/.test(value) ? `player-${value}` : value;
}

function saveSelectedPlayerId(playerId) {
  selectedPlayerId = playerId;
  try {
    localStorage.setItem(storedPlayerIdKey, playerId);
  } catch {
    // Controller selection persistence is best-effort.
  }
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

  clearTimeout(reconnectTimer);
  connectionStatus = "connecting";
  render();

  socket = new WebSocket(getWebSocketUrl());
  socket.addEventListener("open", () => {
    replacedByReconnect = false;
    connectionStatus = "waiting";
    sendHello();
    render();
  });
  socket.addEventListener("message", (event) => {
    handleMessage(event.data);
  });
  socket.addEventListener("close", () => {
    if (replacedByReconnect) return;
    connectionStatus = "lost";
    render();
    reconnectTimer = setTimeout(connect, reconnectDelayMs);
  });
  socket.addEventListener("error", () => {
    connectionStatus = "lost";
    render();
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
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(data));
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
  const shell = document.createElement("section");
  shell.className = "player-hud-panel controller-panel";

  const currentPlayer = getSelectedPlayer();
  const header = renderControllerHeader(currentPlayer);
  const content = document.createElement("div");
  content.className = "player-hud-content controller-content";

  if (gameState?.view === "controllers" && gameState.controllerLobby) {
    content.append(renderSetupPanel(), renderReconnectFooter());
    shell.append(header, content);
    root.replaceChildren(shell);
    return;
  }

  const tabs = renderTabs();
  const activeContent = renderActiveTab(currentPlayer);

  content.append(tabs, activeContent, renderReconnectFooter());
  shell.append(header, content);
  root.replaceChildren(shell);
}

function renderControllerHeader(player) {
  const header = document.createElement("header");
  header.className = "player-hud-header controller-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "player-hud-title controller-title";
  const title = document.createElement("h2");
  const slot = getOwnLobbySlot();
  title.textContent = player?.name || (slot ? `Spieler ${slot.slotNumber}` : "Star Odyssey");
  const status = document.createElement("p");
  status.className = `controller-status controller-status--${connectionStatus}`;
  status.textContent = getStatusLabel();
  titleGroup.append(title, status);
  if (player) titleGroup.append(renderControllerResources(player));

  const meta = document.createElement("div");
  meta.className = "controller-header-meta";
  meta.append(createMetaItem("Phase", gameState?.phaseLabel || "Warte auf Spiel"));
  meta.append(createMetaItem("Aktiv", gameState?.activePlayerName || "-"));
  meta.append(createMetaItem("Session", sessionId || "fehlt"));

  header.append(titleGroup, meta);
  return header;
}

function renderControllerResources(player) {
  const list = document.createElement("dl");
  list.className = "player-hud-resources controller-resource-list";
  for (const [resource, amount] of Object.entries(player.resources ?? {})) {
    const term = document.createElement("dt");
    term.textContent = resourceLabels[resource] ?? resource;
    const value = document.createElement("dd");
    value.textContent = String(amount);
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
  nameInput.value = slot?.name ?? "";
  nameInput.disabled = Boolean(slot?.ready);
  nameInput.placeholder = `Spieler ${slot?.slotNumber ?? ""}`;
  nameInput.addEventListener("input", () => sendNamedAction("player.setName", { name: nameInput.value }));
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
    sendNamedAction(slot?.ready ? "player.edit" : "player.ready");
  });
  readyButton.disabled = !slot || (!slot.ready && (!slot.name?.trim() || !slot.color));

  section.append(title, nameLabel, colorGrid, status, readyButton);
  return section;
}

function renderTabs() {
  const tabs = document.createElement("nav");
  tabs.className = "player-hud-tabs controller-tabs";
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
      activeTab = tabId;
      render();
    }, "hud-tab-button controller-tab-button");
    button.setAttribute("aria-pressed", String(activeTab === tabId));
    tabs.append(button);
  }
  return tabs;
}

function renderActiveTab(player) {
  if (activeTab === "board") return renderBoardTab();
  if (activeTab === "settings") return renderSettingsTab();
  if (activeTab === "overview") return renderOverviewTab(player);
  if (activeTab === "build") return renderActionTab("Bauen", ["build."]);
  if (activeTab === "mothership") return renderActionTab("Mutterschiff", ["upgrade."]);
  if (activeTab === "outposts") return renderInfoTab("Außenposten", "Freundschaftsmarker und Außenposten-Details bleiben auf dem TV öffentlich sichtbar.");
  if (activeTab === "trade") return renderInfoTab("Handeln", "Handelsaktionen folgen hier; Basisaktionen sind im Zug-Tab verfügbar.");
  return renderTurnTab(player);
}

function renderTurnTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = "Zug";
  section.append(title, renderPlayerSummary(player), renderEncounterPanel(), renderActionGrid(getFilteredActions()));
  return section;
}

function renderActionTab(titleText, prefixes) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = titleText;
  const actions = getFilteredActions().filter((action) => prefixes.some((prefix) => action.id.startsWith(prefix)));
  section.append(title, renderActionGrid(actions));
  return section;
}

function renderInfoTab(titleText, text) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = titleText;
  const body = document.createElement("p");
  body.className = "controller-empty";
  body.textContent = text;
  section.append(title, body);
  return section;
}

function renderOverviewTab(player) {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = "Übersicht";
  section.append(title, renderPlayerSummary(player));
  return section;
}

function renderSettingsTab() {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section";
  const title = document.createElement("h2");
  title.textContent = "Einstellungen";
  const actions = getFilteredActions().filter((action) => action.adminOnly || action.id === "app.exit");
  section.append(title, renderActionGrid(actions));
  return section;
}

function renderEncounterPanel() {
  if (!gameState?.encounter?.active) return document.createDocumentFragment();
  const panel = document.createElement("div");
  panel.className = "selection-panel controller-encounter-panel";
  const title = document.createElement("strong");
  title.textContent = "Begegnung";
  const hint = document.createElement("p");
  const isOwner = gameState.encounter.playerId === selectedPlayerId;
  hint.textContent = isOwner ? "Du entscheidest diese Begegnung." : "Ein anderer Spieler entscheidet.";
  panel.append(title, hint);
  if (isOwner) {
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

function renderBoardTab() {
  const section = document.createElement("section");
  section.className = "player-hud-tab-content controller-section controller-board-section";
  const header = document.createElement("div");
  header.className = "controller-board-header";
  const title = document.createElement("h2");
  title.textContent = "Spielfeld";
  const mode = document.createElement("p");
  mode.textContent = gameState?.board?.mode || "Nur ansehen";
  const backButton = createButton("Zurück zum Menü", () => {
    activeTab = "turn";
    render();
  }, "controller-board-back-button");
  header.append(title, mode, backButton);

  const viewport = document.createElement("div");
  viewport.className = "controller-board-viewport";
  const content = document.createElement("div");
  content.className = "controller-board-content";
  content.innerHTML = gameState?.board?.svg || "";
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

function renderReconnectFooter() {
  const footer = document.createElement("footer");
  footer.className = "selection-panel controller-footer";
  footer.append(createButton("Neu verbinden", connect, "controller-button controller-button--secondary"));
  return footer;
}

function getFilteredActions() {
  return (gameState?.actions ?? []).filter((action) => {
    if (action.adminOnly && !isSelectedPlayerAdmin()) return false;
    if (action.requiresActivePlayer && !isSelectedPlayerActive()) return false;
    return true;
  });
}

function getSelectedPlayer() {
  return (gameState?.players ?? []).find((player) => player.id === selectedPlayerId) ?? null;
}

function getOwnLobbySlot() {
  return (gameState?.controllerLobby?.slots ?? []).find((slot) => slot.playerId === selectedPlayerId) ?? null;
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
      if (!isSelectedPlayerActive()) return;
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

function getStatusLabel() {
  if (connectionStatus === "connected") return "Verbunden";
  if (connectionStatus === "waiting") return "Warte auf Spiel";
  if (connectionStatus === "lost") return "Verbindung verloren, verbinde neu ...";
  if (connectionStatus === "replaced") return "Dieser Spieler-Slot wurde auf einem anderen Gerät verbunden.";
  if (connectionStatus === "missing-session") return "Keine Session in der URL";
  return "Verbinde ...";
}

render();
connect();
