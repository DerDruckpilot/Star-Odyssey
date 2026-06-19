import { outpostAssetPaths, tradeStationAssetPaths } from "./data/outpostVisuals.js";

const storageKey = "star-odyssey-outpost-station-debug-layout";
const objectLayer = document.querySelector("#object-layer");
const stage = document.querySelector("#debug-stage");
const hexPolygons = document.querySelector("#hex-polygons");
const spaceLines = document.querySelector("#space-lines");
const spacePoints = document.querySelector("#space-points");
const layoutVariantSelect = document.querySelector("#layout-variant");
const outpostAssetSelect = document.querySelector("#outpost-asset");
const controls = {
  x: document.querySelector("#control-x"),
  y: document.querySelector("#control-y"),
  scale: document.querySelector("#control-scale"),
  rotation: document.querySelector("#control-rotation"),
  layer: document.querySelector("#control-layer")
};

const layoutVariants = {
  twoTopOneBottom: {
    id: "twoTopOneBottom",
    label: "Layout A - 2 oben / 1 unten",
    centers: [
      [282, 160],
      [438, 160],
      [360, 295]
    ]
  },
  oneTopTwoBottom: {
    id: "oneTopTwoBottom",
    label: "Layout B - 1 oben / 2 unten",
    centers: [
      [360, 150],
      [282, 285],
      [438, 285]
    ]
  }
};

const defaultOutpostTransform = {
  id: "outpost",
  kind: "outpost",
  x: 50,
  y: 47,
  scale: 1,
  rotation: 0,
  layer: 20
};

const defaultStationTransforms = [
  createDefaultStation("station-slot-1", 39, 66, 30),
  createDefaultStation("station-slot-2", 61, 66, 31),
  createDefaultStation("station-slot-3", 50, 77, 32),
  createDefaultStation("station-slot-4", 37, 50, 33),
  createDefaultStation("station-slot-5", 63, 50, 34)
];

const defaultLayout = {
  outpostId: "traders",
  layoutType: "twoTopOneBottom",
  profiles: {}
};

let layout = loadLayout();
let selectedId = "outpost";
let dragState = null;

function createDefaultStation(id, x, y, layer) {
  return {
    id,
    kind: "tradeStation",
    x,
    y,
    scale: 0.54,
    rotation: 0,
    layer
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLayout() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return clone(defaultLayout);
  try {
    return normalizeLayout(JSON.parse(saved));
  } catch {
    return clone(defaultLayout);
  }
}

function normalizeLayout(value) {
  const next = clone(defaultLayout);
  next.outpostId = outpostAssetPaths[value.outpostId] ? value.outpostId : next.outpostId;
  next.layoutType = layoutVariants[value.layoutType] ? value.layoutType : next.layoutType;
  next.profiles = {};

  const sourceProfiles = value.profiles ?? {};
  for (const outpostId of Object.keys(outpostAssetPaths)) {
    for (const layoutType of Object.keys(layoutVariants)) {
      const key = getProfileKey(outpostId, layoutType);
      const source = sourceProfiles[key] ?? {};
      next.profiles[key] = normalizeProfile(source);
    }
  }

  return next;
}

function normalizeProfile(value) {
  return {
    outpost: { ...defaultOutpostTransform, ...(value.outpost ?? {}) },
    stations: defaultStationTransforms.map((station, index) => ({
      ...station,
      ...(value.stations?.[index] ?? {})
    }))
  };
}

function getProfileKey(outpostId = layout.outpostId, layoutType = layout.layoutType) {
  return `${outpostId}:${layoutType}`;
}

function getActiveProfile() {
  const key = getProfileKey();
  layout.profiles[key] = normalizeProfile(layout.profiles[key] ?? {});
  return layout.profiles[key];
}

function getObjects() {
  const profile = getActiveProfile();
  return [profile.outpost, ...profile.stations];
}

function getObjectById(id) {
  return getObjects().find((item) => item.id === id);
}

function getAssetPath(item) {
  if (item.kind === "outpost") return outpostAssetPaths[layout.outpostId] ?? outpostAssetPaths.traders;
  return tradeStationAssetPaths.red;
}

function populateSelect(select, options, selectedValue) {
  select.replaceChildren();
  const entries = Object.entries(options);
  if (entries.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Keine Assets gefunden";
    select.append(option);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  for (const [id, path] of entries) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${id} (${path.split("/").pop()})`;
    select.append(option);
  }
  select.value = selectedValue;
}

function renderHexLayout() {
  const variant = layoutVariants[layout.layoutType] ?? layoutVariants.twoTopOneBottom;
  const hexes = variant.centers.map(([cx, cy]) => getHexPoints(cx, cy));
  hexPolygons.replaceChildren();
  spaceLines.replaceChildren();
  spacePoints.replaceChildren();

  for (const points of hexes) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", points.map(([x, y]) => `${x},${y}`).join(" "));
    hexPolygons.append(polygon);

    for (let index = 0; index < points.length; index += 1) {
      const [x1, y1] = points[index];
      const [x2, y2] = points[(index + 1) % points.length];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      spaceLines.append(line);
    }
  }

  for (const [x, y] of uniquePoints(hexes.flat())) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(x));
    circle.setAttribute("cy", String(y));
    circle.setAttribute("r", "10");
    spacePoints.append(circle);
  }
}

function getHexPoints(cx, cy) {
  const radius = 90;
  return [
    [cx, cy - radius],
    [cx + 78, cy - 45],
    [cx + 78, cy + 45],
    [cx, cy + radius],
    [cx - 78, cy + 45],
    [cx - 78, cy - 45]
  ];
}

function uniquePoints(points) {
  const seen = new Map();
  for (const [x, y] of points) {
    seen.set(`${Math.round(x)}:${Math.round(y)}`, [x, y]);
  }
  return Array.from(seen.values());
}

function render() {
  renderHexLayout();
  objectLayer.replaceChildren();

  for (const item of getObjects()) {
    const wrapper = document.createElement("button");
    wrapper.type = "button";
    wrapper.className = `debug-object debug-object--${item.kind}${item.id === selectedId ? " is-selected" : ""}`;
    wrapper.dataset.id = item.id;
    applyObjectStyle(wrapper, item);

    const image = document.createElement("img");
    image.src = getAssetPath(item);
    image.alt = item.id;
    wrapper.append(image);

    const label = document.createElement("span");
    label.textContent = item.id === "outpost" ? "O" : item.id.replace("station-slot-", "");
    wrapper.append(label);

    wrapper.addEventListener("pointerdown", startDrag);
    wrapper.addEventListener("click", () => {
      selectedId = item.id;
      render();
      syncControls();
    });
    objectLayer.append(wrapper);
  }
}

function applyObjectStyle(element, item) {
  element.style.left = `${item.x}%`;
  element.style.top = `${item.y}%`;
  element.style.zIndex = String(item.layer);
  element.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`;
}

function updateRenderedObject(id) {
  const item = getObjectById(id);
  const element = objectLayer.querySelector(`[data-id="${id}"]`);
  if (item && element) applyObjectStyle(element, item);
}

function updateSelectionClass() {
  for (const element of objectLayer.querySelectorAll(".debug-object")) {
    element.classList.toggle("is-selected", element.dataset.id === selectedId);
  }
}

function startDrag(event) {
  const target = event.currentTarget;
  selectedId = target.dataset.id;
  target.setPointerCapture(event.pointerId);
  const rect = stage.getBoundingClientRect();
  const item = getObjectById(selectedId);
  dragState = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left - (item.x / 100) * rect.width,
    offsetY: event.clientY - rect.top - (item.y / 100) * rect.height
  };
  target.addEventListener("pointermove", onDrag);
  target.addEventListener("pointerup", stopDrag);
  target.addEventListener("pointercancel", stopDrag);
  updateSelectionClass();
  syncControls();
}

function onDrag(event) {
  if (!dragState) return;
  const item = getObjectById(selectedId);
  const rect = stage.getBoundingClientRect();
  item.x = clamp(((event.clientX - rect.left - dragState.offsetX) / rect.width) * 100, 0, 100);
  item.y = clamp(((event.clientY - rect.top - dragState.offsetY) / rect.height) * 100, 0, 100);
  saveToLocalStorage();
  updateRenderedObject(selectedId);
  syncControls();
}

function stopDrag(event) {
  event.currentTarget.releasePointerCapture(dragState.pointerId);
  dragState = null;
  event.currentTarget.removeEventListener("pointermove", onDrag);
  event.currentTarget.removeEventListener("pointerup", stopDrag);
  event.currentTarget.removeEventListener("pointercancel", stopDrag);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function syncControls() {
  const item = getObjectById(selectedId);
  document.querySelector("#selected-title").textContent = item
    ? `${getObjectLabel(item)} (${item.kind})`
    : "Nichts ausgewählt";
  for (const [key, input] of Object.entries(controls)) {
    input.disabled = !item;
    input.value = item ? item[key] : "";
  }
}

function getObjectLabel(item) {
  if (item.id === "outpost") return "Außenposten";
  return `Station ${item.id.replace("station-slot-", "")}`;
}

function syncSelects() {
  layoutVariantSelect.value = layout.layoutType;
  outpostAssetSelect.value = layout.outpostId;
}

function updateSelectedFromControls() {
  const item = getObjectById(selectedId);
  if (!item) return;
  item.x = Number(controls.x.value);
  item.y = Number(controls.y.value);
  item.scale = Number(controls.scale.value);
  item.rotation = Number(controls.rotation.value);
  item.layer = Number(controls.layer.value);
  saveToLocalStorage();
  render();
}

function saveToLocalStorage() {
  localStorage.setItem(storageKey, JSON.stringify(layout));
}

function exportLayout() {
  const profile = getActiveProfile();
  const output = {
    generatedAt: new Date().toISOString(),
    source: "debug-outposts.html",
    outpostId: layout.outpostId,
    outpostAsset: getAssetPath(profile.outpost),
    layoutType: layout.layoutType,
    coordinateSystem: {
      origin: "debug-stage top-left",
      x: "percent of stage width",
      y: "percent of stage height",
      scale: "CSS transform scale",
      rotation: "degrees",
      layer: "CSS z-index"
    },
    outpost: exportTransform(profile.outpost),
    tradeStationSlots: profile.stations.map(exportTransform)
  };
  const json = JSON.stringify(output, null, 2);
  document.querySelector("#export-output").value = json;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `outpost-${layout.outpostId}-${layout.layoutType}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportTransform(item) {
  return {
    id: item.id,
    x: item.x,
    y: item.y,
    scale: item.scale,
    rotation: item.rotation,
    z: item.layer
  };
}

function setupSelects() {
  populateSelect(outpostAssetSelect, outpostAssetPaths, layout.outpostId);
  syncSelects();
}

setupSelects();

layoutVariantSelect.addEventListener("change", (event) => {
  layout.layoutType = event.target.value;
  selectedId = "outpost";
  saveToLocalStorage();
  render();
  syncControls();
});
outpostAssetSelect.addEventListener("change", (event) => {
  layout.outpostId = event.target.value;
  selectedId = "outpost";
  saveToLocalStorage();
  render();
  syncControls();
});
for (const input of Object.values(controls)) {
  input.addEventListener("input", updateSelectedFromControls);
}
document.querySelector("#reset-layout").addEventListener("click", () => {
  layout = clone(defaultLayout);
  selectedId = "outpost";
  saveToLocalStorage();
  setupSelects();
  render();
  syncControls();
});
document.querySelector("#save-layout").addEventListener("click", exportLayout);

render();
syncControls();
