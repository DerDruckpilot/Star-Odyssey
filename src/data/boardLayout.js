import { getFriendshipCardIdsForOutpostType } from "./friendshipCards.js";

const boardWidth = 1600;
const boardHeight = 1000;
const hexRadius = 58;
const hexHorizontalStep = Math.sqrt(3) * hexRadius;
const hexVerticalStep = 1.5 * hexRadius;
const hexOrigin = { x: 78, y: 65 };
const cornerAngleOffset = -30;
const coordinatePrecision = 100;
const coordinateColumns = "ABCDEFGHIJKLMNO".split("");

const validHexRows = [
  ["A1", "B1"],
  createCoordinateRange("A", "O", 2),
  createCoordinateRange("A", "N", 3),
  createCoordinateRange("A", "O", 4),
  createCoordinateRange("A", "N", 5),
  createCoordinateRange("A", "O", 6),
  createCoordinateRange("A", "N", 7),
  createCoordinateRange("A", "O", 8),
  createCoordinateRange("A", "N", 9),
  createCoordinateRange("A", "O", 10),
  ["A11", "B11"]
];

const nebulaHexes = new Set([
  "I4",
  "H5",
  "H6",
  "K2",
  "J3",
  "J4",
  "I5",
  "I6",
  "H7",
  "I8",
  "I9",
  "J8",
  "K8",
  "K9",
  "L10"
]);

const sectorSplitColumnIndex = getColumnIndex("K");

const systemSlots = [
  createSystemSlot("slot-01", "single", ["E2", "F2", "E3"]),
  createSystemSlot("slot-02", "single", ["D5", "E5", "E6"]),
  createSystemSlot("slot-03", "single", ["E9", "E10", "F10"]),
  createSystemSlot("slot-04", "single", ["G3", "G4", "H4"]),
  createSystemSlot("slot-05", "single", ["G6", "F7", "G7"]),
  createSystemSlot("slot-06", "single", ["G9", "H9", "H10"]),
  createSystemSlot("slot-07", "single", ["I2", "J2", "I3"]),
  createSystemSlot("slot-08", "single", ["J9", "J10", "K10"]),
  createSystemSlot("slot-09", "double", ["L2", "K3", "L3"]),
  createSystemSlot("slot-10", "double", ["K5", "L5", "L6"]),
  createSystemSlot("slot-11", "double", ["L8", "M8", "L9"]),
  createSystemSlot("slot-12", "double", ["J6", "I7", "J7"]),
  createSystemSlot("slot-13", "double", ["N2", "O2", "N3"]),
  createSystemSlot("slot-14", "double", ["N6", "O6", "N7"]),
  createSystemSlot("slot-15", "double", ["N9", "N10", "O10"])
];

const fixedStartSystems = [
  createFixedStartSystem("start-01", "alpha", [
    { coordinate: "A1", resource: "food" },
    { coordinate: "A2", resource: "carbon" },
    { coordinate: "B2", resource: "fuel" }
  ]),
  createFixedStartSystem("start-02", "beta", [
    { coordinate: "A4", resource: "ore" },
    { coordinate: "B4", resource: "fuel" },
    { coordinate: "A5", resource: "goods" }
  ]),
  createFixedStartSystem("start-03", "gamma", [
    { coordinate: "A7", resource: "ore" },
    { coordinate: "A8", resource: "food" },
    { coordinate: "B8", resource: "carbon" }
  ]),
  createFixedStartSystem("start-04", "delta", [
    { coordinate: "A10", resource: "fuel" },
    { coordinate: "B10", resource: "goods" },
    { coordinate: "A11", resource: "ore" }
  ])
];

const planetSystemTemplates = [
  createPlanetSystemTemplate("system-01", ["carbon", "food", "fuel"], [4, 8, 11]),
  createPlanetSystemTemplate("system-02", ["carbon", "goods", "ore"], [8, 10, 3]),
  createPlanetSystemTemplate("system-03", ["fuel", "goods", "ore"], [3, 4, 11]),
  createPlanetSystemTemplate("system-04", ["fuel", "ore", "food"], [2, 5, 9]),
  createPlanetSystemTemplate("system-05", ["food", "goods", "carbon"], [3, 6, 5]),
  createPlanetSystemTemplate("system-06", ["carbon", "goods", "fuel"], [10, 6, 9]),
  createPlanetSystemTemplate("system-07", ["goods", "ore", "food"], [6, 10, 4]),
  createPlanetSystemTemplate("system-08", ["ore", "goods", "carbon"], [5, 8, 9])
];

const outpostTemplates = [
  { id: "outpost-01", templateId: "outpost-alpha", name: "A", outpostType: "greenPeople" },
  { id: "outpost-02", templateId: "outpost-beta", name: "B", outpostType: "diplomats" },
  { id: "outpost-03", templateId: "outpost-gamma", name: "C", outpostType: "traders" },
  { id: "outpost-04", templateId: "outpost-delta", name: "D", outpostType: "wisePeople" }
];

const semanticNodeRequests = [
  nodeRequest("start-01-launch-a", "A2", 0, "launch"),
  nodeRequest("start-01-launch-b", "A2", 1, "launch"),
  nodeRequest("start-01-launch-c", "B2", 1, "launch"),
  nodeRequest("start-01-colony-a-launch-a", "A2", 5, "launch"),
  nodeRequest("start-01-colony-b-launch-a", "B2", 0, "launch"),
  nodeRequest("start-02-launch-a", "A4", 0, "launch"),
  nodeRequest("start-02-launch-b", "A4", 1, "launch"),
  nodeRequest("start-02-launch-c", "B4", 1, "launch"),
  nodeRequest("start-02-colony-a-launch-a", "A4", 5, "launch"),
  nodeRequest("start-02-colony-b-launch-a", "B4", 0, "launch"),
  nodeRequest("start-03-launch-a", "A6", 0, "launch"),
  nodeRequest("start-03-launch-b", "A6", 1, "launch"),
  nodeRequest("start-03-launch-c", "B6", 1, "launch"),
  nodeRequest("start-03-colony-a-launch-a", "A6", 5, "launch"),
  nodeRequest("start-03-colony-b-launch-a", "B6", 0, "launch"),
  nodeRequest("start-04-launch-a", "A8", 0, "launch"),
  nodeRequest("start-04-launch-b", "A8", 1, "launch"),
  nodeRequest("start-04-launch-c", "B8", 1, "launch"),
  nodeRequest("start-04-colony-a-launch-a", "A8", 5, "launch"),
  nodeRequest("start-04-colony-b-launch-a", "B8", 0, "launch"),
  nodeRequest("p01", "A2", 2, "spaceport"),
  nodeRequest("p02", "B2", 2),
  nodeRequest("p03", "F2", 2, "colony"),
  nodeRequest("p04", "E2", 2),
  nodeRequest("p05", "G2", 2),
  nodeRequest("p06", "G3", 2, "dock"),
  nodeRequest("p07", "H3", 2, "dock"),
  nodeRequest("p08", "J2", 2),
  nodeRequest("p09", "J2", 0, "colony"),
  nodeRequest("p10", "N2", 2),
  nodeRequest("p11", "A4", 2, "spaceport"),
  nodeRequest("p12", "B4", 2),
  nodeRequest("p13", "D4", 2, "dock"),
  nodeRequest("p14", "E4", 2, "dock"),
  nodeRequest("p15", "F4", 2),
  nodeRequest("p16", "M2", 2, "colony"),
  nodeRequest("p17", "I4", 2),
  nodeRequest("p18", "O2", 2, "colony"),
  nodeRequest("p19", "M4", 2),
  nodeRequest("p20", "O4", 2),
  nodeRequest("p21", "A6", 2, "spaceport"),
  nodeRequest("p22", "B6", 2),
  nodeRequest("p23", "D4", 0, "colony"),
  nodeRequest("p24", "E6", 2),
  nodeRequest("p25", "F6", 2),
  nodeRequest("p26", "H6", 2, "dock"),
  nodeRequest("p27", "I6", 2, "dock"),
  nodeRequest("p28", "K6", 2),
  nodeRequest("p29", "G6", 2, "colony"),
  nodeRequest("p30", "N6", 2),
  nodeRequest("p31", "A8", 2, "spaceport"),
  nodeRequest("p32", "B8", 2),
  nodeRequest("p33", "K6", 0, "colony"),
  nodeRequest("p34", "G8", 2, "dock"),
  nodeRequest("p35", "H8", 2, "dock"),
  nodeRequest("p36", "J8", 2),
  nodeRequest("p37", "O8", 2, "colony"),
  nodeRequest("p38", "N8", 2),
  nodeRequest("p03-launch-a", "F2", 1, "launch"),
  nodeRequest("p09-launch-a", "J2", 1, "launch"),
  nodeRequest("p16-launch-a", "M2", 1, "launch"),
  nodeRequest("p18-launch-a", "O2", 1, "launch"),
  nodeRequest("p23-launch-a", "D4", 1, "launch"),
  nodeRequest("p29-launch-a", "G6", 1, "launch"),
  nodeRequest("p33-launch-a", "K6", 1, "launch"),
  nodeRequest("p37-launch-a", "O8", 1, "launch")
];

const spaceQuadrants = createHexCells();
const boardGraph = createBoardGraph(spaceQuadrants);
const boardConnections = boardGraph.connections;
const pointsById = new Map(boardGraph.points.map((point) => [point.id, point]));
const defaultWildSpacePlacement = createDefaultWildSpacePlacement();

export const boardLayout = {
  layoutVersion: "coordinate-reference-v1",
  width: boardWidth,
  height: boardHeight,
  hexRadius,
  coordinateSystem: "odd-r offset rows with coordinate IDs",
  validHexIds: validHexRows.flat(),
  spaceQuadrants: boardGraph.hexes,
  hexes: boardGraph.hexes,
  vertices: boardGraph.points,
  spaceNodes: boardGraph.points,
  points: boardGraph.points,
  connections: boardConnections,
  links: boardConnections.map((connection) => [connection.from, connection.to]),
  fixedStartSystems,
  startSystems: fixedStartSystems,
  systemSlots,
  nebulaHexes: [...nebulaHexes],
  planetSystemTemplates,
  outpostTemplates,
  planetSystems: defaultWildSpacePlacement.placedSystems,
  outposts: defaultWildSpacePlacement.placedOutposts,
  emptySlots: defaultWildSpacePlacement.emptySlots,
  placedQuadrants: defaultWildSpacePlacement.placedQuadrants,
  unusedQuadrant: defaultWildSpacePlacement.unusedQuadrant,
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

boardLayout.createRandomPlacement = createWildSpacePlacement;
boardLayout.createDefaultPlacement = createDefaultWildSpacePlacement;

boardLayout.startSites = [
  createStartSite("start-01-colony-a", 52, 112, "colonySite", ["start-01-planet-01", "start-01-planet-02"]),
  createStartSite("start-01-colony-b", 122, 112, "colonySite", ["start-01-planet-02", "start-01-planet-03"]),
  createStartSite("start-01-spaceport", 86, 182, "spaceportSite", ["start-01-planet-01", "start-01-planet-02", "start-01-planet-03"]),
  createStartSite("start-02-colony-a", 52, 316, "colonySite", ["start-02-planet-01", "start-02-planet-02"]),
  createStartSite("start-02-colony-b", 122, 316, "colonySite", ["start-02-planet-02", "start-02-planet-03"]),
  createStartSite("start-02-spaceport", 86, 386, "spaceportSite", ["start-02-planet-01", "start-02-planet-02", "start-02-planet-03"]),
  createStartSite("start-03-colony-a", 52, 521, "colonySite", ["start-03-planet-01", "start-03-planet-02"]),
  createStartSite("start-03-colony-b", 122, 521, "colonySite", ["start-03-planet-02", "start-03-planet-03"]),
  createStartSite("start-03-spaceport", 86, 591, "spaceportSite", ["start-03-planet-01", "start-03-planet-02", "start-03-planet-03"]),
  createStartSite("start-04-colony-a", 52, 726, "colonySite", ["start-04-planet-01", "start-04-planet-02"]),
  createStartSite("start-04-colony-b", 122, 726, "colonySite", ["start-04-planet-02", "start-04-planet-03"]),
  createStartSite("start-04-spaceport", 86, 796, "spaceportSite", ["start-04-planet-01", "start-04-planet-02", "start-04-planet-03"])
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

for (const system of [...boardLayout.startSystems, ...boardLayout.planetSystems]) {
  applySystemMetadata(system);
}

boardLayout.startSites = boardLayout.startSystems.flatMap((system) => (
  (system.colonySites ?? []).map((site) => {
    const point = pointsById.get(site.nodeId);
    return {
      ...site,
      x: point?.x ?? system.x,
      y: point?.y ?? system.y,
      type: "colonySite",
      startSystemId: system.id,
      isStartSite: true
    };
  })
));

boardLayout.colonySites = [...boardLayout.startSites, ...boardLayout.planetSystems.flatMap((system) => system.colonySites ?? [])];

boardLayout.startAssignments = boardLayout.startSystems.map((system, index) => {
  const sites = boardLayout.startSites.filter((site) => site.systemId === system.id);
  return {
    playerIndex: index,
    structures: [
      { type: "colony", locationId: sites[0]?.id },
      { type: "colony", locationId: sites[1]?.id },
      { type: "spaceport", locationId: sites[2]?.id }
    ].filter((structure) => structure.locationId)
  };
});

boardLayout.spaceportLaunchPoints = createUniqueLaunchPoints(boardLayout.colonySites.flatMap((site) => (
  (site.launchNodeIds ?? []).flatMap((nodeId) => [
    createLaunchPoint(nodeId, site.nodeId),
    createLaunchPoint(nodeId, site.id)
  ])
)));

boardLayout.outposts = boardLayout.outposts.map((outpost) => applyOutpostMetadata(outpost));
boardLayout.docks = boardLayout.outposts.flatMap((outpost) => outpost.docks ?? []);

boardLayout.productionPlanets = [...boardLayout.startSystems, ...boardLayout.planetSystems]
  .flatMap((system) => system.planets.map((planet) => ({
    ...planet,
    systemId: system.id
  })));

boardLayout.createRandomPlacement = () => enrichPlacement(createWildSpacePlacement());
boardLayout.createDefaultPlacement = () => enrichPlacement(createDefaultWildSpacePlacement());
boardLayout.enrichPlacement = enrichPlacement;

function createCoordinateRange(startColumn, endColumn, rowNumber) {
  const startIndex = getColumnIndex(startColumn);
  const endIndex = getColumnIndex(endColumn);

  return coordinateColumns
    .slice(startIndex, endIndex + 1)
    .map((column) => `${column}${rowNumber}`);
}

function createSystemSlot(id, source, hexIds) {
  const centers = hexIds.map((hexId) => hexCenter(hexId));
  const averageColumnIndex = hexIds
    .map((hexId) => parseCoordinate(hexId).columnIndex)
    .reduce((sum, columnIndex) => sum + columnIndex, 0) / hexIds.length;
  const center = centers.reduce((sum, point) => ({
    x: sum.x + point.x,
    y: sum.y + point.y
  }), { x: 0, y: 0 });

  return {
    id,
    source,
    hexIds,
    x: roundCoordinate(center.x / centers.length),
    y: roundCoordinate(center.y / centers.length),
    rightOfNebula: averageColumnIndex >= sectorSplitColumnIndex
  };
}

function createDefaultWildSpacePlacement() {
  return placeWildSpaceContents(systemSlots, createWildSpaceContentPool());
}

function createWildSpacePlacement() {
  return placeWildSpaceContents(systemSlots, createWildSpaceContentPool(), { randomize: true });
}

function createWildSpaceContentPool() {
  return [
    ...planetSystemTemplates.map((template) => ({ type: "planetSystem", id: template.id, template })),
    ...outpostTemplates.map((template) => ({ type: "outpost", id: template.id, template })),
    ...Array.from({ length: 4 }, (_, index) => ({
      type: "empty",
      id: `empty-${String(index + 1).padStart(2, "0")}`
    }))
  ];
}

function placeWildSpaceContents(slots, contents, options = {}) {
  const placedSystems = [];
  const placedOutposts = [];
  const placedQuadrants = [];
  const availableSlots = [...slots];
  const remainingContents = options.randomize ? shuffle(contents) : [...contents];
  const unusedIndex = options.randomize
    ? Math.floor(Math.random() * remainingContents.length)
    : remainingContents.length - 1;
  const unusedQuadrant = remainingContents.length > availableSlots.length
    ? remainingContents.splice(unusedIndex, 1)[0]
    : null;
  const placementContents = options.randomize
    ? [
      ...remainingContents.filter((content) => content.type === "outpost"),
      ...shuffle(remainingContents.filter((content) => content.type !== "outpost"))
    ]
    : remainingContents;

  for (const content of placementContents) {
    const slot = options.randomize && content.type === "outpost"
      ? takeWeightedOutpostSlot(availableSlots)
      : takeNextSlot(availableSlots, options.randomize);
    if (!slot) break;

    placedQuadrants.push(createPlacedQuadrantRecord(content, slot));

    if (content.type === "planetSystem") {
      placedSystems.push(instantiatePlanetSystem(content.template, slot));
    } else if (content.type === "outpost") {
      placedOutposts.push(instantiateOutpost(content.template, slot));
    }
  }

  return {
    placedSystems,
    placedOutposts,
    emptySlots: placedQuadrants
      .filter((quadrant) => quadrant.type === "empty")
      .map((quadrant) => quadrant.slotId),
    placedQuadrants,
    unusedQuadrant: unusedQuadrant ? createUnusedQuadrantRecord(unusedQuadrant) : null
  };
}

function takeNextSlot(availableSlots, randomize = false) {
  if (!randomize) return availableSlots.shift();
  const slotIndex = Math.floor(Math.random() * availableSlots.length);
  return availableSlots.splice(slotIndex, 1)[0];
}

function takeWeightedOutpostSlot(availableSlots) {
  const weightedSlots = availableSlots.flatMap((slot) => (
    Array.from({ length: slot.rightOfNebula ? 3 : 1 }, () => slot)
  ));
  const selected = weightedSlots[Math.floor(Math.random() * weightedSlots.length)] ?? availableSlots[0];
  const slotIndex = availableSlots.findIndex((slot) => slot.id === selected.id);
  return availableSlots.splice(slotIndex >= 0 ? slotIndex : 0, 1)[0];
}

function createPlacedQuadrantRecord(content, slot) {
  return {
    id: `${slot.id}-${content.id}`,
    type: content.type,
    contentId: content.id,
    templateId: content.template?.templateId ?? content.template?.id ?? content.id,
    outpostType: content.template?.outpostType ?? null,
    slotId: slot.id,
    slotHexIds: [...slot.hexIds],
    rightOfNebula: Boolean(slot.rightOfNebula),
    discovered: false
  };
}

function createUnusedQuadrantRecord(content) {
  return {
    type: content.type,
    contentId: content.id,
    templateId: content.template?.templateId ?? content.template?.id ?? content.id,
    outpostType: content.template?.outpostType ?? null
  };
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }
  return shuffled;
}

function nodeRequest(id, hexId, corner, type = "space") {
  return { id, hexId, corner, type };
}

function getColumnIndex(column) {
  return coordinateColumns.indexOf(column);
}

function parseCoordinate(hexId) {
  const match = /^([A-O])(\d+)$/.exec(hexId);
  if (!match) throw new Error(`Invalid board coordinate: ${hexId}`);

  return {
    column: match[1],
    columnIndex: getColumnIndex(match[1]),
    row: Number(match[2])
  };
}

function hexCenter(hexId, offsetX = 0, offsetY = 0) {
  const coordinate = parseCoordinate(hexId);
  return {
    x: hexOrigin.x + coordinate.columnIndex * hexHorizontalStep + (coordinate.row % 2 === 1 ? hexHorizontalStep / 2 : 0) + offsetX,
    y: hexOrigin.y + (coordinate.row - 1) * hexVerticalStep + offsetY
  };
}

function createHexCells() {
  return validHexRows.flatMap((row) => row.map((id) => {
    const coordinate = parseCoordinate(id);
    const center = hexCenter(id);

    return {
      id,
      q: coordinate.columnIndex,
      r: coordinate.row,
      column: coordinate.column,
      row: coordinate.row,
      x: roundCoordinate(center.x),
      y: roundCoordinate(center.y),
      kind: nebulaHexes.has(id) ? "nebula" : coordinate.columnIndex >= sectorSplitColumnIndex ? "back" : "front"
    };
  }));
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
  const hexById = new Map(hexes.map((hex) => [hex.id, hex]));
  const bindings = new Map();

  for (const request of semanticNodeRequests) {
    const hex = hexById.get(request.hexId);
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

function createFixedStartSystem(id, name, planetDefinitions) {
  const centers = planetDefinitions.map((planet) => hexCenter(planet.coordinate));
  const center = averagePoints(centers);

  return {
    id,
    name,
    x: roundCoordinate(center.x),
    y: roundCoordinate(center.y),
    resources: planetDefinitions.map((planet) => planet.resource),
    planets: planetDefinitions.map((planet, index) => ({
      id: `${id}-planet-${String(index + 1).padStart(2, "0")}`,
      resource: planet.resource,
      coordinate: planet.coordinate,
      tokenGroup: name
    }))
  };
}

function createPlanetSystemTemplate(id, resources, numbers, tokenGroups = ["triangle", "bracket", "hex"]) {
  return {
    id,
    resources,
    planets: resources.map((resource, index) => ({
      id: `${id}-planet-${String(index + 1).padStart(2, "0")}`,
      resource,
      number: numbers[index] ?? null,
      tokenGroup: tokenGroups[index] ?? "triangle"
    }))
  };
}

function instantiatePlanetSystem(template, slot) {
  return {
    id: template.id,
    templateId: template.id,
    slotId: slot.id,
    slotHexIds: [...slot.hexIds],
    x: slot.x,
    y: slot.y,
    resources: [...template.resources],
    planets: template.planets.map((planet, index) => ({
      ...planet,
      coordinate: slot.hexIds[index] ?? slot.hexIds[0]
    })),
    hidden: true
  };
}

function instantiateOutpost(template, slot) {
  return {
    id: template.id,
    templateId: template.templateId,
    outpostType: template.outpostType,
    slotId: slot.id,
    slotHexIds: [...slot.hexIds],
    coordinate: slot.hexIds[0],
    x: slot.x,
    y: slot.y,
    name: template.name,
    friendshipHolderPlayerId: null,
    friendshipCards: getFriendshipCardIdsForOutpostType(template.outpostType)
  };
}

function getAdjacentNodeIdsForHexIds(hexIds) {
  const hexIdSet = new Set(hexIds ?? []);
  return boardGraph.points
    .filter((point) => point.hexIds?.some((hexId) => hexIdSet.has(hexId)))
    .map((point) => point.id);
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

function createUniqueLaunchPoints(points) {
  const launchPoints = new Map();
  for (const point of points.filter(Boolean)) {
    launchPoints.set(`${point.id}:${point.spaceportLocationId}`, point);
  }
  return [...launchPoints.values()];
}

function normalizeResource(resource) {
  return resource === "trade" ? "goods" : resource;
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

function createColonySiteVisualProfile(system) {
  const planets = (system.planets ?? [])
    .map((planet) => ({
      id: planet.id,
      position: planet.coordinate ? hexCenter(planet.coordinate) : { x: system.x, y: system.y }
    }))
    .sort((left, right) => left.position.y - right.position.y || left.position.x - right.position.x);

  const topY = planets[0]?.position.y ?? 0;
  const topPlanets = planets.filter((planet) => Math.abs(planet.position.y - topY) < 1).sort(sortByX);
  const bottomPlanets = planets.filter((planet) => Math.abs(planet.position.y - topY) >= 1).sort(sortByX);
  const siteIndexByPair = new Map();

  if (topPlanets.length === 2 && bottomPlanets.length === 1) {
    siteIndexByPair.set(createPlanetPairKey(topPlanets[0].id, topPlanets[1].id), 1);
    siteIndexByPair.set(createPlanetPairKey(topPlanets[0].id, bottomPlanets[0].id), 2);
    siteIndexByPair.set(createPlanetPairKey(topPlanets[1].id, bottomPlanets[0].id), 3);
    return { layoutType: "twoTopOneBottom", siteIndexByPair };
  }

  if (topPlanets.length === 1 && bottomPlanets.length === 2) {
    siteIndexByPair.set(createPlanetPairKey(topPlanets[0].id, bottomPlanets[0].id), 1);
    siteIndexByPair.set(createPlanetPairKey(topPlanets[0].id, bottomPlanets[1].id), 2);
    siteIndexByPair.set(createPlanetPairKey(bottomPlanets[0].id, bottomPlanets[1].id), 3);
    return { layoutType: "oneTopTwoBottom", siteIndexByPair };
  }

  planets.forEach((planet, index) => {
    const nextPlanet = planets[(index + 1) % planets.length];
    if (nextPlanet) siteIndexByPair.set(createPlanetPairKey(planet.id, nextPlanet.id), index + 1);
  });
  return { layoutType: "twoTopOneBottom", siteIndexByPair };
}

function sortByX(left, right) {
  return left.position.x - right.position.x;
}

function createPlanetPairKey(firstPlanetId, secondPlanetId) {
  return [firstPlanetId, secondPlanetId].sort().join("|");
}

function applySystemMetadata(system) {
  const planets = system.planets ?? [];
  const planetByHexId = new Map(planets
    .filter((planet) => planet.coordinate)
    .map((planet) => [planet.coordinate, planet]));
  const systemHexIds = new Set(planetByHexId.keys());
  const visualProfile = createColonySiteVisualProfile(system);
  const adjacentNodeIds = [];
  const blockedNodeIds = [];
  const colonySites = [];

  for (const point of boardGraph.points) {
    const adjacentPlanets = point.hexIds
      .map((hexId) => planetByHexId.get(hexId))
      .filter(Boolean);
    if (adjacentPlanets.length === 0) continue;

    if (adjacentPlanets.length === planets.length) {
      blockedNodeIds.push(point.id);
      continue;
    }

    adjacentNodeIds.push(point.id);

    if (adjacentPlanets.length === 2) {
      const adjacentPlanetIds = adjacentPlanets.map((planet) => planet.id);
      colonySites.push({
        id: `${system.id}-${point.id}-colony-site`,
        nodeId: point.id,
        systemId: system.id,
        x: point.x,
        y: point.y,
        adjacentPlanetIds,
        visualLayoutType: visualProfile.layoutType,
        siteIndex: visualProfile.siteIndexByPair.get(createPlanetPairKey(...adjacentPlanetIds)) ?? colonySites.length + 1,
        launchNodeIds: getExternalNeighborNodeIds(point.id, systemHexIds),
        occupiedByStructureId: null
      });
    }
  }

  system.name = system.name ?? system.id;
  system.isExplored = !system.hidden;
  system.planetIds = planets.map((planet) => planet.id);
  system.systemHexIds = [...systemHexIds];
  system.visualLayoutType = visualProfile.layoutType;
  system.adjacentNodeIds = [...new Set(adjacentNodeIds)];
  system.blockedNodeIds = [...new Set(blockedNodeIds)];
  system.colonySites = colonySites;
  system.colonySiteIds = colonySites.map((site) => site.id);
  system.resources = (system.resources ?? []).map(normalizeResource);

  for (const planet of planets) {
    planet.resource = normalizeResource(planet.resource);
    planet.tokenGroup = planet.tokenGroup ?? system.name ?? "triangle";
    Object.assign(planet, planetProduction[planet.id] ?? { number: planet.number ?? null, adjacentSiteIds: [] });
    planet.systemId = system.id;
    planet.resourceType = planet.resource;
    planet.numberToken = planet.number;
    planet.isRevealed = !system.hidden;
  }

  return system;
}

function enrichPlacement(placement) {
  const placedQuadrants = Array.isArray(placement.placedQuadrants) && placement.placedQuadrants.length > 0
    ? placement.placedQuadrants
    : createPlacedQuadrantsFromLegacyPlacement(placement);
  return {
    ...placement,
    placedSystems: (placement.placedSystems ?? []).map((system) => applySystemMetadata(system)),
    placedOutposts: (placement.placedOutposts ?? []).map((outpost) => applyOutpostMetadata(outpost)),
    emptySlots: Array.isArray(placement.emptySlots) ? placement.emptySlots : [],
    placedQuadrants,
    unusedQuadrant: placement.unusedQuadrant ?? null
  };
}

function createPlacedQuadrantsFromLegacyPlacement(placement) {
  return [
    ...(placement.placedSystems ?? []).map((system) => ({
      id: `${system.slotId}-${system.id}`,
      type: "planetSystem",
      contentId: system.id,
      templateId: system.templateId ?? system.id,
      slotId: system.slotId,
      slotHexIds: [...(system.slotHexIds ?? [])],
      rightOfNebula: Boolean(systemSlots.find((slot) => slot.id === system.slotId)?.rightOfNebula),
      discovered: false
    })),
    ...(placement.placedOutposts ?? []).map((outpost) => ({
      id: `${outpost.slotId}-${outpost.id}`,
      type: "outpost",
      contentId: outpost.id,
      templateId: outpost.templateId ?? outpost.id,
      outpostType: outpost.outpostType ?? null,
      slotId: outpost.slotId,
      slotHexIds: [...(outpost.slotHexIds ?? [])],
      rightOfNebula: Boolean(systemSlots.find((slot) => slot.id === outpost.slotId)?.rightOfNebula),
      discovered: false
    })),
    ...(placement.emptySlots ?? []).map((slotId, index) => {
      const slot = systemSlots.find((candidate) => candidate.id === slotId);
      return {
        id: `${slotId}-empty-${String(index + 1).padStart(2, "0")}`,
        type: "empty",
        contentId: `empty-${String(index + 1).padStart(2, "0")}`,
        slotId,
        slotHexIds: [...(slot?.hexIds ?? [])],
        rightOfNebula: Boolean(slot?.rightOfNebula),
        discovered: false
      };
    })
  ];
}

function applyOutpostMetadata(outpost) {
  const template = outpostTemplates.find((candidate) => candidate.id === outpost.id || candidate.templateId === outpost.templateId);
  const outpostType = outpost.outpostType ?? template?.outpostType ?? "greenPeople";
  const nodeProfile = createOutpostNodeProfile(outpost);
  const defaultFriendshipCards = getFriendshipCardIdsForOutpostType(outpostType);

  return {
    ...outpost,
    outpostType,
    dockNodeId: outpost.dockNodeId ?? nodeProfile.dockNodeId,
    docks: Array.isArray(outpost.docks) && outpost.docks.length > 0
      ? outpost.docks
      : nodeProfile.docks,
    dockIds: Array.isArray(outpost.dockIds) && outpost.dockIds.length > 0
      ? outpost.dockIds
      : nodeProfile.docks.map((dock) => dock.id),
    adjacentNodeIds: Array.isArray(outpost.adjacentNodeIds) && outpost.adjacentNodeIds.length > 0
      ? outpost.adjacentNodeIds
      : getAdjacentNodeIdsForHexIds(outpost.slotHexIds),
    tradeStationIds: Array.isArray(outpost.tradeStationIds) ? outpost.tradeStationIds : [],
    friendshipHolderPlayerId: typeof outpost.friendshipHolderPlayerId === "string" ? outpost.friendshipHolderPlayerId : null,
    friendshipCards: Array.isArray(outpost.friendshipCards)
      ? outpost.friendshipCards
      : defaultFriendshipCards
  };
}

function createOutpostNodeProfile(outpost) {
  const outpostHexIds = new Set(outpost.slotHexIds ?? []);
  const adjacentPoints = boardGraph.points
    .map((point) => ({
      ...point,
      outpostHexCount: point.hexIds.filter((hexId) => outpostHexIds.has(hexId)).length
    }))
    .filter((point) => point.outpostHexCount > 0);
  const dockNode = adjacentPoints.find((point) => point.outpostHexCount === 3) ?? null;
  const dockCandidates = adjacentPoints
    .filter((point) => point.id !== dockNode?.id)
    .sort((left, right) => {
      const leftAngle = Math.atan2(left.y - outpost.y, left.x - outpost.x);
      const rightAngle = Math.atan2(right.y - outpost.y, right.x - outpost.x);
      return leftAngle - rightAngle;
    })
    .slice(0, 5);

  return {
    dockNodeId: dockNode?.id ?? dockCandidates[0]?.id ?? null,
    docks: dockCandidates.map((point, index) => ({
      id: `${outpost.id}-dock-${index + 1}`,
      outpostId: outpost.id,
      nodeId: point.id,
      occupiedByStructureId: null
    }))
  };
}

function getExternalNeighborNodeIds(nodeId, systemHexIds) {
  const neighbors = boardConnections
    .filter((connection) => connection.from === nodeId || connection.to === nodeId)
    .map((connection) => connection.from === nodeId ? connection.to : connection.from);

  return neighbors.filter((neighborId) => {
    const point = pointsById.get(neighborId);
    if (!point) return false;
    const touchingSystemHexCount = point.hexIds.filter((hexId) => systemHexIds.has(hexId)).length;
    return touchingSystemHexCount < 2;
  });
}
