import { boardLayout } from "../src/data/boardLayout.js";
import {
  buildShip,
  cancelPendingSpaceportUpgrade,
  cancelPendingTradeStationPlacement,
  cancelTradeOffer,
  confirmPendingTradeStationPlacement,
  confirmPendingSpaceportUpgrade,
  createTradeOffer,
  createGameState,
  determineFlightSpeed,
  distributeSevenSupply,
  drawSupply,
  endCurrentTurn,
  finishEncounter,
  moveShip,
  placePendingShip,
  placeInitialColony,
  placeInitialColonyShip,
  placeInitialSpaceport,
  resolveEncounterChoice,
  respondToTradeOffer,
  resolveSevenSteal,
  rollPlacementStart,
  rollProduction,
  setSevenStealTarget,
  startPendingSpaceportUpgrade,
  foundTradeStation,
  normalizeGameState,
  submitSevenDiscard,
  updateSevenDiscardSelection
} from "../src/game/gameState.js";
import { isActiveSpecialToken } from "../src/data/numberTokens.js";

function getResourceTotal(player) {
  return Object.values(player.resources ?? {}).reduce((sum, value) => sum + value, 0);
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exitCode = 1;
  }
}

function getUsedSiteNodeIds(game) {
  return new Set((game.board?.structures ?? []).map((structure) => structure.locationId));
}

function getNextFreeStartSite(game) {
  const usedNodeIds = getUsedSiteNodeIds(game);
  return boardLayout.startSites.find((site) => !usedNodeIds.has(site.nodeId));
}

function placeSpaceportAndShip(game) {
  const site = getNextFreeStartSite(game);
  game = placeInitialSpaceport(game, boardLayout, site.id);
  const selectedSite = boardLayout.startSites.find((candidate) => candidate.id === game.placement.selectedSpaceportSiteId);
  return placeInitialColonyShip(game, boardLayout, selectedSite.launchNodeIds[0]);
}

let game = createGameState({ language: "de", playerCount: 2, boardLayout });

assert(game.phase === "placement", "New games should start in placement phase.");

game = rollPlacementStart(game, { dice: [6, 6], total: 12 });
game = rollPlacementStart(game, { dice: [3, 4], total: 7 });

assert(game.placement.startPlayerId === "player-1", "Player 1 should win the deterministic starting roll.");
assert(game.placement.order.join(",") === "player-1,player-2", "Placement order should start with the starting player.");
assert(game.placement.reverseOrder.join(",") === "player-2,player-1", "Reverse placement order should be inverted.");

game = placeSpaceportAndShip(game);
game = placeSpaceportAndShip(game);
game = placeInitialColony(game, boardLayout, getNextFreeStartSite(game).id);
game = placeInitialColony(game, boardLayout, getNextFreeStartSite(game).id);
game = placeInitialColony(game, boardLayout, getNextFreeStartSite(game).id);
game = placeInitialColony(game, boardLayout, getNextFreeStartSite(game).id);

assert(game.phase === "production", "Game should enter production after placement is complete.");
assert(game.currentPlayerIndex === 0, "Starting player should remain active after placement.");
assert(game.board.structures.length === 6, "Two players should place 6 starting structures.");
assert(game.board.ships.length === 2, "Two players should place 2 colony ships.");
assert(hasUniqueNumberTokens(game), "Each assigned number token should be used only once.");
assert(startTokensMatchGroups(game), "Start system tokens should match their start groups.");

const specialPlanet = findPlanetWithSpecialToken(game);
if (specialPlanet) {
  const specialToken = game.board.numberTokens.planetTokensById[specialPlanet.id];
  game.board.numberTokens.planetTokensById[specialPlanet.id] = {
    ...specialToken,
    revealed: true
  };
  game.board.exploredSystems = [...new Set([...game.board.exploredSystems, specialPlanet.systemId])];
  const blockedSite = getSiteAdjacentToPlanet(game, specialPlanet.id);
  if (blockedSite) {
    assert(isActiveSpecialToken(game.board.numberTokens.planetTokensById[specialPlanet.id]), "Special planet marker should be active after reveal.");
    game.board.structures = game.board.structures.filter((structure) => structure.locationId !== blockedSite.nodeId);
    const activeShip = game.board.ships.find((ship) => ship.ownerPlayerId === game.players[0].id);
    if (activeShip) activeShip.locationId = blockedSite.nodeId;
    const beforeStructures = game.board.structures.length;
    game = placeInitialColony(game, boardLayout, blockedSite.id);
    assert(game.board.structures.length === beforeStructures, "Placement helper should not place colonies outside placement phase.");
  }
}

game = rollProduction(game, boardLayout, { dice: [1, 5] });
game = drawSupply(game);

const playerOneTotal = getResourceTotal(game.players[0]);
const afterSecondDrawAttempt = drawSupply(game);

assert(playerOneTotal >= 2, "Player 1 should draw supply after production.");
assert(
  getResourceTotal(afterSecondDrawAttempt.players[0]) === playerOneTotal,
  "Player 1 should not draw supply twice in one turn."
);

game = { ...game, phase: "flight" };
game = endCurrentTurn(game);
game = rollProduction(game, boardLayout, { dice: [2, 4] });

const playerTwoBeforeSupply = getResourceTotal(game.players[1]);
game = drawSupply(game);
const playerTwoAfterSupply = getResourceTotal(game.players[1]);

assert(game.currentPlayerIndex === 1, "Player 2 should be active after Player 1 ends the turn.");
assert(playerTwoAfterSupply - playerTwoBeforeSupply === 2, "Player 2 should draw supply on their own turn.");

game = {
  ...game,
  currentPlayerIndex: 0,
  phase: "production",
  supplyDeck: ["ore", "fuel", "carbon", "food", "goods"],
  players: game.players.map((player, index) => {
    if (index === 0) {
      return {
        ...player,
        resources: {
          ore: 2,
          fuel: 2,
          carbon: 1,
          food: 1,
          goods: 1
        }
      };
    }
    return {
      ...player,
      resources: {
        ore: 3,
        fuel: 2,
        carbon: 2,
        food: 1,
        goods: 1
      }
    };
  })
};

game = rollProduction(game, boardLayout, { dice: [3, 4] });
assert(game.phase === "production", "A roll of 7 should not jump directly to tradeBuild.");
assert(game.sevenResolution?.active, "A roll of 7 should activate seven resolution.");
assert(getResourceTotal(game.players[0]) === 7, "Player 1 should not gain production on a 7.");
assert(getResourceTotal(game.players[1]) === 9, "Player 2 should not gain production on a 7.");
assert((game.sevenResolution?.discardRequirements?.["player-1"] ?? 0) === 0, "Players with 7 resources should not discard.");
assert((game.sevenResolution?.discardRequirements?.["player-2"] ?? 0) === 4, "Players with 9 resources should discard 4.");

game = updateSevenDiscardSelection(game, "player-2", "ore", 1);
game = updateSevenDiscardSelection(game, "player-2", "fuel", 1);
game = updateSevenDiscardSelection(game, "player-2", "carbon", 1);
game = updateSevenDiscardSelection(game, "player-2", "food", 1);
game = submitSevenDiscard(game, "player-2");
assert(getResourceTotal(game.players[1]) === 5, "Player 2 should have 5 resources after discarding 4 from 9.");
assert(game.sevenResolution?.step === "steal", "Seven resolution should move to steal after all discards.");

game = setSevenStealTarget(game, "player-2");
game = resolveSevenSteal(game);
assert(getResourceTotal(game.players[0]) === 8, "Active player should gain 1 random resource after the steal.");
assert(getResourceTotal(game.players[1]) === 4, "Target player should lose 1 resource after the steal.");
assert(game.sevenResolution?.step === "supply", "Seven resolution should move to supply after the steal.");

game = distributeSevenSupply(game);
assert(getResourceTotal(game.players[1]) === 5, "Other players should draw 1 supply card after the seven resolution.");
assert(game.phase === "tradeBuild", "Seven resolution should end in tradeBuild.");
assert(game.supplyDrawTurnKey === `${game.turnNumber}:${game.players[game.currentPlayerIndex].id}`, "Seven supply resolution should mark the active turn supply state.");

game = {
  ...game,
  currentPlayerIndex: 0,
  phase: "tradeBuild",
  players: game.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: {
        ...player.resources,
        ore: 3,
        fuel: 3,
        carbon: 3,
        food: 3,
        goods: 3
      }
    }
    : player)
};
game = buildShip(game, boardLayout, "colonyShip");
assert(game.board.pendingShipPlacement?.shipType === "colonyShip", "Building a ship should wait for manual launch point selection.");
const launchPoint = findFreeLaunchPoint(game, "player-1");
const resourcesBeforePlacement = game.players[0].resources.ore;
game = placePendingShip(game, boardLayout, launchPoint.id);
assert(!game.board.pendingShipPlacement, "Pending ship placement should clear after selecting a launch point.");
assert(game.players[0].resources.ore === resourcesBeforePlacement - 1, "Ship resources should be paid only after selecting a launch point.");

game = {
  ...game,
  activeTradeOffer: null,
  players: game.players.map((player, index) => ({
    ...player,
    resources: index === 0
      ? { ore: 2, fuel: 1, carbon: 0, food: 0, goods: 0 }
      : { ore: 0, fuel: 0, carbon: 1, food: 0, goods: 0 }
  }))
};
game = createTradeOffer(game, {
  fromPlayerId: "player-1",
  toPlayerId: "player-2",
  offeredResources: { ore: 1, fuel: 0, carbon: 0, food: 0, goods: 0 },
  requestedResources: { ore: 0, fuel: 0, carbon: 1, food: 0, goods: 0 }
});
assert(game.activeTradeOffer?.toPlayerId === "player-2", "Active player should be able to create a trade offer.");
game = respondToTradeOffer(game, "player-2", "accept");
assert(!game.activeTradeOffer, "Accepted trade offers should clear.");
assert(game.players[0].resources.ore === 1 && game.players[0].resources.carbon === 1, "Accepted trades should transfer resources to the active player.");
assert(game.players[1].resources.ore === 1 && game.players[1].resources.carbon === 0, "Accepted trades should transfer resources to the target player.");

game = createTradeOffer(game, {
  fromPlayerId: "player-1",
  toPlayerId: "player-2",
  offeredResources: { ore: 1, fuel: 0, carbon: 0, food: 0, goods: 0 },
  requestedResources: { ore: 0, fuel: 0, carbon: 0, food: 0, goods: 0 }
});
game = respondToTradeOffer(game, "player-2", "decline");
assert(!game.activeTradeOffer, "Declined trade offers should clear.");

game = {
  ...game,
  activeTradeOffer: null,
  players: game.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: {
        ...player.resources,
        carbon: 3,
        food: 2
      }
    }
    : player)
};
const colonyBeforeUpgrade = game.board.structures.find((structure) => structure.ownerPlayerId === "player-1" && structure.type === "colony");
game = startPendingSpaceportUpgrade(game);
assert(game.board.pendingSpaceportUpgrade?.ownerPlayerId === "player-1", "Spaceport build should start with a pending colony selection.");
const carbonBeforeUpgrade = game.players[0].resources.carbon;
game = confirmPendingSpaceportUpgrade(game, colonyBeforeUpgrade.id);
assert(!game.board.pendingSpaceportUpgrade, "Pending spaceport upgrade should clear after selecting a colony.");
assert(game.players[0].resources.carbon === carbonBeforeUpgrade - 3, "Spaceport cost should be paid only after selecting the colony.");
assert(game.board.structures.some((structure) => structure.id === colonyBeforeUpgrade.id && structure.type === "spaceport"), "Selected colony should become a spaceport.");

game = startPendingSpaceportUpgrade(game);
const foodBeforeCancel = game.players[0].resources.food;
game = cancelPendingSpaceportUpgrade(game);
assert(!game.board.pendingSpaceportUpgrade, "Cancelling spaceport selection should clear the pending state.");
assert(game.players[0].resources.food === foodBeforeCancel, "Cancelling spaceport selection should not change resources.");

const outpostUnderTest = game.board.placedOutposts.find((outpost) => (outpost.docks ?? []).length >= 3);
assert(Boolean(outpostUnderTest), "Randomized outposts should expose enough docks for the friendship marker test.");

if (outpostUnderTest) {
  game = {
    ...game,
    phase: "flight",
    currentPlayerIndex: 0,
    board: {
      ...game.board,
      pendingTradeStationPlacement: null,
      selectedElement: null,
      structures: game.board.structures.filter((structure) => structure.type !== "tradeStation"),
      stations: [],
      ships: [
        {
          id: "player-1-trade-ship-a",
          ownerPlayerId: "player-1",
          type: "tradeShip",
          locationId: outpostUnderTest.dockNodeId,
          status: "docked"
        }
      ],
      placedOutposts: game.board.placedOutposts.map((outpost) => ({
        ...outpost,
        friendshipHolderPlayerId: null,
        tradeStationIds: []
      }))
    },
    players: game.players.map((player, index) => ({
      ...player,
      victoryPoints: 4,
      friendshipCards: [],
      friendshipMarkers: [],
      upgrades: {
        ...player.upgrades,
        cargo: index === 0 ? 3 : 3
      }
    }))
  };

  const firstDockNodeId = outpostUnderTest.docks[0].nodeId;
  const secondDockNodeId = outpostUnderTest.docks[1].nodeId;
  const thirdDockNodeId = outpostUnderTest.docks[2].nodeId;

  game = foundTradeStation(game, boardLayout, "player-1-trade-ship-a");
  assert(game.board.pendingTradeStationPlacement?.availableDockIds?.length >= 3, "Trade station founding should start with a pending dock selection.");
  game = confirmPendingTradeStationPlacement(game, boardLayout, firstDockNodeId);
  assert(game.board.structures.some((structure) => structure.type === "tradeStation" && structure.locationId === firstDockNodeId), "Trade station should occupy the selected dock.");
  assert(!game.board.ships.some((ship) => ship.id === "player-1-trade-ship-a"), "Trade ship should be consumed when founding a trade station.");
  assert(game.players[0].friendshipMarkers.includes(outpostUnderTest.id), "The first outpost founder should receive the friendship marker.");
  assert(game.players[0].victoryPoints === 6, "Friendship marker should grant 2 victory points.");
  assert(game.players[0].friendshipCards.length === 1, "Founding a trade station should grant one friendship card.");

  game = {
    ...game,
    phase: "flight",
    currentPlayerIndex: 1,
    board: {
      ...game.board,
      pendingTradeStationPlacement: null,
      ships: [
        ...game.board.ships,
        {
          id: "player-2-trade-ship-a",
          ownerPlayerId: "player-2",
          type: "tradeShip",
          locationId: outpostUnderTest.dockNodeId,
          status: "docked"
        }
      ]
    }
  };

  game = foundTradeStation(game, boardLayout, "player-2-trade-ship-a");
  game = confirmPendingTradeStationPlacement(game, boardLayout, secondDockNodeId);
  assert(game.board.placedOutposts.find((outpost) => outpost.id === outpostUnderTest.id)?.friendshipHolderPlayerId === "player-1", "A tie on trade stations must not transfer the friendship marker.");

  game = {
    ...game,
    phase: "flight",
    currentPlayerIndex: 1,
    board: {
      ...game.board,
      pendingTradeStationPlacement: null,
      ships: [
        ...game.board.ships,
        {
          id: "player-2-trade-ship-b",
          ownerPlayerId: "player-2",
          type: "tradeShip",
          locationId: outpostUnderTest.dockNodeId,
          status: "docked"
        }
      ]
    }
  };

  game = foundTradeStation(game, boardLayout, "player-2-trade-ship-b");
  game = confirmPendingTradeStationPlacement(game, boardLayout, thirdDockNodeId);
  const updatedOutpost = game.board.placedOutposts.find((outpost) => outpost.id === outpostUnderTest.id);
  assert(updatedOutpost?.friendshipHolderPlayerId === "player-2", "Friendship marker should move only when another player gains a clear majority.");
  assert(game.players[0].victoryPoints === 4, "Previous friendship holder should lose 2 victory points on marker transfer.");
  assert(game.players[1].victoryPoints === 6, "New friendship holder should gain 2 victory points on marker transfer.");
  const normalizedOutpostGame = normalizeGameState(JSON.parse(JSON.stringify(game)), {
    language: "de",
    playerCount: 2,
    boardLayout
  });
  assert(
    normalizedOutpostGame.board.placedOutposts.find((outpost) => outpost.id === outpostUnderTest.id)?.friendshipHolderPlayerId === "player-2",
    "Save/load normalization should preserve friendship marker holders."
  );

  const pendingCancelState = foundTradeStation({
    ...game,
    phase: "flight",
    currentPlayerIndex: 1,
    players: game.players.map((player, index) => index === 1
      ? {
        ...player,
        upgrades: {
          ...player.upgrades,
          cargo: 5
        }
      }
      : player),
    board: {
      ...game.board,
      ships: [
        ...game.board.ships,
        {
          id: "player-2-trade-ship-c",
          ownerPlayerId: "player-2",
          type: "tradeShip",
          locationId: outpostUnderTest.dockNodeId,
          status: "docked"
        }
      ]
    }
  }, boardLayout, "player-2-trade-ship-c");
  assert(Boolean(pendingCancelState.board.pendingTradeStationPlacement), "Trade station founding should remain cancellable while a dock selection is pending.");
  const cancelledPendingState = cancelPendingTradeStationPlacement(pendingCancelState);
  assert(!cancelledPendingState.board.pendingTradeStationPlacement, "Cancelling a pending trade station placement should clear the pending state.");
}

let encounterGame = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
encounterGame = {
  ...encounterGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: encounterGame.players.map((player, index) => ({
    ...player,
    resources: index === 0
      ? { ore: 0, fuel: 0, carbon: 0, food: 0, goods: 0 }
      : player.resources,
    halfMedals: index === 0 ? 1 : player.halfMedals,
    victoryPoints: index === 0 ? 4 : player.victoryPoints
  })),
  board: {
    ...encounterGame.board,
    ships: encounterGame.board.ships.length > 0
      ? encounterGame.board.ships
      : [{
        id: "player-1-colony-ship-test",
        ownerPlayerId: "player-1",
        type: "colonyShip",
        locationId: boardLayout.points[0].id,
        status: "active"
      }]
  }
};

encounterGame = determineFlightSpeed(encounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "honor-medal"
});
assert(encounterGame.activeEncounter?.cardId === "honor-medal", "A black mothership ball should start an encounter.");
assert(encounterGame.flightSpeedBase === 3, "A black mothership ball should force base speed 3.");
const blockedMoveState = moveShip(
  encounterGame,
  boardLayout,
  encounterGame.board.ships[0].id,
  boardLayout.points.find((point) => point.id !== encounterGame.board.ships[0].locationId)?.id ?? encounterGame.board.ships[0].locationId
);
assert(
  blockedMoveState.board.ships[0].locationId === encounterGame.board.ships[0].locationId,
  "Ship movement should be blocked while an encounter is active."
);
encounterGame = resolveEncounterChoice(encounterGame, { choiceId: "accept" });
assert(encounterGame.players[0].halfMedals === 2, "Encounter reward should add a half medal.");
assert(encounterGame.players[0].victoryPoints === 5, "Two half medals should count as one victory point.");
const normalizedEncounterState = normalizeGameState(JSON.parse(JSON.stringify(encounterGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(normalizedEncounterState.activeEncounter?.cardId === "honor-medal", "Save/load normalization should preserve the active encounter.");
encounterGame = finishEncounter(encounterGame);
assert(!encounterGame.activeEncounter, "Encounter should clear after finishing.");
assert(encounterGame.encounterDiscard.includes("honor-medal"), "Finished encounters should move to the discard pile.");
const postEncounterMoveState = moveShip(
  encounterGame,
  boardLayout,
  encounterGame.board.ships[0].id,
  encounterGame.board.ships[0].locationId
);
assert(postEncounterMoveState !== null, "Game state should remain usable after finishing an encounter.");

if (process.exitCode !== 1) {
  console.log("Game state check passed.");
}

function hasUniqueNumberTokens(gameState) {
  const tokenIds = Object.values(gameState.board?.numberTokens?.planetTokensById ?? {})
    .map((token) => token.id)
    .filter(Boolean);
  return tokenIds.length === new Set(tokenIds).size;
}

function startTokensMatchGroups(gameState) {
  return (boardLayout.startSystems ?? []).every((system) => (
    (system.planets ?? []).every((planet) => gameState.board.numberTokens.planetTokensById[planet.id]?.group === system.name)
  ));
}

function findPlanetWithSpecialToken(gameState) {
  return getAllPlanets(gameState)
    .find((planet) => ["pirate", "ice"].includes(gameState.board.numberTokens.planetTokensById[planet.id]?.type));
}

function getSiteAdjacentToPlanet(gameState, planetId) {
  return [
    ...(boardLayout.startSites ?? []),
    ...(gameState.board?.placedSystems ?? []).flatMap((system) => system.colonySites ?? [])
  ].find((site) => site.adjacentPlanetIds?.includes(planetId));
}

function getAllPlanets(gameState) {
  return [
    ...(boardLayout.startSystems ?? []),
    ...(gameState.board?.placedSystems ?? [])
  ].flatMap((system) => (system.planets ?? []).map((planet) => ({
    ...planet,
    systemId: system.id
  })));
}

function findFreeLaunchPoint(gameState, playerId) {
  const occupied = new Set([
    ...(gameState.board?.ships ?? []).map((ship) => ship.locationId),
    ...(gameState.board?.structures ?? []).map((structure) => structure.locationId)
  ]);
  const spaceportLocations = new Set((gameState.board?.structures ?? [])
    .filter((structure) => structure.ownerPlayerId === playerId && structure.type === "spaceport")
    .map((structure) => structure.locationId));

  return (boardLayout.spaceportLaunchPoints ?? [])
    .find((point) => spaceportLocations.has(point.spaceportLocationId) && !occupied.has(point.id));
}
