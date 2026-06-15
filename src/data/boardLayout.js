const boardWidth = 1680;
const boardHeight = 900;
const hexRadius = 52;
const hexHorizontalStep = Math.sqrt(3) * hexRadius;
const hexVerticalStep = 1.5 * hexRadius;
const hexOrigin = { x: 155, y: 82 };

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

function hexCenter(q, r, offsetX = 0, offsetY = 0) {
  return {
    x: Math.round(hexOrigin.x + q * hexHorizontalStep + (r % 2) * (hexHorizontalStep / 2) + offsetX),
    y: Math.round(hexOrigin.y + r * hexVerticalStep + offsetY)
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
        x: center.x,
        y: center.y,
        kind: nebulaHexes.has(id) ? "nebula" : q >= sectorSplitColumn ? "back" : "front"
      };
    })
  )));
}

function pointFromHex(id, q, r, type = "space", offsetX = 0, offsetY = 0) {
  return {
    id,
    ...hexCenter(q, r, offsetX, offsetY),
    type
  };
}

const spaceQuadrants = createHexCells();
const points = [
  pointFromHex("p01", 0, 1, "spaceport"),
  pointFromHex("p02", 1, 1),
  pointFromHex("p03", 3, 1, "colony"),
  pointFromHex("p04", 4, 1),
  pointFromHex("p05", 5, 1),
  pointFromHex("p06", 6, 1, "dock"),
  pointFromHex("p07", 7, 1, "dock"),
  pointFromHex("p08", 9, 1),
  pointFromHex("p09", 12, 1, "colony"),
  pointFromHex("p10", 14, 1),
  pointFromHex("p11", 0, 3, "spaceport"),
  pointFromHex("p12", 1, 3),
  pointFromHex("p13", 3, 3, "dock"),
  pointFromHex("p14", 4, 3, "dock"),
  pointFromHex("p15", 5, 3),
  pointFromHex("p16", 7, 3, "colony"),
  pointFromHex("p17", 8, 3),
  pointFromHex("p18", 11, 3, "colony"),
  pointFromHex("p19", 13, 3),
  pointFromHex("p20", 15, 3),
  pointFromHex("p21", 0, 5, "spaceport"),
  pointFromHex("p22", 1, 5),
  pointFromHex("p23", 3, 5, "colony"),
  pointFromHex("p24", 4, 5),
  pointFromHex("p25", 5, 5),
  pointFromHex("p26", 7, 5, "dock"),
  pointFromHex("p27", 8, 5, "dock"),
  pointFromHex("p28", 10, 5),
  pointFromHex("p29", 12, 5, "colony"),
  pointFromHex("p30", 14, 5),
  pointFromHex("p31", 0, 7, "spaceport"),
  pointFromHex("p32", 1, 7),
  pointFromHex("p33", 4, 7, "colony"),
  pointFromHex("p34", 6, 7, "dock"),
  pointFromHex("p35", 7, 7, "dock"),
  pointFromHex("p36", 9, 7),
  pointFromHex("p37", 12, 7, "colony"),
  pointFromHex("p38", 14, 7)
];

export const boardLayout = {
  layoutVersion: "reference-offset-hex-v1",
  width: boardWidth,
  height: boardHeight,
  hexRadius,
  coordinateSystem: "odd-r offset rows",
  spaceQuadrants,
  startSystems: [
    createStartSystem("start-01", 82, 116, ["food", "fuel", "carbon"]),
    createStartSystem("start-02", 82, 288, ["ore", "goods", "food"]),
    createStartSystem("start-03", 82, 510, ["carbon", "ore", "fuel"]),
    createStartSystem("start-04", 82, 735, ["goods", "food", "ore"])
  ],
  planetSystems: [
    createPlanetSystem("system-01", 3, 1, ["carbon", "food", "fuel"]),
    createPlanetSystem("system-02", 12, 1, ["ore", "goods", "carbon"]),
    createPlanetSystem("system-03", 7, 3, ["fuel", "ore", "food"]),
    createPlanetSystem("system-04", 11, 3, ["goods", "carbon", "ore"]),
    createPlanetSystem("system-05", 3, 5, ["food", "carbon", "goods"]),
    createPlanetSystem("system-06", 12, 5, ["fuel", "food", "ore"]),
    createPlanetSystem("system-07", 4, 7, ["carbon", "ore", "goods"]),
    createPlanetSystem("system-08", 12, 7, ["food", "fuel", "carbon"])
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
  points,
  links: [
    ["p01", "p02"], ["p02", "p03"], ["p03", "p04"], ["p04", "p05"], ["p05", "p06"],
    ["p06", "p07"], ["p07", "p08"], ["p08", "p09"], ["p09", "p10"],
    ["p11", "p12"], ["p12", "p13"], ["p13", "p14"], ["p14", "p15"], ["p15", "p16"],
    ["p16", "p17"], ["p17", "p18"], ["p18", "p19"], ["p19", "p20"],
    ["p21", "p22"], ["p22", "p23"], ["p23", "p24"], ["p24", "p25"], ["p25", "p26"],
    ["p26", "p27"], ["p27", "p28"], ["p28", "p29"], ["p29", "p30"],
    ["p31", "p32"], ["p32", "p33"], ["p33", "p34"], ["p34", "p35"], ["p35", "p36"],
    ["p36", "p37"], ["p37", "p38"],
    ["p03", "p13"], ["p05", "p15"], ["p07", "p17"], ["p09", "p18"],
    ["p13", "p23"], ["p15", "p25"], ["p17", "p27"], ["p18", "p28"],
    ["p23", "p33"], ["p25", "p34"], ["p27", "p35"], ["p29", "p37"],
    ["p12", "p22"], ["p20", "p30"], ["p10", "p20"], ["p30", "p38"]
  ],
  specialPoints: {
    colonySites: ["p03", "p09", "p16", "p18", "p23", "p29", "p33", "p37"],
    spaceports: ["p01", "p11", "p21", "p31"],
    docks: ["p06", "p07", "p13", "p14", "p26", "p27", "p34", "p35"]
  }
};

export const resourceColors = {
  carbon: "#38bdf8",
  food: "#22c55e",
  fuel: "#f59e0b",
  ore: "#ef4444",
  goods: "#a855f7",
  trade: "#a855f7"
};

export const boardConnections = boardLayout.links.map(([from, to], index) => ({
  id: `connection-${String(index + 1).padStart(2, "0")}`,
  from,
  to
}));

boardLayout.connections = boardConnections;

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
  createLaunchPoint("start-01-launch-a", 142, 186, "start-01-spaceport"),
  createLaunchPoint("start-01-launch-b", 164, 222, "start-01-spaceport"),
  createLaunchPoint("start-01-launch-c", 190, 202, "start-01-spaceport"),
  createLaunchPoint("start-01-colony-a-launch-a", 56, 188, "start-01-colony-a"),
  createLaunchPoint("start-01-colony-b-launch-a", 124, 188, "start-01-colony-b"),
  createLaunchPoint("start-02-launch-a", 142, 358, "start-02-spaceport"),
  createLaunchPoint("start-02-launch-b", 164, 394, "start-02-spaceport"),
  createLaunchPoint("start-02-launch-c", 190, 374, "start-02-spaceport"),
  createLaunchPoint("start-02-colony-a-launch-a", 56, 360, "start-02-colony-a"),
  createLaunchPoint("start-02-colony-b-launch-a", 124, 360, "start-02-colony-b"),
  createLaunchPoint("start-03-launch-a", 142, 580, "start-03-spaceport"),
  createLaunchPoint("start-03-launch-b", 164, 616, "start-03-spaceport"),
  createLaunchPoint("start-03-launch-c", 190, 596, "start-03-spaceport"),
  createLaunchPoint("start-03-colony-a-launch-a", 56, 582, "start-03-colony-a"),
  createLaunchPoint("start-03-colony-b-launch-a", 124, 582, "start-03-colony-b"),
  createLaunchPoint("start-04-launch-a", 142, 806, "start-04-spaceport"),
  createLaunchPoint("start-04-launch-b", 164, 842, "start-04-spaceport"),
  createLaunchPoint("start-04-launch-c", 190, 822, "start-04-spaceport"),
  createLaunchPoint("start-04-colony-a-launch-a", 56, 808, "start-04-colony-a"),
  createLaunchPoint("start-04-colony-b-launch-a", 124, 808, "start-04-colony-b"),
  createLaunchPoint("p03-launch-a", 450, 202, "p03"),
  createLaunchPoint("p09-launch-a", 1280, 202, "p09"),
  createLaunchPoint("p16-launch-a", 840, 360, "p16"),
  createLaunchPoint("p18-launch-a", 1195, 360, "p18"),
  createLaunchPoint("p23-launch-a", 450, 512, "p23"),
  createLaunchPoint("p29-launch-a", 1280, 512, "p29"),
  createLaunchPoint("p33-launch-a", 575, 668, "p33"),
  createLaunchPoint("p37-launch-a", 1280, 668, "p37")
];

const launchPointConnectionTargets = {
  "start-01-spaceport": "p01",
  "start-01-colony-a": "p01",
  "start-01-colony-b": "p01",
  "start-02-spaceport": "p11",
  "start-02-colony-a": "p11",
  "start-02-colony-b": "p11",
  "start-03-spaceport": "p21",
  "start-03-colony-a": "p21",
  "start-03-colony-b": "p21",
  "start-04-spaceport": "p31",
  "start-04-colony-a": "p31",
  "start-04-colony-b": "p31"
};

for (const launchPoint of boardLayout.spaceportLaunchPoints) {
  boardLayout.points.push({
    id: launchPoint.id,
    x: launchPoint.x,
    y: launchPoint.y,
    type: "launch",
    region: "spaceport"
  });

  const targetId = launchPointConnectionTargets[launchPoint.spaceportLocationId] ?? launchPoint.spaceportLocationId;
  boardLayout.connections.push({
    id: `connection-${boardLayout.connections.length + 1}`,
    from: launchPoint.id,
    to: targetId
  });
}

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
    x: center.x,
    y: center.y,
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
  return { id, x: center.x, y: center.y, name };
}

function createStartSite(id, x, y, type, adjacentPlanetIds) {
  return { id, x, y, type, adjacentPlanetIds };
}

function createLaunchPoint(id, x, y, spaceportLocationId) {
  return { id, x, y, spaceportLocationId };
}

function normalizeResource(resource) {
  return resource === "trade" ? "goods" : resource;
}
