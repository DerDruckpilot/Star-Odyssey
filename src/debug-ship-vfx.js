import { colonyShipAssetPaths, playerPieceColors, playerShipAssetPaths } from "./data/playerPieceVisuals.js";

const storageKey = "star-odyssey-ship-vfx-anchors";
const colonyShipStorageKey = "star-odyssey-colony-ship-vfx-anchors";
const canvas = document.querySelector("#ship-vfx-canvas");
const context = canvas.getContext("2d");
const engineLayerCanvas = document.createElement("canvas");
const engineLayerContext = engineLayerCanvas.getContext("2d");
const assetPanelTitle = document.querySelector("#asset-panel-title");
const shipSelect = document.querySelector("#ship-select");
const backgroundModeSelect = document.querySelector("#background-mode");
const zoomControl = document.querySelector("#zoom-control");
const editModeSelect = document.querySelector("#edit-mode");
const motionModeSelect = document.querySelector("#motion-mode");
const coilPreviewModeSelect = document.querySelector("#coil-preview-mode");
const selectedAnchorTitle = document.querySelector("#selected-anchor-title");
const shipTemplateSelect = document.querySelector("#engine-template-select");
const exportOutput = document.querySelector("#export-output");
const tabButtons = [...document.querySelectorAll(".debug-tab")];
const panelTabs = [...document.querySelectorAll(".panel-tab")];
const templateSelect = document.querySelector("#template-select");
const templateNameInput = document.querySelector("#template-name");
const templateBackgroundModeSelect = document.querySelector("#template-background-mode");
const templateMotionModeSelect = document.querySelector("#template-motion-mode");
const templatePreviewModeSelect = document.querySelector("#template-preview-mode");
const templateZoomControl = document.querySelector("#template-zoom-control");
const emitterList = document.querySelector("#emitter-list");
const importInput = document.querySelector("#import-vfx-data");
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
  color: document.querySelector("#engine-color"),
  layer: document.querySelector("#engine-layer"),
  templateId: shipTemplateSelect
};
const emitterInputs = {
  type: document.querySelector("#emitter-type"),
  x: document.querySelector("#emitter-x"),
  y: document.querySelector("#emitter-y"),
  direction: document.querySelector("#emitter-direction"),
  size: document.querySelector("#emitter-size"),
  length: document.querySelector("#emitter-length"),
  color: document.querySelector("#emitter-color"),
  layer: document.querySelector("#emitter-layer"),
  intensity: document.querySelector("#emitter-intensity"),
  spread: document.querySelector("#emitter-spread"),
  count: document.querySelector("#emitter-count"),
  speed: document.querySelector("#emitter-speed"),
  jitter: document.querySelector("#emitter-jitter")
};

const glowColors = {
  red: "#f87171",
  blue: "#38bdf8",
  yellow: "#facc15",
  green: "#4ade80"
};
const emitterPresets = {
  flame: { color: "#ff9f1c", size: 14, length: 92, intensity: 0.95, spread: 18, count: 34, speed: 1.15, jitter: 0.45 },
  smoke: { color: "#64748b", size: 20, length: 82, intensity: 0.42, spread: 28, count: 24, speed: 0.45, jitter: 0.38 },
  spark: { color: "#fde68a", size: 4, length: 74, intensity: 1, spread: 34, count: 30, speed: 1.8, jitter: 0.72 },
  plasma: { color: "#38bdf8", size: 12, length: 96, intensity: 0.9, spread: 12, count: 28, speed: 1.25, jitter: 0.34 },
  glow: { color: "#60a5fa", size: 24, length: 24, intensity: 0.62, spread: 4, count: 0, speed: 0.1, jitter: 0.18 },
  mist: { color: "#cbd5e1", size: 18, length: 70, intensity: 0.32, spread: 38, count: 20, speed: 0.35, jitter: 0.32 },
  ember: { color: "#fb7185", size: 6, length: 68, intensity: 0.86, spread: 24, count: 24, speed: 0.95, jitter: 0.58 },
  ion: { color: "#22d3ee", size: 9, length: 122, intensity: 0.78, spread: 8, count: 26, speed: 1.45, jitter: 0.2 }
};
const engineLayers = ["behind", "inline", "front"];
const emitterTypes = Object.keys(emitterPresets);
const shipOptions = playerPieceColors.flatMap((color) =>
  playerShipAssetPaths[color].map((assetPath, index) => ({
    id: `${color}-ship-${index + 1}`,
    color,
    variant: index + 1,
    assetPath
  }))
);
const colonyShipOptions = playerPieceColors.flatMap((color) =>
  colonyShipAssetPaths[color].map((assetPath, index) => ({
    id: `${color}-colony-ship-${index + 1}`,
    color,
    variant: index + 1,
    assetPath
  }))
);

const imageCache = new Map();
let debugData = loadDebugData();
let colonyShipDebugData = loadColonyShipDebugData(debugData.engineTemplates);
let selectedShipId = shipOptions[0].id;
let selectedColonyShipId = colonyShipOptions[0].id;
let selectedAnchor = { type: "coil", index: 0 };
let selectedTemplateId = debugData.engineTemplates[0]?.id ?? "template-plasma";
let selectedEmitterIndex = 0;
let activeTab = "ship";
let dragging = false;
let animationFrameId = null;
let lastFrameTime = 0;

function loadDebugData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return normalizeDebugData(parsed);
  } catch {
    return normalizeDebugData(null);
  }
}

function loadColonyShipDebugData(engineTemplates) {
  try {
    const parsed = JSON.parse(localStorage.getItem(colonyShipStorageKey) ?? "null");
    return normalizeColonyShipDebugData(parsed, engineTemplates);
  } catch {
    return normalizeColonyShipDebugData(null, engineTemplates);
  }
}

function normalizeDebugData(value) {
  const anchorsSource = value?.shipVfxAnchors ?? value;
  const engineTemplates = normalizeEngineTemplates(value?.engineTemplates);
  return {
    version: 2,
    engineTemplates,
    shipVfxAnchors: normalizeShipVfxAnchors(anchorsSource, engineTemplates)
  };
}

function normalizeColonyShipDebugData(value, engineTemplates = debugData?.engineTemplates ?? []) {
  const anchorsSource = value?.colonyShipVfxAnchors ?? value;
  return {
    version: 2,
    colonyShipVfxAnchors: normalizeShipVfxAnchors(anchorsSource, engineTemplates, colonyShipOptions)
  };
}

function normalizeShipVfxAnchors(value, engineTemplates, options = shipOptions) {
  const anchors = {};
  for (const option of options) {
    anchors[option.id] = normalizeShipAnchors(value?.[option.id], option, engineTemplates);
  }
  return anchors;
}

function normalizeShipAnchors(value, option, engineTemplates = debugData?.engineTemplates ?? []) {
  const defaultAnchors = createDefaultShipAnchors(option.variant, option.color, engineTemplates);
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

function normalizeEngineTemplates(value) {
  const templates = Array.isArray(value) && value.length > 0 ? value : createDefaultEngineTemplates();
  return templates.map((template, index) => normalizeTemplate(template, index));
}

function normalizeTemplate(template, index) {
  const fallback = createDefaultEngineTemplates()[0];
  const id = normalizeId(template?.id, `template-${index + 1}`);
  return {
    id,
    name: String(template?.name ?? fallback.name),
    emitters: Array.isArray(template?.emitters) && template.emitters.length > 0
      ? template.emitters.map((emitter, emitterIndex) => normalizeEmitter(emitter, emitterIndex))
      : fallback.emitters.map((emitter, emitterIndex) => normalizeEmitter(emitter, emitterIndex))
  };
}

function createDefaultEngineTemplates() {
  return [
    {
      id: "template-plasma",
      name: "Plasma Kern",
      emitters: [
        createEmitter({ id: "emitter-core-glow", type: "glow", x: 0, y: 0, direction: 180, size: 22, length: 24, color: "#38bdf8", layer: "behind", intensity: 0.62, spread: 4, count: 0 }),
        createEmitter({ id: "emitter-plasma-trail", type: "plasma", x: 0, y: 0, direction: 180, size: 11, length: 90, color: "#38bdf8", layer: "behind", intensity: 0.9, spread: 12, count: 28 }),
        createEmitter({ id: "emitter-front-sparks", type: "spark", x: 0, y: 0, direction: 180, size: 3.5, length: 74, color: "#e0f2fe", layer: "front", intensity: 0.72, spread: 22, count: 16 })
      ]
    }
  ];
}

function createDefaultShipAnchors(variant, color, engineTemplates = debugData?.engineTemplates ?? []) {
  const coilDefaults = {
    1: [{ x: 555, y: 505 }],
    2: [{ x: 505, y: 500 }, { x: 680, y: 500 }],
    3: [{ x: 465, y: 500 }, { x: 600, y: 500 }, { x: 735, y: 500 }]
  };
  return {
    coils: coilDefaults[variant].map((point, index) => ({ id: `coil-${index + 1}`, ...point })),
    engines: [normalizeEngine({ x: 112, y: 510, direction: 180, templateId: engineTemplates[0]?.id ?? "" }, 0, color)]
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
    color: normalizeHexColor(engine.color, glowColors[color] ?? glowColors.red),
    layer: normalizeEngineLayer(engine.layer),
    templateId: String(engine.templateId ?? "")
  };
}

function createEmitter(overrides = {}) {
  const preset = emitterPresets[overrides.type] ?? emitterPresets.plasma;
  return normalizeEmitter({ ...preset, ...overrides }, 0);
}

function normalizeEmitter(emitter, index) {
  const type = normalizeEmitterType(emitter?.type);
  const preset = emitterPresets[type];
  return {
    id: normalizeId(emitter?.id, `emitter-${index + 1}`),
    type,
    x: finiteNumber(emitter?.x, 0),
    y: finiteNumber(emitter?.y, 0),
    direction: finiteNumber(emitter?.direction, 180),
    size: finiteNumber(emitter?.size, preset.size),
    length: finiteNumber(emitter?.length, preset.length),
    color: normalizeHexColor(emitter?.color, preset.color),
    layer: normalizeEngineLayer(emitter?.layer),
    intensity: clamp(finiteNumber(emitter?.intensity, preset.intensity), 0, 2),
    spread: clamp(finiteNumber(emitter?.spread, preset.spread), 0, 120),
    count: clamp(Math.round(finiteNumber(emitter?.count, preset.count)), 0, 120),
    speed: clamp(finiteNumber(emitter?.speed, preset.speed), 0, 4),
    jitter: clamp(finiteNumber(emitter?.jitter, preset.jitter), 0, 1)
  };
}

function populateShipSelect() {
  shipSelect.replaceChildren();
  for (const option of getActiveAssetOptions()) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = `${option.color} - ${getActiveAssetLabel()} ${option.variant}`;
    shipSelect.append(element);
  }
  shipSelect.value = getSelectedAssetId();
  assetPanelTitle.textContent = activeTab === "colony" ? "Kolonieschiff VFX Setup" : "Schiff VFX Setup";
}

function populateTemplateSelects() {
  const previousShipTemplate = shipTemplateSelect.value;
  const selectedAnchorTemplate = getSelectedAnchor()?.templateId ?? "";
  shipTemplateSelect.replaceChildren(createTemplateOption("", "Direktparameter"));
  for (const template of debugData.engineTemplates) {
    shipTemplateSelect.append(createTemplateOption(template.id, template.name));
  }
  shipTemplateSelect.value = selectedAnchorTemplate || previousShipTemplate || "";

  templateSelect.replaceChildren();
  for (const template of debugData.engineTemplates) {
    templateSelect.append(createTemplateOption(template.id, template.name));
  }
  if (!getTemplateById(selectedTemplateId)) selectedTemplateId = debugData.engineTemplates[0]?.id ?? "";
  templateSelect.value = selectedTemplateId;
}

function createTemplateOption(value, label) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
}

function getSelectedOption() {
  return getActiveAssetOptions().find((option) => option.id === getSelectedAssetId()) ?? getActiveAssetOptions()[0];
}

function getSelectedAnchors() {
  return activeTab === "colony"
    ? colonyShipDebugData.colonyShipVfxAnchors[selectedColonyShipId]
    : debugData.shipVfxAnchors[selectedShipId];
}

function getActiveAssetOptions() {
  return activeTab === "colony" ? colonyShipOptions : shipOptions;
}

function getActiveAssetLabel() {
  return activeTab === "colony" ? "Kolonieschiff" : "Schiff";
}

function getSelectedAssetId() {
  return activeTab === "colony" ? selectedColonyShipId : selectedShipId;
}

function setSelectedAssetId(value) {
  if (activeTab === "colony") {
    selectedColonyShipId = value;
  } else {
    selectedShipId = value;
  }
}

function getSelectedAnchorList() {
  return selectedAnchor.type === "engine"
    ? getSelectedAnchors().engines
    : getSelectedAnchors().coils;
}

function getSelectedAnchor() {
  return getSelectedAnchorList()[selectedAnchor.index] ?? null;
}

function getTemplateById(templateId) {
  return debugData.engineTemplates.find((template) => template.id === templateId) ?? null;
}

function getSelectedTemplate() {
  return getTemplateById(selectedTemplateId) ?? debugData.engineTemplates[0] ?? null;
}

function getSelectedEmitter() {
  return getSelectedTemplate()?.emitters[selectedEmitterIndex] ?? null;
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
    image.addEventListener("load", () => render());
    image.addEventListener("error", () => render());
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
  const zoom = finiteNumber(zoomControl.value, 0.68);
  return {
    scale: zoom,
    x: width / 2 - (image.naturalWidth * zoom) / 2,
    y: height / 2 - (image.naturalHeight * zoom) / 2
  };
}

function getTemplateZoom() {
  return finiteNumber(templateZoomControl.value, 1);
}

function getTemplateShipTransform(image) {
  const { width, height } = getCanvasSize();
  const zoom = getTemplateZoom();
  return {
    scale: zoom,
    x: width / 2 - (image.naturalWidth * zoom) / 2,
    y: height / 2 - (image.naturalHeight * zoom) / 2
  };
}

function getTemplateTransform(image = null) {
  const { width, height } = getCanvasSize();
  if (templatePreviewModeSelect.value === "ship" && image?.complete && image.naturalWidth > 0) {
    const shipTransform = getTemplateShipTransform(image);
    const engine = getSelectedAnchors().engines[selectedAnchor.type === "engine" ? selectedAnchor.index : 0] ?? { x: 112, y: 510 };
    const point = assetToCanvasPoint(engine, shipTransform);
    return { x: point.x, y: point.y, scale: shipTransform.scale };
  }
  const ratio = window.devicePixelRatio || 1;
  return { x: width / 2, y: height / 2, scale: ratio * getTemplateZoom() };
}

function render(time = performance.now()) {
  lastFrameTime = finiteNumber(time, performance.now());
  const { width, height } = getCanvasSize();
  context.clearRect(0, 0, width, height);
  drawBackground(width, height, activeTab === "template" ? templateBackgroundModeSelect.value : backgroundModeSelect.value);

  if (activeTab === "template") {
    renderTemplateTab(width, height);
  } else {
    renderShipTab(width, height);
  }
  requestRenderLoop();
}

function renderShipTab(width, height) {
  const option = getSelectedOption();
  const image = getShipImage(option);
  if (!image.complete || image.naturalWidth === 0) {
    drawLoading(width, height);
    return;
  }

  const transform = getImageTransform(image);
  drawMaskedBehindEnginePreview(image, transform, width, height, getShipEngineEmitters("behind"));
  drawShipImage(context, image, transform);
  drawEngineEmitters(getShipEngineEmitters("inline"), transform, motionModeSelect.value === "moving", context);
  drawCoilPreview(transform, option);
  drawEngineEmitters(getShipEngineEmitters("front"), transform, motionModeSelect.value === "moving", context);
  drawAnchorHandles(transform);
}

function renderTemplateTab(width, height) {
  const image = getShipImage(getSelectedOption());
  const showShip = templatePreviewModeSelect.value === "ship" && image.complete && image.naturalWidth > 0;
  const transform = getTemplateTransform(showShip ? image : null);
  const moving = templateMotionModeSelect.value === "moving";
  const template = getSelectedTemplate();

  if (!template) {
    drawLoading(width, height, "Kein Template vorhanden");
    return;
  }

  if (showShip) {
    const shipTransform = getTemplateShipTransform(image);
    drawMaskedBehindEnginePreview(image, transform, width, height, getTemplateEmitters("behind"), shipTransform);
    drawShipImage(context, image, shipTransform);
    drawEngineEmitters(getTemplateEmitters("inline"), transform, moving, context);
    drawEngineEmitters(getTemplateEmitters("front"), transform, moving, context);
  } else {
    drawTemplateOrigin(transform);
    for (const layer of engineLayers) {
      drawEngineEmitters(getTemplateEmitters(layer), transform, moving, context);
    }
  }
  drawEmitterHandles(transform);
}

function drawBackground(width, height, mode) {
  if (mode === "light") {
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, width, height);
    return;
  }
  if (mode === "checker") {
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

function drawLoading(width, height, message = "Schiff-Asset wird geladen ...") {
  context.fillStyle = "#e2e8f0";
  context.font = "18px system-ui";
  context.textAlign = "center";
  context.fillText(message, width / 2, height / 2);
}

function drawTemplateOrigin(transform) {
  context.strokeStyle = "rgba(148, 163, 184, 0.55)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(transform.x - 32, transform.y);
  context.lineTo(transform.x + 32, transform.y);
  context.moveTo(transform.x, transform.y - 32);
  context.lineTo(transform.x, transform.y + 32);
  context.stroke();
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

function drawMaskedBehindEnginePreview(image, transform, width, height, emitters, maskTransform = getImageTransform(image)) {
  engineLayerCanvas.width = width;
  engineLayerCanvas.height = height;
  engineLayerContext.clearRect(0, 0, width, height);
  drawEngineEmitters(emitters, transform, getMotionModeForActiveTab() === "moving", engineLayerContext);
  engineLayerContext.save();
  engineLayerContext.globalCompositeOperation = "destination-out";
  drawShipImage(engineLayerContext, image, maskTransform);
  engineLayerContext.restore();
  context.drawImage(engineLayerCanvas, 0, 0);
}

function drawShipImage(targetContext, image, transform) {
  targetContext.drawImage(
    image,
    transform.x,
    transform.y,
    image.naturalWidth * transform.scale,
    image.naturalHeight * transform.scale
  );
}

function getShipEngineEmitters(layer) {
  const option = getSelectedOption();
  return getSelectedAnchors().engines.flatMap((engine, engineIndex) => {
    const template = getTemplateById(engine.templateId);
    if (template) {
      return template.emitters
        .filter((emitter) => normalizeEngineLayer(emitter.layer) === layer)
        .map((emitter, emitterIndex) => mergeEngineAndEmitter(engine, emitter, engineIndex, emitterIndex));
    }
    if (normalizeEngineLayer(engine.layer) !== layer) return [];
    return [engineToEmitter(engine, option.color, engineIndex)];
  });
}

function getTemplateEmitters(layer) {
  return (getSelectedTemplate()?.emitters ?? []).filter((emitter) => normalizeEngineLayer(emitter.layer) === layer);
}

function mergeEngineAndEmitter(engine, emitter, engineIndex, emitterIndex) {
  return {
    ...emitter,
    id: `${engine.id}-${emitter.id}`,
    x: finiteNumber(engine.x, 0) + finiteNumber(emitter.x, 0),
    y: finiteNumber(engine.y, 0) + finiteNumber(emitter.y, 0),
    direction: finiteNumber(engine.direction, 180) + finiteNumber(emitter.direction, 180),
    seed: engineIndex * 101 + emitterIndex * 17
  };
}

function engineToEmitter(engine, color, index) {
  return normalizeEmitter({
    id: engine.id,
    type: "plasma",
    x: engine.x,
    y: engine.y,
    direction: engine.direction,
    size: engine.size,
    length: engine.length,
    color: normalizeHexColor(engine.color, glowColors[color] ?? glowColors.red),
    layer: engine.layer,
    intensity: 0.82,
    spread: engine.size * 1.5,
    count: 18,
    seed: index
  }, index);
}

function drawEngineEmitters(emitters, transform, moving, targetContext = context) {
  for (const emitter of emitters) {
    drawEmitterEffect(emitter, transform, moving, targetContext);
  }
}

function drawEmitterEffect(emitter, transform, moving, targetContext) {
  const point = assetToCanvasPoint(emitter, transform);
  const direction = (finiteNumber(emitter.direction, 180) * Math.PI) / 180;
  const color = normalizeHexColor(emitter.color, emitterPresets[emitter.type]?.color ?? "#38bdf8");
  const emitterIntensity = finiteNumber(emitter.intensity, 0.8);
  const emitterJitter = finiteNumber(emitter.jitter, 0);
  const intensity = moving ? emitterIntensity : emitterIntensity * 0.18;
  const flicker = 1 - emitterJitter * 0.35 + seededNoise((emitter.seed ?? 0) + finiteNumber(emitter.x, 0) + finiteNumber(emitter.y, 0), lastFrameTime / 120) * emitterJitter * 0.7;
  const size = Math.max(0.5, finiteNumber(emitter.size, 8) * finiteNumber(transform.scale, 1) * flicker);
  const length = finiteNumber(emitter.length, 60) * finiteNumber(transform.scale, 1);
  const gradient = targetContext.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * getGlowMultiplier(emitter.type));
  gradient.addColorStop(0, getEmitterCoreColor(emitter.type, color));
  gradient.addColorStop(0.32, hexToRgba(color, 0.68 * intensity));
  gradient.addColorStop(1, hexToRgba(color, 0));
  targetContext.save();
  targetContext.globalAlpha = clamp(intensity, 0, 1.4);
  targetContext.fillStyle = gradient;
  targetContext.beginPath();
  targetContext.arc(point.x, point.y, size * getGlowMultiplier(emitter.type), 0, Math.PI * 2);
  targetContext.fill();
  targetContext.restore();

  const count = Math.max(0, Math.round(finiteNumber(emitter.count, 0)));
  if (!moving || count <= 0 || emitter.type === "glow") return;
  for (let index = 0; index < count; index += 1) {
    drawEmitterParticle(targetContext, emitter, point, direction, length, transform.scale, color, intensity, index);
  }
}

function drawEmitterParticle(targetContext, emitter, origin, direction, length, scale, color, intensity, index) {
  const speed = Math.max(0.05, finiteNumber(emitter.speed, 0.05));
  const seed = (emitter.seed ?? 0) + index * 17;
  const cycleMs = 840 / speed;
  const phaseOffset = seededNoise(seed, finiteNumber(emitter.x, 0) + finiteNumber(emitter.y, 0));
  const life = ((lastFrameTime / cycleMs) + phaseOffset) % 1;
  const jitter = finiteNumber(emitter.jitter, 0);
  const wobble = Math.sin((lastFrameTime / 95) + seed) * jitter;
  const spreadNoise = seededNoise(seed + 11, lastFrameTime / 180) - 0.5;
  const driftNoise = (seededNoise(seed + 23, lastFrameTime / 240) - 0.5) * jitter * 0.18;
  const drift = clamp01(life + driftNoise) * length;
  const spread = (spreadNoise + wobble * 0.35) * finiteNumber(emitter.spread, 0) * Math.sin(life * Math.PI) * scale;
  const sideAngle = direction + Math.PI / 2;
  const particleX = origin.x + Math.cos(direction) * drift + Math.cos(sideAngle) * spread;
  const particleY = origin.y + Math.sin(direction) * drift + Math.sin(sideAngle) * spread;
  const fade = (1 - life) * intensity;
  const radius = Math.max(0.75, getParticleSize(emitter.type, emitter.size, life) * scale);
  targetContext.save();
  targetContext.globalAlpha = clamp(fade, 0, 1);
  targetContext.fillStyle = getParticleColor(emitter.type, color, life);
  targetContext.beginPath();
  targetContext.arc(particleX, particleY, radius, 0, Math.PI * 2);
  targetContext.fill();
  targetContext.restore();
}

function getGlowMultiplier(type) {
  if (type === "smoke" || type === "mist") return 3.4;
  if (type === "glow") return 3.8;
  if (type === "spark") return 1.7;
  return 2.8;
}

function getParticleSize(type, size, life) {
  if (type === "smoke" || type === "mist") return size * (0.28 + life * 0.28);
  if (type === "spark") return size * (0.18 - life * 0.06);
  if (type === "ember") return size * (0.24 - life * 0.08);
  return size * (0.22 - life * 0.1);
}

function getEmitterCoreColor(type, color) {
  if (type === "smoke" || type === "mist") return hexToRgba(color, 0.55);
  if (type === "ember" || type === "flame") return "#fff7ed";
  return "#f8fafc";
}

function getParticleColor(type, color, life) {
  if (type === "smoke") return hexToRgba("#475569", 0.72 - life * 0.3);
  if (type === "mist") return hexToRgba("#cbd5e1", 0.5 - life * 0.18);
  if (type === "flame" && life < 0.32) return "#fff7ed";
  if (type === "ember") return life < 0.45 ? "#fed7aa" : color;
  return color;
}

function drawAnchorHandles(transform) {
  const anchors = getSelectedAnchors();
  drawHandles(anchors.coils, transform, "coil", "#facc15");
  drawHandles(anchors.engines, transform, "engine", "#38bdf8");
}

function drawEmitterHandles(transform) {
  const template = getSelectedTemplate();
  if (!template) return;
  drawHandles(template.emitters, transform, "emitter", "#a78bfa");
}

function drawHandles(points, transform, type, color) {
  points.forEach((anchor, index) => {
    const point = assetToCanvasPoint(anchor, transform);
    const selected = type === "emitter"
      ? selectedEmitterIndex === index
      : selectedAnchor.type === type && selectedAnchor.index === index;
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
    x: finiteNumber(transform.x, 0) + finiteNumber(point.x, 0) * finiteNumber(transform.scale, 1),
    y: finiteNumber(transform.y, 0) + finiteNumber(point.y, 0) * finiteNumber(transform.scale, 1)
  };
}

function canvasToAssetPoint(clientX, clientY) {
  const option = getSelectedOption();
  const image = getShipImage(option);
  const transform = getImageTransform(image);
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  return {
    x: Math.round(((clientX - rect.left) * ratio - transform.x) / transform.scale),
    y: Math.round(((clientY - rect.top) * ratio - transform.y) / transform.scale)
  };
}

function canvasToTemplatePoint(clientX, clientY) {
  const image = getShipImage(getSelectedOption());
  const transform = getTemplateTransform(image);
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  return {
    x: Math.round(((clientX - rect.left) * ratio - transform.x) / transform.scale),
    y: Math.round(((clientY - rect.top) * ratio - transform.y) / transform.scale)
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
  return pickClosest(candidates, pointer);
}

function pickEmitter(clientX, clientY) {
  const image = getShipImage(getSelectedOption());
  const transform = getTemplateTransform(image);
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const pointer = {
    x: (clientX - rect.left) * ratio,
    y: (clientY - rect.top) * ratio
  };
  const candidates = (getSelectedTemplate()?.emitters ?? []).map((emitter, index) => ({
    type: "emitter",
    index,
    point: assetToCanvasPoint(emitter, transform)
  }));
  return pickClosest(candidates, pointer);
}

function pickClosest(candidates, pointer) {
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
  saveDebugData();
  syncAnchorInputs();
  updateExport();
}

function moveSelectedEmitter(clientX, clientY) {
  const emitter = getSelectedEmitter();
  if (!emitter) return;
  const point = canvasToTemplatePoint(clientX, clientY);
  emitter.x = point.x;
  emitter.y = point.y;
  saveDebugData();
  syncEmitterInputs();
  updateExport();
}

function syncAnchorInputs() {
  populateTemplateSelects();
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
  engineInputs.layer.value = normalizeEngineLayer(anchor?.layer);
  engineInputs.templateId.value = anchor?.templateId ?? "";
  for (const input of Object.values(engineInputs)) {
    input.disabled = !engineSelected;
  }
}

function syncTemplateInputs() {
  populateTemplateSelects();
  const template = getSelectedTemplate();
  templateNameInput.value = template?.name ?? "";
  syncEmitterList();
  syncEmitterInputs();
}

function syncEmitterList() {
  emitterList.replaceChildren();
  const template = getSelectedTemplate();
  for (const [index, emitter] of (template?.emitters ?? []).entries()) {
    const element = document.createElement("option");
    element.value = String(index);
    element.textContent = `${index + 1}. ${emitter.type} (${emitter.layer})`;
    emitterList.append(element);
  }
  emitterList.value = String(selectedEmitterIndex);
}

function syncEmitterInputs() {
  const emitter = getSelectedEmitter();
  for (const input of Object.values(emitterInputs)) input.disabled = !emitter;
  if (!emitter) return;
  emitterInputs.type.value = emitter.type;
  emitterInputs.x.value = emitter.x;
  emitterInputs.y.value = emitter.y;
  emitterInputs.direction.value = emitter.direction;
  emitterInputs.size.value = emitter.size;
  emitterInputs.length.value = emitter.length;
  emitterInputs.color.value = normalizeHexColor(emitter.color, emitterPresets[emitter.type].color);
  emitterInputs.layer.value = normalizeEngineLayer(emitter.layer);
  emitterInputs.intensity.value = emitter.intensity;
  emitterInputs.spread.value = emitter.spread;
  emitterInputs.count.value = emitter.count;
  emitterInputs.speed.value = emitter.speed;
  emitterInputs.jitter.value = emitter.jitter;
}

function updateAnchorFromInputs() {
  const anchor = getSelectedAnchor();
  if (!anchor) return;
  anchor.x = Number(anchorInputs.x.value);
  anchor.y = Number(anchorInputs.y.value);
  if (selectedAnchor.type === "engine") anchor.direction = Number(anchorInputs.direction.value);
  saveDebugData();
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
  anchor.layer = normalizeEngineLayer(engineInputs.layer.value);
  anchor.templateId = engineInputs.templateId.value;
  syncAnchorInputs();
  saveDebugData();
  updateExport();
  render();
}

function updateTemplateFromInputs() {
  const template = getSelectedTemplate();
  if (!template) return;
  template.name = templateNameInput.value.trim() || template.name;
  populateTemplateSelects();
  saveDebugData();
  updateExport();
  render();
}

function updateEmitterFromInputs(source) {
  const emitter = getSelectedEmitter();
  if (!emitter) return;
  const previousType = emitter.type;
  emitter.type = normalizeEmitterType(emitterInputs.type.value);
  if (source === emitterInputs.type && emitter.type !== previousType) {
    const preset = emitterPresets[emitter.type];
    emitter.color = preset.color;
    emitter.size = preset.size;
    emitter.length = preset.length;
    emitter.intensity = preset.intensity;
    emitter.spread = preset.spread;
    emitter.count = preset.count;
    emitter.speed = preset.speed;
    emitter.jitter = preset.jitter;
  } else {
    emitter.x = Number(emitterInputs.x.value);
    emitter.y = Number(emitterInputs.y.value);
    emitter.direction = Number(emitterInputs.direction.value);
    emitter.size = clamp(Number(emitterInputs.size.value), 1, 80);
    emitter.length = clamp(Number(emitterInputs.length.value), 1, 240);
    emitter.color = normalizeHexColor(emitterInputs.color.value, emitterPresets[emitter.type].color);
    emitter.layer = normalizeEngineLayer(emitterInputs.layer.value);
    emitter.intensity = clamp(Number(emitterInputs.intensity.value), 0, 2);
    emitter.spread = clamp(Number(emitterInputs.spread.value), 0, 120);
    emitter.count = clamp(Math.round(Number(emitterInputs.count.value)), 0, 120);
    emitter.speed = clamp(Number(emitterInputs.speed.value), 0, 4);
    emitter.jitter = clamp(Number(emitterInputs.jitter.value), 0, 1);
  }
  syncEmitterList();
  syncEmitterInputs();
  saveDebugData();
  updateExport();
  render();
}

function addEngineAnchor() {
  const engines = getSelectedAnchors().engines;
  const last = engines.at(-1) ?? { x: 112, y: 510, direction: 180 };
  engines.push(normalizeEngine({ ...last, y: last.y + 28 }, engines.length, getSelectedOption().color));
  setSelectedAnchor("engine", engines.length - 1);
  saveDebugData();
  updateExport();
}

function removeEngineAnchor() {
  const engines = getSelectedAnchors().engines;
  if (selectedAnchor.type !== "engine" || engines.length <= 1) return;
  engines.splice(selectedAnchor.index, 1);
  getSelectedAnchors().engines = engines.map((engine, index) => normalizeEngine(engine, index, getSelectedOption().color));
  setSelectedAnchor("engine", Math.max(0, selectedAnchor.index - 1));
  saveDebugData();
  updateExport();
}

function addTemplate() {
  const nextNumber = debugData.engineTemplates.length + 1;
  const template = normalizeTemplate({
    id: `template-${Date.now().toString(36)}`,
    name: `Template ${nextNumber}`,
    emitters: [createEmitter({ type: "plasma" })]
  }, nextNumber - 1);
  debugData.engineTemplates.push(template);
  selectedTemplateId = template.id;
  selectedEmitterIndex = 0;
  syncTemplateInputs();
  saveDebugData();
  updateExport();
  render();
}

function deleteTemplate() {
  if (debugData.engineTemplates.length <= 1) return;
  const deleteId = selectedTemplateId;
  debugData.engineTemplates = debugData.engineTemplates.filter((template) => template.id !== deleteId);
  for (const anchors of Object.values(debugData.shipVfxAnchors)) {
    for (const engine of anchors.engines) {
      if (engine.templateId === deleteId) engine.templateId = "";
    }
  }
  for (const anchors of Object.values(colonyShipDebugData.colonyShipVfxAnchors)) {
    for (const engine of anchors.engines) {
      if (engine.templateId === deleteId) engine.templateId = "";
    }
  }
  selectedTemplateId = debugData.engineTemplates[0].id;
  selectedEmitterIndex = 0;
  syncTemplateInputs();
  syncAnchorInputs();
  saveDebugData();
  updateExport();
  render();
}

function addEmitter() {
  const template = getSelectedTemplate();
  if (!template) return;
  const last = template.emitters.at(-1) ?? createEmitter({ type: "plasma" });
  template.emitters.push(normalizeEmitter({ ...last, id: `emitter-${Date.now().toString(36)}`, y: last.y + 8 }, template.emitters.length));
  selectedEmitterIndex = template.emitters.length - 1;
  syncTemplateInputs();
  saveDebugData();
  updateExport();
  render();
}

function duplicateEmitter() {
  const template = getSelectedTemplate();
  const emitter = getSelectedEmitter();
  if (!template || !emitter) return;
  template.emitters.splice(selectedEmitterIndex + 1, 0, normalizeEmitter({ ...emitter, id: `emitter-${Date.now().toString(36)}`, y: emitter.y + 6 }, selectedEmitterIndex + 1));
  selectedEmitterIndex += 1;
  syncTemplateInputs();
  saveDebugData();
  updateExport();
  render();
}

function removeEmitter() {
  const template = getSelectedTemplate();
  if (!template || template.emitters.length <= 1) return;
  template.emitters.splice(selectedEmitterIndex, 1);
  selectedEmitterIndex = Math.max(0, selectedEmitterIndex - 1);
  template.emitters = template.emitters.map((emitter, index) => normalizeEmitter(emitter, index));
  syncTemplateInputs();
  saveDebugData();
  updateExport();
  render();
}

function moveEmitter(offset) {
  const template = getSelectedTemplate();
  if (!template) return;
  const nextIndex = selectedEmitterIndex + offset;
  if (nextIndex < 0 || nextIndex >= template.emitters.length) return;
  const [emitter] = template.emitters.splice(selectedEmitterIndex, 1);
  template.emitters.splice(nextIndex, 0, emitter);
  selectedEmitterIndex = nextIndex;
  syncTemplateInputs();
  saveDebugData();
  updateExport();
  render();
}

function resetSelectedShipAnchors() {
  layoutCurrentShip();
  setSelectedAnchor(editModeSelect.value, 0);
  saveDebugData();
  updateExport();
}

function layoutCurrentShip() {
  if (activeTab === "colony") {
    colonyShipDebugData.colonyShipVfxAnchors[selectedColonyShipId] = normalizeShipAnchors(null, getSelectedOption(), debugData.engineTemplates);
  } else {
    debugData.shipVfxAnchors[selectedShipId] = normalizeShipAnchors(null, getSelectedOption(), debugData.engineTemplates);
  }
}

function resetAllStorage() {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(colonyShipStorageKey);
  debugData = normalizeDebugData(null);
  colonyShipDebugData = normalizeColonyShipDebugData(null, debugData.engineTemplates);
  selectedTemplateId = debugData.engineTemplates[0].id;
  selectedEmitterIndex = 0;
  setSelectedAnchor(editModeSelect.value, 0);
  syncTemplateInputs();
  saveDebugData();
  updateExport();
  render();
}

function saveDebugData() {
  localStorage.setItem(storageKey, JSON.stringify(createExportData()));
  localStorage.setItem(colonyShipStorageKey, JSON.stringify(createColonyShipExportData()));
}

function createExportData() {
  const shipVfxAnchors = {};
  for (const option of shipOptions) {
    const anchors = debugData.shipVfxAnchors[option.id];
    shipVfxAnchors[option.id] = {
      color: anchors.color,
      variant: anchors.variant,
      asset: anchors.asset,
      coils: anchors.coils.map(({ id, x, y }) => ({ id, x, y })),
      engines: anchors.engines.map(({ id, x, y, direction, size, length, color, layer, templateId }) => ({
        id,
        x,
        y,
        direction,
        size,
        length,
        color,
        layer,
        templateId
      }))
    };
  }
  return {
    version: 2,
    engineTemplates: debugData.engineTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      emitters: template.emitters.map(({ id, type, x, y, direction, size, length, color, layer, intensity, spread, count, speed, jitter }) => ({
        id,
        type,
        x,
        y,
        direction,
        size,
        length,
        color,
        layer,
        intensity,
        spread,
        count,
        speed,
        jitter
      }))
    })),
    shipVfxAnchors
  };
}

function createColonyShipExportData() {
  const colonyShipVfxAnchors = {};
  for (const option of colonyShipOptions) {
    const anchors = colonyShipDebugData.colonyShipVfxAnchors[option.id];
    colonyShipVfxAnchors[option.id] = {
      color: anchors.color,
      variant: anchors.variant,
      asset: anchors.asset,
      coils: anchors.coils.map(({ id, x, y }) => ({ id, x, y })),
      engines: anchors.engines.map(({ id, x, y, direction, size, length, color, layer, templateId }) => ({
        id,
        x,
        y,
        direction,
        size,
        length,
        color,
        layer,
        templateId
      }))
    };
  }
  return {
    version: 2,
    engineTemplates: debugData.engineTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      emitters: template.emitters.map(({ id, type, x, y, direction, size, length, color, layer, intensity, spread, count, speed, jitter }) => ({
        id,
        type,
        x,
        y,
        direction,
        size,
        length,
        color,
        layer,
        intensity,
        spread,
        count,
        speed,
        jitter
      }))
    })),
    colonyShipVfxAnchors
  };
}

function createCombinedExportData() {
  return {
    ...createExportData(),
    colonyShipVfxAnchors: createColonyShipExportData().colonyShipVfxAnchors
  };
}

function updateExport() {
  if (activeTab === "colony") {
    exportOutput.value = `export const COLONY_SHIP_VFX_DATA = ${JSON.stringify(createColonyShipExportData(), null, 2)};\n`;
  } else if (activeTab === "template") {
    exportOutput.value = `export const ALL_SHIP_VFX_DATA = ${JSON.stringify(createCombinedExportData(), null, 2)};\n`;
  } else {
    exportOutput.value = `export const SHIP_VFX_DATA = ${JSON.stringify(createExportData(), null, 2)};\n`;
  }
}

function updateCombinedExport() {
  exportOutput.value = `export const ALL_SHIP_VFX_DATA = ${JSON.stringify(createCombinedExportData(), null, 2)};\n`;
}

function downloadExport() {
  const blob = new Blob([JSON.stringify(createExportData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ship-vfx-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function downloadColonyShipExport() {
  const blob = new Blob([JSON.stringify(createColonyShipExportData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "colony-ship-vfx-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importExport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (parsed?.shipVfxAnchors || !parsed?.colonyShipVfxAnchors) {
        debugData = normalizeDebugData(parsed);
      } else if (parsed?.engineTemplates) {
        debugData = {
          ...debugData,
          engineTemplates: normalizeEngineTemplates(parsed.engineTemplates)
        };
      }
      if (parsed?.colonyShipVfxAnchors) {
        colonyShipDebugData = normalizeColonyShipDebugData(parsed, debugData.engineTemplates);
      }
      selectedTemplateId = debugData.engineTemplates[0]?.id ?? "";
      selectedEmitterIndex = 0;
      setSelectedAnchor(editModeSelect.value, 0);
      populateShipSelect();
      syncTemplateInputs();
      saveDebugData();
      updateExport();
      render();
    } catch {
      exportOutput.value = "Import fehlgeschlagen: JSON konnte nicht gelesen werden.";
    }
  });
  reader.readAsText(file);
}

function preloadImages() {
  return Promise.all([...shipOptions, ...colonyShipOptions].map((option) => new Promise((resolve) => {
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

function getMotionModeForActiveTab() {
  return activeTab === "template" ? templateMotionModeSelect.value : motionModeSelect.value;
}

function setActiveTab(tab) {
  activeTab = tab;
  canvas.classList.toggle("is-template-tab", tab === "template");
  for (const button of tabButtons) {
    const selected = button.dataset.tab === tab;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  }
  const panelKey = tab === "colony" ? "ship" : tab;
  for (const panel of panelTabs) {
    panel.classList.toggle("is-active", panel.dataset.panel === panelKey);
  }
  if (tab !== "template") {
    populateShipSelect();
    setSelectedAnchor(editModeSelect.value, 0);
  }
  updateExport();
  render();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

function normalizeEngineLayer(value) {
  return engineLayers.includes(value) ? value : "behind";
}

function normalizeEmitterType(value) {
  return emitterTypes.includes(value) ? value : "plasma";
}

function normalizeId(value, fallback) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function seededNoise(seed, frame) {
  const value = Math.sin(seed * 12.9898 + frame * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

populateShipSelect();
populateTemplateSelects();
syncAnchorInputs();
syncTemplateInputs();
updateExport();
preloadImages().then((results) => {
  window.shipVfxDebugLoadedAssets = results;
  render();
});

shipSelect.addEventListener("change", (event) => {
  setSelectedAssetId(event.target.value);
  setSelectedAnchor(editModeSelect.value, 0);
  render();
});
for (const element of [backgroundModeSelect, zoomControl, motionModeSelect, coilPreviewModeSelect]) {
  element.addEventListener("input", render);
}
for (const element of [templateBackgroundModeSelect, templateMotionModeSelect, templatePreviewModeSelect, templateZoomControl]) {
  element.addEventListener("input", render);
}
for (const button of tabButtons) {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
}
editModeSelect.addEventListener("change", (event) => setSelectedAnchor(event.target.value, 0));
templateSelect.addEventListener("change", (event) => {
  selectedTemplateId = event.target.value;
  selectedEmitterIndex = 0;
  syncTemplateInputs();
  render();
});
templateNameInput.addEventListener("input", updateTemplateFromInputs);
emitterList.addEventListener("change", (event) => {
  selectedEmitterIndex = Number(event.target.value);
  syncEmitterInputs();
  render();
});
for (const input of Object.values(anchorInputs)) {
  input.addEventListener("input", updateAnchorFromInputs);
}
for (const input of Object.values(engineInputs)) {
  input.addEventListener("input", () => updateEngineFromInputs(input));
}
for (const input of Object.values(emitterInputs)) {
  input.addEventListener("input", () => updateEmitterFromInputs(input));
}
document.querySelector("#add-engine-anchor").addEventListener("click", addEngineAnchor);
document.querySelector("#remove-engine-anchor").addEventListener("click", removeEngineAnchor);
document.querySelector("#reset-anchors").addEventListener("click", resetSelectedShipAnchors);
document.querySelector("#export-anchors").addEventListener("click", updateExport);
document.querySelector("#add-template").addEventListener("click", addTemplate);
document.querySelector("#delete-template").addEventListener("click", deleteTemplate);
document.querySelector("#add-emitter").addEventListener("click", addEmitter);
document.querySelector("#duplicate-emitter").addEventListener("click", duplicateEmitter);
document.querySelector("#remove-emitter").addEventListener("click", removeEmitter);
document.querySelector("#move-emitter-up").addEventListener("click", () => moveEmitter(-1));
document.querySelector("#move-emitter-down").addEventListener("click", () => moveEmitter(1));
document.querySelector("#export-all-vfx").addEventListener("click", updateCombinedExport);
document.querySelector("#download-all-vfx").addEventListener("click", downloadExport);
document.querySelector("#download-colony-ship-vfx").addEventListener("click", downloadColonyShipExport);
document.querySelector("#reset-vfx-storage").addEventListener("click", resetAllStorage);
importInput.addEventListener("change", (event) => importExport(event.target.files?.[0]));

canvas.addEventListener("pointerdown", (event) => {
  if (activeTab === "template") {
    const picked = pickEmitter(event.clientX, event.clientY);
    if (picked) {
      selectedEmitterIndex = picked.index;
      syncEmitterInputs();
      syncEmitterList();
    }
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    moveSelectedEmitter(event.clientX, event.clientY);
    return;
  }

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
  if (!dragging) return;
  if (activeTab === "template") {
    moveSelectedEmitter(event.clientX, event.clientY);
  } else {
    moveSelectedAnchor(event.clientX, event.clientY);
  }
});
canvas.addEventListener("pointerup", (event) => {
  dragging = false;
  canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener("pointercancel", () => {
  dragging = false;
});
window.addEventListener("resize", render);
