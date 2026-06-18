import { outpostAssetPaths, tradeStationAssetPaths } from "./data/outpostVisuals.js";

const storageKey = "star-odyssey-outpost-debug-layout";
const objectLayer = document.querySelector("#object-layer");
const stage = document.querySelector("#debug-stage");
const controls = {
  x: document.querySelector("#control-x"),
  y: document.querySelector("#control-y"),
  scale: document.querySelector("#control-scale"),
  rotation: document.querySelector("#control-rotation"),
  layer: document.querySelector("#control-layer")
};

const defaultLayout = {
  outpost: {
    id: "outpost",
    kind: "outpost",
    assetId: "traders",
    x: 50,
    y: 47,
    scale: 1,
    rotation: 0,
    layer: 20
  },
  stations: [
    {
      id: "station-1",
      kind: "tradeStation",
      assetId: "red",
      x: 43,
      y: 68,
      scale: 0.54,
      rotation: 0,
      layer: 30
    },
    {
      id: "station-2",
      kind: "tradeStation",
      assetId: "blue",
      x: 57,
      y: 68,
      scale: 0.54,
      rotation: 0,
      layer: 31
    }
  ],
  stationCount: 2
};

let layout = loadLayout();
let selectedId = "outpost";
let dragState = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLayout() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return clone(defaultLayout);
  try {
    return { ...clone(defaultLayout), ...JSON.parse(saved) };
  } catch {
    return clone(defaultLayout);
  }
}

function getObjects() {
  return [layout.outpost, ...layout.stations.slice(0, Number(layout.stationCount))];
}

function getObjectById(id) {
  return [layout.outpost, ...layout.stations].find((item) => item.id === id);
}

function getAssetPath(item) {
  if (item.kind === "outpost") return outpostAssetPaths[item.assetId] ?? outpostAssetPaths.traders;
  return tradeStationAssetPaths[item.assetId] ?? tradeStationAssetPaths.red;
}

function populateSelect(select, options, selectedValue) {
  select.replaceChildren();
  for (const [id, path] of Object.entries(options)) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${id} (${path.split("/").pop()})`;
    select.append(option);
  }
  select.value = selectedValue;
}

function render() {
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
    label.textContent = item.id === "outpost" ? "O" : item.id.replace("station-", "S");
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
    ? `${item.id} (${item.kind})`
    : "Nichts ausgewählt";
  for (const [key, input] of Object.entries(controls)) {
    input.disabled = !item;
    input.value = item ? item[key === "layer" ? "layer" : key] : "";
  }
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
  const output = {
    generatedAt: new Date().toISOString(),
    source: "debug-outposts.html",
    coordinateSystem: {
      origin: "debug-stage top-left",
      x: "percent of stage width",
      y: "percent of stage height",
      scale: "CSS transform scale",
      rotation: "degrees",
      layer: "CSS z-index"
    },
    outpost: {
      ...layout.outpost,
      asset: getAssetPath(layout.outpost)
    },
    tradeStations: layout.stations.map((station) => ({
      ...station,
      asset: getAssetPath(station)
    }))
  };
  const json = JSON.stringify(output, null, 2);
  document.querySelector("#export-output").value = json;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "outpost-layout.json";
  link.click();
  URL.revokeObjectURL(url);
}

populateSelect(document.querySelector("#outpost-asset"), outpostAssetPaths, layout.outpost.assetId);
populateSelect(document.querySelector("#station-asset-1"), tradeStationAssetPaths, layout.stations[0].assetId);
populateSelect(document.querySelector("#station-asset-2"), tradeStationAssetPaths, layout.stations[1].assetId);
document.querySelector("#station-count").value = String(layout.stationCount);

document.querySelector("#outpost-asset").addEventListener("change", (event) => {
  layout.outpost.assetId = event.target.value;
  saveToLocalStorage();
  render();
});
document.querySelector("#station-asset-1").addEventListener("change", (event) => {
  layout.stations[0].assetId = event.target.value;
  saveToLocalStorage();
  render();
});
document.querySelector("#station-asset-2").addEventListener("change", (event) => {
  layout.stations[1].assetId = event.target.value;
  saveToLocalStorage();
  render();
});
document.querySelector("#station-count").addEventListener("change", (event) => {
  layout.stationCount = Number(event.target.value);
  saveToLocalStorage();
  render();
});
for (const input of Object.values(controls)) {
  input.addEventListener("input", updateSelectedFromControls);
}
document.querySelector("#reset-layout").addEventListener("click", () => {
  layout = clone(defaultLayout);
  selectedId = "outpost";
  saveToLocalStorage();
  render();
  syncControls();
});
document.querySelector("#save-layout").addEventListener("click", exportLayout);

render();
syncControls();
