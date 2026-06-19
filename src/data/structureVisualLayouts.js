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

export function applyDebugLayoutTransform({
  referenceLayout,
  actualCenters,
  visualPosition,
  baseWidth,
  baseHeight,
  baseHitRadius
}) {
  if (!referenceLayout || actualCenters.length !== 3 || !visualPosition) return null;

  const referenceCenter = averagePoints(referenceLayout.centers);
  const actualCenter = averagePoints(actualCenters);
  const referenceBounds = getBounds(referenceLayout.centers);
  const actualBounds = getBounds(actualCenters);
  const scaleX = actualBounds.width / referenceBounds.width;
  const scaleY = actualBounds.height / referenceBounds.height;
  const localScale = (scaleX + scaleY) / 2;
  const referenceX = (visualPosition.x / 100) * referenceLayout.width;
  const referenceY = (visualPosition.y / 100) * referenceLayout.height;

  return {
    x: actualCenter.x + (referenceX - referenceCenter.x) * scaleX,
    y: actualCenter.y + (referenceY - referenceCenter.y) * scaleY,
    width: baseWidth * (visualPosition.scale ?? 1) * localScale,
    height: baseHeight * (visualPosition.scale ?? 1) * localScale,
    hitRadius: baseHitRadius * localScale,
    rotation: visualPosition.rotation ?? 0,
    z: visualPosition.z ?? 0,
    localScale
  };
}

function averagePoints(points) {
  const total = points.reduce((sum, point) => ({
    x: sum.x + point.x,
    y: sum.y + point.y
  }), { x: 0, y: 0 });

  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
}

function getBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    width: Math.max(...xs) - Math.min(...xs) || 1,
    height: Math.max(...ys) - Math.min(...ys) || 1
  };
}
