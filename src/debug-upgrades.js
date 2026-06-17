import { mothershipUpgradeSlots, upgradeMenuAssetPaths } from "./data/upgradeVisuals.js";

const debugViews = [
  {
    upgradeId: "cannon",
    exportKey: "cannons",
    labelPrefix: "K",
    title: "Bordkanonen",
    subtitle: "Alle aktuellen Kanonen-Slots im Zustand 6/6"
  },
  {
    upgradeId: "cargo",
    exportKey: "cargo",
    labelPrefix: "F",
    title: "Frachtmodule",
    subtitle: "Alle aktuellen Frachtmodul-Slots im Zustand 5/5"
  },
  {
    upgradeId: "drive",
    exportKey: "drives",
    labelPrefix: "A",
    title: "Antriebe",
    subtitle: "Alle aktuellen Antriebs-Slots im Zustand 6/6"
  }
];

const storageKey = "star-odyssey-upgrade-debug-layout";
const target = document.querySelector("#debug-upgrade-renderings");
const editorTarget = document.querySelector("#debug-upgrade-editor");
const slotState = new Map();
const slotElements = new Map();
let selectedSlotId = null;
let showLabels = true;
let exportTextArea = null;

initializeSlotState();
loadStoredLayout();
renderEditor();
renderDebugViews();
selectFirstSlot();
updateExportPreview();

function initializeSlotState() {
  for (const view of debugViews) {
    getSlotsForView(view.upgradeId).forEach((slot, index) => {
      const defaults = getDefaultSlotLayout(slot.id);
      slotState.set(slot.id, {
        id: slot.id,
        label: `${view.labelPrefix}${index + 1}`,
        type: slot.upgradeId,
        exportKey: view.exportKey,
        assetId: slot.assetId,
        asset: upgradeMenuAssetPaths.overlays[slot.assetId],
        minValue: slot.minValue,
        layer: slot.layer,
        widthPercent: defaults.widthPercent,
        xPercent: defaults.xPercent,
        yPercent: defaults.yPercent,
        scale: 1,
        z: slot.layer === "back" ? 50 + slot.minValue : 150 + slot.minValue
      });
    });
  }
}

function renderEditor() {
  editorTarget.replaceChildren();

  const panel = document.createElement("aside");
  panel.className = "debug-editor-panel";

  const heading = document.createElement("div");
  heading.className = "debug-editor-heading";
  heading.innerHTML = `
    <p>Editor</p>
    <h2>Overlay-Ausrichtung</h2>
    <span>Drag & Drop verschiebt Slots relativ zum Mutterschiff. Save exportiert die aktuellen Werte.</span>
  `;

  const selectedInfo = document.createElement("dl");
  selectedInfo.className = "debug-selected-info";
  selectedInfo.id = "debug-selected-info";

  const scaleControl = document.createElement("label");
  scaleControl.className = "debug-control";
  scaleControl.innerHTML = `
    <span>Skalierung</span>
    <input id="debug-scale-slider" type="range" min="0.2" max="2" step="0.01" value="1" />
    <input id="debug-scale-input" type="number" min="0.2" max="2" step="0.01" value="1" />
  `;

  const actionRow = document.createElement("div");
  actionRow.className = "debug-action-row";
  actionRow.innerHTML = `
    <button id="debug-layer-back" type="button">Hinter</button>
    <button id="debug-layer-front" type="button">Vor</button>
    <button id="debug-reset" type="button">Reset</button>
    <button id="debug-save" type="button">Save</button>
  `;

  const labelToggle = document.createElement("label");
  labelToggle.className = "debug-toggle";
  labelToggle.innerHTML = `
    <input id="debug-label-toggle" type="checkbox" checked />
    <span>Labels anzeigen</span>
  `;

  const loadBlock = document.createElement("div");
  loadBlock.className = "debug-load-block";
  loadBlock.innerHTML = `
    <label class="debug-control">
      <span>Layout laden</span>
      <input id="debug-load-file" type="file" accept="application/json,.json" />
    </label>
    <button id="debug-load-text" type="button">Text laden</button>
  `;

  exportTextArea = document.createElement("textarea");
  exportTextArea.id = "debug-export-output";
  exportTextArea.className = "debug-export-output";
  exportTextArea.rows = 10;
  exportTextArea.spellcheck = false;

  panel.append(heading, selectedInfo, scaleControl, actionRow, labelToggle, loadBlock, exportTextArea);
  editorTarget.append(panel);

  document.querySelector("#debug-scale-slider").addEventListener("input", (event) => {
    updateSelectedSlot({ scale: Number.parseFloat(event.target.value) });
  });
  document.querySelector("#debug-scale-input").addEventListener("input", (event) => {
    updateSelectedSlot({ scale: Number.parseFloat(event.target.value) });
  });
  document.querySelector("#debug-layer-front").addEventListener("click", () => moveSelectedLayer(10));
  document.querySelector("#debug-layer-back").addEventListener("click", () => moveSelectedLayer(-10));
  document.querySelector("#debug-reset").addEventListener("click", resetLayout);
  document.querySelector("#debug-save").addEventListener("click", saveLayout);
  document.querySelector("#debug-load-text").addEventListener("click", loadLayoutFromTextArea);
  document.querySelector("#debug-label-toggle").addEventListener("change", (event) => {
    showLabels = event.target.checked;
    document.body.classList.toggle("debug-labels-hidden", !showLabels);
  });
  document.querySelector("#debug-load-file").addEventListener("change", loadLayoutFromFile);
}

function renderDebugViews() {
  target.replaceChildren();
  slotElements.clear();

  for (const view of debugViews) {
    target.append(renderDebugCard(view));
  }

  syncAllSlots();
}

function renderDebugCard(view) {
  const card = document.createElement("section");
  card.className = "debug-upgrade-card";

  const title = document.createElement("h2");
  title.textContent = view.title;

  const subtitle = document.createElement("p");
  subtitle.textContent = view.subtitle;

  const panel = document.createElement("div");
  panel.className = "upgrade-ship-panel";
  panel.append(renderDebugMothership(view));

  card.append(title, subtitle, panel);
  return card;
}

function renderDebugMothership(view) {
  const visual = document.createElement("div");
  visual.className = "mothership-visual debug-mothership-visual";

  const shipImage = document.createElement("img");
  shipImage.className = "mothership-base";
  shipImage.src = upgradeMenuAssetPaths.mothership;
  shipImage.alt = "";

  visual.append(shipImage);

  getSlotsForView(view.upgradeId).forEach((slot) => {
    const state = slotState.get(slot.id);
    if (!state?.asset) return;

    const overlay = document.createElement("div");
    overlay.className = "mothership-overlay debug-upgrade-slot";
    overlay.dataset.slotId = slot.id;
    overlay.dataset.slotLabel = state.label;
    overlay.addEventListener("pointerdown", startDrag);
    overlay.addEventListener("click", () => selectSlot(slot.id));

    const image = document.createElement("img");
    image.className = "debug-upgrade-slot-image";
    image.src = state.asset;
    image.alt = "";
    overlay.append(image);

    visual.append(overlay);
    slotElements.set(slot.id, overlay);

    const label = document.createElement("span");
    label.className = "debug-upgrade-slot-label";
    label.textContent = state.label;
    overlay.append(label);
  });

  return visual;
}

function startDrag(event) {
  const slotId = event.currentTarget.dataset.slotId;
  const state = slotState.get(slotId);
  const overlay = slotElements.get(slotId);
  if (!state || !overlay) return;

  event.preventDefault();
  selectSlot(slotId);
  overlay.setPointerCapture(event.pointerId);
  overlay.classList.add("is-dragging");

  const startX = event.clientX;
  const startY = event.clientY;
  const startSlotX = state.xPercent;
  const startSlotY = state.yPercent;
  const rect = overlay.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);

  const onMove = (moveEvent) => {
    const nextX = startSlotX + ((moveEvent.clientX - startX) / width) * 100;
    const nextY = startSlotY + ((moveEvent.clientY - startY) / height) * 100;
    updateSlot(slotId, {
      xPercent: round(nextX),
      yPercent: round(nextY)
    });
  };

  const onEnd = () => {
    overlay.classList.remove("is-dragging");
    overlay.releasePointerCapture(event.pointerId);
    overlay.removeEventListener("pointermove", onMove);
    overlay.removeEventListener("pointerup", onEnd);
    overlay.removeEventListener("pointercancel", onEnd);
  };

  overlay.addEventListener("pointermove", onMove);
  overlay.addEventListener("pointerup", onEnd);
  overlay.addEventListener("pointercancel", onEnd);
}

function selectFirstSlot() {
  const firstSlot = mothershipUpgradeSlots.find((slot) => slotState.has(slot.id));
  if (firstSlot) selectSlot(firstSlot.id);
}

function selectSlot(slotId) {
  selectedSlotId = slotId;
  for (const [id, element] of slotElements.entries()) {
    if (id.includes(":")) continue;
    element.classList.toggle("is-selected", id === slotId);
  }
  updateEditor();
}

function updateEditor() {
  const state = slotState.get(selectedSlotId);
  const info = document.querySelector("#debug-selected-info");
  if (!state || !info) return;

  info.innerHTML = `
    <div><dt>Slot</dt><dd>${state.label} (${state.id})</dd></div>
    <div><dt>Typ</dt><dd>${state.type}</dd></div>
    <div><dt>X</dt><dd>${state.xPercent}%</dd></div>
    <div><dt>Y</dt><dd>${state.yPercent}%</dd></div>
    <div><dt>Skalierung</dt><dd>${state.scale}</dd></div>
    <div><dt>Z / Layer</dt><dd>${state.z} / ${getLayerName(state.z)}</dd></div>
  `;

  const slider = document.querySelector("#debug-scale-slider");
  const input = document.querySelector("#debug-scale-input");
  slider.value = state.scale;
  input.value = state.scale;
}

function updateSelectedSlot(patch) {
  if (!selectedSlotId) return;
  updateSlot(selectedSlotId, patch);
}

function updateSlot(slotId, patch) {
  const current = slotState.get(slotId);
  if (!current) return;
  const next = {
    ...current,
    ...patch
  };
  if (Number.isFinite(next.scale)) next.scale = clamp(round(next.scale), 0.2, 2);
  if (Number.isFinite(next.z)) next.z = Math.max(1, Math.round(next.z));
  slotState.set(slotId, next);
  syncSlot(slotId);
  if (slotId === selectedSlotId) updateEditor();
  updateExportPreview();
  localStorage.setItem(storageKey, JSON.stringify(buildExportPayload()));
}

function moveSelectedLayer(delta) {
  const state = slotState.get(selectedSlotId);
  if (!state) return;
  updateSelectedSlot({ z: state.z + delta });
}

function syncAllSlots() {
  for (const slotId of slotState.keys()) {
    syncSlot(slotId);
  }
}

function syncSlot(slotId) {
  const state = slotState.get(slotId);
  const overlay = slotElements.get(slotId);
  if (!state) return;

  if (overlay) {
    overlay.style.setProperty("--slot-width", `${state.widthPercent}%`);
    overlay.style.setProperty("--slot-x", `${state.xPercent}%`);
    overlay.style.setProperty("--slot-y", `${state.yPercent}%`);
    overlay.style.setProperty("--slot-scale", state.scale);
    overlay.style.setProperty("--slot-z", state.z);
  }
}

function resetLayout() {
  localStorage.removeItem(storageKey);
  slotState.clear();
  initializeSlotState();
  syncAllSlots();
  if (selectedSlotId && !slotState.has(selectedSlotId)) selectFirstSlot();
  updateEditor();
  updateExportPreview();
}

function saveLayout() {
  const payload = buildExportPayload();
  const serialized = JSON.stringify(payload, null, 2);
  exportTextArea.value = serialized;
  localStorage.setItem(storageKey, serialized);

  navigator.clipboard?.writeText(serialized).catch(() => {});

  const blob = new Blob([serialized], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "upgrade-overlay-layout.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function loadStoredLayout() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return;
  applyImportedLayout(stored);
}

function loadLayoutFromTextArea() {
  if (!exportTextArea?.value.trim()) return;
  applyImportedLayout(exportTextArea.value);
  syncAllSlots();
  updateEditor();
  updateExportPreview();
}

function loadLayoutFromFile(event) {
  const [file] = event.target.files ?? [];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    applyImportedLayout(String(reader.result ?? ""));
    syncAllSlots();
    updateEditor();
    updateExportPreview();
  });
  reader.readAsText(file);
}

function applyImportedLayout(rawValue) {
  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return;
  }

  const importedSlots = [
    ...(parsed.slots?.cannons ?? []),
    ...(parsed.slots?.cargo ?? []),
    ...(parsed.slots?.drives ?? [])
  ];

  for (const importedSlot of importedSlots) {
    const existing = [...slotState.values()].find((slot) => slot.id === importedSlot.id || slot.label === importedSlot.id);
    if (!existing) continue;
    updateSlot(existing.id, {
      xPercent: Number.parseFloat(importedSlot.x),
      yPercent: Number.parseFloat(importedSlot.y),
      widthPercent: Number.parseFloat(importedSlot.widthPercent ?? existing.widthPercent),
      scale: Number.parseFloat(importedSlot.scale),
      z: Number.parseInt(importedSlot.z, 10)
    });
  }
}

function updateExportPreview() {
  if (!exportTextArea) return;
  exportTextArea.value = JSON.stringify(buildExportPayload(), null, 2);
}

function buildExportPayload() {
  const groupedSlots = {
    cannons: [],
    cargo: [],
    drives: []
  };

  for (const state of [...slotState.values()].sort((first, second) => first.minValue - second.minValue)) {
    groupedSlots[state.exportKey].push({
      id: state.label,
      slotId: state.id,
      type: state.type,
      assetId: state.assetId,
      asset: state.asset,
      x: state.xPercent,
      y: state.yPercent,
      unit: "translate-percent-of-overlay",
      widthPercent: state.widthPercent,
      scale: state.scale,
      z: state.z,
      layer: getLayerName(state.z),
      minValue: state.minValue
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    source: "debug-upgrades.html",
    coordinateSystem: {
      origin: "mothership-visual center",
      x: "CSS translate percentage relative to the overlay width",
      y: "CSS translate percentage relative to the overlay height",
      widthPercent: "overlay width as percentage of mothership visual width",
      zBase: "mothership base image uses z-index 100 in this debug editor"
    },
    slots: groupedSlots
  };
}

function getSlotsForView(upgradeId) {
  return mothershipUpgradeSlots
    .filter((slot) => slot.upgradeId === upgradeId)
    .sort((first, second) => first.minValue - second.minValue);
}

function getDefaultSlotLayout(slotId) {
  const style = getSlotCssText(slotId);
  const widthMatch = style.match(/width:\s*([\d.]+)%/);
  const translateMatch = style.match(/translate\(\s*(-?[\d.]+)%\s*,\s*(-?[\d.]+)%\s*\)/);

  return {
    widthPercent: widthMatch ? Number.parseFloat(widthMatch[1]) : 14,
    xPercent: translateMatch ? Number.parseFloat(translateMatch[1]) : -50,
    yPercent: translateMatch ? Number.parseFloat(translateMatch[2]) : -50
  };
}

function getSlotCssText(slotId) {
  const selector = `.mothership-overlay--${slotId}`;
  for (const styleSheet of document.styleSheets) {
    let rules;
    try {
      rules = styleSheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of rules) {
      if (rule.selectorText === selector) {
        return rule.style.cssText;
      }
    }
  }
  return "";
}

function getLayerName(z) {
  if (z < 100) return "back";
  if (z > 100) return "front";
  return "base";
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
