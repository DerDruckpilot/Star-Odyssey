import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionId = "RELAY-RESTORE-CHECK";
const controllerTokensByPlayerId = {
  "player-1": "player-1-test-token-0123456789abcdef",
  "player-2": "player-2-test-token-0123456789abcdef"
};

function waitForMessage(socket, predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("message", handleMessage);
      reject(new Error("Timed out waiting for WebSocket message."));
    }, timeoutMs);
    const handleMessage = (rawMessage) => {
      let message;
      try {
        message = JSON.parse(rawMessage.toString());
      } catch {
        return;
      }
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.off("message", handleMessage);
      resolve(message);
    };
    socket.on("message", handleMessage);
  });
}

async function startServer(port = 0) {
  const child = spawn(process.execPath, ["tools/tv-server.mjs"], {
    cwd: rootDir,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const listeningPort = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`TV server did not start. ${stderr}`)), 5000);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`TV server exited with ${code}. ${stderr}`));
    });
    child.stdout.on("data", (chunk) => {
      const match = chunk.toString().match(/127\.0\.0\.1:(\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(Number(match[1]));
    });
  });

  return { child, port: listeningPort };
}

async function stopServer(server) {
  if (!server?.child || server.child.exitCode !== null) return;
  const exited = once(server.child, "exit");
  server.child.kill();
  await exited;
}

async function openSocket(port) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  await once(socket, "open");
  return socket;
}

async function closeSocket(socket) {
  if (!socket || socket.readyState === WebSocket.CLOSED) return;
  const closed = once(socket, "close");
  socket.close();
  await closed;
}

async function connectHost(port) {
  const socket = await openSocket(port);
  const acknowledged = waitForMessage(socket, (message) => message.type === "helloAck" && message.role === "host");
  socket.send(JSON.stringify({
    type: "hello",
    role: "host",
    sessionId,
    controllerTokensByPlayerId
  }));
  await acknowledged;
  return socket;
}

async function connectController(port, {
  playerId = "player-1",
  controllerId = `controller-${Date.now()}`,
  accessToken = controllerTokensByPlayerId[playerId]
} = {}) {
  const socket = await openSocket(port);
  const response = waitForMessage(socket, (message) => [
    "helloAck",
    "accessDenied",
    "accessPending",
    "slotOccupied"
  ].includes(message.type));
  socket.send(JSON.stringify({
    type: "hello",
    role: "controller",
    sessionId,
    controllerId,
    playerId,
    accessToken
  }));
  return { socket, response: await response };
}

let server = null;
let sockets = [];

try {
  server = await startServer();
  const firstPort = server.port;
  const baseUrl = `http://127.0.0.1:${firstPort}`;
  const processedAssetResponse = await fetch(`${baseUrl}/public/assets/ui/menu/processed/icons/icon_new_game.png`);
  assert.equal(processedAssetResponse.status, 200);
  assert.match(processedAssetResponse.headers.get("cache-control") ?? "", /stale-while-revalidate=86400/);
  const processedAssetEtag = processedAssetResponse.headers.get("etag");
  assert.ok(processedAssetEtag);
  const validatedAssetResponse = await fetch(`${baseUrl}/public/assets/ui/menu/processed/icons/icon_new_game.png`, {
    headers: { "If-None-Match": processedAssetEtag }
  });
  assert.equal(validatedAssetResponse.status, 304);
  const appShellResponse = await fetch(`${baseUrl}/index.html`);
  assert.match(appShellResponse.headers.get("cache-control") ?? "", /no-store/);
  const moduleResponse = await fetch(`${baseUrl}/src/main.js`);
  assert.equal(moduleResponse.headers.get("cache-control"), "no-cache, must-revalidate");
  const manifestResponse = await fetch(`${baseUrl}/controller.webmanifest`);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/manifest\+json/);
  const sourceAssetResponse = await fetch(`${baseUrl}/assets/source/ui/menu/raw/start-menu-ref-01.jpg`);
  assert.equal(sourceAssetResponse.status, 404);
  const legacyRawAssetResponse = await fetch(`${baseUrl}/public/assets/ui/menu/raw/start-menu-ref-01.jpg`);
  assert.equal(legacyRawAssetResponse.status, 404);

  const host = await connectHost(firstPort);
  sockets.push(host);

  const invalidController = await connectController(firstPort, { accessToken: "invalid-controller-token" });
  sockets.push(invalidController.socket);
  assert.equal(invalidController.response.type, "accessDenied");

  const firstController = await connectController(firstPort, { controllerId: "controller-primary" });
  sockets.push(firstController.socket);
  assert.equal(firstController.response.playerId, "player-1");

  const duplicateController = await connectController(firstPort, { controllerId: "controller-duplicate" });
  sockets.push(duplicateController.socket);
  assert.equal(duplicateController.response.type, "slotOccupied");

  let forwardedActions = 0;
  host.on("message", (rawMessage) => {
    const message = JSON.parse(rawMessage.toString());
    if (message.type === "controllerAction" && message.actionId === "submitEncounterBattleRoll") {
      forwardedActions += 1;
    }
  });
  const firstForward = waitForMessage(host, (message) => (
    message.type === "controllerAction" && message.actionId === "submitEncounterBattleRoll"
  ));
  firstController.socket.send(JSON.stringify({
    type: "action",
    actionId: "submitEncounterBattleRoll",
    payload: { playerId: "player-2" }
  }));
  const forwarded = await firstForward;
  assert.equal(forwarded.playerId, "player-1");
  assert.equal(forwarded.payload.playerId, "player-1");
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(forwardedActions, 1);

  const disconnected = waitForMessage(host, (message) => (
    message.type === "controllerCount" && message.controllerCount === 0
  ));
  await closeSocket(firstController.socket);
  await disconnected;
  const reconnectedController = await connectController(firstPort, { controllerId: "controller-reconnected" });
  sockets.push(reconnectedController.socket);
  assert.equal(reconnectedController.response.type, "helloAck");

  await Promise.all(sockets.map((socket) => closeSocket(socket)));
  sockets = [];
  await stopServer(server);
  server = await startServer(firstPort);

  const restoredHost = await connectHost(server.port);
  sockets.push(restoredHost);
  const restoredController = await connectController(server.port, { controllerId: "controller-after-restart" });
  sockets.push(restoredController.socket);
  assert.equal(restoredController.response.type, "helloAck");

  const pendingState = {
    view: "board",
    activeEncounter: {
      cardId: "spreadsheet-16",
      pendingStep: "dualMothershipRoll",
      activePlayerId: "player-1"
    }
  };
  const restoredState = waitForMessage(restoredController.socket, (message) => message.type === "state");
  restoredHost.send(JSON.stringify({
    type: "state",
    statesByPlayerId: { "player-1": pendingState }
  }));
  assert.deepEqual((await restoredState).state, pendingState);

  let restoredActionCount = 0;
  restoredHost.on("message", (rawMessage) => {
    const message = JSON.parse(rawMessage.toString());
    if (message.type === "controllerAction" && message.actionId === "submitEncounterBattleRoll") {
      restoredActionCount += 1;
    }
  });
  const restoredForward = waitForMessage(restoredHost, (message) => (
    message.type === "controllerAction" && message.actionId === "submitEncounterBattleRoll"
  ));
  restoredController.socket.send(JSON.stringify({
    type: "action",
    actionId: "submitEncounterBattleRoll",
    payload: {}
  }));
  await restoredForward;
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(restoredActionCount, 1);

  console.log("TV relay access and restart checks passed.");
} finally {
  await Promise.all(sockets.map((socket) => closeSocket(socket).catch(() => {})));
  await stopServer(server);
}
