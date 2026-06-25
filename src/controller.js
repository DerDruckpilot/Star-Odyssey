const root = document.querySelector("#controller-root");
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session") || "";
const storedControllerIdKey = "star-odyssey-controller-id";
const storedPlayerIdKey = `star-odyssey-controller-player-${sessionId || "default"}`;
const reconnectDelayMs = 1400;

let socket = null;
let reconnectTimer = null;
let controllerId = loadStoredControllerId();
let selectedPlayerId = params.get("player") || loadStoredPlayerId();
let connectionStatus = "connecting";
let gameState = null;

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
    connectionStatus = "waiting";
    sendHello();
    render();
  });
  socket.addEventListener("message", (event) => {
    handleMessage(event.data);
  });
  socket.addEventListener("close", () => {
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
  shell.className = "controller-panel";

  const header = document.createElement("header");
  header.className = "controller-header";
  const title = document.createElement("h1");
  title.textContent = "Star Odyssey";
  const status = document.createElement("p");
  status.className = `controller-status controller-status--${connectionStatus}`;
  status.textContent = getStatusLabel();
  header.append(title, status);

  const meta = document.createElement("div");
  meta.className = "controller-meta";
  meta.append(createMetaItem("Session", sessionId || "fehlt"));
  meta.append(createMetaItem("Phase", gameState?.phaseLabel || "Warte auf Spiel"));
  meta.append(createMetaItem("Aktiv", gameState?.activePlayerName || "-"));

  const playerSection = document.createElement("section");
  playerSection.className = "controller-section";
  const playerTitle = document.createElement("h2");
  playerTitle.textContent = "Spieler";
  const playerGrid = document.createElement("div");
  playerGrid.className = "controller-player-grid";
  const players = gameState?.players?.length ? gameState.players : [{ id: selectedPlayerId || "player-1", name: "Spieler 1" }];
  for (const player of players) {
    const button = createButton(player.name, () => {
      saveSelectedPlayerId(player.id);
      sendHello();
      render();
    }, `controller-player-button${player.id === selectedPlayerId ? " is-active" : ""}`);
    playerGrid.append(button);
  }
  playerSection.append(playerTitle, playerGrid);

  const actionsSection = document.createElement("section");
  actionsSection.className = "controller-section";
  const actionsTitle = document.createElement("h2");
  actionsTitle.textContent = "Aktionen";
  const actionGrid = document.createElement("div");
  actionGrid.className = "controller-action-grid";
  const actions = gameState?.actions ?? [];
  if (actions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "controller-empty";
    empty.textContent = "Keine Aktionen verfügbar.";
    actionGrid.append(empty);
  } else {
    for (const action of actions) {
      actionGrid.append(createButton(action.label, () => sendAction(action)));
    }
  }
  actionsSection.append(actionsTitle, actionGrid);

  const footer = document.createElement("footer");
  footer.className = "controller-footer";
  footer.append(createButton("Neu verbinden", connect, "controller-button controller-button--secondary"));

  shell.append(header, meta, playerSection, actionsSection, footer);
  root.replaceChildren(shell);
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
  if (connectionStatus === "missing-session") return "Keine Session in der URL";
  return "Verbinde ...";
}

render();
connect();
