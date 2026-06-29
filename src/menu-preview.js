import {
  defaultButtonLayout,
  menuButtonDefinitions,
  mergeDeep,
  renderMenuButtons,
} from "./menu-button-utils.js";

const layoutUrl = "./public/assets/ui/menu/processed/menu-preview-layout.json";
const buttonLayoutUrl = "./public/assets/ui/menu/processed/menu-button-layout.json";

const baseLayer = {
  x: 50,
  y: 50,
  width: 20,
  height: 20,
  scale: 1,
  opacity: 1,
  rotation: 0,
  mirrorX: false,
  mirrorY: false,
  visible: true,
};

const fallbackLayout = {
  background: { ...baseLayer, width: 100, height: 100 },
  stars_overlay: { ...baseLayer, width: 100, height: 100, opacity: 0.72 },
  planet: { ...baseLayer, x: 10, y: 78, width: 34, height: 46, scale: 1, opacity: 0.82 },
  galaxy: { ...baseLayer, x: 82, y: 76, width: 22, height: 22, opacity: 0.92 },
  frame_corner_top_left: { ...baseLayer, x: 3.1, y: 4, width: 14, height: 20 },
  frame_corner_top_right: { ...baseLayer, x: 96.9, y: 4, width: 14, height: 20, mirrorX: true },
  frame_corner_bottom_left: { ...baseLayer, x: 3.1, y: 96, width: 14, height: 20, mirrorY: true },
  frame_corner_bottom_right: { ...baseLayer, x: 96.9, y: 96, width: 14, height: 20, mirrorX: true, mirrorY: true },
  frame_top_edge: { ...baseLayer, x: 50, y: 2.4, width: 64, height: 5.2 },
  frame_bottom_edge: { ...baseLayer, x: 50, y: 97.6, width: 64, height: 5.2, mirrorY: true },
  frame_left_edge: { ...baseLayer, x: 1.6, y: 50, width: 4.6, height: 60 },
  frame_right_edge: { ...baseLayer, x: 98.4, y: 50, width: 4.6, height: 60, mirrorX: true },
  frame_top_deco: { ...baseLayer, x: 26, y: 3.2, width: 20, height: 7.5, opacity: 0.85 },
  frame_bottom_deco: { ...baseLayer, x: 74, y: 96.8, width: 20, height: 7.5, mirrorY: true, opacity: 0.85 },
  logo: { ...baseLayer, x: 50, y: 22, width: 42, height: 16, opacity: 1 },
  title_compass_emblem: { ...baseLayer, x: 50, y: 16, width: 18, height: 27, opacity: 0.5 },
  title_ring_overlay: { ...baseLayer, x: 50, y: 16, width: 21, height: 30, opacity: 0.35 },
  buttons_group: { ...baseLayer, x: 50, y: 61, width: 42, height: 42, scale: 0.92, spacing: 20 },
};

const layerLabels = {
  background: "Space Hintergrund",
  stars_overlay: "Sterne Overlay",
  planet: "Planet",
  galaxy: "Galaxie",
  frame_corner_top_left: "Ecke oben links",
  frame_corner_top_right: "Ecke oben rechts",
  frame_corner_bottom_left: "Ecke unten links",
  frame_corner_bottom_right: "Ecke unten rechts",
  frame_top_edge: "Rahmen oben",
  frame_bottom_edge: "Rahmen unten",
  frame_left_edge: "Rahmen links",
  frame_right_edge: "Rahmen rechts",
  frame_top_deco: "Deko oben",
  frame_bottom_deco: "Deko unten",
  logo: "Logo",
  title_compass_emblem: "Titel-Kompass",
  title_ring_overlay: "Titel-Ring",
  buttons_group: "Buttons-Gruppe",
};

const commonFields = [
  { name: "visible", type: "checkbox" },
  { name: "x", type: "number", min: -20, max: 120, step: 0.1 },
  { name: "y", type: "number", min: -20, max: 120, step: 0.1 },
  { name: "width", type: "number", min: 0, max: 140, step: 0.1 },
  { name: "height", type: "number", min: 0, max: 140, step: 0.1 },
  { name: "scale", type: "number", min: 0.05, max: 4, step: 0.01 },
  { name: "opacity", type: "number", min: 0, max: 1, step: 0.01 },
  { name: "rotation", type: "number", min: -180, max: 180, step: 1 },
  { name: "mirrorX", type: "checkbox" },
  { name: "mirrorY", type: "checkbox" },
];

const extraFields = {
  buttons_group: [{ name: "spacing", type: "number", min: 0, max: 80, step: 1 }],
};

const scene = document.querySelector("#menu-preview-scene");
const form = document.querySelector("#layout-form");
const output = document.querySelector("#layout-json");
const log = document.querySelector("#menu-preview-log");
const buttonList = document.querySelector("#menu-button-list");

let layout = structuredClone(fallbackLayout);
let buttonLayout = structuredClone(defaultButtonLayout);
let buttons = [];
let focusedButtonIndex = 0;

init();

async function init() {
  layout = await loadJson(layoutUrl, fallbackLayout);
  buttonLayout = await loadJson(buttonLayoutUrl, defaultButtonLayout);
  renderControls();
  buttons = renderMenuButtons(buttonList, buttonLayout, {
    definitions: menuButtonDefinitions,
    focusedIndex: focusedButtonIndex,
    responsive: true,
  });
  bindActions();
  applyLayout();
}

async function loadJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return structuredClone(fallback);
    return mergeDeep(fallback, await response.json());
  } catch {
    return structuredClone(fallback);
  }
}

function renderControls() {
  form.replaceChildren();
  for (const key of Object.keys(fallbackLayout)) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "menu-preview-fieldset";
    const legend = document.createElement("legend");
    legend.textContent = layerLabels[key] ?? key;
    fieldset.append(legend);
    for (const field of [...commonFields, ...(extraFields[key] ?? [])]) {
      fieldset.append(buildControl(key, field));
    }
    form.append(fieldset);
  }
}

function buildControl(group, field) {
  const label = document.createElement("label");
  label.className = `menu-preview-control menu-preview-control--${field.type}`;
  label.textContent = field.name;

  if (field.type === "checkbox") {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(layout[group][field.name]);
    checkbox.dataset.group = group;
    checkbox.dataset.field = field.name;
    label.append(checkbox);
    return label;
  }

  const range = document.createElement("input");
  range.type = "range";
  range.min = field.min;
  range.max = field.max;
  range.step = field.step;
  range.value = layout[group][field.name];
  range.dataset.group = group;
  range.dataset.field = field.name;

  const number = document.createElement("input");
  number.type = "number";
  number.min = field.min;
  number.max = field.max;
  number.step = field.step;
  number.value = layout[group][field.name];
  number.dataset.group = group;
  number.dataset.field = field.name;

  label.append(range, number);
  return label;
}

function bindActions() {
  form.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const { group, field } = input.dataset;
    if (!group || !field) return;
    const value = input.type === "checkbox" ? input.checked : Number(input.value);
    layout[group][field] = value;
    syncPairedInputs(group, field, value);
    applyLayout();
  });

  document.querySelector("#copy-layout").addEventListener("click", async () => {
    output.select();
    try {
      await navigator.clipboard.writeText(output.value);
      log.textContent = "Layout JSON wurde kopiert.";
    } catch {
      log.textContent = "Kopieren blockiert. Das JSON ist markiert und kann manuell kopiert werden.";
    }
  });

  document.querySelector("#reset-layout").addEventListener("click", () => {
    layout = structuredClone(fallbackLayout);
    renderControls();
    applyLayout();
    log.textContent = "Layout wurde zurückgesetzt.";
  });

  buttonList.addEventListener("click", (event) => {
    const button = event.target.closest(".menu-composite-button");
    if (!button) return;
    setFocusedButton(buttons.indexOf(button));
    log.textContent = `Preview-Aktion: ${button.textContent.trim()}`;
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedButton((focusedButtonIndex + 1) % buttons.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedButton((focusedButtonIndex - 1 + buttons.length) % buttons.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      buttons[focusedButtonIndex]?.click();
    }
  });
}

function syncPairedInputs(group, field, value) {
  for (const input of form.querySelectorAll(`[data-group="${group}"][data-field="${field}"]`)) {
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else if (Number(input.value) !== value) {
      input.value = value;
    }
  }
}

function applyLayout() {
  for (const [key, layer] of Object.entries(layout)) {
    const element = scene.querySelector(`[data-menu-layer="${key}"]`);
    if (!element) continue;
    applyLayerStyle(element, layer);
    if (key === "buttons_group") {
      buttonList.style.gap = `${layer.spacing ?? 20}px`;
    }
  }
  output.value = JSON.stringify(layout, null, 2);
}

function applyLayerStyle(element, layer) {
  element.style.display = layer.visible === false ? "none" : "";
  element.style.left = `${layer.x}%`;
  element.style.top = `${layer.y}%`;
  element.style.width = `${layer.width}%`;
  element.style.height = `${layer.height}%`;
  element.style.opacity = String(layer.opacity ?? 1);
  const scaleX = (layer.mirrorX ? -1 : 1) * (layer.scale ?? 1);
  const scaleY = (layer.mirrorY ? -1 : 1) * (layer.scale ?? 1);
  element.style.transform = `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg) scale(${scaleX}, ${scaleY})`;
}

function setFocusedButton(nextIndex) {
  focusedButtonIndex = nextIndex;
  buttons.forEach((button, index) => button.classList.toggle("is-focused", index === focusedButtonIndex));
}
