import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { WebSocketServer } from "ws";

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
      lastState: null
    });
  }
  return sessions.get(safeSessionId);
}

function sendJson(socket, data) {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify(data));
}

function broadcastControllers(session, data) {
  for (const controller of session.controllers.values()) {
    sendJson(controller.socket, data);
  }
}

function notifyHost(session) {
  if (!session.host) return;
  sendJson(session.host.socket, {
    type: "controllerCount",
    controllerCount: session.controllers.size
  });
}

function cleanupSocket(socket) {
  const session = socket.starOdysseySessionId ? sessions.get(socket.starOdysseySessionId) : null;
  if (!session) return;

  if (socket.starOdysseyRole === "host" && session.host?.socket === socket) {
    session.host = null;
  }

  if (socket.starOdysseyRole === "controller") {
    session.controllers.delete(socket.starOdysseyClientId);
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
        controllerCount: session.controllers.size
      });
      return;
    }

    const controllerId = message.controllerId || `controller-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    socket.starOdysseyClientId = controllerId;
    session.controllers.set(controllerId, {
      socket,
      playerId: message.playerId || null
    });
    sendJson(socket, {
      type: "helloAck",
      role: "controller",
      sessionId: socket.starOdysseySessionId,
      controllerId
    });
    if (session.lastState) {
      sendJson(socket, { type: "state", state: session.lastState });
    }
    notifyHost(session);
    return;
  }

  const session = socket.starOdysseySessionId ? sessions.get(socket.starOdysseySessionId) : null;
  if (!session) {
    sendJson(socket, { type: "error", message: "Not connected to a session." });
    return;
  }

  if (message.type === "state" && socket.starOdysseyRole === "host") {
    session.lastState = message.state || null;
    broadcastControllers(session, { type: "state", state: session.lastState });
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
      payload: message.payload || {},
      controllerId: socket.starOdysseyClientId
    });
  }
}

function setNoCacheHeaders(response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  response.setHeader("Surrogate-Control", "no-store");
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
    setNoCacheHeaders(response);
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
