import { bankTradeRates, buildActionDefinitions, upgradeDefinitions } from "../data/buildCosts.js";

const playerColorKeys = ["red", "blue", "yellow", "white"];
const supplyResourceTypes = ["ore", "fuel", "carbon", "food", "goods"];
const supplyCardsPerResource = 8;

export const currentGameStorageKey = "star-odyssey-current-game";
export const turnPhases = ["placement", "setup", "production", "tradeBuild", "flight", "turnEnd"];

export function createGameState({ language, playerCount, boardLayout }) {
  const now = new Date().toISOString();
  const safePlayerCount = [2, 3, 4].includes(playerCount) ? playerCount : 2;
  const boardPlacement = createBoardPlacement(boardLayout);
  const startingStructures = [];
  const startingShips = [];
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
    phase: "placement",
    lastRoll: null,
    flightSpeedBase: null,
    flightSpeedTotal: null,
    remainingMovementByShipId: {},
    hasRolledFlightSpeed: false,
    supplyDeck: createSupplyDeck(),
    supplyDiscard: [],
    hasDrawnSupplyThisTurn: false,
    supplyDrawTurnKey: null,
    placement: createPlacementState(safePlayerCount),
    board: {
      layoutVersion: boardLayout.layoutVersion,
      selectedElement: null,
      placedSystems: boardPlacement.placedSystems,
      placedOutposts: boardPlacement.placedOutposts,
      emptySlots: boardPlacement.emptySlots,
      exploredSystems: normalizeExploredSystems([], boardLayout, boardPlacement.placedSystems),
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

export function rollPlacementStart(gameState, forcedRoll = null) {
  if (gameState.phase !== "placement" || gameState.placement?.step !== "rollStartPlayer") return gameState;

  const placement = normalizePlacementState(gameState.placement, gameState.playerCount);
  const rollingPlayerId = placement.rollPlayerIds[placement.currentRollIndex];
  const rollingPlayerIndex = getPlayerIndexById(gameState, rollingPlayerId);
  if (rollingPlayerIndex < 0) return gameState;

  const roll = forcedRoll ?? rollTwoDice();
  const rolls = {
    ...placement.rolls,
    [rollingPlayerId]: roll
  };
  const nextRollIndex = placement.currentRollIndex + 1;

  if (nextRollIndex < placement.rollPlayerIds.length) {
    const nextPlayerId = placement.rollPlayerIds[nextRollIndex];
    return updateGameState(gameState, {
      currentPlayerIndex: getPlayerIndexById(gameState, nextPlayerId),
      placement: {
        ...placement,
        rolls,
        currentRollIndex: nextRollIndex
      },
      logEntry: {
        type: "placement",
        messageKey: "logPlacementRolled",
        messageParams: {
          player: gameState.players[rollingPlayerIndex]?.name ?? rollingPlayerId,
          total: roll.total
        }
      }
    });
  }

  const maxRoll = Math.max(...Object.values(rolls).map((entry) => entry.total));
  const tiedPlayerIds = Object.entries(rolls)
    .filter(([, entry]) => entry.total === maxRoll)
    .map(([playerId]) => playerId);

  if (tiedPlayerIds.length > 1) {
    return updateGameState(gameState, {
      currentPlayerIndex: getPlayerIndexById(gameState, tiedPlayerIds[0]),
      placement: {
        ...placement,
        rollPlayerIds: tiedPlayerIds,
        currentRollIndex: 0,
        rolls: {},
        rollHistory: [...placement.rollHistory, rolls],
        tiedPlayerIds
      },
      logEntry: {
        type: "placement",
        messageKey: "logPlacementTie",
        messageParams: {}
      }
    });
  }

  const startPlayerId = tiedPlayerIds[0];
  const startPlayerIndex = getPlayerIndexById(gameState, startPlayerId);
  const order = createPlacementOrder(startPlayerIndex, gameState.playerCount)
    .map((index) => gameState.players[index]?.id)
    .filter(Boolean);

  return updateGameState(gameState, {
    currentPlayerIndex: startPlayerIndex,
    placement: {
      ...placement,
      step: "placeSpaceport",
      startPlayerId,
      order,
      reverseOrder: [...order].reverse(),
      currentOrderIndex: 0,
      rolls,
      rollHistory: [...placement.rollHistory, rolls],
      tiedPlayerIds: [],
      selectedSpaceportSiteId: null
    },
    logEntry: {
      type: "placement",
      messageKey: "logPlacementStartPlayer",
      messageParams: {
        player: gameState.players[startPlayerIndex]?.name ?? startPlayerId
      }
    }
  });
}

export function placeInitialSpaceport(gameState, boardLayout, siteId) {
  if (gameState.phase !== "placement" || gameState.placement?.step !== "placeSpaceport") return gameState;

  const placement = normalizePlacementState(gameState.placement, gameState.playerCount);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const site = getStartColonySite(boardLayout, siteId);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout, { useFallback: false });
  if (!activePlayer || !site || isStructureAtLocation(structures, site.nodeId)) return gameState;

  const structure = {
    id: createId("spaceport"),
    ownerPlayerId: activePlayer.id,
    type: "spaceport",
    locationId: site.nodeId,
    systemId: site.systemId,
    adjacentPlanetIds: site.adjacentPlanetIds ?? []
  };

  return updateGameState(gameState, {
    board: {
      ...gameState.board,
      selectedElement: { type: "spacePoint", id: site.nodeId },
      structures: [...structures, structure],
      colonies: structures.filter((candidate) => candidate.type === "colony"),
      ships: normalizeShips(gameState.board?.ships)
    },
    placement: {
      ...placement,
      step: "placeColonyShip",
      selectedSpaceportSiteId: site.id
    },
    players: syncPlayersWithBoardAssets(gameState.players, [...structures, structure], normalizeShips(gameState.board?.ships))
  });
}

export function placeInitialColonyShip(gameState, boardLayout, nodeId) {
  if (gameState.phase !== "placement" || gameState.placement?.step !== "placeColonyShip") return gameState;

  const placement = normalizePlacementState(gameState.placement, gameState.playerCount);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const site = getStartColonySite(boardLayout, placement.selectedSpaceportSiteId);
  const ships = normalizeShips(gameState.board?.ships);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout, { useFallback: false });
  if (!activePlayer || !site || !site.launchNodeIds?.includes(nodeId) || isNodeOccupied(ships, structures, nodeId)) return gameState;

  const ship = {
    id: createId("colony-ship"),
    ownerPlayerId: activePlayer.id,
    type: "colonyShip",
    locationId: nodeId,
    status: "docked"
  };
  const updatedShips = [...ships, ship];
  const nextPlacement = advancePlacementOrder(placement, gameState, "placeSpaceport", "placeFirstColony", "reverse");

  return updateGameState(gameState, {
    currentPlayerIndex: nextPlacement.currentPlayerIndex,
    placement: nextPlacement.placement,
    board: {
      ...gameState.board,
      selectedElement: { type: "ship", id: ship.id },
      structures,
      ships: updatedShips
    },
    players: syncPlayersWithBoardAssets(gameState.players, structures, updatedShips)
  });
}

export function placeInitialColony(gameState, boardLayout, siteId) {
  if (gameState.phase !== "placement" || !["placeFirstColony", "placeSecondColony"].includes(gameState.placement?.step)) {
    return gameState;
  }

  const placement = normalizePlacementState(gameState.placement, gameState.playerCount);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const site = getStartColonySite(boardLayout, siteId);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout, { useFallback: false });
  const ships = normalizeShips(gameState.board?.ships);
  if (!activePlayer || !site || isStructureAtLocation(structures, site.nodeId)) return gameState;

  const structure = {
    id: createId("colony"),
    ownerPlayerId: activePlayer.id,
    type: "colony",
    locationId: site.nodeId,
    systemId: site.systemId,
    adjacentPlanetIds: site.adjacentPlanetIds ?? []
  };
  const updatedStructures = [...structures, structure];
  const nextMode = placement.step === "placeFirstColony" ? "forward" : "complete";
  const nextStep = placement.step === "placeFirstColony" ? "placeSecondColony" : "complete";
  const nextPlacement = advancePlacementOrder(placement, gameState, placement.step, nextStep, nextMode);

  return updateGameState(gameState, {
    currentPlayerIndex: nextPlacement.currentPlayerIndex,
    phase: nextPlacement.phase ?? "placement",
    placement: nextPlacement.placement,
    turnNumber: nextPlacement.phase === "production" ? 1 : gameState.turnNumber,
    board: {
      ...gameState.board,
      selectedElement: { type: "structure", id: structure.id },
      structures: updatedStructures,
      colonies: updatedStructures.filter((candidate) => candidate.type === "colony"),
      ships
    },
    players: syncPlayersWithBoardAssets(gameState.players, updatedStructures, ships)
  });
}

export function drawSupply(gameState) {
  if (gameState.phase !== "tradeBuild" || hasSupplyDrawnThisTurn(gameState)) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const drawCount = getSupplyDrawCount(activePlayer);
  if (!activePlayer || drawCount <= 0) return gameState;

  const drawnCards = [];
  let supplyDeck = normalizeSupplyDeck(gameState.supplyDeck);

  while (drawnCards.length < drawCount) {
    if (supplyDeck.length === 0) supplyDeck = createSupplyDeck();
    drawnCards.push(supplyDeck[0]);
    supplyDeck = supplyDeck.slice(1);
  }

  const players = gameState.players.map((player, index) => {
    if (index !== gameState.currentPlayerIndex) return player;
    const resources = normalizeResources(player.resources);
    for (const resource of drawnCards) {
      resources[resource] = (resources[resource] ?? 0) + 1;
    }

    return {
      ...player,
      resources
    };
  });

  return updateGameState(gameState, {
    players,
    supplyDeck,
    hasDrawnSupplyThisTurn: true,
    supplyDrawTurnKey: getTurnKey(gameState),
    logEntry: {
      type: "production",
      messageKey: "logSupplyDrawn",
      messageParams: {
        player: activePlayer.name,
        count: drawnCards.length,
        resources: formatResourceList(drawnCards)
      }
    }
  });
}

export function advanceToFlightPhase(gameState) {
  return updateGameState(gameState, {
    phase: "flight",
    flightSpeedBase: null,
    flightSpeedTotal: null,
    remainingMovementByShipId: {},
    hasRolledFlightSpeed: false,
    board: {
      ...gameState.board,
      selectedElement: null
    },
    logEntry: {
      type: "turn",
      messageKey: "logToFlightPhase",
      messageParams: {
        player: getActivePlayerName(gameState)
      }
    }
  });
}

export function determineFlightSpeed(gameState) {
  if (gameState.phase !== "flight" || gameState.hasRolledFlightSpeed) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  if (!activePlayer) return gameState;

  const baseSpeed = Math.floor(Math.random() * 3) + 3;
  const driveLevel = activePlayer.upgrades?.drive ?? 0;
  const totalSpeed = baseSpeed + driveLevel;
  const remainingMovementByShipId = Object.fromEntries(
    normalizeShips(gameState.board?.ships)
      .filter((ship) => ship.ownerPlayerId === activePlayer.id)
      .map((ship) => [ship.id, totalSpeed])
  );

  return updateGameState(gameState, {
    flightSpeedBase: baseSpeed,
    flightSpeedTotal: totalSpeed,
    remainingMovementByShipId,
    hasRolledFlightSpeed: true,
    logEntry: {
      type: "flight",
      messageKey: "logFlightSpeedDetermined",
      messageParams: {
        player: activePlayer.name,
        base: baseSpeed,
        drive: driveLevel,
        total: totalSpeed
      }
    }
  });
}

export function moveShip(gameState, boardLayout, shipId, targetNodeId) {
  if (gameState.phase !== "flight" || !gameState.hasRolledFlightSpeed) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  const remainingMovement = gameState.remainingMovementByShipId?.[shipId] ?? 0;
  const blockedNodeIds = getBlockedSystemNodeIds(gameState, boardLayout);
  const pathCost = getShortestPathCost(boardLayout, ship?.locationId, targetNodeId, blockedNodeIds);
  if (
    !activePlayer ||
    !ship ||
    ship.ownerPlayerId !== activePlayer.id ||
    targetNodeId === ship.locationId ||
    pathCost === null ||
    pathCost > remainingMovement ||
    blockedNodeIds.has(targetNodeId) ||
    isNodeOccupied(ships, gameState.board?.structures, targetNodeId, shipId)
  ) {
    return gameState;
  }

  const updatedShip = {
    ...ship,
    locationId: targetNodeId,
    status: "active"
  };
  const updatedShips = ships.map((candidate) => candidate.id === shipId ? updatedShip : candidate);
  const players = gameState.players.map((player) => ({
    ...player,
    ships: updatedShips.filter((candidate) => candidate.ownerPlayerId === player.id)
  }));
  const remaining = remainingMovement - pathCost;
  const explorationResult = exploreAdjacentSystems(gameState, boardLayout, targetNodeId, activePlayer.name);

  return updateGameState(gameState, {
    players,
    remainingMovementByShipId: {
      ...(gameState.remainingMovementByShipId ?? {}),
      [shipId]: remaining
    },
    board: {
      ...gameState.board,
      exploredSystems: explorationResult.exploredSystems,
      selectedElement: { type: "ship", id: shipId },
      ships: updatedShips
    },
    logEntries: [
      {
        type: "flight",
        messageKey: "logShipMoved",
        messageParams: {
          player: activePlayer.name,
          ship: ship.type,
          from: ship.locationId,
          to: targetNodeId,
          cost: pathCost,
          remaining
        }
      },
      ...explorationResult.logEntries
    ]
  });
}

export function foundColony(gameState, boardLayout, shipId) {
  if (gameState.phase !== "flight") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  const colonySite = getGameColonySites(gameState, boardLayout).find((site) => site.nodeId === ship?.locationId);
  if (
    !activePlayer ||
    !ship ||
    ship.ownerPlayerId !== activePlayer.id ||
    ship.type !== "colonyShip" ||
    !colonySite ||
    !isSystemExplored(gameState, boardLayout, colonySite.systemId) ||
    isStructureAtLocation(gameState.board?.structures, colonySite.nodeId)
  ) {
    return gameState;
  }

  const structure = {
    id: createId("colony"),
    ownerPlayerId: activePlayer.id,
    type: "colony",
    locationId: colonySite.nodeId,
    systemId: colonySite.systemId,
    adjacentPlanetIds: colonySite.adjacentPlanetIds ?? []
  };
  const updatedShips = ships.filter((candidate) => candidate.id !== ship.id);
  const structures = [...normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout), structure];
  const remainingMovementByShipId = { ...(gameState.remainingMovementByShipId ?? {}) };
  delete remainingMovementByShipId[ship.id];
  const players = syncPlayersWithBoardAssets(gameState.players, structures, updatedShips)
    .map((player) => player.id === activePlayer.id
      ? { ...player, victoryPoints: player.victoryPoints + 1 }
      : player);

  return updateGameState(gameState, {
    players,
    remainingMovementByShipId,
    board: {
      ...gameState.board,
      selectedElement: { type: "structure", id: structure.id },
      structures,
      colonies: structures.filter((candidate) => candidate.type === "colony"),
      ships: updatedShips
    },
    logEntry: {
      type: "founding",
      messageKey: "logColonyFounded",
      messageParams: {
        player: activePlayer.name
      }
    }
  });
}

export function foundTradeStation(gameState, boardLayout, shipId) {
  if (gameState.phase !== "flight") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  const dock = (boardLayout.docks ?? []).find((candidate) => candidate.nodeId === ship?.locationId);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout);
  const existingOutpostStations = structures
    .filter((structure) => structure.type === "tradeStation" && structure.outpostId === dock?.outpostId);
  const requiredCargo = existingOutpostStations.length + 1;
  if (
    !activePlayer ||
    !ship ||
    ship.ownerPlayerId !== activePlayer.id ||
    ship.type !== "tradeShip" ||
    !dock ||
    isStructureAtLocation(structures, dock.nodeId) ||
    (activePlayer.upgrades?.cargo ?? 0) < requiredCargo
  ) {
    return gameState;
  }

  const structure = {
    id: createId("trade-station"),
    ownerPlayerId: activePlayer.id,
    type: "tradeStation",
    locationId: dock.nodeId,
    dockId: dock.id,
    outpostId: dock.outpostId,
    adjacentPlanetIds: []
  };
  const updatedShips = ships.filter((candidate) => candidate.id !== ship.id);
  const updatedStructures = [...structures, structure];
  const remainingMovementByShipId = { ...(gameState.remainingMovementByShipId ?? {}) };
  delete remainingMovementByShipId[ship.id];
  const grantsVictoryPoint = existingOutpostStations.length === 0;
  const players = syncPlayersWithBoardAssets(gameState.players, updatedStructures, updatedShips)
    .map((player) => player.id === activePlayer.id
      ? { ...player, victoryPoints: player.victoryPoints + (grantsVictoryPoint ? 1 : 0) }
      : player);

  return updateGameState(gameState, {
    players,
    remainingMovementByShipId,
    board: {
      ...gameState.board,
      selectedElement: { type: "structure", id: structure.id },
      structures: updatedStructures,
      colonies: updatedStructures.filter((candidate) => candidate.type === "colony"),
      stations: updatedStructures.filter((candidate) => candidate.type === "tradeStation"),
      ships: updatedShips
    },
    logEntry: {
      type: "founding",
      messageKey: "logTradeStationFounded",
      messageParams: {
        player: activePlayer.name
      }
    }
  });
}

export function getReachableNodes(boardLayout, ships, shipId, maxDistance, structures = [], blockedNodeIds = []) {
  const ship = normalizeShips(ships).find((candidate) => candidate.id === shipId);
  if (!ship || maxDistance <= 0) return [];

  const occupiedNodeIds = new Set(normalizeShips(ships)
    .filter((candidate) => candidate.id !== shipId)
    .map((candidate) => candidate.locationId));
  for (const structure of structures ?? []) {
    if (structure?.locationId) occupiedNodeIds.add(structure.locationId);
  }
  const blocked = new Set(blockedNodeIds);
  const graph = createConnectionGraph(boardLayout);
  const queue = [{ id: ship.locationId, distance: 0 }];
  const visited = new Map([[ship.locationId, 0]]);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const nextId of graph.get(current.id) ?? []) {
      const nextDistance = current.distance + 1;
      if (nextDistance > maxDistance || visited.has(nextId) || occupiedNodeIds.has(nextId) || blocked.has(nextId)) continue;
      visited.set(nextId, nextDistance);
      queue.push({ id: nextId, distance: nextDistance });
    }
  }

  return [...visited.entries()]
    .filter(([id]) => id !== ship.locationId)
    .map(([id, distance]) => ({ id, distance }));
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
    flightSpeedBase: null,
    flightSpeedTotal: null,
    remainingMovementByShipId: {},
    hasRolledFlightSpeed: false,
    hasDrawnSupplyThisTurn: false,
    supplyDrawTurnKey: null,
    board: {
      ...gameState.board,
      selectedElement: null
    },
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
  const normalizedPhase = normalizePhase(gameState.phase);
  const fallbackPlayers = createPlayers(normalizedPlayerCount, gameState.language || language);
  const normalizedStructures = normalizeStructures(gameState.board?.structures, normalizedPlayerCount, boardLayout, {
    useFallback: normalizedPhase !== "placement"
  });
  const normalizedShips = sanitizeShips(normalizeShips(gameState.board?.ships), boardLayout, normalizedStructures);
  const normalizedPlacement = normalizeBoardPlacement(gameState.board, boardLayout);
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
    phase: normalizedPhase,
    lastRoll: normalizeRoll(gameState.lastRoll),
    flightSpeedBase: normalizedPhase === "flight" && Number.isInteger(gameState.flightSpeedBase) ? gameState.flightSpeedBase : null,
    flightSpeedTotal: normalizedPhase === "flight" && Number.isInteger(gameState.flightSpeedTotal) ? gameState.flightSpeedTotal : null,
    remainingMovementByShipId: normalizedPhase === "flight" ? normalizeRemainingMovement(gameState.remainingMovementByShipId) : {},
    hasRolledFlightSpeed: normalizedPhase === "flight" && Boolean(gameState.hasRolledFlightSpeed),
    supplyDeck: normalizeSupplyDeck(gameState.supplyDeck),
    supplyDiscard: Array.isArray(gameState.supplyDiscard) ? gameState.supplyDiscard.filter((resource) => supplyResourceTypes.includes(resource)) : [],
    hasDrawnSupplyThisTurn: Boolean(gameState.hasDrawnSupplyThisTurn),
    supplyDrawTurnKey: typeof gameState.supplyDrawTurnKey === "string" ? gameState.supplyDrawTurnKey : null,
    placement: normalizePlacementState(gameState.placement, normalizedPlayerCount),
    board: {
      ...fallback.board,
      ...(gameState.board || {}),
      layoutVersion: gameState.board?.layoutVersion || boardLayout.layoutVersion,
      placedSystems: normalizedPlacement.placedSystems,
      placedOutposts: normalizedPlacement.placedOutposts,
      emptySlots: normalizedPlacement.emptySlots,
      exploredSystems: normalizeExploredSystems(gameState.board?.exploredSystems, boardLayout, normalizedPlacement.placedSystems),
      structures: normalizedStructures,
      colonies: normalizedStructures.filter((structure) => structure.type === "colony"),
      stations: normalizedStructures.filter((structure) => structure.type === "tradeStation"),
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

function createPlacementState(playerCount) {
  const rollPlayerIds = Array.from({ length: playerCount }, (_, index) => `player-${index + 1}`);
  return {
    step: "rollStartPlayer",
    rollPlayerIds,
    currentRollIndex: 0,
    rolls: {},
    rollHistory: [],
    tiedPlayerIds: [],
    startPlayerId: null,
    order: [],
    reverseOrder: [],
    currentOrderIndex: 0,
    selectedSpaceportSiteId: null
  };
}

function normalizePlacementState(placement, playerCount) {
  const fallback = createPlacementState(playerCount);
  if (!placement || typeof placement !== "object") return fallback;

  const playerIds = new Set(fallback.rollPlayerIds);
  const normalizePlayerIds = (ids) => Array.isArray(ids) ? ids.filter((id) => playerIds.has(id)) : [];
  const rollPlayerIds = normalizePlayerIds(placement.rollPlayerIds);
  const order = normalizePlayerIds(placement.order);
  const reverseOrder = normalizePlayerIds(placement.reverseOrder);

  return {
    ...fallback,
    ...placement,
    step: normalizePlacementStep(placement.step),
    rollPlayerIds: rollPlayerIds.length > 0 ? rollPlayerIds : fallback.rollPlayerIds,
    currentRollIndex: Number.isInteger(placement.currentRollIndex) ? Math.max(0, placement.currentRollIndex) : 0,
    rolls: normalizePlacementRolls(placement.rolls),
    rollHistory: Array.isArray(placement.rollHistory) ? placement.rollHistory : [],
    tiedPlayerIds: normalizePlayerIds(placement.tiedPlayerIds),
    startPlayerId: playerIds.has(placement.startPlayerId) ? placement.startPlayerId : null,
    order,
    reverseOrder: reverseOrder.length > 0 ? reverseOrder : [...order].reverse(),
    currentOrderIndex: Number.isInteger(placement.currentOrderIndex) ? Math.max(0, placement.currentOrderIndex) : 0,
    selectedSpaceportSiteId: typeof placement.selectedSpaceportSiteId === "string" ? placement.selectedSpaceportSiteId : null
  };
}

function normalizePlacementStep(step) {
  if (["rollStartPlayer", "placeSpaceport", "placeColonyShip", "placeFirstColony", "placeSecondColony", "complete"].includes(step)) {
    return step;
  }
  return "rollStartPlayer";
}

function normalizePlacementRolls(rolls) {
  if (!rolls || typeof rolls !== "object") return {};

  return Object.fromEntries(Object.entries(rolls)
    .filter(([, roll]) => Number.isInteger(roll?.total))
    .map(([playerId, roll]) => [playerId, normalizeRoll(roll)]));
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

function createSupplyDeck() {
  return shuffle([
    ...supplyResourceTypes.flatMap((resource) => Array.from({ length: supplyCardsPerResource }, () => resource))
  ]);
}

function normalizeSupplyDeck(supplyDeck) {
  const normalizedDeck = Array.isArray(supplyDeck)
    ? supplyDeck.filter((resource) => supplyResourceTypes.includes(resource))
    : [];

  return normalizedDeck.length > 0 ? normalizedDeck : createSupplyDeck();
}

function getSupplyDrawCount(player) {
  const victoryPoints = player?.victoryPoints ?? 0;
  if (victoryPoints >= 4 && victoryPoints <= 7) return 2;
  if (victoryPoints >= 8 && victoryPoints <= 9) return 1;
  return 0;
}

function hasSupplyDrawnThisTurn(gameState) {
  return Boolean(gameState.hasDrawnSupplyThisTurn && gameState.supplyDrawTurnKey === getTurnKey(gameState));
}

function getTurnKey(gameState) {
  return `${gameState.turnNumber}:${gameState.players?.[gameState.currentPlayerIndex]?.id ?? "unknown"}`;
}

function formatResourceList(resources) {
  return resources.join(", ");
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

function normalizeStructures(structures, playerCount, boardLayout, options = {}) {
  const useFallback = options.useFallback ?? true;
  if ((!Array.isArray(structures) || structures.length === 0) && useFallback) {
    return createStartingStructures(playerCount, boardLayout);
  }

  if (!Array.isArray(structures)) return [];

  return structures
    .filter((structure) => structure && structure.id && structure.ownerPlayerId && structure.locationId)
    .map((structure) => ({
      id: structure.id,
      ownerPlayerId: structure.ownerPlayerId,
      type: normalizeStructureType(structure.type),
      locationId: structure.locationId,
      systemId: structure.systemId ?? null,
      dockId: structure.dockId ?? null,
      outpostId: structure.outpostId ?? null,
      adjacentPlanetIds: Array.isArray(structure.adjacentPlanetIds) ? structure.adjacentPlanetIds : []
    }));
}

function normalizeStructureType(type) {
  if (type === "spaceport") return "spaceport";
  if (type === "tradeStation") return "tradeStation";
  return "colony";
}

function createBoardPlacement(boardLayout) {
  const placement = typeof boardLayout.createRandomPlacement === "function"
    ? boardLayout.createRandomPlacement()
    : createFallbackBoardPlacement(boardLayout);

  return normalizePlacementObject(placement);
}

function createDefaultBoardPlacement(boardLayout) {
  const placement = typeof boardLayout.createDefaultPlacement === "function"
    ? boardLayout.createDefaultPlacement()
    : createFallbackBoardPlacement(boardLayout);

  return normalizePlacementObject(placement);
}

function createFallbackBoardPlacement(boardLayout) {
  return {
    placedSystems: boardLayout.planetSystems ?? [],
    placedOutposts: boardLayout.outposts ?? [],
    emptySlots: boardLayout.emptySlots ?? []
  };
}

function normalizeBoardPlacement(boardState, boardLayout) {
  if (Array.isArray(boardState?.placedSystems) && Array.isArray(boardState?.placedOutposts)) {
    return enrichBoardPlacement(boardLayout, normalizePlacementObject({
      placedSystems: boardState.placedSystems,
      placedOutposts: boardState.placedOutposts,
      emptySlots: boardState.emptySlots
    }));
  }

  return createDefaultBoardPlacement(boardLayout);
}

function enrichBoardPlacement(boardLayout, placement) {
  return typeof boardLayout.enrichPlacement === "function"
    ? boardLayout.enrichPlacement(placement)
    : placement;
}

function normalizePlacementObject(placement) {
  return {
    placedSystems: Array.isArray(placement?.placedSystems) ? placement.placedSystems : [],
    placedOutposts: Array.isArray(placement?.placedOutposts) ? placement.placedOutposts : [],
    emptySlots: Array.isArray(placement?.emptySlots) ? placement.emptySlots : []
  };
}

function getPlacedPlanetSystems(gameState, boardLayout) {
  return Array.isArray(gameState.board?.placedSystems)
    ? gameState.board.placedSystems
    : (boardLayout.planetSystems ?? []);
}

function getGameColonySites(gameState, boardLayout) {
  return [
    ...(boardLayout.startSites ?? []),
    ...getPlacedPlanetSystems(gameState, boardLayout).flatMap((system) => system.colonySites ?? [])
  ];
}

function getBlockedSystemNodeIds(gameState, boardLayout) {
  return new Set([
    ...(boardLayout.startSystems ?? []),
    ...getPlacedPlanetSystems(gameState, boardLayout)
  ].flatMap((system) => system.blockedNodeIds ?? []));
}

function getPlacedProductionPlanets(gameState, boardLayout) {
  return [...(boardLayout.startSystems ?? []), ...getPlacedPlanetSystems(gameState, boardLayout)]
    .flatMap((system) => (system.planets ?? []).map((planet) => ({
      ...planet,
      systemId: system.id
    })));
}

function normalizeExploredSystems(exploredSystems, boardLayout, placedSystems = []) {
  const startSystemIds = (boardLayout.startSystems ?? []).map((system) => system.id);
  const knownSystemIds = new Set([
    ...startSystemIds,
    ...(boardLayout.planetSystems ?? []).map((system) => system.id),
    ...(boardLayout.planetSystemTemplates ?? []).map((system) => system.id),
    ...placedSystems.map((system) => system.id)
  ]);
  const savedSystemIds = Array.isArray(exploredSystems) ? exploredSystems : [];

  return [...new Set([...startSystemIds, ...savedSystemIds])]
    .filter((systemId) => knownSystemIds.has(systemId));
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

function sanitizeShips(ships, boardLayout, structures) {
  const pointIds = new Set((boardLayout.points ?? []).map((point) => point.id));
  const blockedNodeIds = new Set([
    ...(boardLayout.startSystems ?? []),
    ...(boardLayout.planetSystems ?? [])
  ].flatMap((system) => system.blockedNodeIds ?? []));
  const occupied = new Set((structures ?? []).map((structure) => structure.locationId));

  return ships.map((ship) => {
    if (pointIds.has(ship.locationId) && !blockedNodeIds.has(ship.locationId)) {
      occupied.add(ship.locationId);
      return ship;
    }

    const fallbackPoint = (boardLayout.spaceportLaunchPoints ?? [])
      .find((point) => !occupied.has(point.id));
    if (fallbackPoint) {
      occupied.add(fallbackPoint.id);
      return { ...ship, locationId: fallbackPoint.id };
    }
    return ship;
  });
}

function normalizeRemainingMovement(remainingMovementByShipId = {}) {
  if (!remainingMovementByShipId || typeof remainingMovementByShipId !== "object") return {};

  return Object.fromEntries(Object.entries(remainingMovementByShipId)
    .filter(([shipId, movement]) => shipId && Number.isFinite(Number(movement)))
    .map(([shipId, movement]) => [shipId, Math.max(0, Number(movement))]));
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

function syncPlayersWithBoardAssets(players, structures, ships) {
  return players.map((player) => ({
    ...player,
    structures: structures.filter((structure) => structure.ownerPlayerId === player.id),
    ships: ships.filter((ship) => ship.ownerPlayerId === player.id)
  }));
}

function getPlayerIndexById(gameState, playerId) {
  return gameState.players.findIndex((player) => player.id === playerId);
}

function createPlacementOrder(startPlayerIndex, playerCount) {
  return Array.from({ length: playerCount }, (_, offset) => (startPlayerIndex + offset) % playerCount);
}

function getStartColonySite(boardLayout, siteId) {
  return (boardLayout.startSites ?? []).find((site) => site.id === siteId || site.nodeId === siteId);
}

function advancePlacementOrder(placement, gameState, currentStep, nextStep, nextMode) {
  const currentOrder = currentStep === "placeFirstColony" ? placement.reverseOrder : placement.order;
  const nextOrder = nextMode === "reverse" ? placement.reverseOrder : placement.order;
  const nextIndex = placement.currentOrderIndex + 1;

  if (nextIndex < currentOrder.length) {
    const nextPlayerId = currentOrder[nextIndex];
    return {
      currentPlayerIndex: getPlayerIndexById(gameState, nextPlayerId),
      placement: {
        ...placement,
        step: currentStep,
        currentOrderIndex: nextIndex,
        selectedSpaceportSiteId: null
      }
    };
  }

  if (nextMode === "complete") {
    const startPlayerIndex = getPlayerIndexById(gameState, placement.startPlayerId);
    return {
      currentPlayerIndex: startPlayerIndex >= 0 ? startPlayerIndex : 0,
      phase: "production",
      placement: {
        ...placement,
        step: "complete",
        currentOrderIndex: 0,
        selectedSpaceportSiteId: null
      }
    };
  }

  const firstPlayerId = nextOrder[0];
  return {
    currentPlayerIndex: getPlayerIndexById(gameState, firstPlayerId),
    placement: {
      ...placement,
      step: nextStep,
      currentOrderIndex: 0,
      selectedSpaceportSiteId: null
    }
  };
}

function exploreAdjacentSystems(gameState, boardLayout, nodeId, playerName) {
  const placedSystems = getPlacedPlanetSystems(gameState, boardLayout);
  const exploredSystemIds = new Set(normalizeExploredSystems(gameState.board?.exploredSystems, boardLayout, placedSystems));
  const newSystems = placedSystems
    .filter((system) => !exploredSystemIds.has(system.id) && (system.adjacentNodeIds ?? []).includes(nodeId));

  for (const system of newSystems) {
    exploredSystemIds.add(system.id);
  }

  return {
    exploredSystems: [...exploredSystemIds],
    logEntries: newSystems.map((system) => ({
      type: "exploration",
      messageKey: "logSystemExplored",
      messageParams: {
        player: playerName,
        system: system.name ?? system.id
      }
    }))
  };
}

function isSystemExplored(gameState, boardLayout, systemId) {
  return normalizeExploredSystems(
    gameState.board?.exploredSystems,
    boardLayout,
    getPlacedPlanetSystems(gameState, boardLayout)
  ).includes(systemId);
}

function isStructureAtLocation(structures, locationId) {
  return (structures ?? []).some((structure) => structure?.locationId === locationId);
}

function getShortestPathCost(boardLayout, fromNodeId, toNodeId, blockedNodeIds = new Set()) {
  if (!fromNodeId || !toNodeId) return null;
  if (fromNodeId === toNodeId) return 0;

  const graph = createConnectionGraph(boardLayout);
  const queue = [{ id: fromNodeId, distance: 0 }];
  const visited = new Set([fromNodeId]);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const nextId of graph.get(current.id) ?? []) {
      if (visited.has(nextId)) continue;
      if (blockedNodeIds.has(nextId)) continue;
      if (nextId === toNodeId) return current.distance + 1;
      visited.add(nextId);
      queue.push({ id: nextId, distance: current.distance + 1 });
    }
  }

  return null;
}

function createConnectionGraph(boardLayout) {
  const graph = new Map();
  const addEdge = (from, to) => {
    if (!graph.has(from)) graph.set(from, new Set());
    graph.get(from).add(to);
  };

  for (const point of boardLayout.points ?? []) {
    graph.set(point.id, graph.get(point.id) ?? new Set());
  }

  for (const connection of boardLayout.connections ?? []) {
    addEdge(connection.from, connection.to);
    addEdge(connection.to, connection.from);
  }

  return graph;
}

function isNodeOccupied(ships, structures, targetNodeId, ignoredShipId) {
  if ((structures ?? []).some((structure) => structure?.locationId === targetNodeId)) return true;
  return normalizeShips(ships)
    .some((ship) => ship.id !== ignoredShipId && ship.locationId === targetNodeId);
}

function distributeProduction(gameState, boardLayout, rollTotal) {
  const structures = gameState.board?.structures ?? [];
  const producingPlanets = getPlacedProductionPlanets(gameState, boardLayout)
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

function rollTwoDice() {
  const dice = [rollDie(), rollDie()];
  return {
    dice,
    total: dice[0] + dice[1]
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
