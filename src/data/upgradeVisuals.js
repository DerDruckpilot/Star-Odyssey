export const upgradeMenuAssetPaths = {
  mothership: "./assets/generated/ui/mothership.png",
  blueprints: {
    cannon: "./assets/generated/ui/blueprint-cannon.png",
    cargo: "./assets/generated/ui/blueprint-cargo.png",
    drive: "./assets/generated/ui/blueprint-drive.png"
  },
  buildBlueprints: {
    colonyShip: "./assets/generated/ui/blueprint-build-colony-ship.png",
    tradeShip: "./assets/generated/ui/blueprint-build-trade-ship.png",
    spaceport: "./assets/generated/ui/blueprint-build-spaceport.png"
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
  { id: "drive-left-front", upgradeId: "drive", minValue: 1, assetId: "driveRightRear", layer: "front", x: 52.22, y: 40.31, widthPercent: 14.5, scale: 0.85, z: 151 },
  { id: "drive-right-front", upgradeId: "drive", minValue: 2, assetId: "driveLeftRear", layer: "front", x: -150.81, y: 45.29, widthPercent: 14.5, scale: 0.9, z: 152 },
  { id: "drive-left-rear", upgradeId: "drive", minValue: 3, assetId: "driveLeftFront", layer: "back", x: -102.7, y: 37.27, widthPercent: 12.5, scale: 1, z: 53 },
  { id: "drive-right-rear", upgradeId: "drive", minValue: 4, assetId: "driveRightFront", layer: "back", x: 8.95, y: 41.46, widthPercent: 12.5, scale: 1, z: 54 },
  { id: "drive-left-outer", upgradeId: "drive", minValue: 5, assetId: "driveLeftFront", layer: "back", x: -240.38, y: 55.51, widthPercent: 13.5, scale: 1, z: 55 },
  { id: "drive-right-outer", upgradeId: "drive", minValue: 6, assetId: "driveRightFront", layer: "back", x: 150.89, y: 57.51, widthPercent: 13.5, scale: 1, z: 56 },
  { id: "cannon-left-rear", upgradeId: "cannon", minValue: 1, assetId: "cannonLeft", layer: "back", x: -99.88, y: -174.71, widthPercent: 13, scale: 0.8, z: 51 },
  { id: "cannon-right-rear", upgradeId: "cannon", minValue: 2, assetId: "cannonRight", layer: "back", x: -7.19, y: -172.03, widthPercent: 13, scale: 0.8, z: 52 },
  { id: "cannon-left-front", upgradeId: "cannon", minValue: 3, assetId: "cannonLeft", layer: "front", x: -133.71, y: -155.78, widthPercent: 14, scale: 0.75, z: 153 },
  { id: "cannon-center-left", upgradeId: "cannon", minValue: 4, assetId: "cannonCenter", layer: "front", x: -86.45, y: -139.02, widthPercent: 14.5, scale: 0.65, z: 154 },
  { id: "cannon-center-right", upgradeId: "cannon", minValue: 5, assetId: "cannonCenter", layer: "front", x: -18.61, y: -139.03, widthPercent: 14.5, scale: 0.65, z: 165 },
  { id: "cannon-right-front", upgradeId: "cannon", minValue: 6, assetId: "cannonRight", layer: "front", x: 35.73, y: -153.58, widthPercent: 14, scale: 0.75, z: 156 },
  { id: "cargo-right-rear", upgradeId: "cargo", minValue: 1, assetId: "cargoRightRear", layer: "back", x: 31.77, y: -52.47, widthPercent: 18.5, scale: 1, z: 51 },
  { id: "cargo-left-front", upgradeId: "cargo", minValue: 2, assetId: "cargoRight", layer: "front", x: -130.98, y: -39.35, widthPercent: 20.5, scale: 1, z: 152 },
  { id: "cargo-right-front", upgradeId: "cargo", minValue: 3, assetId: "cargoLeft", layer: "back", x: -125.69, y: -49.42, widthPercent: 20.5, scale: 1, z: 53 },
  { id: "cargo-left-rear", upgradeId: "cargo", minValue: 4, assetId: "cargoLeftRear", layer: "front", x: 34, y: -40.17, widthPercent: 18.5, scale: 1, z: 134 },
  { id: "cargo-center-front", upgradeId: "cargo", minValue: 5, assetId: "cargoCenter", layer: "front", x: -51.78, y: -35.36, widthPercent: 20, scale: 1, z: 155 }
];
