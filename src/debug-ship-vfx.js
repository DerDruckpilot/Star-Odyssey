import { playerPieceColors, playerShipAssetPaths } from "./data/playerPieceVisuals.js";

const storageKey = "star-odyssey-ship-vfx-anchors";
const canvas = document.querySelector("#ship-vfx-canvas");
const context = canvas.getContext("2d");
const shipSelect = document.querySelector("#ship-select");
const backgroundModeSelect = document.querySelector("#background-mode");
const zoomControl = document.querySelector("#zoom-control");
const editModeSelect = document.querySelector("#edit-mode");
const motionModeSelect = document.querySelector("#motion-mode");
const coilPreviewModeSelect = document.querySelector("#coil-preview-mode");
const selectedAnchorTitle = document.querySelector("#selected-anchor-title");
const anchorInputs = {
  x: document.querySelector("#anchor-x"),
  y: document.querySelector("#anchor-y"),
  direction: document.querySelector("#anchor-direction")
};
const engineInputs = {
  sizeRange: document.querySelector("#engine-size-range"),
  sizeValue: document.querySelector("#engine-size-value"),
  lengthRange: document.querySelector("#engine-length-range"),
  lengthValue: document.querySelector("#engine-length-value"),
  color: document.querySelector("#engine-color")
};
const exportOutput = document.querySelector("#export-output");

const glowColors = {
  red: "#f87171",
  blue: "#38bdf8",
  yellow: "#facc15",
  green: "#4ade80"
};
const shipOptions = playerPieceColors.flatMap((color) =>
  playerShipAssetPaths[color].map((assetPath, index) => ({
    id: `${color}-ship-${index + 1}`,
    color,
    variant: index + 1,
    assetPath
  }))
);

const imageCache = new Map();
let layout = loadLayout();
let selectedShipId = shipOptions[0].id;
let selectedAnchor = { type: "coil", index: 0 };
let dragging = false;
let animationFrameId = null;
let lastFrameTime = 0;

function loadLayout() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return normalizeLayout(parsed);
  } catch {
    return normalizeLayout(null);
  }
}

function normalizeLayout(value) {
  const anchors = {};
  for (const option of shipOptions) {
    anchors[option.id] = normalizeShipAnchors(value?.[option.id], option);
  }
  return anchors;
}

function normalizeShipAnchors(value, option) {
  const defaultAnchors = createDefaultShipAnchors(option.variant, option.color);
  return {
    color: option.color,
    variant: option.variant,
    asset: option.assetPath,
    coils: defaultAnchors.coils.map((coil, index) => ({
      ...coil,
      ...(value?.coils?.[index] ?? {}),
      id: `coil-${index + 1}`
    })),
    engines: Array.isArray(value?.engines) && value.engines.length > 0
      ? value.engines.map((engine, index) => normalizeEngine(engine, index, option.color))
      : defaultAnchors.engines
  };
}

function createDefaultShipAnchors(variant, color) {
  const coilDefaults = {
    1: [{ x: 555, y: 505 }],
    2: [{ x: 505, y: 500 }, { x: 680, y: 500 }],
    3: [{ x: 465, y: 500 }, { x: 600, y: 500 }, { x: 735, y: 500 }]
  };
  return {
    coils: coilDefaults[variant].map((point, index) => ({ id: `coil-${index + 1}`, ...point })),
    engines: [normalizeEngine({ x: 112, y: 510, direction: 180 }, 0, color)]
  };
}

function normalizeEngine(engine, index, color = getSelectedOption().color) {
  return {
    id: `engine-${index + 1}`,
    x: Number(engine.x ?? 112),
    y: Number(engine.y ?? 510),
    direction: Number(engine.direction ?? 180),
    size: Number(engine.size ?? 9),
    length: Number(engine.length ?? 58),
    color: normalizeHexColor(engine.color, glowColors[color] ?? glowColors.red)
  };
}

function populateShipSelect() {
  shipSelect.replaceChildren();
  for (const option of shipOptions) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = `${option.color} - Schiff ${option.variant}`;
    shipSelect.append(element);
  }
  shipSelect.value = selectedShipId;
}

function getSelectedOption() {
  return shipOptions.find((option) => option.id === selectedShipId) ?? shipOptions[0];
}

function getSelectedAnchors() {
  return layout[selectedShipId];
}

function getSelectedAnchorList() {
  return selectedAnchor.type === "engine"
    ? getSelectedAnchors().engines
    : getSelectedAnchors().coils;
}

function getSelectedAnchor() {
  return getSelectedAnchorList()[selectedAnchor.index] ?? null;
}

function setSelectedAnchor(type, index) {
  selectedAnchor = { type, index };
  editModeSelect.value = type;
  syncAnchorInputs();
}

function getShipImage(option = getSelectedOption()) {
  if (!imageCache.has(option.id)) {
    const image = new Image();
    image.src = option.assetPath;
    imageCache.set(option.id, image);
    image.addEventListener("load", render);
    image.addEventListener("error", render);
  }
  return imageCache.get(option.id);
}

function getCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, ratio };
}

function getImageTransform(image) {
  const { width, height } = getCanvasSize();
  const zoom = Number(zoomControl.value);
  return {
    scale: zoom,
    x: width / 2 - (image.naturalWidth * zoom) / 2,
    y: height / 2 - (image.naturalHeight * zoom) / 2
  };
}

function render(time = performance.now()) {
  lastFrameTime = time;
  const option = getSelectedOption();
  const image = getShipImage(option);
  const { width, height } = getCanvasSize();
  context.clearRect(0, 0, width, height);
  drawBackground(width, height);

  if (!image.complete || image.naturalWidth === 0) {
    drawLoading(width, height);
    requestRenderLoop();
    return;
  }

  const transform = getImageTransform(image);
  context.drawImage(
    image,
    transform.x,
    transform.y,
    image.naturalWidth * transform.scale,
    image.naturalHeight * transform.scale
  );
  drawCoilPreview(transform, option);
  drawEnginePreview(transform, option);
  drawAnchorHandles(transform);
  requestRenderLoop();
}

function drawBackground(width, height) {
  if (backgroundModeSelect.value === "light") {
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, width, height);
    return;
  }
  if (backgroundModeSelect.value === "checker") {
    const size = 24 * (window.devicePixelRatio || 1);
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        context.fillStyle = ((x / size + y / size) % 2 === 0) ? "#dbeafe" : "#64748b";
        context.fillRect(x, y, size, size);
      }
    }
    return;
  }
  context.fillStyle = "#020817";
  context.fillRect(0, 0, width, height);
}

function drawLoading(width, height) {
  context.fillStyle = "#e2e8f0";
  context.font = "18px system-ui";
  context.textAlign = "center";
  context.fillText("Schiff-Asset wird geladen ...", width / 2, height / 2);
}

function drawCoilPreview(transform, option) {
  const active = coilPreviewModeSelect.value === "active";
  const color = glowColors[option.color] ?? glowColors.red;
  const pulse = active ? 0.5 + Math.sin(lastFrameTime / 210) * 0.5 : 0;
  for (const coil of getSelectedAnchors().coils) {
    const point = assetToCanvasPoint(coil, transform);
    const radius = (active ? 18 + pulse * 8 : 10) * transform.scale;
    const alpha = active ? 0.48 + pulse * 0.22 : 0.14;
    const gradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 1.8);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.35, hexToRgba(color, alpha));
    gradient.addColorStop(1, hexToRgba(color, 0));
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(point.x, point.y, radius * 1.8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = active ? "#f8fafc" : hexToRgba(color, 0.36);
    context.beginPath();
    context.arc(point.x, point.y, Math.max(2.2, 4.5 * transform.scale), 0, Math.PI * 2);
    context.fill();
  }
}

function drawEnginePreview(transform, option) {
  const moving = motionModeSelect.value === "moving";
  for (const engine of getSelectedAnchors().engines) {
    const color = normalizeHexColor(engine.color, glowColors[option.color] ?? glowColors.red);
    const point = assetToCanvasPoint(engine, transform);
    const direction = (engine.direction * Math.PI) / 180;
    const flicker = 0.72 + seededNoise(engine.x + engine.y, lastFrameTime / 95) * 0.28;
    const baseSize = Number(engine.size ?? 9);
    const plumeLength = Number(engine.length ?? 58);
    const coreRadius = (moving ? baseSize : baseSize * 0.56) * transform.scale * flicker;
    const gradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, coreRadius * 3);
    gradient.addColorStop(0, "#f8fafc");
    gradient.addColorStop(0.28, hexToRgba(color, moving ? 0.7 : 0.2));
    gradient.addColorStop(1, hexToRgba(color, 0));
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(point.x, point.y, coreRadius * 3, 0, Math.PI * 2);
    context.fill();

    if (!moving) continue;
    for (let index = 0; index < 18; index += 1) {
      const life = (lastFrameTime / 520 + index * 0.137) % 1;
      const drift = baseSize * 2 + life * plumeLength;
      const spread = (seededNoise(index, engine.x) - 0.5) * baseSize * 2 * life;
      const particleX = point.x + Math.cos(direction) * drift * transform.scale + Math.cos(direction + Math.PI / 2) * spread * transform.scale;
      const particleY = point.y + Math.sin(direction) * drift * transform.scale + Math.sin(direction + Math.PI / 2) * spread * transform.scale;
      context.fillStyle = hexToRgba(color, (1 - life) * 0.58);
      context.beginPath();
      context.arc(particleX, particleY, Math.max(1.2, (baseSize * 0.31 - life * baseSize * 0.18) * transform.scale), 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawAnchorHandles(transform) {
  const anchors = getSelectedAnchors();
  drawHandles(anchors.coils, transform, "coil", "#facc15");
  drawHandles(anchors.engines, transform, "engine", "#38bdf8");
}

function drawHandles(points, transform, type, color) {
  points.forEach((anchor, index) => {
    const point = assetToCanvasPoint(anchor, transform);
    const selected = selectedAnchor.type === type && selectedAnchor.index === index;
    context.strokeStyle = selected ? "#ffffff" : color;
    context.lineWidth = selected ? 3 : 2;
    context.fillStyle = selected ? hexToRgba(color, 0.54) : hexToRgba(color, 0.24);
    context.beginPath();
    context.arc(point.x, point.y, 11, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#020817";
    context.font = "bold 12px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(index + 1), point.x, point.y);
  });
}

function assetToCanvasPoint(point, transform) {
  return {
    x: transform.x + point.x * transform.scale,
    y: transform.y + point.y * transform.scale
  };
}

function canvasToAssetPoint(clientX, clientY) {
  const option = getSelectedOption();
  const image = getShipImage(option);
  const transform = getImageTransform(image);
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  return {
    x: Math.round((clientX - rect.left) * ratio - transform.x) / transform.scale,
    y: Math.round((clientY - rect.top) * ratio - transform.y) / transform.scale
  };
}

function pickAnchor(clientX, clientY) {
  const option = getSelectedOption();
  const image = getShipImage(option);
  const transform = getImageTransform(image);
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const pointer = {
    x: (clientX - rect.left) * ratio,
    y: (clientY - rect.top) * ratio
  };
  const candidates = [
    ...getSelectedAnchors().coils.map((anchor, index) => ({ type: "coil", index, point: assetToCanvasPoint(anchor, transform) })),
    ...getSelectedAnchors().engines.map((anchor, index) => ({ type: "engine", index, point: assetToCanvasPoint(anchor, transform) }))
  ];
  return candidates
    .map((candidate) => ({ ...candidate, distance: Math.hypot(candidate.point.x - pointer.x, candidate.point.y - pointer.y) }))
    .filter((candidate) => candidate.distance <= 18)
    .sort((left, right) => left.distance - right.distance)[0] ?? null;
}

function moveSelectedAnchor(clientX, clientY) {
  const anchor = getSelectedAnchor();
  if (!anchor) return;
  const point = canvasToAssetPoint(clientX, clientY);
  const option = getSelectedOption();
  const image = getShipImage(option);
  anchor.x = clamp(Math.round(point.x), 0, image.naturalWidth || 9999);
  anchor.y = clamp(Math.round(point.y), 0, image.naturalHeight || 9999);
  saveLayout();
  syncAnchorInputs();
  updateExport();
}

function syncAnchorInputs() {
  const anchor = getSelectedAnchor();
  const engineSelected = selectedAnchor.type === "engine" && Boolean(anchor);
  selectedAnchorTitle.textContent = anchor
    ? `${selectedAnchor.type === "engine" ? "Triebwerk" : "Energiespule"} ${selectedAnchor.index + 1}`
    : "Kein Anker ausgewählt";
  anchorInputs.x.value = anchor?.x ?? "";
  anchorInputs.y.value = anchor?.y ?? "";
  anchorInputs.direction.value = anchor?.direction ?? 180;
  anchorInputs.direction.disabled = !engineSelected;
  const size = anchor?.size ?? 9;
  const length = anchor?.length ?? 58;
  engineInputs.sizeRange.value = size;
  engineInputs.sizeValue.value = size;
  engineInputs.lengthRange.value = length;
  engineInputs.lengthValue.value = length;
  engineInputs.color.value = normalizeHexColor(anchor?.color, glowColors[getSelectedOption().color] ?? glowColors.red);
  for (const input of Object.values(engineInputs)) {
    input.disabled = !engineSelected;
  }
}

function updateAnchorFromInputs() {
  const anchor = getSelectedAnchor();
  if (!anchor) return;
  anchor.x = Number(anchorInputs.x.value);
  anchor.y = Number(anchorInputs.y.value);
  if (selectedAnchor.type === "engine") anchor.direction = Number(anchorInputs.direction.value);
  saveLayout();
  updateExport();
  render();
}

function updateEngineFromInputs(source) {
  const anchor = getSelectedAnchor();
  if (!anchor || selectedAnchor.type !== "engine") return;
  if (source === engineInputs.sizeRange) engineInputs.sizeValue.value = engineInputs.sizeRange.value;
  if (source === engineInputs.sizeValue) engineInputs.sizeRange.value = engineInputs.sizeValue.value;
  if (source === engineInputs.lengthRange) engineInputs.lengthValue.value = engineInputs.lengthRange.value;
  if (source === engineInputs.lengthValue) engineInputs.lengthRange.value = engineInputs.lengthValue.value;
  anchor.size = clamp(Number(engineInputs.sizeValue.value), 3, 28);
  anchor.length = clamp(Number(engineInputs.lengthValue.value), 12, 140);
  anchor.color = normalizeHexColor(engineInputs.color.value, glowColors[getSelectedOption().color] ?? glowColors.red);
  syncAnchorInputs();
  saveLayout();
  updateExport();
  render();
}

function addEngineAnchor() {
  const engines = getSelectedAnchors().engines;
  const last = engines.at(-1) ?? { x: 112, y: 510, direction: 180 };
  engines.push(normalizeEngine({ ...last, y: last.y + 28 }, engines.length, getSelectedOption().color));
  setSelectedAnchor("engine", engines.length - 1);
  saveLayout();
  updateExport();
}

function removeEngineAnchor() {
  const engines = getSelectedAnchors().engines;
  if (selectedAnchor.type !== "engine" || engines.length <= 1) return;
  engines.splice(selectedAnchor.index, 1);
  getSelectedAnchors().engines = engines.map((engine, index) => normalizeEngine(engine, index, getSelectedOption().color));
  setSelectedAnchor("engine", Math.max(0, selectedAnchor.index - 1));
  saveLayout();
  updateExport();
}

function resetSelectedShipAnchors() {
  layout[selectedShipId] = normalizeShipAnchors(null, getSelectedOption());
  setSelectedAnchor(editModeSelect.value, 0);
  saveLayout();
  updateExport();
}

function saveLayout() {
  localStorage.setItem(storageKey, JSON.stringify(layout));
}

function updateExport() {
  const exportData = {};
  for (const option of shipOptions) {
    const anchors = layout[option.id];
    exportData[option.color] = exportData[option.color] ?? {};
    exportData[option.color][`ship${option.variant}`] = {
      asset: anchors.asset,
      coils: anchors.coils.map(({ id, x, y }) => ({ id, x, y })),
      engines: anchors.engines.map(({ id, x, y, direction, size, length, color }) => ({ id, x, y, direction, size, length, color }))
    };
  }
  exportOutput.value = `export const SHIP_VFX_ANCHORS = ${JSON.stringify(exportData, null, 2)};\n`;
}

function preloadImages() {
  return Promise.all(shipOptions.map((option) => new Promise((resolve) => {
    const image = getShipImage(option);
    if (image.complete && image.naturalWidth > 0) {
      resolve({ id: option.id, loaded: true });
      return;
    }
    image.addEventListener("load", () => resolve({ id: option.id, loaded: true }), { once: true });
    image.addEventListener("error", () => resolve({ id: option.id, loaded: false }), { once: true });
  })));
}

function requestRenderLoop() {
  if (animationFrameId) return;
  animationFrameId = requestAnimationFrame((time) => {
    animationFrameId = null;
    render(time);
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgba(hex, alpha) {
  const clean = normalizeHexColor(hex, "#ffffff").replace("#", "");
  const value = Number.parseInt(clean, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function normalizeHexColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
}

function seededNoise(seed, frame) {
  const value = Math.sin(seed * 12.9898 + frame * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

populateShipSelect();
syncAnchorInputs();
updateExport();
preloadImages().then((results) => {
  window.shipVfxDebugLoadedAssets = results;
  render();
});

shipSelect.addEventListener("change", (event) => {
  selectedShipId = event.target.value;
  setSelectedAnchor(editModeSelect.value, 0);
  render();
});
for (const element of [backgroundModeSelect, zoomControl, motionModeSelect, coilPreviewModeSelect]) {
  element.addEventListener("input", render);
}
editModeSelect.addEventListener("change", (event) => setSelectedAnchor(event.target.value, 0));
for (const input of Object.values(anchorInputs)) {
  input.addEventListener("input", updateAnchorFromInputs);
}
for (const input of Object.values(engineInputs)) {
  input.addEventListener("input", () => updateEngineFromInputs(input));
}
document.querySelector("#add-engine-anchor").addEventListener("click", addEngineAnchor);
document.querySelector("#remove-engine-anchor").addEventListener("click", removeEngineAnchor);
document.querySelector("#reset-anchors").addEventListener("click", resetSelectedShipAnchors);
document.querySelector("#export-anchors").addEventListener("click", updateExport);

canvas.addEventListener("pointerdown", (event) => {
  const picked = pickAnchor(event.clientX, event.clientY);
  if (picked) {
    setSelectedAnchor(picked.type, picked.index);
  } else {
    const list = getSelectedAnchorList();
    setSelectedAnchor(editModeSelect.value, Math.min(selectedAnchor.index, list.length - 1));
  }
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  moveSelectedAnchor(event.clientX, event.clientY);
});
canvas.addEventListener("pointermove", (event) => {
  if (dragging) moveSelectedAnchor(event.clientX, event.clientY);
});
canvas.addEventListener("pointerup", (event) => {
  dragging = false;
  canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener("pointercancel", () => {
  dragging = false;
});
window.addEventListener("resize", render);
