export const upgradeMenuAssetPaths = {
  mothership: "./assets/generated/ui/mothership.png",
  blueprints: {
    cannon: "./assets/generated/ui/blueprint-cannon.png",
    cargo: "./assets/generated/ui/blueprint-cargo.png",
    drive: "./assets/generated/ui/blueprint-drive.png"
  },
  overlays: {
    cannonLeft: "./assets/generated/ui/upgrades/cannon-left.png",
    cannonCenter: "./assets/generated/ui/upgrades/cannon-center.png",
    cannonRight: "./assets/generated/ui/upgrades/cannon-right.png",
    cargoLeft: "./assets/generated/ui/upgrades/cargo-left.png",
    cargoCenter: "./assets/generated/ui/upgrades/cargo-center.png",
    cargoRight: "./assets/generated/ui/upgrades/cargo-right.png",
    cargoLeftRear: "./assets/generated/ui/upgrades/cargo-left-rear.png",
    cargoRightRear: "./assets/generated/ui/upgrades/cargo-right-rear.png",
    driveLeftFront: "./assets/generated/ui/upgrades/drive-left-front.png",
    driveLeftRear: "./assets/generated/ui/upgrades/drive-left-rear.png",
    driveRightFront: "./assets/generated/ui/upgrades/drive-right-front.png",
    driveRightRear: "./assets/generated/ui/upgrades/drive-right-rear.png"
  }
};

export const upgradeMenuOrder = ["cannon", "cargo", "drive"];

export const mothershipUpgradeSlots = [
  { id: "drive-left-front", upgradeId: "drive", minValue: 1, assetId: "driveRightRear", layer: "front" },
  { id: "drive-right-front", upgradeId: "drive", minValue: 2, assetId: "driveLeftRear", layer: "front" },
  { id: "drive-left-rear", upgradeId: "drive", minValue: 3, assetId: "driveLeftFront", layer: "back" },
  { id: "drive-right-rear", upgradeId: "drive", minValue: 4, assetId: "driveRightFront", layer: "back" },
  { id: "drive-left-outer", upgradeId: "drive", minValue: 5, assetId: "driveLeftFront", layer: "front" },
  { id: "drive-right-outer", upgradeId: "drive", minValue: 6, assetId: "driveRightFront", layer: "front" },
  { id: "cannon-left-rear", upgradeId: "cannon", minValue: 1, assetId: "cannonLeft", layer: "back" },
  { id: "cannon-right-rear", upgradeId: "cannon", minValue: 2, assetId: "cannonRight", layer: "back" },
  { id: "cannon-left-front", upgradeId: "cannon", minValue: 3, assetId: "cannonLeft", layer: "front" },
  { id: "cannon-center-left", upgradeId: "cannon", minValue: 4, assetId: "cannonCenter", layer: "front" },
  { id: "cannon-center-right", upgradeId: "cannon", minValue: 5, assetId: "cannonCenter", layer: "front" },
  { id: "cannon-right-front", upgradeId: "cannon", minValue: 6, assetId: "cannonRight", layer: "front" },
  { id: "cargo-right-rear", upgradeId: "cargo", minValue: 1, assetId: "cargoRightRear", layer: "back" },
  { id: "cargo-left-front", upgradeId: "cargo", minValue: 2, assetId: "cargoRight", layer: "front" },
  { id: "cargo-right-front", upgradeId: "cargo", minValue: 3, assetId: "cargoLeft", layer: "front" },
  { id: "cargo-left-rear", upgradeId: "cargo", minValue: 4, assetId: "cargoLeftRear", layer: "back" },
  { id: "cargo-center-front", upgradeId: "cargo", minValue: 5, assetId: "cargoCenter", layer: "front" }
];
