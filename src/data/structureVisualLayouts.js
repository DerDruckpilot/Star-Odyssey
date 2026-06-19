export const structureVisualLayouts = {
  colonies: {
    twoTopOneBottom: {
      positions: [
        { id: "colony-site-1", siteIndex: 1, x: 50.06835269993165, y: 19.047896297923756, scale: 2, rotation: 180, z: 30 },
        { id: "colony-site-2", siteIndex: 2, x: 39.5419002050581, y: 49.658874363762855, scale: 2, rotation: 60, z: 31 },
        { id: "colony-site-3", siteIndex: 3, x: 60.4580997949419, y: 49.658874363762855, scale: 2, rotation: -60, z: 32 }
      ]
    },
    oneTopTwoBottom: {
      positions: [
        { id: "colony-site-1", siteIndex: 1, x: 39.746958304853045, y: 35.94112563623714, scale: 2, rotation: 120, z: 30 },
        { id: "colony-site-2", siteIndex: 2, x: 60.11633629528366, y: 35.94112563623714, scale: 2, rotation: -120, z: 31 },
        { id: "colony-site-3", siteIndex: 3, x: 50, y: 66.16621626569994, scale: 2, rotation: 0, z: 32 }
      ]
    }
  },
  spaceports: {
    twoTopOneBottom: {
      positions: [
        { id: "spaceport-site-1", siteIndex: 1, x: 50.20505809979494, y: 13.306199421436151, scale: 2, rotation: 0, z: 30 },
        { id: "spaceport-site-2", siteIndex: 2, x: 37.01285030758715, y: 52.23677908381852, scale: 2, rotation: 60, z: 31 },
        { id: "spaceport-site-3", siteIndex: 3, x: 63.12385509227614, y: 52.11960159654326, scale: 2, rotation: -60, z: 32 }
      ]
    },
    oneTopTwoBottom: {
      positions: [
        { id: "spaceport-site-1", siteIndex: 1, x: 36.94449760765551, y: 33.246043428906226, scale: 2, rotation: 120, z: 30 },
        { id: "spaceport-site-2", siteIndex: 2, x: 63.0555023923445, y: 33.36322091618148, scale: 2, rotation: -120, z: 31 },
        { id: "spaceport-site-3", siteIndex: 3, x: 50, y: 71.90791314218755, scale: 2, rotation: 0, z: 32 }
      ]
    }
  }
};

export const structureVisualReferenceLayouts = {
  twoTopOneBottom: {
    width: 720,
    height: 520,
    centers: [
      { x: 282, y: 160 },
      { x: 438, y: 160 },
      { x: 360, y: 295 }
    ]
  },
  oneTopTwoBottom: {
    width: 720,
    height: 520,
    centers: [
      { x: 360, y: 150 },
      { x: 282, y: 285 },
      { x: 438, y: 285 }
    ]
  }
};

export function getStructureVisualPosition(structureType, layoutType, siteIndex) {
  const group = structureType === "spaceport" ? "spaceports" : "colonies";
  const positions = structureVisualLayouts[group]?.[layoutType]?.positions ?? [];
  return positions.find((position) => position.siteIndex === siteIndex) ?? null;
}
