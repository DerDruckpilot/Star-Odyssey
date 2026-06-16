import { boardLayout } from "../src/data/boardLayout.js";
import {
  buildShip,
  createGameState,
  drawSupply,
  endCurrentTurn,
  placePendingShip,
  placeInitialColony,
  placeInitialColonyShip,
  placeInitialSpaceport,
  rollPlacementStart,
  rollProduction
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

game = rollProduction(game, boardLayout);
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
game = rollProduction(game, boardLayout);

const playerTwoBeforeSupply = getResourceTotal(game.players[1]);
game = drawSupply(game);
const playerTwoAfterSupply = getResourceTotal(game.players[1]);

assert(game.currentPlayerIndex === 1, "Player 2 should be active after Player 1 ends the turn.");
assert(playerTwoAfterSupply - playerTwoBeforeSupply === 2, "Player 2 should draw supply on their own turn.");

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
