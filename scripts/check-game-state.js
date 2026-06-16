import { boardLayout } from "../src/data/boardLayout.js";
import {
  createGameState,
  drawSupply,
  endCurrentTurn,
  placeInitialColony,
  placeInitialColonyShip,
  placeInitialSpaceport,
  rollPlacementStart,
  rollProduction
} from "../src/game/gameState.js";

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

if (process.exitCode !== 1) {
  console.log("Game state check passed.");
}
