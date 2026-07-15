import { boardLayout as defaultBoardLayout } from "../data/boardLayout.js";
import { bankTradeRates, buildActionDefinitions, upgradeDefinitions } from "../data/buildCosts.js";
import { getEncounterCardById, getEncounterDeckIds } from "../data/encounterCards.js";
import { getFriendshipCardById } from "../data/friendshipCards.js";
import {
  gameVariants,
  getSupernovaFactoryType,
  getSupernovaFactoryVictoryCard,
  getSupernovaLocalizedTitle,
  supernovaFactoryLimitPerPlayer,
  supernovaFactoryTypes,
  supernovaFactoryVictoryCards,
  supernovaMissionCounts,
  supernovaMissionCards
} from "../data/supernova.js";
import {
  createNumberTokenState,
  doesTokenProduce,
  getPlanetToken,
  getTokenRequirementUpgrade,
  isActiveSpecialToken,
  normalizeNumberTokenState,
  resolveSpecialToken,
  revealSystemTokens,
  revealSystemsById
} from "../data/numberTokens.js";

const playerColorKeys = ["red", "blue", "yellow", "green"];
const supplyResourceTypes = ["ore", "fuel", "carbon", "food", "goods"];
const supplyCardsPerResource = 8;
const mothershipBallValues = {
  yellow: 2,
  blue: 1,
  red: 3,
  black: 0
};
const mothershipBallPool = ["yellow", "yellow", "blue", "red", "black"];
const playerFigureLimits = {
  colony: 9,
  tradeStation: 7,
  transporter: 3,
  spaceport: 3,
  battleShip: 3
};
const encounterNoUpgradeGainText = {
  de: "Alle physischen Ausbauplätze sind belegt. Der Ausbau entfällt; die Begegnung wird fortgesetzt.",
  en: "All physical upgrade slots are occupied. The upgrade is skipped and the encounter continues."
};

export const currentGameStorageKey = "star-odyssey-current-game";
export const turnPhases = ["placement", "setup", "production", "tradeBuild", "flight", "turnEnd", "gameOver"];

export function calculateVictoryPoints(gameState, playerId) {
  if (!gameState || !playerId) return 0;

  const structures = Array.isArray(gameState.board?.structures)
    ? gameState.board.structures.filter((structure) => structure?.ownerPlayerId === playerId)
    : [];
  const player = Array.isArray(gameState.players)
    ? gameState.players.find((candidate) => candidate.id === playerId)
    : null;

  const structurePoints = structures.reduce((sum, structure) => {
    if (structure.type === "spaceport") return sum + 2;
    if (structure.type === "colony") return sum + 1;
    return sum;
  }, 0);
  const friendshipPoints = normalizeFriendshipMarkers(player?.friendshipMarkers).length * 2;
  const specialMedalPoints = normalizeSpecialMedals(player?.specialMedals).length;
  const halfMedalPoints = Math.floor(Math.max(0, player?.halfMedals ?? 0) / 2);
  const supernovaPoints = isSupernovaGame(gameState)
    ? countSupernovaFactoryVictoryPoints(gameState, playerId)
    : 0;

  return structurePoints + friendshipPoints + specialMedalPoints + halfMedalPoints + supernovaPoints;
}

export function getPlayerInventory(gameState, playerId) {
  if (!gameState || !playerId) {
    return createPlayerInventory();
  }

  const structures = Array.isArray(gameState.board?.structures)
    ? gameState.board.structures.filter((structure) => structure?.ownerPlayerId === playerId)
    : [];
  const ships = normalizeShips(gameState.board?.ships)
    .filter((ship) => ship.ownerPlayerId === playerId);
  const colonyStructures = structures
    .filter((structure) => structure.type === "colony" || structure.type === "spaceport")
    .length;
  const tradeStationStructures = structures
    .filter((structure) => structure.type === "tradeStation")
    .length;
  const spaceportsInUse = structures
    .filter((structure) => structure.type === "spaceport")
    .length;
  const colonyShipsInUse = ships
    .filter((ship) => ship.type === "colonyShip")
    .length;
  const tradeShipsInUse = ships
    .filter((ship) => ship.type === "tradeShip")
    .length;
  const battleShipsInUse = ships
    .filter((ship) => ship.type === "battleShip")
    .length;
  const coloniesInUse = colonyStructures + colonyShipsInUse;
  const tradeStationsInUse = tradeStationStructures + tradeShipsInUse;
  const transportersInUse = colonyShipsInUse + tradeShipsInUse;

  return {
    colony: {
      inUse: coloniesInUse,
      available: Math.max(0, playerFigureLimits.colony - coloniesInUse),
      limit: playerFigureLimits.colony
    },
    tradeStation: {
      inUse: tradeStationsInUse,
      available: Math.max(0, playerFigureLimits.tradeStation - tradeStationsInUse),
      limit: playerFigureLimits.tradeStation
    },
    transporter: {
      inUse: transportersInUse,
      available: Math.max(0, playerFigureLimits.transporter - transportersInUse),
      limit: playerFigureLimits.transporter
    },
    spaceport: {
      inUse: spaceportsInUse,
      available: Math.max(0, playerFigureLimits.spaceport - spaceportsInUse),
      limit: playerFigureLimits.spaceport
    },
    battleShip: {
      inUse: battleShipsInUse,
      available: Math.max(0, playerFigureLimits.battleShip - battleShipsInUse),
      limit: playerFigureLimits.battleShip
    }
  };
}

export function getTradeRatesForPlayer(gameState, playerId) {
  const player = getPlayerById(gameState, playerId);
  const rates = {
    ore: bankTradeRates.default,
    fuel: bankTradeRates.default,
    carbon: bankTradeRates.default,
    food: bankTradeRates.default,
    goods: bankTradeRates.goods
  };

  for (const card of getFriendshipCardsForPlayer(player)) {
    if (!card.implemented || card.effectType !== "tradeRate") continue;
    const resource = card.effectValue?.resource;
    const rate = card.effectValue?.rate;
    if (!supplyResourceTypes.includes(resource) || !Number.isInteger(rate)) continue;
    rates[resource] = Math.min(rates[resource], rate);
  }

  return rates;
}

export function getRealUpgradeValue(player, type) {
  return normalizeUpgrades(player?.upgrades)[type] ?? 0;
}

export function getFriendshipUpgradeBonus(gameState, playerId, type) {
  return getFriendshipCardsForPlayer(getPlayerById(gameState, playerId))
    .reduce((sum, card) => sum + (card.implemented && card.effectType === "upgradeBoost"
      ? (card.effectValue?.[type] ?? 0)
      : 0), 0);
}

export function getEffectiveUpgradeValue(gameState, playerId, type) {
  return getRealUpgradeValue(getPlayerById(gameState, playerId), type)
    + getFriendshipUpgradeBonus(gameState, playerId, type);
}

export function getMovementBonusForPlayer(gameState, playerId) {
  return getFriendshipUpgradeBonus(gameState, playerId, "drive");
}

export function getCargoValueForPlayer(gameState, playerId) {
  return getEffectiveUpgradeValue(gameState, playerId, "cargo");
}

export function getCannonValueForPlayer(gameState, playerId) {
  return getEffectiveUpgradeValue(gameState, playerId, "cannon");
}

export function createGameState({
  language,
  playerCount,
  boardLayout,
  playerSetup = [],
  gameVariant = gameVariants.classic,
  supernovaMissionCount = supernovaMissionCounts.standard
}) {
  const now = new Date().toISOString();
  const safePlayerCount = [2, 3, 4].includes(playerCount) ? playerCount : 3;
  const normalizedGameVariant = normalizeGameVariant(gameVariant);
  const boardPlacement = createBoardPlacement(boardLayout);
  const numberTokens = createNumberTokenState(boardLayout, boardPlacement);
  const initialPlayers = createPlayers(safePlayerCount, language, playerSetup);
  const startingStructures = createNeutralStartingStructures(safePlayerCount, boardLayout, initialPlayers);
  const startingShips = [];
  const players = attachPlayerAssets(initialPlayers, startingStructures, startingShips);

  return finalizeDerivedState({
    gameId: createId("game"),
    createdAt: now,
    updatedAt: now,
    language,
    playerCount: safePlayerCount,
    gameVariant: normalizedGameVariant,
    players,
    currentPlayerIndex: 0,
    turnNumber: 1,
    phase: "placement",
    gameOver: false,
    winnerPlayerId: null,
    lastRoll: null,
    flightRoll: null,
    flightSpeedBase: null,
    flightSpeedTotal: null,
    encounterTriggered: false,
    pendingFlightEncounter: null,
    encounterDeck: createEncounterDeck(),
    encounterDiscard: [],
    activeEncounter: null,
    encounterStep: null,
    pendingGiftedTradeShips: [],
    remainingMovementByShipId: {},
    hasRolledFlightSpeed: false,
    supplyDeck: createSupplyDeck(),
    supplyDiscard: [],
    hasDrawnSupplyThisTurn: false,
    supplyDrawTurnKey: null,
    pendingFriendshipAction: null,
    startingSetupGranted: false,
    friendshipTurnState: createFriendshipTurnState(`1:${players[0]?.id ?? "player-1"}`),
    activeTradeOffer: null,
    sevenResolution: null,
    placement: createPlacementState(safePlayerCount),
    supernova: normalizedGameVariant === gameVariants.supernova
      ? createInitialSupernovaState(players, supernovaMissionCount)
      : null,
    board: {
      layoutVersion: boardLayout.layoutVersion,
      selectedElement: null,
      placedSystems: boardPlacement.placedSystems,
      placedOutposts: boardPlacement.placedOutposts,
      emptySlots: boardPlacement.emptySlots,
      placedQuadrants: updatePlacedQuadrantDiscovery(boardPlacement.placedQuadrants, {
        exploredSystems: [],
        exploredOutposts: [],
        exploredEmptySlots: []
      }),
      unusedQuadrant: boardPlacement.unusedQuadrant,
      exploredSystems: normalizeExploredSystems([], boardLayout, boardPlacement.placedSystems),
      exploredOutposts: [],
      exploredEmptySlots: [],
      numberTokens: revealSystemsById(
        numberTokens,
        boardLayout,
        boardPlacement,
        (boardLayout.startSystems ?? []).map((system) => system.id)
      ),
      pendingFriendshipCardSelection: null,
      pendingTradeStationPlacement: null,
      pendingShipPlacement: null,
      pendingSpaceportUpgrade: null,
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
  });
}

export function rollProduction(gameState, boardLayout, forcedRoll = null) {
  if (isGameOverState(gameState)) return gameState;
  const firstDie = forcedRoll?.dice?.[0] ?? rollDie();
  const secondDie = forcedRoll?.dice?.[1] ?? rollDie();
  const total = firstDie + secondDie;
  const isSevenRoll = total === 7;
  const productionResult = isSevenRoll
    ? {
      players: gameState.players,
      phase: "production",
      sevenResolution: createSevenResolution(gameState),
      logEntries: [
        {
          type: "turn",
          messageKey: "logSevenRolled",
          messageParams: {}
        }
      ]
    }
    : {
      ...distributeProduction(gameState, boardLayout, total),
      phase: "tradeBuild",
      sevenResolution: null
    };

  const activePlayerId = gameState.players?.[gameState.currentPlayerIndex]?.id ?? null;
  const activePlayer = productionResult.players.find((player) => player.id === activePlayerId) ?? null;
  const galacticAidCard = getFriendshipCardsForPlayer(activePlayer)
    .find((card) => card.implemented && card.effectType === "galacticAid");
  const activePlayerGains = activePlayerId
    ? (productionResult.gainedByPlayerId?.[activePlayerId] ?? 0)
    : 0;
  const pendingFriendshipAction = !isSevenRoll && galacticAidCard && activePlayer && activePlayerGains === 0
    ? {
      type: "galacticAid",
      ownerPlayerId: activePlayer.id,
      amount: Math.max(1, galacticAidCard.effectValue?.amount ?? 1),
      cardId: galacticAidCard.id
    }
    : null;

  return updateGameState(gameState, {
    players: productionResult.players,
    phase: productionResult.phase,
    lastRoll: {
      dice: [firstDie, secondDie],
      total
    },
    sevenResolution: productionResult.sevenResolution,
    pendingFriendshipAction,
    productionVfx: productionResult.productionVfx ?? null,
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
  if (isGameOverState(gameState)) return gameState;
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
      logEntry: createPlacementRollLog(gameState, rollingPlayerIndex, rollingPlayerId, roll.total)
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
      logEntries: [
        createPlacementRollLog(gameState, rollingPlayerIndex, rollingPlayerId, roll.total),
        {
          type: "placement",
          messageKey: "logPlacementTie",
          messageParams: {}
        }
      ]
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
    logEntries: [
      createPlacementRollLog(gameState, rollingPlayerIndex, rollingPlayerId, roll.total),
      {
        type: "placement",
        messageKey: "logPlacementStartPlayer",
        messageParams: {
          player: gameState.players[startPlayerIndex]?.name ?? startPlayerId
        }
      }
    ]
  });
}

function createPlacementRollLog(gameState, playerIndex, playerId, total) {
  return {
    type: "placement",
    messageKey: "logPlacementRolled",
    messageParams: {
      player: gameState.players[playerIndex]?.name ?? playerId,
      total
    }
  };
}

export function placeInitialSpaceport(gameState, boardLayout, siteId) {
  if (isGameOverState(gameState)) return gameState;
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
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "placement" || gameState.placement?.step !== "placeColonyShip") return gameState;

  const placement = normalizePlacementState(gameState.placement, gameState.playerCount);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const site = getStartColonySite(boardLayout, placement.selectedSpaceportSiteId);
  const ships = normalizeShips(gameState.board?.ships);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout, { useFallback: false });
  const shipVariant = getNextAvailableShipVariant(ships, activePlayer?.id);
  if (!activePlayer || !shipVariant || !site || !site.launchNodeIds?.includes(nodeId) || isNodeOccupied(ships, structures, nodeId)) return gameState;

  const ship = {
    id: createId("colony-ship"),
    ownerPlayerId: activePlayer.id,
    type: "colonyShip",
    shipVariant,
    coilCount: shipVariant,
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
  if (isGameOverState(gameState)) return gameState;
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
  const nextState = updateGameState(gameState, {
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

  if (nextPlacement.phase === "production") {
    return grantStartingSetup(nextState);
  }

  return nextState;
}

function grantStartingSetup(gameState) {
  if (gameState.startingSetupGranted) return gameState;

  let supplyDeck = gameState.supplyDeck;
  const players = gameState.players.map((player) => {
    const draw = drawSupplyCards(supplyDeck, 3);
    supplyDeck = draw.supplyDeck;
    const resources = normalizeResources(player.resources);
    for (const resource of draw.drawnCards) {
      resources[resource] = (resources[resource] ?? 0) + 1;
    }

    return {
      ...player,
      resources,
      halfMedals: Math.max(0, player.halfMedals ?? 0) + 1,
      upgrades: {
        ...normalizeUpgrades(player.upgrades),
        drive: Math.min(6, (player.upgrades?.drive ?? 0) + 1)
      }
    };
  });

  return updateGameState(gameState, {
    players,
    supplyDeck,
    startingSetupGranted: true,
    logEntry: {
      type: "setup",
      messageKey: "logStartingSetupGranted",
      messageParams: {}
    }
  });
}

export function drawSupply(gameState) {
  if (!canDrawSupply(gameState)) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const drawCount = getSupplyDrawCount(gameState, activePlayer);
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
      messageKey: drawnCards.length === 1 ? "logSupplyDrawnOne" : "logSupplyDrawnMany",
      messageParams: {
        player: activePlayer.name,
        count: drawnCards.length
      }
    }
  });
}

export function canDrawSupply(gameState) {
  if (!gameState || isGameOverState(gameState) || hasSupplyDrawnThisTurn(gameState)) return false;
  const isEligiblePhase = gameState.phase === "tradeBuild"
    || (gameState.phase === "flight" && !gameState.hasRolledFlightSpeed);
  if (!isEligiblePhase) return false;

  const activePlayer = gameState.players?.[gameState.currentPlayerIndex];
  return Boolean(activePlayer && getSupplyDrawCount(gameState, activePlayer) > 0);
}

export function updateSevenDiscardSelection(gameState, playerId, resource, delta) {
  if (isGameOverState(gameState)) return gameState;
  const sevenResolution = normalizeSevenResolution(gameState.sevenResolution, gameState.players);
  if (!sevenResolution?.active || sevenResolution.step !== "discard" || !resource || !Number.isInteger(delta) || delta === 0) {
    return gameState;
  }

  const player = gameState.players.find((candidate) => candidate.id === playerId);
  if (!player || !needsSevenDiscard(sevenResolution, playerId)) return gameState;

  const nextSelections = {
    ...sevenResolution.discardSelections,
    [playerId]: normalizeResources(sevenResolution.discardSelections?.[playerId])
  };
  const selection = nextSelections[playerId];
  const currentValue = selection[resource] ?? 0;
  const ownedValue = normalizeResources(player.resources)[resource] ?? 0;
  const selectedTotal = countResources(selection);
  const requiredCount = getRequiredDiscardCount(sevenResolution, playerId);

  if (delta > 0) {
    if (selectedTotal >= requiredCount || currentValue >= ownedValue) return gameState;
    selection[resource] = currentValue + 1;
  } else {
    if (currentValue <= 0) return gameState;
    selection[resource] = currentValue - 1;
  }

  return updateGameState(gameState, {
    sevenResolution: {
      ...sevenResolution,
      discardSelections: nextSelections
    }
  });
}

export function submitSevenDiscard(gameState, playerId) {
  if (isGameOverState(gameState)) return gameState;
  const sevenResolution = normalizeSevenResolution(gameState.sevenResolution, gameState.players);
  if (!sevenResolution?.active || sevenResolution.step !== "discard") return gameState;

  const player = gameState.players.find((candidate) => candidate.id === playerId);
  if (!player || !needsSevenDiscard(sevenResolution, playerId)) return gameState;

  const selection = normalizeResources(sevenResolution.discardSelections?.[playerId]);
  const requiredCount = getRequiredDiscardCount(sevenResolution, playerId);
  if (countResources(selection) !== requiredCount || !canPay(normalizeResources(player.resources), selection)) return gameState;

  const players = gameState.players.map((candidate) => candidate.id === playerId
    ? {
      ...candidate,
      resources: payCost(candidate.resources, selection)
    }
    : candidate);
  const discardedPlayerIds = [...new Set([...sevenResolution.discardedPlayerIds, playerId])];
  const nextSevenResolution = {
    ...sevenResolution,
    discardedPlayerIds,
    discardSelections: {
      ...sevenResolution.discardSelections,
      [playerId]: createEmptyResources()
    }
  };

  return updateGameState(gameState, {
    players,
    sevenResolution: advanceSevenResolution({
      ...gameState,
      players,
      sevenResolution: nextSevenResolution
    }, nextSevenResolution),
    logEntry: {
      type: "production",
      messageKey: "logSevenDiscarded",
      messageParams: {
        player: player.name,
        count: requiredCount
      }
    }
  });
}

export function setSevenStealTarget(gameState, targetPlayerId) {
  if (isGameOverState(gameState)) return gameState;
  const sevenResolution = normalizeSevenResolution(gameState.sevenResolution, gameState.players);
  if (!sevenResolution?.active || sevenResolution.step !== "steal") return gameState;
  if (!getSevenStealCandidates(gameState, sevenResolution).some((player) => player.id === targetPlayerId)) return gameState;

  return updateGameState(gameState, {
    sevenResolution: {
      ...sevenResolution,
      stealTargetPlayerId: targetPlayerId
    }
  });
}

export function resolveSevenSteal(gameState) {
  if (isGameOverState(gameState)) return gameState;
  const sevenResolution = normalizeSevenResolution(gameState.sevenResolution, gameState.players);
  if (!sevenResolution?.active || sevenResolution.step !== "steal") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const targetPlayer = gameState.players.find((candidate) => candidate.id === sevenResolution.stealTargetPlayerId);
  const candidates = getSevenStealCandidates(gameState, sevenResolution);

  if (candidates.length === 0) {
    return updateGameState(gameState, {
      sevenResolution: {
        ...sevenResolution,
        step: "supply",
        stealTargetPlayerId: null,
        stealResolved: true
      },
      logEntry: {
        type: "production",
        messageKey: "logSevenNoOpponentResources",
        messageParams: {}
      }
    });
  }

  if (!activePlayer || !targetPlayer || !candidates.some((candidate) => candidate.id === targetPlayer.id)) return gameState;

  const drawnResource = drawRandomResource(targetPlayer.resources);
  if (!drawnResource) {
    return updateGameState(gameState, {
      sevenResolution: {
        ...sevenResolution,
        step: "supply",
        stealTargetPlayerId: null,
        stealResolved: true
      },
      logEntry: {
        type: "production",
        messageKey: "logSevenNoOpponentResources",
        messageParams: {}
      }
    });
  }

  const players = gameState.players.map((player) => {
    if (player.id === activePlayer.id) {
      const resources = normalizeResources(player.resources);
      resources[drawnResource] = (resources[drawnResource] ?? 0) + 1;
      return { ...player, resources };
    }
    if (player.id === targetPlayer.id) {
      const resources = normalizeResources(player.resources);
      resources[drawnResource] = Math.max(0, (resources[drawnResource] ?? 0) - 1);
      return { ...player, resources };
    }
    return player;
  });

  return updateGameState(gameState, {
    players,
    sevenResolution: {
      ...sevenResolution,
      step: "supply",
      stealResolved: true
    },
    logEntry: {
      type: "production",
      messageKey: "logSevenCardDrawn",
      messageParams: {
        player: activePlayer.name,
        target: targetPlayer.name
      }
    }
  });
}

export function distributeSevenSupply(gameState) {
  if (isGameOverState(gameState)) return gameState;
  const sevenResolution = normalizeSevenResolution(gameState.sevenResolution, gameState.players);
  if (!sevenResolution?.active || sevenResolution.step !== "supply" || sevenResolution.supplyDistributed) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const drawnByPlayerId = {};
  let supplyDeck = normalizeSupplyDeck(gameState.supplyDeck);
  const players = gameState.players.map((player) => {
    if (player.id === activePlayer?.id) return player;
    if (supplyDeck.length === 0) supplyDeck = createSupplyDeck();
    const drawnResource = supplyDeck[0];
    supplyDeck = supplyDeck.slice(1);
    drawnByPlayerId[player.id] = drawnResource;
    const resources = normalizeResources(player.resources);
    resources[drawnResource] = (resources[drawnResource] ?? 0) + 1;
    return {
      ...player,
      resources
    };
  });

  return updateGameState(gameState, {
    players,
    supplyDeck,
    phase: "tradeBuild",
    hasDrawnSupplyThisTurn: true,
    supplyDrawTurnKey: getTurnKey(gameState),
    sevenResolution: null,
    logEntry: {
      type: "production",
      messageKey: "logSevenSupplyDistributed",
      messageParams: {}
    }
  });
}

export function advanceToFlightPhase(gameState) {
  if (isGameOverState(gameState)) return gameState;
  const nextState = updateGameState(gameState, {
    phase: "flight",
    activeTradeOffer: null,
    flightRoll: null,
    flightSpeedBase: null,
    flightSpeedTotal: null,
    encounterTriggered: false,
    pendingFlightEncounter: null,
    activeEncounter: null,
    encounterStep: null,
    remainingMovementByShipId: {},
    hasRolledFlightSpeed: false,
    board: {
      ...gameState.board,
      selectedElement: null,
      pendingTradeStationPlacement: null,
      pendingShipPlacement: null,
      pendingSpaceportUpgrade: null
    },
    logEntry: {
      type: "turn",
      messageKey: "logToFlightPhase",
      messageParams: {
        player: getActivePlayerName(gameState)
      }
    }
  });
  return placePendingGiftedShips(nextState, defaultBoardLayout);
}

export function determineFlightSpeed(gameState, forcedRoll = null) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "flight" || gameState.hasRolledFlightSpeed) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  if (!activePlayer) return gameState;
  const activeShips = normalizeShips(gameState.board?.ships)
    .filter((ship) => ship.ownerPlayerId === activePlayer.id);

  if (activeShips.length === 0) {
    return updateGameState(gameState, {
      remainingMovementByShipId: {},
      hasRolledFlightSpeed: true,
      activeEncounter: null,
      encounterStep: null,
      encounterTriggered: false,
      pendingFlightEncounter: null,
      logEntry: {
        type: "flight",
        messageKey: "logNoShipsInSpace",
        messageParams: {
          player: activePlayer.name
        }
      }
    });
  }

  const flightRoll = createFlightRoll(forcedRoll);
  const driveLevel = getPlayerFlightBonus(gameState, activePlayer.id);
  const baseSpeed = flightRoll.baseSpeed;
  const totalSpeed = baseSpeed + driveLevel;
  const encounterTrigger = flightRoll.encounterTriggered;
  const remainingMovementByShipId = encounterTrigger
    ? {}
    : createRemainingMovementForActiveShips(gameState, totalSpeed);
  return updateGameState(gameState, {
    flightRoll,
    flightSpeedBase: baseSpeed,
    flightSpeedTotal: totalSpeed,
    encounterTriggered: encounterTrigger,
    pendingFlightEncounter: encounterTrigger
      ? { forcedEncounterCardId: typeof forcedRoll?.encounterCardId === "string" ? forcedRoll.encounterCardId : null }
      : null,
    activeEncounter: null,
    encounterStep: null,
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

export function startPendingFlightEncounter(gameState) {
  if (isGameOverState(gameState)) return gameState;
  if (
    gameState.phase !== "flight" ||
    !gameState.hasRolledFlightSpeed ||
    !gameState.encounterTriggered ||
    gameState.activeEncounter ||
    !gameState.pendingFlightEncounter
  ) {
    return gameState;
  }

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const encounterStart = startEncounter(gameState, gameState.pendingFlightEncounter.forcedEncounterCardId);
  return updateGameState(gameState, {
    encounterDeck: encounterStart.encounterDeck,
    encounterDiscard: encounterStart.encounterDiscard,
    activeEncounter: encounterStart.activeEncounter,
    encounterStep: encounterStart.encounterStep,
    pendingFlightEncounter: null,
    logEntry: {
      type: "encounter",
      messageKey: "logEncounterTriggered",
      messageParams: {
        player: activePlayer?.name ?? ""
      }
    }
  });
}

export function resolveEncounterChoice(gameState, payload = {}) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "flight" || !gameState.activeEncounter) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const encounter = normalizeActiveEncounter(gameState.activeEncounter);
  const card = getEncounterCardById(encounter?.cardId);
  if (!activePlayer || !card || encounter?.status === "resolved" || encounter?.pendingStep) return gameState;

  const choice = card.choices?.find((entry) => entry.id === payload.choiceId) ?? null;
  if (!choice) return gameState;

  const resolution = runEncounterEffectSequence(
    gameState,
    createEncounterWorkingState(gameState),
    activePlayer.id,
    choice.effects ?? [],
    card,
    payload,
    {
      choiceId: choice.id,
      resultText: choice.resultText ?? null
    }
  );
  if (!resolution) return gameState;

  return applyEncounterResolution(gameState, encounter, resolution, {
    choiceId: choice.id,
    chosenResource: payload.resource ?? null,
    chosenUpgrade: payload.upgrade ?? null
  });
}

export function updateEncounterResourceSelection(gameState, resource, delta) {
  if (isGameOverState(gameState)) return gameState;
  const encounter = normalizeActiveEncounter(gameState.activeEncounter);
  const pendingStep = encounter?.pendingStep;
  if (!encounter || pendingStep?.type !== "resourceSelection" || !supplyResourceTypes.includes(resource)) {
    return gameState;
  }

  const currentSelection = normalizeResources(pendingStep.selectedResources);
  const nextSelection = { ...currentSelection };
  const selectedTotal = countResources(currentSelection);
  const maxAmount = pendingStep.amount ?? 0;
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const availableResources = normalizeResources(activePlayer?.resources);

  if (delta > 0) {
    if (selectedTotal >= maxAmount) return gameState;
    if (pendingStep.mode === "loss" && nextSelection[resource] >= availableResources[resource]) return gameState;
    nextSelection[resource] += 1;
  } else if (delta < 0) {
    if (nextSelection[resource] <= 0) return gameState;
    nextSelection[resource] -= 1;
  } else {
    return gameState;
  }

  return updateGameState(gameState, {
    activeEncounter: {
      ...encounter,
      pendingStep: {
        ...pendingStep,
        selectedResources: nextSelection
      }
    }
  });
}

export function submitEncounterPending(gameState, payload = {}) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "flight" || !gameState.activeEncounter) return gameState;

  const encounter = normalizeActiveEncounter(gameState.activeEncounter);
  const card = getEncounterCardById(encounter?.cardId);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const pendingStep = encounter?.pendingStep;
  if (!encounter || !card || !activePlayer || !pendingStep) return gameState;

  const pendingResolution = resolveEncounterPendingStep(gameState, encounter, card, activePlayer, pendingStep, payload);
  if (!pendingResolution) return gameState;

  return applyEncounterResolution(gameState, encounter, pendingResolution, {
    choiceId: encounter.choiceId ?? null,
    chosenResource: encounter.chosenResource ?? null,
    chosenUpgrade: encounter.chosenUpgrade ?? null
  });
}

export function finishEncounter(gameState) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "flight" || !gameState.activeEncounter || gameState.activeEncounter.status !== "resolved") {
    return gameState;
  }

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const speedUpdate = createPostEncounterFlightSpeedUpdate(gameState);
  const logEntries = [{
    type: "encounter",
    messageKey: "logEncounterFinished",
    messageParams: {
      player: activePlayer?.name ?? ""
    }
  }];

  if (speedUpdate && speedUpdate.totalSpeed !== gameState.flightSpeedTotal) {
    logEntries.push({
      type: "flight",
      messageKey: "logFlightSpeedAfterEncounterUpdated",
      messageParams: {
        total: speedUpdate.totalSpeed
      }
    });
  }

  const nextState = updateGameState(gameState, {
    activeEncounter: null,
    encounterStep: null,
    encounterTriggered: false,
    pendingFlightEncounter: null,
    encounterDiscard: [...(gameState.encounterDiscard ?? []), gameState.activeEncounter.cardId],
    ...(speedUpdate
      ? {
        flightSpeedTotal: speedUpdate.totalSpeed,
        remainingMovementByShipId: speedUpdate.remainingMovementByShipId
      }
      : {}),
    logEntries
  });
  return placePendingGiftedShips(nextState, defaultBoardLayout);
}

export function moveShip(gameState, boardLayout, shipId, targetNodeId, options = {}) {
  if (isGameOverState(gameState)) return gameState;
  if (
    gameState.phase !== "flight" ||
    !gameState.hasRolledFlightSpeed ||
    gameState.activeEncounter ||
    gameState.supernova?.shipBattle
  ) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  const remainingMovement = gameState.remainingMovementByShipId?.[shipId] ?? 0;
  const destinationState = getShipDestinationState(gameState, boardLayout, shipId, targetNodeId);
  const pathCost = destinationState?.distance ?? null;
  const defenderShip = destinationState?.endpointType === "battle"
    ? getShipAtNode(ships, targetNodeId, shipId)
    : null;
  if (
    !activePlayer ||
    !ship ||
    ship.ownerPlayerId !== activePlayer.id ||
    targetNodeId === ship.locationId ||
    pathCost === null ||
    pathCost > remainingMovement ||
    !destinationState?.validDestination
  ) {
    return gameState;
  }

  if (defenderShip && ship.type === "battleShip") {
    return startSupernovaShipBattle(gameState, ship, defenderShip, pathCost, remainingMovement - pathCost);
  }

  const updatedShip = {
    ...ship,
    locationId: targetNodeId,
    status: "active"
  };
  const updatedShips = ships.map((candidate) => candidate.id === shipId ? updatedShip : candidate);
  const movedPlayers = gameState.players.map((player) => ({
    ...player,
    ships: updatedShips.filter((candidate) => candidate.ownerPlayerId === player.id)
  }));
  const remaining = remainingMovement - pathCost;
  const movedState = updateGameState(gameState, {
    players: movedPlayers,
    remainingMovementByShipId: {
      ...(gameState.remainingMovementByShipId ?? {}),
      [shipId]: remaining
    },
    board: {
      ...gameState.board,
      selectedElement: { type: "ship", id: shipId },
      ships: updatedShips
    },
    logEntry: {
      type: "flight",
      messageKey: pathCost === 1 ? "logShipMovedOne" : "logShipMovedMany",
      messageParams: {
        player: activePlayer.name,
        shipOrdinal: getPlayerShipOrdinal(ships, ship),
        count: pathCost
      },
    }
  });
  return options.deferExploration ? movedState : completeShipExploration(movedState, boardLayout, shipId);
}

function startSupernovaShipBattle(gameState, attackerShip, defenderShip, pathCost, remainingMovement) {
  if (!isSupernovaGame(gameState) || gameState.supernova?.shipBattle) return gameState;
  const attacker = getPlayerById(gameState, attackerShip.ownerPlayerId);
  const defender = getPlayerById(gameState, defenderShip.ownerPlayerId);
  if (!attacker || !defender || attacker.id === defender.id) return gameState;

  return updateGameState(gameState, {
    remainingMovementByShipId: {
      ...(gameState.remainingMovementByShipId ?? {}),
      [attackerShip.id]: Math.max(0, remainingMovement)
    },
    supernova: {
      ...gameState.supernova,
      shipBattle: {
        id: createId("supernova-ship-battle"),
        stage: "rolling",
        round: 1,
        attackerPlayerId: attacker.id,
        defenderPlayerId: defender.id,
        attackerShipId: attackerShip.id,
        defenderShipId: defenderShip.id,
        defenderShipType: defenderShip.type,
        attackerOriginNodeId: attackerShip.locationId,
        targetNodeId: defenderShip.locationId,
        pathCost,
        attackerRoll: null,
        defenderRoll: null,
        attackerStrength: null,
        defenderStrength: null,
        winnerPlayerId: null,
        loserPlayerId: null,
        pendingUpgradePlayerId: null,
        removableUpgradeIds: []
      }
    },
    board: {
      ...gameState.board,
      selectedElement: { type: "ship", id: attackerShip.id }
    },
    logEntry: {
      type: "combat",
      messageKey: "logSupernovaBattleStarted",
      messageParams: {
        attacker: attacker.name,
        defender: defender.name
      }
    }
  });
}

export function submitSupernovaShipBattleRoll(gameState, { playerId, forcedRoll = null } = {}) {
  const battle = gameState.supernova?.shipBattle;
  if (!isSupernovaGame(gameState) || battle?.stage !== "rolling") return gameState;
  const isAttacker = playerId === battle.attackerPlayerId;
  const isDefender = playerId === battle.defenderPlayerId;
  if (!isAttacker && !isDefender) return gameState;

  const rollKey = isAttacker ? "attackerRoll" : "defenderRoll";
  if (battle[rollKey]) return gameState;
  const nextBattle = {
    ...battle,
    [rollKey]: createCombatRoll(forcedRoll)
  };
  if (!nextBattle.attackerRoll || !nextBattle.defenderRoll) {
    return updateGameState(gameState, {
      supernova: {
        ...gameState.supernova,
        shipBattle: nextBattle
      }
    });
  }

  const attackerStrength = nextBattle.attackerRoll.total + getPlayerCombatBonus(gameState, nextBattle.attackerPlayerId);
  const defenderStrength = nextBattle.defenderRoll.total + getPlayerCombatBonus(gameState, nextBattle.defenderPlayerId);
  const winnerPlayerId = attackerStrength === defenderStrength
    ? null
    : attackerStrength > defenderStrength
      ? nextBattle.attackerPlayerId
      : nextBattle.defenderPlayerId;

  return updateGameState(gameState, {
    supernova: {
      ...gameState.supernova,
      shipBattle: {
        ...nextBattle,
        stage: "reveal",
        attackerStrength,
        defenderStrength,
        winnerPlayerId,
        loserPlayerId: winnerPlayerId
          ? (winnerPlayerId === nextBattle.attackerPlayerId ? nextBattle.defenderPlayerId : nextBattle.attackerPlayerId)
          : null
      }
    }
  });
}

export function completeSupernovaShipBattleReveal(gameState) {
  const battle = gameState.supernova?.shipBattle;
  if (!isSupernovaGame(gameState) || battle?.stage !== "reveal") return gameState;

  if (!battle.winnerPlayerId) {
    return updateGameState(gameState, {
      supernova: {
        ...gameState.supernova,
        shipBattle: {
          ...battle,
          stage: "rolling",
          round: (battle.round ?? 1) + 1,
          attackerRoll: null,
          defenderRoll: null,
          attackerStrength: null,
          defenderStrength: null,
          loserPlayerId: null
        }
      },
      logEntry: {
        type: "combat",
        messageKey: "logSupernovaBattleTie",
        messageParams: {
          attack: battle.attackerStrength,
          defense: battle.defenderStrength
        }
      }
    });
  }

  if (battle.defenderShipType === "colonyShip") {
    const loser = getPlayerById(gameState, battle.loserPlayerId);
    const removableUpgradeIds = upgradeDefinitions
      .filter((upgrade) => getRealUpgradeValue(loser, upgrade.id) > 0)
      .map((upgrade) => upgrade.id);
    if (removableUpgradeIds.length > 0) {
      return updateGameState(gameState, {
        supernova: {
          ...gameState.supernova,
          shipBattle: {
            ...battle,
            stage: "upgradeLoss",
            pendingUpgradePlayerId: loser.id,
            removableUpgradeIds
          }
        }
      });
    }
  }

  return finalizeSupernovaShipBattle(gameState);
}

export function chooseSupernovaShipBattleUpgrade(gameState, { playerId, upgrade } = {}) {
  const battle = gameState.supernova?.shipBattle;
  if (
    !isSupernovaGame(gameState) ||
    battle?.stage !== "upgradeLoss" ||
    battle.pendingUpgradePlayerId !== playerId ||
    !battle.removableUpgradeIds?.includes(upgrade)
  ) return gameState;
  const player = getPlayerById(gameState, playerId);
  if (getRealUpgradeValue(player, upgrade) <= 0) return gameState;

  const players = updatePlayerById(gameState.players, playerId, (candidate) => withUpgradeDelta(candidate, upgrade, -1));
  return finalizeSupernovaShipBattle(gameState, players, upgrade);
}

function finalizeSupernovaShipBattle(gameState, playersOverride = gameState.players, lostUpgrade = null) {
  const battle = gameState.supernova?.shipBattle;
  if (!battle?.winnerPlayerId || !battle.loserPlayerId) return gameState;
  const ships = normalizeShips(gameState.board?.ships);
  const attackerShip = ships.find((ship) => ship.id === battle.attackerShipId);
  const defenderShip = ships.find((ship) => ship.id === battle.defenderShipId);
  const attacker = getPlayerById(gameState, battle.attackerPlayerId);
  const defender = getPlayerById(gameState, battle.defenderPlayerId);
  const winner = getPlayerById({ ...gameState, players: playersOverride }, battle.winnerPlayerId);
  const attackerWins = battle.winnerPlayerId === battle.attackerPlayerId;
  if (!attackerShip || !defenderShip || !attacker || !defender || !winner) return gameState;

  let nextShips = ships;
  let nextPlayers = playersOverride;
  const blockedShipIds = new Set(gameState.supernova?.blockedShipIds ?? []);
  const remainingMovementByShipId = { ...(gameState.remainingMovementByShipId ?? {}) };

  if (battle.defenderShipType === "battleShip") {
    const loserShipId = attackerWins ? defenderShip.id : attackerShip.id;
    nextShips = nextShips.filter((ship) => ship.id !== loserShipId);
    delete remainingMovementByShipId[loserShipId];
    if (attackerWins) {
      nextShips = nextShips.map((ship) => ship.id === attackerShip.id
        ? { ...ship, locationId: battle.targetNodeId, status: "active" }
        : ship);
    }
    nextPlayers = addHalfMedalToPlayer(nextPlayers, winner.id, 1);
  } else {
    if (!attackerWins) {
      nextPlayers = addHalfMedalToPlayer(nextPlayers, defender.id, 1);
    } else {
      blockedShipIds.add(defenderShip.id);
      remainingMovementByShipId[defenderShip.id] = 0;
    }
    if (battle.defenderShipType === "tradeShip") {
      nextPlayers = drawRandomResourcesBetweenPlayers(nextPlayers, battle.loserPlayerId, battle.winnerPlayerId, 2).players;
    }
  }

  nextPlayers = syncPlayersWithBoardAssets(nextPlayers, gameState.board?.structures ?? [], nextShips);
  const selectedShipId = attackerWins && battle.defenderShipType === "battleShip"
    ? attackerShip.id
    : attackerWins
      ? attackerShip.id
      : defenderShip.id;
  const logEntries = [{
    type: "combat",
    messageKey: "logSupernovaBattleResolved",
    messageParams: {
      attacker: attacker.name,
      defender: defender.name,
      winner: winner.name,
      attack: battle.attackerStrength,
      defense: battle.defenderStrength
    }
  }];
  if (lostUpgrade) {
    logEntries.push({
      type: "combat",
      messageKey: "logSupernovaBattleUpgradeLost",
      messageParams: {
        player: getPlayerById(gameState, battle.loserPlayerId)?.name ?? "",
        upgrade: lostUpgrade
      }
    });
  }

  return updateGameState(gameState, {
    players: nextPlayers,
    remainingMovementByShipId,
    supernova: {
      ...gameState.supernova,
      blockedShipIds: [...blockedShipIds],
      shipBattle: null
    },
    board: {
      ...gameState.board,
      selectedElement: nextShips.some((ship) => ship.id === selectedShipId)
        ? { type: "ship", id: selectedShipId }
        : null,
      ships: nextShips
    },
    logEntries
  });
}

function addHalfMedalToPlayer(players, playerId, amount = 1) {
  return updatePlayerById(players, playerId, (player) => withHalfMedalDelta(player, amount));
}

function drawRandomResourcesBetweenPlayers(players, fromPlayerId, toPlayerId, amount = 1) {
  let nextPlayers = players;
  const drawnResources = [];
  for (let index = 0; index < amount; index += 1) {
    const fromPlayer = nextPlayers.find((player) => player.id === fromPlayerId);
    const resource = drawRandomResource(fromPlayer?.resources);
    if (!resource) break;
    drawnResources.push(resource);
    nextPlayers = updatePlayerById(nextPlayers, fromPlayerId, (player) => withResourceDelta(player, resource, -1));
    nextPlayers = updatePlayerById(nextPlayers, toPlayerId, (player) => withResourceDelta(player, resource, 1));
  }
  return { players: nextPlayers, drawnResources };
}

export function completeShipExploration(gameState, boardLayout, shipId) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "flight") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  if (!activePlayer || !ship || ship.ownerPlayerId !== activePlayer.id) return gameState;

  const targetNodeId = ship.locationId;
  const explorationResult = exploreAdjacentSystems(gameState, boardLayout, targetNodeId, activePlayer.name);
  const specialResult = resolveAdjacentSpecialMarkers(
    {
      ...gameState,
      board: {
        ...gameState.board,
        exploredSystems: explorationResult.exploredSystems,
        exploredOutposts: explorationResult.exploredOutposts,
        exploredEmptySlots: explorationResult.exploredEmptySlots,
        placedQuadrants: explorationResult.placedQuadrants,
        numberTokens: explorationResult.numberTokens
      }
    },
    boardLayout,
    targetNodeId,
    activePlayer
  );

  return updateGameState(gameState, {
    players: specialResult.players,
    board: {
      ...gameState.board,
      exploredSystems: explorationResult.exploredSystems,
      exploredOutposts: explorationResult.exploredOutposts,
      exploredEmptySlots: explorationResult.exploredEmptySlots,
      placedQuadrants: explorationResult.placedQuadrants,
      numberTokens: specialResult.numberTokens
    },
    logEntries: [
      ...explorationResult.logEntries,
      ...specialResult.logEntries
    ]
  });
}

function getPlayerShipOrdinal(ships, ship) {
  const playerShips = sortPlayerShipsForOrdinal(ships
    .filter((candidate) => candidate.ownerPlayerId === ship.ownerPlayerId));
  const index = playerShips.findIndex((candidate) => candidate.id === ship.id);
  return index === 1 ? "second" : index === 2 ? "third" : "first";
}

function sortPlayerShipsForOrdinal(ships) {
  return [...ships].sort(compareShipsForOrdinal);
}

function compareShipsForOrdinal(left, right) {
  const leftVariant = getShipVariant(left);
  const rightVariant = getShipVariant(right);
  if (leftVariant !== rightVariant) return leftVariant - rightVariant;
  return left.id.localeCompare(right.id);
}

function getShipVariant(ship) {
  const explicitVariant = Number(ship?.shipVariant ?? ship?.coilCount ?? ship?.variant);
  if (Number.isInteger(explicitVariant) && explicitVariant >= 1 && explicitVariant <= playerFigureLimits.transporter) {
    return explicitVariant;
  }

  const numericSuffix = String(ship?.id ?? "").match(/-(\d+)$/);
  if (numericSuffix) {
    return ((Number(numericSuffix[1]) - 1) % playerFigureLimits.transporter) + 1;
  }

  return 1;
}

function getNextAvailableShipVariant(ships, playerId, shipType = "transporter") {
  const useBattleShipVariants = shipType === "battleShip";
  const usedVariants = new Set(normalizeShips(ships)
    .filter((ship) => ship.ownerPlayerId === playerId && (useBattleShipVariants ? ship.type === "battleShip" : ship.type !== "battleShip"))
    .map((ship) => getShipVariant(ship)));

  for (let variant = 1; variant <= playerFigureLimits.transporter; variant += 1) {
    if (!usedVariants.has(variant)) return variant;
  }
  return null;
}

export function foundColony(gameState, boardLayout, shipId) {
  if (!canFoundColonyWithShip(gameState, boardLayout, shipId)) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  const colonySite = getGameColonySites(gameState, boardLayout).find((site) => site.nodeId === ship?.locationId);

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
  const players = syncPlayersWithBoardAssets(gameState.players, structures, updatedShips);

  const nextState = updateGameState(gameState, {
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
  return placePendingGiftedShips(nextState, boardLayout);
}

export function canFoundColonyWithShip(gameState, boardLayout, shipId) {
  if (!gameState || isGameOverState(gameState) || gameState.phase !== "flight") return false;

  const activePlayer = gameState.players?.[gameState.currentPlayerIndex];
  const ship = normalizeShips(gameState.board?.ships).find((candidate) => candidate.id === shipId);
  const colonySite = getGameColonySites(gameState, boardLayout).find((site) => site.nodeId === ship?.locationId);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout, { useFallback: false });

  return Boolean(
    activePlayer &&
    ship &&
    ship.ownerPlayerId === activePlayer.id &&
    ship.type === "colonyShip" &&
    colonySite &&
    isSystemExplored(gameState, boardLayout, colonySite.systemId) &&
    !isColonySiteBlockedBySpecial(gameState, colonySite) &&
    !isStructureAtLocation(structures, colonySite.nodeId) &&
    !isThreePlayerColonyLimitReached(gameState, boardLayout, colonySite.systemId, structures)
  );
}

export function foundTradeStation(gameState, boardLayout, shipId) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "flight") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  const outpost = getDockingOutpost(gameState, boardLayout, ship?.locationId);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout);
  const availableDocks = getAvailableOutpostDocks(gameState, boardLayout, outpost?.id, structures);
  const selectedDock = availableDocks[0] ?? null;
  const existingOutpostStations = structures
    .filter((structure) => structure.type === "tradeStation" && structure.outpostId === outpost?.id);
  const requiredCargo = existingOutpostStations.length + 1;
  if (
    !activePlayer ||
    !ship ||
    ship.ownerPlayerId !== activePlayer.id ||
    ship.type !== "tradeShip" ||
    !outpost ||
    !selectedDock ||
    getCargoValueForPlayer(gameState, activePlayer.id) < requiredCargo
  ) {
    return gameState;
  }

  return placeTradeStationAtDock(gameState, boardLayout, {
    activePlayer,
    ship,
    outpost,
    selectedDock,
    ships,
    structures
  });
}

export function confirmPendingTradeStationPlacement(gameState, boardLayout, targetNodeId) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "flight") return gameState;

  const pending = normalizePendingTradeStationPlacement(gameState.board?.pendingTradeStationPlacement, gameState.players);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === pending?.shipId);
  const outpost = getPlacedOutposts(gameState, boardLayout).find((candidate) => candidate.id === pending?.outpostId);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout);
  const availableDocks = getAvailableOutpostDocks(gameState, boardLayout, outpost?.id, structures)
    .filter((dock) => pending?.availableDockIds?.includes(dock.id));
  const selectedDock = availableDocks.find((dock) => dock.nodeId === targetNodeId);
  const existingOutpostStations = structures
    .filter((structure) => structure.type === "tradeStation" && structure.outpostId === outpost?.id);
  const requiredCargo = existingOutpostStations.length + 1;

  if (
    !pending ||
    !activePlayer ||
    pending.ownerPlayerId !== activePlayer.id ||
    !ship ||
    ship.ownerPlayerId !== activePlayer.id ||
    ship.type !== "tradeShip" ||
    !outpost ||
    !selectedDock ||
    getCargoValueForPlayer(gameState, activePlayer.id) < requiredCargo
  ) {
    return gameState;
  }

  return placeTradeStationAtDock(gameState, boardLayout, {
    activePlayer,
    ship,
    outpost,
    selectedDock,
    ships,
    structures
  });
}

function placeTradeStationAtDock(gameState, boardLayout, {
  activePlayer,
  ship,
  outpost,
  selectedDock,
  ships,
  structures
}) {
  const structure = {
    id: createId("trade-station"),
    ownerPlayerId: activePlayer.id,
    type: "tradeStation",
    locationId: selectedDock.nodeId,
    dockId: selectedDock.id,
    outpostId: outpost.id,
    adjacentPlanetIds: []
  };
  const updatedShips = ships.filter((candidate) => candidate.id !== ship.id);
  const updatedStructures = [...structures, structure];
  const remainingMovementByShipId = { ...(gameState.remainingMovementByShipId ?? {}) };
  delete remainingMovementByShipId[ship.id];
  const updatedOutposts = getPlacedOutposts(gameState, boardLayout).map((candidate) => (
    candidate.id === outpost.id
      ? {
        ...candidate,
        tradeStationIds: [...(candidate.tradeStationIds ?? []), structure.id]
      }
      : candidate
  ));
  const friendshipResult = applyFriendshipMarkerState(
    syncPlayersWithBoardAssets(gameState.players, updatedStructures, updatedShips),
    updatedOutposts,
    updatedStructures,
    outpost.id
  );
  const availableCardIds = Array.isArray(outpost.friendshipCards)
    ? outpost.friendshipCards.filter((cardId) => typeof cardId === "string")
    : [];
  const logEntries = [
    {
      type: "founding",
      messageKey: "logTradeStationFounded",
      messageParams: {
        player: activePlayer.name
      }
    }
  ];

  if (friendshipResult.markerChange?.type === "granted") {
    logEntries.push({
      type: "friendship",
      messageKey: "logFriendshipMarkerGranted",
      messageParams: {
        player: getPlayerNameById(friendshipResult.players, friendshipResult.markerChange.nextHolderPlayerId),
        outpost: getOutpostName(outpost, gameState.language)
      }
    });
  } else if (friendshipResult.markerChange?.type === "transferred") {
    logEntries.push({
      type: "friendship",
      messageKey: "logFriendshipMarkerTransferred",
      messageParams: {
        player: getPlayerNameById(friendshipResult.players, friendshipResult.markerChange.nextHolderPlayerId),
        outpost: getOutpostName(outpost, gameState.language)
      }
    });
  }

  const grantedCardId = availableCardIds.length === 1 ? availableCardIds[0] : null;
  const finalPlayers = grantedCardId
    ? applyFriendshipCardOnGain(
      grantFriendshipCardToPlayer(friendshipResult.players, activePlayer.id, grantedCardId),
      activePlayer.id,
      getFriendshipCardById(grantedCardId)
    )
    : friendshipResult.players;
  const finalOutposts = grantedCardId
    ? removeFriendshipCardFromOutposts(friendshipResult.outposts, outpost.id, grantedCardId)
    : friendshipResult.outposts;

  const nextState = updateGameState(gameState, {
    players: finalPlayers,
    remainingMovementByShipId,
    board: {
      ...gameState.board,
      selectedElement: { type: "structure", id: structure.id },
      placedOutposts: finalOutposts,
      pendingFriendshipCardSelection: grantedCardId || availableCardIds.length === 0
        ? null
        : {
          ownerPlayerId: activePlayer.id,
          outpostId: outpost.id,
          availableCardIds,
          grantedStationId: structure.id
        },
      pendingTradeStationPlacement: null,
      structures: updatedStructures,
      colonies: updatedStructures.filter((candidate) => candidate.type === "colony"),
      stations: updatedStructures.filter((candidate) => candidate.type === "tradeStation"),
      ships: updatedShips
    },
    logEntries: grantedCardId
      ? [...logEntries, createFriendshipCardGainLogEntry(activePlayer.name, grantedCardId)]
      : logEntries
  });
  return placePendingGiftedShips(nextState, boardLayout);
}

export function selectPendingFriendshipCard(gameState, cardId) {
  if (isGameOverState(gameState)) return gameState;

  const pending = normalizePendingFriendshipCardSelection(gameState.board?.pendingFriendshipCardSelection, gameState.players);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  if (
    !pending ||
    !activePlayer ||
    pending.ownerPlayerId !== activePlayer.id ||
    !pending.availableCardIds.includes(cardId)
  ) {
    return gameState;
  }

  const players = grantFriendshipCardToPlayer(gameState.players, activePlayer.id, cardId);
  const card = getFriendshipCardById(cardId);
  const playersAfterEffects = applyFriendshipCardOnGain(players, activePlayer.id, card);

  return updateGameState(gameState, {
    players: playersAfterEffects,
    board: {
      ...gameState.board,
      placedOutposts: removeFriendshipCardFromOutposts(gameState.board?.placedOutposts ?? [], pending.outpostId, cardId),
      pendingFriendshipCardSelection: null
    },
    logEntry: createFriendshipCardGainLogEntry(activePlayer.name, cardId)
  });
}

export function cancelPendingTradeStationPlacement(gameState) {
  if (isGameOverState(gameState)) return gameState;
  if (!gameState.board?.pendingTradeStationPlacement) return gameState;

  return updateGameState(gameState, {
    board: {
      ...gameState.board,
      selectedElement: null,
      pendingTradeStationPlacement: null
    },
    logEntry: {
      type: "founding",
      messageKey: "logTradeStationSelectionCancelled",
      messageParams: {
        player: getActivePlayerName(gameState)
      }
    }
  });
}

export function getReachableNodes(boardLayout, ships, shipId, maxDistance, structures = [], blockedNodeIds = [], gameState = null) {
  const ship = normalizeShips(ships).find((candidate) => candidate.id === shipId);
  if (!ship || maxDistance <= 0) return [];

  const blocked = new Set(blockedNodeIds);
  const graph = createConnectionGraph(boardLayout);
  const queue = [{ id: ship.locationId, distance: 0 }];
  const visited = new Map([[ship.locationId, 0]]);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const nextId of graph.get(current.id) ?? []) {
      const nextDistance = current.distance + 1;
      if (nextDistance > maxDistance || visited.has(nextId) || blocked.has(nextId)) continue;
      visited.set(nextId, nextDistance);
      queue.push({ id: nextId, distance: nextDistance });
    }
  }

  return [...visited.entries()]
    .filter(([id]) => id !== ship.locationId)
    .map(([id, distance]) => ({
      id,
      distance,
      occupied: isNodeOccupied(ships, structures, id, shipId)
    }))
    .map((node) => {
      if (!gameState) {
        return {
          ...node,
          validDestination: !node.occupied,
          endpointType: "spacePoint",
          reason: node.occupied ? "occupied" : null,
          passable: true
        };
      }

      return {
        ...node,
        ...getShipDestinationState(gameState, boardLayout, shipId, node.id)
      };
    })
    .filter((node) => node.validDestination);
}

export function getShipDestinationState(gameState, boardLayout, shipId, targetNodeId) {
  const ships = normalizeShips(gameState.board?.ships);
  const ship = ships.find((candidate) => candidate.id === shipId);
  if (!ship || !targetNodeId) {
    return {
      validDestination: false,
      passable: false,
      distance: null,
      endpointType: null,
      reason: "invalid"
    };
  }

  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout);
  const blockedNodeIds = getBlockedSystemNodeIds(gameState, boardLayout);
  const distance = getShortestPathCost(boardLayout, ship.locationId, targetNodeId, blockedNodeIds);
  const colonySite = getGameColonySites(gameState, boardLayout).find((site) => site.nodeId === targetNodeId) ?? null;
  const outpost = getDockingOutpost(gameState, boardLayout, targetNodeId);
  const occupied = isNodeOccupied(ships, structures, targetNodeId, shipId);
  const enemySpaceportLaunch = isEnemySpaceportLaunchPoint(gameState, boardLayout, ship.ownerPlayerId, targetNodeId);
  let endpointType = "spacePoint";

  if (colonySite) endpointType = "colonySite";
  if (outpost) endpointType = "dock";
  if (enemySpaceportLaunch) endpointType = "spaceportLaunch";

  if (distance === null) {
    return {
      validDestination: false,
      passable: false,
      distance: null,
      endpointType,
      reason: "invalid"
    };
  }

  if (blockedNodeIds.has(targetNodeId)) {
    return {
      validDestination: false,
      passable: true,
      distance,
      endpointType,
      reason: "shipType"
    };
  }

  if (occupied) {
    const targetShip = getShipAtNode(ships, targetNodeId, shipId);
    if (isSupernovaGame(gameState) && ship.type === "battleShip" && targetShip && targetShip.ownerPlayerId !== ship.ownerPlayerId) {
      return {
        validDestination: true,
        passable: true,
        distance,
        endpointType: "battle",
        reason: null
      };
    }
    return {
      validDestination: false,
      passable: true,
      distance,
      endpointType,
      reason: "occupied"
    };
  }

  if (enemySpaceportLaunch) {
    return {
      validDestination: false,
      passable: true,
      distance,
      endpointType,
      reason: "shipType"
    };
  }

  if (ship.type === "colonyShip" && outpost) {
    return {
      validDestination: false,
      passable: true,
      distance,
      endpointType,
      reason: "shipType"
    };
  }

  if (ship.type === "tradeShip" && colonySite) {
    return {
      validDestination: false,
      passable: true,
      distance,
      endpointType,
      reason: "shipType"
    };
  }

  if (
    ship.type === "colonyShip" &&
    colonySite &&
    isThreePlayerColonyLimitReached(gameState, boardLayout, colonySite.systemId, structures)
  ) {
    return {
      validDestination: false,
      passable: true,
      distance,
      endpointType,
      reason: "colonyLimit"
    };
  }

  if (ship.type === "tradeShip" && outpost) {
    const hasOpenDock = getAvailableOutpostDocks(gameState, boardLayout, outpost.id, structures).length > 0;
    const requiredCargo = structures
      .filter((structure) => structure.type === "tradeStation" && structure.outpostId === outpost.id)
      .length + 1;
    const owningPlayer = gameState.players.find((player) => player.id === ship.ownerPlayerId);
    if (getCargoValueForPlayer(gameState, owningPlayer?.id) < requiredCargo || !hasOpenDock) {
      return {
        validDestination: false,
        passable: true,
        distance,
        endpointType,
        reason: "shipType"
      };
    }
  }

  return {
    validDestination: true,
    passable: true,
    distance,
    endpointType,
    reason: null
  };
}

export function tradeWithSupply(gameState, { fromResource, toResource }) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild" || fromResource === toResource) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const tradeRates = getTradeRatesForPlayer(gameState, activePlayer?.id);
  let rate = tradeRates[fromResource] ?? getTradeRate(fromResource);
  if (!activePlayer) return gameState;
  let actionCard = getTradeRateCardForResource(gameState, activePlayer.id, fromResource, rate);
  if (actionCard && isFriendshipTurnActionUsed(gameState, actionCard.id)) {
    rate = getTradeRate(fromResource);
    actionCard = null;
  }
  if (!canPay(activePlayer.resources, { [fromResource]: rate })) return gameState;

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
    friendshipTurnState: actionCard
      ? markFriendshipTurnAction(gameState, actionCard.id)
      : gameState.friendshipTurnState,
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

export function useBoughtFame(gameState) {
  if (isGameOverState(gameState) || gameState.phase !== "tradeBuild") return gameState;
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const card = getFriendshipCardsForPlayer(activePlayer)
    .find((entry) => entry.implemented && entry.effectType === "buyHalfMedal");
  if (!activePlayer || !card) return gameState;
  if (card.effectValue?.oncePerTurn && isFriendshipTurnActionUsed(gameState, card.id)) return gameState;
  if (!canPay(activePlayer.resources, card.effectValue?.cost ?? {})) return gameState;

  const players = gameState.players.map((player) => player.id === activePlayer.id
    ? withHalfMedalDelta({
      ...player,
      resources: payCost(player.resources, card.effectValue?.cost ?? {})
    }, card.effectValue?.halfMedals ?? 1)
    : player);

  return updateGameState(gameState, {
    players,
    friendshipTurnState: markFriendshipTurnAction(gameState, card.id),
    logEntry: {
      type: "friendship",
      messageKey: "logBoughtFameUsed",
      messageParams: {
        player: activePlayer.name
      }
    }
  });
}

export function useRichHelpsPoor(gameState, targetPlayerIds = []) {
  if (isGameOverState(gameState) || gameState.phase !== "tradeBuild") return gameState;
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const card = getFriendshipCardsForPlayer(activePlayer)
    .find((entry) => entry.implemented && entry.effectType === "drawFromLeaders");
  if (!activePlayer || !card) return gameState;
  if (isFriendshipTurnActionUsed(gameState, card.id)) return gameState;

  const activePoints = activePlayer.victoryPoints ?? calculateVictoryPoints(gameState, activePlayer.id);
  const maxTargets = Math.max(1, card.effectValue?.maxTargets ?? 2);
  const selectedTargets = [...new Set(Array.isArray(targetPlayerIds) ? targetPlayerIds : [])]
    .slice(0, maxTargets)
    .map((playerId) => getPlayerById(gameState, playerId))
    .filter((player) => (
      player &&
      player.id !== activePlayer.id &&
      (player.victoryPoints ?? calculateVictoryPoints(gameState, player.id)) > activePoints &&
      countResources(player.resources) > 0
    ));
  if (selectedTargets.length === 0) return gameState;

  let players = gameState.players;
  let drawnCount = 0;

  for (const targetPlayer of selectedTargets) {
    const currentTarget = players.find((player) => player.id === targetPlayer.id);
    const drawnResource = drawRandomResource(currentTarget?.resources);
    if (!drawnResource) continue;

    players = players.map((player) => {
      if (player.id === activePlayer.id) {
        return withResourceDelta(player, drawnResource, 1);
      }
      if (player.id === targetPlayer.id) {
        return withResourceDelta(player, drawnResource, -1);
      }
      return player;
    });
    drawnCount += 1;
  }

  if (drawnCount === 0) return gameState;

  return updateGameState(gameState, {
    players,
    friendshipTurnState: markFriendshipTurnAction(gameState, card.id),
    logEntry: {
      type: "friendship",
      messageKey: "logRichHelpsPoorUsed",
      messageParams: {
        player: activePlayer.name,
        count: drawnCount
      }
    }
  });
}

export function resolvePendingFriendshipAction(gameState, payload = {}) {
  if (isGameOverState(gameState)) return gameState;
  const pendingAction = normalizePendingFriendshipAction(gameState.pendingFriendshipAction, gameState.players);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  if (!pendingAction || !activePlayer || pendingAction.ownerPlayerId !== activePlayer.id) return gameState;

  if (pendingAction.type === "galacticAid") {
    const resource = supplyResourceTypes.includes(payload.resource) ? payload.resource : null;
    if (!resource) return gameState;

    const players = gameState.players.map((player) => player.id === activePlayer.id
      ? withResourceDelta(player, resource, pendingAction.amount ?? 1)
      : player);

    return updateGameState(gameState, {
      players,
      pendingFriendshipAction: null,
      logEntry: {
        type: "friendship",
        messageKey: "logGalacticAidUsed",
        messageParams: {
          player: activePlayer.name,
          resource
        }
      }
    });
  }

  return gameState;
}

export function createTradeOffer(gameState, { fromPlayerId, toPlayerId, offeredResources, requestedResources }) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const targetPlayer = gameState.players.find((player) => player.id === toPlayerId);
  const normalizedOffered = normalizeResources(offeredResources);
  const normalizedRequested = normalizeResources(requestedResources);
  const hasOfferContent = countResources(normalizedOffered) > 0 || countResources(normalizedRequested) > 0;

  if (
    !activePlayer ||
    activePlayer.id !== fromPlayerId ||
    !targetPlayer ||
    targetPlayer.id === activePlayer.id ||
    !hasOfferContent ||
    !canPay(activePlayer.resources, normalizedOffered)
  ) {
    return gameState;
  }

  return updateGameState(gameState, {
    activeTradeOffer: {
      offerId: createId("trade-offer"),
      fromPlayerId: activePlayer.id,
      toPlayerId: targetPlayer.id,
      offeredResources: normalizedOffered,
      requestedResources: normalizedRequested,
      status: "pending",
      createdAt: new Date().toISOString()
    },
    logEntry: {
      type: "trade",
      messageKey: "logTradeOffered",
      messageParams: {
        player: activePlayer.name,
        target: targetPlayer.name
      }
    }
  });
}

export function cancelTradeOffer(gameState, playerId) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild") return gameState;
  const activeTradeOffer = normalizeActiveTradeOffer(gameState.activeTradeOffer, gameState.players);
  if (!activeTradeOffer || activeTradeOffer.fromPlayerId !== playerId) return gameState;

  const player = gameState.players.find((candidate) => candidate.id === playerId);
  return updateGameState(gameState, {
    activeTradeOffer: null,
    logEntry: {
      type: "trade",
      messageKey: "logTradeCancelled",
      messageParams: {
        player: player?.name ?? playerId
      }
    }
  });
}

export function respondToTradeOffer(gameState, playerId, decision) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild") return gameState;
  const activeTradeOffer = normalizeActiveTradeOffer(gameState.activeTradeOffer, gameState.players);
  if (!activeTradeOffer || !["accept", "decline"].includes(decision) || activeTradeOffer.toPlayerId !== playerId) {
    return gameState;
  }

  const sourcePlayer = gameState.players.find((player) => player.id === activeTradeOffer.fromPlayerId);
  const targetPlayer = gameState.players.find((player) => player.id === activeTradeOffer.toPlayerId);
  if (!sourcePlayer || !targetPlayer) {
    return updateGameState(gameState, {
      activeTradeOffer: null,
      logEntry: {
        type: "trade",
        messageKey: "logTradeInvalid",
        messageParams: {}
      }
    });
  }

  if (decision === "decline") {
    return updateGameState(gameState, {
      activeTradeOffer: null,
      logEntry: {
        type: "trade",
        messageKey: "logTradeDeclined",
        messageParams: {
          player: targetPlayer.name,
          source: sourcePlayer.name
        }
      }
    });
  }

  if (
    !canPay(sourcePlayer.resources, activeTradeOffer.offeredResources) ||
    !canPay(targetPlayer.resources, activeTradeOffer.requestedResources)
  ) {
    return updateGameState(gameState, {
      activeTradeOffer: null,
      logEntry: {
        type: "trade",
        messageKey: "logTradeInvalid",
        messageParams: {}
      }
    });
  }

  const players = gameState.players.map((player) => {
    if (player.id === sourcePlayer.id) {
      return {
        ...player,
        resources: mergeResources(
          payCost(player.resources, activeTradeOffer.offeredResources),
          activeTradeOffer.requestedResources
        )
      };
    }
    if (player.id === targetPlayer.id) {
      return {
        ...player,
        resources: mergeResources(
          payCost(player.resources, activeTradeOffer.requestedResources),
          activeTradeOffer.offeredResources
        )
      };
    }
    return player;
  });

  return updateGameState(gameState, {
    players,
    activeTradeOffer: null,
    logEntry: {
      type: "trade",
      messageKey: "logTradeAccepted",
      messageParams: {
        player: targetPlayer.name,
        source: sourcePlayer.name
      }
    }
  });
}

export function buyUpgrade(gameState, upgradeId) {
  if (isGameOverState(gameState)) return gameState;
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
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild" || !["colonyShip", "tradeShip", "battleShip"].includes(shipType)) return gameState;
  if (shipType === "battleShip" && !isSupernovaGame(gameState)) return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const definition = buildActionDefinitions.find((action) => action.id === shipType);
  const inventory = getPlayerInventory(gameState, activePlayer?.id);
  const launchPoint = findFreeLaunchPoint(gameState, boardLayout, activePlayer?.id);
  const nextShipVariant = getNextAvailableShipVariant(gameState.board?.ships, activePlayer?.id, shipType);
  const hasRequiredFigure = shipType === "colonyShip"
    ? (inventory.colony.available > 0 && inventory.transporter.available > 0)
    : shipType === "tradeShip"
      ? (inventory.tradeStation.available > 0 && inventory.transporter.available > 0)
      : (inventory.battleShip.available > 0);
  const hasRequiredUpgrade = shipType !== "battleShip" || getRealUpgradeValue(activePlayer, "cannon") > 0;
  if (!activePlayer || !definition || !launchPoint || !nextShipVariant || !hasRequiredFigure || !canPay(activePlayer.resources, definition.cost)) {
    return gameState;
  }
  if (!hasRequiredUpgrade) return gameState;

  return updateGameState(gameState, {
    board: {
      ...gameState.board,
      selectedElement: null,
      pendingSpaceportUpgrade: null,
      pendingShipPlacement: {
        shipType,
        ownerPlayerId: activePlayer.id,
        cost: definition.cost
      }
    }
  });
}

export function getBuildableSupernovaFactoryOptions(gameState, boardLayout, playerId = null) {
  if (!isSupernovaGame(gameState) || gameState?.phase !== "tradeBuild") return [];
  const activePlayer = gameState.players?.[gameState.currentPlayerIndex];
  const ownerPlayerId = playerId ?? activePlayer?.id;
  const player = getPlayerById(gameState, ownerPlayerId);
  if (!player) return [];
  const startSystemIds = new Set((boardLayout.startSystems ?? []).map((system) => system.id));
  const factories = gameState.supernova?.factories ?? [];
  const playerFactoryCount = factories.filter((factory) => factory.ownerPlayerId === ownerPlayerId).length;
  if (playerFactoryCount >= supernovaFactoryLimitPerPlayer) return [];
  const occupiedPlanetIds = new Set(factories.map((factory) => factory.planetId));
  const playerStructures = (gameState.board?.structures ?? [])
    .filter((structure) => structure.ownerPlayerId === ownerPlayerId && ["colony", "spaceport"].includes(structure.type));
  const adjacentPlanetIds = new Set(playerStructures.flatMap((structure) => structure.adjacentPlanetIds ?? []));
  const planets = getExploredPlanetSystems(gameState, boardLayout)
    .filter((system) => !startSystemIds.has(system.id))
    .flatMap((system) => (system.planets ?? []).map((planet) => ({
      ...planet,
      systemId: system.id
    })))
    .filter((planet) => adjacentPlanetIds.has(planet.id) && !occupiedPlanetIds.has(planet.id));

  return supernovaFactoryTypes.flatMap((factoryType) => planets
    .filter((planet) => planet.resource === factoryType.resource)
    .map((planet) => ({
      factoryType: factoryType.id,
      label: getSupernovaLocalizedTitle(factoryType, gameState.language),
      planetId: planet.id,
      systemId: planet.systemId,
      resource: planet.resource,
      cost: factoryType.cost,
      canBuild: canPay(player.resources, factoryType.cost)
    })));
}

export function buildSupernovaFactory(gameState, boardLayout, factoryTypeId, planetId = null) {
  if (isGameOverState(gameState) || !isSupernovaGame(gameState) || gameState.phase !== "tradeBuild") return gameState;
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const option = getBuildableSupernovaFactoryOptions(gameState, boardLayout, activePlayer?.id)
    .find((candidate) => candidate.factoryType === factoryTypeId && (!planetId || candidate.planetId === planetId));
  const factoryType = getSupernovaFactoryType(factoryTypeId);
  if (!activePlayer || !option || !factoryType || !option.canBuild) return gameState;

  const factory = {
    id: createId(`factory-${factoryTypeId}`),
    ownerPlayerId: activePlayer.id,
    type: factoryType.id,
    resource: factoryType.resource,
    planetId: option.planetId,
    systemId: option.systemId
  };

  const players = updatePlayerById(gameState.players, activePlayer.id, (player) => ({
    ...player,
    resources: payCost(player.resources, factoryType.cost)
  }));

  return updateGameState(gameState, {
    players,
    board: {
      ...gameState.board,
      selectedElement: { type: "planet", id: option.planetId }
    },
    supernova: {
      ...gameState.supernova,
      factories: [...(gameState.supernova?.factories ?? []), factory]
    },
    logEntry: {
      type: "build",
      messageKey: "logSupernovaFactoryBuilt",
      messageParams: {
        player: activePlayer.name,
        factory: getSupernovaLocalizedTitle(factoryType, gameState.language)
      }
    }
  });
}

export function placePendingShip(gameState, boardLayout, targetNodeId) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild") return gameState;

  const pending = normalizePendingShipPlacement(gameState.board?.pendingShipPlacement, gameState.players);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const definition = buildActionDefinitions.find((action) => action.id === pending?.shipType);
  const inventory = getPlayerInventory(gameState, activePlayer?.id);
  const shipVariant = getNextAvailableShipVariant(gameState.board?.ships, activePlayer?.id, pending?.shipType);
  const launchPoint = getAvailableShipLaunchPoints(gameState, boardLayout, activePlayer?.id)
    .find((point) => point.id === targetNodeId);
  const hasRequiredFigure = pending?.shipType === "colonyShip"
    ? (inventory.colony.available > 0 && inventory.transporter.available > 0)
    : pending?.shipType === "tradeShip"
      ? (inventory.tradeStation.available > 0 && inventory.transporter.available > 0)
      : (inventory.battleShip.available > 0);
  if (
    !pending ||
    !activePlayer ||
    !shipVariant ||
    pending.ownerPlayerId !== activePlayer.id ||
    !definition ||
    !launchPoint ||
    !hasRequiredFigure ||
    !canPay(activePlayer.resources, definition.cost)
  ) {
    return gameState;
  }

  const ship = {
    id: createId(pending.shipType),
    ownerPlayerId: activePlayer.id,
    type: pending.shipType,
    shipVariant,
    coilCount: shipVariant,
    locationId: targetNodeId,
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
      selectedElement: { type: "ship", id: ship.id },
      pendingShipPlacement: null,
      ships
    },
    logEntry: {
      type: "build",
      messageKey: pending.shipType === "colonyShip"
        ? "logColonyShipBuilt"
        : pending.shipType === "tradeShip"
          ? "logTradeShipBuilt"
          : "logBattleShipBuilt",
      messageParams: {
        player: activePlayer.name
      }
    }
  });
}

export function cancelPendingShipPlacement(gameState) {
  if (isGameOverState(gameState)) return gameState;
  if (!gameState.board?.pendingShipPlacement) return gameState;

  return updateGameState(gameState, {
    board: {
      ...gameState.board,
      selectedElement: null,
      pendingShipPlacement: null
    }
  });
}

export function startPendingSpaceportUpgrade(gameState) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild") return gameState;

  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const definition = buildActionDefinitions.find((action) => action.id === "spaceport");
  const inventory = getPlayerInventory(gameState, activePlayer?.id);
  const colonies = findUpgradeableColonies(gameState, activePlayer?.id);
  if (
    !activePlayer ||
    !definition ||
    colonies.length === 0 ||
    inventory.spaceport.available <= 0 ||
    !canPay(activePlayer.resources, definition.cost)
  ) {
    return gameState;
  }

  return updateGameState(gameState, {
    board: {
      ...gameState.board,
      selectedElement: null,
      pendingShipPlacement: null,
      pendingSpaceportUpgrade: {
        ownerPlayerId: activePlayer.id,
        cost: definition.cost
      }
    },
    logEntry: {
      type: "build",
      messageKey: "logSpaceportSelectionStarted",
      messageParams: {
        player: activePlayer.name
      }
    }
  });
}

export function confirmPendingSpaceportUpgrade(gameState, structureId) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.phase !== "tradeBuild") return gameState;

  const pending = normalizePendingSpaceportUpgrade(gameState.board?.pendingSpaceportUpgrade, gameState.players);
  const activePlayer = gameState.players[gameState.currentPlayerIndex];
  const definition = buildActionDefinitions.find((action) => action.id === "spaceport");
  const inventory = getPlayerInventory(gameState, activePlayer?.id);
  const colony = findUpgradeableColonies(gameState, activePlayer?.id)
    .find((structure) => structure.id === structureId);
  if (
    !pending ||
    !activePlayer ||
    pending.ownerPlayerId !== activePlayer.id ||
    !definition ||
    !colony ||
    inventory.spaceport.available <= 0 ||
    !canPay(activePlayer.resources, definition.cost)
  ) {
    return gameState;
  }

  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, { startSites: [], startAssignments: [] })
    .map((structure) => structure.id === colony.id ? { ...structure, type: "spaceport" } : structure);
  const players = updatePlayerById(gameState.players, activePlayer.id, (player) => ({
    ...player,
    resources: payCost(player.resources, definition.cost),
    structures: structures.filter((structure) => structure.ownerPlayerId === player.id)
  }));

  return updateGameState(gameState, {
    players,
    board: {
      ...gameState.board,
      structures,
      colonies: structures.filter((structure) => structure.type === "colony"),
      selectedElement: { type: "structure", id: colony.id },
      pendingSpaceportUpgrade: null
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

export function cancelPendingSpaceportUpgrade(gameState) {
  if (isGameOverState(gameState)) return gameState;
  if (!gameState.board?.pendingSpaceportUpgrade) return gameState;

  return updateGameState(gameState, {
    board: {
      ...gameState.board,
      selectedElement: null,
      pendingSpaceportUpgrade: null
    },
    logEntry: {
      type: "build",
      messageKey: "logSpaceportSelectionCancelled",
      messageParams: {
        player: getActivePlayerName(gameState)
      }
    }
  });
}

export function endCurrentTurn(gameState) {
  if (isGameOverState(gameState)) return gameState;
  if (gameState.board?.pendingFriendshipCardSelection) return gameState;
  if (gameState.supernova?.shipBattle) return gameState;
  const endingPlayer = gameState.players?.[gameState.currentPlayerIndex];
  const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.playerCount;
  const nextTurnNumber = nextPlayerIndex === 0 ? gameState.turnNumber + 1 : gameState.turnNumber;
  const endingPlayerShipIds = new Set(normalizeShips(gameState.board?.ships)
    .filter((ship) => ship.ownerPlayerId === endingPlayer?.id)
    .map((ship) => ship.id));
  const supernova = isSupernovaGame(gameState)
    ? {
      ...gameState.supernova,
      blockedShipIds: (gameState.supernova?.blockedShipIds ?? [])
        .filter((shipId) => !endingPlayerShipIds.has(shipId))
    }
    : null;

  return updateGameState(gameState, {
    currentPlayerIndex: nextPlayerIndex,
    turnNumber: nextTurnNumber,
    phase: "production",
    lastRoll: null,
    flightRoll: null,
    flightSpeedBase: null,
    flightSpeedTotal: null,
    encounterTriggered: false,
    activeEncounter: null,
    encounterStep: null,
    remainingMovementByShipId: {},
    hasRolledFlightSpeed: false,
    hasDrawnSupplyThisTurn: false,
    supplyDrawTurnKey: null,
    pendingFriendshipAction: null,
    friendshipTurnState: createFriendshipTurnState(`${nextTurnNumber}:${gameState.players[nextPlayerIndex]?.id ?? "unknown"}`),
    activeTradeOffer: null,
    sevenResolution: null,
    supernova,
    board: {
      ...gameState.board,
      selectedElement: null,
      pendingFriendshipCardSelection: null,
      pendingTradeStationPlacement: null,
      pendingShipPlacement: null,
      pendingSpaceportUpgrade: null
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
    boardLayout,
    gameVariant: normalizeGameVariant(gameState.gameVariant),
    supernovaMissionCount: gameState.supernova?.missionCount
  });

  const normalizedPlayerCount = [2, 3, 4].includes(gameState.playerCount)
    ? gameState.playerCount
    : fallback.playerCount;
  const normalizedGameVariant = normalizeGameVariant(gameState.gameVariant);
  const normalizedPhase = normalizePhase(gameState.phase);
  const fallbackPlayers = createPlayers(normalizedPlayerCount, gameState.language || language);
  const normalizedStructures = normalizeStructures(gameState.board?.structures, normalizedPlayerCount, boardLayout, {
    useFallback: normalizedPhase !== "placement"
  });
  const normalizedShips = sanitizeShips(normalizeShips(gameState.board?.ships), boardLayout, normalizedStructures);
  const normalizedPlacement = normalizeBoardPlacement(gameState.board, boardLayout);
  const normalizedExploredSystems = normalizeExploredSystems(gameState.board?.exploredSystems, boardLayout, normalizedPlacement.placedSystems);
  const hasStoredQuadrants = Array.isArray(gameState.board?.placedQuadrants);
  const normalizedExploredOutposts = hasStoredQuadrants
    ? normalizeExploredOutposts(gameState.board?.exploredOutposts, normalizedPlacement.placedOutposts)
    : normalizedPlacement.placedOutposts.map((outpost) => outpost.id);
  const normalizedExploredEmptySlots = hasStoredQuadrants
    ? normalizeExploredEmptySlots(gameState.board?.exploredEmptySlots, normalizedPlacement.emptySlots)
    : normalizeExploredEmptySlots(gameState.board?.emptySlots, normalizedPlacement.emptySlots);
  const normalizedNumberTokens = revealSystemsById(
    normalizeNumberTokenState(gameState.board?.numberTokens, boardLayout, normalizedPlacement),
    boardLayout,
    normalizedPlacement,
    normalizedExploredSystems
  );
  const normalizedPlayers = fallbackPlayers.map((fallbackPlayer, index) => (
    Array.isArray(gameState.players) && gameState.players[index]
      ? normalizePlayer(gameState.players[index], index, gameState.language || language)
      : fallbackPlayer
  )).map((player) => ({
    ...player,
    structures: normalizedStructures.filter((structure) => structure.ownerPlayerId === player.id),
    ships: normalizedShips.filter((ship) => ship.ownerPlayerId === player.id)
  })).map((player) => hydrateLegacySpecialMedals(player, normalizedStructures));
  const normalizedCurrentPlayerIndex = Number.isInteger(gameState.currentPlayerIndex)
    ? Math.min(Math.max(gameState.currentPlayerIndex, 0), normalizedPlayerCount - 1)
    : 0;
  const normalizedState = {
    ...fallback,
    ...gameState,
    language: gameState.language || language,
    playerCount: normalizedPlayerCount,
    gameVariant: normalizedGameVariant,
    players: normalizedPlayers,
    currentPlayerIndex: normalizedCurrentPlayerIndex,
    turnNumber: Number.isInteger(gameState.turnNumber) ? gameState.turnNumber : 1,
    phase: normalizedPhase,
    gameOver: normalizedPhase === "gameOver" || Boolean(gameState.gameOver),
    winnerPlayerId: typeof gameState.winnerPlayerId === "string" ? gameState.winnerPlayerId : null,
    lastRoll: normalizeRoll(gameState.lastRoll),
    flightRoll: normalizedPhase === "flight" ? normalizeFlightRoll(gameState.flightRoll) : null,
    flightSpeedBase: normalizedPhase === "flight" && Number.isInteger(gameState.flightSpeedBase) ? gameState.flightSpeedBase : null,
    flightSpeedTotal: normalizedPhase === "flight" && Number.isInteger(gameState.flightSpeedTotal) ? gameState.flightSpeedTotal : null,
    encounterTriggered: normalizedPhase === "flight" && Boolean(gameState.encounterTriggered),
    pendingFlightEncounter: normalizedPhase === "flight" ? normalizePendingFlightEncounter(gameState.pendingFlightEncounter) : null,
    encounterDeck: normalizeEncounterDeck(gameState.encounterDeck, { allowEmpty: true }),
    encounterDiscard: normalizeEncounterDeck(gameState.encounterDiscard, { allowEmpty: true }),
    activeEncounter: normalizedPhase === "flight" ? normalizeActiveEncounter(gameState.activeEncounter) : null,
    encounterStep: normalizedPhase === "flight" && typeof gameState.encounterStep === "string" ? gameState.encounterStep : null,
    pendingGiftedTradeShips: normalizePendingGiftedTradeShips(gameState.pendingGiftedTradeShips, normalizedPlayers),
    remainingMovementByShipId: normalizedPhase === "flight" ? normalizeRemainingMovement(gameState.remainingMovementByShipId) : {},
    hasRolledFlightSpeed: normalizedPhase === "flight" && Boolean(gameState.hasRolledFlightSpeed),
    supplyDeck: normalizeSupplyDeck(gameState.supplyDeck),
    supplyDiscard: Array.isArray(gameState.supplyDiscard) ? gameState.supplyDiscard.filter((resource) => supplyResourceTypes.includes(resource)) : [],
    hasDrawnSupplyThisTurn: Boolean(gameState.hasDrawnSupplyThisTurn),
    supplyDrawTurnKey: typeof gameState.supplyDrawTurnKey === "string" ? gameState.supplyDrawTurnKey : null,
    pendingFriendshipAction: normalizePendingFriendshipAction(gameState.pendingFriendshipAction, normalizedPlayers),
    startingSetupGranted: typeof gameState.startingSetupGranted === "boolean"
      ? gameState.startingSetupGranted
      : normalizedPhase !== "placement",
    friendshipTurnState: normalizeFriendshipTurnState(gameState.friendshipTurnState, gameState),
    activeTradeOffer: normalizeActiveTradeOffer(gameState.activeTradeOffer, normalizedPlayers),
    sevenResolution: normalizeSevenResolution(gameState.sevenResolution, normalizedPlayers),
    placement: normalizePlacementState(gameState.placement, normalizedPlayerCount),
    supernova: normalizedGameVariant === gameVariants.supernova
      ? normalizeSupernovaState(gameState.supernova, normalizedPlayers, normalizedShips)
      : null,
    board: {
      ...fallback.board,
      ...(gameState.board || {}),
      layoutVersion: gameState.board?.layoutVersion || boardLayout.layoutVersion,
      placedSystems: normalizedPlacement.placedSystems,
      placedOutposts: normalizedPlacement.placedOutposts,
      emptySlots: normalizedPlacement.emptySlots,
      placedQuadrants: updatePlacedQuadrantDiscovery(normalizedPlacement.placedQuadrants, {
        exploredSystems: normalizedExploredSystems,
        exploredOutposts: normalizedExploredOutposts,
        exploredEmptySlots: normalizedExploredEmptySlots
      }),
      unusedQuadrant: normalizedPlacement.unusedQuadrant,
      exploredSystems: normalizedExploredSystems,
      exploredOutposts: normalizedExploredOutposts,
      exploredEmptySlots: normalizedExploredEmptySlots,
      numberTokens: normalizedNumberTokens,
      pendingFriendshipCardSelection: normalizePendingFriendshipCardSelection(gameState.board?.pendingFriendshipCardSelection, normalizedPlayers),
      pendingTradeStationPlacement: normalizePendingTradeStationPlacement(gameState.board?.pendingTradeStationPlacement, normalizedPlayers),
      pendingShipPlacement: normalizePendingShipPlacement(gameState.board?.pendingShipPlacement, normalizedPlayers),
      pendingSpaceportUpgrade: normalizePendingSpaceportUpgrade(gameState.board?.pendingSpaceportUpgrade, normalizedPlayers),
      structures: normalizedStructures,
      colonies: normalizedStructures.filter((structure) => structure.type === "colony"),
      stations: normalizedStructures.filter((structure) => structure.type === "tradeStation"),
      ships: normalizedShips
    },
    log: normalizeLog(gameState.log, fallback.log)
  };

  return finalizeDerivedState(normalizedState);
}

export function touchGameState(gameState) {
  return {
    ...gameState,
    updatedAt: new Date().toISOString()
  };
}

function createPlayers(playerCount, language, playerSetup = []) {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: normalizePlayerSetupName(playerSetup[index]?.name, index, language),
    color: normalizePlayerSetupColor(playerSetup[index]?.color, index),
    victoryPoints: 0,
    resources: createEmptyResources(),
    upgrades: createDefaultUpgrades(),
    halfMedals: 0,
    specialMedals: [],
    friendshipCards: [],
    friendshipMarkers: [],
    stock: createPlayerInventory(),
    ships: [],
    structures: [],
    stations: []
  }));
}

function normalizePlayerSetupName(name, index, language) {
  const fallback = language === "en" ? `Player ${index + 1}` : `Spieler ${index + 1}`;
  const trimmedName = String(name ?? "").trim();
  return trimmedName || fallback;
}

function normalizePlayerSetupColor(color, index) {
  return playerColorKeys.includes(color) ? color : playerColorKeys[index] ?? playerColorKeys[0];
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

function createFriendshipTurnState(turnKey) {
  return {
    turnKey,
    usedActionKeys: []
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
    color: normalizePlayerSetupColor(player.color, index),
    victoryPoints: Number.isInteger(player.victoryPoints) ? player.victoryPoints : 0,
    resources: normalizeResources(player.resources),
    upgrades: normalizeUpgrades(player.upgrades),
    halfMedals: Number.isInteger(player.halfMedals) ? player.halfMedals : 0,
    specialMedals: normalizeSpecialMedals(player.specialMedals),
    friendshipCards: normalizeFriendshipCards(player.friendshipCards),
    friendshipMarkers: normalizeFriendshipMarkers(player.friendshipMarkers),
    stock: createPlayerInventory(),
    ships: Array.isArray(player.ships) ? player.ships : [],
    structures: Array.isArray(player.structures) ? player.structures : [],
    stations: Array.isArray(player.stations) ? player.stations : []
  };
}

function createPlayerInventory() {
  return {
    colony: { inUse: 0, available: playerFigureLimits.colony, limit: playerFigureLimits.colony },
    tradeStation: { inUse: 0, available: playerFigureLimits.tradeStation, limit: playerFigureLimits.tradeStation },
    transporter: { inUse: 0, available: playerFigureLimits.transporter, limit: playerFigureLimits.transporter },
    spaceport: { inUse: 0, available: playerFigureLimits.spaceport, limit: playerFigureLimits.spaceport },
    battleShip: { inUse: 0, available: playerFigureLimits.battleShip, limit: playerFigureLimits.battleShip }
  };
}

function normalizeGameVariant(gameVariant) {
  return gameVariant === gameVariants.supernova ? gameVariants.supernova : gameVariants.classic;
}

export function isSupernovaGame(gameState) {
  return normalizeGameVariant(gameState?.gameVariant) === gameVariants.supernova;
}

function createInitialSupernovaState(players, missionCount = supernovaMissionCounts.standard) {
  const normalizedMissionCount = normalizeSupernovaMissionCount(missionCount);
  return {
    missionCount: normalizedMissionCount,
    missionsByPlayerId: Object.fromEntries(players.map((player, index) => [
      player.id,
      drawInitialSupernovaMissions(index, normalizedMissionCount).map((mission) => mission.id)
    ])),
    factories: [],
    factoryMajorityCards: Object.fromEntries(supernovaFactoryVictoryCards.map((card) => [card.id, null])),
    pendingFactoryPlacement: null,
    blockedShipIds: [],
    shipBattle: null
  };
}

function drawInitialSupernovaMissions(playerIndex = 0, missionCount = supernovaMissionCounts.standard) {
  const normalizedMissionCount = normalizeSupernovaMissionCount(missionCount);
  const shuffled = shuffle(supernovaMissionCards);
  const selected = [];
  const usedCategories = new Set();

  for (const mission of shuffled.slice(playerIndex).concat(shuffled.slice(0, playerIndex))) {
    if (usedCategories.has(mission.category)) continue;
    selected.push(mission);
    usedCategories.add(mission.category);
    if (selected.length === normalizedMissionCount) return selected;
  }

  for (const mission of shuffled) {
    if (selected.some((candidate) => candidate.id === mission.id)) continue;
    selected.push(mission);
    if (selected.length === normalizedMissionCount) break;
  }

  return selected;
}

function normalizeSupernovaState(supernova, players = [], ships = []) {
  const missionCount = normalizeSupernovaMissionCount(supernova?.missionCount);
  const fallback = createInitialSupernovaState(players, missionCount);
  if (!supernova || typeof supernova !== "object") return fallback;
  const playerIds = new Set(players.map((player) => player.id));
  const validMissionIds = new Set(supernovaMissionCards.map((mission) => mission.id));
  const validFactoryTypes = new Set(supernovaFactoryTypes.map((factoryType) => factoryType.id));
  const validFactoryCardIds = new Set(supernovaFactoryVictoryCards.map((card) => card.id));
  const normalizeMissionMap = (map, fallbackMap) => Object.fromEntries(players.map((player) => [
    player.id,
    Array.isArray(map?.[player.id])
      ? map[player.id].filter((missionId) => validMissionIds.has(missionId))
      : fallbackMap[player.id]
  ]));

  return {
    missionCount,
    missionsByPlayerId: normalizeMissionMap(supernova.missionsByPlayerId, fallback.missionsByPlayerId),
    factories: Array.isArray(supernova.factories)
      ? supernova.factories
        .filter((factory) => factory && validFactoryTypes.has(factory.type) && playerIds.has(factory.ownerPlayerId) && typeof factory.planetId === "string")
        .map((factory, index) => ({
          id: typeof factory.id === "string" ? factory.id : `factory-${index + 1}`,
          ownerPlayerId: factory.ownerPlayerId,
          type: factory.type,
          resource: getSupernovaFactoryType(factory.type)?.resource ?? factory.resource,
          planetId: factory.planetId,
          systemId: typeof factory.systemId === "string" ? factory.systemId : null
        }))
      : [],
    factoryMajorityCards: Object.fromEntries(supernovaFactoryVictoryCards.map((card) => {
      const ownerPlayerId = supernova.factoryMajorityCards?.[card.id];
      return [card.id, playerIds.has(ownerPlayerId) ? ownerPlayerId : null];
    })),
    pendingFactoryPlacement: normalizePendingFactoryPlacement(supernova.pendingFactoryPlacement, playerIds, validFactoryTypes),
    blockedShipIds: Array.isArray(supernova.blockedShipIds)
      ? supernova.blockedShipIds.filter((shipId) => typeof shipId === "string")
      : [],
    shipBattle: normalizeSupernovaShipBattle(supernova.shipBattle, players, ships)
  };
}

function normalizeSupernovaMissionCount(missionCount) {
  return missionCount === supernovaMissionCounts.professional
    ? supernovaMissionCounts.professional
    : supernovaMissionCounts.standard;
}

function normalizeSupernovaShipBattle(shipBattle, players = [], ships = []) {
  if (!shipBattle || typeof shipBattle !== "object") return null;
  const playerIds = new Set(players.map((player) => player.id));
  const shipIds = new Set(normalizeShips(ships).map((ship) => ship.id));
  if (
    !playerIds.has(shipBattle.attackerPlayerId) ||
    !playerIds.has(shipBattle.defenderPlayerId) ||
    !shipIds.has(shipBattle.attackerShipId) ||
    !shipIds.has(shipBattle.defenderShipId)
  ) return null;

  const stage = ["rolling", "reveal", "upgradeLoss"].includes(shipBattle.stage)
    ? shipBattle.stage
    : "rolling";
  const attackerRoll = normalizeEncounterRollResult(shipBattle.attackerRoll);
  const defenderRoll = normalizeEncounterRollResult(shipBattle.defenderRoll);
  return {
    id: typeof shipBattle.id === "string" ? shipBattle.id : createId("supernova-ship-battle"),
    stage,
    round: Number.isInteger(shipBattle.round) ? Math.max(1, shipBattle.round) : 1,
    attackerPlayerId: shipBattle.attackerPlayerId,
    defenderPlayerId: shipBattle.defenderPlayerId,
    attackerShipId: shipBattle.attackerShipId,
    defenderShipId: shipBattle.defenderShipId,
    defenderShipType: ["colonyShip", "tradeShip", "battleShip"].includes(shipBattle.defenderShipType)
      ? shipBattle.defenderShipType
      : "colonyShip",
    attackerOriginNodeId: typeof shipBattle.attackerOriginNodeId === "string" ? shipBattle.attackerOriginNodeId : null,
    targetNodeId: typeof shipBattle.targetNodeId === "string" ? shipBattle.targetNodeId : null,
    pathCost: Number.isInteger(shipBattle.pathCost) ? Math.max(0, shipBattle.pathCost) : 0,
    attackerRoll,
    defenderRoll,
    attackerStrength: Number.isInteger(shipBattle.attackerStrength) ? shipBattle.attackerStrength : null,
    defenderStrength: Number.isInteger(shipBattle.defenderStrength) ? shipBattle.defenderStrength : null,
    winnerPlayerId: playerIds.has(shipBattle.winnerPlayerId) ? shipBattle.winnerPlayerId : null,
    loserPlayerId: playerIds.has(shipBattle.loserPlayerId) ? shipBattle.loserPlayerId : null,
    pendingUpgradePlayerId: playerIds.has(shipBattle.pendingUpgradePlayerId) ? shipBattle.pendingUpgradePlayerId : null,
    removableUpgradeIds: Array.isArray(shipBattle.removableUpgradeIds)
      ? shipBattle.removableUpgradeIds.filter(isValidUpgradeId)
      : []
  };
}

function normalizePendingFactoryPlacement(pendingFactoryPlacement, playerIds, validFactoryTypes) {
  if (!pendingFactoryPlacement || typeof pendingFactoryPlacement !== "object") return null;
  if (!playerIds.has(pendingFactoryPlacement.ownerPlayerId) || !validFactoryTypes.has(pendingFactoryPlacement.factoryType)) return null;
  return {
    ownerPlayerId: pendingFactoryPlacement.ownerPlayerId,
    factoryType: pendingFactoryPlacement.factoryType
  };
}

function recalculateSupernovaState(gameState) {
  if (!isSupernovaGame(gameState)) return null;
  const supernova = normalizeSupernovaState(gameState.supernova, gameState.players ?? [], gameState.board?.ships ?? []);
  return {
    ...supernova,
    factoryMajorityCards: calculateFactoryMajorityCards(supernova.factories, gameState.players ?? [])
  };
}

function calculateFactoryMajorityCards(factories, players) {
  return Object.fromEntries(supernovaFactoryVictoryCards.map((card) => {
    const counts = players.map((player) => ({
      playerId: player.id,
      count: factories.filter((factory) => factory.ownerPlayerId === player.id && factory.type === card.type).length
    }));
    const max = Math.max(0, ...counts.map((entry) => entry.count));
    const leaders = counts.filter((entry) => entry.count === max && entry.count > 0);
    return [card.id, leaders.length === 1 ? leaders[0].playerId : null];
  }));
}

function countSupernovaFactoryVictoryPoints(gameState, playerId) {
  const cardIds = Object.entries(gameState.supernova?.factoryMajorityCards ?? {})
    .filter(([, ownerPlayerId]) => ownerPlayerId === playerId)
    .map(([cardId]) => cardId);
  return cardIds.reduce((sum, cardId) => sum + (getSupernovaFactoryVictoryCard(cardId)?.victoryPoints ?? 0), 0);
}

export function getSupernovaMissionsForPlayer(gameState, playerId) {
  const missionIds = gameState?.supernova?.missionsByPlayerId?.[playerId] ?? [];
  return missionIds
    .map((missionId) => supernovaMissionCards.find((mission) => mission.id === missionId))
    .filter(Boolean)
    .map((mission) => ({
      ...mission,
      fulfilled: isSupernovaMissionAutomaticallyFulfilled(gameState, playerId, mission)
    }));
}

function hasFulfilledSupernovaMission(gameState, playerId) {
  return getSupernovaMissionsForPlayer(gameState, playerId).some((mission) => mission.fulfilled);
}

function isSupernovaMissionAutomaticallyFulfilled(gameState, playerId, mission) {
  const player = getPlayerById(gameState, playerId);
  if (!player || !mission?.conditionKey) return false;
  const conditionParts = mission.conditionKey.split(":");
  const structures = (gameState.board?.structures ?? [])
    .filter((structure) => structure.ownerPlayerId === playerId);
  const ships = normalizeShips(gameState.board?.ships)
    .filter((ship) => ship.ownerPlayerId === playerId);
  const systems = getPlacedPlanetSystems(gameState, defaultBoardLayout);
  const colonies = getSupernovaMissionColonies(structures, systems);

  if (mission.conditionKey === "allCargo") return getRealUpgradeValue(player, "cargo") >= 5;
  if (mission.conditionKey === "allCannons") return getRealUpgradeValue(player, "cannon") >= 6;
  if (mission.conditionKey === "allDrives") return getRealUpgradeValue(player, "drive") >= 6;
  if (mission.conditionKey === "halfMedals:7") return (player.halfMedals ?? 0) >= 7;
  if (mission.conditionKey === "spaceports:3") {
    return structures.filter((structure) => structure.type === "spaceport").length >= 3;
  }
  if (mission.conditionKey === "factories:3") {
    return (gameState.supernova?.factories ?? [])
      .filter((factory) => factory.ownerPlayerId === playerId)
      .length >= 3;
  }
  if (mission.conditionKey === "battleShips:3") {
    return ships.filter((ship) => ship.type === "battleShip").length >= 3;
  }
  if (mission.conditionKey.startsWith("factoryCard:")) {
    const type = conditionParts[1];
    const card = supernovaFactoryVictoryCards.find((candidate) => candidate.type === type);
    return Boolean(card && gameState.supernova?.factoryMajorityCards?.[card.id] === playerId);
  }
  if (conditionParts[0] === "coloniesOnResource") {
    return countSupernovaMissionColoniesOnResource(colonies, systems, conditionParts[1]) >= Number(conditionParts[2] ?? 0);
  }
  if (mission.conditionKey === "farSystemsColony") {
    const farthestSystems = getFarthestSupernovaMissionSystems(systems, defaultBoardLayout);
    return farthestSystems.length > 0 && farthestSystems.every((system) => (
      colonies.some((colony) => colony.systemId === system.id)
    ));
  }
  if (mission.conditionKey === "fullNonStartSystem") {
    return systems.some((system) => isSupernovaMissionSystemFullyColonized(system, colonies));
  }
  if (mission.conditionKey === "oneColonyPerNonStartSystem") {
    return systems.every((system) => colonies.filter((colony) => colony.systemId === system.id).length <= 1);
  }
  if (mission.conditionKey === "twoShipsInFlightAtWin") {
    return player.victoryPoints >= 15 && ships
      .filter((ship) => ["colonyShip", "tradeShip"].includes(ship.type) && ship.status === "active")
      .length >= 2;
  }
  if (mission.conditionKey === "conquestVp:2") {
    return normalizeSpecialMedals(player.specialMedals)
      .filter(isPlanetConquestMedalId)
      .length >= 2;
  }
  if (mission.conditionKey === "tradeStationsAtPeople:3") {
    return countSupernovaMissionTradeStationPeoples(structures, gameState) >= 3;
  }
  if (mission.conditionKey === "tradeStationsAndAdjacentColony") {
    return countSupernovaMissionTradeAndProductionPeoples(structures, colonies, systems, gameState) >= 2;
  }
  if (mission.conditionKey === "tradeShipsAtPeople:3") {
    const stationsByOutpostId = new Map();
    for (const station of structures.filter((structure) => structure.type === "tradeStation" && structure.outpostId)) {
      stationsByOutpostId.set(station.outpostId, (stationsByOutpostId.get(station.outpostId) ?? 0) + 1);
    }
    return [...stationsByOutpostId.values()].some((stationCount) => stationCount >= 3);
  }
  return false;
}

function getSupernovaMissionColonies(structures, systems) {
  return structures
    .filter((structure) => structure.type === "colony")
    .map((structure) => {
      const system = systems.find((candidate) => (
        candidate.id === structure.systemId ||
        (candidate.colonySites ?? []).some((site) => site.nodeId === structure.locationId)
      ));
      const site = system?.colonySites?.find((candidate) => candidate.nodeId === structure.locationId);
      return {
        id: structure.id,
        locationId: structure.locationId,
        systemId: system?.id ?? structure.systemId ?? null,
        adjacentPlanetIds: structure.adjacentPlanetIds?.length > 0
          ? structure.adjacentPlanetIds
          : (site?.adjacentPlanetIds ?? [])
      };
    })
    .filter((colony) => colony.systemId);
}

function countSupernovaMissionColoniesOnResource(colonies, systems, resource) {
  const planetResources = new Map(systems
    .flatMap((system) => (system.planets ?? []).map((planet) => [planet.id, planet.resource])));
  return colonies.filter((colony) => (
    colony.adjacentPlanetIds.some((planetId) => planetResources.get(planetId) === resource)
  )).length;
}

function getFarthestSupernovaMissionSystems(systems, boardLayout) {
  const laneHeight = boardLayout.height / 3;
  const farthestByLane = new Map();
  for (const system of systems) {
    const laneIndex = Math.min(2, Math.max(0, Math.floor((system.y ?? 0) / laneHeight)));
    const current = farthestByLane.get(laneIndex);
    if (!current || (system.x ?? 0) > (current.x ?? 0)) farthestByLane.set(laneIndex, system);
  }
  return [...farthestByLane.values()];
}

function isSupernovaMissionSystemFullyColonized(system, colonies) {
  if ((system.planets ?? []).length !== 3) return false;
  const ownLocations = new Set(colonies
    .filter((colony) => colony.systemId === system.id)
    .map((colony) => colony.locationId));
  const colonySites = system.colonySites ?? [];
  return colonySites.length === 3 && colonySites.every((site) => ownLocations.has(site.nodeId));
}

function isPlanetConquestMedalId(medalId) {
  return /(^|[:_-])(pirate|ice|diplomacy)([:_-]|$)/i.test(medalId);
}

function countSupernovaMissionTradeStationPeoples(structures, gameState) {
  const outpostById = new Map(getPlacedOutposts(gameState, defaultBoardLayout)
    .map((outpost) => [outpost.id, outpost]));
  return new Set(structures
    .filter((structure) => structure.type === "tradeStation")
    .map((station) => outpostById.get(station.outpostId)?.outpostType)
    .filter(Boolean)).size;
}

function countSupernovaMissionTradeAndProductionPeoples(structures, colonies, systems, gameState) {
  const outposts = getPlacedOutposts(gameState, defaultBoardLayout);
  const stationOutpostIds = new Set(structures
    .filter((structure) => structure.type === "tradeStation" && structure.outpostId)
    .map((structure) => structure.outpostId));
  const colonizedSystemIds = new Set(colonies.map((colony) => colony.systemId));
  const completedPeople = new Set();

  for (const outpost of outposts.filter((candidate) => stationOutpostIds.has(candidate.id))) {
    const adjacentSystemIds = getClosestSupernovaMissionSystemIds(outpost, systems);
    if (adjacentSystemIds.some((systemId) => colonizedSystemIds.has(systemId))) {
      completedPeople.add(outpost.outpostType);
    }
  }
  return completedPeople.size;
}

function getClosestSupernovaMissionSystemIds(outpost, systems) {
  const explicitIds = Array.isArray(outpost.adjacentSystemIds)
    ? outpost.adjacentSystemIds
    : (outpost.adjacentSystemId ? [outpost.adjacentSystemId] : []);
  if (explicitIds.length > 0) return explicitIds;
  const distances = systems.map((system) => ({
    id: system.id,
    distance: Math.hypot((system.x ?? 0) - (outpost.x ?? 0), (system.y ?? 0) - (outpost.y ?? 0))
  }));
  const closestDistance = Math.min(...distances.map((entry) => entry.distance));
  return distances
    .filter((entry) => Math.abs(entry.distance - closestDistance) < 0.01)
    .map((entry) => entry.id);
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

function drawSupplyCards(supplyDeck, count) {
  const drawnCards = [];
  let nextSupplyDeck = normalizeSupplyDeck(supplyDeck);

  while (drawnCards.length < count) {
    if (nextSupplyDeck.length === 0) nextSupplyDeck = createSupplyDeck();
    drawnCards.push(nextSupplyDeck[0]);
    nextSupplyDeck = nextSupplyDeck.slice(1);
  }

  return {
    drawnCards,
    supplyDeck: nextSupplyDeck
  };
}

function createEncounterDeck() {
  return shuffle(getEncounterDeckIds());
}

function normalizeSupplyDeck(supplyDeck) {
  const normalizedDeck = Array.isArray(supplyDeck)
    ? supplyDeck.filter((resource) => supplyResourceTypes.includes(resource))
    : [];

  return normalizedDeck.length > 0 ? normalizedDeck : createSupplyDeck();
}

function normalizeEncounterDeck(encounterDeck, options = {}) {
  const allowEmpty = options.allowEmpty ?? false;
  const validIds = new Set(getEncounterDeckIds());
  const normalizedDeck = Array.isArray(encounterDeck)
    ? encounterDeck.filter((cardId) => validIds.has(cardId))
    : [];

  if (normalizedDeck.length > 0) return normalizedDeck;
  return allowEmpty ? [] : createEncounterDeck();
}

export function getSupplyDrawCount(gameState, player = null) {
  const effectivePlayer = player ?? gameState?.players?.[gameState?.currentPlayerIndex ?? 0];
  if (isSupernovaGame(gameState)) {
    const victoryPoints = effectivePlayer?.victoryPoints ?? 0;
    if (victoryPoints >= 3 && victoryPoints <= 5) return 3;
    if (victoryPoints >= 6 && victoryPoints <= 8) return 2;
    if (victoryPoints >= 9 && victoryPoints <= 11) return 1;
    return 0;
  }
  const victoryPoints = effectivePlayer?.victoryPoints ?? 0;
  if (victoryPoints >= 4 && victoryPoints <= 7) return 2;
  if (victoryPoints >= 8 && victoryPoints <= 9) return 1;
  return 0;
}

function createFlightRoll(forcedRoll = null) {
  const balls = Array.isArray(forcedRoll?.balls) && forcedRoll.balls.length === 2
    ? forcedRoll.balls
    : shuffle(mothershipBallPool).slice(0, 2);
  const encounterTriggered = balls.includes("black");
  const baseSpeed = encounterTriggered
    ? 3
    : balls.reduce((sum, ball) => sum + (mothershipBallValues[ball] ?? 0), 0);

  return {
    balls,
    baseSpeed,
    encounterTriggered
  };
}

function normalizeFlightRoll(flightRoll) {
  if (!flightRoll || !Array.isArray(flightRoll.balls) || flightRoll.balls.length !== 2) return null;

  return {
    balls: flightRoll.balls.filter((ball) => Object.hasOwn(mothershipBallValues, ball)).slice(0, 2),
    baseSpeed: Number.isInteger(flightRoll.baseSpeed) ? flightRoll.baseSpeed : 3,
    encounterTriggered: Boolean(flightRoll.encounterTriggered)
  };
}

function normalizePendingFlightEncounter(pendingFlightEncounter) {
  if (!pendingFlightEncounter || typeof pendingFlightEncounter !== "object") return null;
  return {
    forcedEncounterCardId: typeof pendingFlightEncounter.forcedEncounterCardId === "string"
      ? pendingFlightEncounter.forcedEncounterCardId
      : null
  };
}

function normalizeActiveEncounter(activeEncounter) {
  if (!activeEncounter || typeof activeEncounter !== "object") return null;
  const card = getEncounterCardById(activeEncounter.cardId);
  if (!card) return null;

  return {
    cardId: activeEncounter.cardId,
    status: ["pending", "resolved"].includes(activeEncounter.status) ? activeEncounter.status : "pending",
    choiceId: typeof activeEncounter.choiceId === "string" ? activeEncounter.choiceId : null,
    chosenResource: supplyResourceTypes.includes(activeEncounter.chosenResource) ? activeEncounter.chosenResource : null,
    chosenUpgrade: ["drive", "cargo", "cannon"].includes(activeEncounter.chosenUpgrade) ? activeEncounter.chosenUpgrade : null,
    combat: normalizeEncounterCombat(activeEncounter.combat),
    resultText: normalizeLocalizedText(activeEncounter.resultText),
    pendingStep: normalizePendingEncounterStep(activeEncounter.pendingStep)
  };
}

function normalizePendingGiftedTradeShips(pendingGiftedTradeShips, players = []) {
  const validPlayerIds = new Set(players.map((player) => player.id));
  if (!Array.isArray(pendingGiftedTradeShips)) return [];

  return pendingGiftedTradeShips
    .filter((entry) => entry && typeof entry === "object")
    .map((entry, index) => ({
      id: typeof entry.id === "string" ? entry.id : `pending-gifted-trade-ship-${index + 1}`,
      ownerPlayerId: typeof entry.ownerPlayerId === "string" ? entry.ownerPlayerId : null,
      shipType: entry.shipType === "colonyShip" ? "colonyShip" : "tradeShip"
    }))
    .filter((entry) => validPlayerIds.size === 0 || validPlayerIds.has(entry.ownerPlayerId));
}

function normalizeEncounterCombat(combat) {
  if (!combat || typeof combat !== "object") return null;
  return {
    enemyStrength: Number.isInteger(combat.enemyStrength) ? combat.enemyStrength : 0,
    rollTotal: Number.isInteger(combat.rollTotal) ? combat.rollTotal : 0,
    strength: Number.isInteger(combat.strength) ? combat.strength : 0,
    balls: Array.isArray(combat.balls) ? combat.balls.filter((ball) => Object.hasOwn(mothershipBallValues, ball)).slice(0, 2) : [],
    opponentRollTotal: Number.isInteger(combat.opponentRollTotal) ? combat.opponentRollTotal : null,
    opponentBalls: Array.isArray(combat.opponentBalls) ? combat.opponentBalls.filter((ball) => Object.hasOwn(mothershipBallValues, ball)).slice(0, 2) : [],
    enemyPlayerId: typeof combat.enemyPlayerId === "string" ? combat.enemyPlayerId : null,
    enemyName: typeof combat.enemyName === "string" ? combat.enemyName : null,
    outcome: ["win", "lose"].includes(combat.outcome) ? combat.outcome : "lose"
  };
}

function normalizeEncounterRollResult(roll) {
  if (!roll || typeof roll !== "object") return null;
  const balls = Array.isArray(roll.balls)
    ? roll.balls.filter((ball) => Object.hasOwn(mothershipBallValues, ball)).slice(0, 2)
    : [];
  if (balls.length !== 2 || !Number.isInteger(roll.total)) return null;
  return {
    balls,
    total: roll.total
  };
}

function normalizeDriveComparisonPlayer(entry) {
  if (!entry || typeof entry !== "object") return null;
  const physicalDrives = Number.isInteger(entry.physicalDrives) ? Math.max(0, entry.physicalDrives) : 0;
  const friendshipBonus = Number.isInteger(entry.friendshipBonus) ? Math.max(0, entry.friendshipBonus) : 0;
  const effectiveDrives = Number.isInteger(entry.effectiveDrives)
    ? Math.max(0, entry.effectiveDrives)
    : physicalDrives + friendshipBonus;
  return {
    playerId: typeof entry.playerId === "string" ? entry.playerId : null,
    playerName: typeof entry.playerName === "string" ? entry.playerName : "",
    physicalDrives,
    friendshipBonus,
    effectiveDrives
  };
}

function normalizeLocalizedText(text) {
  if (!text || typeof text !== "object") return null;
  return {
    de: typeof text.de === "string" ? text.de : "",
    en: typeof text.en === "string" ? text.en : ""
  };
}

function normalizePendingEncounterStep(pendingStep) {
  if (!pendingStep || typeof pendingStep !== "object") return null;

  if (pendingStep.type === "message") {
    return {
      type: "message",
      titleText: normalizeLocalizedText(pendingStep.titleText),
      bodyText: normalizeLocalizedText(pendingStep.bodyText),
      detailText: normalizeLocalizedText(pendingStep.detailText),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "singleMothershipRoll") {
    return {
      type: "singleMothershipRoll",
      activePlayerId: typeof pendingStep.activePlayerId === "string" ? pendingStep.activePlayerId : null,
      roll: normalizeEncounterRollResult(pendingStep.roll),
      effect: pendingStep.effect && typeof pendingStep.effect === "object" ? pendingStep.effect : null,
      contextPayload: normalizeEncounterPendingContext(pendingStep.contextPayload),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "dualMothershipRoll") {
    return {
      type: "dualMothershipRoll",
      mode: pendingStep.mode === "speed" ? "speed" : "combat",
      activePlayerId: typeof pendingStep.activePlayerId === "string" ? pendingStep.activePlayerId : null,
      targetPlayerId: typeof pendingStep.targetPlayerId === "string" ? pendingStep.targetPlayerId : null,
      activeRoll: normalizeEncounterRollResult(pendingStep.activeRoll),
      targetRoll: normalizeEncounterRollResult(pendingStep.targetRoll),
      effect: pendingStep.effect && typeof pendingStep.effect === "object" ? pendingStep.effect : null,
      contextPayload: normalizeEncounterPendingContext(pendingStep.contextPayload),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "driveComparisonPreview") {
    return {
      type: "driveComparisonPreview",
      activePlayerId: typeof pendingStep.activePlayerId === "string" ? pendingStep.activePlayerId : null,
      targetPlayerId: typeof pendingStep.targetPlayerId === "string" ? pendingStep.targetPlayerId : null,
      active: normalizeDriveComparisonPlayer(pendingStep.active),
      target: normalizeDriveComparisonPlayer(pendingStep.target),
      outcome: ["more", "equal", "less"].includes(pendingStep.outcome) ? pendingStep.outcome : "less",
      success: Boolean(pendingStep.success),
      effect: pendingStep.effect && typeof pendingStep.effect === "object" ? pendingStep.effect : null,
      contextPayload: normalizeEncounterPendingContext(pendingStep.contextPayload),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "choiceSelection") {
    return {
      type: "choiceSelection",
      promptText: normalizeLocalizedText(pendingStep.promptText),
      choices: normalizeEncounterPendingChoices(pendingStep.choices),
      contextPayload: normalizeEncounterPendingContext(pendingStep.contextPayload),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "resourceSelection") {
    return {
      type: "resourceSelection",
      mode: pendingStep.mode === "loss" ? "loss" : "gain",
      amount: Number.isInteger(pendingStep.amount) ? Math.max(0, pendingStep.amount) : 1,
      selectedResources: normalizeResources(pendingStep.selectedResources),
      deferredResultText: normalizeLocalizedText(pendingStep.deferredResultText),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "upgradeSelection") {
    return {
      type: "upgradeSelection",
      mode: pendingStep.mode === "loss" ? "loss" : "gain",
      amount: Number.isInteger(pendingStep.amount) ? Math.max(0, pendingStep.amount) : 1,
      selectedUpgrade: isValidUpgradeId(pendingStep.selectedUpgrade) ? pendingStep.selectedUpgrade : null,
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "boardTargetSelection") {
    return {
      type: "boardTargetSelection",
      shipId: typeof pendingStep.shipId === "string" ? pendingStep.shipId : null,
      validNodeIds: Array.isArray(pendingStep.validNodeIds)
        ? pendingStep.validNodeIds.filter((nodeId) => typeof nodeId === "string")
        : [],
      hint: normalizeLocalizedText(pendingStep.hint),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "shipJumpSelection") {
    return {
      type: "shipJumpSelection",
      shipIds: Array.isArray(pendingStep.shipIds)
        ? pendingStep.shipIds.filter((shipId) => typeof shipId === "string")
        : [],
      hint: normalizeLocalizedText(pendingStep.hint),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "shipBlockSelection") {
    return {
      type: "shipBlockSelection",
      shipIds: Array.isArray(pendingStep.shipIds)
        ? pendingStep.shipIds.filter((shipId) => typeof shipId === "string")
        : [],
      hint: normalizeLocalizedText(pendingStep.hint),
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "opponentResourceGiftSelection") {
    return {
      type: "opponentResourceGiftSelection",
      amount: Number.isInteger(pendingStep.amount) ? Math.max(1, pendingStep.amount) : 1,
      receiverPlayerId: typeof pendingStep.receiverPlayerId === "string" ? pendingStep.receiverPlayerId : null,
      currentGiverPlayerId: typeof pendingStep.currentGiverPlayerId === "string" ? pendingStep.currentGiverPlayerId : null,
      giverPlayerIds: Array.isArray(pendingStep.giverPlayerIds)
        ? pendingStep.giverPlayerIds.filter((playerId) => typeof playerId === "string")
        : [],
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  if (pendingStep.type === "globalUpgradeLossSelection") {
    return {
      type: "globalUpgradeLossSelection",
      threshold: Number.isInteger(pendingStep.threshold) ? pendingStep.threshold : 0,
      amount: Number.isInteger(pendingStep.amount) ? Math.max(1, pendingStep.amount) : 1,
      currentTargetPlayerId: typeof pendingStep.currentTargetPlayerId === "string"
        ? pendingStep.currentTargetPlayerId
        : null,
      targetPlayerIds: Array.isArray(pendingStep.targetPlayerIds)
        ? pendingStep.targetPlayerIds.filter((playerId) => typeof playerId === "string")
        : [],
      remainingEffects: Array.isArray(pendingStep.remainingEffects) ? pendingStep.remainingEffects : []
    };
  }

  return null;
}

function normalizeEncounterPendingChoices(choices) {
  return Array.isArray(choices)
    ? choices
      .map((choice) => ({
        id: typeof choice?.id === "string" ? choice.id : "",
        label: normalizeLocalizedText(choice?.label),
        resultText: normalizeLocalizedText(choice?.resultText),
        effects: Array.isArray(choice?.effects) ? choice.effects : []
      }))
      .filter((choice) => choice.id)
    : [];
}

function normalizeEncounterPendingContext(contextPayload) {
  if (!contextPayload || typeof contextPayload !== "object") return {};
  return {
    ...contextPayload,
    lastSelectedResources: normalizeResources(contextPayload.lastSelectedResources),
    lastSelectionMode: typeof contextPayload.lastSelectionMode === "string"
      ? contextPayload.lastSelectionMode
      : null
  };
}

function hasSupplyDrawnThisTurn(gameState) {
  return Boolean(gameState.hasDrawnSupplyThisTurn && gameState.supplyDrawTurnKey === getTurnKey(gameState));
}

function getTurnKey(gameState) {
  return `${gameState.turnNumber}:${gameState.players?.[gameState.currentPlayerIndex]?.id ?? "unknown"}`;
}

function createSevenResolution(gameState) {
  const discardRequirements = Object.fromEntries(gameState.players
    .map((player) => {
      const threshold = getSevenDiscardThresholdForPlayer(gameState, player.id);
      const resourceCount = countResources(player.resources);
      return [player.id, resourceCount > threshold ? Math.floor(resourceCount / 2) : 0];
    })
    .filter(([, count]) => count > 0));

  return {
    active: true,
    step: Object.keys(discardRequirements).length > 0 ? "discard" : "steal",
    discardRequirements,
    discardedPlayerIds: [],
    discardSelections: Object.fromEntries(
      gameState.players.map((player) => [player.id, createEmptyResources()])
    ),
    stealTargetPlayerId: null,
    stealResolved: false,
    supplyDistributed: false
  };
}

function normalizeSevenResolution(sevenResolution, players = []) {
  if (!sevenResolution || typeof sevenResolution !== "object" || !sevenResolution.active) return null;

  const validPlayerIds = new Set(players.map((player) => player.id));
  const discardRequirements = Object.fromEntries(
    Object.entries(sevenResolution.discardRequirements ?? {})
      .filter(([playerId, count]) => validPlayerIds.has(playerId) && Number.isInteger(count) && count > 0)
  );

  return {
    active: true,
    step: ["discard", "steal", "supply"].includes(sevenResolution.step) ? sevenResolution.step : "discard",
    discardRequirements,
    discardedPlayerIds: Array.isArray(sevenResolution.discardedPlayerIds)
      ? sevenResolution.discardedPlayerIds.filter((playerId) => validPlayerIds.has(playerId))
      : [],
    discardSelections: Object.fromEntries(players.map((player) => [
      player.id,
      normalizeResources(sevenResolution.discardSelections?.[player.id])
    ])),
    stealTargetPlayerId: validPlayerIds.has(sevenResolution.stealTargetPlayerId) ? sevenResolution.stealTargetPlayerId : null,
    stealResolved: Boolean(sevenResolution.stealResolved),
    supplyDistributed: Boolean(sevenResolution.supplyDistributed)
  };
}

function advanceSevenResolution(gameState, sevenResolution) {
  if (!sevenResolution?.active) return null;
  if (sevenResolution.step !== "discard") return sevenResolution;

  const remainingDiscardIds = Object.keys(sevenResolution.discardRequirements)
    .filter((playerId) => needsSevenDiscard(sevenResolution, playerId));
  if (remainingDiscardIds.length > 0) return sevenResolution;

  return {
    ...sevenResolution,
    step: "steal"
  };
}

function getRequiredDiscardCount(sevenResolution, playerId) {
  return sevenResolution?.discardRequirements?.[playerId] ?? 0;
}

function needsSevenDiscard(sevenResolution, playerId) {
  return getRequiredDiscardCount(sevenResolution, playerId) > 0
    && !sevenResolution.discardedPlayerIds?.includes(playerId);
}

function getSevenStealCandidates(gameState, sevenResolution) {
  const activePlayerId = gameState.players?.[gameState.currentPlayerIndex]?.id;
  return gameState.players.filter((player) => player.id !== activePlayerId && countResources(player.resources) > 0);
}

function drawRandomResource(resources) {
  const pool = [];
  const normalizedResources = normalizeResources(resources);
  for (const resource of supplyResourceTypes) {
    for (let index = 0; index < (normalizedResources[resource] ?? 0); index += 1) {
      pool.push(resource);
    }
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function startEncounter(gameState, forcedEncounterCardId = null) {
  const { cardId, deck, discard } = drawEncounterCard(gameState.encounterDeck, gameState.encounterDiscard, forcedEncounterCardId);
  if (!cardId) {
    return {
      encounterDeck: gameState.encounterDeck,
      encounterDiscard: gameState.encounterDiscard,
      activeEncounter: null,
      encounterStep: null
    };
  }

  return {
    encounterDeck: deck,
    encounterDiscard: discard,
    activeEncounter: {
      cardId,
      status: "pending",
      choiceId: null,
      chosenResource: null,
      chosenUpgrade: null,
      combat: null,
      resultText: null,
      pendingStep: null
    },
    encounterStep: "choice"
  };
}

function drawEncounterCard(encounterDeck, encounterDiscard, forcedEncounterCardId = null) {
  const validIds = getEncounterDeckIds();
  let deck = normalizeEncounterDeck(encounterDeck, { allowEmpty: true });
  let discard = Array.isArray(encounterDiscard) ? [...encounterDiscard] : [];

  if (forcedEncounterCardId && getEncounterCardById(forcedEncounterCardId)?.implemented) {
    deck = deck.filter((cardId) => cardId !== forcedEncounterCardId);
    discard = discard.filter((cardId) => cardId !== forcedEncounterCardId);
    return { cardId: forcedEncounterCardId, deck, discard };
  }

  if (deck.length === 0) {
    deck = discard.length > 0 ? shuffle(discard) : createEncounterDeck();
    discard = [];
  }

  const [cardId, ...remainingDeck] = deck;
  return {
    cardId: cardId ?? null,
    deck: remainingDeck,
    discard
  };
}

function createEncounterWorkingState(gameState) {
  return {
    players: gameState.players.map((player) => ({
      ...player,
      resources: normalizeResources(player.resources),
      upgrades: normalizeUpgrades(player.upgrades),
      friendshipCards: normalizeFriendshipCards(player.friendshipCards),
      friendshipMarkers: normalizeFriendshipMarkers(player.friendshipMarkers),
      specialMedals: normalizeSpecialMedals(player.specialMedals)
    })),
    board: {
      ...gameState.board,
      ships: normalizeShips(gameState.board?.ships),
      structures: normalizeStructures(gameState.board?.structures, gameState.playerCount, defaultBoardLayout, { useFallback: false })
    },
    pendingGiftedTradeShips: normalizePendingGiftedTradeShips(gameState.pendingGiftedTradeShips, gameState.players),
    remainingMovementByShipId: { ...(gameState.remainingMovementByShipId ?? {}) }
  };
}

function applyEncounterResolution(gameState, encounter, resolution, metadata = {}) {
  if (!resolution) return gameState;
  const baseUpdate = {
    players: resolution.players ?? gameState.players,
    board: resolution.board ? { ...gameState.board, ...resolution.board } : gameState.board,
    pendingGiftedTradeShips: normalizePendingGiftedTradeShips(
      resolution.pendingGiftedTradeShips ?? gameState.pendingGiftedTradeShips,
      resolution.players ?? gameState.players
    ),
    remainingMovementByShipId: resolution.remainingMovementByShipId ?? gameState.remainingMovementByShipId,
    logEntries: resolution.logEntries ?? []
  };

  if (resolution.nextEncounter) {
    const intermediateState = updateGameState(gameState, {
      ...baseUpdate,
      activeEncounter: null,
      encounterStep: null,
      encounterDiscard: resolution.nextEncounter.reshuffleAll
        ? []
        : [...(gameState.encounterDiscard ?? []), encounter.cardId]
    });
    const encounterDeck = resolution.nextEncounter.reshuffleAll
      ? createEncounterDeck().filter((cardId) => cardId !== encounter.cardId)
      : intermediateState.encounterDeck;
    const encounterStart = startEncounter(
      {
        ...intermediateState,
        encounterDeck,
        encounterDiscard: resolution.nextEncounter.reshuffleAll ? [] : intermediateState.encounterDiscard
      },
      resolution.nextEncounter.forcedCardId
    );

    return updateGameState(intermediateState, {
      encounterDeck: encounterStart.encounterDeck,
      encounterDiscard: encounterStart.encounterDiscard,
      activeEncounter: encounterStart.activeEncounter,
      encounterStep: encounterStart.encounterStep,
      logEntry: {
        type: "encounter",
        messageKey: "logEncounterChain",
        messageParams: {
          player: getActivePlayerName(intermediateState)
        }
      }
    });
  }

  const nextEncounter = {
    ...encounter,
    choiceId: metadata.choiceId ?? encounter.choiceId ?? null,
    chosenResource: metadata.chosenResource ?? encounter.chosenResource ?? null,
    chosenUpgrade: metadata.chosenUpgrade ?? encounter.chosenUpgrade ?? null,
    combat: resolution.combat ?? encounter.combat ?? null,
    resultText: resolution.resultText ?? encounter.resultText ?? null,
    pendingStep: resolution.pendingStep ? normalizePendingEncounterStep(resolution.pendingStep) : null,
    status: resolution.pendingStep ? "pending" : (resolution.status ?? "resolved")
  };

  return updateGameState(gameState, {
    ...baseUpdate,
    activeEncounter: nextEncounter,
    encounterStep: nextEncounter.pendingStep
      ? nextEncounter.pendingStep.type
      : nextEncounter.status === "resolved"
        ? "resolved"
        : "choice"
  });
}

function runEncounterEffectSequence(gameState, state, activePlayerId, effects, card, payload, context = {}) {
  let workingState = state;
  const logEntries = [];
  let combat = context.combat ?? null;
  let resultText = normalizeLocalizedText(context.resultText);

  for (let index = 0; index < effects.length; index += 1) {
    const effect = effects[index];
    const result = applyEncounterEffectSequence(gameState, workingState, activePlayerId, effect, payload, card);
    if (!result) return null;

    workingState = result.state ?? workingState;
    if (Array.isArray(result.logEntries) && result.logEntries.length > 0) {
      logEntries.push(...result.logEntries);
    }
    if (result.combat) combat = result.combat;
    if (result.resultText) resultText = result.resultText;

    if (result.pendingStep) {
      const deferResultText = result.pendingStep.type === "resourceSelection"
        && result.pendingStep.mode === "loss"
        && resultText;
      return {
        players: workingState.players,
        board: workingState.board,
        pendingGiftedTradeShips: workingState.pendingGiftedTradeShips,
        remainingMovementByShipId: workingState.remainingMovementByShipId,
        logEntries,
        combat,
        resultText: deferResultText ? null : resultText,
        status: "pending",
        pendingStep: {
          ...result.pendingStep,
          deferredResultText: deferResultText ? resultText : result.pendingStep.deferredResultText,
          remainingEffects: [
            ...(result.pendingStep.remainingEffects ?? []),
            ...effects.slice(index + 1)
          ]
        }
      };
    }

    if (result.nextEncounter) {
      return {
        players: workingState.players,
        board: workingState.board,
        pendingGiftedTradeShips: workingState.pendingGiftedTradeShips,
        remainingMovementByShipId: workingState.remainingMovementByShipId,
        logEntries,
        combat,
        resultText,
        status: "resolved",
        pendingStep: null,
        nextEncounter: result.nextEncounter
      };
    }
  }

  return {
    players: workingState.players,
    board: workingState.board,
    pendingGiftedTradeShips: workingState.pendingGiftedTradeShips,
    remainingMovementByShipId: workingState.remainingMovementByShipId,
    logEntries,
    combat,
    resultText,
    status: "resolved",
    pendingStep: null
  };
}

function applyEncounterEffectSequence(gameState, state, activePlayerId, effect, payload, card) {
  const activePlayer = state.players.find((player) => player.id === activePlayerId);
  if (!activePlayer || !effect) return null;

  switch (effect.type) {
    case "none":
      return { state };
    case "branchChoice":
      return {
        state,
        pendingStep: {
          type: "choiceSelection",
          promptText: normalizeLocalizedText(effect.promptText),
          choices: normalizeEncounterPendingChoices(effect.choices),
          contextPayload: {
            lastSelectedResources: normalizeResources(payload.lastSelectedResources),
            lastSelectionMode: typeof payload.lastSelectionMode === "string" ? payload.lastSelectionMode : null
          },
          remainingEffects: []
        }
      };
    case "gainResource": {
      const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withResourceDelta(player, effect.resource, effect.amount ?? 1));
      return {
        state: nextState,
        logEntries: [createEncounterLog("logEncounterResourceGain", {
          player: activePlayer.name,
          amount: effect.amount ?? 1,
          resource: effect.resource
        })]
      };
    }
    case "loseResource": {
      const owned = activePlayer.resources?.[effect.resource] ?? 0;
      const amount = Math.min(owned, effect.amount ?? 1);
      const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withResourceDelta(player, effect.resource, -amount));
      return {
        state: nextState,
        logEntries: amount > 0 ? [createEncounterLog("logEncounterResourceLoss", {
          player: activePlayer.name,
          amount,
          resource: effect.resource
        })] : []
      };
    }
    case "chooseResourceGain": {
      if (supplyResourceTypes.includes(payload.resource) && (effect.amount ?? 1) === 1) {
        const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withResourceDelta(player, payload.resource, 1));
        return {
          state: nextState,
          logEntries: [createEncounterLog("logEncounterResourceGain", {
            player: activePlayer.name,
            amount: 1,
            resource: payload.resource
          })]
        };
      }

      return {
        state,
        pendingStep: {
          type: "resourceSelection",
          mode: "gain",
          amount: effect.amount ?? 1,
          selectedResources: createEmptyResources(),
          remainingEffects: []
        }
      };
    }
    case "chooseResourceLoss": {
      const requiredAmount = effect.amount ?? 1;
      if (countResources(activePlayer.resources) < requiredAmount) {
        return null;
      }

      return {
        state,
        pendingStep: {
          type: "resourceSelection",
          mode: "loss",
          amount: requiredAmount,
          selectedResources: createEmptyResources(),
          remainingEffects: []
        }
      };
    }
    case "loseSelectedResources": {
      const selectedResources = normalizeResources(payload.lastSelectedResources);
      if (countResources(selectedResources) === 0) {
        return { state };
      }

      let nextState = state;
      for (const resource of supplyResourceTypes) {
        const amount = selectedResources[resource] ?? 0;
        if (amount <= 0) continue;
        nextState = updateEncounterWorkingPlayer(
          nextState,
          activePlayerId,
          (player) => withResourceDelta(player, resource, -amount)
        );
      }

      return {
        state: nextState,
        logEntries: [createEncounterLog(getEncounterResourceSelectionLogKey("loss", countResources(selectedResources)), {
          player: activePlayer.name,
          count: countResources(selectedResources)
        })]
      };
    }
    case "gainSelectedResources": {
      const selectedResources = normalizeResources(payload.lastSelectedResources);
      if (countResources(selectedResources) === 0) {
        return { state };
      }

      let nextState = state;
      for (const resource of supplyResourceTypes) {
        const amount = selectedResources[resource] ?? 0;
        if (amount <= 0) continue;
        nextState = updateEncounterWorkingPlayer(
          nextState,
          activePlayerId,
          (player) => withResourceDelta(player, resource, amount)
        );
      }

      return {
        state: nextState,
        logEntries: [createEncounterLog(getEncounterResourceSelectionLogKey("gain", countResources(selectedResources)), {
          player: activePlayer.name,
          count: countResources(selectedResources)
        })]
      };
    }
    case "collectGiftsFromOpponents": {
      const giverPlayerIds = state.players
        .filter((player) => player.id !== activePlayerId && countResources(player.resources) > 0)
        .map((player) => player.id);
      if (giverPlayerIds.length === 0) {
        return {
          state,
          logEntries: [createEncounterLog("logEncounterNoResourceGift", {
            player: activePlayer.name
          })]
        };
      }

      return {
        state,
        pendingStep: {
          type: "opponentResourceGiftSelection",
          amount: effect.amount ?? 1,
          receiverPlayerId: activePlayerId,
          currentGiverPlayerId: giverPlayerIds[0],
          giverPlayerIds,
          remainingEffects: []
        }
      };
    }
    case "gainHalfMedal": {
      const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withHalfMedalDelta(player, effect.amount ?? 1));
      return {
        state: nextState,
        logEntries: [createEncounterLog("logEncounterHalfMedalGain", {
          player: activePlayer.name,
          amount: effect.amount ?? 1
        })]
      };
    }
    case "globalLeaderHalfMedal": {
      const amount = effect.amount ?? 1;
      const metric = effect.metric === "cargo" ? "cargo" : "cargo";
      const metricValues = state.players.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        value: metric === "cargo"
          ? getRealUpgradeValue(player, "cargo")
          : 0
      }));
      const maxValue = Math.max(...metricValues.map((entry) => entry.value), 0);
      const targetIds = metricValues
        .filter((entry) => maxValue > 0 && entry.value === maxValue)
        .map((entry) => entry.playerId);
      const nextPlayers = state.players.map((player) => targetIds.includes(player.id)
        ? withHalfMedalDelta(player, amount)
        : player);
      const nextState = {
        ...state,
        players: nextPlayers
      };
      const logEntries = targetIds.map((playerId) => createEncounterLog("logEncounterHalfMedalGain", {
        player: getPlayerNameById(nextPlayers, playerId),
        amount
      }));
      if (effect.showResult) {
        return {
          state: nextState,
          logEntries,
          pendingStep: {
            type: "message",
            titleText: normalizeLocalizedText(effect.titleText),
            bodyText: normalizeLocalizedText(effect.bodyText),
            detailText: createGalacticCouncilResultText(metricValues, targetIds),
            remainingEffects: []
          }
        };
      }
      return {
        state: nextState,
        logEntries
      };
    }
    case "loseHalfMedal": {
      const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withHalfMedalDelta(player, -(effect.amount ?? 1)));
      return {
        state: nextState,
        logEntries: [createEncounterLog("logEncounterHalfMedalLoss", {
          player: activePlayer.name,
          amount: effect.amount ?? 1
        })]
      };
    }
    case "chooseUpgradeGain": {
      const amount = effect.amount ?? 1;
      const availableUpgradeIds = getAvailablePhysicalUpgradeIds(activePlayer, amount);
      if (availableUpgradeIds.length === 0) {
        return {
          state,
          resultText: encounterNoUpgradeGainText,
          logEntries: [createEncounterLog("logEncounterNoUpgradeGain", {
            player: activePlayer.name
          })]
        };
      }

      if (availableUpgradeIds.includes(payload.upgrade) && amount === 1) {
        const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withUpgradeDelta(player, payload.upgrade, 1));
        return {
          state: nextState,
          logEntries: [createEncounterLog("logEncounterUpgradeGain", {
            player: activePlayer.name,
            upgrade: payload.upgrade
          })]
        };
      }

      return {
        state,
        pendingStep: {
          type: "upgradeSelection",
          mode: "gain",
          amount,
          selectedUpgrade: null,
          remainingEffects: []
        }
      };
    }
    case "chooseUpgradeLoss": {
      if (!Object.values(activePlayer.upgrades ?? {}).some((value) => value > 0)) {
        return {
          state,
          logEntries: [createEncounterLog("logEncounterNoUpgradeLoss", {
            player: activePlayer.name
          })]
        };
      }

      if (isValidUpgradeId(payload.upgrade) && (activePlayer.upgrades?.[payload.upgrade] ?? 0) > 0) {
        const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withUpgradeDelta(player, payload.upgrade, -(effect.amount ?? 1)));
        return {
          state: nextState,
          logEntries: [createEncounterLog("logEncounterUpgradeLoss", {
            player: activePlayer.name,
            upgrade: payload.upgrade
          })]
        };
      }

      return {
        state,
        pendingStep: {
          type: "upgradeSelection",
          mode: "loss",
          amount: effect.amount ?? 1,
          selectedUpgrade: null,
          remainingEffects: []
        }
      };
    }
    case "gainUpgrade": {
      const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withUpgradeDelta(player, effect.upgrade, effect.amount ?? 1));
      return {
        state: nextState,
        logEntries: [createEncounterLog("logEncounterUpgradeGain", {
          player: activePlayer.name,
          upgrade: effect.upgrade
        })]
      };
    }
    case "loseUpgrade": {
      const nextState = updateEncounterWorkingPlayer(state, activePlayerId, (player) => withUpgradeDelta(player, effect.upgrade, -(effect.amount ?? 1)));
      return {
        state: nextState,
        logEntries: [createEncounterLog("logEncounterUpgradeLoss", {
          player: activePlayer.name,
          upgrade: effect.upgrade
        })]
      };
    }
    case "comparison": {
      if (effect.metric === "speed") {
        const pendingStep = createDualMothershipRollStep(gameState, state, activePlayer, effect, payload, "speed");
        return pendingStep ? { state, pendingStep } : null;
      }

      const pendingStep = createDriveComparisonPreviewStep(gameState, state, activePlayer, effect, payload);
      return pendingStep
        ? { state, pendingStep, resultText: createDriveComparisonPreviewText(pendingStep) }
        : null;
    }
    case "combat": {
      if (!Number.isInteger(effect.enemyStrength)) {
        const pendingStep = createDualMothershipRollStep(gameState, state, activePlayer, effect, payload, "combat");
        return pendingStep ? { state, pendingStep } : null;
      }

      const combat = resolveEncounterCombat(gameState, activePlayer, effect, payload);
      if (!combat) return null;
      const combatLog = createEncounterLog(
        combat.outcome === "win" ? "logEncounterCombatWin" : "logEncounterCombatLoss",
        {
          player: activePlayer.name,
          strength: combat.strength,
          enemy: combat.enemyStrength,
          target: combat.enemyName ?? ""
        }
      );
      const followUp = runEncounterEffectSequence(
        gameState,
        state,
        activePlayerId,
        combat.outcome === "win" ? (effect.onWin ?? []) : (effect.onLose ?? []),
        card,
        payload,
        {
          combat,
          resultText: combat.outcome === "win" ? effect.winText : effect.loseText
        }
      );
      if (!followUp) {
        return {
          state,
          logEntries: [combatLog],
          combat
        };
      }
      return {
        state: {
          players: followUp.players,
          board: followUp.board,
          pendingGiftedTradeShips: followUp.pendingGiftedTradeShips,
          remainingMovementByShipId: followUp.remainingMovementByShipId
        },
        logEntries: [combatLog, ...(followUp.logEntries ?? [])],
        combat: followUp.combat ?? combat,
        resultText: followUp.resultText ?? (combat.outcome === "win" ? effect.winText : effect.loseText),
        pendingStep: followUp.pendingStep ?? null,
        nextEncounter: followUp.nextEncounter ?? null
      };
    }
    case "mothershipOutcomeRoll": {
      return {
        state,
        pendingStep: createSingleMothershipRollStep(activePlayer, effect, payload)
      };
    }
    case "jumpFirstShip": {
      const shipIds = getEncounterJumpShips(state, activePlayerId).map((ship) => ship.id);
      if (shipIds.length === 0) {
        return {
          state,
          logEntries: [createEncounterLog("logEncounterNoJumpShip", {
            player: activePlayer.name
          })]
        };
      }

      return {
        state,
        pendingStep: {
          type: "shipJumpSelection",
          shipIds,
          hint: {
            de: "Waehle ein eigenes Schiff fuer den Raumsprung.",
            en: "Choose one of your ships for the spatial jump."
          },
          remainingEffects: []
        }
      };
    }
    case "jumpShip": {
      const shipIds = getEncounterJumpShips(state, activePlayerId).map((ship) => ship.id);
      if (shipIds.length === 0) {
        return {
          state,
          logEntries: [createEncounterLog("logEncounterNoJumpShip", {
            player: activePlayer.name
          })]
        };
      }

      return {
        state,
        pendingStep: {
          type: "shipJumpSelection",
          shipIds,
          hint: {
            de: "Waehle ein eigenes Schiff fuer den Raumsprung.",
            en: "Choose one of your ships for the spatial jump."
          },
          remainingEffects: []
        }
      };
    }
    case "drawNextEncounter":
      return {
        state,
        nextEncounter: {
          reshuffleAll: Boolean(effect.reshuffleAll),
          forcedCardId: typeof effect.forcedCardId === "string" ? effect.forcedCardId : null
        }
      };
    case "showEncounterMessage":
      return {
        state,
        pendingStep: {
          type: "message",
          titleText: normalizeLocalizedText(effect.titleText),
          bodyText: normalizeLocalizedText(effect.bodyText),
          detailText: normalizeLocalizedText(effect.detailText),
          remainingEffects: []
        }
      };
    case "globalUpgradeLossAbove": {
      const threshold = Number.isInteger(effect.threshold) ? effect.threshold : 0;
      const amount = Number.isInteger(effect.amount) ? Math.max(1, effect.amount) : 1;
      const targetPlayerIds = state.players
        .filter((player) => getPlayerUpgradeTotal(player) > threshold && hasAnyUpgrades(player))
        .map((player) => player.id);
      if (targetPlayerIds.length === 0) {
        return { state };
      }

      return {
        state,
        pendingStep: {
          type: "globalUpgradeLossSelection",
          threshold,
          amount,
          currentTargetPlayerId: targetPlayerIds[0],
          targetPlayerIds,
          remainingEffects: []
        }
      };
    }
    case "drawFromOpponents": {
      const drawResult = applyEncounterDrawFromOpponents(state, activePlayerId, effect.amountPerOpponent ?? 1);
      return {
        state: drawResult.state,
        logEntries: [createEncounterLog("logEncounterDrawFromOpponents", {
          player: activePlayer.name,
          count: drawResult.drawCount
        })]
      };
    }
    case "grantShip":
      return applyEncounterShipGift(gameState, state, activePlayerId, effect.shipType ?? "tradeShip");
    case "chooseShipBlock": {
      const shipIds = getEncounterBlockableShips(state, activePlayerId).map((ship) => ship.id);
      if (shipIds.length === 0) {
        return {
          state,
          logEntries: [createEncounterLog("logEncounterNoShipBlocked", {
            player: activePlayer.name
          })]
        };
      }

      return {
        state,
        pendingStep: {
          type: "shipBlockSelection",
          shipIds,
          hint: {
            de: "Wähle ein eigenes Schiff. Es darf in dieser Runde nicht fliegen.",
            en: "Choose one of your ships. It may not fly this turn."
          },
          remainingEffects: []
        }
      };
    }
    case "blockFirstShip":
      return applyEncounterShipBlock(state, activePlayerId);
    default:
      return { state };
  }
}

function resolveEncounterPendingStep(gameState, encounter, card, activePlayer, pendingStep, payload = {}) {
  const state = createEncounterWorkingState(gameState);
  const remainingEffects = pendingStep.remainingEffects ?? [];

  if (pendingStep.type === "message") {
    return runEncounterEffectSequence(gameState, state, activePlayer.id, remainingEffects, card, payload, {});
  }

  if (pendingStep.type === "singleMothershipRoll") {
    return resolveSingleMothershipRollPending(gameState, state, activePlayer, card, pendingStep, payload);
  }

  if (pendingStep.type === "dualMothershipRoll") {
    return resolveDualMothershipRollPending(gameState, state, activePlayer, card, pendingStep, payload);
  }

  if (pendingStep.type === "driveComparisonPreview") {
    return resolveDriveComparisonPreviewPending(gameState, state, activePlayer, card, pendingStep, payload);
  }

  if (pendingStep.type === "choiceSelection") {
    const choice = (pendingStep.choices ?? []).find((entry) => entry.id === payload.choiceId);
    if (!choice) return null;

    return runEncounterEffectSequence(
      gameState,
      state,
      activePlayer.id,
      [...(choice.effects ?? []), ...remainingEffects],
      card,
      {
        ...(pendingStep.contextPayload ?? {}),
        ...payload
      },
      {
        resultText: choice.resultText ?? null
      }
    );
  }

  if (pendingStep.type === "resourceSelection") {
    const selectedResources = normalizeResources(pendingStep.selectedResources);
    if (countResources(selectedResources) !== (pendingStep.amount ?? 0)) return null;

    const player = state.players.find((candidate) => candidate.id === activePlayer.id);
    if (!player) return null;
    if (pendingStep.mode === "loss" && !canPay(player.resources, selectedResources)) return null;

    let nextState = state;
    for (const resource of supplyResourceTypes) {
      const amount = selectedResources[resource] ?? 0;
      if (amount <= 0) continue;
      nextState = updateEncounterWorkingPlayer(
        nextState,
        activePlayer.id,
        (candidate) => withResourceDelta(candidate, resource, pendingStep.mode === "loss" ? -amount : amount)
      );
    }

    const selectedCount = countResources(selectedResources);
    const stepLogKey = getEncounterResourceSelectionLogKey(pendingStep.mode, selectedCount);
    const baseLog = createEncounterLog(stepLogKey, {
      player: activePlayer.name,
      count: selectedCount
    });
    const followUp = runEncounterEffectSequence(
      gameState,
      nextState,
      activePlayer.id,
      remainingEffects,
      card,
      {
        ...payload,
        lastSelectedResources: selectedResources,
        lastSelectionMode: pendingStep.mode
      },
      {
        resultText: pendingStep.deferredResultText ?? null
      }
    );
    if (!followUp) return null;

    return {
      ...followUp,
      logEntries: [baseLog, ...(followUp.logEntries ?? [])]
    };
  }

  if (pendingStep.type === "upgradeSelection") {
    const upgradeId = payload.upgrade;
    const player = state.players.find((candidate) => candidate.id === activePlayer.id);
    if (!player) return null;
    const hasAnyLossTarget = Object.entries(normalizeUpgrades(player.upgrades))
      .some(([, amount]) => amount > 0);
    const availableGainTargets = getAvailablePhysicalUpgradeIds(player, pendingStep.amount ?? 1);

    if (pendingStep.mode === "loss" && !hasAnyLossTarget) {
      const followUp = runEncounterEffectSequence(gameState, state, activePlayer.id, remainingEffects, card, payload, {});
      if (!followUp) return null;
      return {
        ...followUp,
        logEntries: [
          createEncounterLog("logEncounterNoUpgradeLoss", { player: activePlayer.name }),
          ...(followUp.logEntries ?? [])
        ]
      };
    }

    if (pendingStep.mode === "gain" && availableGainTargets.length === 0) {
      const followUp = runEncounterEffectSequence(gameState, state, activePlayer.id, remainingEffects, card, payload, {
        resultText: encounterNoUpgradeGainText
      });
      if (!followUp) return null;
      return {
        ...followUp,
        logEntries: [
          createEncounterLog("logEncounterNoUpgradeGain", { player: activePlayer.name }),
          ...(followUp.logEntries ?? [])
        ]
      };
    }

    if (!isValidUpgradeId(upgradeId)) return null;
    if (pendingStep.mode === "loss" && (player.upgrades?.[upgradeId] ?? 0) <= 0) return null;
    if (pendingStep.mode === "gain" && !availableGainTargets.includes(upgradeId)) return null;

    const nextState = updateEncounterWorkingPlayer(
      state,
      activePlayer.id,
      (candidate) => withUpgradeDelta(candidate, upgradeId, pendingStep.mode === "loss" ? -(pendingStep.amount ?? 1) : (pendingStep.amount ?? 1))
    );
    const baseLog = createEncounterLog(
      pendingStep.mode === "loss" ? "logEncounterUpgradeLoss" : "logEncounterUpgradeGain",
      {
        player: activePlayer.name,
        upgrade: upgradeId
      }
    );
    const followUp = runEncounterEffectSequence(gameState, nextState, activePlayer.id, remainingEffects, card, payload, {});
    if (!followUp) return null;

    return {
      ...followUp,
      logEntries: [baseLog, ...(followUp.logEntries ?? [])]
    };
  }

  if (pendingStep.type === "shipJumpSelection") {
    const shipId = payload.shipId;
    if (typeof shipId !== "string" || !pendingStep.shipIds?.includes(shipId)) return null;

    const ship = normalizeShips(state.board?.ships)
      .find((candidate) => candidate.id === shipId && candidate.ownerPlayerId === activePlayer.id);
    if (!ship) return null;

    const validNodeIds = getEncounterJumpTargets(
      {
        ...gameState,
        players: state.players,
        board: state.board
      },
      ship.id,
      defaultBoardLayout
    );
    if (validNodeIds.length === 0) {
      const followUp = runEncounterEffectSequence(gameState, state, activePlayer.id, remainingEffects, card, payload, {});
      if (!followUp) return null;
      return {
        ...followUp,
        logEntries: [
          createEncounterLog("logEncounterNoJumpShip", { player: activePlayer.name }),
          ...(followUp.logEntries ?? [])
        ]
      };
    }

    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [],
      combat: encounter.combat ?? null,
      resultText: encounter.resultText ?? null,
      status: "pending",
      pendingStep: {
        type: "boardTargetSelection",
        shipId,
        validNodeIds,
        hint: {
          de: "Waehle einen gueltigen Zielpunkt fuer den Raumsprung.",
          en: "Choose a valid destination for the spatial jump."
        },
        remainingEffects
      }
    };
  }

  if (pendingStep.type === "boardTargetSelection") {
    const targetNodeId = payload.targetNodeId;
    if (typeof targetNodeId !== "string" || !pendingStep.validNodeIds?.includes(targetNodeId)) {
      return null;
    }

    const shipId = pendingStep.shipId;
    const ships = normalizeShips(state.board?.ships);
    const ship = ships.find((candidate) => candidate.id === shipId && candidate.ownerPlayerId === activePlayer.id);
    if (!ship) return null;
    const landingNodeId = resolveEncounterJumpLandingNode(
      {
        ...gameState,
        players: state.players,
        board: state.board
      },
      defaultBoardLayout,
      ship,
      targetNodeId
    );
    if (!landingNodeId) return null;

    const nextShips = ships.map((candidate) => candidate.id === shipId
      ? { ...candidate, locationId: landingNodeId, status: "active" }
      : candidate);
    const movedPlayers = state.players.map((player) => ({
      ...player,
      ships: nextShips.filter((candidate) => candidate.ownerPlayerId === player.id)
    }));
    const discoveryBaseState = {
      ...gameState,
      players: movedPlayers,
      board: {
        ...state.board,
        ships: nextShips
      }
    };
    const explorationResult = exploreAdjacentSystems(discoveryBaseState, defaultBoardLayout, landingNodeId, activePlayer.name);
    const specialResult = resolveAdjacentSpecialMarkers(
      {
        ...discoveryBaseState,
        players: movedPlayers,
        board: {
          ...discoveryBaseState.board,
          exploredSystems: explorationResult.exploredSystems,
          exploredOutposts: explorationResult.exploredOutposts,
          exploredEmptySlots: explorationResult.exploredEmptySlots,
          placedQuadrants: explorationResult.placedQuadrants,
          numberTokens: explorationResult.numberTokens,
          ships: nextShips
        }
      },
      defaultBoardLayout,
      landingNodeId,
      activePlayer
    );
    const nextState = {
      ...state,
      players: specialResult.players,
      board: {
        ...state.board,
        exploredSystems: explorationResult.exploredSystems,
        exploredOutposts: explorationResult.exploredOutposts,
        exploredEmptySlots: explorationResult.exploredEmptySlots,
        placedQuadrants: explorationResult.placedQuadrants,
        numberTokens: specialResult.numberTokens,
        selectedElement: { type: "ship", id: shipId },
        ships: nextShips
      },
      remainingMovementByShipId: state.remainingMovementByShipId
    };
    const baseLog = createEncounterLog("logEncounterJumpShip", {
      player: activePlayer.name,
      ship: ship.type
    });
    const followUp = runEncounterEffectSequence(gameState, nextState, activePlayer.id, remainingEffects, card, payload, {});
    if (!followUp) return null;

    return {
      ...followUp,
      logEntries: [
        baseLog,
        ...explorationResult.logEntries,
        ...specialResult.logEntries,
        ...(followUp.logEntries ?? [])
      ]
    };
  }

  if (pendingStep.type === "shipBlockSelection") {
    const shipId = payload.shipId;
    if (typeof shipId !== "string" || !pendingStep.shipIds?.includes(shipId)) return null;
    const ship = normalizeShips(state.board?.ships)
      .find((candidate) => candidate.id === shipId && candidate.ownerPlayerId === activePlayer.id);
    if (!ship) return null;

    const nextState = {
      ...state,
      remainingMovementByShipId: {
        ...state.remainingMovementByShipId,
        [ship.id]: 0
      }
    };
    const baseLog = createEncounterLog("logEncounterShipBlocked", {
      player: activePlayer.name,
      ship: ship.type
    });
    const followUp = runEncounterEffectSequence(gameState, nextState, activePlayer.id, remainingEffects, card, payload, {});
    if (!followUp) return null;

    return {
      ...followUp,
      logEntries: [baseLog, ...(followUp.logEntries ?? [])]
    };
  }

  if (pendingStep.type === "opponentResourceGiftSelection") {
    const giverPlayerId = pendingStep.currentGiverPlayerId;
    const receiverPlayerId = pendingStep.receiverPlayerId;
    const giver = state.players.find((candidate) => candidate.id === giverPlayerId);
    const receiver = state.players.find((candidate) => candidate.id === receiverPlayerId);
    if (!giver || !receiver) return null;

    if (payload.skip && countResources(giver.resources) === 0) {
      const nextGiverPlayerIds = (pendingStep.giverPlayerIds ?? []).filter((playerId) => playerId !== giverPlayerId);
      if (nextGiverPlayerIds.length > 0) {
        return {
          players: state.players,
          board: state.board,
          pendingGiftedTradeShips: state.pendingGiftedTradeShips,
          remainingMovementByShipId: state.remainingMovementByShipId,
          logEntries: [],
          combat: encounter.combat ?? null,
          resultText: encounter.resultText ?? null,
          status: "pending",
          pendingStep: {
            ...pendingStep,
            currentGiverPlayerId: nextGiverPlayerIds[0],
            giverPlayerIds: nextGiverPlayerIds
          }
        };
      }

      return runEncounterEffectSequence(gameState, state, activePlayer.id, remainingEffects, card, payload, {});
    }

    const resource = payload.resource;
    if (!supplyResourceTypes.includes(resource) || (giver.resources?.[resource] ?? 0) <= 0) {
      return null;
    }

    let nextState = updateEncounterWorkingPlayer(
      state,
      giverPlayerId,
      (player) => withResourceDelta(player, resource, -1)
    );
    nextState = updateEncounterWorkingPlayer(
      nextState,
      receiverPlayerId,
      (player) => withResourceDelta(player, resource, 1)
    );

    const nextGiverPlayerIds = (pendingStep.giverPlayerIds ?? []).filter((playerId) => playerId !== giverPlayerId);
    const baseLog = createEncounterLog("logEncounterResourceGift", {
      player: giver.name,
      target: receiver.name
    });

    if (nextGiverPlayerIds.length > 0) {
      return {
        players: nextState.players,
        board: nextState.board,
        pendingGiftedTradeShips: nextState.pendingGiftedTradeShips,
        remainingMovementByShipId: nextState.remainingMovementByShipId,
        logEntries: [baseLog],
        combat: encounter.combat ?? null,
        resultText: encounter.resultText ?? null,
        status: "pending",
        pendingStep: {
          ...pendingStep,
          currentGiverPlayerId: nextGiverPlayerIds[0],
          giverPlayerIds: nextGiverPlayerIds
        }
      };
    }

    const followUp = runEncounterEffectSequence(gameState, nextState, activePlayer.id, remainingEffects, card, payload, {});
    if (!followUp) return null;

    return {
      ...followUp,
      logEntries: [baseLog, ...(followUp.logEntries ?? [])]
    };
  }

  if (pendingStep.type === "globalUpgradeLossSelection") {
    const currentTargetPlayerId = pendingStep.currentTargetPlayerId;
    const targetPlayer = state.players.find((candidate) => candidate.id === currentTargetPlayerId);
    if (!targetPlayer) {
      const followUp = runEncounterEffectSequence(gameState, state, activePlayer.id, remainingEffects, card, payload, {});
      return followUp;
    }

    const nextTargetPlayerIds = (pendingStep.targetPlayerIds ?? []).filter((playerId) => playerId !== currentTargetPlayerId);
    if (!hasAnyUpgrades(targetPlayer)) {
      if (nextTargetPlayerIds.length > 0) {
        return {
          players: state.players,
          board: state.board,
          pendingGiftedTradeShips: state.pendingGiftedTradeShips,
          remainingMovementByShipId: state.remainingMovementByShipId,
          logEntries: [],
          combat: encounter.combat ?? null,
          resultText: encounter.resultText ?? null,
          status: "pending",
          pendingStep: {
            ...pendingStep,
            currentTargetPlayerId: nextTargetPlayerIds[0],
            targetPlayerIds: nextTargetPlayerIds
          }
        };
      }

      return runEncounterEffectSequence(gameState, state, activePlayer.id, remainingEffects, card, payload, {});
    }

    const upgradeId = payload.upgrade;
    if (!isValidUpgradeId(upgradeId) || (targetPlayer.upgrades?.[upgradeId] ?? 0) <= 0) return null;

    const nextState = updateEncounterWorkingPlayer(
      state,
      currentTargetPlayerId,
      (player) => withUpgradeDelta(player, upgradeId, -(pendingStep.amount ?? 1))
    );
    const baseLog = createEncounterLog("logEncounterUpgradeLoss", {
      player: targetPlayer.name,
      upgrade: upgradeId
    });

    if (nextTargetPlayerIds.length > 0) {
      return {
        players: nextState.players,
        board: nextState.board,
        pendingGiftedTradeShips: nextState.pendingGiftedTradeShips,
        remainingMovementByShipId: nextState.remainingMovementByShipId,
        logEntries: [baseLog],
        combat: encounter.combat ?? null,
        resultText: encounter.resultText ?? null,
        status: "pending",
        pendingStep: {
          ...pendingStep,
          currentTargetPlayerId: nextTargetPlayerIds[0],
          targetPlayerIds: nextTargetPlayerIds
        }
      };
    }

    const followUp = runEncounterEffectSequence(gameState, nextState, activePlayer.id, remainingEffects, card, payload, {});
    if (!followUp) return null;

    return {
      ...followUp,
      logEntries: [baseLog, ...(followUp.logEntries ?? [])]
    };
  }

  return null;
}

function createGalacticCouncilResultText(metricValues, targetIds) {
  if (targetIds.length === 0) {
    return {
      de: "Niemand erhält eine halbe Medaille.",
      en: "No player receives half a medal."
    };
  }

  const names = metricValues
    .filter((entry) => targetIds.includes(entry.playerId))
    .map((entry) => entry.playerName)
    .filter(Boolean);
  const deNames = joinLocalizedNames(names, "und");
  const enNames = joinLocalizedNames(names, "and");
  if (names.length === 1) {
    return {
      de: `${deNames} erhält eine halbe Medaille.`,
      en: `${enNames} receives half a medal.`
    };
  }
  return {
    de: `${deNames} erhalten jeweils eine halbe Medaille.`,
    en: `${enNames} each receive half a medal.`
  };
}

function joinLocalizedNames(names, conjunction) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} ${conjunction} ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} ${conjunction} ${names.at(-1)}`;
}

function createDualMothershipRollStep(gameState, state, activePlayer, effect, payload = {}, mode = "combat") {
  const targetPlayer = getNeighborPlayer(
    {
      ...gameState,
      players: state.players,
      board: state.board
    },
    activePlayer.id,
    effect.neighborOffset ?? 1
  );
  if (!targetPlayer) return null;

  return {
    type: "dualMothershipRoll",
    mode: mode === "speed" ? "speed" : "combat",
    activePlayerId: activePlayer.id,
    targetPlayerId: targetPlayer.id,
    activeRoll: normalizeEncounterRollResult(payload.activeRoll) ?? null,
    targetRoll: normalizeEncounterRollResult(payload.targetRoll) ?? null,
    effect,
    contextPayload: normalizeEncounterPendingContext({
      lastSelectedResources: payload.lastSelectedResources,
      lastSelectionMode: payload.lastSelectionMode
    }),
    remainingEffects: []
  };
}

function createSingleMothershipRollStep(activePlayer, effect, payload = {}) {
  return {
    type: "singleMothershipRoll",
    activePlayerId: activePlayer.id,
    roll: null,
    effect,
    contextPayload: normalizeEncounterPendingContext({
      lastSelectedResources: payload.lastSelectedResources,
      lastSelectionMode: payload.lastSelectionMode
    }),
    remainingEffects: []
  };
}

function resolveSingleMothershipRollPending(gameState, state, activePlayer, card, pendingStep, payload = {}) {
  const rollPlayer = state.players.find((player) => player.id === pendingStep.activePlayerId);
  if (!rollPlayer || !pendingStep.effect) return null;

  const rollerPlayerId = typeof payload.playerId === "string" ? payload.playerId : activePlayer.id;
  if (rollerPlayerId !== rollPlayer.id) return null;

  const storedRoll = normalizeEncounterRollResult(pendingStep.roll);
  if (!storedRoll) {
    if (payload.completeRoll) return null;
    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [],
      resultText: null,
      status: "pending",
      pendingStep: {
        ...pendingStep,
        roll: createEncounterRoll(payload.forcedRoll)
      }
    };
  }

  if (!payload.completeRoll) {
    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [],
      resultText: null,
      status: "pending",
      pendingStep: {
        ...pendingStep,
        roll: storedRoll
      }
    };
  }

  const outcome = (pendingStep.effect.outcomes ?? []).find((entry) => {
    const [minValue, maxValue] = entry.range ?? [];
    return Number.isInteger(minValue) && Number.isInteger(maxValue)
      ? storedRoll.total >= minValue && storedRoll.total <= maxValue
      : false;
  });
  const followUp = runEncounterEffectSequence(
    gameState,
    state,
    activePlayer.id,
    [
      ...(outcome?.effects ?? []),
      ...(pendingStep.remainingEffects ?? [])
    ],
    card,
    {
      ...(pendingStep.contextPayload ?? {}),
      outcomeRoll: storedRoll
    },
    { resultText: outcome?.resultText }
  );
  const outcomeLog = createEncounterLog("logEncounterOutcomeRoll", {
    player: rollPlayer.name,
    total: storedRoll.total
  });
  if (!followUp) {
    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [outcomeLog],
      resultText: outcome?.resultText ?? null,
      status: "resolved",
      pendingStep: null
    };
  }

  return {
    ...followUp,
    logEntries: [outcomeLog, ...(followUp.logEntries ?? [])]
  };
}

function createDriveComparisonPreviewStep(gameState, state, activePlayer, effect, payload = {}) {
  const scoringState = {
    ...gameState,
    players: state.players,
    board: state.board
  };
  const targetPlayer = getNeighborPlayer(scoringState, activePlayer.id, effect.neighborOffset ?? 1);
  if (!targetPlayer) return null;

  const active = createDriveComparisonPlayerEntry(scoringState, activePlayer);
  const target = createDriveComparisonPlayerEntry(scoringState, targetPlayer);
  const outcome = active.effectiveDrives > target.effectiveDrives
    ? "more"
    : active.effectiveDrives === target.effectiveDrives
      ? "equal"
      : "less";

  return {
    type: "driveComparisonPreview",
    activePlayerId: activePlayer.id,
    targetPlayerId: targetPlayer.id,
    active,
    target,
    outcome,
    success: outcome !== "less",
    effect,
    contextPayload: normalizeEncounterPendingContext({
      lastSelectedResources: payload.lastSelectedResources,
      lastSelectionMode: payload.lastSelectionMode
    }),
    remainingEffects: []
  };
}

function createDriveComparisonPlayerEntry(gameState, player) {
  const physicalDrives = getRealUpgradeValue(player, "drive");
  const friendshipBonus = getFriendshipUpgradeBonus(gameState, player.id, "drive");
  return {
    playerId: player.id,
    playerName: player.name,
    physicalDrives,
    friendshipBonus,
    effectiveDrives: physicalDrives + friendshipBonus
  };
}

function resolveDualMothershipRollPending(gameState, state, activePlayer, card, pendingStep, payload = {}) {
  const activeRollPlayer = state.players.find((player) => player.id === pendingStep.activePlayerId);
  const targetRollPlayer = state.players.find((player) => player.id === pendingStep.targetPlayerId);
  if (!activeRollPlayer || !targetRollPlayer || !pendingStep.effect) return null;

  const rollerPlayerId = typeof payload.playerId === "string" ? payload.playerId : activePlayer.id;
  const isActiveRoller = rollerPlayerId === activeRollPlayer.id;
  const isTargetRoller = rollerPlayerId === targetRollPlayer.id;
  if (!isActiveRoller && !isTargetRoller) return null;

  const nextPendingStep = {
    ...pendingStep,
    activeRoll: normalizeEncounterRollResult(pendingStep.activeRoll),
    targetRoll: normalizeEncounterRollResult(pendingStep.targetRoll)
  };
  const rollKey = isActiveRoller ? "activeRoll" : "targetRoll";
  if (!nextPendingStep[rollKey]) {
    nextPendingStep[rollKey] = createEncounterRoll(payload.forcedRoll);
  }

  if (!nextPendingStep.activeRoll || !nextPendingStep.targetRoll) {
    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [],
      resultText: null,
      status: "pending",
      pendingStep: nextPendingStep
    };
  }

  return nextPendingStep.mode === "speed"
    ? resolveCompletedDualSpeedRoll(gameState, state, activeRollPlayer, targetRollPlayer, card, nextPendingStep, payload)
    : resolveCompletedDualCombatRoll(gameState, state, activeRollPlayer, targetRollPlayer, card, nextPendingStep, payload);
}

function resolveDriveComparisonPreviewPending(gameState, state, activePlayer, card, pendingStep, payload = {}) {
  if (!pendingStep.effect || !pendingStep.active || !pendingStep.target) return null;
  const effect = pendingStep.effect;
  const comparison = {
    metric: "drive",
    ownValue: pendingStep.active.effectiveDrives,
    otherValue: pendingStep.target.effectiveDrives,
    success: Boolean(pendingStep.success),
    targetPlayerId: pendingStep.targetPlayerId,
    targetName: pendingStep.target.playerName
  };
  const comparisonLog = createEncounterLog("logEncounterComparison", {
    player: pendingStep.active.playerName,
    target: pendingStep.target.playerName,
    metric: "drive",
    own: comparison.ownValue,
    other: comparison.otherValue,
    outcome: comparison.success ? "success" : "failure"
  });
  const followUp = runEncounterEffectSequence(
    gameState,
    state,
    activePlayer.id,
    [
      ...(comparison.success ? (effect.onSuccess ?? []) : (effect.onFailure ?? [])),
      ...(pendingStep.remainingEffects ?? [])
    ],
    card,
    {
      ...(pendingStep.contextPayload ?? {}),
      ...payload
    },
    {
      resultText: comparison.success ? effect.successText : effect.failureText
    }
  );
  if (!followUp) {
    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [comparisonLog],
      resultText: createEncounterComparisonResultText(comparison),
      status: "resolved",
      pendingStep: null
    };
  }
  return {
    ...followUp,
    logEntries: [comparisonLog, ...(followUp.logEntries ?? [])],
    resultText: followUp.resultText ?? createEncounterComparisonResultText(comparison)
  };
}

function resolveCompletedDualSpeedRoll(gameState, state, activePlayer, targetPlayer, card, pendingStep, payload = {}) {
  const effect = pendingStep.effect;
  const scoringState = {
    ...gameState,
    players: state.players,
    board: state.board
  };
  const ownValue = pendingStep.activeRoll.total + getPlayerFlightBonus(scoringState, activePlayer.id);
  const otherValue = pendingStep.targetRoll.total + getPlayerFlightBonus(scoringState, targetPlayer.id);
  const comparison = {
    metric: "speed",
    ownValue,
    otherValue,
    success: ownValue >= otherValue,
    targetPlayerId: targetPlayer.id,
    targetName: targetPlayer.name,
    ownRollTotal: pendingStep.activeRoll.total,
    otherRollTotal: pendingStep.targetRoll.total,
    ownBalls: pendingStep.activeRoll.balls,
    otherBalls: pendingStep.targetRoll.balls
  };
  const comparisonLog = createEncounterLog("logEncounterComparison", {
    player: activePlayer.name,
    target: targetPlayer.name,
    metric: "speed",
    own: ownValue,
    other: otherValue,
    outcome: comparison.success ? "success" : "failure"
  });
  const followUp = runEncounterEffectSequence(
    gameState,
    state,
    activePlayer.id,
    [
      ...(comparison.success ? (effect.onSuccess ?? []) : (effect.onFailure ?? [])),
      ...(pendingStep.remainingEffects ?? [])
    ],
    card,
    {
      ...(pendingStep.contextPayload ?? {}),
      ...payload,
      activeRoll: pendingStep.activeRoll,
      targetRoll: pendingStep.targetRoll
    },
    {
      resultText: comparison.success ? effect.successText : effect.failureText
    }
  );
  if (!followUp) {
    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [comparisonLog],
      resultText: createEncounterComparisonResultText(comparison),
      status: "resolved",
      pendingStep: null
    };
  }
  return {
    ...followUp,
    logEntries: [comparisonLog, ...(followUp.logEntries ?? [])],
    resultText: followUp.resultText ?? createEncounterComparisonResultText(comparison)
  };
}

function resolveCompletedDualCombatRoll(gameState, state, activePlayer, targetPlayer, card, pendingStep, payload = {}) {
  const effect = pendingStep.effect;
  const scoringState = {
    ...gameState,
    players: state.players,
    board: state.board
  };
  const strength = pendingStep.activeRoll.total + getPlayerCombatBonus(scoringState, activePlayer.id);
  const enemyStrength = pendingStep.targetRoll.total + getPlayerCombatBonus(scoringState, targetPlayer.id);
  const combat = {
    enemyStrength,
    rollTotal: pendingStep.activeRoll.total,
    strength,
    balls: pendingStep.activeRoll.balls,
    opponentRollTotal: pendingStep.targetRoll.total,
    opponentBalls: pendingStep.targetRoll.balls,
    enemyPlayerId: targetPlayer.id,
    enemyName: targetPlayer.name,
    outcome: strength >= enemyStrength ? "win" : "lose"
  };
  const combatLog = createEncounterLog(
    combat.outcome === "win" ? "logEncounterCombatWin" : "logEncounterCombatLoss",
    {
      player: activePlayer.name,
      strength: combat.strength,
      enemy: combat.enemyStrength,
      target: combat.enemyName ?? ""
    }
  );
  const followUp = runEncounterEffectSequence(
    gameState,
    state,
    activePlayer.id,
    [
      ...(combat.outcome === "win" ? (effect.onWin ?? []) : (effect.onLose ?? [])),
      ...(pendingStep.remainingEffects ?? [])
    ],
    card,
    {
      ...(pendingStep.contextPayload ?? {}),
      ...payload,
      activeRoll: pendingStep.activeRoll,
      targetRoll: pendingStep.targetRoll
    },
    {
      combat,
      resultText: combat.outcome === "win" ? effect.winText : effect.loseText
    }
  );
  if (!followUp) {
    return {
      players: state.players,
      board: state.board,
      pendingGiftedTradeShips: state.pendingGiftedTradeShips,
      remainingMovementByShipId: state.remainingMovementByShipId,
      logEntries: [combatLog],
      combat,
      resultText: combat.outcome === "win" ? effect.winText : effect.loseText,
      status: "resolved",
      pendingStep: null
    };
  }
  return {
    ...followUp,
    logEntries: [combatLog, ...(followUp.logEntries ?? [])],
    combat: followUp.combat ?? combat,
    resultText: followUp.resultText ?? (combat.outcome === "win" ? effect.winText : effect.loseText)
  };
}

function resolveEncounterComparison(gameState, activePlayer, effect, payload = {}) {
  const targetPlayer = getNeighborPlayer(gameState, activePlayer.id, effect.neighborOffset ?? 1);
  if (!targetPlayer) return null;

  if (effect.metric === "speed") {
    const ownRoll = createEncounterRoll(payload.forcedRoll);
    const targetRoll = createEncounterRoll(payload.forcedOpponentRoll);
    const ownValue = ownRoll.total + getPlayerFlightBonus(gameState, activePlayer.id);
    const otherValue = targetRoll.total + getPlayerFlightBonus(gameState, targetPlayer.id);
    return {
      metric: "speed",
      ownValue,
      otherValue,
      success: ownValue >= otherValue,
      targetPlayerId: targetPlayer.id,
      targetName: targetPlayer.name
    };
  }

  const ownValue = getPlayerFlightBonus(gameState, activePlayer.id);
  const otherValue = getPlayerFlightBonus(gameState, targetPlayer.id);
  return {
    metric: "drive",
    ownValue,
    otherValue,
    success: ownValue >= otherValue,
    targetPlayerId: targetPlayer.id,
    targetName: targetPlayer.name
  };
}

function resolveEncounterCombat(gameState, player, effect, payload = {}) {
  const roll = createCombatRoll(payload.forcedRoll);
  const strength = roll.total + getPlayerCombatBonus(gameState, player.id);

  if (Number.isInteger(effect.enemyStrength)) {
    return {
      enemyStrength: effect.enemyStrength,
      rollTotal: roll.total,
      strength,
      balls: roll.balls,
      opponentRollTotal: null,
      opponentBalls: [],
      enemyPlayerId: null,
      enemyName: null,
      outcome: strength >= effect.enemyStrength ? "win" : "lose"
    };
  }

  const targetPlayer = getNeighborPlayer(gameState, player.id, effect.neighborOffset ?? 1);
  if (!targetPlayer) return null;
  const opponentRoll = createCombatRoll(payload.forcedOpponentRoll);
  const enemyStrength = opponentRoll.total + getPlayerCombatBonus(gameState, targetPlayer.id);

  return {
    enemyStrength,
    rollTotal: roll.total,
    strength,
    balls: roll.balls,
    opponentRollTotal: opponentRoll.total,
    opponentBalls: opponentRoll.balls,
    enemyPlayerId: targetPlayer.id,
    enemyName: targetPlayer.name,
    outcome: strength >= enemyStrength ? "win" : "lose"
  };
}

function createCombatRoll(forcedRoll = null) {
  return createEncounterRoll(forcedRoll);
}

function createEncounterRoll(forcedRoll = null) {
  const balls = Array.isArray(forcedRoll?.balls) && forcedRoll.balls.length === 2
    ? forcedRoll.balls
    : shuffle(mothershipBallPool).slice(0, 2);
  return {
    balls,
    total: balls.reduce((sum, ball) => sum + (mothershipBallValues[ball] ?? 0), 0)
  };
}

function updateEncounterWorkingPlayer(state, playerId, updatePlayer) {
  return {
    ...state,
    players: state.players.map((player) => player.id === playerId ? updatePlayer(player) : player)
  };
}

function applyEncounterDrawFromOpponents(state, activePlayerId, amountPerOpponent) {
  const players = state.players.map((player) => ({
    ...player,
    resources: normalizeResources(player.resources)
  }));
  const activePlayer = players.find((player) => player.id === activePlayerId);
  if (!activePlayer) {
    return { state, drawCount: 0 };
  }

  let drawCount = 0;
  for (const player of players) {
    if (player.id === activePlayerId) continue;
    for (let index = 0; index < amountPerOpponent; index += 1) {
      const resource = drawRandomResource(player.resources);
      if (!resource) break;
      player.resources[resource] = Math.max(0, (player.resources[resource] ?? 0) - 1);
      activePlayer.resources[resource] = (activePlayer.resources[resource] ?? 0) + 1;
      drawCount += 1;
    }
  }

  return {
    state: {
      ...state,
      players
    },
    drawCount
  };
}

function applyEncounterShipGift(gameState, state, activePlayerId, shipType) {
  if (!["colonyShip", "tradeShip"].includes(shipType)) {
    return { state };
  }

  const tempGameState = {
    ...gameState,
    players: state.players,
    board: state.board
  };
  const inventory = getPlayerInventory(tempGameState, activePlayerId);
  const stockKey = shipType === "tradeShip" ? "tradeStation" : "colony";
  const shipVariant = getNextAvailableShipVariant(state.board?.ships, activePlayerId);
  if (!shipVariant || (inventory.transporter?.available ?? 0) <= 0 || (inventory[stockKey]?.available ?? 0) <= 0) {
    return {
      state: addPendingGiftedShip(state, activePlayerId, shipType),
      logEntries: [createEncounterLog("logEncounterShipGiftPending", {
        player: getPlayerNameById(state.players, activePlayerId),
        ship: shipType
      })]
    };
  }

  const launchPoint = findFreeLaunchPoint(tempGameState, defaultBoardLayout, activePlayerId);
  if (!launchPoint) {
    return {
      state: addPendingGiftedShip(state, activePlayerId, shipType),
      logEntries: [createEncounterLog("logEncounterShipGiftPending", {
        player: getPlayerNameById(state.players, activePlayerId),
        ship: shipType
      })]
    };
  }

  const ship = {
    id: createId(shipType === "tradeShip" ? "trade-ship" : "colony-ship"),
    ownerPlayerId: activePlayerId,
    type: shipType,
    shipVariant,
    coilCount: shipVariant,
    locationId: launchPoint.id,
    status: "docked"
  };

  return {
    state: {
      ...state,
      board: {
        ...state.board,
        ships: [...normalizeShips(state.board?.ships), ship]
      },
      remainingMovementByShipId: {
        ...state.remainingMovementByShipId,
        [ship.id]: getGiftedShipInitialMovement(gameState, activePlayerId)
      }
    },
    logEntries: [createEncounterLog("logEncounterShipGift", {
      player: getPlayerNameById(state.players, activePlayerId),
      ship: shipType
    })]
  };
}

function addPendingGiftedShip(state, ownerPlayerId, shipType) {
  return {
    ...state,
    pendingGiftedTradeShips: [
      ...(state.pendingGiftedTradeShips ?? []),
      {
        id: createId("pending-gifted-ship"),
        ownerPlayerId,
        shipType: shipType === "colonyShip" ? "colonyShip" : "tradeShip"
      }
    ]
  };
}

function getGiftedShipInitialMovement(gameState, ownerPlayerId) {
  const activePlayer = gameState.players?.[gameState.currentPlayerIndex];
  if (
    gameState.phase !== "flight" ||
    activePlayer?.id !== ownerPlayerId ||
    gameState.activeEncounter?.status === "resolved"
  ) {
    return 0;
  }

  const remainingSpeed = Number(gameState.flightSpeedTotal);
  return Number.isFinite(remainingSpeed) ? Math.max(0, remainingSpeed) : 0;
}

function placePendingGiftedShips(gameState, boardLayout) {
  const pendingShips = normalizePendingGiftedTradeShips(gameState.pendingGiftedTradeShips, gameState.players);
  if (pendingShips.length === 0) return gameState;

  let workingState = {
    ...gameState,
    board: {
      ...gameState.board,
      ships: normalizeShips(gameState.board?.ships)
    }
  };
  const remainingPendingShips = [];
  const logEntries = [];

  for (const pendingShip of pendingShips) {
    const playerName = getPlayerNameById(workingState.players, pendingShip.ownerPlayerId);
    const inventory = getPlayerInventory(workingState, pendingShip.ownerPlayerId);
    const stockKey = pendingShip.shipType === "tradeShip" ? "tradeStation" : "colony";
    const shipVariant = getNextAvailableShipVariant(workingState.board?.ships, pendingShip.ownerPlayerId);
    const launchPoint = findFreeLaunchPoint(workingState, boardLayout, pendingShip.ownerPlayerId);

    if (
      !shipVariant ||
      !launchPoint ||
      (inventory.transporter?.available ?? 0) <= 0 ||
      (inventory[stockKey]?.available ?? 0) <= 0
    ) {
      remainingPendingShips.push(pendingShip);
      continue;
    }

    const ship = {
      id: createId(pendingShip.shipType === "tradeShip" ? "trade-ship" : "colony-ship"),
      ownerPlayerId: pendingShip.ownerPlayerId,
      type: pendingShip.shipType,
      shipVariant,
      coilCount: shipVariant,
      locationId: launchPoint.id,
      status: "docked"
    };
    workingState = {
      ...workingState,
      board: {
        ...workingState.board,
        ships: [...normalizeShips(workingState.board?.ships), ship]
      },
      remainingMovementByShipId: {
        ...(workingState.remainingMovementByShipId ?? {}),
        [ship.id]: getGiftedShipInitialMovement(gameState, pendingShip.ownerPlayerId)
      }
    };
    logEntries.push(createEncounterLog("logEncounterShipGift", {
      player: playerName,
      ship: pendingShip.shipType
    }));
  }

  if (remainingPendingShips.length === pendingShips.length && logEntries.length === 0) {
    return {
      ...gameState,
      pendingGiftedTradeShips: remainingPendingShips
    };
  }

  return updateGameState(workingState, {
    pendingGiftedTradeShips: remainingPendingShips,
    board: workingState.board,
    remainingMovementByShipId: workingState.remainingMovementByShipId,
    logEntries
  });
}

function applyEncounterShipBlock(state, activePlayerId) {
  const ships = getEncounterBlockableShips(state, activePlayerId);
  const blockedShip = ships[0];
  if (!blockedShip) {
    return {
      state,
      logEntries: [createEncounterLog("logEncounterNoShipBlocked", {
        player: getPlayerNameById(state.players, activePlayerId)
      })]
    };
  }

  return {
    state: {
      ...state,
      remainingMovementByShipId: {
        ...state.remainingMovementByShipId,
        [blockedShip.id]: 0
      }
    },
    logEntries: [createEncounterLog("logEncounterShipBlocked", {
      player: getPlayerNameById(state.players, activePlayerId),
      ship: blockedShip.type
    })]
  };
}

function getEncounterBlockableShips(state, activePlayerId) {
  return normalizeShips(state.board?.ships)
    .filter((ship) => ship.ownerPlayerId === activePlayerId)
    .sort(compareShipsForOrdinal);
}

function getEncounterJumpShips(state, activePlayerId) {
  return normalizeShips(state.board?.ships)
    .filter((ship) => ship.ownerPlayerId === activePlayerId)
    .sort(compareShipsForOrdinal);
}

function getEncounterJumpTargets(gameState, shipId, boardLayout) {
  const ship = getShipById(gameState, shipId);
  if (!ship) return [];
  const ships = normalizeShips(gameState.board?.ships);
  const structures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout);
  const hiddenBlockedNodeIds = getHiddenPlanetSystemBlockedNodeIds(gameState, boardLayout);

  return (boardLayout.points ?? [])
    .filter((point) => point.id !== ship.locationId)
    .filter((point) => !isNodeOccupied(ships, structures, point.id, ship.id))
    .filter((point) => {
      const destinationState = getShipDestinationState(gameState, boardLayout, shipId, point.id);
      return destinationState.validDestination || hiddenBlockedNodeIds.has(point.id);
    })
    .map((point) => point.id);
}

function getShipById(gameState, shipId) {
  return normalizeShips(gameState.board?.ships).find((ship) => ship.id === shipId) ?? null;
}

function resolveEncounterJumpLandingNode(gameState, boardLayout, ship, targetNodeId) {
  const directDestination = getShipDestinationState(gameState, boardLayout, ship.id, targetNodeId);
  if (directDestination.validDestination) return targetNodeId;

  const hiddenBlockedNodeIds = getHiddenPlanetSystemBlockedNodeIds(gameState, boardLayout);
  if (!hiddenBlockedNodeIds.has(targetNodeId)) return null;

  const originPoint = (boardLayout.points ?? []).find((point) => point.id === ship.locationId);
  const connectedNodeIds = getConnectedNodeIds(boardLayout, targetNodeId);
  const candidates = connectedNodeIds
    .map((nodeId) => ({
      nodeId,
      point: (boardLayout.points ?? []).find((point) => point.id === nodeId),
      destination: getShipDestinationState(gameState, boardLayout, ship.id, nodeId)
    }))
    .filter((candidate) => candidate.point && candidate.destination.validDestination)
    .sort((left, right) => {
      const leftDistance = getPointDistance(originPoint, left.point);
      const rightDistance = getPointDistance(originPoint, right.point);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      return String(left.nodeId).localeCompare(String(right.nodeId));
    });

  return candidates[0]?.nodeId ?? null;
}

function getConnectedNodeIds(boardLayout, nodeId) {
  const connected = new Set();
  for (const connection of boardLayout.connections ?? []) {
    if (connection.from === nodeId) connected.add(connection.to);
    if (connection.to === nodeId) connected.add(connection.from);
  }
  return [...connected];
}

function getPointDistance(left, right) {
  if (!left || !right) return Number.POSITIVE_INFINITY;
  return Math.hypot((left.x ?? 0) - (right.x ?? 0), (left.y ?? 0) - (right.y ?? 0));
}

function getHiddenPlanetSystemBlockedNodeIds(gameState, boardLayout) {
  const exploredSystemIds = new Set(normalizeExploredSystems(
    gameState.board?.exploredSystems,
    boardLayout,
    getPlacedPlanetSystems(gameState, boardLayout)
  ));
  return new Set(getPlacedPlanetSystems(gameState, boardLayout)
    .filter((system) => !exploredSystemIds.has(system.id))
    .flatMap((system) => system.blockedNodeIds ?? []));
}

function createEncounterComparisonResultText(comparison) {
  const outcomeDe = comparison.success ? "erfolgreich" : "nicht erfolgreich";
  const outcomeEn = comparison.success ? "successful" : "not successful";
  return {
    de: `Prüfung: ${comparison.metric === "speed" ? "Geschwindigkeit" : "Antrieb"} gegen ${comparison.targetName}: ${comparison.ownValue} zu ${comparison.otherValue} (${outcomeDe}).`,
    en: `Check: ${comparison.metric === "speed" ? "speed" : "drive"} against ${comparison.targetName}: ${comparison.ownValue} to ${comparison.otherValue} (${outcomeEn}).`
  };
}

function createDriveComparisonPreviewText(pendingStep) {
  const activeName = pendingStep.active?.playerName ?? "";
  const targetName = pendingStep.target?.playerName ?? "";
  if (pendingStep.outcome === "more") {
    return {
      de: `${activeName} hat mehr Antriebe als ${targetName}.`,
      en: `${activeName} has more drives than ${targetName}.`
    };
  }
  if (pendingStep.outcome === "equal") {
    return {
      de: `${activeName} hat gleich viele Antriebe wie ${targetName}.`,
      en: `${activeName} has the same number of drives as ${targetName}.`
    };
  }
  return {
    de: `${activeName} hat weniger Antriebe als ${targetName}.`,
    en: `${activeName} has fewer drives than ${targetName}.`
  };
}

function getPlayerUpgradeTotal(player) {
  return ["drive", "cargo", "cannon"]
    .reduce((sum, type) => sum + getRealUpgradeValue(player, type), 0);
}

function hasAnyUpgrades(player) {
  return ["drive", "cargo", "cannon"]
    .some((type) => getRealUpgradeValue(player, type) > 0);
}

function getNeighborPlayer(gameState, playerId, offset) {
  const players = Array.isArray(gameState.players) ? gameState.players : [];
  if (players.length === 0) return null;
  const playerIndex = players.findIndex((player) => player.id === playerId);
  if (playerIndex < 0) return null;

  const normalizedOffset = Number.isInteger(offset) ? offset : 1;
  if (players.length === 2 && normalizedOffset !== 0) {
    return players.find((player) => player.id !== playerId) ?? null;
  }
  const targetIndex = (playerIndex + normalizedOffset + players.length * 10) % players.length;
  return players[targetIndex] ?? null;
}

function createEncounterLog(messageKey, messageParams) {
  return {
    type: "encounter",
    messageKey,
    messageParams
  };
}

function getEncounterResourceSelectionLogKey(mode, count) {
  const suffix = count === 1 ? "One" : "Many";
  return mode === "loss"
    ? `logEncounterResourceSelectionLoss${suffix}`
    : `logEncounterResourceSelectionGain${suffix}`;
}

function formatResourceList(resources) {
  return resources.join(", ");
}

function getPlayerById(gameState, playerId) {
  return Array.isArray(gameState?.players)
    ? gameState.players.find((player) => player.id === playerId) ?? null
    : null;
}

function getFriendshipCardsForPlayer(player) {
  return normalizeFriendshipCards(player?.friendshipCards)
    .map((cardId) => getFriendshipCardById(cardId))
    .filter(Boolean);
}

function getSevenDiscardThresholdForPlayer(gameState, playerId) {
  return getFriendshipCardsForPlayer(getPlayerById(gameState, playerId))
    .reduce((threshold, card) => (
      card.implemented && card.effectType === "sevenDiscardThreshold"
        ? Math.max(threshold, card.effectValue?.threshold ?? 7)
        : threshold
    ), 7);
}

function getTradeRateCardForResource(gameState, playerId, resource, rate) {
  return getFriendshipCardsForPlayer(getPlayerById(gameState, playerId))
    .find((card) => (
      card.implemented &&
      card.effectType === "tradeRate" &&
      card.effectValue?.resource === resource &&
      card.effectValue?.rate === rate &&
      card.effectValue?.oncePerTurn
    )) ?? null;
}

function isFriendshipTurnActionUsed(gameState, actionKey) {
  const state = normalizeFriendshipTurnState(gameState.friendshipTurnState, gameState);
  return state.turnKey === getTurnKey(gameState) && state.usedActionKeys.includes(actionKey);
}

function markFriendshipTurnAction(gameState, actionKey) {
  const currentState = normalizeFriendshipTurnState(gameState.friendshipTurnState, gameState);
  const turnKey = getTurnKey(gameState);
  const usedActionKeys = currentState.turnKey === turnKey ? currentState.usedActionKeys : [];
  return {
    turnKey,
    usedActionKeys: [...new Set([...usedActionKeys, actionKey])]
  };
}

function grantFriendshipCardToPlayer(players, playerId, cardId) {
  return players.map((player) => player.id === playerId
    ? {
      ...player,
      friendshipCards: [...normalizeFriendshipCards(player.friendshipCards), cardId]
    }
    : player);
}

function removeFriendshipCardFromOutposts(outposts, outpostId, cardId) {
  return (outposts ?? []).map((outpost) => outpost.id === outpostId
    ? {
      ...outpost,
      friendshipCards: Array.isArray(outpost.friendshipCards)
        ? outpost.friendshipCards.filter((entry) => entry !== cardId)
        : []
    }
    : outpost);
}

function applyFriendshipCardOnGain(players, playerId, card) {
  if (!card?.implemented || card.timing !== "onGain") return players;

  return players.map((player) => {
    if (player.id !== playerId) return player;
    if (card.effectType === "gainHalfMedal") {
      return withHalfMedalDelta(player, card.effectValue?.halfMedals ?? 1);
    }
    if (card.effectType === "gainUpgrade") {
      return withUpgradeDelta(player, card.effectValue?.upgrade, card.effectValue?.amount ?? 1);
    }
    if (card.effectType === "gainResource") {
      return withResourceDelta(player, card.effectValue?.resource, card.effectValue?.amount ?? 1);
    }
    return player;
  });
}

function createFriendshipCardGainLogEntry(playerName, cardId) {
  return {
    type: "friendship",
    messageKey: "logFriendshipCardGained",
    messageParams: {
      player: playerName,
      card: cardId
    }
  };
}

function countResources(resources) {
  return Object.values(normalizeResources(resources)).reduce((sum, value) => sum + value, 0);
}

function withResourceDelta(player, resource, delta) {
  return {
    ...player,
    resources: {
      ...normalizeResources(player.resources),
      [resource]: Math.max(0, (player.resources?.[resource] ?? 0) + delta)
    }
  };
}

function withHalfMedalDelta(player, delta) {
  const previousHalfMedals = Math.max(0, player.halfMedals ?? 0);
  const nextHalfMedals = Math.max(0, previousHalfMedals + delta);

  return {
    ...player,
    halfMedals: nextHalfMedals
  };
}

function withUpgradeDelta(player, upgrade, delta) {
  if (!isValidUpgradeId(upgrade)) return player;
  const limit = upgradeDefinitions.find((definition) => definition.id === upgrade)?.limit ?? 0;
  const current = player.upgrades?.[upgrade] ?? 0;
  const next = Math.min(limit, Math.max(0, current + delta));

  return {
    ...player,
    upgrades: {
      ...normalizeUpgrades(player.upgrades),
      [upgrade]: next
    }
  };
}

function getAvailablePhysicalUpgradeIds(player, amount = 1) {
  const safeAmount = Number.isInteger(amount) ? Math.max(1, amount) : 1;
  return upgradeDefinitions
    .filter((definition) => getRealUpgradeValue(player, definition.id) + safeAmount <= definition.limit)
    .map((definition) => definition.id);
}

function isValidUpgradeId(upgrade) {
  return ["drive", "cargo", "cannon"].includes(upgrade);
}

function getPlayerFlightBonus(gameState, playerId) {
  return getEffectiveUpgradeValue(gameState, playerId, "drive");
}

function createRemainingMovementForActiveShips(gameState, totalSpeed, movementOverrides = null) {
  const activePlayer = gameState.players?.[gameState.currentPlayerIndex];
  if (!activePlayer || !Number.isFinite(totalSpeed)) return {};
  const blockedShipIds = new Set(gameState.supernova?.blockedShipIds ?? []);

  return Object.fromEntries(
    normalizeShips(gameState.board?.ships)
      .filter((ship) => ship.ownerPlayerId === activePlayer.id)
      .map((ship) => [
        ship.id,
        blockedShipIds.has(ship.id) || movementOverrides?.[ship.id] === 0 ? 0 : totalSpeed
      ])
  );
}

function createPostEncounterFlightSpeedUpdate(gameState) {
  const activePlayer = gameState.players?.[gameState.currentPlayerIndex];
  const baseSpeed = Number(gameState.flightSpeedBase);
  if (!activePlayer || !Number.isFinite(baseSpeed)) return null;

  const driveLevel = getPlayerFlightBonus(gameState, activePlayer.id);
  const totalSpeed = baseSpeed + driveLevel;
  return {
    driveLevel,
    totalSpeed,
    remainingMovementByShipId: createRemainingMovementForActiveShips(
      gameState,
      totalSpeed,
      gameState.remainingMovementByShipId
    )
  };
}

function getPlayerCombatBonus(gameState, playerId) {
  const battleShipBonus = isSupernovaGame(gameState)
    ? normalizeShips(gameState.board?.ships)
      .filter((ship) => ship.ownerPlayerId === playerId && ship.type === "battleShip")
      .length
    : 0;
  return getEffectiveUpgradeValue(gameState, playerId, "cannon") + battleShipBonus;
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
  const nextState = {
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

  return finalizeDerivedState(nextState);
}

function finalizeDerivedState(gameState) {
  const stateWithSupernova = isSupernovaGame(gameState)
    ? {
      ...gameState,
      supernova: recalculateSupernovaState(gameState)
    }
    : {
      ...gameState,
      gameVariant: gameVariants.classic,
      supernova: null
    };
  const players = syncCalculatedVictoryPoints(stateWithSupernova);
  const finalizedState = {
    ...stateWithSupernova,
    players
  };
  const activePlayer = players[finalizedState.currentPlayerIndex];
  const activePlayerWins = isSupernovaGame(finalizedState)
    ? activePlayer && activePlayer.victoryPoints >= 15 && hasFulfilledSupernovaMission(finalizedState, activePlayer.id)
    : activePlayer && activePlayer.victoryPoints >= 15;

  if (finalizedState.phase !== "gameOver" && activePlayerWins) {
    return {
      ...finalizedState,
      phase: "gameOver",
      gameOver: true,
      winnerPlayerId: activePlayer.id
    };
  }

  return {
    ...finalizedState,
    gameOver: finalizedState.phase === "gameOver" || Boolean(finalizedState.gameOver),
    winnerPlayerId: finalizedState.phase === "gameOver"
      ? (finalizedState.winnerPlayerId ?? activePlayer?.id ?? null)
      : null
  };
}

function syncCalculatedVictoryPoints(gameState) {
  return (gameState.players ?? []).map((player) => ({
    ...player,
    stock: getPlayerInventory(gameState, player.id),
    victoryPoints: calculateVictoryPoints(gameState, player.id)
  }));
}

function createStartingStructures(playerCount, boardLayout) {
  const sitesById = createStartSiteLookup(boardLayout);
  const assignments = (boardLayout.startAssignments ?? []).slice(0, playerCount);

  const playerStructures = assignments.flatMap((assignment) => {
    const ownerPlayerId = `player-${assignment.playerIndex + 1}`;
    return assignment.structures.map((structure, index) => {
      const site = sitesById.get(structure.locationId);

      return {
        id: `${ownerPlayerId}-${structure.type}-${index + 1}`,
        ownerPlayerId,
        type: structure.type,
        locationId: site?.nodeId ?? structure.locationId,
        systemId: site?.systemId ?? null,
        adjacentPlanetIds: site?.adjacentPlanetIds ?? []
      };
    });
  });

  return [...playerStructures, ...createNeutralStartingStructures(playerCount, boardLayout)];
}

function createNeutralStartingStructures(playerCount, boardLayout, players = []) {
  if (playerCount !== 3) return [];

  const neutralAssignment = (boardLayout.startAssignments ?? [])[3];
  if (!neutralAssignment) return [];

  const usedColors = new Set(
    players.length > 0
      ? players.map((player) => player.color)
      : playerColorKeys.slice(0, playerCount)
  );
  const neutralColor = playerColorKeys.find((color) => !usedColors.has(color)) ?? playerColorKeys[3];
  const sitesById = createStartSiteLookup(boardLayout);

  return neutralAssignment.structures.map((structure, index) => {
    const site = sitesById.get(structure.locationId);
    return {
      id: `neutral-player-${structure.type}-${index + 1}`,
      ownerPlayerId: "neutral-player",
      type: structure.type,
      locationId: site?.nodeId ?? structure.locationId,
      systemId: site?.systemId ?? null,
      adjacentPlanetIds: site?.adjacentPlanetIds ?? [],
      isNeutral: true,
      color: neutralColor
    };
  });
}

function createStartSiteLookup(boardLayout) {
  return new Map((boardLayout.startSites ?? []).flatMap((site) => [
    [site.id, site],
    [site.nodeId, site]
  ]));
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
      shipVariant: 1,
      coilCount: 1,
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
  if (!Array.isArray(structures) && useFallback) {
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
      isNeutral: Boolean(structure.isNeutral),
      color: playerColorKeys.includes(structure.color) ? structure.color : null,
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
    emptySlots: boardLayout.emptySlots ?? [],
    placedQuadrants: boardLayout.placedQuadrants ?? [],
    unusedQuadrant: boardLayout.unusedQuadrant ?? null
  };
}

function normalizeBoardPlacement(boardState, boardLayout) {
  if (Array.isArray(boardState?.placedSystems) && Array.isArray(boardState?.placedOutposts)) {
    return enrichBoardPlacement(boardLayout, normalizePlacementObject({
      placedSystems: boardState.placedSystems,
      placedOutposts: boardState.placedOutposts,
      emptySlots: boardState.emptySlots,
      placedQuadrants: boardState.placedQuadrants,
      unusedQuadrant: boardState.unusedQuadrant
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
    emptySlots: Array.isArray(placement?.emptySlots) ? placement.emptySlots : [],
    placedQuadrants: Array.isArray(placement?.placedQuadrants) ? placement.placedQuadrants : [],
    unusedQuadrant: placement?.unusedQuadrant && typeof placement.unusedQuadrant === "object"
      ? placement.unusedQuadrant
      : null
  };
}

function updatePlacedQuadrantDiscovery(placedQuadrants = [], {
  exploredSystems = [],
  exploredOutposts = [],
  exploredEmptySlots = []
} = {}) {
  const exploredSystemIds = new Set(exploredSystems);
  const exploredOutpostIds = new Set(exploredOutposts);
  const exploredEmptySlotIds = new Set(exploredEmptySlots);
  return (placedQuadrants ?? []).map((quadrant) => ({
    ...quadrant,
    discovered:
      (quadrant.type === "planetSystem" && exploredSystemIds.has(quadrant.contentId)) ||
      (quadrant.type === "outpost" && exploredOutpostIds.has(quadrant.contentId)) ||
      (quadrant.type === "empty" && exploredEmptySlotIds.has(quadrant.slotId))
  }));
}

function getPlacedPlanetSystems(gameState, boardLayout) {
  return Array.isArray(gameState.board?.placedSystems)
    ? gameState.board.placedSystems
    : (boardLayout.planetSystems ?? []);
}

function getExploredPlanetSystems(gameState, boardLayout) {
  const exploredSystemIds = new Set(normalizeExploredSystems(
    gameState.board?.exploredSystems,
    boardLayout,
    getPlacedPlanetSystems(gameState, boardLayout)
  ));
  return getPlacedPlanetSystems(gameState, boardLayout)
    .filter((system) => exploredSystemIds.has(system.id));
}

function getGameColonySites(gameState, boardLayout) {
  return [
    ...(boardLayout.startSites ?? []),
    ...getExploredPlanetSystems(gameState, boardLayout).flatMap((system) => system.colonySites ?? [])
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

function normalizeExploredOutposts(exploredOutposts, placedOutposts = []) {
  const knownOutpostIds = new Set((placedOutposts ?? []).map((outpost) => outpost.id));
  return [...new Set(Array.isArray(exploredOutposts) ? exploredOutposts : [])]
    .filter((outpostId) => knownOutpostIds.has(outpostId));
}

function normalizeExploredEmptySlots(exploredEmptySlots, emptySlots = []) {
  const knownEmptySlotIds = new Set(emptySlots ?? []);
  return [...new Set(Array.isArray(exploredEmptySlots) ? exploredEmptySlots : [])]
    .filter((slotId) => knownEmptySlotIds.has(slotId));
}

function normalizeShips(ships = []) {
  return Array.isArray(ships)
    ? ships
      .filter((ship) => ship && ship.id && ship.ownerPlayerId && ship.locationId)
      .map((ship) => {
        const shipVariant = getShipVariant(ship);
        return {
          id: ship.id,
          ownerPlayerId: ship.ownerPlayerId,
          type: ["tradeShip", "battleShip"].includes(ship.type) ? ship.type : "colonyShip",
          shipVariant,
          coilCount: shipVariant,
          locationId: ship.locationId,
          status: ship.status === "active" ? "active" : "docked",
          blockedNextFlight: Boolean(ship.blockedNextFlight)
        };
      })
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

function normalizePendingShipPlacement(pendingShipPlacement, players = []) {
  if (!pendingShipPlacement || typeof pendingShipPlacement !== "object") return null;
  if (!["colonyShip", "tradeShip", "battleShip"].includes(pendingShipPlacement.shipType)) return null;
  const playerIds = new Set((players ?? []).map((player) => player.id));
  if (!playerIds.has(pendingShipPlacement.ownerPlayerId)) return null;

  return {
    shipType: pendingShipPlacement.shipType,
    ownerPlayerId: pendingShipPlacement.ownerPlayerId,
    cost: pendingShipPlacement.cost && typeof pendingShipPlacement.cost === "object"
      ? pendingShipPlacement.cost
      : {}
  };
}

function normalizePendingFriendshipCardSelection(pendingFriendshipCardSelection, players = []) {
  if (!pendingFriendshipCardSelection || typeof pendingFriendshipCardSelection !== "object") return null;
  const playerIds = new Set((players ?? []).map((player) => player.id));
  if (!playerIds.has(pendingFriendshipCardSelection.ownerPlayerId)) return null;

  return {
    ownerPlayerId: pendingFriendshipCardSelection.ownerPlayerId,
    outpostId: typeof pendingFriendshipCardSelection.outpostId === "string" ? pendingFriendshipCardSelection.outpostId : null,
    availableCardIds: Array.isArray(pendingFriendshipCardSelection.availableCardIds)
      ? pendingFriendshipCardSelection.availableCardIds.filter((cardId) => typeof cardId === "string")
      : [],
    grantedStationId: typeof pendingFriendshipCardSelection.grantedStationId === "string"
      ? pendingFriendshipCardSelection.grantedStationId
      : null
  };
}

function normalizePendingFriendshipAction(pendingFriendshipAction, players = []) {
  if (!pendingFriendshipAction || typeof pendingFriendshipAction !== "object") return null;
  const playerIds = new Set((players ?? []).map((player) => player.id));
  if (!playerIds.has(pendingFriendshipAction.ownerPlayerId)) return null;

  if (pendingFriendshipAction.type === "galacticAid") {
    return {
      type: "galacticAid",
      ownerPlayerId: pendingFriendshipAction.ownerPlayerId,
      amount: Number.isInteger(pendingFriendshipAction.amount) ? Math.max(1, pendingFriendshipAction.amount) : 1,
      cardId: typeof pendingFriendshipAction.cardId === "string" ? pendingFriendshipAction.cardId : null
    };
  }

  return null;
}

function normalizePendingTradeStationPlacement(pendingTradeStationPlacement, players = []) {
  if (!pendingTradeStationPlacement || typeof pendingTradeStationPlacement !== "object") return null;
  const playerIds = new Set((players ?? []).map((player) => player.id));
  if (!playerIds.has(pendingTradeStationPlacement.ownerPlayerId)) return null;

  return {
    shipId: typeof pendingTradeStationPlacement.shipId === "string" ? pendingTradeStationPlacement.shipId : null,
    ownerPlayerId: pendingTradeStationPlacement.ownerPlayerId,
    outpostId: typeof pendingTradeStationPlacement.outpostId === "string" ? pendingTradeStationPlacement.outpostId : null,
    requiredCargo: Number.isInteger(pendingTradeStationPlacement.requiredCargo) ? pendingTradeStationPlacement.requiredCargo : 1,
    availableDockIds: Array.isArray(pendingTradeStationPlacement.availableDockIds)
      ? pendingTradeStationPlacement.availableDockIds.filter((dockId) => typeof dockId === "string")
      : []
  };
}

function normalizePendingSpaceportUpgrade(pendingSpaceportUpgrade, players = []) {
  if (!pendingSpaceportUpgrade || typeof pendingSpaceportUpgrade !== "object") return null;
  const playerIds = new Set((players ?? []).map((player) => player.id));
  if (!playerIds.has(pendingSpaceportUpgrade.ownerPlayerId)) return null;

  return {
    ownerPlayerId: pendingSpaceportUpgrade.ownerPlayerId,
    cost: pendingSpaceportUpgrade.cost && typeof pendingSpaceportUpgrade.cost === "object"
      ? pendingSpaceportUpgrade.cost
      : {}
  };
}

function normalizeFriendshipCards(friendshipCards) {
  return Array.isArray(friendshipCards) ? friendshipCards.filter((cardId) => typeof cardId === "string") : [];
}

function normalizeFriendshipMarkers(friendshipMarkers) {
  return Array.isArray(friendshipMarkers) ? friendshipMarkers.filter((markerId) => typeof markerId === "string") : [];
}

function normalizeSpecialMedals(specialMedals) {
  return Array.isArray(specialMedals) ? [...new Set(specialMedals.filter((medalId) => typeof medalId === "string"))] : [];
}

function hydrateLegacySpecialMedals(player, structures) {
  const specialMedals = normalizeSpecialMedals(player.specialMedals);
  if (specialMedals.length > 0) {
    return {
      ...player,
      specialMedals
    };
  }

  const ownedStructures = (structures ?? []).filter((structure) => structure.ownerPlayerId === player.id);
  const baseStructurePoints = ownedStructures.reduce((sum, structure) => {
    if (structure.type === "spaceport") return sum + 2;
    if (structure.type === "colony") return sum + 1;
    return sum;
  }, 0);
  const knownPoints =
    baseStructurePoints +
    normalizeFriendshipMarkers(player.friendshipMarkers).length * 2 +
    Math.floor(Math.max(0, player.halfMedals ?? 0) / 2);
  const legacySpecialCount = Math.max(0, (player.victoryPoints ?? 0) - knownPoints);

  return {
    ...player,
    specialMedals: Array.from({ length: legacySpecialCount }, (_, index) => `legacy-special-${player.id}-${index + 1}`)
  };
}

function normalizeActiveTradeOffer(activeTradeOffer, players = []) {
  if (!activeTradeOffer || typeof activeTradeOffer !== "object") return null;
  const playerIds = new Set((players ?? []).map((player) => player.id));
  if (!playerIds.has(activeTradeOffer.fromPlayerId) || !playerIds.has(activeTradeOffer.toPlayerId)) return null;

  return {
    offerId: activeTradeOffer.offerId || createId("trade-offer"),
    fromPlayerId: activeTradeOffer.fromPlayerId,
    toPlayerId: activeTradeOffer.toPlayerId,
    offeredResources: normalizeResources(activeTradeOffer.offeredResources),
    requestedResources: normalizeResources(activeTradeOffer.requestedResources),
    status: ["draft", "pending", "accepted", "declined", "cancelled"].includes(activeTradeOffer.status)
      ? activeTradeOffer.status
      : "pending",
    createdAt: activeTradeOffer.createdAt || new Date().toISOString()
  };
}

function normalizeFriendshipTurnState(friendshipTurnState, gameState) {
  const fallback = createFriendshipTurnState(getTurnKey(gameState));
  if (!friendshipTurnState || typeof friendshipTurnState !== "object") return fallback;

  return {
    turnKey: typeof friendshipTurnState.turnKey === "string" ? friendshipTurnState.turnKey : fallback.turnKey,
    usedActionKeys: Array.isArray(friendshipTurnState.usedActionKeys)
      ? [...new Set(friendshipTurnState.usedActionKeys.filter((entry) => typeof entry === "string"))]
      : []
  };
}

function findFreeLaunchPoint(gameState, boardLayout, ownerPlayerId) {
  return getAvailableShipLaunchPoints(gameState, boardLayout, ownerPlayerId)[0] ?? null;
}

function getAvailableShipLaunchPoints(gameState, boardLayout, ownerPlayerId) {
  const occupiedLocationIds = new Set([
    ...normalizeShips(gameState.board?.ships).map((ship) => ship.locationId),
    ...normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout, { useFallback: false })
      .map((structure) => structure.locationId)
  ]);
  const ownerStructures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout, { useFallback: false })
    .filter((structure) => structure.ownerPlayerId === ownerPlayerId);
  const ownSpaceportLocationIds = new Set(
    ownerStructures
      .filter((structure) => structure.type === "spaceport")
      .map((structure) => structure.locationId)
  );

  return (boardLayout.spaceportLaunchPoints ?? [])
    .filter((point) => ownSpaceportLocationIds.has(point.spaceportLocationId) && !occupiedLocationIds.has(point.id));
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

function findUpgradeableColonies(gameState, ownerPlayerId) {
  return normalizeStructures(gameState.board?.structures, gameState.playerCount, { startSites: [], startAssignments: [] })
    .filter((structure) => structure.ownerPlayerId === ownerPlayerId && structure.type === "colony");
}

function updatePlayerById(players, playerId, updatePlayer) {
  return players.map((player) => player.id === playerId ? updatePlayer(player) : player);
}

function syncPlayersWithBoardAssets(players, structures, ships) {
  return players.map((player) => ({
    ...player,
    structures: structures.filter((structure) => structure.ownerPlayerId === player.id),
    ships: ships.filter((ship) => ship.ownerPlayerId === player.id),
    stations: structures.filter((structure) => structure.ownerPlayerId === player.id && structure.type === "tradeStation")
  }));
}

function getPlacedOutposts(gameState, boardLayout) {
  return Array.isArray(gameState.board?.placedOutposts)
    ? gameState.board.placedOutposts
    : (boardLayout.outposts ?? []);
}

function getExploredOutposts(gameState, boardLayout) {
  const exploredOutpostIds = new Set(normalizeExploredOutposts(
    gameState.board?.exploredOutposts,
    getPlacedOutposts(gameState, boardLayout)
  ));
  return getPlacedOutposts(gameState, boardLayout)
    .filter((outpost) => exploredOutpostIds.has(outpost.id));
}

function getVisibleDocks(gameState, boardLayout) {
  return getExploredOutposts(gameState, boardLayout).flatMap((outpost) => outpost.docks ?? []);
}

function getDockingOutpost(gameState, boardLayout, nodeId) {
  return getExploredOutposts(gameState, boardLayout)
    .find((outpost) => outpost.dockNodeId === nodeId) ?? null;
}

function getAvailableOutpostDocks(gameState, boardLayout, outpostId, structures) {
  if (!outpostId) return [];
  const occupiedDockIds = new Set((structures ?? []).map((structure) => structure.dockId).filter(Boolean));
  return getVisibleDocks(gameState, boardLayout)
    .filter((dock) => dock.outpostId === outpostId && !occupiedDockIds.has(dock.id));
}

function isEnemySpaceportLaunchPoint(gameState, boardLayout, playerId, nodeId) {
  const spaceportStructures = normalizeStructures(gameState.board?.structures, gameState.playerCount, boardLayout)
    .filter((structure) => structure.type === "spaceport");

  return (boardLayout.spaceportLaunchPoints ?? []).some((launchPoint) => {
    if (launchPoint.id !== nodeId) return false;
    const spaceport = spaceportStructures.find((structure) => structure.locationId === launchPoint.spaceportLocationId);
    return Boolean(spaceport && spaceport.ownerPlayerId !== playerId);
  });
}

function applyFriendshipMarkerState(players, outposts, structures, outpostId) {
  const outpost = outposts.find((candidate) => candidate.id === outpostId);
  if (!outpost) return { players, outposts, markerChange: null };

  const stationCounts = Object.fromEntries(players.map((player) => [player.id, 0]));
  for (const structure of structures.filter((candidate) => candidate.type === "tradeStation" && candidate.outpostId === outpostId)) {
    stationCounts[structure.ownerPlayerId] = (stationCounts[structure.ownerPlayerId] ?? 0) + 1;
  }

  const occupiedEntries = Object.entries(stationCounts).filter(([, count]) => count > 0);
  if (occupiedEntries.length === 0) return { players, outposts, markerChange: null };

  const highestCount = Math.max(...occupiedEntries.map(([, count]) => count));
  const leaders = occupiedEntries.filter(([, count]) => count === highestCount);
  if (leaders.length !== 1) return { players, outposts, markerChange: null };

  const nextHolderPlayerId = leaders[0][0];
  const currentHolderPlayerId = outpost.friendshipHolderPlayerId ?? null;
  if (currentHolderPlayerId === nextHolderPlayerId) {
    return { players, outposts, markerChange: null };
  }
  if (currentHolderPlayerId && highestCount <= (stationCounts[currentHolderPlayerId] ?? 0)) {
    return { players, outposts, markerChange: null };
  }

  const updatedPlayers = players.map((player) => {
    const markers = normalizeFriendshipMarkers(player.friendshipMarkers);
    if (player.id === currentHolderPlayerId) {
      return {
        ...player,
        friendshipMarkers: markers.filter((markerId) => markerId !== outpostId)
      };
    }
    if (player.id === nextHolderPlayerId) {
      return {
        ...player,
        friendshipMarkers: [...markers.filter((markerId) => markerId !== outpostId), outpostId]
      };
    }
    return player;
  });

  return {
    players: updatedPlayers,
    outposts: outposts.map((candidate) => (
      candidate.id === outpostId
        ? { ...candidate, friendshipHolderPlayerId: nextHolderPlayerId }
        : candidate
    )),
    markerChange: {
      type: currentHolderPlayerId ? "transferred" : "granted",
      previousHolderPlayerId: currentHolderPlayerId,
      nextHolderPlayerId
    }
  };
}

function getPlayerNameById(players, playerId) {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

function getOutpostName(outpost, language = "de") {
  const labels = {
    de: {
      greenPeople: "Grünes Volk",
      diplomats: "Diplomaten",
      traders: "Händler",
      wisePeople: "Wissendes Volk"
    },
    en: {
      greenPeople: "Green People",
      diplomats: "Diplomats",
      traders: "Traders",
      wisePeople: "Wise People"
    }
  };

  return labels[language]?.[outpost?.outpostType]
    ?? labels.de[outpost?.outpostType]
    ?? outpost?.name
    ?? outpost?.id
    ?? "outpost";
}

function mergeResources(resources, additions) {
  const merged = normalizeResources(resources);
  for (const [resource, amount] of Object.entries(normalizeResources(additions))) {
    merged[resource] = (merged[resource] ?? 0) + amount;
  }
  return merged;
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
  const placedOutposts = getPlacedOutposts(gameState, boardLayout);
  const exploredOutpostIds = new Set(normalizeExploredOutposts(gameState.board?.exploredOutposts, placedOutposts));
  const exploredEmptySlotIds = new Set(normalizeExploredEmptySlots(gameState.board?.exploredEmptySlots, gameState.board?.emptySlots));
  let numberTokens = gameState.board?.numberTokens;
  const newSystems = placedSystems
    .filter((system) => !exploredSystemIds.has(system.id) && (system.adjacentNodeIds ?? []).includes(nodeId));
  const newOutposts = placedOutposts
    .filter((outpost) => !exploredOutpostIds.has(outpost.id) && (outpost.adjacentNodeIds ?? []).includes(nodeId));
  const newEmptySlots = getPlacedEmptyQuadrants(gameState)
    .filter((quadrant) => !exploredEmptySlotIds.has(quadrant.slotId) && isNodeAdjacentToSlot(boardLayout, nodeId, quadrant.slotHexIds));

  for (const system of newSystems) {
    exploredSystemIds.add(system.id);
    numberTokens = revealSystemTokens(numberTokens, system.planetIds ?? (system.planets ?? []).map((planet) => planet.id));
  }
  for (const outpost of newOutposts) {
    exploredOutpostIds.add(outpost.id);
  }
  for (const quadrant of newEmptySlots) {
    exploredEmptySlotIds.add(quadrant.slotId);
  }

  return {
    exploredSystems: [...exploredSystemIds],
    exploredOutposts: [...exploredOutpostIds],
    exploredEmptySlots: [...exploredEmptySlotIds],
    placedQuadrants: updatePlacedQuadrantDiscovery(gameState.board?.placedQuadrants, {
      exploredSystems: [...exploredSystemIds],
      exploredOutposts: [...exploredOutpostIds],
      exploredEmptySlots: [...exploredEmptySlotIds]
    }),
    numberTokens,
    logEntries: [
      ...newSystems.flatMap((system) => [
        {
          type: "exploration",
          messageKey: "logPlanetSystemDiscovered",
          messageParams: {}
        },
        ...(system.planets ?? [])
          .map((planet) => getPlanetToken(numberTokens, planet.id))
          .filter(isActiveSpecialToken)
          .map((token) => ({
            type: "exploration",
            messageKey: token.type === "pirate" ? "logPirateBaseDiscovered" : "logIcePlanetDiscovered",
            messageParams: {
              player: playerName,
              value: token.value
            }
          }))
      ]),
      ...newOutposts.map(() => ({
        type: "exploration",
        messageKey: "logOutpostDiscovered",
        messageParams: {}
      }))
    ]
  };
}

function getPlacedEmptyQuadrants(gameState) {
  return (gameState.board?.placedQuadrants ?? [])
    .filter((quadrant) => quadrant?.type === "empty" && quadrant.slotId);
}

function isNodeAdjacentToSlot(boardLayout, nodeId, slotHexIds = []) {
  const point = (boardLayout.points ?? []).find((candidate) => candidate.id === nodeId);
  if (!point) return false;
  const slotHexIdSet = new Set(slotHexIds);
  return point.hexIds?.some((hexId) => slotHexIdSet.has(hexId)) ?? false;
}

function resolveAdjacentSpecialMarkers(gameState, boardLayout, nodeId, activePlayer) {
  const point = (boardLayout.points ?? []).find((candidate) => candidate.id === nodeId);
  let numberTokens = gameState.board?.numberTokens;
  let players = gameState.players;
  const logEntries = [];
  if (!point || !activePlayer) return { numberTokens, players, logEntries };

  const adjacentPlanets = getPlacedProductionPlanets(gameState, boardLayout)
    .filter((planet) => point.hexIds?.includes(planet.coordinate));

  for (const planet of adjacentPlanets) {
    const token = getPlanetToken(numberTokens, planet.id);
    if (!isActiveSpecialToken(token)) continue;
    const requiredUpgrade = getTokenRequirementUpgrade(token);
    const effectiveValue = requiredUpgrade === "cannon"
      ? getCannonValueForPlayer(gameState, activePlayer.id)
      : getCargoValueForPlayer(gameState, activePlayer.id);
    if (effectiveValue < token.value) continue;

    const result = resolveSpecialToken(numberTokens, planet.id, activePlayer.id);
    numberTokens = result.numberTokens;
    players = players.map((player) => player.id === activePlayer.id
      ? {
        ...player,
        specialMedals: [
          ...normalizeSpecialMedals(player.specialMedals),
          `${planet.id}:${token.type}:${token.value}`
        ]
      }
      : player);
    logEntries.push({
      type: "exploration",
      messageKey: token.type === "pirate" ? "logPirateBaseCleared" : "logIcePlanetTerraformed",
      messageParams: {
        player: activePlayer.name,
        value: token.value
      }
    });
    if (result.reserveToken) {
      logEntries.push({
        type: "exploration",
        messageKey: "logReserveTokenPlaced",
        messageParams: {
          value: result.reserveToken.values.join("/")
        }
      });
    } else {
      logEntries.push({
        type: "exploration",
        messageKey: "logReserveTokenMissing",
        messageParams: {}
      });
    }
  }

  return { numberTokens, players, logEntries };
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

function isColonySiteBlockedBySpecial(gameState, colonySite) {
  return (colonySite?.adjacentPlanetIds ?? [])
    .some((planetId) => isActiveSpecialToken(getPlanetToken(gameState.board?.numberTokens, planetId)));
}

function isThreePlayerColonyLimitReached(gameState, boardLayout, systemId, structures) {
  if (gameState.playerCount !== 3 || !systemId) return false;
  if ((boardLayout.startSystems ?? []).some((system) => system.id === systemId)) return false;

  const colonySites = getGameColonySites(gameState, boardLayout);
  const sitesByLocation = new Map(colonySites.flatMap((site) => [
    [site.id, site],
    [site.nodeId, site]
  ]));
  const occupiedColonySites = structures.filter((structure) => {
    if (!["colony", "spaceport"].includes(structure.type)) return false;
    const structureSystemId = structure.systemId ?? sitesByLocation.get(structure.locationId)?.systemId;
    return structureSystemId === systemId;
  });

  return occupiedColonySites.length >= 2;
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

function getShipAtNode(ships, targetNodeId, ignoredShipId = null) {
  return normalizeShips(ships)
    .find((ship) => ship.id !== ignoredShipId && ship.locationId === targetNodeId) ?? null;
}

function distributeProduction(gameState, boardLayout, rollTotal) {
  const structures = gameState.board?.structures ?? [];
  const producingPlanets = getPlacedProductionPlanets(gameState, boardLayout)
    .filter((planet) => doesTokenProduce(getPlanetToken(gameState.board?.numberTokens, planet.id), rollTotal));
  const players = gameState.players.map((player) => ({
    ...player,
    resources: normalizeResources(player.resources)
  }));
  const playersById = new Map(players.map((player) => [player.id, player]));
  const gains = [];
  const producedResourcesByPlayerId = new Map(players.map((player) => [player.id, createEmptyResources()]));
  const productionEvents = [];
  const resourceFlashes = [];

  for (const planet of producingPlanets) {
    const productionEvent = {
      planetId: planet.id,
      systemId: planet.systemId,
      resource: planet.resource,
      rollTotal,
      recipients: []
    };

    for (const structure of structures) {
      if (!structure.adjacentPlanetIds?.includes(planet.id)) continue;
      const player = playersById.get(structure.ownerPlayerId);
      if (!player) continue;

      const amount = getSupernovaProductionAmount(gameState, player.id, planet);
      player.resources[planet.resource] = (player.resources[planet.resource] ?? 0) + amount;
      producedResourcesByPlayerId.get(player.id)[planet.resource] += amount;
      productionEvent.recipients.push({
        playerId: player.id,
        structureId: structure.id,
        resource: planet.resource,
        amount
      });
      resourceFlashes.push({
        playerId: player.id,
        resource: planet.resource,
        amount
      });
      gains.push({
        player: player.name,
        resource: planet.resource,
        amount
      });
    }

    productionEvents.push(productionEvent);
  }

  for (const player of players) {
    const producedResources = producedResourcesByPlayerId.get(player.id);
    for (const card of getFriendshipCardsForPlayer(player)) {
      if (!card.implemented || card.effectType !== "productionBonus") continue;
      const resource = card.effectValue?.resource;
      const amount = card.effectValue?.amount ?? 1;
      if (!resource || (producedResources?.[resource] ?? 0) <= 0) continue;

      player.resources[resource] = (player.resources[resource] ?? 0) + amount;
      resourceFlashes.push({
        playerId: player.id,
        resource,
        amount
      });
      gains.push({
        player: player.name,
        resource,
        amount
      });
    }
  }

  return {
    players,
    productionVfx: {
      rollTotal,
      events: productionEvents,
      resourceFlashes
    },
    gainedByPlayerId: Object.fromEntries(
      [...producedResourcesByPlayerId.entries()]
        .map(([playerId, resources]) => [playerId, countResources(resources)])
    ),
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

function getSupernovaProductionAmount(gameState, playerId, planet) {
  if (!isSupernovaGame(gameState) || !planet?.id) return 1;
  const hasMatchingFactory = (gameState.supernova?.factories ?? [])
    .some((factory) => (
      factory.ownerPlayerId === playerId &&
      factory.planetId === planet.id &&
      factory.resource === planet.resource
    ));
  return hasMatchingFactory ? 2 : 1;
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

function isGameOverState(gameState) {
  return gameState?.phase === "gameOver" || Boolean(gameState?.gameOver);
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
