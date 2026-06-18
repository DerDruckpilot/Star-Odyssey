import {
  playerColonyAssetPaths,
  playerPieceColors,
  playerSpaceportAssetPaths
} from "./data/playerPieceVisuals.js";

const pageKind = document.body.dataset.pieceKind === "spaceport" ? "spaceport" : "colony";
const configs = {
  colony: {
    label: "Kolonie",
    source: "debug-colonies.html",
    storageKey: "star-odyssey-colony-debug-layout",
    downloadName: "colony-layout.json",
    assetPaths: playerColonyAssetPaths,
    defaultPiece: {
      id: "colony",
      kind: "colony",
      assetId: "red",
      x: 50,
      y: 58,
      scale: 1,
      rotation: 0,
      layer: 30
    }
  },
  spaceport: {
    label: "Raumhafen",
    source: "debug-spaceports.html",
    storageKey: "star-odyssey-spaceport-debug-layout",
    downloadName: "spaceport-layout.json",
    assetPaths: playerSpaceportAssetPaths,
    defaultPiece: {
      id: "spaceport",
      kind: "spaceport",
      assetId: "red",
      x: 50,
      y: 55,
      scale: 1,
      rotation: 0,
      layer: 30
    }
  }
};

const config = configs[pageKind];
const objectLayer = document.querySelector("#object-layer");
const stage = document.querySelector("#debug-stage");
const hexPolygons = document.querySelector("#hex-polygons");
const dummyPlanets = document.querySelector("#dummy-planets");
const spaceLines = document.querySelector("#space-lines");
const spacePoints = document.querySelector("#space-points");
const layoutVariantSelect = document.querySelector("#layout-variant");
const assetSelect = document.querySelector("#piece-asset");
const controls = {
  x: document.querySelector("#control-x"),
  y: document.querySelector("#control-y"),
  scale: document.querySelector("#control-scale"),
  rotation: document.querySelector("#control-rotation"),
  layer: document.querySelector("#control-layer")
};

const layoutVariants = {
  twoTop: {
    id: "twoTop",
    label: "Layout A - 2 oben / 1 unten",
    centers: [
      [282, 160],
      [438, 160],
      [360, 295]
    ]
  },
  oneTop: {
    id: "oneTop",
    label: "Layout B - 1 oben / 2 unten",
    centers: [
      [360, 150],
      [282, 285],
      [438, 285]
    ]
  }
};

const defaultLayout = {
  layoutVariant: "twoTop",
  piece: config.defaultPiece
};

let layout = loadLayout();
let dragState = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLayout() {
  const saved = localStorage.getItem(config.storageKey);
  if (!saved) return clone(defaultLayout);
  try {
    return normalizeLayout(JSON.parse(saved));
  } catch {
    return clone(defaultLayout);
  }
}

function normalizeLayout(value) {
  const next = clone(defaultLayout);
  next.layoutVariant = layoutVariants[value.layoutVariant] ? value.layoutVariant : next.layoutVariant;
  next.piece = { ...next.piece, ...(value.piece ?? {}) };
  next.piece.assetId = config.assetPaths[next.piece.assetId] ? next.piece.assetId : "red";
  return next;
}

function getAssetPath() {
  return config.assetPaths[layout.piece.assetId] ?? config.assetPaths.red;
}

function populateAssetSelect() {
  assetSelect.replaceChildren();
  for (const color of playerPieceColors) {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = `${color} (${config.assetPaths[color].split("/").pop()})`;
    assetSelect.append(option);
  }
}

function renderHexLayout() {
  const variant = layoutVariants[layout.layoutVariant] ?? layoutVariants.twoTop;
  const hexes = variant.centers.map(([cx, cy]) => getHexPoints(cx, cy));
  hexPolygons.replaceChildren();
  dummyPlanets.replaceChildren();
  spaceLines.replaceChildren();
  spacePoints.replaceChildren();

  variant.centers.forEach(([cx, cy], index) => {
    const planet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    planet.setAttribute("class", `debug-dummy-planet debug-dummy-planet--${index + 1}`);
    planet.setAttribute("cx", String(cx));
    planet.setAttribute("cy", String(cy));
    planet.setAttribute("r", "56");
    dummyPlanets.append(planet);
  });

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

  const wrapper = document.createElement("button");
  wrapper.type = "button";
  wrapper.className = `debug-object debug-object--${layout.piece.kind} is-selected`;
  wrapper.dataset.id = layout.piece.id;
  applyObjectStyle(wrapper);

  const image = document.createElement("img");
  image.src = getAssetPath();
  image.alt = config.label;
  wrapper.append(image);

  const label = document.createElement("span");
  label.textContent = config.label.slice(0, 1);
  wrapper.append(label);

  wrapper.addEventListener("pointerdown", startDrag);
  objectLayer.append(wrapper);
}

function applyObjectStyle(element) {
  element.style.left = `${layout.piece.x}%`;
  element.style.top = `${layout.piece.y}%`;
  element.style.zIndex = String(layout.piece.layer);
  element.style.transform = `translate(-50%, -50%) rotate(${layout.piece.rotation}deg) scale(${layout.piece.scale})`;
}

function updateRenderedObject() {
  const element = objectLayer.querySelector("[data-id]");
  if (element) applyObjectStyle(element);
}

function startDrag(event) {
  const target = event.currentTarget;
  target.setPointerCapture(event.pointerId);
  const rect = stage.getBoundingClientRect();
  dragState = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left - (layout.piece.x / 100) * rect.width,
    offsetY: event.clientY - rect.top - (layout.piece.y / 100) * rect.height
  };
  target.addEventListener("pointermove", onDrag);
  target.addEventListener("pointerup", stopDrag);
  target.addEventListener("pointercancel", stopDrag);
  syncControls();
}

function onDrag(event) {
  if (!dragState) return;
  const rect = stage.getBoundingClientRect();
  layout.piece.x = clamp(((event.clientX - rect.left - dragState.offsetX) / rect.width) * 100, 0, 100);
  layout.piece.y = clamp(((event.clientY - rect.top - dragState.offsetY) / rect.height) * 100, 0, 100);
  saveToLocalStorage();
  updateRenderedObject();
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
  document.querySelector("#selected-title").textContent = `${config.label} (${layout.piece.assetId})`;
  for (const [key, input] of Object.entries(controls)) {
    input.value = layout.piece[key];
  }
}

function syncSelects() {
  layoutVariantSelect.value = layout.layoutVariant;
  assetSelect.value = layout.piece.assetId;
}

function updateSelectedFromControls() {
  layout.piece.x = Number(controls.x.value);
  layout.piece.y = Number(controls.y.value);
  layout.piece.scale = Number(controls.scale.value);
  layout.piece.rotation = Number(controls.rotation.value);
  layout.piece.layer = Number(controls.layer.value);
  saveToLocalStorage();
  render();
}

function saveToLocalStorage() {
  localStorage.setItem(config.storageKey, JSON.stringify(layout));
}

function exportLayout() {
  const output = {
    generatedAt: new Date().toISOString(),
    source: config.source,
    pieceKind: pageKind,
    layoutVariant: layout.layoutVariant,
    coordinateSystem: {
      origin: "debug-stage top-left",
      x: "percent of stage width",
      y: "percent of stage height",
      scale: "CSS transform scale",
      rotation: "degrees",
      layer: "CSS z-index"
    },
    piece: {
      ...layout.piece,
      asset: getAssetPath()
    }
  };
  const json = JSON.stringify(output, null, 2);
  document.querySelector("#export-output").value = json;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = config.downloadName;
  link.click();
  URL.revokeObjectURL(url);
}

populateAssetSelect();
syncSelects();

layoutVariantSelect.addEventListener("change", (event) => {
  layout.layoutVariant = event.target.value;
  saveToLocalStorage();
  render();
});

assetSelect.addEventListener("change", (event) => {
  layout.piece.assetId = event.target.value;
  saveToLocalStorage();
  render();
  syncControls();
});

for (const input of Object.values(controls)) {
  input.addEventListener("input", updateSelectedFromControls);
}

document.querySelector("#reset-layout").addEventListener("click", () => {
  layout = clone(defaultLayout);
  saveToLocalStorage();
  syncSelects();
  render();
  syncControls();
});

document.querySelector("#save-layout").addEventListener("click", exportLayout);

render();
syncControls();
