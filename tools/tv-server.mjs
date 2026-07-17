import http from "node:http";
import { createReadStream } from "node:fs";
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
  [".avif", "image/avif"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".wav", "audio/wav"]
]);

const sessions = new Map();
const privateStaticPathPrefixes = [
  "/assets/source/",
  "/assets/incoming/",
  "/public/assets/ui/menu/raw/"
];

function getSession(sessionId) {
  const safeSessionId = String(sessionId || "").trim();
  if (!safeSessionId) return null;
  if (!sessions.has(safeSessionId)) {
    sessions.set(safeSessionId, {
      controllers: new Map(),
      controllerTokensByPlayerId: new Map(),
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

function normalizeControllerTokens(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Map();
  return new Map(Object.entries(value)
    .filter(([playerId, token]) => (
      /^player-\d+$/.test(playerId)
      && typeof token === "string"
      && token.length >= 16
    )));
}

function applyControllerAccess(session, value) {
  const nextTokens = normalizeControllerTokens(value);
  session.controllerTokensByPlayerId = nextTokens;

  for (const [controllerId, controller] of session.controllers.entries()) {
    if (nextTokens.get(controller.playerId) === controller.accessToken) continue;
    sendJson(controller.socket, { type: "accessRevoked" });
    controller.socket.close();
    session.controllers.delete(controllerId);
  }
  notifyHost(session);
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
      applyControllerAccess(session, message.controllerTokensByPlayerId);
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

    if (!session.host) {
      sendJson(socket, { type: "accessPending", message: "Game display not connected yet." });
      socket.close();
      return;
    }

    const accessToken = typeof message.accessToken === "string" ? message.accessToken : "";
    if (!accessToken || session.controllerTokensByPlayerId.get(playerId) !== accessToken) {
      sendJson(socket, { type: "accessDenied", message: "Invalid controller access." });
      socket.close();
      return;
    }

    const existingSlot = findControllerByPlayerId(session, playerId);
    if (existingSlot) {
      sendJson(socket, { type: "slotOccupied", message: "Player slot already connected." });
      socket.close();
      return;
    }

    socket.starOdysseyClientId = controllerId;
    session.controllers.set(controllerId, {
      controllerId,
      socket,
      playerId,
      accessToken
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

  if (message.type === "controllerAccess" && socket.starOdysseyRole === "host") {
    applyControllerAccess(session, message.controllerTokensByPlayerId);
    return;
  }

  if (message.type === "action" && socket.starOdysseyRole === "controller") {
    const controller = session.controllers.get(socket.starOdysseyClientId);
    if (!controller || controller.socket !== socket) {
      sendJson(socket, { type: "accessDenied", message: "Controller is not registered." });
      return;
    }
    if (!session.host) {
      sendJson(socket, { type: "error", message: "No game display connected." });
      return;
    }
    sendJson(session.host.socket, {
      type: "controllerAction",
      actionId: message.actionId,
      payload: {
        ...(message.payload || {}),
        playerId: controller.playerId
      },
      controllerId: socket.starOdysseyClientId,
      playerId: controller.playerId
    });
  }
}

const noStoreExtensions = new Set([".html", ".map"]);
const revalidateExtensions = new Set([".js", ".mjs", ".css", ".json", ".webmanifest"]);
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

function setRevalidateHeaders(response) {
  response.setHeader("Cache-Control", "no-cache, must-revalidate");
}

function setStaticCacheHeaders(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (cacheableAssetExtensions.has(extension)) {
    response.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return;
  }
  if (noStoreExtensions.has(extension)) {
    setNoCacheHeaders(response);
    return;
  }
  if (revalidateExtensions.has(extension)) {
    setRevalidateHeaders(response);
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
  const webPath = path.posix.normalize(`/${requestedPath.replaceAll("\\", "/")}`).toLowerCase();
  if (privateStaticPathPrefixes.some((prefix) => webPath === prefix.slice(0, -1) || webPath.startsWith(prefix))) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found.");
    return;
  }
  const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.resolve(rootDir, `.${normalizedPath}`);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden.");
    return;
  }

  try {
    const stats = await fs.stat(filePath);
    const mimeType = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    setStaticCacheHeaders(response, filePath);
    const etag = `W/\"${stats.size.toString(16)}-${Math.trunc(stats.mtimeMs).toString(16)}\"`;
    response.setHeader("ETag", etag);
    response.setHeader("Last-Modified", stats.mtime.toUTCString());
    if (request.headers["if-none-match"] === etag) {
      response.writeHead(304);
      response.end();
      return;
    }
    response.writeHead(200, { "Content-Type": mimeType });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    await new Promise((resolve) => {
      const stream = createReadStream(filePath);
      stream.once("error", (error) => {
        response.destroy(error);
        resolve();
      });
      response.once("close", resolve);
      stream.once("end", resolve);
      stream.pipe(response);
    });
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
  const address = server.address();
  const listeningPort = typeof address === "object" && address ? address.port : port;
  console.log(`Star Odyssey TV server listening on http://${host}:${listeningPort}/`);
});
