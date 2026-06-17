import { mothershipUpgradeSlots, upgradeMenuAssetPaths } from "./data/upgradeVisuals.js";

const debugViews = [
  {
    upgradeId: "cannon",
    labelPrefix: "K",
    title: "Bordkanonen",
    subtitle: "Alle aktuellen Kanonen-Slots im Zustand 6/6"
  },
  {
    upgradeId: "cargo",
    labelPrefix: "F",
    title: "Frachtmodule",
    subtitle: "Alle aktuellen Frachtmodul-Slots im Zustand 5/5"
  },
  {
    upgradeId: "drive",
    labelPrefix: "A",
    title: "Antriebe",
    subtitle: "Alle aktuellen Antriebs-Slots im Zustand 6/6"
  }
];

const target = document.querySelector("#debug-upgrade-renderings");
const debugLabelOffsets = {
  "cannon-left-rear": ["-1.35rem", "-1.25rem"],
  "cannon-right-rear": ["1.35rem", "-1.25rem"],
  "cannon-left-front": ["-1.25rem", "1.25rem"],
  "cannon-center-left": ["-0.95rem", "1.45rem"],
  "cannon-center-right": ["0.95rem", "1.45rem"],
  "cannon-right-front": ["1.25rem", "1.25rem"],
  "cargo-right-rear": ["1.45rem", "-1.3rem"],
  "cargo-left-front": ["-1.35rem", "1.35rem"],
  "cargo-right-front": ["1.35rem", "1.35rem"],
  "cargo-left-rear": ["-1.45rem", "-1.3rem"],
  "cargo-center-front": ["0rem", "1.45rem"],
  "drive-left-front": ["-1.15rem", "1.2rem"],
  "drive-right-front": ["1.15rem", "1.2rem"],
  "drive-left-rear": ["-1.2rem", "-1.2rem"],
  "drive-right-rear": ["1.2rem", "-1.2rem"],
  "drive-left-outer": ["-1.3rem", "0rem"],
  "drive-right-outer": ["1.3rem", "0rem"]
};

for (const view of debugViews) {
  target.append(renderDebugCard(view));
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
  visual.className = "mothership-visual";

  const backLayer = document.createElement("div");
  backLayer.className = "mothership-layer mothership-layer--back";

  const shipImage = document.createElement("img");
  shipImage.className = "mothership-base";
  shipImage.src = upgradeMenuAssetPaths.mothership;
  shipImage.alt = "";

  const frontLayer = document.createElement("div");
  frontLayer.className = "mothership-layer mothership-layer--front";

  const labelLayer = document.createElement("div");
  labelLayer.className = "mothership-layer debug-upgrade-label-layer";

  const layers = {
    back: backLayer,
    front: frontLayer
  };

  getSlotsForView(view.upgradeId).forEach((slot, index) => {
    const assetPath = upgradeMenuAssetPaths.overlays[slot.assetId];
    if (!assetPath) return;

    const overlay = document.createElement("div");
    overlay.className = `mothership-overlay mothership-overlay--${slot.id} debug-upgrade-slot`;

    const image = document.createElement("img");
    image.className = "debug-upgrade-slot-image";
    image.src = assetPath;
    image.alt = "";

    overlay.append(image);
    layers[slot.layer].append(overlay);

    const labelAnchor = document.createElement("div");
    labelAnchor.className = `mothership-overlay mothership-overlay--${slot.id} debug-upgrade-label-anchor`;
    const labelOffset = debugLabelOffsets[slot.id];
    if (labelOffset) {
      labelAnchor.style.setProperty("--debug-label-x", labelOffset[0]);
      labelAnchor.style.setProperty("--debug-label-y", labelOffset[1]);
    }

    const label = document.createElement("span");
    label.className = "debug-upgrade-slot-label";
    label.textContent = `${view.labelPrefix}${index + 1}`;

    labelAnchor.append(label);
    labelLayer.append(labelAnchor);
  });

  visual.append(backLayer, shipImage, frontLayer, labelLayer);
  return visual;
}

function getSlotsForView(upgradeId) {
  return mothershipUpgradeSlots
    .filter((slot) => slot.upgradeId === upgradeId)
    .sort((first, second) => first.minValue - second.minValue);
}
