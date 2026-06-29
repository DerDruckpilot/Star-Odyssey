const layoutUrl = "./public/assets/ui/menu/processed/menu-preview-layout.json";

const fallbackLayout = {
  logo: { x: 50, y: 18, scale: 0.62 },
  buttons: { x: 50, y: 57, scale: 0.74, spacing: 2.1 },
  frame: { inset: 1.35, scale: 1 },
  planet: { x: 9, y: 78, scale: 0.58, opacity: 0.82 },
  galaxy: { x: 84, y: 73, scale: 0.34, opacity: 0.92 },
  titleOrnament: { x: 50, y: 17.5, scale: 0.68, opacity: 0.46 },
  stars: { opacity: 0.72 },
};

const controls = [
  {
    key: "logo",
    label: "Logo",
    fields: [
      ["x", 20, 80, 0.1],
      ["y", 5, 45, 0.1],
      ["scale", 0.35, 1.8, 0.01],
    ],
  },
  {
    key: "buttons",
    label: "Buttons-Gruppe",
    fields: [
      ["x", 20, 80, 0.1],
      ["y", 25, 85, 0.1],
      ["scale", 0.45, 1.55, 0.01],
      ["spacing", 0.5, 6, 0.1],
    ],
  },
  {
    key: "frame",
    label: "Rahmen",
    fields: [
      ["inset", 0, 5, 0.05],
      ["scale", 0.85, 1.12, 0.01],
    ],
  },
  {
    key: "planet",
    label: "Planet",
    fields: [
      ["x", -10, 40, 0.1],
      ["y", 45, 110, 0.1],
      ["scale", 0.15, 1.15, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "galaxy",
    label: "Galaxie",
    fields: [
      ["x", 55, 110, 0.1],
      ["y", 45, 110, 0.1],
      ["scale", 0.1, 0.95, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "titleOrnament",
    label: "Titelornament",
    fields: [
      ["x", 20, 80, 0.1],
      ["y", 5, 45, 0.1],
      ["scale", 0.25, 1.6, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "stars",
    label: "Sterne",
    fields: [["opacity", 0, 1, 0.01]],
  },
];

const cssVars = {
  logo: { x: "--logo-x", y: "--logo-y", scale: "--logo-scale" },
  buttons: { x: "--buttons-x", y: "--buttons-y", scale: "--buttons-scale", spacing: "--buttons-spacing" },
  frame: { inset: "--frame-inset", scale: "--frame-scale" },
  planet: { x: "--planet-x", y: "--planet-y", scale: "--planet-scale", opacity: "--planet-opacity" },
  galaxy: { x: "--galaxy-x", y: "--galaxy-y", scale: "--galaxy-scale", opacity: "--galaxy-opacity" },
  titleOrnament: {
    x: "--title-ornament-x",
    y: "--title-ornament-y",
    scale: "--title-ornament-scale",
    opacity: "--title-ornament-opacity",
  },
  stars: { opacity: "--stars-opacity" },
};

const scene = document.querySelector("#menu-preview-scene");
const form = document.querySelector("#layout-form");
const output = document.querySelector("#layout-json");
const log = document.querySelector("#menu-preview-log");
const buttons = Array.from(document.querySelectorAll(".menu-preview-button"));
let layout = structuredClone(fallbackLayout);
let focusedButtonIndex = 0;

init();

async function init() {
  layout = await loadLayout();
  renderControls();
  applyLayout();
  bindActions();
}

async function loadLayout() {
  try {
    const response = await fetch(layoutUrl, { cache: "no-store" });
    if (!response.ok) return structuredClone(fallbackLayout);
    return mergeLayout(fallbackLayout, await response.json());
  } catch {
    return structuredClone(fallbackLayout);
  }
}

function mergeLayout(base, incoming) {
  const merged = structuredClone(base);
  for (const [group, values] of Object.entries(incoming ?? {})) {
    if (!merged[group]) continue;
    merged[group] = { ...merged[group], ...values };
  }
  return merged;
}

function renderControls() {
  form.replaceChildren();
  for (const group of controls) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "menu-preview-fieldset";
    const legend = document.createElement("legend");
    legend.textContent = group.label;
    fieldset.append(legend);
    for (const [field, min, max, step] of group.fields) {
      const value = layout[group.key][field];
      const label = document.createElement("label");
      label.className = "menu-preview-control";
      label.textContent = field;

      const range = document.createElement("input");
      range.type = "range";
      range.min = min;
      range.max = max;
      range.step = step;
      range.value = value;
      range.dataset.group = group.key;
      range.dataset.field = field;

      const number = document.createElement("input");
      number.type = "number";
      number.min = min;
      number.max = max;
      number.step = step;
      number.value = value;
      number.dataset.group = group.key;
      number.dataset.field = field;

      label.append(range, number);
      fieldset.append(label);
    }
    form.append(fieldset);
  }
}

function bindActions() {
  form.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const { group, field } = input.dataset;
    if (!group || !field) return;
    const value = Number(input.value);
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

  for (const button of buttons) {
    button.addEventListener("click", () => {
      setFocusedButton(buttons.indexOf(button));
      log.textContent = `Preview-Aktion: ${button.textContent.trim()}`;
    });
  }

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
    if (Number(input.value) !== value) input.value = value;
  }
}

function applyLayout() {
  for (const [group, fields] of Object.entries(cssVars)) {
    for (const [field, variableName] of Object.entries(fields)) {
      scene.style.setProperty(variableName, layout[group][field]);
    }
  }
  output.value = JSON.stringify(layout, null, 2);
}

function setFocusedButton(nextIndex) {
  focusedButtonIndex = nextIndex;
  buttons.forEach((button, index) => button.classList.toggle("is-focused", index === focusedButtonIndex));
}
