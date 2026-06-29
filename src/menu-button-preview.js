import {
  applyButtonLayout,
  defaultButtonLayout,
  menuButtonDefinitions,
  mergeDeep,
  renderMenuButtons,
} from "./menu-button-utils.js";

const buttonLayoutUrl = "./public/assets/ui/menu/processed/menu-button-layout.json";
const buttonLayoutDownloadName = "star-odyssey-menu-button-layout.json";

const controlGroups = [
  {
    key: "component",
    label: "Komponente",
    fields: [
      ["x", 0, 1200, 1],
      ["y", 0, 600, 1],
      ["scale", 0.2, 2.4, 0.01],
      ["width", 300, 1200, 1],
      ["height", 50, 220, 1],
    ],
  },
  {
    key: "plate",
    label: "Button-Rahmen",
    fields: [
      ["x", 0, 760, 1],
      ["y", -30, 160, 1],
      ["width", 200, 1000, 1],
      ["height", 40, 220, 1],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "hoverPlate",
    label: "Hover-Rahmen",
    fields: [
      ["x", 0, 760, 1],
      ["y", -30, 160, 1],
      ["width", 200, 1000, 1],
      ["height", 40, 220, 1],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "iconRing",
    label: "Icon-Ring",
    fields: [
      ["x", 0, 240, 1],
      ["y", 0, 140, 1],
      ["scale", 0.2, 2, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "icon",
    label: "Icon",
    fields: [
      ["x", 0, 240, 1],
      ["y", 0, 140, 1],
      ["scale", 0.2, 2, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "text",
    label: "Text",
    fields: [
      ["x", 180, 650, 1],
      ["y", 0, 140, 1],
      ["fontSize", 18, 70, 1],
      ["fontWeight", 300, 1000, 50],
      ["glow", 0, 2, 0.05],
    ],
    colorFields: ["color"],
  },
  {
    key: "sideGemLeft",
    label: "Gem links",
    fields: [
      ["x", -40, 120, 1],
      ["y", 0, 140, 1],
      ["scale", 0.1, 2, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "sideGemRight",
    label: "Gem rechts",
    fields: [
      ["x", 620, 820, 1],
      ["y", 0, 140, 1],
      ["scale", 0.1, 2, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
  {
    key: "separatorGlow",
    label: "Glow/Separator",
    fields: [
      ["x", 0, 760, 1],
      ["y", -30, 60, 1],
      ["scaleX", 0.1, 2, 0.01],
      ["scaleY", 0.1, 3, 0.01],
      ["opacity", 0, 1, 0.01],
    ],
  },
];

const primary = document.querySelector("#button-lab-primary");
const variants = document.querySelector("#button-lab-variants");
const form = document.querySelector("#button-layout-form");
const output = document.querySelector("#button-layout-json");
const log = document.querySelector("#button-preview-log");

let layout = structuredClone(defaultButtonLayout);
let focusedIndex = 0;
let primaryButtons = [];
let variantButtons = [];

init();

async function init() {
  layout = await loadLayout();
  renderControls();
  renderButtons();
  bindActions();
  applyLayout();
}

async function loadLayout() {
  try {
    const response = await fetch(buttonLayoutUrl, { cache: "no-store" });
    if (!response.ok) return structuredClone(defaultButtonLayout);
    return mergeDeep(defaultButtonLayout, await response.json());
  } catch {
    return structuredClone(defaultButtonLayout);
  }
}

function renderControls() {
  form.replaceChildren();
  for (const group of controlGroups) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "button-lab-fieldset";
    const legend = document.createElement("legend");
    legend.textContent = group.label;
    fieldset.append(legend);
    for (const [field, min, max, step] of group.fields) {
      fieldset.append(buildNumberControl(group.key, field, min, max, step));
    }
    for (const field of group.colorFields ?? []) {
      fieldset.append(buildColorControl(group.key, field));
    }
    form.append(fieldset);
  }
}

function buildNumberControl(group, field, min, max, step) {
  const value = layout[group][field];
  const label = document.createElement("label");
  label.className = "button-lab-control";
  label.textContent = field;

  const range = document.createElement("input");
  range.type = "range";
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = value;
  range.dataset.group = group;
  range.dataset.field = field;

  const number = document.createElement("input");
  number.type = "number";
  number.min = min;
  number.max = max;
  number.step = step;
  number.value = value;
  number.dataset.group = group;
  number.dataset.field = field;

  label.append(range, number);
  return label;
}

function buildColorControl(group, field) {
  const label = document.createElement("label");
  label.className = "button-lab-control button-lab-control--color";
  label.textContent = field;
  const input = document.createElement("input");
  input.type = "color";
  input.value = layout[group][field] ?? "#fff7ed";
  input.dataset.group = group;
  input.dataset.field = field;
  label.append(input);
  return label;
}

function renderButtons() {
  primaryButtons = renderMenuButtons(primary, layout, {
    definitions: [menuButtonDefinitions[focusedIndex]],
    focusedIndex: 0,
  });

  variants.replaceChildren();
  variantButtons = [];
  for (const [index, definition] of menuButtonDefinitions.entries()) {
    const wrapper = document.createElement("div");
    wrapper.className = "button-lab-variant";
    const label = document.createElement("span");
    label.textContent = definition.label;
    const mount = document.createElement("div");
    mount.className = "button-lab-variant-preview";
    const [button] = renderMenuButtons(mount, layout, {
      definitions: [definition],
      focusedIndex: index === focusedIndex ? 0 : -1,
    });
    button.addEventListener("click", () => setFocused(index));
    wrapper.append(label, mount);
    variants.append(wrapper);
    variantButtons.push(button);
  }
}

function bindActions() {
  form.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const { group, field } = input.dataset;
    if (!group || !field) return;
    layout[group][field] = input.type === "color" ? input.value : Number(input.value);
    syncPairedInputs(group, field, layout[group][field]);
    applyLayout();
  });

  document.querySelector("#copy-button-layout").addEventListener("click", async () => {
    output.select();
    try {
      await navigator.clipboard.writeText(output.value);
      log.textContent = "Button-Layout JSON wurde kopiert.";
    } catch {
      log.textContent = "Kopieren blockiert. Das JSON ist markiert und kann manuell kopiert werden.";
    }
  });

  document.querySelector("#apply-button-layout").addEventListener("click", () => {
    try {
      layout = mergeDeep(defaultButtonLayout, JSON.parse(output.value));
      renderControls();
      renderButtons();
      applyLayout();
      log.textContent = "Button-Layout JSON wurde angewendet.";
    } catch (error) {
      log.textContent = `JSON konnte nicht angewendet werden: ${error.message}`;
    }
  });

  document.querySelector("#download-button-layout").addEventListener("click", () => {
    downloadJson(buttonLayoutDownloadName, layout);
    log.textContent = `${buttonLayoutDownloadName} wurde vorbereitet.`;
  });

  document.querySelector("#reset-button-layout").addEventListener("click", () => {
    layout = structuredClone(defaultButtonLayout);
    renderControls();
    renderButtons();
    applyLayout();
    log.textContent = "Button-Layout wurde zurückgesetzt.";
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocused((focusedIndex + 1) % menuButtonDefinitions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocused((focusedIndex - 1 + menuButtonDefinitions.length) % menuButtonDefinitions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      log.textContent = `Preview-Aktion: ${menuButtonDefinitions[focusedIndex].label}`;
    }
  });
}

function syncPairedInputs(group, field, value) {
  for (const input of form.querySelectorAll(`[data-group="${group}"][data-field="${field}"]`)) {
    if (input.value !== String(value)) input.value = value;
  }
}

function applyLayout() {
  const component = layout.component;
  primary.style.left = `${component.x}px`;
  primary.style.top = `${component.y}px`;
  primary.style.width = `${component.width}px`;
  primary.style.height = `${component.height}px`;
  primary.style.transform = `translate(-50%, -50%) scale(${component.scale})`;

  for (const button of [...primaryButtons, ...variantButtons]) {
    applyButtonLayout(button, layout);
  }
  output.value = JSON.stringify(layout, null, 2);
}

function setFocused(index) {
  focusedIndex = index;
  renderButtons();
  applyLayout();
  log.textContent = `Aktiver Beispielbutton: ${menuButtonDefinitions[index].label}`;
}

function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
