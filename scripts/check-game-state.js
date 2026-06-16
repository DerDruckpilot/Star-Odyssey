import { boardLayout } from "../src/data/boardLayout.js";
import {
  createGameState,
  drawSupply,
  endCurrentTurn,
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

let game = createGameState({ language: "de", playerCount: 2, boardLayout });
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
