import { bankTradeRates, buildActionDefinitions, upgradeDefinitions } from "../data/buildCosts.js";

const playerColorKeys = ["red", "blue", "yellow", "white"];

export const currentGameStorageKey = "star-odyssey-current-game";
export const turnPhases = ["setup", "production", "tradeBuild", "flight", "turnEnd"];

export function createGameState({ language, playerCount, boardLayout }) {
  const now = new Date().toISOString();
  const safePlayerCount = [2, 3, 4].includes(playerCount) ? playerCount : 2;
  const startingStructures = createStartingStructures(safePlayerCount, boardLayout);
  const startingShips = createStartingShips(safePlayerCount, boardLayout, startingStructures);
  const players = attachPlayerAssets(createPlayers(safePlayerCount, language), startingStructures, startingShips);

  return {
    gameId: createId("game"),
    createdAt: now,
    updatedAt: now,
    language,
    playerCount: safePlayerCount,
    players,
    currentPlayerIndex: 0,
    turnNumber: 1,
    phase: "production",
    lastRoll: null,
    board: {
      layoutVersion: boardLayout.layoutVersion,
      selectedElement: null,
      exploredSystems: [],
      structures: startingStructures,
      colonies: startingStructures.filter((structure) => structure.type === "colony"),
      stations: [],
      ships: startingShips
    },
    log: [
      {
        id: createId("log"),
        createdAt: now,
        type: "system",
        messageKey: "logNewGameStarted",
        messageParams: {}
      }
    ]
  };
}

export function rollProduction(gameState, boardLayout) {
  const firstDie = rollDie();
  const secondDie = rollDie();
  const total = firstDie + secondDie;
  const productionResult = total === 7
    ? {
      players: gameState.players,
      logEntries: [
        {
          type: "turn",
          messageKey: "logSevenPlaceholder",
          messageParams: {}
        }
      ]
    }
    : distributeProduction(gameState, boardLayout, total);

  return updateGameState(gameState, {
    players: productionResult.players,
    phase: "tradeBuild",
    lastRoll: {
      dice: [firstDie, secondDie],
      total
    },
    logEntries: [
      {
        type: "turn",
        messageKey: "logProductionRolled",
        messageParams: { total }
      },
      ...productionResult.logEntries
    ]
  });
}

export function advanceToFlightPhase(gameState) {
  return updateGameState(gameState, {
    phase: "flight",
    logEntry: {
      type: "turn",
      messageKey: "logToFlightPhase",
      messageParams: {
        player: getActivePlayerName(gameState)
      }
    }
  });
}

export function tradeWithSupply(gameState, { fromResource, toResource }) {
  if (gameState.phase !== "tradeBuild" || fromResource === toResource) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const rate = getTradeRate(fromResource);
  if (!activePlayer || !canPay(activePlayer.resources, { [fromResource]: rate })) return gameState;

  const players = gameState.players.map((player, index) => {
    if (index !== gameState.currentPlayerIndex) return player;
    const resources = normalizeResources(player.resources);

    return {
      ...player,
      resources: {
        ...resources,
        [fromResource]: (resources[fromResource] ?? 0) - rate,
        [toResource]: (resources[toResource] ?? 0) + 1
      }
    };
  });

  return updateGameState(gameState, {
    players,
    logEntry: {
      type: "trade",
      messageKey: "logBankTrade",
      messageParams: {
        player: activePlayer.name,
        giveAmount: rate,
        giveResource: fromResource,
        receiveAmount: 1,
        receiveResource: toResource
      }
    }
  });
}

export function buyUpgrade(gameState, upgradeId) {
  if (gameState.phase !== "tradeBuild") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const definition = upgradeDefinitions.find((upgrade) => upgrade.id === upgradeId);
  const currentLevel = activePlayer?.upgrades?.[upgradeId] ?? 0;
  if (!activePlayer || !definition || currentLevel >= definition.limit || !canPay(activePlayer.resources, definition.cost)) {
    return gameState;
  }

  const players = gameState.players.map((player, index) => {
    if (index !== gameState.currentPlayerIndex) return player;

    return {
      ...player,
      resources: payCost(player.resources, definition.cost),
      upgrades: {
        ...normalizeUpgrades(player.upgrades),
        [upgradeId]: currentLevel + 1
      }
    };
  });

  return updateGameState(gameState, {
    players,
    logEntry: {
      type: "build",
      messageKey: "logUpgradeBuilt",
      messageParams: {
        player: activePlayer.name,
        upgrade: upgradeId
      }
    }
  });
}

export function buildShip(gameState, boardLayout, shipType) {
  if (gameState.phase !== "tradeBuild" || !["colonyShip", "tradeShip"].includes(shipType)) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const definition = buildActionDefinitions.find((action) => action.id === shipType);
  const launchPoint = findFreeLaunchPoint(gameState, boardLayout, activePlayer?.id);
  if (!activePlayer || !definition || !launchPoint || !canPay(activePlayer.resources, definition.cost)) {
    return gameState;
  }

  const ship = {
    id: createId(shipType),
    ownerPlayerId: activePlayer.id,
    type: shipType,
    locationId: launchPoint.id,
    status: "docked"
  };
  const ships = [...normalizeShips(gameState.board?.ships), ship];
  const players = updatePlayerById(gameState.players, activePlayer.id, (player) => ({
    ...player,
    resources: payCost(player.resources, definition.cost),
    ships: [...normalizeShips(player.ships), ship]
  }));

  return updateGameState(gameState, {
    players,
    board: {
      ...gameState.board,
      ships
    },
    logEntry: {
      type: "build",
      messageKey: shipType === "colonyShip" ? "logColonyShipBuilt" : "logTradeShipBuilt",
      messageParams: {
        player: activePlayer.name
      }
    }
  });
}

export function upgradeColonyToSpaceport(gameState) {
  if (gameState.phase !== "tradeBuild") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const definition = buildActionDefinitions.find((action) => action.id === "spaceport");
  const colony = findUpgradeableColony(gameState, activePlayer?.id);
  if (!activePlayer || !definition || !colony || !canPay(activePlayer.resources, definition.cost)) {
    return gameState;
  }

  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, { startSites: [], startAssignments: [] })
    .map((structure) => structure.id === colony.id ? { ...structure, type: "spaceport" } : structure);
  const players = updatePlayerById(gameState.players, activePlayer.id, (player) => ({
    ...player,
    victoryPoints: player.victoryPoints + 1,
    resources: payCost(player.resources, definition.cost),
    structures: structures.filter((structure) => structure.ownerPlayerId === player.id)
  }));

  return updateGameState(gameState, {
    players,
    board: {
      ...gameState.board,
      structures,
      colonies: structures.filter((structure) => structure.type === "colony")
    },
    logEntry: {
      type: "build",
      messageKey: "logSpaceportBuilt",
      messageParams: {
        player: activePlayer.name
      }
    }
  });
}

export function endCurrentTurn(gameState) {
  const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.playerCount;
  const nextTurnNumber = nextPlayerIndex === 0 ? gameState.turnNumber + 1 : gameState.turnNumber;

  return updateGameState(gameState, {
    currentPlayerIndex: nextPlayerIndex,
    turnNumber: nextTurnNumber,
    phase: "production",
    lastRoll: null,
    logEntry: {
      type: "turn",
      messageKey: "logTurnEnded",
      messageParams: {
        player: getActivePlayerName(gameState),
        nextPlayer: gameState.players[nextPlayerIndex]?.name ?? "",
        round: nextTurnNumber
      }
    }
  });
}

export function normalizeGameState(gameState, { language, playerCount, boardLayout }) {
  if (!gameState || typeof gameState !== "object") {
    return createGameState({ language, playerCount, boardLayout });
  }

  const fallback = createGameState({
    language: gameState.language || language,
    playerCount: gameState.playerCount || playerCount,
    boardLayout
  });

  const normalizedPlayerCount = [2, 3, 4].includes(gameState.playerCount)
    ? gameState.playerCount
    : fallback.playerCount;
  const fallbackPlayers = createPlayers(normalizedPlayerCount, gameState.language || language);
  const normalizedStructures = normalizeStructures(gameState.board?.structures, normalizedPlayerCount, boardLayout);
  const normalizedShips = normalizeShips(gameState.board?.ships);
  const normalizedPlayers = fallbackPlayers.map((fallbackPlayer, index) => (
    Array.isArray(gameState.players) && gameState.players[index]
      ? normalizePlayer(gameState.players[index], index, gameState.language || language)
      : fallbackPlayer
  )).map((player) => ({
    ...player,
    structures: normalizedStructures.filter((structure) => structure.ownerPlayerId === player.id),
    ships: normalizedShips.filter((ship) => ship.ownerPlayerId === player.id)
  }));
  const normalizedCurrentPlayerIndex = Number.isInteger(gameState.currentPlayerIndex)
    ? Math.min(Math.max(gameState.currentPlayerIndex, 0), normalizedPlayerCount - 1)
    : 0;

  return {
    ...fallback,
    ...gameState,
    language: gameState.language || language,
    playerCount: normalizedPlayerCount,
    players: normalizedPlayers,
    currentPlayerIndex: normalizedCurrentPlayerIndex,
    turnNumber: Number.isInteger(gameState.turnNumber) ? gameState.turnNumber : 1,
    phase: normalizePhase(gameState.phase),
    lastRoll: normalizeRoll(gameState.lastRoll),
    board: {
      ...fallback.board,
      ...(gameState.board || {}),
      layoutVersion: gameState.board?.layoutVersion || boardLayout.layoutVersion,
      structures: normalizedStructures,
      colonies: normalizedStructures.filter((structure) => structure.type === "colony"),
      ships: normalizedShips
    },
    log: normalizeLog(gameState.log, fallback.log)
  };
}

export function touchGameState(gameState) {
  return {
    ...gameState,
    updatedAt: new Date().toISOString()
  };
}

function createPlayers(playerCount, language) {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: language === "en" ? `Player ${index + 1}` : `Spieler ${index + 1}`,
    color: playerColorKeys[index],
    victoryPoints: 4,
    resources: createEmptyResources(),
    upgrades: createDefaultUpgrades(),
    halfMedals: 0,
    ships: [],
    structures: [],
    stations: []
  }));
}

function normalizePlayer(player, index, language) {
  const fallback = createPlayers(index + 1, language)[index];

  return {
    ...fallback,
    ...player,
    id: player.id || fallback.id,
    name: player.name || fallback.name,
    color: player.color || fallback.color,
    victoryPoints: Number.isInteger(player.victoryPoints) ? player.victoryPoints : 4,
    resources: normalizeResources(player.resources),
    upgrades: normalizeUpgrades(player.upgrades),
    halfMedals: Number.isInteger(player.halfMedals) ? player.halfMedals : 0,
    ships: Array.isArray(player.ships) ? player.ships : [],
    structures: Array.isArray(player.structures) ? player.structures : [],
    stations: Array.isArray(player.stations) ? player.stations : []
  };
}

function createEmptyResources() {
  return {
    ore: 0,
    fuel: 0,
    carbon: 0,
    food: 0,
    goods: 0
  };
}

function createDefaultUpgrades() {
  return {
    drive: 0,
    cargo: 0,
    cannon: 0
  };
}

function updateGameState(gameState, { logEntry, logEntries, ...updates }) {
  const now = new Date().toISOString();
  const entries = logEntries ?? (logEntry ? [logEntry] : []);

  return {
    ...gameState,
    ...updates,
    updatedAt: now,
    log: entries.length > 0
      ? [
        ...normalizeLog(gameState.log, []),
        ...entries.map((entry) => ({
          id: createId("log"),
          createdAt: now,
          ...entry
        }))
      ]
      : normalizeLog(gameState.log, [])
  };
}

function createStartingStructures(playerCount, boardLayout) {
  const sitesById = new Map((boardLayout.startSites ?? []).map((site) => [site.id, site]));
  const assignments = (boardLayout.startAssignments ?? []).slice(0, playerCount);

  return assignments.flatMap((assignment) => {
    const ownerPlayerId = `player-${assignment.playerIndex + 1}`;
    return assignment.structures.map((structure, index) => {
      const site = sitesById.get(structure.locationId);

      return {
        id: `${ownerPlayerId}-${structure.type}-${index + 1}`,
        ownerPlayerId,
        type: structure.type,
        locationId: structure.locationId,
        adjacentPlanetIds: site?.adjacentPlanetIds ?? []
      };
    });
  });
}

function createStartingShips(playerCount, boardLayout, structures) {
  const occupiedLaunchPointIds = new Set();
  const ships = [];

  for (let index = 0; index < playerCount; index += 1) {
    const ownerPlayerId = `player-${index + 1}`;
    const launchPoint = findFreeLaunchPointForStructures(
      boardLayout,
      structures.filter((structure) => structure.ownerPlayerId === ownerPlayerId),
      occupiedLaunchPointIds
    );
    if (!launchPoint) continue;

    occupiedLaunchPointIds.add(launchPoint.id);
    ships.push({
      id: `${ownerPlayerId}-colony-ship-1`,
      ownerPlayerId,
      type: "colonyShip",
      locationId: launchPoint.id,
      status: "docked"
    });
  }

  return ships;
}

function attachPlayerAssets(players, structures, ships) {
  return players.map((player) => ({
    ...player,
    structures: structures.filter((structure) => structure.ownerPlayerId === player.id),
    ships: ships.filter((ship) => ship.ownerPlayerId === player.id)
  }));
}

function normalizeStructures(structures, playerCount, boardLayout) {
  if (!Array.isArray(structures) || structures.length === 0) {
    return createStartingStructures(playerCount, boardLayout);
  }

  return structures
    .filter((structure) => structure && structure.id && structure.ownerPlayerId && structure.locationId)
    .map((structure) => ({
      id: structure.id,
      ownerPlayerId: structure.ownerPlayerId,
      type: structure.type === "spaceport" ? "spaceport" : "colony",
      locationId: structure.locationId,
      adjacentPlanetIds: Array.isArray(structure.adjacentPlanetIds) ? structure.adjacentPlanetIds : []
    }));
}

function normalizeShips(ships = []) {
  return Array.isArray(ships)
    ? ships
      .filter((ship) => ship && ship.id && ship.ownerPlayerId && ship.locationId)
      .map((ship) => ({
        id: ship.id,
        ownerPlayerId: ship.ownerPlayerId,
        type: ship.type === "tradeShip" ? "tradeShip" : "colonyShip",
        locationId: ship.locationId,
        status: ship.status === "active" ? "active" : "docked"
      }))
    : [];
}

function findFreeLaunchPoint(gameState, boardLayout, ownerPlayerId) {
  const occupiedLaunchPointIds = new Set(normalizeShips(gameState.board?.ships).map((ship) => ship.locationId));
  const ownerStructures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout)
    .filter((structure) => structure.ownerPlayerId === ownerPlayerId);

  return findFreeLaunchPointForStructures(boardLayout, ownerStructures, occupiedLaunchPointIds);
}

function findFreeLaunchPointForStructures(boardLayout, structures, occupiedLaunchPointIds) {
  const ownSpaceportLocationIds = new Set(
    structures
      .filter((structure) => structure.type === "spaceport")
      .map((structure) => structure.locationId)
  );

  return (boardLayout.spaceportLaunchPoints ?? [])
    .find((point) => ownSpaceportLocationIds.has(point.spaceportLocationId) && !occupiedLaunchPointIds.has(point.id));
}

function findUpgradeableColony(gameState, ownerPlayerId) {
  return normalizeStructures(gameState.board?.structures, gameState.playerCount, { startSites: [], startAssignments: [] })
    .find((structure) => structure.ownerPlayerId === ownerPlayerId && structure.type === "colony");
}

function updatePlayerById(players, playerId, updatePlayer) {
  return players.map((player) => player.id === playerId ? updatePlayer(player) : player);
}

function distributeProduction(gameState, boardLayout, rollTotal) {
  const structures = gameState.board?.structures ?? [];
  const producingPlanets = (boardLayout.productionPlanets ?? [])
    .filter((planet) => planet.number === rollTotal);
  const players = gameState.players.map((player) => ({
    ...player,
    resources: normalizeResources(player.resources)
  }));
  const playersById = new Map(players.map((player) => [player.id, player]));
  const gains = [];

  for (const planet of producingPlanets) {
    for (const structure of structures) {
      if (!structure.adjacentPlanetIds?.includes(planet.id)) continue;
      const player = playersById.get(structure.ownerPlayerId);
      if (!player) continue;

      player.resources[planet.resource] = (player.resources[planet.resource] ?? 0) + 1;
      gains.push({
        player: player.name,
        resource: planet.resource,
        amount: 1
      });
    }
  }

  return {
    players,
    logEntries: gains.length > 0
      ? gains.map((gain) => ({
        type: "production",
        messageKey: "logResourceGained",
        messageParams: gain
      }))
      : [
        {
          type: "production",
          messageKey: "logNoProduction",
          messageParams: {}
        }
      ]
  };
}

function normalizeResources(resources = {}) {
  return {
    ...createEmptyResources(),
    ...resources,
    ore: resources.ore ?? resources.erz ?? 0,
    fuel: resources.fuel ?? resources.treibstoff ?? 0,
    food: resources.food ?? resources.nahrung ?? 0,
    goods: resources.goods ?? resources.handelsware ?? resources.trade ?? 0
  };
}

function normalizeUpgrades(upgrades = {}) {
  return {
    ...createDefaultUpgrades(),
    ...upgrades,
    drive: upgrades.drive ?? upgrades.antrieb ?? 0,
    cargo: upgrades.cargo ?? upgrades.frachtmodul ?? 0,
    cannon: upgrades.cannon ?? upgrades.bordkanone ?? 0
  };
}

function getTradeRate(resource) {
  return resource === "goods" ? bankTradeRates.goods : bankTradeRates.default;
}

function canPay(resources, cost) {
  const normalizedResources = normalizeResources(resources);
  return Object.entries(cost).every(([resource, amount]) => (normalizedResources[resource] ?? 0) >= amount);
}

function payCost(resources, cost) {
  const paidResources = normalizeResources(resources);
  for (const [resource, amount] of Object.entries(cost)) {
    paidResources[resource] = (paidResources[resource] ?? 0) - amount;
  }
  return paidResources;
}

function getActivePlayerName(gameState) {
  return gameState.players?.[gameState.currentPlayerIndex]?.name ?? "";
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function normalizePhase(phase) {
  if (turnPhases.includes(phase)) return phase;
  if (phase === "preparation") return "production";
  return "production";
}

function normalizeRoll(roll) {
  if (!roll || typeof roll !== "object") return null;
  if (!Number.isInteger(roll.total)) return null;
  const dice = Array.isArray(roll.dice) && roll.dice.length === 2 ? roll.dice : [];

  return {
    dice,
    total: roll.total
  };
}

function normalizeLog(log, fallbackLog) {
  return Array.isArray(log) ? log : fallbackLog;
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
