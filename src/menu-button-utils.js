export const buttonAssets = {
  plate: "./public/assets/ui/menu/processed/buttons/button_main_master.png",
  hover: "./public/assets/ui/menu/processed/buttons/button_main_hover.png",
  pressed: "./public/assets/ui/menu/processed/buttons/button_main_pressed.png",
  disabled: "./public/assets/ui/menu/processed/buttons/button_main_disabled.png",
  iconRing: "./public/assets/ui/menu/processed/buttons/button_icon_ring.png",
  sideGemLeft: "./public/assets/ui/menu/processed/buttons/button_side_gem_left.png",
  sideGemRight: "./public/assets/ui/menu/processed/buttons/button_side_gem_right.png",
  separatorGlow: "./public/assets/ui/menu/processed/buttons/button_separator_glow.png",
};

export const menuButtonDefinitions = [
  {
    id: "newGame",
    label: "Neues Spiel",
    icon: "./public/assets/ui/menu/processed/icons/icon_new_game.png",
  },
  {
    id: "loadGame",
    label: "Spiel laden",
    icon: "./public/assets/ui/menu/processed/icons/icon_load_game.png",
  },
  {
    id: "quitGame",
    label: "Spiel beenden",
    icon: "./public/assets/ui/menu/processed/icons/icon_quit_game.png",
  },
  {
    id: "settings",
    label: "Einstellungen",
    icon: "./public/assets/ui/menu/processed/icons/icon_settings.png",
  },
];

export const defaultButtonLayout = {
  basis: { width: 1920, height: 1080 },
  component: { x: 452, y: 180, width: 760, height: 118, scale: 1 },
  plate: { x: 380, y: 59, width: 760, height: 118, opacity: 1 },
  hoverPlate: { x: 380, y: 59, width: 760, height: 118, opacity: 0 },
  iconRing: { x: 63, y: 66, width: 86, height: 86, scale: 1.48, opacity: 0.92 },
  icon: { x: 63, y: 66, width: 44, height: 44, scale: 1.77, opacity: 0.95 },
  text: {
    x: 379,
    y: 69,
    fontSize: 32,
    fontWeight: 600,
    color: "#fff7ed",
    glow: 0.7,
  },
  sideGemLeft: { x: -15, y: 66, width: 50, height: 66, scale: 2, opacity: 0.88 },
  sideGemRight: { x: 693, y: 65, width: 50, height: 66, scale: 1.49, opacity: 0.88 },
  separatorGlow: { x: 380, y: -6, width: 540, height: 16, scaleX: 1.14, scaleY: 1.56, opacity: 0.84 },
};

export function mergeDeep(base, incoming) {
  const merged = structuredClone(base);
  for (const [key, value] of Object.entries(incoming ?? {})) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = { ...merged[key], ...value };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export function buildMenuButton(definition) {
  const button = document.createElement("button");
  button.className = "menu-composite-button";
  button.type = "button";
  button.dataset.action = definition.id;
  button.append(
    buildImageLayer("plate", buttonAssets.plate),
    buildImageLayer("hoverPlate", buttonAssets.hover),
    buildImageLayer("sideGemLeft", buttonAssets.sideGemLeft),
    buildImageLayer("sideGemRight", buttonAssets.sideGemRight),
    buildImageLayer("separatorGlow", buttonAssets.separatorGlow),
    buildImageLayer("iconRing", buttonAssets.iconRing),
    buildImageLayer("icon", definition.icon),
    buildTextLayer(definition.label),
  );
  return button;
}

export function renderMenuButtons(container, layout, options = {}) {
  const definitions = options.definitions ?? menuButtonDefinitions;
  container.replaceChildren();
  const buttons = definitions.map((definition, index) => {
    const button = buildMenuButton(definition);
    button.classList.toggle("is-focused", index === (options.focusedIndex ?? 0));
    applyButtonLayout(button, layout, options);
    container.append(button);
    return button;
  });
  return buttons;
}

export function applyButtonLayout(button, layout, options = {}) {
  const component = layout.component;
  const responsive = Boolean(options.responsive);
  button.style.width = responsive ? "100%" : `${component.width}px`;
  button.style.height = responsive ? "auto" : `${component.height}px`;
  button.style.aspectRatio = `${component.width} / ${component.height}`;
  button.style.setProperty("--button-focus-hover-opacity", String(Math.max(0.35, layout.hoverPlate.opacity || 0.65)));

  applyImageLayer(button.querySelector('[data-button-layer="plate"]'), layout.plate, component, responsive);
  applyImageLayer(button.querySelector('[data-button-layer="hoverPlate"]'), layout.hoverPlate, component, responsive);
  applyImageLayer(button.querySelector('[data-button-layer="sideGemLeft"]'), layout.sideGemLeft, component, responsive);
  applyImageLayer(button.querySelector('[data-button-layer="sideGemRight"]'), layout.sideGemRight, component, responsive);
  applyImageLayer(button.querySelector('[data-button-layer="separatorGlow"]'), layout.separatorGlow, component, responsive);
  applyImageLayer(button.querySelector('[data-button-layer="iconRing"]'), layout.iconRing, component, responsive);
  applyImageLayer(button.querySelector('[data-button-layer="icon"]'), layout.icon, component, responsive);
  applyTextLayer(button.querySelector('[data-button-layer="text"]'), layout.text, component, responsive);
}

function buildImageLayer(name, src) {
  const image = document.createElement("img");
  image.className = `menu-composite-button__layer menu-composite-button__layer--${name}`;
  image.dataset.buttonLayer = name;
  image.src = src;
  image.alt = "";
  return image;
}

function buildTextLayer(label) {
  const span = document.createElement("span");
  span.className = "menu-composite-button__label";
  span.dataset.buttonLayer = "text";
  span.textContent = label;
  return span;
}

function applyImageLayer(element, layer, component, responsive) {
  if (!element || !layer) return;
  const x = responsive ? `${(layer.x / component.width) * 100}%` : `${layer.x}px`;
  const y = responsive ? `${(layer.y / component.height) * 100}%` : `${layer.y}px`;
  const width = responsive ? `${(layer.width / component.width) * 100}%` : `${layer.width}px`;
  const height = responsive ? `${(layer.height / component.height) * 100}%` : `${layer.height}px`;
  const scaleX = layer.scaleX ?? layer.scale ?? 1;
  const scaleY = layer.scaleY ?? layer.scale ?? 1;
  element.style.left = x;
  element.style.top = y;
  element.style.width = width;
  element.style.height = height;
  element.style.opacity = String(layer.opacity ?? 1);
  element.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
}

function applyTextLayer(element, layer, component, responsive) {
  if (!element || !layer) return;
  element.style.left = responsive ? `${(layer.x / component.width) * 100}%` : `${layer.x}px`;
  element.style.top = responsive ? `${(layer.y / component.height) * 100}%` : `${layer.y}px`;
  element.style.fontSize = responsive ? `clamp(1rem, ${(layer.fontSize / component.width) * 100}vw, ${layer.fontSize}px)` : `${layer.fontSize}px`;
  element.style.fontWeight = String(layer.fontWeight ?? 800);
  element.style.color = layer.color ?? "#fff7ed";
  const glow = layer.glow ?? 0;
  element.style.textShadow = [
    "0 3px 3px rgba(0, 0, 0, 0.85)",
    glow > 0 ? `0 0 ${Math.round(14 * glow)}px rgba(56, 189, 248, ${0.32 * glow})` : "",
  ].filter(Boolean).join(", ");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
