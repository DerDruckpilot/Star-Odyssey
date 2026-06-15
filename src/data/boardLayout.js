export const boardLayout = {
  layoutVersion: "starter-15-quadrants-v1",
  width: 1600,
  height: 900,
  spaceQuadrants: [
    { id: "q-01", x: 410, y: 150, kind: "system", ref: "system-01" },
    { id: "q-02", x: 690, y: 145, kind: "empty" },
    { id: "q-03", x: 965, y: 145, kind: "outpost", ref: "outpost-01" },
    { id: "q-04", x: 1245, y: 145, kind: "system", ref: "system-02" },
    { id: "q-05", x: 545, y: 325, kind: "outpost", ref: "outpost-02" },
    { id: "q-06", x: 825, y: 325, kind: "system", ref: "system-03" },
    { id: "q-07", x: 1105, y: 325, kind: "system", ref: "system-04" },
    { id: "q-08", x: 1380, y: 325, kind: "empty" },
    { id: "q-09", x: 410, y: 505, kind: "system", ref: "system-05" },
    { id: "q-10", x: 690, y: 505, kind: "empty" },
    { id: "q-11", x: 965, y: 505, kind: "outpost", ref: "outpost-03" },
    { id: "q-12", x: 1245, y: 505, kind: "system", ref: "system-06" },
    { id: "q-13", x: 545, y: 685, kind: "system", ref: "system-07" },
    { id: "q-14", x: 825, y: 685, kind: "outpost", ref: "outpost-04" },
    { id: "q-15", x: 1105, y: 685, kind: "system", ref: "system-08" }
  ],
  startSystems: [
    {
      id: "start-01",
      x: 120,
      y: 215,
      resources: ["food", "fuel", "carbon"],
      planets: [
        { id: "start-01-planet-01", resource: "food" },
        { id: "start-01-planet-02", resource: "fuel" },
        { id: "start-01-planet-03", resource: "carbon" }
      ]
    },
    {
      id: "start-02",
      x: 120,
      y: 405,
      resources: ["ore", "goods", "food"],
      planets: [
        { id: "start-02-planet-01", resource: "ore" },
        { id: "start-02-planet-02", resource: "goods" },
        { id: "start-02-planet-03", resource: "food" }
      ]
    },
    {
      id: "start-03",
      x: 120,
      y: 595,
      resources: ["carbon", "ore", "fuel"],
      planets: [
        { id: "start-03-planet-01", resource: "carbon" },
        { id: "start-03-planet-02", resource: "ore" },
        { id: "start-03-planet-03", resource: "fuel" }
      ]
    },
    {
      id: "start-04",
      x: 120,
      y: 775,
      resources: ["goods", "food", "ore"],
      planets: [
        { id: "start-04-planet-01", resource: "goods" },
        { id: "start-04-planet-02", resource: "food" },
        { id: "start-04-planet-03", resource: "ore" }
      ]
    }
  ],
  planetSystems: [
    {
      id: "system-01",
      x: 410,
      y: 150,
      resources: ["carbon", "food", "fuel"],
      planets: [
        { id: "system-01-planet-01", resource: "carbon" },
        { id: "system-01-planet-02", resource: "food" },
        { id: "system-01-planet-03", resource: "fuel" }
      ],
      hidden: true
    },
    {
      id: "system-02",
      x: 1245,
      y: 145,
      resources: ["ore", "goods", "carbon"],
      planets: [
        { id: "system-02-planet-01", resource: "ore" },
        { id: "system-02-planet-02", resource: "goods" },
        { id: "system-02-planet-03", resource: "carbon" }
      ],
      hidden: true
    },
    {
      id: "system-03",
      x: 825,
      y: 325,
      resources: ["fuel", "ore", "food"],
      planets: [
        { id: "system-03-planet-01", resource: "fuel" },
        { id: "system-03-planet-02", resource: "ore" },
        { id: "system-03-planet-03", resource: "food" }
      ],
      hidden: true
    },
    {
      id: "system-04",
      x: 1105,
      y: 325,
      resources: ["goods", "carbon", "ore"],
      planets: [
        { id: "system-04-planet-01", resource: "goods" },
        { id: "system-04-planet-02", resource: "carbon" },
        { id: "system-04-planet-03", resource: "ore" }
      ],
      hidden: true
    },
    {
      id: "system-05",
      x: 410,
      y: 505,
      resources: ["food", "carbon", "goods"],
      planets: [
        { id: "system-05-planet-01", resource: "food" },
        { id: "system-05-planet-02", resource: "carbon" },
        { id: "system-05-planet-03", resource: "goods" }
      ],
      hidden: true
    },
    {
      id: "system-06",
      x: 1245,
      y: 505,
      resources: ["fuel", "food", "ore"],
      planets: [
        { id: "system-06-planet-01", resource: "fuel" },
        { id: "system-06-planet-02", resource: "food" },
        { id: "system-06-planet-03", resource: "ore" }
      ],
      hidden: true
    },
    {
      id: "system-07",
      x: 545,
      y: 685,
      resources: ["carbon", "ore", "goods"],
      planets: [
        { id: "system-07-planet-01", resource: "carbon" },
        { id: "system-07-planet-02", resource: "ore" },
        { id: "system-07-planet-03", resource: "goods" }
      ],
      hidden: true
    },
    {
      id: "system-08",
      x: 1105,
      y: 685,
      resources: ["food", "fuel", "carbon"],
      planets: [
        { id: "system-08-planet-01", resource: "food" },
        { id: "system-08-planet-02", resource: "fuel" },
        { id: "system-08-planet-03", resource: "carbon" }
      ],
      hidden: true
    }
  ],
  outposts: [
    { id: "outpost-01", x: 965, y: 145, name: "A" },
    { id: "outpost-02", x: 545, y: 325, name: "B" },
    { id: "outpost-03", x: 965, y: 505, name: "C" },
    { id: "outpost-04", x: 825, y: 685, name: "D" }
  ],
  points: [
    { id: "p01", x: 215, y: 215, type: "spaceport", region: "start" },
    { id: "p02", x: 300, y: 150, type: "space" },
    { id: "p03", x: 410, y: 240, type: "colony" },
    { id: "p04", x: 540, y: 150, type: "space" },
    { id: "p05", x: 690, y: 210, type: "space" },
    { id: "p06", x: 840, y: 145, type: "dock" },
    { id: "p07", x: 965, y: 240, type: "dock" },
    { id: "p08", x: 1115, y: 160, type: "space" },
    { id: "p09", x: 1245, y: 240, type: "colony" },
    { id: "p10", x: 1390, y: 170, type: "space" },
    { id: "p11", x: 215, y: 405, type: "spaceport", region: "start" },
    { id: "p12", x: 335, y: 330, type: "space" },
    { id: "p13", x: 450, y: 415, type: "dock" },
    { id: "p14", x: 585, y: 340, type: "dock" },
    { id: "p15", x: 720, y: 405, type: "space" },
    { id: "p16", x: 825, y: 250, type: "colony" },
    { id: "p17", x: 940, y: 360, type: "space" },
    { id: "p18", x: 1105, y: 425, type: "colony" },
    { id: "p19", x: 1265, y: 345, type: "space" },
    { id: "p20", x: 1410, y: 420, type: "space" },
    { id: "p21", x: 215, y: 595, type: "spaceport", region: "start" },
    { id: "p22", x: 330, y: 515, type: "space" },
    { id: "p23", x: 410, y: 610, type: "colony" },
    { id: "p24", x: 560, y: 530, type: "space" },
    { id: "p25", x: 690, y: 595, type: "space" },
    { id: "p26", x: 840, y: 520, type: "dock" },
    { id: "p27", x: 965, y: 600, type: "dock" },
    { id: "p28", x: 1110, y: 525, type: "space" },
    { id: "p29", x: 1245, y: 610, type: "colony" },
    { id: "p30", x: 1390, y: 540, type: "space" },
    { id: "p31", x: 215, y: 775, type: "spaceport", region: "start" },
    { id: "p32", x: 335, y: 705, type: "space" },
    { id: "p33", x: 545, y: 780, type: "colony" },
    { id: "p34", x: 700, y: 715, type: "dock" },
    { id: "p35", x: 825, y: 780, type: "dock" },
    { id: "p36", x: 980, y: 720, type: "space" },
    { id: "p37", x: 1105, y: 780, type: "colony" },
    { id: "p38", x: 1280, y: 710, type: "space" }
  ],
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
    ["p12", "p22"], ["p20", "p30"]
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

// Temporary digital start sites until the exact physical start setup is fully mapped.
boardLayout.startSites = [
  { id: "start-01-colony-a", x: 66, y: 172, type: "colonySite", adjacentPlanetIds: ["start-01-planet-01", "start-01-planet-02"] },
  { id: "start-01-colony-b", x: 174, y: 172, type: "colonySite", adjacentPlanetIds: ["start-01-planet-02", "start-01-planet-03"] },
  { id: "start-01-spaceport", x: 120, y: 284, type: "spaceportSite", adjacentPlanetIds: ["start-01-planet-01", "start-01-planet-02", "start-01-planet-03"] },
  { id: "start-02-colony-a", x: 66, y: 362, type: "colonySite", adjacentPlanetIds: ["start-02-planet-01", "start-02-planet-02"] },
  { id: "start-02-colony-b", x: 174, y: 362, type: "colonySite", adjacentPlanetIds: ["start-02-planet-02", "start-02-planet-03"] },
  { id: "start-02-spaceport", x: 120, y: 474, type: "spaceportSite", adjacentPlanetIds: ["start-02-planet-01", "start-02-planet-02", "start-02-planet-03"] },
  { id: "start-03-colony-a", x: 66, y: 552, type: "colonySite", adjacentPlanetIds: ["start-03-planet-01", "start-03-planet-02"] },
  { id: "start-03-colony-b", x: 174, y: 552, type: "colonySite", adjacentPlanetIds: ["start-03-planet-02", "start-03-planet-03"] },
  { id: "start-03-spaceport", x: 120, y: 664, type: "spaceportSite", adjacentPlanetIds: ["start-03-planet-01", "start-03-planet-02", "start-03-planet-03"] },
  { id: "start-04-colony-a", x: 66, y: 732, type: "colonySite", adjacentPlanetIds: ["start-04-planet-01", "start-04-planet-02"] },
  { id: "start-04-colony-b", x: 174, y: 732, type: "colonySite", adjacentPlanetIds: ["start-04-planet-02", "start-04-planet-03"] },
  { id: "start-04-spaceport", x: 120, y: 844, type: "spaceportSite", adjacentPlanetIds: ["start-04-planet-01", "start-04-planet-02", "start-04-planet-03"] }
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
  { id: "start-01-launch-a", x: 214, y: 262, spaceportLocationId: "start-01-spaceport" },
  { id: "start-01-launch-b", x: 214, y: 306, spaceportLocationId: "start-01-spaceport" },
  { id: "start-01-launch-c", x: 250, y: 284, spaceportLocationId: "start-01-spaceport" },
  { id: "start-01-colony-a-launch-a", x: 66, y: 216, spaceportLocationId: "start-01-colony-a" },
  { id: "start-01-colony-b-launch-a", x: 174, y: 216, spaceportLocationId: "start-01-colony-b" },
  { id: "start-02-launch-a", x: 214, y: 452, spaceportLocationId: "start-02-spaceport" },
  { id: "start-02-launch-b", x: 214, y: 496, spaceportLocationId: "start-02-spaceport" },
  { id: "start-02-launch-c", x: 250, y: 474, spaceportLocationId: "start-02-spaceport" },
  { id: "start-02-colony-a-launch-a", x: 66, y: 406, spaceportLocationId: "start-02-colony-a" },
  { id: "start-02-colony-b-launch-a", x: 174, y: 406, spaceportLocationId: "start-02-colony-b" },
  { id: "start-03-launch-a", x: 214, y: 642, spaceportLocationId: "start-03-spaceport" },
  { id: "start-03-launch-b", x: 214, y: 686, spaceportLocationId: "start-03-spaceport" },
  { id: "start-03-launch-c", x: 250, y: 664, spaceportLocationId: "start-03-spaceport" },
  { id: "start-03-colony-a-launch-a", x: 66, y: 596, spaceportLocationId: "start-03-colony-a" },
  { id: "start-03-colony-b-launch-a", x: 174, y: 596, spaceportLocationId: "start-03-colony-b" },
  { id: "start-04-launch-a", x: 214, y: 822, spaceportLocationId: "start-04-spaceport" },
  { id: "start-04-launch-b", x: 214, y: 866, spaceportLocationId: "start-04-spaceport" },
  { id: "start-04-launch-c", x: 250, y: 844, spaceportLocationId: "start-04-spaceport" },
  { id: "start-04-colony-a-launch-a", x: 66, y: 776, spaceportLocationId: "start-04-colony-a" },
  { id: "start-04-colony-b-launch-a", x: 174, y: 776, spaceportLocationId: "start-04-colony-b" },
  { id: "p03-launch-a", x: 374, y: 282, spaceportLocationId: "p03" },
  { id: "p09-launch-a", x: 1286, y: 282, spaceportLocationId: "p09" },
  { id: "p16-launch-a", x: 860, y: 292, spaceportLocationId: "p16" },
  { id: "p18-launch-a", x: 1144, y: 468, spaceportLocationId: "p18" },
  { id: "p23-launch-a", x: 446, y: 652, spaceportLocationId: "p23" },
  { id: "p29-launch-a", x: 1284, y: 652, spaceportLocationId: "p29" },
  { id: "p33-launch-a", x: 584, y: 822, spaceportLocationId: "p33" },
  { id: "p37-launch-a", x: 1144, y: 822, spaceportLocationId: "p37" }
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

for (const system of [...boardLayout.startSystems, ...boardLayout.planetSystems]) {
  system.resources = system.resources.map(normalizeResource);
  for (const planet of system.planets) {
    planet.resource = normalizeResource(planet.resource);
    Object.assign(planet, planetProduction[planet.id] ?? { number: null, adjacentSiteIds: [] });
  }
}

boardLayout.productionPlanets = [...boardLayout.startSystems, ...boardLayout.planetSystems]
  .flatMap((system) => system.planets.map((planet) => ({
    ...planet,
    systemId: system.id
  })));

function normalizeResource(resource) {
  return resource === "trade" ? "goods" : resource;
}
