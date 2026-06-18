import {
  playerColonyAssetPaths,
  playerSpaceportAssetPaths
} from "./data/playerPieceVisuals.js";

const pageKind = document.body.dataset.pieceKind === "spaceport" ? "spaceport" : "colony";
const configs = {
  colony: {
    label: "Kolonie",
    type: "colony-layout",
    source: "debug-colonies.html",
    storageKey: "star-odyssey-colony-position-debug-layout",
    downloadName: "colony-layout.json",
    assetPath: playerColonyAssetPaths.red
  },
  spaceport: {
    label: "Raumhafen",
    type: "spaceport-layout",
    source: "debug-spaceports.html",
    storageKey: "star-odyssey-spaceport-position-debug-layout",
    downloadName: "spaceport-layout.json",
    assetPath: playerSpaceportAssetPaths.red
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
const controls = {
  x: document.querySelector("#control-x"),
  y: document.querySelector("#control-y"),
  scale: document.querySelector("#control-scale"),
  rotation: document.querySelector("#control-rotation"),
  layer: document.querySelector("#control-layer")
};

const layoutVariants = {
  layoutA: {
    id: "layoutA",
    label: "Layout A - 2 oben / 1 unten",
    centers: [
      [282, 160],
      [438, 160],
      [360, 295]
    ],
    defaults: [
      [50, 31],
      [44.6, 43.8],
      [55.4, 43.8]
    ]
  },
  layoutB: {
    id: "layoutB",
    label: "Layout B - 1 oben / 2 unten",
    centers: [
      [360, 150],
      [282, 285],
      [438, 285]
    ],
    defaults: [
      [44.6, 41.8],
      [55.4, 41.8],
      [50, 54.8]
    ]
  }
};

const defaultLayout = {
  activeLayout: "layoutA",
  layoutA: {
    positions: createDefaultPositions("layoutA")
  },
  layoutB: {
    positions: createDefaultPositions("layoutB")
  }
};

let layout = loadLayout();
let selectedId = `${pageKind}-site-1`;
let dragState = null;

function createDefaultPositions(layoutId) {
  return layoutVariants[layoutId].defaults.map(([x, y], index) => ({
    id: `${pageKind}-site-${index + 1}`,
    x,
    y,
    scale: 1,
    rotation: 0,
    layer: 30 + index
  }));
}

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
  next.activeLayout = layoutVariants[value.activeLayout] ? value.activeLayout : next.activeLayout;

  for (const layoutId of Object.keys(layoutVariants)) {
    next[layoutId].positions = next[layoutId].positions.map((position, index) => ({
      ...position,
      ...(value[layoutId]?.positions?.[index] ?? {}),
      id: `${pageKind}-site-${index + 1}`
    }));
  }

  return next;
}

function getActivePositions() {
  return layout[layout.activeLayout].positions;
}

function getPositionById(id) {
  return getActivePositions().find((position) => position.id === id) ?? getActivePositions()[0];
}

function renderHexLayout() {
  const variant = layoutVariants[layout.activeLayout] ?? layoutVariants.layoutA;
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

  for (const position of getActivePositions()) {
    const wrapper = document.createElement("button");
    wrapper.type = "button";
    wrapper.className = `debug-object debug-object--${pageKind}${position.id === selectedId ? " is-selected" : ""}`;
    wrapper.dataset.id = position.id;
    applyObjectStyle(wrapper, position);

    const image = document.createElement("img");
    image.src = config.assetPath;
    image.alt = `${config.label} Position ${getPositionNumber(position.id)}`;
    wrapper.append(image);

    const label = document.createElement("span");
    label.textContent = String(getPositionNumber(position.id));
    wrapper.append(label);

    wrapper.addEventListener("pointerdown", startDrag);
    wrapper.addEventListener("click", () => {
      selectedId = position.id;
      updateSelectionClass();
      syncControls();
    });
    objectLayer.append(wrapper);
  }
}

function getPositionNumber(id) {
  return Number(id.match(/-(\d+)$/)?.[1] ?? 1);
}

function applyObjectStyle(element, position) {
  element.style.left = `${position.x}%`;
  element.style.top = `${position.y}%`;
  element.style.zIndex = String(position.layer);
  element.style.transform = `translate(-50%, -50%) rotate(${position.rotation}deg) scale(${position.scale})`;
}

function updateRenderedObject(id) {
  const position = getPositionById(id);
  const element = objectLayer.querySelector(`[data-id="${id}"]`);
  if (position && element) applyObjectStyle(element, position);
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
  const position = getPositionById(selectedId);
  dragState = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left - (position.x / 100) * rect.width,
    offsetY: event.clientY - rect.top - (position.y / 100) * rect.height
  };
  target.addEventListener("pointermove", onDrag);
  target.addEventListener("pointerup", stopDrag);
  target.addEventListener("pointercancel", stopDrag);
  updateSelectionClass();
  syncControls();
}

function onDrag(event) {
  if (!dragState) return;
  const position = getPositionById(selectedId);
  const rect = stage.getBoundingClientRect();
  position.x = clamp(((event.clientX - rect.left - dragState.offsetX) / rect.width) * 100, 0, 100);
  position.y = clamp(((event.clientY - rect.top - dragState.offsetY) / rect.height) * 100, 0, 100);
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
  const position = getPositionById(selectedId);
  document.querySelector("#selected-title").textContent = `${config.label} Position ${getPositionNumber(position.id)}`;
  for (const [key, input] of Object.entries(controls)) {
    input.value = position[key];
  }
}

function syncSelects() {
  layoutVariantSelect.value = layout.activeLayout;
}

function updateSelectedFromControls() {
  const position = getPositionById(selectedId);
  position.x = Number(controls.x.value);
  position.y = Number(controls.y.value);
  position.scale = Number(controls.scale.value);
  position.rotation = Number(controls.rotation.value);
  position.layer = Number(controls.layer.value);
  saveToLocalStorage();
  render();
}

function saveToLocalStorage() {
  localStorage.setItem(config.storageKey, JSON.stringify(layout));
}

function toExportPosition(position) {
  return {
    id: position.id,
    x: position.x,
    y: position.y,
    scale: position.scale,
    rotation: position.rotation,
    z: position.layer
  };
}

function exportLayout() {
  const output = {
    type: config.type,
    generatedAt: new Date().toISOString(),
    source: config.source,
    coordinateSystem: {
      origin: "debug-stage top-left",
      x: "percent of stage width",
      y: "percent of stage height",
      scale: "CSS transform scale",
      rotation: "degrees",
      z: "CSS z-index"
    },
    referenceAsset: config.assetPath,
    layoutA: {
      positions: layout.layoutA.positions.map(toExportPosition)
    },
    layoutB: {
      positions: layout.layoutB.positions.map(toExportPosition)
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

layoutVariantSelect.addEventListener("change", (event) => {
  layout.activeLayout = event.target.value;
  selectedId = getActivePositions()[0].id;
  saveToLocalStorage();
  render();
  syncControls();
});

for (const input of Object.values(controls)) {
  input.addEventListener("input", updateSelectedFromControls);
}

document.querySelector("#reset-layout").addEventListener("click", () => {
  layout = clone(defaultLayout);
  selectedId = getActivePositions()[0].id;
  saveToLocalStorage();
  syncSelects();
  render();
  syncControls();
});

document.querySelector("#save-layout").addEventListener("click", exportLayout);

syncSelects();
render();
syncControls();
