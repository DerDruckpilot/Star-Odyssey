const boardWidth = 1680;
const boardHeight = 900;
const hexRadius = 52;
const hexHorizontalStep = Math.sqrt(3) * hexRadius;
const hexVerticalStep = 1.5 * hexRadius;
const hexOrigin = { x: 155, y: 82 };
const cornerAngleOffset = -30;
const coordinatePrecision = 100;

const hexRows = [
  [[0, 1]],
  [[0, 15]],
  [[0, 15]],
  [[0, 15]],
  [[0, 15]],
  [[0, 15]],
  [[0, 15]],
  [[0, 14]],
  [[0, 2], [4, 5], [8, 15]]
];

const nebulaHexes = new Set([
  "h-01-09",
  "h-01-10",
  "h-02-08",
  "h-02-09",
  "h-03-07",
  "h-03-08",
  "h-04-07",
  "h-04-08",
  "h-05-08",
  "h-05-09",
  "h-06-09",
  "h-07-10",
  "h-08-11"
]);

const sectorSplitColumn = 10;

const semanticNodeRequests = [
  nodeRequest("start-01-launch-a", 0, 1, 0, "launch"),
  nodeRequest("start-01-launch-b", 0, 1, 1, "launch"),
  nodeRequest("start-01-launch-c", 1, 1, 1, "launch"),
  nodeRequest("start-01-colony-a-launch-a", 0, 1, 5, "launch"),
  nodeRequest("start-01-colony-b-launch-a", 1, 1, 0, "launch"),
  nodeRequest("start-02-launch-a", 0, 3, 0, "launch"),
  nodeRequest("start-02-launch-b", 0, 3, 1, "launch"),
  nodeRequest("start-02-launch-c", 1, 3, 1, "launch"),
  nodeRequest("start-02-colony-a-launch-a", 0, 3, 5, "launch"),
  nodeRequest("start-02-colony-b-launch-a", 1, 3, 0, "launch"),
  nodeRequest("start-03-launch-a", 0, 5, 0, "launch"),
  nodeRequest("start-03-launch-b", 0, 5, 1, "launch"),
  nodeRequest("start-03-launch-c", 1, 5, 1, "launch"),
  nodeRequest("start-03-colony-a-launch-a", 0, 5, 5, "launch"),
  nodeRequest("start-03-colony-b-launch-a", 1, 5, 0, "launch"),
  nodeRequest("start-04-launch-a", 0, 7, 0, "launch"),
  nodeRequest("start-04-launch-b", 0, 7, 1, "launch"),
  nodeRequest("start-04-launch-c", 1, 7, 1, "launch"),
  nodeRequest("start-04-colony-a-launch-a", 0, 7, 5, "launch"),
  nodeRequest("start-04-colony-b-launch-a", 1, 7, 0, "launch"),
  nodeRequest("p01", 0, 1, 2, "spaceport"),
  nodeRequest("p02", 1, 1, 2),
  nodeRequest("p03", 5, 1, 2, "colony"),
  nodeRequest("p04", 4, 1, 2),
  nodeRequest("p05", 5, 1, 2),
  nodeRequest("p06", 6, 1, 2, "dock"),
  nodeRequest("p07", 7, 1, 2, "dock"),
  nodeRequest("p08", 9, 1, 2),
  nodeRequest("p09", 9, 1, 0, "colony"),
  nodeRequest("p10", 14, 1, 2),
  nodeRequest("p11", 0, 3, 2, "spaceport"),
  nodeRequest("p12", 1, 3, 2),
  nodeRequest("p13", 3, 3, 2, "dock"),
  nodeRequest("p14", 4, 3, 2, "dock"),
  nodeRequest("p15", 5, 3, 2),
  nodeRequest("p16", 12, 1, 2, "colony"),
  nodeRequest("p17", 8, 3, 2),
  nodeRequest("p18", 15, 1, 2, "colony"),
  nodeRequest("p19", 13, 3, 2),
  nodeRequest("p20", 15, 3, 2),
  nodeRequest("p21", 0, 5, 2, "spaceport"),
  nodeRequest("p22", 1, 5, 2),
  nodeRequest("p23", 3, 3, 0, "colony"),
  nodeRequest("p24", 4, 5, 2),
  nodeRequest("p25", 5, 5, 2),
  nodeRequest("p26", 7, 5, 2, "dock"),
  nodeRequest("p27", 8, 5, 2, "dock"),
  nodeRequest("p28", 10, 5, 2),
  nodeRequest("p29", 6, 5, 2, "colony"),
  nodeRequest("p30", 14, 5, 2),
  nodeRequest("p31", 0, 7, 2, "spaceport"),
  nodeRequest("p32", 1, 7, 2),
  nodeRequest("p33", 10, 5, 0, "colony"),
  nodeRequest("p34", 6, 7, 2, "dock"),
  nodeRequest("p35", 7, 7, 2, "dock"),
  nodeRequest("p36", 9, 7, 2),
  nodeRequest("p37", 14, 7, 2, "colony"),
  nodeRequest("p38", 14, 7, 2),
  nodeRequest("p03-launch-a", 5, 1, 1, "launch"),
  nodeRequest("p09-launch-a", 9, 1, 1, "launch"),
  nodeRequest("p16-launch-a", 12, 1, 1, "launch"),
  nodeRequest("p18-launch-a", 15, 1, 1, "launch"),
  nodeRequest("p23-launch-a", 3, 3, 1, "launch"),
  nodeRequest("p29-launch-a", 6, 5, 1, "launch"),
  nodeRequest("p33-launch-a", 10, 5, 1, "launch"),
  nodeRequest("p37-launch-a", 14, 7, 1, "launch")
];

const spaceQuadrants = createHexCells();
const boardGraph = createBoardGraph(spaceQuadrants);
const boardConnections = boardGraph.connections;
const pointsById = new Map(boardGraph.points.map((point) => [point.id, point]));

export const boardLayout = {
  layoutVersion: "generated-hex-corner-graph-v1",
  width: boardWidth,
  height: boardHeight,
  hexRadius,
  coordinateSystem: "odd-r offset rows",
  spaceQuadrants: boardGraph.hexes,
  hexes: boardGraph.hexes,
  vertices: boardGraph.points,
  spaceNodes: boardGraph.points,
  points: boardGraph.points,
  connections: boardConnections,
  links: boardConnections.map((connection) => [connection.from, connection.to]),
  startSystems: [
    createStartSystem("start-01", 82, 116, ["food", "fuel", "carbon"]),
    createStartSystem("start-02", 82, 288, ["ore", "goods", "food"]),
    createStartSystem("start-03", 82, 510, ["carbon", "ore", "fuel"]),
    createStartSystem("start-04", 82, 735, ["goods", "food", "ore"])
  ],
  planetSystems: [
    createPlanetSystem("system-01", 5, 1, ["carbon", "food", "fuel"]),
    createPlanetSystem("system-02", 9, 1, ["ore", "goods", "carbon"]),
    createPlanetSystem("system-03", 12, 1, ["fuel", "ore", "food"]),
    createPlanetSystem("system-04", 15, 1, ["goods", "carbon", "ore"]),
    createPlanetSystem("system-05", 3, 3, ["food", "carbon", "goods"]),
    createPlanetSystem("system-06", 6, 5, ["fuel", "food", "ore"]),
    createPlanetSystem("system-07", 10, 5, ["carbon", "ore", "goods"]),
    createPlanetSystem("system-08", 14, 7, ["food", "fuel", "carbon"])
  ],
  outposts: [
    createOutpost("outpost-01", 6, 1, "A"),
    createOutpost("outpost-02", 3, 3, "B"),
    createOutpost("outpost-03", 7, 2, "C"),
    createOutpost("outpost-04", 10, 1, "D"),
    createOutpost("outpost-05", 6, 5, "E"),
    createOutpost("outpost-06", 10, 4, "F"),
    createOutpost("outpost-07", 13, 5, "G"),
    createOutpost("outpost-08", 14, 2, "H")
  ],
  specialPoints: {
    colonySites: ["p03", "p09", "p16", "p18", "p23", "p29", "p33", "p37"],
    spaceports: ["p01", "p11", "p21", "p31"],
    docks: ["p06", "p07", "p13", "p14", "p26", "p27", "p34", "p35"]
  }
};

export { boardConnections };

export const resourceColors = {
  carbon: "#38bdf8",
  food: "#22c55e",
  fuel: "#f59e0b",
  ore: "#ef4444",
  goods: "#a855f7",
  trade: "#a855f7"
};

boardLayout.startSites = [
  createStartSite("start-01-colony-a", 53, 142, "colonySite", ["start-01-planet-01", "start-01-planet-02"]),
  createStartSite("start-01-colony-b", 122, 142, "colonySite", ["start-01-planet-02", "start-01-planet-03"]),
  createStartSite("start-01-spaceport", 86, 202, "spaceportSite", ["start-01-planet-01", "start-01-planet-02", "start-01-planet-03"]),
  createStartSite("start-02-colony-a", 53, 314, "colonySite", ["start-02-planet-01", "start-02-planet-02"]),
  createStartSite("start-02-colony-b", 122, 314, "colonySite", ["start-02-planet-02", "start-02-planet-03"]),
  createStartSite("start-02-spaceport", 86, 374, "spaceportSite", ["start-02-planet-01", "start-02-planet-02", "start-02-planet-03"]),
  createStartSite("start-03-colony-a", 53, 536, "colonySite", ["start-03-planet-01", "start-03-planet-02"]),
  createStartSite("start-03-colony-b", 122, 536, "colonySite", ["start-03-planet-02", "start-03-planet-03"]),
  createStartSite("start-03-spaceport", 86, 596, "spaceportSite", ["start-03-planet-01", "start-03-planet-02", "start-03-planet-03"]),
  createStartSite("start-04-colony-a", 53, 762, "colonySite", ["start-04-planet-01", "start-04-planet-02"]),
  createStartSite("start-04-colony-b", 122, 762, "colonySite", ["start-04-planet-02", "start-04-planet-03"]),
  createStartSite("start-04-spaceport", 86, 822, "spaceportSite", ["start-04-planet-01", "start-04-planet-02", "start-04-planet-03"])
];

boardLayout.startAssignments = boardLayout.startSystems.map((system, index) => ({
  playerIndex: index,
  structures: [
    { type: "colony", locationId: `${system.id}-colony-a` },
    { type: "colony", locationId: `${system.id}-colony-b` },
    { type: "spaceport", locationId: `${system.id}-spaceport` }
  ]
}));

boardLayout.spaceportLaunchPoints = [
  createLaunchPoint("start-01-launch-a", "start-01-spaceport"),
  createLaunchPoint("start-01-launch-b", "start-01-spaceport"),
  createLaunchPoint("start-01-launch-c", "start-01-spaceport"),
  createLaunchPoint("start-01-colony-a-launch-a", "start-01-colony-a"),
  createLaunchPoint("start-01-colony-b-launch-a", "start-01-colony-b"),
  createLaunchPoint("start-02-launch-a", "start-02-spaceport"),
  createLaunchPoint("start-02-launch-b", "start-02-spaceport"),
  createLaunchPoint("start-02-launch-c", "start-02-spaceport"),
  createLaunchPoint("start-02-colony-a-launch-a", "start-02-colony-a"),
  createLaunchPoint("start-02-colony-b-launch-a", "start-02-colony-b"),
  createLaunchPoint("start-03-launch-a", "start-03-spaceport"),
  createLaunchPoint("start-03-launch-b", "start-03-spaceport"),
  createLaunchPoint("start-03-launch-c", "start-03-spaceport"),
  createLaunchPoint("start-03-colony-a-launch-a", "start-03-colony-a"),
  createLaunchPoint("start-03-colony-b-launch-a", "start-03-colony-b"),
  createLaunchPoint("start-04-launch-a", "start-04-spaceport"),
  createLaunchPoint("start-04-launch-b", "start-04-spaceport"),
  createLaunchPoint("start-04-launch-c", "start-04-spaceport"),
  createLaunchPoint("start-04-colony-a-launch-a", "start-04-colony-a"),
  createLaunchPoint("start-04-colony-b-launch-a", "start-04-colony-b"),
  createLaunchPoint("p03-launch-a", "p03"),
  createLaunchPoint("p09-launch-a", "p09"),
  createLaunchPoint("p16-launch-a", "p16"),
  createLaunchPoint("p18-launch-a", "p18"),
  createLaunchPoint("p23-launch-a", "p23"),
  createLaunchPoint("p29-launch-a", "p29"),
  createLaunchPoint("p33-launch-a", "p33"),
  createLaunchPoint("p37-launch-a", "p37")
].filter(Boolean);

const planetProduction = {
  "start-01-planet-01": { number: 5, adjacentSiteIds: ["start-01-colony-a", "start-01-spaceport"] },
  "start-01-planet-02": { number: 8, adjacentSiteIds: ["start-01-colony-a", "start-01-colony-b", "start-01-spaceport"] },
  "start-01-planet-03": { number: 6, adjacentSiteIds: ["start-01-colony-b", "start-01-spaceport"] },
  "start-02-planet-01": { number: 4, adjacentSiteIds: ["start-02-colony-a", "start-02-spaceport"] },
  "start-02-planet-02": { number: 9, adjacentSiteIds: ["start-02-colony-a", "start-02-colony-b", "start-02-spaceport"] },
  "start-02-planet-03": { number: 10, adjacentSiteIds: ["start-02-colony-b", "start-02-spaceport"] },
  "start-03-planet-01": { number: 3, adjacentSiteIds: ["start-03-colony-a", "start-03-spaceport"] },
  "start-03-planet-02": { number: 11, adjacentSiteIds: ["start-03-colony-a", "start-03-colony-b", "start-03-spaceport"] },
  "start-03-planet-03": { number: 8, adjacentSiteIds: ["start-03-colony-b", "start-03-spaceport"] },
  "start-04-planet-01": { number: 5, adjacentSiteIds: ["start-04-colony-a", "start-04-spaceport"] },
  "start-04-planet-02": { number: 6, adjacentSiteIds: ["start-04-colony-a", "start-04-colony-b", "start-04-spaceport"] },
  "start-04-planet-03": { number: 9, adjacentSiteIds: ["start-04-colony-b", "start-04-spaceport"] },
  "system-01-planet-01": { number: 4, adjacentSiteIds: ["p03"] },
  "system-01-planet-02": { number: 10, adjacentSiteIds: ["p03"] },
  "system-01-planet-03": { number: 8, adjacentSiteIds: ["p03"] },
  "system-03-planet-01": { number: 5, adjacentSiteIds: ["p16"] },
  "system-03-planet-02": { number: 9, adjacentSiteIds: ["p16"] },
  "system-03-planet-03": { number: 6, adjacentSiteIds: ["p16"] },
  "system-05-planet-01": { number: 3, adjacentSiteIds: ["p23"] },
  "system-05-planet-02": { number: 11, adjacentSiteIds: ["p23"] },
  "system-05-planet-03": { number: 5, adjacentSiteIds: ["p23"] }
};

const colonySiteNodesBySystem = {
  "system-01": ["p03"],
  "system-02": ["p09"],
  "system-03": ["p16"],
  "system-04": ["p18"],
  "system-05": ["p23"],
  "system-06": ["p29"],
  "system-07": ["p33"],
  "system-08": ["p37"]
};

const dockNodesByOutpost = {
  "outpost-01": ["p06", "p07"],
  "outpost-02": ["p13", "p14"],
  "outpost-03": ["p26", "p27"],
  "outpost-04": ["p34", "p35"],
  "outpost-05": ["p17"],
  "outpost-06": ["p28"],
  "outpost-07": ["p30"],
  "outpost-08": ["p19", "p20"]
};

for (const system of [...boardLayout.startSystems, ...boardLayout.planetSystems]) {
  system.name = system.name ?? system.id;
  system.isExplored = !system.hidden;
  system.planetIds = system.planets.map((planet) => planet.id);
  system.adjacentNodeIds = colonySiteNodesBySystem[system.id] ?? [];
  system.colonySiteIds = (colonySiteNodesBySystem[system.id] ?? []).map((nodeId) => `${system.id}-${nodeId}-colony-site`);
  system.resources = system.resources.map(normalizeResource);
  for (const planet of system.planets) {
    planet.resource = normalizeResource(planet.resource);
    Object.assign(planet, planetProduction[planet.id] ?? { number: null, adjacentSiteIds: [] });
    planet.systemId = system.id;
    planet.resourceType = planet.resource;
    planet.numberToken = planet.number;
    planet.isRevealed = !system.hidden;
  }
}

boardLayout.colonySites = Object.entries(colonySiteNodesBySystem).flatMap(([systemId, nodeIds]) => {
  const system = boardLayout.planetSystems.find((candidate) => candidate.id === systemId);
  return nodeIds.map((nodeId) => ({
    id: `${systemId}-${nodeId}-colony-site`,
    nodeId,
    systemId,
    adjacentPlanetIds: system?.planetIds ?? [],
    occupiedByStructureId: null
  }));
});

boardLayout.docks = Object.entries(dockNodesByOutpost).flatMap(([outpostId, nodeIds]) => (
  nodeIds.map((nodeId, index) => ({
    id: `${outpostId}-dock-${index + 1}`,
    outpostId,
    nodeId,
    occupiedByStructureId: null
  }))
));

for (const outpost of boardLayout.outposts) {
  const docks = boardLayout.docks.filter((dock) => dock.outpostId === outpost.id);
  outpost.dockNodeId = docks[0]?.nodeId ?? null;
  outpost.dockIds = docks.map((dock) => dock.id);
  outpost.tradeStationIds = [];
}

boardLayout.productionPlanets = [...boardLayout.startSystems, ...boardLayout.planetSystems]
  .flatMap((system) => system.planets.map((planet) => ({
    ...planet,
    systemId: system.id
  })));

function nodeRequest(id, q, r, corner, type = "space") {
  return { id, q, r, corner, type };
}

function hexCenter(q, r, offsetX = 0, offsetY = 0) {
  return {
    x: hexOrigin.x + q * hexHorizontalStep + (r % 2) * (hexHorizontalStep / 2) + offsetX,
    y: hexOrigin.y + r * hexVerticalStep + offsetY
  };
}

function createHexCells() {
  return hexRows.flatMap((ranges, r) => ranges.flatMap(([startQ, endQ]) => (
    Array.from({ length: endQ - startQ + 1 }, (_, index) => {
      const q = startQ + index;
      const center = hexCenter(q, r);
      const id = `h-${String(r).padStart(2, "0")}-${String(q).padStart(2, "0")}`;

      return {
        id,
        q,
        r,
        x: roundCoordinate(center.x),
        y: roundCoordinate(center.y),
        kind: nebulaHexes.has(id) ? "nebula" : q >= sectorSplitColumn ? "back" : "front"
      };
    })
  )));
}

function createBoardGraph(hexes) {
  const verticesByKey = new Map();
  const edgesByKey = new Map();

  for (const hex of hexes) {
    const corners = getHexCorners(hex.x, hex.y);
    const cornerKeys = corners.map(cornerKey);
    hex.corners = corners;
    hex.cornerKeys = cornerKeys;

    for (const [index, corner] of corners.entries()) {
      const key = cornerKeys[index];
      if (!verticesByKey.has(key)) {
        verticesByKey.set(key, {
          key,
          x: corner.x,
          y: corner.y,
          hexIds: new Set()
        });
      }
      verticesByKey.get(key).hexIds.add(hex.id);
    }

    for (let index = 0; index < cornerKeys.length; index += 1) {
      const fromKey = cornerKeys[index];
      const toKey = cornerKeys[(index + 1) % cornerKeys.length];
      const edgeId = createEdgeKey(fromKey, toKey);
      if (!edgesByKey.has(edgeId)) {
        edgesByKey.set(edgeId, {
          id: edgeId,
          fromKey,
          toKey,
          hexIds: new Set()
        });
      }
      edgesByKey.get(edgeId).hexIds.add(hex.id);
    }
  }

  const bindingsByKey = createSemanticBindings(hexes);
  const sortedVertices = [...verticesByKey.values()]
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const usedIds = new Set();
  const keyToId = new Map();
  const points = sortedVertices.map((vertex, index) => {
    const binding = bindingsByKey.get(vertex.key);
    const fallbackId = `n-${String(index + 1).padStart(3, "0")}`;
    const id = binding && !usedIds.has(binding.id) ? binding.id : fallbackId;
    const hexIds = [...vertex.hexIds].sort();
    const isBoundary = hexIds.length < 3;
    usedIds.add(id);
    keyToId.set(vertex.key, id);

    return {
      id,
      x: roundCoordinate(vertex.x),
      y: roundCoordinate(vertex.y),
      type: binding?.type ?? (isBoundary ? "boundary" : "space"),
      hexIds,
      isBoundary
    };
  });

  const connections = [...edgesByKey.values()]
    .map((edge, index) => ({
      id: `edge-${String(index + 1).padStart(3, "0")}`,
      from: keyToId.get(edge.fromKey),
      to: keyToId.get(edge.toKey),
      hexIds: [...edge.hexIds].sort()
    }))
    .filter((edge) => edge.from && edge.to && edge.from !== edge.to);

  return {
    hexes: hexes.map((hex) => ({
      ...hex,
      cornerIds: hex.cornerKeys.map((key) => keyToId.get(key)),
      corners: hex.corners.map((corner) => ({
        x: roundCoordinate(corner.x),
        y: roundCoordinate(corner.y)
      }))
    })),
    points,
    connections
  };
}

function createSemanticBindings(hexes) {
  const hexByCoordinate = new Map(hexes.map((hex) => [`${hex.q},${hex.r}`, hex]));
  const bindings = new Map();

  for (const request of semanticNodeRequests) {
    const hex = hexByCoordinate.get(`${request.q},${request.r}`);
    const key = hex?.cornerKeys?.[request.corner];
    if (!key || bindings.has(key)) continue;
    bindings.set(key, request);
  }

  return bindings;
}

function getHexCorners(cx, cy) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index + cornerAngleOffset);
    return {
      x: cx + hexRadius * Math.cos(angle),
      y: cy + hexRadius * Math.sin(angle)
    };
  });
}

function cornerKey(point) {
  return `${Math.round(point.x * coordinatePrecision)}:${Math.round(point.y * coordinatePrecision)}`;
}

function createEdgeKey(fromKey, toKey) {
  return [fromKey, toKey].sort().join("|");
}

function roundCoordinate(value) {
  return Number(value.toFixed(3));
}

function createStartSystem(id, x, y, resources) {
  return {
    id,
    x,
    y,
    resources,
    planets: resources.map((resource, index) => ({
      id: `${id}-planet-${String(index + 1).padStart(2, "0")}`,
      resource
    }))
  };
}

function createPlanetSystem(id, q, r, resources) {
  const center = hexCenter(q, r, 0, -18);
  return {
    id,
    x: roundCoordinate(center.x),
    y: roundCoordinate(center.y),
    resources,
    planets: resources.map((resource, index) => ({
      id: `${id}-planet-${String(index + 1).padStart(2, "0")}`,
      resource
    })),
    hidden: true
  };
}

function createOutpost(id, q, r, name) {
  const center = hexCenter(q, r, 0, 8);
  return {
    id,
    x: roundCoordinate(center.x),
    y: roundCoordinate(center.y),
    name
  };
}

function createStartSite(id, x, y, type, adjacentPlanetIds) {
  return { id, x, y, type, adjacentPlanetIds };
}

function createLaunchPoint(id, spaceportLocationId) {
  const point = pointsById.get(id);
  if (!point) return null;

  return {
    id,
    x: point.x,
    y: point.y,
    spaceportLocationId
  };
}

function normalizeResource(resource) {
  return resource === "trade" ? "goods" : resource;
}
