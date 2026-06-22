import { upgradeMenuAssetPaths } from "./data/upgradeVisuals.js";
import {
  toMothershipSpeedAnimationConfig,
  toMothershipSpeedDebugConfig
} from "./data/mothershipSpeedAnimationConfig.js";

const storageKey = "star-odyssey-mothership-speed-debug";
const canvas = document.querySelector("#mothership-speed-canvas");
const context = canvas.getContext("2d");
const exportOutput = document.querySelector("#export-output");
const tabButtons = [...document.querySelectorAll(".debug-tab")];
const panelTabs = [...document.querySelectorAll(".panel-tab")];

const inputs = {
  playbackMode: document.querySelector("#playback-mode"),
  zoom: document.querySelector("#preview-zoom"),
  slotZoom: document.querySelector("#slot-preview-zoom"),
  pivotX: document.querySelector("#pivot-x"),
  pivotY: document.querySelector("#pivot-y"),
  leverX: document.querySelector("#lever-x"),
  leverY: document.querySelector("#lever-y"),
  speed: document.querySelector("#shake-speed"),
  amplitude: document.querySelector("#shake-amplitude"),
  rotation: document.querySelector("#shake-rotation"),
  secondary: document.querySelector("#shake-secondary"),
  combination: document.querySelector("#ball-combination"),
  ballSize: document.querySelector("#ball-size"),
  fallDuration: document.querySelector("#fall-duration"),
  ball1StartX: document.querySelector("#ball1-start-x"),
  ball1StartY: document.querySelector("#ball1-start-y"),
  ball1EndX: document.querySelector("#ball1-end-x"),
  ball1EndY: document.querySelector("#ball1-end-y"),
  ball2StartX: document.querySelector("#ball2-start-x"),
  ball2StartY: document.querySelector("#ball2-start-y"),
  ball2EndX: document.querySelector("#ball2-end-x"),
  ball2EndY: document.querySelector("#ball2-end-y"),
  maskX: document.querySelector("#mask-x"),
  maskY: document.querySelector("#mask-y"),
  maskWidth: document.querySelector("#mask-width"),
  maskHeight: document.querySelector("#mask-height"),
  maskRadius: document.querySelector("#mask-radius"),
  maskRadiusRange: document.querySelector("#mask-radius-range")
};

const outputs = {
  slotZoom: document.querySelector("#slot-preview-zoom-value")
};

const defaultConfig = toMothershipSpeedDebugConfig();

const ballColors = {
  yellow: { fill: "#fde047", light: "#fef08a", dark: "#ca8a04" },
  blue: { fill: "#38bdf8", light: "#7dd3fc", dark: "#0369a1" },
  red: { fill: "#ef4444", light: "#fca5a5", dark: "#991b1b" },
  black: { fill: "#111827", light: "#4b5563", dark: "#020617" }
};

const imageCache = new Map();
let config = loadConfig();
let previewState = {
  shakeZoom: 1,
  slotZoom: 1
};
let activeTab = "shake";
let isPlaying = true;
let selectedHandle = null;
let dragState = null;
let animationStart = performance.now();
let lastFrame = 0;

function loadConfig() {
  try {
    return normalizeConfig(JSON.parse(localStorage.getItem(storageKey) ?? "null"));
  } catch {
    return normalizeConfig(null);
  }
}

function normalizeConfig(value) {
  const base = structuredClone(defaultConfig);
  if (!value || typeof value !== "object") return base;
  return {
    version: 1,
    shake: {
      pivot: normalizePoint(value.shake?.pivot, base.shake.pivot),
      lever: normalizePoint(value.shake?.lever, base.shake.lever),
      speed: finiteNumber(value.shake?.speed, base.shake.speed),
      amplitude: finiteNumber(value.shake?.amplitude, base.shake.amplitude),
      rotation: finiteNumber(value.shake?.rotation, base.shake.rotation),
      secondaryVibration: finiteNumber(value.shake?.secondaryVibration, base.shake.secondaryVibration)
    },
    balls: {
      size: finiteNumber(value.balls?.size, base.balls.size),
      fallDurationMs: finiteNumber(value.balls?.fallDurationMs, base.balls.fallDurationMs),
      combination: normalizeCombination(value.balls?.combination ?? base.balls.combination),
      slots: [0, 1].map((index) => ({
        id: `ball-${index + 1}`,
        start: normalizePoint(value.balls?.slots?.[index]?.start, base.balls.slots[index].start),
        end: normalizePoint(value.balls?.slots?.[index]?.end, base.balls.slots[index].end)
      })),
      mask: normalizeRect(value.balls?.mask, base.balls.mask)
    }
  };
}

function normalizePoint(value, fallback) {
  return {
    x: finiteNumber(value?.x, fallback.x),
    y: finiteNumber(value?.y, fallback.y)
  };
}

function normalizeRect(value, fallback) {
  return {
    x: finiteNumber(value?.x, fallback.x),
    y: finiteNumber(value?.y, fallback.y),
    width: Math.max(1, finiteNumber(value?.width, fallback.width)),
    height: Math.max(1, finiteNumber(value?.height, fallback.height)),
    cornerRadius: Math.max(0, finiteNumber(value?.cornerRadius, fallback.cornerRadius ?? 0))
  };
}

function normalizeCombination(value) {
  const colors = Array.isArray(value) ? value : String(value).split(",");
  const normalized = colors.filter((color) => Object.hasOwn(ballColors, color)).slice(0, 2);
  return normalized.length === 2 ? normalized : ["blue", "yellow"];
}

function finiteNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function saveConfig() {
  localStorage.setItem(storageKey, JSON.stringify(config));
}

function getExportData() {
  return {
    MOTHERSHIP_SPEED_ANIMATION_CONFIG: toMothershipSpeedAnimationConfig(config)
  };
}

function updateExport() {
  exportOutput.value = `export const MOTHERSHIP_SPEED_ANIMATION_CONFIG = ${JSON.stringify(toMothershipSpeedAnimationConfig(config), null, 2)};\n`;
}

function syncInputs() {
  inputs.playbackMode.value = isPlaying ? "play" : "pause";
  inputs.zoom.value = String(previewState.shakeZoom);
  inputs.slotZoom.value = String(previewState.slotZoom);
  inputs.pivotX.value = config.shake.pivot.x;
  inputs.pivotY.value = config.shake.pivot.y;
  inputs.leverX.value = config.shake.lever.x;
  inputs.leverY.value = config.shake.lever.y;
  inputs.speed.value = config.shake.speed;
  inputs.amplitude.value = config.shake.amplitude;
  inputs.rotation.value = config.shake.rotation;
  inputs.secondary.value = config.shake.secondaryVibration;
  inputs.combination.value = config.balls.combination.join(",");
  inputs.ballSize.value = config.balls.size;
  inputs.fallDuration.value = config.balls.fallDurationMs;
  inputs.ball1StartX.value = config.balls.slots[0].start.x;
  inputs.ball1StartY.value = config.balls.slots[0].start.y;
  inputs.ball1EndX.value = config.balls.slots[0].end.x;
  inputs.ball1EndY.value = config.balls.slots[0].end.y;
  inputs.ball2StartX.value = config.balls.slots[1].start.x;
  inputs.ball2StartY.value = config.balls.slots[1].start.y;
  inputs.ball2EndX.value = config.balls.slots[1].end.x;
  inputs.ball2EndY.value = config.balls.slots[1].end.y;
  inputs.maskX.value = config.balls.mask.x;
  inputs.maskY.value = config.balls.mask.y;
  inputs.maskWidth.value = config.balls.mask.width;
  inputs.maskHeight.value = config.balls.mask.height;
  inputs.maskRadius.value = config.balls.mask.cornerRadius;
  inputs.maskRadiusRange.value = config.balls.mask.cornerRadius;
  updateZoomLabels();
  updateExport();
}

function getZoom() {
  return activeTab === "slot" ? previewState.slotZoom : previewState.shakeZoom;
}

function updateZoomLabels() {
  outputs.slotZoom.textContent = `${previewState.slotZoom.toFixed(2)}x`;
}

function getShipRect() {
  const size = Math.min(canvas.width * 0.54, canvas.height * 0.86) * getZoom();
  return {
    x: canvas.width / 2 - size / 2,
    y: canvas.height / 2 - size / 2 + 10,
    width: size,
    height: size
  };
}

function localToCanvas(point, rect = getShipRect()) {
  return {
    x: rect.x + (point.x / 100) * rect.width,
    y: rect.y + (point.y / 100) * rect.height
  };
}

function canvasToLocal(point, rect = getShipRect()) {
  return {
    x: ((point.x - rect.x) / rect.width) * 100,
    y: ((point.y - rect.y) / rect.height) * 100
  };
}

function getImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const image = new Image();
  image.src = src;
  image.onload = () => render();
  imageCache.set(src, image);
  return image;
}

function drawMothership(rect) {
  const base = getImage(upgradeMenuAssetPaths.mothership);
  if (base.complete) {
    context.drawImage(base, rect.x, rect.y, rect.width, rect.height);
  }
}

function drawBackground() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createRadialGradient(canvas.width / 2, canvas.height * 0.42, 20, canvas.width / 2, canvas.height / 2, canvas.width * 0.72);
  gradient.addColorStop(0, "#13213c");
  gradient.addColorStop(1, "#020817");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function render(timestamp = performance.now()) {
  lastFrame = timestamp;
  drawBackground();
  const rect = getShipRect();

  if (activeTab === "shake") {
    drawShakePreview(rect, timestamp);
  } else {
    drawSlotPreview(rect, timestamp);
  }
}

function drawShakePreview(rect, timestamp) {
  const progress = isPlaying ? ((timestamp - animationStart) * 0.001 * config.shake.speed) % 1 : 0;
  const pose = getShakePose(progress);
  const pivot = localToCanvas(config.shake.pivot, rect);

  context.save();
  context.translate(pivot.x, pivot.y);
  context.rotate((pose.rotation * Math.PI) / 180);
  context.translate(-pivot.x + pose.x, -pivot.y + pose.y);
  drawMothership(rect);
  context.restore();

  drawLeverGuides(rect);
}

function getShakePose(progress) {
  const falloff = Math.sin(progress * Math.PI);
  const phase = progress * Math.PI * 5.2;
  const secondaryPhase = progress * Math.PI * 18;
  const arc = Math.sin(phase);
  const lift = Math.cos(phase);
  const leverAxis = getLeverAxis();
  const tangent = { x: -leverAxis.y, y: leverAxis.x };
  const primary = arc * config.shake.amplitude;
  const secondary = -lift * config.shake.amplitude * 0.62;
  return {
    x: (
      tangent.x * primary
      + leverAxis.x * secondary
      + Math.sin(secondaryPhase) * config.shake.secondaryVibration
    ) * falloff,
    y: (
      tangent.y * primary
      + leverAxis.y * secondary
      + Math.cos(secondaryPhase) * config.shake.secondaryVibration * 0.55
    ) * falloff,
    rotation: (arc * config.shake.rotation + Math.sin(secondaryPhase + 0.7) * config.shake.secondaryVibration * 0.18) * falloff
  };
}

function getLeverAxis() {
  const dx = config.shake.lever.x - config.shake.pivot.x;
  const dy = config.shake.lever.y - config.shake.pivot.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: dx / length,
    y: dy / length
  };
}

function drawLeverGuides(rect) {
  const pivot = localToCanvas(config.shake.pivot, rect);
  const lever = localToCanvas(config.shake.lever, rect);
  context.save();
  context.strokeStyle = "rgba(96, 165, 250, 0.92)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(pivot.x, pivot.y);
  context.lineTo(lever.x, lever.y);
  context.stroke();

  drawHandle(pivot, "pivot", "#facc15");
  drawHandle(lever, "lever", "#38bdf8");

  context.setLineDash([8, 8]);
  context.strokeStyle = "rgba(96, 165, 250, 0.42)";
  context.beginPath();
  context.arc(pivot.x, pivot.y, Math.hypot(lever.x - pivot.x, lever.y - pivot.y), -1.32, -0.24);
  context.stroke();
  context.restore();
}

function drawSlotPreview(rect, timestamp) {
  drawMothership(rect);
  drawMaskAndBalls(rect, timestamp);
  drawSlotHandles(rect);
}

function drawMaskAndBalls(rect, timestamp) {
  const mask = getMaskCanvasRect(rect);
  const cycle = isPlaying ? ((timestamp - animationStart) % config.balls.fallDurationMs) / config.balls.fallDurationMs : 1;
  const progress = easeOutCubic(cycle);

  context.save();
  addRoundedRectPath(context, mask.x, mask.y, mask.width, mask.height, mask.radius);
  context.clip();
  config.balls.slots.forEach((slot, index) => {
    const point = {
      x: lerp(slot.start.x, slot.end.x, progress),
      y: lerp(slot.start.y, slot.end.y, progress)
    };
    drawBall(localToCanvas(point, rect), config.balls.combination[index], rect.width * (config.balls.size / 100));
  });
  context.restore();

  context.save();
  context.fillStyle = "rgba(2, 8, 23, 0.26)";
  addRoundedRectPath(context, mask.x, mask.y, mask.width, mask.height, mask.radius);
  context.fill();
  context.strokeStyle = "rgba(250, 204, 21, 0.95)";
  context.lineWidth = 2;
  context.setLineDash([6, 4]);
  addRoundedRectPath(context, mask.x, mask.y, mask.width, mask.height, mask.radius);
  context.stroke();
  context.restore();
}

function getMaskCanvasRect(rect = getShipRect()) {
  const mask = config.balls.mask;
  const topLeft = localToCanvas({ x: mask.x, y: mask.y }, rect);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: rect.width * (mask.width / 100),
    height: rect.height * (mask.height / 100),
    radius: Math.min(
      rect.width * ((mask.cornerRadius ?? 0) / 100),
      (rect.width * (mask.width / 100)) / 2,
      (rect.height * (mask.height / 100)) / 2
    )
  };
}

function addRoundedRectPath(target, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  target.beginPath();
  target.moveTo(x + safeRadius, y);
  target.lineTo(x + width - safeRadius, y);
  target.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  target.lineTo(x + width, y + height - safeRadius);
  target.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  target.lineTo(x + safeRadius, y + height);
  target.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  target.lineTo(x, y + safeRadius);
  target.quadraticCurveTo(x, y, x + safeRadius, y);
  target.closePath();
}

function drawSlotHandles(rect) {
  config.balls.slots.forEach((slot, index) => {
    drawHandle(localToCanvas(slot.start, rect), `ball${index + 1}-start`, "#94a3b8");
    drawHandle(localToCanvas(slot.end, rect), `ball${index + 1}-end`, index === 0 ? "#ef4444" : "#fde047");
  });
  const mask = getMaskCanvasRect(rect);
  drawHandle({ x: mask.x + mask.width / 2, y: mask.y + mask.height / 2 }, "mask", "#22d3ee");
}

function drawBall(point, colorName, radius) {
  const color = ballColors[colorName] ?? ballColors.yellow;
  const gradient = context.createRadialGradient(point.x - radius * 0.35, point.y - radius * 0.38, radius * 0.1, point.x, point.y, radius);
  gradient.addColorStop(0, color.light);
  gradient.addColorStop(0.56, color.fill);
  gradient.addColorStop(1, color.dark);
  context.save();
  context.fillStyle = gradient;
  context.shadowColor = color.fill;
  context.shadowBlur = radius * 0.75;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.35)";
  context.lineWidth = Math.max(1, radius * 0.08);
  context.stroke();
  context.restore();
}

function drawHandle(point, id, color) {
  context.save();
  context.fillStyle = color;
  context.strokeStyle = selectedHandle === id ? "#ffffff" : "rgba(2, 8, 23, 0.78)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(point.x, point.y, selectedHandle === id ? 8 : 6, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#020817";
  context.font = "700 11px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(id.includes("start") ? "S" : id.includes("end") ? "E" : "", point.x, point.y);
  context.restore();
}

function easeOutCubic(value) {
  const progress = clamp01(value);
  return 1 - ((1 - progress) ** 3);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function getPointerCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function getHandlePositions() {
  const rect = getShipRect();
  if (activeTab === "shake") {
    return [
      { id: "pivot", point: localToCanvas(config.shake.pivot, rect) },
      { id: "lever", point: localToCanvas(config.shake.lever, rect) }
    ];
  }
  const mask = getMaskCanvasRect(rect);
  return [
    { id: "ball1-start", point: localToCanvas(config.balls.slots[0].start, rect) },
    { id: "ball1-end", point: localToCanvas(config.balls.slots[0].end, rect) },
    { id: "ball2-start", point: localToCanvas(config.balls.slots[1].start, rect) },
    { id: "ball2-end", point: localToCanvas(config.balls.slots[1].end, rect) },
    { id: "mask", point: { x: mask.x + mask.width / 2, y: mask.y + mask.height / 2 } }
  ];
}

function findNearestHandle(point) {
  return getHandlePositions()
    .map((handle) => ({
      ...handle,
      distance: Math.hypot(handle.point.x - point.x, handle.point.y - point.y)
    }))
    .filter((handle) => handle.distance < 28)
    .sort((left, right) => left.distance - right.distance)[0]?.id ?? null;
}

function moveHandle(handleId, point) {
  const rect = getShipRect();
  const local = canvasToLocal(point, rect);
  if (handleId === "pivot") {
    config.shake.pivot = local;
  } else if (handleId === "lever") {
    config.shake.lever = local;
  } else if (handleId.startsWith("ball")) {
    const index = handleId.startsWith("ball1") ? 0 : 1;
    const key = handleId.endsWith("start") ? "start" : "end";
    config.balls.slots[index][key] = local;
  } else if (handleId === "mask") {
    config.balls.mask.x = local.x - config.balls.mask.width / 2;
    config.balls.mask.y = local.y - config.balls.mask.height / 2;
  }
  saveConfig();
  syncInputs();
}

function onPointerDown(event) {
  const point = getPointerCanvasPoint(event);
  const handleId = findNearestHandle(point);
  if (!handleId) return;
  selectedHandle = handleId;
  dragState = { pointerId: event.pointerId, handleId };
  canvas.setPointerCapture(event.pointerId);
  moveHandle(handleId, point);
}

function onPointerMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  moveHandle(dragState.handleId, getPointerCanvasPoint(event));
}

function onPointerEnd(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  canvas.releasePointerCapture(event.pointerId);
  dragState = null;
}

function updateFromInputs() {
  isPlaying = inputs.playbackMode.value === "play";
  previewState.shakeZoom = finiteNumber(inputs.zoom.value, previewState.shakeZoom);
  previewState.slotZoom = finiteNumber(inputs.slotZoom.value, previewState.slotZoom);
  config.shake.pivot.x = finiteNumber(inputs.pivotX.value, config.shake.pivot.x);
  config.shake.pivot.y = finiteNumber(inputs.pivotY.value, config.shake.pivot.y);
  config.shake.lever.x = finiteNumber(inputs.leverX.value, config.shake.lever.x);
  config.shake.lever.y = finiteNumber(inputs.leverY.value, config.shake.lever.y);
  config.shake.speed = finiteNumber(inputs.speed.value, config.shake.speed);
  config.shake.amplitude = finiteNumber(inputs.amplitude.value, config.shake.amplitude);
  config.shake.rotation = finiteNumber(inputs.rotation.value, config.shake.rotation);
  config.shake.secondaryVibration = finiteNumber(inputs.secondary.value, config.shake.secondaryVibration);
  config.balls.combination = normalizeCombination(inputs.combination.value);
  config.balls.size = finiteNumber(inputs.ballSize.value, config.balls.size);
  config.balls.fallDurationMs = finiteNumber(inputs.fallDuration.value, config.balls.fallDurationMs);
  config.balls.slots[0].start.x = finiteNumber(inputs.ball1StartX.value, config.balls.slots[0].start.x);
  config.balls.slots[0].start.y = finiteNumber(inputs.ball1StartY.value, config.balls.slots[0].start.y);
  config.balls.slots[0].end.x = finiteNumber(inputs.ball1EndX.value, config.balls.slots[0].end.x);
  config.balls.slots[0].end.y = finiteNumber(inputs.ball1EndY.value, config.balls.slots[0].end.y);
  config.balls.slots[1].start.x = finiteNumber(inputs.ball2StartX.value, config.balls.slots[1].start.x);
  config.balls.slots[1].start.y = finiteNumber(inputs.ball2StartY.value, config.balls.slots[1].start.y);
  config.balls.slots[1].end.x = finiteNumber(inputs.ball2EndX.value, config.balls.slots[1].end.x);
  config.balls.slots[1].end.y = finiteNumber(inputs.ball2EndY.value, config.balls.slots[1].end.y);
  const maskRadiusValue = document.activeElement === inputs.maskRadiusRange
    ? inputs.maskRadiusRange.value
    : inputs.maskRadius.value;
  config.balls.mask = normalizeRect({
    x: inputs.maskX.value,
    y: inputs.maskY.value,
    width: inputs.maskWidth.value,
    height: inputs.maskHeight.value,
    cornerRadius: maskRadiusValue
  }, config.balls.mask);
  inputs.maskRadius.value = config.balls.mask.cornerRadius;
  inputs.maskRadiusRange.value = config.balls.mask.cornerRadius;
  saveConfig();
  updateZoomLabels();
  updateExport();
  render();
}

function setActiveTab(tabId) {
  activeTab = tabId;
  selectedHandle = null;
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === tabId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  panelTabs.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabId);
  });
  render();
}

function resetShake() {
  config.shake = structuredClone(defaultConfig.shake);
  saveConfig();
  syncInputs();
}

function resetSlot() {
  config.balls = structuredClone(defaultConfig.balls);
  saveConfig();
  syncInputs();
}

function resetAll() {
  config = structuredClone(defaultConfig);
  saveConfig();
  syncInputs();
}

function copyExport() {
  navigator.clipboard?.writeText(exportOutput.value);
}

function downloadExport() {
  const blob = new Blob([JSON.stringify(getExportData(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mothership-speed-animation-config.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  tabButtons.forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tab)));
  Object.values(inputs).forEach((input) => input.addEventListener("input", updateFromInputs));
  document.querySelector("#reset-shake").addEventListener("click", resetShake);
  document.querySelector("#reset-slot").addEventListener("click", resetSlot);
  document.querySelector("#reset-all").addEventListener("click", resetAll);
  document.querySelector("#export-config").addEventListener("click", updateExport);
  document.querySelector("#copy-config").addEventListener("click", copyExport);
  document.querySelector("#download-config").addEventListener("click", downloadExport);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerEnd);
  canvas.addEventListener("pointercancel", onPointerEnd);
}

function animationLoop(timestamp) {
  if (isPlaying || timestamp - lastFrame > 200) {
    render(timestamp);
  }
  requestAnimationFrame(animationLoop);
}

bindEvents();
syncInputs();
requestAnimationFrame(animationLoop);
