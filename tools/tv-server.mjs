import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { WebSocketServer } from "ws";
import { createControllerStatesByPlayerId } from "../src/remote/controllerState.js";

const port = Number.parseInt(process.env.PORT || "5173", 10);
const host = process.env.HOST || "0.0.0.0";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"]
]);

const sessions = new Map();

function getSession(sessionId) {
  const safeSessionId = String(sessionId || "").trim();
  if (!safeSessionId) return null;
  if (!sessions.has(safeSessionId)) {
    sessions.set(safeSessionId, {
      controllers: new Map(),
      host: null,
      lastStatesByPlayerId: {}
    });
  }
  return sessions.get(safeSessionId);
}

function sendJson(socket, data) {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify(data));
}

function broadcastControllerStates(session) {
  for (const controller of session.controllers.values()) {
    const state = session.lastStatesByPlayerId[controller.playerId];
    if (state) sendJson(controller.socket, { type: "state", state });
  }
}

function notifyHost(session) {
  if (!session.host) return;
  sendJson(session.host.socket, {
    type: "controllerCount",
    controllerCount: session.controllers.size,
    controllerSlots: getControllerSlots(session)
  });
}

function getControllerSlots(session) {
  return [...session.controllers.values()].map((controller) => ({
    controllerId: controller.controllerId,
    playerId: controller.playerId,
    connected: true
  }));
}

function findControllerByPlayerId(session, playerId) {
  return [...session.controllers.entries()]
    .find(([, controller]) => controller.playerId === playerId) ?? null;
}

function cleanupSocket(socket) {
  const session = socket.starOdysseySessionId ? sessions.get(socket.starOdysseySessionId) : null;
  if (!session) return;

  if (socket.starOdysseyRole === "host" && session.host?.socket === socket) {
    session.host = null;
  }

  if (socket.starOdysseyRole === "controller") {
    const controller = session.controllers.get(socket.starOdysseyClientId);
    if (controller?.socket === socket) {
      session.controllers.delete(socket.starOdysseyClientId);
    }
    notifyHost(session);
  }

  if (!session.host && session.controllers.size === 0) {
    sessions.delete(socket.starOdysseySessionId);
  }
}

function handleSocketMessage(socket, rawMessage) {
  let message;
  try {
    message = JSON.parse(rawMessage.toString());
  } catch {
    sendJson(socket, { type: "error", message: "Invalid JSON." });
    return;
  }

  if (message.type === "hello") {
    const session = getSession(message.sessionId);
    if (!session) {
      sendJson(socket, { type: "error", message: "Missing session." });
      return;
    }

    cleanupSocket(socket);
    socket.starOdysseySessionId = String(message.sessionId);
    socket.starOdysseyRole = message.role === "host" ? "host" : "controller";

    if (socket.starOdysseyRole === "host") {
      session.host = { socket };
      sendJson(socket, {
        type: "helloAck",
        role: "host",
        sessionId: socket.starOdysseySessionId,
        controllerCount: session.controllers.size,
        controllerSlots: getControllerSlots(session)
      });
      return;
    }

    const controllerId = message.controllerId || `controller-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const playerId = typeof message.playerId === "string" ? message.playerId : null;
    if (!playerId) {
      sendJson(socket, { type: "error", message: "Missing player slot." });
      return;
    }

    const existingSlot = findControllerByPlayerId(session, playerId);
    if (existingSlot && existingSlot[0] !== controllerId) {
      sendJson(existingSlot[1].socket, { type: "replaced", message: "Slot reconnected." });
      existingSlot[1].socket.close();
      session.controllers.delete(existingSlot[0]);
    }

    socket.starOdysseyClientId = controllerId;
    session.controllers.set(controllerId, {
      controllerId,
      socket,
      playerId
    });
    sendJson(socket, {
      type: "helloAck",
      role: "controller",
      sessionId: socket.starOdysseySessionId,
      controllerId,
      playerId
    });
    const controllerState = session.lastStatesByPlayerId[playerId];
    if (controllerState) sendJson(socket, { type: "state", state: controllerState });
    notifyHost(session);
    return;
  }

  const session = socket.starOdysseySessionId ? sessions.get(socket.starOdysseySessionId) : null;
  if (!session) {
    sendJson(socket, { type: "error", message: "Not connected to a session." });
    return;
  }

  if (message.type === "state" && socket.starOdysseyRole === "host") {
    session.lastStatesByPlayerId = message.statesByPlayerId && typeof message.statesByPlayerId === "object"
      ? message.statesByPlayerId
      : createControllerStatesByPlayerId(message.state || {});
    broadcastControllerStates(session);
    return;
  }

  if (message.type === "action" && socket.starOdysseyRole === "controller") {
    if (!session.host) {
      sendJson(socket, { type: "error", message: "No game display connected." });
      return;
    }
    sendJson(session.host.socket, {
      type: "controllerAction",
      actionId: message.actionId,
      payload: {
        ...(message.payload || {}),
        playerId: session.controllers.get(socket.starOdysseyClientId)?.playerId ?? null
      },
      controllerId: socket.starOdysseyClientId,
      playerId: session.controllers.get(socket.starOdysseyClientId)?.playerId ?? null
    });
  }
}

const noCacheExtensions = new Set([".html", ".js", ".css", ".json", ".map"]);
const cacheableAssetExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp3",
  ".ogg",
  ".wav"
]);

function setNoCacheHeaders(response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  response.setHeader("Surrogate-Control", "no-store");
}

function setStaticCacheHeaders(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (cacheableAssetExtensions.has(extension)) {
    response.setHeader("Cache-Control", "public, max-age=3600");
    return;
  }
  if (noCacheExtensions.has(extension)) {
    setNoCacheHeaders(response);
    return;
  }
  response.setHeader("Cache-Control", "no-cache");
}

async function serveQr(request, response) {
  const url = new URL(request.url, "http://localhost");
  const text = url.searchParams.get("text") || "";
  if (!text) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Missing text.");
    return;
  }

  const svg = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320
  });
  setNoCacheHeaders(response);
  response.writeHead(200, { "Content-Type": "image/svg+xml; charset=utf-8" });
  response.end(svg);
}

async function serveStatic(request, response) {
  const url = new URL(request.url, "http://localhost");
  const rawPathname = decodeURIComponent(url.pathname);
  const requestedPath = rawPathname === "/" ? "/index.html" : rawPathname;
  const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.resolve(rootDir, `.${normalizedPath}`);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden.");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const mimeType = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    setStaticCacheHeaders(response, filePath);
    response.writeHead(200, { "Content-Type": mimeType });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found.");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url?.startsWith("/api/qr")) {
      await serveQr(request, response);
      return;
    }
    await serveStatic(request, response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Server error.");
  }
});

const webSocketServer = new WebSocketServer({ server, path: "/ws" });
webSocketServer.on("connection", (socket) => {
  socket.on("message", (message) => handleSocketMessage(socket, message));
  socket.on("close", () => cleanupSocket(socket));
  socket.on("error", () => cleanupSocket(socket));
});

server.listen(port, host, () => {
  console.log(`Star Odyssey TV server listening on http://${host}:${port}/`);
});
