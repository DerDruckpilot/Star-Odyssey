import { boardLayout } from "../src/data/boardLayout.js";
import {
  advanceToFlightPhase,
  buyUpgrade,
  canDrawSupply,
  buildSupernovaFactory,
  calculateVictoryPoints,
  buildShip,
  canFoundColonyWithShip,
  cancelPendingSpaceportUpgrade,
  cancelTradeOffer,
  confirmPendingSpaceportUpgrade,
  completeSupernovaShipBattleReveal,
  createTradeOffer,
  createGameState,
  determineFlightSpeed,
  distributeSevenSupply,
  drawSupply,
  endCurrentTurn,
  finishEncounter,
  getEffectiveUpgradeValue,
  getBuildableSupernovaFactoryOptions,
  getFriendshipUpgradeBonus,
  foundColony,
  getTradeRatesForPlayer,
  moveShip,
  placePendingShip,
  placeInitialColony,
  placeInitialColonyShip,
  placeInitialSpaceport,
  resolveEncounterChoice,
  resolvePendingFriendshipAction,
  respondToTradeOffer,
  resolveSevenSteal,
  rollPlacementStart,
  rollProduction,
  selectPendingFriendshipCard,
  setSevenStealTarget,
  startPendingSpaceportUpgrade,
  foundTradeStation,
  getShipDestinationState,
  getPlayerInventory,
  getSupernovaMissionsForPlayer,
  getSupplyDrawCount,
  getRealUpgradeValue,
  submitEncounterPending,
  submitSupernovaShipBattleRoll,
  toggleSupernovaMissionFulfilled,
  tradeWithSupply,
  useBoughtFame,
  useRichHelpsPoor,
  normalizeGameState,
  startPendingFlightEncounter,
  submitSevenDiscard,
  updateEncounterResourceSelection,
  updateSevenDiscardSelection,
  chooseSupernovaShipBattleUpgrade
} from "../src/game/gameState.js";
import { getEncounterCardById, getEncounterDeckIds } from "../src/data/encounterCards.js";
import { isActiveSpecialToken } from "../src/data/numberTokens.js";
import { shipVfxData } from "../src/data/shipVfxData.js";
import { gameVariants, supernovaFactoryLimitPerPlayer } from "../src/data/supernova.js";

function getResourceTotal(player) {
  return Object.values(player.resources ?? {}).reduce((sum, value) => sum + value, 0);
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exitCode = 1;
  }
}

function revealPendingFlightEncounter(gameState) {
  const nextState = startPendingFlightEncounter(gameState);
  assert(!nextState.pendingFlightEncounter, "Pending flight encounters should clear when the animation opens the encounter.");
  assert(Boolean(nextState.activeEncounter), "Pending flight encounters should open an active encounter after the animation.");
  return nextState;
}

function submitEncounterMothershipRoll(gameState, playerId, balls) {
  const previousFlightSpeed = gameState.flightSpeedTotal;
  const nextState = submitEncounterPending(gameState, {
    playerId,
    forcedRoll: { balls }
  });
  assert(
    nextState.flightSpeedTotal === previousFlightSpeed,
    "Encounter mothership rolls must not overwrite normal flight speed."
  );
  return nextState;
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
const defaultPlayerCountGame = createGameState({ language: "de", boardLayout });
const restoredLegacyTwoPlayerGame = normalizeGameState(structuredClone(game), {
  language: "de",
  playerCount: 3,
  boardLayout
});
const customPlayerGame = createGameState({
  language: "de",
  playerCount: 2,
  boardLayout,
  playerSetup: [
    { name: "Ada", color: "green" },
    { name: "Ben", color: "red" }
  ]
});

assert(game.phase === "placement", "New games should start in placement phase.");
assert(defaultPlayerCountGame.playerCount === 3, "Fresh games without a player count should default to three players.");
assert(game.playerCount === 2, "Explicit legacy two-player game states should remain supported internally.");
assert(restoredLegacyTwoPlayerGame.playerCount === 2, "Loading a legacy two-player save should preserve its player count.");
assert(customPlayerGame.players[0].name === "Ada" && customPlayerGame.players[0].color === "green", "New games should use configured player names and colors.");
assert(customPlayerGame.players[1].name === "Ben" && customPlayerGame.players[1].color === "red", "New games should preserve configured player names and colors.");
assert(Object.keys(shipVfxData.tradeShipVfxAnchors ?? {}).length === 12, "Trade ship VFX data should cover all 12 trade ship variants.");
for (const color of ["red", "blue", "yellow", "green"]) {
  for (const variant of [1, 2, 3]) {
    const anchors = shipVfxData.tradeShipVfxAnchors?.[`${color}-trade-ship-${variant}`];
    assert(anchors?.coils?.length > 0, `Missing trade ship coil VFX anchors for ${color} variant ${variant}.`);
    assert(anchors?.engines?.length > 0, `Missing trade ship engine VFX anchors for ${color} variant ${variant}.`);
    assert(Number.isFinite(anchors?.assetWidth) && Number.isFinite(anchors?.assetHeight), `Missing trade ship asset size for ${color} variant ${variant}.`);
  }
}
assert(Object.keys(shipVfxData.battleShipVfxAnchors ?? {}).length === 12, "Battle ship VFX data should cover all 12 battle ship variants.");
assert(shipVfxData.engineTemplates?.some((template) => template.id === "template-plasma" && template.name === "Red Flame" && template.emitters?.length === 6), "Battle ship plasma engine template should be available.");
for (const color of ["red", "blue", "yellow", "green"]) {
  for (const variant of [1, 2, 3]) {
    const anchors = shipVfxData.battleShipVfxAnchors?.[`${color}-battle-ship-${variant}`];
    assert(anchors?.coils?.length === variant, `Battle ship ${color} variant ${variant} should have ${variant} coil VFX anchor(s).`);
    assert(anchors?.engines?.length > 0, `Missing battle ship engine VFX anchors for ${color} variant ${variant}.`);
    assert(anchors?.engines?.every((engine) => engine.templateId === "template-plasma"), `Battle ship ${color} variant ${variant} should use the plasma engine template.`);
    assert(anchors?.shots?.length === 2, `Battle ship ${color} variant ${variant} should have two shot VFX anchors.`);
    assert(anchors?.shots?.every((shot) => shot.weaponType === "plasmaMachineGun" && shot.length === 1199), `Battle ship ${color} variant ${variant} should use the imported plasma machine gun range.`);
    assert(Number.isFinite(anchors?.assetWidth) && Number.isFinite(anchors?.assetHeight), `Missing battle ship asset size for ${color} variant ${variant}.`);
  }
}
assert(game.board.placedQuadrants.length === 15, "New games should place 15 hidden space quadrants.");
assert(Boolean(game.board.unusedQuadrant), "New games should leave exactly one space quadrant unused.");
assert(game.board.placedQuadrants.filter((quadrant) => quadrant.type === "planetSystem").length === game.board.placedSystems.length, "Placed planet systems should stay aligned with quadrant records.");
assert(game.board.placedQuadrants.length + (game.board.unusedQuadrant ? 1 : 0) === 16, "Placed and unused quadrants should represent all 16 available quadrants.");
assert(game.board.placedQuadrants.filter((quadrant) => quadrant.type === "outpost").length === game.board.placedOutposts.length, "Placed outposts should stay aligned with quadrant records.");
assert(game.board.placedQuadrants.filter((quadrant) => quadrant.type === "empty").length === game.board.emptySlots.length, "Empty quadrant slots should be tracked.");
assert((game.board.exploredOutposts ?? []).length === 0, "Outposts should start hidden in new games.");
assert((game.board.exploredEmptySlots ?? []).length === 0, "Empty quadrants should start hidden in new games.");
assert((game.board.exploredSystems ?? []).every((systemId) => systemId.startsWith("start-")), "Only start systems should be explored at game start.");

const threePlayerSetupGame = createGameState({
  language: "de",
  playerCount: 3,
  boardLayout,
  playerSetup: [
    { name: "Rot", color: "red" },
    { name: "Blau", color: "blue" },
    { name: "Grün", color: "green" }
  ]
});
const neutralStartingStructures = threePlayerSetupGame.board.structures.filter((structure) => structure.isNeutral);
assert(neutralStartingStructures.length === 3, "Three-player games should reserve the fourth start system with three neutral structures.");
assert(neutralStartingStructures.filter((structure) => structure.type === "colony").length === 2, "The neutral start system should contain two colonies.");
assert(neutralStartingStructures.filter((structure) => structure.type === "spaceport").length === 1, "The neutral start system should contain one spaceport.");
assert(neutralStartingStructures.every((structure) => structure.color === "yellow"), "Neutral start structures should use the unused fourth player color.");
assert(threePlayerSetupGame.players.every((player) => calculateVictoryPoints(threePlayerSetupGame, player.id) === 0), "Neutral start structures must not award victory points.");

const restoredThreePlayerSetupGame = normalizeGameState(structuredClone(threePlayerSetupGame), {
  language: "de",
  playerCount: 3,
  boardLayout
});
assert(
  restoredThreePlayerSetupGame.board.structures.filter((structure) => structure.isNeutral && structure.color === "yellow").length === 3,
  "Save/load normalization should preserve neutral start structures and their color."
);

const neutralPlanetId = neutralStartingStructures[0]?.adjacentPlanetIds?.[0];
const neutralPlanetToken = threePlayerSetupGame.board.numberTokens.planetTokensById?.[neutralPlanetId];
assert(neutralPlanetToken?.type === "number", "Neutral start structures should be adjacent to a numbered production planet.");
if (neutralPlanetToken?.type === "number") {
  const productionDice = neutralPlanetToken.value <= 7
    ? [1, neutralPlanetToken.value - 1]
    : [6, neutralPlanetToken.value - 6];
  const neutralProductionGame = rollProduction({
    ...structuredClone(threePlayerSetupGame),
    phase: "production"
  }, boardLayout, { dice: productionDice });
  assert(
    neutralProductionGame.players.every((player) => getResourceTotal(player) === 0),
    "Neutral start structures must not produce resources for any player."
  );
}

let neutralBlockingGame = structuredClone(threePlayerSetupGame);
neutralBlockingGame = rollPlacementStart(neutralBlockingGame, { dice: [6, 6], total: 12 });
neutralBlockingGame = rollPlacementStart(neutralBlockingGame, { dice: [4, 5], total: 9 });
neutralBlockingGame = rollPlacementStart(neutralBlockingGame, { dice: [3, 4], total: 7 });
const neutralStartSite = boardLayout.startSites.find((site) => site.nodeId === neutralStartingStructures[0]?.locationId);
assert(Boolean(neutralStartSite), "Neutral start structures should map to real start sites.");
const neutralBlockingStructureCount = neutralBlockingGame.board.structures.length;
neutralBlockingGame = placeInitialSpaceport(neutralBlockingGame, boardLayout, neutralStartSite?.id);
assert(neutralBlockingGame.board.structures.length === neutralBlockingStructureCount, "Neutral start structures should block their occupied build sites.");

const fourPlayerSetupGame = createGameState({ language: "de", playerCount: 4, boardLayout });
assert(fourPlayerSetupGame.board.structures.length === 0, "Four-player games should not create neutral start structures.");

function createColonyLimitGame(playerCount) {
  const limitGame = createGameState({ language: "de", playerCount, boardLayout });
  const limitSystem = limitGame.board.placedSystems.find((system) => (system.colonySites ?? []).length === 3);
  const [firstSite, secondSite, targetSite] = limitSystem.colonySites;
  limitGame.phase = "flight";
  limitGame.currentPlayerIndex = 0;
  limitGame.board.exploredSystems = [...new Set([...limitGame.board.exploredSystems, limitSystem.id])];
  limitGame.board.structures = [
    {
      id: "colony-limit-one",
      ownerPlayerId: limitGame.players[1].id,
      type: "colony",
      locationId: firstSite.nodeId,
      systemId: limitSystem.id,
      adjacentPlanetIds: firstSite.adjacentPlanetIds
    },
    {
      id: "colony-limit-two",
      ownerPlayerId: limitGame.players[2].id,
      type: "spaceport",
      locationId: secondSite.nodeId,
      systemId: limitSystem.id,
      adjacentPlanetIds: secondSite.adjacentPlanetIds
    }
  ];
  limitGame.board.ships = [{
    id: "colony-limit-ship",
    ownerPlayerId: limitGame.players[0].id,
    type: "colonyShip",
    shipVariant: 1,
    locationId: targetSite.nodeId,
    status: "active"
  }];
  for (const planet of limitSystem.planets ?? []) {
    limitGame.board.numberTokens.planetTokensById[planet.id] = {
      ...(limitGame.board.numberTokens.planetTokensById[planet.id] ?? {}),
      type: "number",
      value: 6,
      revealed: true
    };
  }
  return { limitGame, targetSite };
}

{
  const { limitGame: threePlayerColonyLimitGame, targetSite } = createColonyLimitGame(3);
  const threePlayerDestinationGame = structuredClone(threePlayerColonyLimitGame);
  threePlayerDestinationGame.board.ships[0].locationId = targetSite.launchNodeIds[0];
  assert(!canFoundColonyWithShip(threePlayerColonyLimitGame, boardLayout, "colony-limit-ship"), "A third occupied colony site should be blocked in three-player games.");
  assert(
    getShipDestinationState(threePlayerDestinationGame, boardLayout, "colony-limit-ship", targetSite.nodeId).reason === "colonyLimit",
    "The board destination state should expose the three-player colony limit."
  );
  assert(
    foundColony(threePlayerColonyLimitGame, boardLayout, "colony-limit-ship").board.structures.length === 2,
    "The host rule path should reject a third occupied colony site in three-player games."
  );

  const { limitGame: fourPlayerColonyLimitGame } = createColonyLimitGame(4);
  assert(canFoundColonyWithShip(fourPlayerColonyLimitGame, boardLayout, "colony-limit-ship"), "Four-player games should allow all three colony sites in a system.");
  assert(
    foundColony(fourPlayerColonyLimitGame, boardLayout, "colony-limit-ship").board.structures.length === 3,
    "The three-player colony limit must not affect four-player games."
  );
}

let placementTieGame = createGameState({ language: "de", playerCount: 2, boardLayout });
placementTieGame = rollPlacementStart(placementTieGame, { dice: [3, 3], total: 6 });
placementTieGame = rollPlacementStart(placementTieGame, { dice: [2, 4], total: 6 });
placementTieGame = rollPlacementStart(placementTieGame, { dice: [1, 2], total: 3 });
placementTieGame = rollPlacementStart(placementTieGame, { dice: [4, 5], total: 9 });
assert(
  placementTieGame.log.filter((entry) => entry.messageKey === "logPlacementRolled").length === 4,
  "Tied placement rerolls should log each individual roll."
);
assert(
  placementTieGame.log.some((entry) => entry.messageKey === "logPlacementTie"),
  "Tied placement rolls should log the reroll reason."
);

game = rollPlacementStart(game, { dice: [6, 6], total: 12 });
game = rollPlacementStart(game, { dice: [3, 4], total: 7 });

assert(game.placement.startPlayerId === "player-1", "Player 1 should win the deterministic starting roll.");
assert(
  game.log.filter((entry) => entry.messageKey === "logPlacementRolled").map((entry) => entry.messageParams.total).join(",") === "12,7",
  "Starting placement rolls should log every player roll before the start player is chosen."
);
assert(game.log.at(-1)?.messageKey === "logPlacementStartPlayer", "Starting player should be logged after placement rolls.");
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
assert(game.startingSetupGranted === true, "Starting setup should be granted exactly once after placement.");
assert(game.players.every((player) => getResourceTotal(player) === 3), "Each player should receive 3 supply cards after placement.");
assert(game.players.every((player) => player.halfMedals === 1), "Each player should receive 1 half medal after placement.");
assert(game.players.every((player) => player.upgrades?.drive === 1), "Each player should receive 1 starting drive after placement.");
assert(hasUniqueNumberTokens(game), "Each assigned number token should be used only once.");
assert(startTokensMatchGroups(game), "Start system tokens should match their start groups.");
assert(
  normalizeGameState(JSON.parse(JSON.stringify(game)), {
    language: "de",
    playerCount: 2,
    boardLayout
  }).startingSetupGranted === true,
  "Save/load normalization should preserve that the starting setup was already granted."
);

const baseProductionGame = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});

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
assert(
  game.log
    .filter((entry) => entry.messageKey === "logResourceGained")
    .every((entry) => Boolean(entry.messageParams.resource)),
  "Planet production logs should name public resource gains when resources are produced."
);
game = drawSupply(game);

const playerOneTotal = getResourceTotal(game.players[0]);
const supplyLog = game.log.at(-1);
assert(["logSupplyDrawnOne", "logSupplyDrawnMany"].includes(supplyLog?.messageKey), "Supply draws should be logged.");
assert(!("resources" in (supplyLog?.messageParams ?? {})), "Supply draw logs must not reveal drawn resource cards.");
const afterSecondDrawAttempt = drawSupply(game);

assert(playerOneTotal >= 2, "Player 1 should draw supply after production.");
assert(
  getResourceTotal(afterSecondDrawAttempt.players[0]) === playerOneTotal,
  "Player 1 should not draw supply twice in one turn."
);

let delayedSupplyGame = rollProduction(normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
}), boardLayout, { dice: [1, 5] });
const delayedSupplyCount = getSupplyDrawCount(delayedSupplyGame, delayedSupplyGame.players[0]);
assert(delayedSupplyCount > 0, "Delayed supply smoke test needs an active Classic supply entitlement.");
delayedSupplyGame = advanceToFlightPhase(delayedSupplyGame);
const savedDelayedSupplyGame = normalizeGameState(JSON.parse(JSON.stringify(delayedSupplyGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(canDrawSupply(savedDelayedSupplyGame), "An undrawn supply entitlement should survive save/load before the normal flight roll.");
const delayedSupplyBefore = getResourceTotal(savedDelayedSupplyGame.players[0]);
delayedSupplyGame = drawSupply(savedDelayedSupplyGame);
assert(
  getResourceTotal(delayedSupplyGame.players[0]) - delayedSupplyBefore === delayedSupplyCount,
  "Classic supply should remain drawable once in flight before the normal mothership roll."
);
assert(!canDrawSupply(delayedSupplyGame), "A recovered supply entitlement should be consumed after drawing.");
const savedConsumedSupplyGame = normalizeGameState(JSON.parse(JSON.stringify(delayedSupplyGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(!canDrawSupply(savedConsumedSupplyGame), "A consumed supply entitlement should remain consumed after save/load.");

let expiredSupplyGame = rollProduction(normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
}), boardLayout, { dice: [1, 5] });
expiredSupplyGame = advanceToFlightPhase(expiredSupplyGame);
expiredSupplyGame = determineFlightSpeed(expiredSupplyGame, { balls: ["yellow", "red"] });
const expiredSupplyBefore = getResourceTotal(expiredSupplyGame.players[0]);
assert(!canDrawSupply(expiredSupplyGame), "The normal flight roll should expire an undrawn supply entitlement.");
expiredSupplyGame = drawSupply(expiredSupplyGame);
assert(
  getResourceTotal(expiredSupplyGame.players[0]) === expiredSupplyBefore,
  "Supply must not be drawn after the normal flight roll."
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
assert(getPlayerInventory(game, "player-1").transporter.inUse === 2, "A newly placed ship should consume one transporter.");

let transporterLimitState = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
transporterLimitState = {
  ...transporterLimitState,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: transporterLimitState.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: {
        ore: 2,
        fuel: 2,
        carbon: 2,
        food: 2,
        goods: 2
      }
    }
    : player),
  board: {
    ...transporterLimitState.board,
    ships: [
      ...transporterLimitState.board.ships,
      {
        id: "player-1-third-ship",
        ownerPlayerId: "player-1",
        type: "tradeShip",
        locationId: boardLayout.points.find((point) => point.id !== transporterLimitState.board.ships[0]?.locationId)?.id ?? boardLayout.points[0].id,
        status: "active"
      }
    ]
  }
};
transporterLimitState = buildShip(transporterLimitState, boardLayout, "tradeShip");
assert(!transporterLimitState.board.pendingShipPlacement, "Players must not build a fourth transporter ship.");

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
      })),
      exploredOutposts: [outpostUnderTest.id]
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
  const playerOnePointsBeforeMarker = calculateVictoryPoints(game, "player-1");
  const playerTwoPointsBeforeMarker = calculateVictoryPoints(game, "player-2");

  game = foundTradeStation(game, boardLayout, "player-1-trade-ship-a");
  assert(!game.board.pendingTradeStationPlacement, "Trade station founding should choose a dock automatically.");
  assert((game.board.pendingFriendshipCardSelection?.availableCardIds?.length ?? 0) > 1, "Founding a trade station should start a friendship card choice when multiple cards are available.");
  const selectedFriendshipCardId = game.board.pendingFriendshipCardSelection?.availableCardIds?.[0];
  assert(Boolean(selectedFriendshipCardId), "A valid friendship card should be selectable.");
  if (selectedFriendshipCardId) {
    game = selectPendingFriendshipCard(game, selectedFriendshipCardId);
  }
  assert(game.board.structures.some((structure) => structure.type === "tradeStation" && structure.locationId === firstDockNodeId), "Trade station should occupy the selected dock.");
  assert(!game.board.ships.some((ship) => ship.id === "player-1-trade-ship-a"), "Trade ship should be consumed when founding a trade station.");
  assert(game.players[0].friendshipMarkers.includes(outpostUnderTest.id), "The first outpost founder should receive the friendship marker.");
  assert(game.players[0].victoryPoints === playerOnePointsBeforeMarker + 2, "Friendship marker should grant 2 victory points.");
  assert(game.players[0].friendshipCards.length === 1, "Founding a trade station should grant one friendship card.");
  assert(
    !game.board.placedOutposts.find((outpost) => outpost.id === outpostUnderTest.id)?.friendshipCards?.includes(selectedFriendshipCardId),
    "Chosen friendship cards should be removed from the outpost pool."
  );
  assert(!game.board.pendingFriendshipCardSelection, "Friendship card selection should clear after choosing a card.");

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
  assert(game.board.structures.some((structure) => structure.type === "tradeStation" && structure.locationId === secondDockNodeId), "The second trade station should occupy the next free dock.");
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
  assert(game.board.structures.some((structure) => structure.type === "tradeStation" && structure.locationId === thirdDockNodeId), "The third trade station should occupy the next free dock.");
  const updatedOutpost = game.board.placedOutposts.find((outpost) => outpost.id === outpostUnderTest.id);
  assert(updatedOutpost?.friendshipHolderPlayerId === "player-2", "Friendship marker should move only when another player gains a clear majority.");
  assert(game.players[0].victoryPoints === playerOnePointsBeforeMarker, "Previous friendship holder should lose 2 victory points on marker transfer.");
  assert(game.players[1].victoryPoints === playerTwoPointsBeforeMarker + 2, "New friendship holder should gain 2 victory points on marker transfer.");
  const normalizedOutpostGame = normalizeGameState(JSON.parse(JSON.stringify(game)), {
    language: "de",
    playerCount: 2,
    boardLayout
  });
  assert(
    normalizedOutpostGame.board.placedOutposts.find((outpost) => outpost.id === outpostUnderTest.id)?.friendshipHolderPlayerId === "player-2",
    "Save/load normalization should preserve friendship marker holders."
  );
  assert(normalizedOutpostGame.players[0].friendshipCards.length === game.players[0].friendshipCards.length, "Save/load normalization should preserve friendship cards.");

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
  assert(!pendingCancelState.board.pendingTradeStationPlacement, "Automatic trade station founding should not leave a pending dock selection.");
  assert(!pendingCancelState.board.ships.some((ship) => ship.id === "player-2-trade-ship-c"), "Automatic trade station founding should consume the trade ship immediately.");
}

let friendshipEffectGame = createGameState({
  language: "de",
  playerCount: 2,
  boardLayout
});
friendshipEffectGame = {
  ...friendshipEffectGame,
  phase: "tradeBuild",
  players: friendshipEffectGame.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: {
        ore: 2,
        fuel: 0,
        carbon: 0,
        food: 0,
        goods: 2
      },
      friendshipCards: ["traders-ore-2to1", "traders-goods-1to1", "diplomats-bought-fame-1", "wise-drive-boost"]
    }
    : player)
};
assert(getTradeRatesForPlayer(friendshipEffectGame, "player-1").ore === 2, "Trader friendship cards should improve ore trade to 2:1.");
assert(getTradeRatesForPlayer(friendshipEffectGame, "player-1").goods === 1, "Goods trade card should enable 1:1 trades.");
friendshipEffectGame = tradeWithSupply(friendshipEffectGame, { fromResource: "goods", toResource: "food" });
assert(friendshipEffectGame.players[0].resources.goods === 1 && friendshipEffectGame.players[0].resources.food === 1, "Goods 1:1 trade should consume one goods and grant one resource.");
friendshipEffectGame = useBoughtFame(friendshipEffectGame);
assert(friendshipEffectGame.players[0].halfMedals === 1, "Bought fame should grant one half medal.");
const goodsAfterFame = friendshipEffectGame.players[0].resources.goods;
friendshipEffectGame = useBoughtFame(friendshipEffectGame);
assert(friendshipEffectGame.players[0].resources.goods === goodsAfterFame, "Bought fame should be usable only once per turn.");
friendshipEffectGame = determineFlightSpeed({
  ...friendshipEffectGame,
  phase: "flight",
  hasRolledFlightSpeed: false,
  board: {
    ...friendshipEffectGame.board,
    ships: [{
      id: "player-1-colony-ship-bonus",
      ownerPlayerId: "player-1",
      type: "colonyShip",
      locationId: boardLayout.points[0].id,
      status: "active"
    }]
  }
}, { balls: ["yellow", "blue"] });
assert(friendshipEffectGame.flightSpeedTotal === 5, "Wise people drive bonus should increase flight speed.");

let friendshipUpgradeBonusGame = createGameState({
  language: "de",
  playerCount: 2,
  boardLayout
});
friendshipUpgradeBonusGame = {
  ...friendshipUpgradeBonusGame,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: friendshipUpgradeBonusGame.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: { ore: 0, fuel: 6, carbon: 0, food: 0, goods: 0 },
      upgrades: { drive: 6, cargo: 0, cannon: 6 },
      friendshipCards: ["wise-drive-boost", "wise-cannon-boost"]
    }
    : player)
};
assert(getRealUpgradeValue(friendshipUpgradeBonusGame.players[0], "drive") === 6, "Real drives should stay capped at the mothership upgrade value.");
assert(getFriendshipUpgradeBonus(friendshipUpgradeBonusGame, "player-1", "drive") === 2, "Wise people drive cards should be tracked as friendship bonus.");
assert(getEffectiveUpgradeValue(friendshipUpgradeBonusGame, "player-1", "drive") === 8, "Effective drives should combine real upgrades and friendship bonuses.");
assert(getEffectiveUpgradeValue(friendshipUpgradeBonusGame, "player-1", "cannon") === 8, "Effective cannons should combine real upgrades and friendship bonuses.");

let upgradeLimitGame = {
  ...friendshipUpgradeBonusGame,
  players: friendshipUpgradeBonusGame.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: { ore: 0, fuel: 6, carbon: 0, food: 0, goods: 0 },
      upgrades: { drive: 4, cargo: 0, cannon: 0 },
      friendshipCards: ["wise-drive-boost"]
    }
    : player)
};
upgradeLimitGame = buyUpgrade(upgradeLimitGame, "drive");
upgradeLimitGame = buyUpgrade(upgradeLimitGame, "drive");
upgradeLimitGame = buyUpgrade(upgradeLimitGame, "drive");
assert(getRealUpgradeValue(upgradeLimitGame.players[0], "drive") === 6, "Friendship drive bonuses should not count against the real drive purchase limit.");
assert(getEffectiveUpgradeValue(upgradeLimitGame, "player-1", "drive") === 8, "Buying real drives should keep friendship drive bonuses separate.");

let richHelpsPoorGame = createGameState({
  language: "de",
  playerCount: 2,
  boardLayout
});
richHelpsPoorGame = {
  ...richHelpsPoorGame,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: richHelpsPoorGame.players.map((player, index) => index === 0
    ? {
      ...player,
      victoryPoints: 4,
      resources: { ore: 0, fuel: 0, carbon: 0, food: 0, goods: 0 },
      friendshipCards: ["diplomats-rich-helps-poor"]
    }
    : {
      ...player,
      victoryPoints: 6,
      resources: { ore: 1, fuel: 1, carbon: 0, food: 0, goods: 0 }
    })
};
const poorPlayerResourcesBefore = getResourceTotal(richHelpsPoorGame.players[0]);
const richPlayerResourcesBefore = getResourceTotal(richHelpsPoorGame.players[1]);
richHelpsPoorGame = useRichHelpsPoor(richHelpsPoorGame, ["player-2"]);
assert(getResourceTotal(richHelpsPoorGame.players[0]) === poorPlayerResourcesBefore + 1, "Rich helps poor should give the active player one random resource from a higher-scoring player.");
assert(getResourceTotal(richHelpsPoorGame.players[1]) === richPlayerResourcesBefore - 1, "Rich helps poor should remove one random resource from the chosen higher-scoring player.");
const afterRichHelpsPoor = getResourceTotal(richHelpsPoorGame.players[0]);
richHelpsPoorGame = useRichHelpsPoor(richHelpsPoorGame, ["player-2"]);
assert(getResourceTotal(richHelpsPoorGame.players[0]) === afterRichHelpsPoor, "Rich helps poor should only be usable once per turn.");

let galacticAidGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
galacticAidGame = {
  ...galacticAidGame,
  phase: "production",
  currentPlayerIndex: 0,
  players: galacticAidGame.players.map((player, index) => index === 0
    ? {
      ...player,
      friendshipCards: ["diplomats-galactic-aid"]
    }
    : player),
  board: {
    ...galacticAidGame.board,
    structures: galacticAidGame.board.structures.filter((structure) => structure.ownerPlayerId !== "player-1")
  }
};
galacticAidGame = rollProduction(galacticAidGame, boardLayout, { dice: [1, 5] });
assert(galacticAidGame.pendingFriendshipAction?.type === "galacticAid", "Galactic aid should wait for a resource choice after a production roll with no resources.");
const galacticAidResourcesBefore = galacticAidGame.players[0].resources.food;
galacticAidGame = resolvePendingFriendshipAction(galacticAidGame, { resource: "food" });
assert(galacticAidGame.pendingFriendshipAction === null, "Galactic aid should clear after choosing a resource.");
assert(galacticAidGame.players[0].resources.food === galacticAidResourcesBefore + 1, "Galactic aid should grant the chosen resource.");

let encounterGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
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
    upgrades: index === 0
      ? { drive: 1, cargo: 0, cannon: 0 }
      : player.upgrades,
    friendshipCards: index === 0 ? [] : player.friendshipCards,
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
const encounterBaseState = encounterGame;
const encounterShipId = encounterGame.board.ships[0].id;

const nonEncounterFlightState = determineFlightSpeed(encounterGame, {
  balls: ["blue", "red"]
});
assert(nonEncounterFlightState.flightSpeedBase === 4, "Colored mothership balls should determine the base speed by their values.");
assert(nonEncounterFlightState.flightSpeedTotal === 5, "Flight speed should add the player's starting drive to the base speed.");
assert(!nonEncounterFlightState.activeEncounter, "Colored mothership balls should not start an encounter.");

encounterGame = determineFlightSpeed(encounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-14"
});
assert(!encounterGame.activeEncounter, "A black mothership ball should wait for the visible roll animation before opening an encounter.");
assert(Boolean(encounterGame.pendingFlightEncounter), "A black mothership ball should queue a pending encounter.");
assert(encounterGame.flightSpeedBase === 3, "A black mothership ball should force base speed 3.");
assert(Object.keys(encounterGame.remainingMovementByShipId ?? {}).length === 0, "Encounter flight rolls should wait to assign movement until the encounter is finished.");
encounterGame = revealPendingFlightEncounter(encounterGame);
assert(encounterGame.activeEncounter?.cardId === "spreadsheet-14", "The pending encounter should open the forced encounter card after the animation.");
const encounterPointsBeforeMedal = calculateVictoryPoints(encounterGame, "player-1");
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
encounterGame = resolveEncounterChoice(encounterGame, { choiceId: "decline" });
assert(encounterGame.activeEncounter?.status === "resolved", "Simple encounter choices should resolve immediately.");
assert(encounterGame.players[0].halfMedals === 2, "Encounter reward should add a half medal.");
assert(calculateVictoryPoints(encounterGame, "player-1") === encounterPointsBeforeMedal + 1, "Two half medals should count as one victory point.");
const normalizedEncounterState = normalizeGameState(JSON.parse(JSON.stringify(encounterGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(normalizedEncounterState.activeEncounter?.cardId === "spreadsheet-14", "Save/load normalization should preserve the active encounter.");
encounterGame = finishEncounter(encounterGame);
assert(!encounterGame.activeEncounter, "Encounter should clear after finishing.");
assert(encounterGame.encounterDiscard.includes("spreadsheet-14"), "Finished encounters should move to the discard pile.");
assert(encounterGame.flightSpeedTotal === 4, "Finished encounters should initialize movement from the current drive value.");
assert(encounterGame.remainingMovementByShipId?.[encounterShipId] === 4, "Ship movement should be available only after finishing an encounter.");
const postEncounterMoveState = moveShip(
  encounterGame,
  boardLayout,
  encounterGame.board.ships[0].id,
  encounterGame.board.ships[0].locationId
);
assert(postEncounterMoveState !== null, "Game state should remain usable after finishing an encounter.");

let singleRollEncounterGame = {
  ...encounterBaseState,
  players: encounterBaseState.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: { ore: 1, fuel: 0, carbon: 0, food: 0, goods: 0 },
      upgrades: { drive: 1, cargo: 0, cannon: 6 },
      friendshipCards: ["wise-cannon-boost"],
      halfMedals: 2
    }
    : player)
};
singleRollEncounterGame = determineFlightSpeed(singleRollEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-14"
});
singleRollEncounterGame = revealPendingFlightEncounter(singleRollEncounterGame);
singleRollEncounterGame = resolveEncounterChoice(singleRollEncounterGame, { choiceId: "accept" });
singleRollEncounterGame = updateEncounterResourceSelection(singleRollEncounterGame, "ore", 1);
singleRollEncounterGame = submitEncounterPending(singleRollEncounterGame);
assert(
  singleRollEncounterGame.activeEncounter?.pendingStep?.type === "singleMothershipRoll",
  "Pirate outcome rolls should wait for an explicit active-player mothership roll."
);
assert(
  !singleRollEncounterGame.activeEncounter?.pendingStep?.roll,
  "Pirate outcome rolls must not be generated before the active player presses the roll button."
);
assert(singleRollEncounterGame.players[0].halfMedals === 2, "Pirate roll outcomes must not apply before the visible roll.");
const singleRollFlightSpeed = singleRollEncounterGame.flightSpeedTotal;
const rejectedPassiveSingleRoll = submitEncounterPending(singleRollEncounterGame, {
  playerId: "player-2",
  forcedRoll: { balls: ["blue", "blue"] }
});
assert(
  !rejectedPassiveSingleRoll.activeEncounter?.pendingStep?.roll,
  "A passive player must not be able to trigger an active-only encounter roll."
);
singleRollEncounterGame = submitEncounterMothershipRoll(singleRollEncounterGame, "player-1", ["blue", "blue"]);
assert(
  singleRollEncounterGame.activeEncounter?.pendingStep?.type === "singleMothershipRoll"
    && singleRollEncounterGame.activeEncounter.pendingStep.roll?.total === 2,
  "The active player's pirate roll should be stored until the board animation completes."
);
assert(singleRollEncounterGame.players[0].halfMedals === 2, "A stored roll must not apply its outcome before animation completion.");
const savedSingleRollEncounter = normalizeGameState(JSON.parse(JSON.stringify(singleRollEncounterGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(
  savedSingleRollEncounter.activeEncounter?.pendingStep?.roll?.total === 2,
  "A waiting single-player encounter roll should survive save/load normalization."
);
const repeatedSingleRoll = submitEncounterPending(savedSingleRollEncounter, {
  playerId: "player-1",
  forcedRoll: { balls: ["yellow", "yellow"] }
});
assert(
  repeatedSingleRoll.activeEncounter?.pendingStep?.roll?.total === 2,
  "Repeated input must not replace an already stored encounter roll."
);
singleRollEncounterGame = submitEncounterPending(savedSingleRollEncounter, {
  playerId: "player-1",
  completeRoll: true
});
assert(singleRollEncounterGame.activeEncounter?.status === "resolved", "The pirate encounter should resolve after the board animation completes.");
assert(
  singleRollEncounterGame.players[0].halfMedals === 1,
  "Pirate outcome rolls must use only colored ball points, without cannon or friendship bonuses."
);
assert(
  singleRollEncounterGame.flightSpeedTotal === singleRollFlightSpeed,
  "Single-player encounter rolls must not overwrite normal flight speed."
);
const repeatedSingleRollCompletion = submitEncounterPending(singleRollEncounterGame, {
  playerId: "player-1",
  completeRoll: true
});
assert(
  repeatedSingleRollCompletion.players[0].halfMedals === 1,
  "Reloading or resubmitting must not apply a completed single-player roll twice."
);

let driveGainEncounterGame = determineFlightSpeed(encounterBaseState, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-14"
});
driveGainEncounterGame = revealPendingFlightEncounter(driveGainEncounterGame);
driveGainEncounterGame = resolveEncounterChoice(driveGainEncounterGame, { choiceId: "decline" });
driveGainEncounterGame = {
  ...driveGainEncounterGame,
  players: driveGainEncounterGame.players.map((player, index) => index === 0
    ? { ...player, upgrades: { ...player.upgrades, drive: 2 } }
    : player)
};
driveGainEncounterGame = normalizeGameState(JSON.parse(JSON.stringify(driveGainEncounterGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
driveGainEncounterGame = finishEncounter(driveGainEncounterGame);
assert(driveGainEncounterGame.flightSpeedTotal === 5, "Encounter drive gains should increase movement before ships can move.");
assert(driveGainEncounterGame.remainingMovementByShipId?.[encounterShipId] === 5, "Remaining movement should use the post-encounter drive gain.");

let driveLossEncounterGame = {
  ...encounterBaseState,
  players: encounterBaseState.players.map((player, index) => index === 0
    ? { ...player, upgrades: { ...player.upgrades, drive: 2 }, friendshipCards: ["wise-drive-boost"] }
    : player)
};
driveLossEncounterGame = determineFlightSpeed(driveLossEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-14"
});
driveLossEncounterGame = revealPendingFlightEncounter(driveLossEncounterGame);
driveLossEncounterGame = resolveEncounterChoice(driveLossEncounterGame, { choiceId: "decline" });
driveLossEncounterGame = {
  ...driveLossEncounterGame,
  players: driveLossEncounterGame.players.map((player, index) => index === 0
    ? { ...player, upgrades: { ...player.upgrades, drive: 1 } }
    : player)
};
driveLossEncounterGame = finishEncounter(driveLossEncounterGame);
assert(driveLossEncounterGame.flightSpeedTotal === 6, "Encounter drive losses should recalculate speed while preserving friendship drive bonuses.");
assert(driveLossEncounterGame.remainingMovementByShipId?.[encounterShipId] === 6, "Remaining movement should use post-encounter real drives plus friendship bonuses.");

let pendingEncounterGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
pendingEncounterGame = {
  ...pendingEncounterGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: pendingEncounterGame.players.map((player, index) => ({
    ...player,
    resources: index === 0
      ? { ore: 3, fuel: 0, carbon: 0, food: 0, goods: 0 }
      : player.resources,
    upgrades: index === 0
      ? { drive: 1, cargo: 0, cannon: 0 }
      : player.upgrades,
    friendshipCards: index === 0 ? [] : player.friendshipCards,
    halfMedals: index === 0 ? 1 : player.halfMedals
  }))
};
pendingEncounterGame = determineFlightSpeed(pendingEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-02"
});
pendingEncounterGame = revealPendingFlightEncounter(pendingEncounterGame);
pendingEncounterGame = resolveEncounterChoice(pendingEncounterGame, { choiceId: "gift-3" });
assert(pendingEncounterGame.activeEncounter?.pendingStep?.type === "resourceSelection", "Merchant encounters should pause for resource loss selection.");
const normalizedPendingEncounter = normalizeGameState(JSON.parse(JSON.stringify(pendingEncounterGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(normalizedPendingEncounter.activeEncounter?.pendingStep?.type === "resourceSelection", "Save/load normalization should preserve pending encounter steps.");
pendingEncounterGame = updateEncounterResourceSelection(pendingEncounterGame, "ore", 1);
pendingEncounterGame = updateEncounterResourceSelection(pendingEncounterGame, "ore", 1);
pendingEncounterGame = updateEncounterResourceSelection(pendingEncounterGame, "ore", 1);
pendingEncounterGame = submitEncounterPending(pendingEncounterGame);
assert(pendingEncounterGame.activeEncounter?.pendingStep?.type === "upgradeSelection", "Encounter follow-up should continue to upgrade selection.");
pendingEncounterGame = submitEncounterPending(pendingEncounterGame, { upgrade: "cargo" });
assert(pendingEncounterGame.activeEncounter?.status === "resolved", "Encounter should resolve after completing all pending choices.");
assert(pendingEncounterGame.players[0].resources.ore === 0, "Encounter resource loss should remove the selected resources.");
assert(pendingEncounterGame.players[0].upgrades.cargo === 1, "Encounter upgrade rewards should apply after selection.");
assert(pendingEncounterGame.players[0].halfMedals === 2, "Encounter medal rewards should still apply after pending steps.");
pendingEncounterGame = finishEncounter(pendingEncounterGame);
assert(pendingEncounterGame.encounterDiscard.includes("spreadsheet-02"), "Completed pending encounters should also move to the discard pile.");

let cappedUpgradeEncounterGame = {
  ...encounterBaseState,
  players: encounterBaseState.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: { ore: 3, fuel: 0, carbon: 0, food: 0, goods: 0 },
      upgrades: { drive: 6, cargo: 5, cannon: 6 },
      halfMedals: 0
    }
    : player)
};
cappedUpgradeEncounterGame = determineFlightSpeed(cappedUpgradeEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-02"
});
cappedUpgradeEncounterGame = revealPendingFlightEncounter(cappedUpgradeEncounterGame);
cappedUpgradeEncounterGame = resolveEncounterChoice(cappedUpgradeEncounterGame, { choiceId: "gift-3" });
cappedUpgradeEncounterGame = updateEncounterResourceSelection(cappedUpgradeEncounterGame, "ore", 1);
cappedUpgradeEncounterGame = updateEncounterResourceSelection(cappedUpgradeEncounterGame, "ore", 1);
cappedUpgradeEncounterGame = updateEncounterResourceSelection(cappedUpgradeEncounterGame, "ore", 1);
cappedUpgradeEncounterGame = submitEncounterPending(cappedUpgradeEncounterGame);
assert(cappedUpgradeEncounterGame.activeEncounter?.status === "resolved", "A capped mothership must not get stuck on an empty upgrade selection.");
assert(!cappedUpgradeEncounterGame.activeEncounter?.pendingStep, "A capped mothership should skip the unavailable upgrade selection.");
assert(
  cappedUpgradeEncounterGame.activeEncounter?.resultText?.de?.includes("Ausbau entfällt"),
  "A skipped upgrade reward should explain why the encounter continues."
);
assert(cappedUpgradeEncounterGame.players[0].halfMedals === 1, "Effects after a skipped upgrade reward should still run exactly once.");
const savedCappedUpgradeEncounterGame = normalizeGameState(JSON.parse(JSON.stringify(cappedUpgradeEncounterGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(savedCappedUpgradeEncounterGame.activeEncounter?.status === "resolved", "A skipped upgrade reward should remain resolved after save/load.");
const repeatedCappedUpgradeSubmit = submitEncounterPending(savedCappedUpgradeEncounterGame);
assert(repeatedCappedUpgradeSubmit.players[0].halfMedals === 1, "Reloading or resubmitting must not repeat effects after a skipped upgrade reward.");

let tradeLordGiftGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
tradeLordGiftGame = {
  ...tradeLordGiftGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: tradeLordGiftGame.players.map((player, index) => ({
    ...player,
    resources: index === 0
      ? { ore: 2, fuel: 0, carbon: 0, food: 0, goods: 0 }
      : player.resources,
    halfMedals: index === 0 ? 1 : player.halfMedals
  }))
};
tradeLordGiftGame = determineFlightSpeed(tradeLordGiftGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-05"
});
tradeLordGiftGame = revealPendingFlightEncounter(tradeLordGiftGame);
tradeLordGiftGame = resolveEncounterChoice(tradeLordGiftGame, { choiceId: "gift-2" });
assert(tradeLordGiftGame.activeEncounter?.pendingStep?.type === "resourceSelection", "Trade lord gifts should first request the concrete resources to pay.");
assert(tradeLordGiftGame.activeEncounter?.pendingStep?.mode === "loss", "Trade lord gift payment should be a resource loss selection.");
tradeLordGiftGame = updateEncounterResourceSelection(tradeLordGiftGame, "ore", 1);
tradeLordGiftGame = updateEncounterResourceSelection(tradeLordGiftGame, "ore", 1);
assert(tradeLordGiftGame.players[0].resources.ore === 2, "Encounter payments should not remove resources before confirmation.");
tradeLordGiftGame = submitEncounterPending(tradeLordGiftGame);
assert(tradeLordGiftGame.players[0].resources.ore === 0, "Confirmed encounter payments should remove the selected resources.");
assert(tradeLordGiftGame.activeEncounter?.pendingStep?.type === "resourceSelection", "Trade lord gift rewards should request a resource choice after payment.");
assert(tradeLordGiftGame.activeEncounter?.pendingStep?.mode === "gain", "Trade lord gift reward should be a resource gain selection.");
tradeLordGiftGame = updateEncounterResourceSelection(tradeLordGiftGame, "fuel", 1);
tradeLordGiftGame = submitEncounterPending(tradeLordGiftGame);
assert(tradeLordGiftGame.players[0].resources.fuel === 1, "Chosen encounter reward resources should be added after confirmation.");
assert(tradeLordGiftGame.players[0].halfMedals === 2, "Trade lord reward should grant the half medal after the resource choice.");
assert(tradeLordGiftGame.activeEncounter?.status === "resolved", "Trade lord gift encounter should be finishable after all pending choices.");

let merchantPirateGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
merchantPirateGame = {
  ...merchantPirateGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: merchantPirateGame.players.map((player, index) => ({
    ...player,
    resources: index === 0
      ? { ore: 2, fuel: 0, carbon: 0, food: 0, goods: 0 }
      : player.resources,
    halfMedals: index === 0 ? 1 : player.halfMedals
  }))
};
merchantPirateGame = determineFlightSpeed(merchantPirateGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-07"
});
merchantPirateGame = revealPendingFlightEncounter(merchantPirateGame);
merchantPirateGame = resolveEncounterChoice(merchantPirateGame, { choiceId: "gift-2" });
merchantPirateGame = updateEncounterResourceSelection(merchantPirateGame, "ore", 1);
merchantPirateGame = updateEncounterResourceSelection(merchantPirateGame, "ore", 1);
merchantPirateGame = submitEncounterPending(merchantPirateGame);
assert(merchantPirateGame.activeEncounter?.pendingStep?.type === "choiceSelection", "Merchant pirate cards should ask the attack follow-up after paid resources.");
merchantPirateGame = submitEncounterPending(merchantPirateGame, {
  choiceId: "attack"
});
assert(merchantPirateGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Merchant pirate attacks should wait for both mothership rolls.");
merchantPirateGame = submitEncounterMothershipRoll(merchantPirateGame, "player-1", ["red", "red"]);
assert(merchantPirateGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Merchant pirate attacks should not resolve after only the active player rolls.");
merchantPirateGame = submitEncounterMothershipRoll(merchantPirateGame, "player-2", ["black", "black"]);
assert(merchantPirateGame.players[0].resources.ore === 2, "Winning against the merchant pirate should return previously given resources.");
assert(merchantPirateGame.players[0].halfMedals === 2, "Winning against the merchant pirate should grant a half medal.");
assert(merchantPirateGame.activeEncounter?.status === "resolved", "Merchant pirate follow-up should resolve after the selected branch.");

let giftedTradeShipGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
giftedTradeShipGame = {
  ...giftedTradeShipGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: giftedTradeShipGame.players.map((player, index) => ({
    ...player,
    resources: index === 0
      ? { ore: 3, fuel: 0, carbon: 0, food: 0, goods: 0 }
      : player.resources,
    halfMedals: index === 0 ? 1 : player.halfMedals
  }))
};
giftedTradeShipGame = determineFlightSpeed(giftedTradeShipGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-05"
});
giftedTradeShipGame = revealPendingFlightEncounter(giftedTradeShipGame);
giftedTradeShipGame = resolveEncounterChoice(giftedTradeShipGame, { choiceId: "gift-3" });
giftedTradeShipGame = updateEncounterResourceSelection(giftedTradeShipGame, "ore", 1);
giftedTradeShipGame = updateEncounterResourceSelection(giftedTradeShipGame, "ore", 1);
giftedTradeShipGame = updateEncounterResourceSelection(giftedTradeShipGame, "ore", 1);
giftedTradeShipGame = submitEncounterPending(giftedTradeShipGame);
const giftedTradeShip = giftedTradeShipGame.board.ships.find((ship) => ship.type === "tradeShip" && ship.ownerPlayerId === "player-1");
assert(giftedTradeShip, "Gifted trade ship should be placed when a launch point is available.");
assert(
  giftedTradeShipGame.remainingMovementByShipId[giftedTradeShip.id] === giftedTradeShipGame.flightSpeedTotal,
  "Gifted trade ship should be movable in the same flight phase."
);

let combatEncounterGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
combatEncounterGame = {
  ...combatEncounterGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: combatEncounterGame.players.map((player, index) => ({
    ...player,
    resources: index === 0
      ? { ore: 0, fuel: 0, carbon: 0, food: 0, goods: 0 }
      : player.resources,
    upgrades: index === 0
      ? { drive: 1, cargo: 0, cannon: 1 }
      : { drive: 0, cargo: 0, cannon: 0 },
    friendshipCards: index === 0 ? ["wise-speed-combat-1"] : [],
    halfMedals: index === 0 ? 1 : player.halfMedals
  }))
};
combatEncounterGame = determineFlightSpeed(combatEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-23"
});
combatEncounterGame = revealPendingFlightEncounter(combatEncounterGame);
combatEncounterGame = resolveEncounterChoice(combatEncounterGame, {
  choiceId: "help"
});
assert(combatEncounterGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Combat encounter should wait for both involved players to roll.");
const savedCombatPending = normalizeGameState(JSON.parse(JSON.stringify(combatEncounterGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(savedCombatPending.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Two-player encounter roll state should survive save/load normalization.");
combatEncounterGame = submitEncounterMothershipRoll(combatEncounterGame, "player-1", ["red", "red"]);
assert(combatEncounterGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Active player rolling alone should not resolve combat.");
assert(Boolean(combatEncounterGame.activeEncounter?.pendingStep?.activeRoll), "Active combat roll should be stored.");
assert(!combatEncounterGame.activeEncounter?.pendingStep?.targetRoll, "Passive combat roll should still be missing after active roll.");
combatEncounterGame = submitEncounterMothershipRoll(combatEncounterGame, "player-2", ["blue", "blue"]);
assert(combatEncounterGame.activeEncounter?.combat?.strength === 8, "Combat should count ball points plus cannons plus friendship bonuses.");
assert(combatEncounterGame.activeEncounter?.combat?.enemyStrength === 2, "Passive combat strength should use the passive player's mothership roll and combat bonus.");
assert(combatEncounterGame.activeEncounter?.pendingStep?.type === "resourceSelection", "Combat encounter rewards should be able to request a resource choice.");
combatEncounterGame = updateEncounterResourceSelection(combatEncounterGame, "ore", 1);
combatEncounterGame = updateEncounterResourceSelection(combatEncounterGame, "fuel", 1);
combatEncounterGame = submitEncounterPending(combatEncounterGame);
assert(combatEncounterGame.activeEncounter?.status === "resolved", "Combat encounter should resolve after the reward selection.");
assert(combatEncounterGame.players[0].resources.ore === 1 && combatEncounterGame.players[0].resources.fuel === 1, "Combat reward selection should grant the chosen resources.");
assert(combatEncounterGame.players[0].halfMedals === 2, "Combat encounter success should grant a half medal.");
combatEncounterGame = finishEncounter(combatEncounterGame);
assert(combatEncounterGame.encounterDiscard.includes("spreadsheet-23"), "Combat encounters should move to the discard pile after finishing.");

const encounterDeckIds = getEncounterDeckIds();
assert(encounterDeckIds.length === 32, "Encounter deck should expose the full active 32-card set.");
assert(
  encounterDeckIds
    .map((cardId) => getEncounterCardById(cardId)?.number)
    .every((number, index) => number === index + 1),
  "Encounter deck should be normalized as cards 1 through 32 in order."
);
assert(
  encounterDeckIds.every((cardId) => getEncounterCardById(cardId)?.implemented === true),
  "Encounter deck should only contain implemented cards."
);
assert(
  getEncounterCardById("spreadsheet-28")?.promptDe === "Du triffst ein Raumschiff des wandernden Volkes. Dieses in der ganzen Galaxie verehrte Volk bittet dich um eine Spende. Wie viele Rohstoffe (bis zu 3) schenkst du?",
  "Encounter prompts should use the exact Markdown text."
);
const wanderingDonationJumpText = "Als Dank wird ein Raumsprung gewährt. Wähle eines deiner Schiffe, mit diesem darfst du einen Raumsprung ausführen.";
assert(
  getEncounterCardById("spreadsheet-28")?.choices.find((choice) => choice.id === "gift-2")?.resultText?.de === wanderingDonationJumpText,
  "Encounter choices should keep the exact Markdown follow-up text."
);
let wanderingFollowUpGame = {
  ...encounterBaseState,
  players: encounterBaseState.players.map((player, index) => index === 0
    ? { ...player, resources: { ore: 2, fuel: 0, carbon: 0, food: 0, goods: 0 } }
    : player)
};
wanderingFollowUpGame = determineFlightSpeed(wanderingFollowUpGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-28"
});
wanderingFollowUpGame = revealPendingFlightEncounter(wanderingFollowUpGame);
wanderingFollowUpGame = resolveEncounterChoice(wanderingFollowUpGame, { choiceId: "gift-2" });
assert(
  !wanderingFollowUpGame.activeEncounter?.resultText,
  "Encounter follow-up text should wait until concrete donated resources are confirmed."
);
assert(
  wanderingFollowUpGame.activeEncounter?.pendingStep?.type === "resourceSelection",
  "Encounter donation choices should first request the concrete resources to pay."
);
wanderingFollowUpGame = updateEncounterResourceSelection(wanderingFollowUpGame, "ore", 1);
wanderingFollowUpGame = updateEncounterResourceSelection(wanderingFollowUpGame, "ore", 1);
wanderingFollowUpGame = submitEncounterPending(wanderingFollowUpGame);
assert(
  wanderingFollowUpGame.activeEncounter?.resultText?.de === wanderingDonationJumpText,
  "Encounter follow-up state should show the Markdown text after resource payment."
);
assert(
  wanderingFollowUpGame.activeEncounter?.pendingStep?.type === "shipJumpSelection",
  "Encounter follow-up effects should continue after the spreadsheet text is available."
);

let pirateStepGame = determineFlightSpeed(encounterBaseState, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-18"
});
pirateStepGame = revealPendingFlightEncounter(pirateStepGame);
pirateStepGame = resolveEncounterChoice(pirateStepGame, {
  choiceId: "fight"
});
assert(pirateStepGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Pirate fight should wait for active and passive mothership rolls.");
pirateStepGame = submitEncounterMothershipRoll(pirateStepGame, "player-1", ["red", "red"]);
assert(pirateStepGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Pirate fight should not resolve after one roll.");
pirateStepGame = submitEncounterMothershipRoll(pirateStepGame, "player-2", ["blue", "blue"]);
const pirateFightText = pirateStepGame.activeEncounter?.resultText?.de ?? "";
assert(pirateFightText.includes("Sieg."), "Combat encounters should show the selected combat result text.");
assert(!pirateFightText.includes("Niederlage."), "Combat encounters should not show unselected failure text.");
assert(!pirateFightText.includes("Hast du gleich"), "Combat encounters should not dump earlier decision steps after the result.");

let pirateFleeGame = determineFlightSpeed(encounterBaseState, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-18"
});
pirateFleeGame = revealPendingFlightEncounter(pirateFleeGame);
pirateFleeGame = {
  ...pirateFleeGame,
  players: pirateFleeGame.players.map((player, index) => ({
    ...player,
    upgrades: {
      ...player.upgrades,
      drive: index === 0 ? 1 : 3
    },
    friendshipCards: index === 0 ? ["wise-drive-boost"] : []
  }))
};
pirateFleeGame = resolveEncounterChoice(pirateFleeGame, {
  choiceId: "flee"
});
assert(pirateFleeGame.activeEncounter?.pendingStep?.type === "driveComparisonPreview", "Pure drive flee checks should show a comparison preview before resolving.");
assert(pirateFleeGame.activeEncounter.pendingStep.active.physicalDrives === 1, "Drive comparison preview should store the active player's physical drives.");
assert(pirateFleeGame.activeEncounter.pendingStep.active.friendshipBonus === 2, "Drive comparison preview should store friendship drive bonuses separately.");
assert(pirateFleeGame.activeEncounter.pendingStep.active.effectiveDrives === 3, "Drive comparison preview should add physical drives and friendship bonuses.");
assert(pirateFleeGame.activeEncounter.pendingStep.target.effectiveDrives === 3, "Drive comparison preview should store the comparison player's effective drives.");
assert(pirateFleeGame.activeEncounter.pendingStep.outcome === "equal", "Equal effective drives should be shown as an equal comparison.");
assert(pirateFleeGame.activeEncounter.pendingStep.success === true, "Equal effective drives should keep the flee success branch.");
const savedPirateFleeGame = normalizeGameState(JSON.parse(JSON.stringify(pirateFleeGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(savedPirateFleeGame.activeEncounter?.pendingStep?.type === "driveComparisonPreview", "Drive comparison previews should survive save/load normalization.");
pirateFleeGame = submitEncounterPending(pirateFleeGame);
const pirateFleeText = pirateFleeGame.activeEncounter?.resultText?.de ?? "";
assert(pirateFleeText === "Deine Flucht gelingt.", "Successful flee checks should show only the flee success text.");
assert(!pirateFleeText.includes("Sieg.") && !pirateFleeText.includes("Niederlage."), "Successful flee checks should not show combat branches.");

let distortionEncounterGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
distortionEncounterGame = {
  ...distortionEncounterGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: distortionEncounterGame.players.map((player, index) => ({
    ...player,
    upgrades: index === 0
      ? { drive: 2, cargo: 0, cannon: 0 }
      : { drive: 3, cargo: 0, cannon: 0 },
    friendshipCards: index === 0 ? ["wise-speed-combat-1"] : [],
    resources: { ore: 0, fuel: 0, carbon: 0, food: 0, goods: 0 }
  }))
};
distortionEncounterGame = determineFlightSpeed(distortionEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-26"
});
distortionEncounterGame = revealPendingFlightEncounter(distortionEncounterGame);
distortionEncounterGame = resolveEncounterChoice(distortionEncounterGame, {
  choiceId: "attempt"
});
assert(distortionEncounterGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Space distortion speed checks should wait for both mothership rolls.");
distortionEncounterGame = submitEncounterMothershipRoll(distortionEncounterGame, "player-1", ["yellow", "yellow"]);
assert(distortionEncounterGame.activeEncounter?.pendingStep?.type === "dualMothershipRoll", "Space distortion should not continue after only the active speed roll.");
distortionEncounterGame = submitEncounterMothershipRoll(distortionEncounterGame, "player-2", ["yellow", "yellow"]);
assert(distortionEncounterGame.activeEncounter?.pendingStep?.type === "shipJumpSelection", "Space distortion encounters should request a ship first.");
const distortionShipId = distortionEncounterGame.activeEncounter?.pendingStep?.shipIds?.[0];
assert(Boolean(distortionShipId), "Space distortion encounters should expose at least one ship for jumping.");
if (distortionShipId) {
  distortionEncounterGame = submitEncounterPending(distortionEncounterGame, { shipId: distortionShipId });
}
assert(distortionEncounterGame.activeEncounter?.pendingStep?.type === "boardTargetSelection", "Space distortion encounters should request a board target after the ship selection.");
const hiddenSystemNodeIds = new Set((distortionEncounterGame.board?.placedSystems ?? [])
  .filter((system) => !(distortionEncounterGame.board?.exploredSystems ?? []).includes(system.id))
  .flatMap((system) => system.blockedNodeIds ?? []));
const distortionTarget = distortionEncounterGame.activeEncounter?.pendingStep?.validNodeIds
  ?.find((nodeId) => hiddenSystemNodeIds.has(nodeId))
  ?? distortionEncounterGame.activeEncounter?.pendingStep?.validNodeIds?.[0];
const distortionWasHiddenCenter = hiddenSystemNodeIds.has(distortionTarget);
assert(Boolean(distortionTarget), "Space distortion encounters should expose at least one valid jump target.");
distortionEncounterGame = {
  ...distortionEncounterGame,
  remainingMovementByShipId: {
    ...(distortionEncounterGame.remainingMovementByShipId ?? {}),
    [distortionShipId]: 4
  }
};
if (distortionTarget) {
  distortionEncounterGame = submitEncounterPending(distortionEncounterGame, { targetNodeId: distortionTarget });
}
assert(distortionEncounterGame.activeEncounter?.status === "resolved", "Space distortion encounter should resolve after choosing a jump target.");
assert(distortionEncounterGame.remainingMovementByShipId?.[distortionShipId] === 4, "Space distortion jumps should not consume normal flight movement.");
if (distortionWasHiddenCenter) {
  const jumpedShip = distortionEncounterGame.board?.ships?.find((ship) => ship.id === distortionShipId);
  assert(jumpedShip?.locationId !== distortionTarget, "Space distortion should not leave a ship on a hidden planet-system center.");
}

let chainedEncounterGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
chainedEncounterGame = {
  ...chainedEncounterGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: chainedEncounterGame.players.map((player, index) => ({
    ...player,
    upgrades: index === 0
      ? { drive: 3, cargo: 0, cannon: 0 }
      : { drive: 0, cargo: 0, cannon: 0 },
    friendshipCards: []
  }))
};
chainedEncounterGame = determineFlightSpeed(chainedEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-26"
});
chainedEncounterGame = revealPendingFlightEncounter(chainedEncounterGame);
chainedEncounterGame = resolveEncounterChoice(chainedEncounterGame, {
  choiceId: "decline"
});
assert(chainedEncounterGame.activeEncounter?.cardId !== "spreadsheet-26", "Follow-up encounter effects should immediately draw the next card.");
assert(chainedEncounterGame.encounterDiscard.includes("spreadsheet-26"), "Encounter chains without full reshuffle should discard the resolved card.");

let toothEncounterGame = normalizeGameState(JSON.parse(JSON.stringify(baseProductionGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
toothEncounterGame = {
  ...toothEncounterGame,
  phase: "flight",
  currentPlayerIndex: 0,
  players: toothEncounterGame.players.map((player, index) => ({
    ...player,
    upgrades: index === 0
      ? { drive: 6, cargo: 1, cannon: 2 }
      : { drive: 4, cargo: 2, cannon: 1 },
    friendshipCards: index === 0 ? ["wise-drive-boost"] : [],
    halfMedals: 0
  }))
};
toothEncounterGame = determineFlightSpeed(toothEncounterGame, {
  balls: ["black", "yellow"],
  encounterCardId: "spreadsheet-32"
});
toothEncounterGame = revealPendingFlightEncounter(toothEncounterGame);
toothEncounterGame = resolveEncounterChoice(toothEncounterGame, { choiceId: "continue" });
assert(toothEncounterGame.activeEncounter?.pendingStep?.type === "globalUpgradeLossSelection", "Global encounter cards should enter a multi-player upgrade loss step.");
toothEncounterGame = submitEncounterPending(toothEncounterGame, { upgrade: "drive" });
assert(getRealUpgradeValue(toothEncounterGame.players[0], "drive") === 5, "Global upgrade loss should remove only real mothership upgrades.");
assert(getFriendshipUpgradeBonus(toothEncounterGame, "player-1", "drive") === 2, "Global upgrade loss should not remove friendship drive bonuses.");
assert(getEffectiveUpgradeValue(toothEncounterGame, "player-1", "drive") === 7, "Effective drives should keep remaining real upgrades plus friendship bonuses after global loss.");
toothEncounterGame = submitEncounterPending(toothEncounterGame, { upgrade: "drive" });
assert(Boolean(toothEncounterGame.activeEncounter?.cardId), "Global follow-up cards should draw a new encounter immediately.");
assert(toothEncounterGame.activeEncounter?.cardId !== "spreadsheet-32", "Global cards should transition into a new encounter after resolving.");
assert(toothEncounterGame.players[0].halfMedals === 0, "The Galactic Council should not reward a player with fewer physical cargo rings.");
assert(toothEncounterGame.players[1].halfMedals === 1, "The Galactic Council should reward the sole leader in physical cargo rings.");

assert(calculateVictoryPoints(game, "player-1") >= 4, "Central scoring should count starting colonies and spaceports.");

const scoringGame = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
const scoringBasePoints = calculateVictoryPoints(scoringGame, "player-1");
scoringGame.players = scoringGame.players.map((player, index) => index === 0
  ? {
    ...player,
    friendshipMarkers: ["friendship-a"],
    specialMedals: ["special-a"],
    halfMedals: 2
  }
  : player);
assert(calculateVictoryPoints(scoringGame, "player-1") === scoringBasePoints + 4, "Scoring should add friendship marker, special medal and two half medals correctly.");

let noGameOverState = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
noGameOverState = {
  ...noGameOverState,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: noGameOverState.players.map((player, index) => index === 1
    ? {
      ...player,
      specialMedals: Array.from({ length: 11 }, (_, medalIndex) => `special-${medalIndex}`)
    }
    : {
      ...player,
      resources: {
        ...player.resources,
        fuel: 2
      }
    })
};
noGameOverState = buyUpgrade(noGameOverState, "drive");
assert(noGameOverState.phase !== "gameOver", "A non-active player reaching 15 points should not end the game immediately.");

let gameOverState = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
gameOverState = {
  ...gameOverState,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: gameOverState.players.map((player, index) => index === 0
    ? {
      ...player,
      specialMedals: Array.from({ length: 10 }, (_, medalIndex) => `victory-${medalIndex}`),
      resources: {
        ...player.resources,
        fuel: 2
      }
    }
    : player)
};
gameOverState = buyUpgrade(gameOverState, "drive");
assert(gameOverState.phase === "gameOver", "The game should end when the active player reaches or holds 15 points.");
assert(gameOverState.winnerPlayerId === "player-1", "Winner should be stored when the game ends.");

const resourcesAfterGameOver = JSON.stringify(gameOverState.players[0].resources);
const blockedAfterGameOver = buildShip(gameOverState, boardLayout, "colonyShip");
assert(JSON.stringify(blockedAfterGameOver.players[0].resources) === resourcesAfterGameOver, "Actions after game over should not change resources.");

let invalidSpaceportState = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
invalidSpaceportState = {
  ...invalidSpaceportState,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: invalidSpaceportState.players.map((player, index) => index === 0
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
invalidSpaceportState = startPendingSpaceportUpgrade(invalidSpaceportState);
const invalidSpaceportResourcesBefore = JSON.stringify(invalidSpaceportState.players[0].resources);
const invalidSpaceportTarget = invalidSpaceportState.board.structures.find((structure) => structure.ownerPlayerId === "player-2")?.id;
invalidSpaceportState = confirmPendingSpaceportUpgrade(invalidSpaceportState, invalidSpaceportTarget);
assert(JSON.stringify(invalidSpaceportState.players[0].resources) === invalidSpaceportResourcesBefore, "Invalid spaceport upgrades must not change resources.");

let invalidShipPlacementState = normalizeGameState(JSON.parse(JSON.stringify(game)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
invalidShipPlacementState = {
  ...invalidShipPlacementState,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: invalidShipPlacementState.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: {
        ...player.resources,
        ore: 1,
        fuel: 1,
        carbon: 1,
        food: 1
      }
    }
    : player)
};
invalidShipPlacementState = buildShip(invalidShipPlacementState, boardLayout, "colonyShip");
const invalidShipResourcesBefore = JSON.stringify(invalidShipPlacementState.players[0].resources);
invalidShipPlacementState = placePendingShip(invalidShipPlacementState, boardLayout, "invalid-point");
assert(JSON.stringify(invalidShipPlacementState.players[0].resources) === invalidShipResourcesBefore, "Invalid ship placement must not change resources.");

const movementTriplet = findPlainMovementTriplet(game);
assert(Boolean(movementTriplet), "A plain movement triplet should exist for movement tests.");

if (movementTriplet) {
  let occupiedPassState = createMovementTestState(game, {
    ships: [
      { id: "player-1-move", ownerPlayerId: "player-1", type: "colonyShip", locationId: movementTriplet.start, status: "active" },
      { id: "player-2-blocker", ownerPlayerId: "player-2", type: "tradeShip", locationId: movementTriplet.middle, status: "active" }
    ],
    remainingMovementByShipId: {
      "player-1-move": 2
    }
  });

  const passedOccupiedNode = moveShip(occupiedPassState, boardLayout, "player-1-move", movementTriplet.end);
  const moveLog = passedOccupiedNode.log.at(-1);
  assert(
    passedOccupiedNode.board.ships.find((ship) => ship.id === "player-1-move")?.locationId === movementTriplet.end,
    "Ships should be able to pass through occupied nodes."
  );
  assert(
    moveLog?.messageKey === "logShipMovedMany" &&
      moveLog.messageParams.shipOrdinal === "first" &&
      moveLog.messageParams.count === 2 &&
      !("from" in moveLog.messageParams) &&
      !("to" in moveLog.messageParams),
    "Ship movement logs should use ship ordinal and distance without exposing internal node IDs."
  );
  assert(
    (passedOccupiedNode.remainingMovementByShipId?.["player-1-move"] ?? -1) === 0,
    "Passing an occupied node should still consume movement."
  );

  const blockedOccupiedEndpoint = moveShip(occupiedPassState, boardLayout, "player-1-move", movementTriplet.middle);
  assert(
    blockedOccupiedEndpoint.board.ships.find((ship) => ship.id === "player-1-move")?.locationId === movementTriplet.start,
    "Occupied nodes must not be valid movement endpoints."
  );

  let multiShipState = createMovementTestState(game, {
    ships: [
      { id: "player-1-a", ownerPlayerId: "player-1", type: "colonyShip", locationId: movementTriplet.start, status: "active" },
      { id: "player-1-b", ownerPlayerId: "player-1", type: "tradeShip", locationId: movementTriplet.end, status: "active" }
    ],
    remainingMovementByShipId: {
      "player-1-a": 2,
      "player-1-b": 2
    }
  });
  multiShipState = moveShip(multiShipState, boardLayout, "player-1-a", movementTriplet.middle);
  assert(
    (multiShipState.remainingMovementByShipId?.["player-1-a"] ?? -1) === 1,
    "Moved ships should lose only their own remaining movement."
  );
  assert(
    (multiShipState.remainingMovementByShipId?.["player-1-b"] ?? -1) === 2,
    "Other ships must keep their own remaining movement."
  );
}

const freeColonySite = findFreePlanetColonySite(game);
assert(Boolean(freeColonySite), "A free colony site should exist for flight landing tests.");

if (freeColonySite) {
  const colonyShipLandingState = createMovementTestState(game, {
    ships: [
      {
        id: "player-1-colony-landing",
        ownerPlayerId: "player-1",
        type: "colonyShip",
        locationId: freeColonySite.launchNodeIds[0],
        status: "active"
      }
    ],
    remainingMovementByShipId: {
      "player-1-colony-landing": 1
    }
  });
  const colonyLandingResult = moveShip(colonyShipLandingState, boardLayout, "player-1-colony-landing", freeColonySite.nodeId);
  assert(
    colonyLandingResult.board.ships.find((ship) => ship.id === "player-1-colony-landing")?.locationId === freeColonySite.nodeId,
    "Colony ships should be able to end on valid colony sites."
  );
  const transporterBeforeFounding = getPlayerInventory(colonyLandingResult, "player-1").transporter.available;
  const exploredColonyState = {
    ...colonyLandingResult,
    board: {
      ...colonyLandingResult.board,
      exploredSystems: [...new Set([...(colonyLandingResult.board.exploredSystems ?? []), freeColonySite.systemId])]
    }
  };
  const foundedColonyState = foundColony(exploredColonyState, boardLayout, "player-1-colony-landing");
  assert(
    getPlayerInventory(foundedColonyState, "player-1").transporter.available === transporterBeforeFounding + 1,
    "Founding a colony should return the transporter to the player's reserve."
  );

  const tradeShipBlockedAtColonySite = createMovementTestState(game, {
    ships: [
      {
        id: "player-1-trade-at-colony",
        ownerPlayerId: "player-1",
        type: "tradeShip",
        locationId: freeColonySite.launchNodeIds[0],
        status: "active"
      }
    ],
    remainingMovementByShipId: {
      "player-1-trade-at-colony": 1
    }
  });
  const exploredTradeShipBlockedAtColonySite = {
    ...tradeShipBlockedAtColonySite,
    board: {
      ...tradeShipBlockedAtColonySite.board,
      exploredSystems: [...new Set([...(tradeShipBlockedAtColonySite.board.exploredSystems ?? []), freeColonySite.systemId])]
    }
  };
  const blockedTradeLanding = moveShip(exploredTradeShipBlockedAtColonySite, boardLayout, "player-1-trade-at-colony", freeColonySite.nodeId);
  assert(
    blockedTradeLanding.board.ships.find((ship) => ship.id === "player-1-trade-at-colony")?.locationId === freeColonySite.launchNodeIds[0],
    "Trade ships must not end on colony sites."
  );
}

const dockScenario = findValidDockApproachScenario(game);
assert(Boolean(dockScenario), "A reachable outpost dock should exist for flight tests.");

if (dockScenario) {
  const tradeShipDockState = createMovementTestState(game, {
    ships: [
      {
        id: "player-1-trade-dock",
        ownerPlayerId: "player-1",
        type: "tradeShip",
        locationId: dockScenario.approachNodeId,
        status: "active"
      }
    ],
      playerMutator: (player, index) => index === 0
        ? {
          ...player,
          upgrades: {
            ...player.upgrades,
            cargo: 5
          }
        }
        : player,
    remainingMovementByShipId: {
      "player-1-trade-dock": 1
    }
  });
  const tradeDockResult = moveShip(tradeShipDockState, boardLayout, "player-1-trade-dock", dockScenario.outpost.dockNodeId);
  assert(
    tradeDockResult.board.ships.find((ship) => ship.id === "player-1-trade-dock")?.locationId === dockScenario.outpost.dockNodeId,
    "Trade ships should be able to end on valid outpost dock points."
  );

  const colonyShipBlockedAtDock = createMovementTestState(game, {
    ships: [
      {
        id: "player-1-colony-dock",
        ownerPlayerId: "player-1",
        type: "colonyShip",
        locationId: dockScenario.approachNodeId,
        status: "active"
      }
    ],
    remainingMovementByShipId: {
      "player-1-colony-dock": 1
    }
  });
  const blockedColonyDock = moveShip(colonyShipBlockedAtDock, boardLayout, "player-1-colony-dock", dockScenario.outpost.dockNodeId);
  assert(
    blockedColonyDock.board.ships.find((ship) => ship.id === "player-1-colony-dock")?.locationId === dockScenario.approachNodeId,
    "Colony ships must not end on outpost dock points."
  );
}

let noShipsFlightState = createMovementTestState(game, {
  ships: [],
  remainingMovementByShipId: {},
  hasRolledFlightSpeed: false
});
noShipsFlightState = determineFlightSpeed(noShipsFlightState, {
  balls: ["yellow", "red"]
});
assert(noShipsFlightState.hasRolledFlightSpeed, "Players without ships should still be able to finish the flight phase cleanly.");
assert(Object.keys(noShipsFlightState.remainingMovementByShipId ?? {}).length === 0, "Players without ships should not receive movement entries.");
assert(noShipsFlightState.log.at(-1)?.messageKey === "logNoShipsInSpace", "Flight without ships should log the skipped ship movement.");

const classicVariantGame = createGameState({ language: "de", playerCount: 2, boardLayout });
assert(classicVariantGame.gameVariant === gameVariants.classic, "Classic should remain the default game variant.");
assert(classicVariantGame.supernova === null, "Classic games should not initialize Supernova state.");

const supernovaStartGame = createGameState({
  language: "de",
  playerCount: 3,
  boardLayout,
  gameVariant: gameVariants.supernova
});
assert(supernovaStartGame.gameVariant === gameVariants.supernova, "Supernova games should persist the selected variant.");
assert(Boolean(supernovaStartGame.supernova), "Supernova games should initialize variant state.");
for (const player of supernovaStartGame.players) {
  const missions = getSupernovaMissionsForPlayer(supernovaStartGame, player.id);
  assert(missions.length === 3, "Each Supernova player should receive 3 mission cards.");
  assert(new Set(missions.map((mission) => mission.category)).size === missions.length, "Initial Supernova missions should use different categories.");
}

assert(getSupplyDrawCount({
  ...supernovaStartGame,
  players: supernovaStartGame.players.map((player, index) => index === 0 ? { ...player, victoryPoints: 4 } : player)
}, { ...supernovaStartGame.players[0], victoryPoints: 4 }) === 3, "Supernova players with 3-5 victory points should draw 3 supply cards.");
assert(getSupplyDrawCount({
  ...supernovaStartGame,
  players: supernovaStartGame.players.map((player, index) => index === 0 ? { ...player, victoryPoints: 7 } : player)
}, { ...supernovaStartGame.players[0], victoryPoints: 7 }) === 2, "Supernova players with 6-8 victory points should draw 2 supply cards.");
assert(getSupplyDrawCount({
  ...supernovaStartGame,
  players: supernovaStartGame.players.map((player, index) => index === 0 ? { ...player, victoryPoints: 10 } : player)
}, { ...supernovaStartGame.players[0], victoryPoints: 10 }) === 1, "Supernova players with 9-11 victory points should draw 1 supply card.");

let supernovaDelayedSupplyGame = {
  ...supernovaStartGame,
  phase: "flight",
  hasRolledFlightSpeed: false,
  supplyDeck: ["ore", "fuel", "carbon", "food", "goods"],
  players: supernovaStartGame.players.map((player, index) => index === 0
    ? { ...player, victoryPoints: 4 }
    : player)
};
const supernovaSupplyBefore = getResourceTotal(supernovaDelayedSupplyGame.players[0]);
assert(canDrawSupply(supernovaDelayedSupplyGame), "Supernova supply should remain available before the normal flight roll.");
supernovaDelayedSupplyGame = drawSupply(supernovaDelayedSupplyGame);
assert(
  getResourceTotal(supernovaDelayedSupplyGame.players[0]) - supernovaSupplyBefore === 3,
  "A delayed Supernova supply draw should use the variant-specific 3-card amount."
);

let supernovaFactoryGame = createGameState({
  language: "de",
  playerCount: 2,
  boardLayout,
  gameVariant: gameVariants.supernova
});
const factoryPlanet = findBuildableFactoryPlanet(supernovaFactoryGame);
assert(Boolean(factoryPlanet), "Supernova factory smoke test needs a non-start planet with an adjacent site.");
if (factoryPlanet) {
  const factorySite = getSiteAdjacentToPlanet(supernovaFactoryGame, factoryPlanet.id);
  supernovaFactoryGame = normalizeGameState({
    ...supernovaFactoryGame,
    phase: "tradeBuild",
    currentPlayerIndex: 0,
    board: {
      ...supernovaFactoryGame.board,
      exploredSystems: [...new Set([...(supernovaFactoryGame.board.exploredSystems ?? []), factoryPlanet.systemId])],
      structures: [
        {
          id: "supernova-factory-test-colony",
          ownerPlayerId: "player-1",
          type: "colony",
          locationId: factorySite.nodeId,
          systemId: factorySite.systemId,
          adjacentPlanetIds: factorySite.adjacentPlanetIds ?? []
        }
      ]
    },
    players: supernovaFactoryGame.players.map((player, index) => index === 0
      ? {
        ...player,
        resources: { ore: 10, fuel: 10, carbon: 10, food: 10, goods: 10 }
      }
      : player)
  }, {
    language: "de",
    playerCount: 2,
    boardLayout
  });
  const factoryOptions = getBuildableSupernovaFactoryOptions(supernovaFactoryGame, boardLayout, "player-1");
  const matchingFactoryOption = factoryOptions.find((option) => option.planetId === factoryPlanet.id && option.resource === factoryPlanet.resource);
  assert(Boolean(matchingFactoryOption), "Supernova factories should be buildable on adjacent explored non-start planets.");
  const resourceBeforeFactory = supernovaFactoryGame.players[0].resources[factoryPlanet.resource] ?? 0;
  supernovaFactoryGame = buildSupernovaFactory(supernovaFactoryGame, boardLayout, matchingFactoryOption?.factoryType, factoryPlanet.id);
  assert(supernovaFactoryGame.supernova?.factories?.length === 1, "Building a Supernova factory should persist the factory.");
  const reloadedFactoryGame = normalizeGameState(JSON.parse(JSON.stringify(supernovaFactoryGame)), {
    language: "de",
    playerCount: 2,
    boardLayout
  });
  assert(
    reloadedFactoryGame.supernova?.factories?.[0]?.planetId === factoryPlanet.id &&
      reloadedFactoryGame.supernova?.factories?.[0]?.ownerPlayerId === "player-1",
    "Supernova factories should survive save/load normalization with owner and planet intact."
  );
  assert(
    Object.values(supernovaFactoryGame.supernova?.factoryMajorityCards ?? {}).includes("player-1"),
    "A unique factory majority should award the matching Supernova victory card."
  );
  const factoryLimitGame = normalizeGameState({
    ...supernovaFactoryGame,
    supernova: {
      ...supernovaFactoryGame.supernova,
      factories: [
        ...supernovaFactoryGame.supernova.factories,
        ...Array.from({ length: supernovaFactoryLimitPerPlayer - 1 }, (_, index) => ({
          id: `factory-limit-test-${index + 2}`,
          ownerPlayerId: "player-1",
          type: matchingFactoryOption.factoryType,
          resource: factoryPlanet.resource,
          planetId: `${factoryPlanet.id}-limit-${index + 2}`,
          systemId: factoryPlanet.systemId
        }))
      ]
    }
  }, {
    language: "de",
    playerCount: 2,
    boardLayout
  });
  assert(
    factoryLimitGame.supernova?.factories?.length === supernovaFactoryLimitPerPlayer,
    "Supernova factory limit smoke test should contain exactly five owned factories."
  );
  assert(
    getBuildableSupernovaFactoryOptions(factoryLimitGame, boardLayout, "player-1").length === 0,
    "A player with all five Supernova factories should receive no further factory build options."
  );
  const afterRejectedSixthFactory = buildSupernovaFactory(
    factoryLimitGame,
    boardLayout,
    matchingFactoryOption.factoryType,
    factoryPlanet.id
  );
  assert(
    afterRejectedSixthFactory === factoryLimitGame &&
      afterRejectedSixthFactory.supernova?.factories?.length === supernovaFactoryLimitPerPlayer,
    "Building a sixth Supernova factory should be rejected without changing state."
  );
  const token = supernovaFactoryGame.board.numberTokens.planetTokensById[factoryPlanet.id];
  const rollTotal = token?.values?.find((value) => value !== 7) ?? token?.value;
  supernovaFactoryGame = {
    ...supernovaFactoryGame,
    phase: "production",
    currentPlayerIndex: 0
  };
  const afterProduction = rollProduction(supernovaFactoryGame, boardLayout, { dice: diceForTotal(rollTotal) });
  assert(
    (afterProduction.players[0].resources[factoryPlanet.resource] ?? 0) === resourceBeforeFactory - (matchingFactoryOption?.cost?.[factoryPlanet.resource] ?? 0) + 2,
    "A Supernova factory should double production for its owner on the matching planet."
  );
}
assert(
  getBuildableSupernovaFactoryOptions(classicVariantGame, boardLayout, "player-1").length === 0,
  "Classic games should never expose Supernova factory build options."
);

let supernovaBattleShipGame = createGameState({
  language: "de",
  playerCount: 2,
  boardLayout,
  gameVariant: gameVariants.supernova
});
const battleStartSite = boardLayout.startSites[0];
supernovaBattleShipGame = normalizeGameState({
  ...supernovaBattleShipGame,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  board: {
    ...supernovaBattleShipGame.board,
    structures: [{
      id: "supernova-battle-ship-test-spaceport",
      ownerPlayerId: "player-1",
      type: "spaceport",
      locationId: battleStartSite.nodeId,
      systemId: battleStartSite.systemId,
      adjacentPlanetIds: battleStartSite.adjacentPlanetIds ?? []
    }],
    ships: []
  },
  players: supernovaBattleShipGame.players.map((player, index) => index === 0
    ? {
      ...player,
      resources: { ore: 0, fuel: 2, carbon: 2, food: 0, goods: 0 },
      upgrades: { ...player.upgrades, cannon: 1 }
    }
    : player)
}, {
  language: "de",
  playerCount: 2,
  boardLayout
});
supernovaBattleShipGame = buildShip(supernovaBattleShipGame, boardLayout, "battleShip");
assert(supernovaBattleShipGame.board.pendingShipPlacement?.shipType === "battleShip", "Supernova battleships should enter pending launch placement after building.");
const battleShipLaunchPoint = findFreeLaunchPoint(supernovaBattleShipGame, "player-1");
supernovaBattleShipGame = placePendingShip(supernovaBattleShipGame, boardLayout, battleShipLaunchPoint.id);
assert(supernovaBattleShipGame.board.ships.some((ship) => ship.type === "battleShip"), "Pending Supernova battleship placement should create a battleship.");
assert(getPlayerInventory(supernovaBattleShipGame, "player-1").battleShip.inUse === 1, "Battleships should use the separate battleship stock.");
assert(getPlayerInventory(supernovaBattleShipGame, "player-1").transporter.inUse === 0, "Battleships should not consume the transporter stock.");

let colonyBattleGame = createSupernovaBattleMovementState("colonyShip", {
  attackerUpgrades: { cannon: 1 },
  attackerFriendshipCards: ["wise-cannon-boost"],
  defenderUpgrades: { cargo: 1 }
});
const colonyBattleStartNode = colonyBattleGame.board.ships.find((ship) => ship.id === "battle-attacker")?.locationId;
const colonyBattleTargetNode = colonyBattleGame.board.ships.find((ship) => ship.id === "battle-defender")?.locationId;
const colonyBattleFlightSpeed = colonyBattleGame.flightSpeedTotal;
colonyBattleGame = moveShip(colonyBattleGame, boardLayout, "battle-attacker", colonyBattleTargetNode);
assert(colonyBattleGame.supernova?.shipBattle?.stage === "rolling", "A battleship attack should enter a persistent two-player roll state.");
assert(
  colonyBattleGame.board.ships.find((ship) => ship.id === "battle-attacker")?.locationId === colonyBattleStartNode,
  "The attacking battleship should remain at its origin until combat is resolved."
);
assert(endCurrentTurn(colonyBattleGame) === colonyBattleGame, "A turn must not end while a Supernova ship battle is pending.");
const savedColonyBattle = normalizeGameState(JSON.parse(JSON.stringify(colonyBattleGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(savedColonyBattle.supernova?.shipBattle?.stage === "rolling", "A waiting Supernova battle should survive save/load normalization.");
const foreignBattleRoll = submitSupernovaShipBattleRoll(colonyBattleGame, {
  playerId: "player-unknown",
  forcedRoll: { balls: ["red", "yellow"] }
});
assert(foreignBattleRoll === colonyBattleGame, "Players outside a Supernova battle must not submit a roll.");
colonyBattleGame = submitSupernovaShipBattleRoll(colonyBattleGame, {
  playerId: "player-1",
  forcedRoll: { balls: ["red", "yellow"] }
});
assert(
  colonyBattleGame.supernova?.shipBattle?.stage === "rolling" &&
    Boolean(colonyBattleGame.supernova.shipBattle.attackerRoll) &&
    !colonyBattleGame.supernova.shipBattle.defenderRoll,
  "The attack must remain pending after only the active player rolls."
);
colonyBattleGame = submitSupernovaShipBattleRoll(colonyBattleGame, {
  playerId: "player-2",
  forcedRoll: { balls: ["black", "blue"] }
});
assert(colonyBattleGame.supernova?.shipBattle?.stage === "reveal", "The battle should enter the board reveal only after both players roll.");
assert(
  colonyBattleGame.supernova.shipBattle.attackerStrength === 9,
  "Combat strength should include ball points, physical cannons, friendship cannon bonuses and owned battleships."
);
assert(colonyBattleGame.flightSpeedTotal === colonyBattleFlightSpeed, "Supernova combat rolls must not overwrite normal flight speed.");
colonyBattleGame = completeSupernovaShipBattleReveal(colonyBattleGame);
assert(
  colonyBattleGame.supernova?.shipBattle?.stage === "upgradeLoss" &&
    colonyBattleGame.supernova.shipBattle.pendingUpgradePlayerId === "player-2",
  "A colony-ship battle loser with physical upgrades should choose the lost upgrade."
);
const savedUpgradeChoiceBattle = normalizeGameState(JSON.parse(JSON.stringify(colonyBattleGame)), {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(savedUpgradeChoiceBattle.supernova?.shipBattle?.stage === "upgradeLoss", "A pending battle upgrade choice should survive save/load.");
assert(
  chooseSupernovaShipBattleUpgrade(colonyBattleGame, { playerId: "player-1", upgrade: "cargo" }) === colonyBattleGame,
  "Only the battle loser may choose the physical upgrade to remove."
);
colonyBattleGame = chooseSupernovaShipBattleUpgrade(colonyBattleGame, { playerId: "player-2", upgrade: "cargo" });
assert(!colonyBattleGame.supernova?.shipBattle, "A valid physical upgrade choice should finish the colony-ship battle.");
assert(colonyBattleGame.players[1].upgrades.cargo === 0, "The selected physical upgrade should be removed from the loser.");
assert(colonyBattleGame.supernova.blockedShipIds.includes("battle-defender"), "A defeated defending colony ship should be blocked for its next turn.");
assert(
  colonyBattleGame.board.ships.find((ship) => ship.id === "battle-attacker")?.locationId === colonyBattleStartNode &&
    colonyBattleGame.board.ships.find((ship) => ship.id === "battle-defender")?.locationId === colonyBattleTargetNode,
  "A colony-ship battle must not leave attacker and defender on the same node."
);

let defenderWinsColonyBattle = createSupernovaBattleMovementState("colonyShip", {
  attackerUpgrades: { cannon: 1 },
  defenderUpgrades: { cannon: 3 }
});
const defenderWinsTargetNode = defenderWinsColonyBattle.board.ships.find((ship) => ship.id === "battle-defender")?.locationId;
defenderWinsColonyBattle = moveShip(defenderWinsColonyBattle, boardLayout, "battle-attacker", defenderWinsTargetNode);
defenderWinsColonyBattle = submitSupernovaShipBattleRoll(defenderWinsColonyBattle, {
  playerId: "player-1",
  forcedRoll: { balls: ["black", "blue"] }
});
defenderWinsColonyBattle = submitSupernovaShipBattleRoll(defenderWinsColonyBattle, {
  playerId: "player-2",
  forcedRoll: { balls: ["red", "yellow"] }
});
defenderWinsColonyBattle = completeSupernovaShipBattleReveal(defenderWinsColonyBattle);
defenderWinsColonyBattle = chooseSupernovaShipBattleUpgrade(defenderWinsColonyBattle, {
  playerId: "player-1",
  upgrade: "cannon"
});
assert(defenderWinsColonyBattle.players[1].halfMedals === 1, "A defending colony-ship player should gain a half medal after winning.");
assert(!defenderWinsColonyBattle.supernova.blockedShipIds.includes("battle-defender"), "A winning defending colony ship must not be blocked.");

let tradeBattleGame = createSupernovaBattleMovementState("tradeShip", {
  attackerUpgrades: { cannon: 2 },
  defenderUpgrades: { cargo: 2 },
  attackerResources: { ore: 0, fuel: 0, carbon: 0, food: 0, goods: 0 },
  defenderResources: { ore: 1, fuel: 1, carbon: 0, food: 0, goods: 0 }
});
const tradeBattleTargetNode = tradeBattleGame.board.ships.find((ship) => ship.id === "battle-defender")?.locationId;
tradeBattleGame = moveShip(tradeBattleGame, boardLayout, "battle-attacker", tradeBattleTargetNode);
tradeBattleGame = submitSupernovaShipBattleRoll(tradeBattleGame, { playerId: "player-1", forcedRoll: { balls: ["red", "yellow"] } });
tradeBattleGame = submitSupernovaShipBattleRoll(tradeBattleGame, { playerId: "player-2", forcedRoll: { balls: ["black", "blue"] } });
tradeBattleGame = completeSupernovaShipBattleReveal(tradeBattleGame);
assert(!tradeBattleGame.supernova?.shipBattle, "Trade-ship combat should resolve after the board reveal without an upgrade choice.");
assert(tradeBattleGame.players[1].upgrades.cargo === 2, "Trade-ship combat must not remove a mothership upgrade.");
assert(getResourceTotal(tradeBattleGame.players[0]) === 2 && getResourceTotal(tradeBattleGame.players[1]) === 0, "The trade-ship battle winner should draw up to two available resources.");
assert(tradeBattleGame.supernova.blockedShipIds.includes("battle-defender"), "A defeated defending trade ship should be blocked for its next turn.");

let defenderWinsTradeBattle = createSupernovaBattleMovementState("tradeShip", {
  attackerResources: { ore: 1, fuel: 0, carbon: 0, food: 0, goods: 0 },
  defenderResources: { ore: 0, fuel: 0, carbon: 0, food: 0, goods: 0 },
  defenderUpgrades: { cannon: 3 }
});
const defenderWinsTradeTargetNode = defenderWinsTradeBattle.board.ships.find((ship) => ship.id === "battle-defender")?.locationId;
defenderWinsTradeBattle = moveShip(defenderWinsTradeBattle, boardLayout, "battle-attacker", defenderWinsTradeTargetNode);
defenderWinsTradeBattle = submitSupernovaShipBattleRoll(defenderWinsTradeBattle, {
  playerId: "player-1",
  forcedRoll: { balls: ["black", "black"] }
});
defenderWinsTradeBattle = submitSupernovaShipBattleRoll(defenderWinsTradeBattle, {
  playerId: "player-2",
  forcedRoll: { balls: ["red", "red"] }
});
defenderWinsTradeBattle = completeSupernovaShipBattleReveal(defenderWinsTradeBattle);
assert(defenderWinsTradeBattle.players[1].halfMedals === 1, "A defending trade-ship player should gain a half medal after winning.");
assert(getResourceTotal(defenderWinsTradeBattle.players[0]) === 0, "A trade-ship winner should draw the loser's only available resource without requiring two cards.");
assert(getResourceTotal(defenderWinsTradeBattle.players[1]) === 1, "A trade-ship winner should receive every available resource up to the two-card limit.");
assert(!defenderWinsTradeBattle.supernova.blockedShipIds.includes("battle-defender"), "A winning defending trade ship must not be blocked.");

let tiedBattleShipGame = createSupernovaBattleMovementState("battleShip");
const tiedBattleTargetNode = tiedBattleShipGame.board.ships.find((ship) => ship.id === "battle-defender")?.locationId;
tiedBattleShipGame = moveShip(tiedBattleShipGame, boardLayout, "battle-attacker", tiedBattleTargetNode);
for (let tieRound = 1; tieRound <= 7; tieRound += 1) {
  tiedBattleShipGame = submitSupernovaShipBattleRoll(tiedBattleShipGame, { playerId: "player-1", forcedRoll: { balls: ["blue", "yellow"] } });
  tiedBattleShipGame = submitSupernovaShipBattleRoll(tiedBattleShipGame, { playerId: "player-2", forcedRoll: { balls: ["blue", "yellow"] } });
  assert(!tiedBattleShipGame.supernova.shipBattle.winnerPlayerId, "Equal combat values should remain a tie.");
  tiedBattleShipGame = completeSupernovaShipBattleReveal(tiedBattleShipGame);
  assert(
    tiedBattleShipGame.supernova?.shipBattle?.stage === "rolling" &&
      tiedBattleShipGame.supernova.shipBattle.round === tieRound + 1,
    "Every tied battleship round should request another pair of player rolls without a hard retry limit."
  );
}
tiedBattleShipGame = submitSupernovaShipBattleRoll(tiedBattleShipGame, { playerId: "player-1", forcedRoll: { balls: ["red", "yellow"] } });
tiedBattleShipGame = submitSupernovaShipBattleRoll(tiedBattleShipGame, { playerId: "player-2", forcedRoll: { balls: ["black", "blue"] } });
tiedBattleShipGame = completeSupernovaShipBattleReveal(tiedBattleShipGame);
assert(!tiedBattleShipGame.board.ships.some((ship) => ship.id === "battle-defender"), "The losing defending battleship should be removed completely.");
assert(
  tiedBattleShipGame.board.ships.find((ship) => ship.id === "battle-attacker")?.locationId === tiedBattleTargetNode,
  "A winning attacking battleship should occupy the vacated target node."
);
assert(tiedBattleShipGame.players[0].halfMedals === 1, "The battleship-combat winner should receive one half medal.");
assert(
  new Set(tiedBattleShipGame.board.ships.map((ship) => ship.locationId)).size === tiedBattleShipGame.board.ships.length,
  "Resolved battleship combat must not leave two ships on the same node."
);

let defenderWinsBattleShipGame = createSupernovaBattleMovementState("battleShip", {
  defenderUpgrades: { cannon: 3 }
});
const defenderWinsBattleTargetNode = defenderWinsBattleShipGame.board.ships.find((ship) => ship.id === "battle-defender")?.locationId;
defenderWinsBattleShipGame = moveShip(defenderWinsBattleShipGame, boardLayout, "battle-attacker", defenderWinsBattleTargetNode);
defenderWinsBattleShipGame = submitSupernovaShipBattleRoll(defenderWinsBattleShipGame, {
  playerId: "player-1",
  forcedRoll: { balls: ["black", "black"] }
});
defenderWinsBattleShipGame = submitSupernovaShipBattleRoll(defenderWinsBattleShipGame, {
  playerId: "player-2",
  forcedRoll: { balls: ["red", "red"] }
});
defenderWinsBattleShipGame = completeSupernovaShipBattleReveal(defenderWinsBattleShipGame);
assert(!defenderWinsBattleShipGame.board.ships.some((ship) => ship.id === "battle-attacker"), "A losing attacking battleship should be removed completely.");
assert(
  defenderWinsBattleShipGame.board.ships.find((ship) => ship.id === "battle-defender")?.locationId === defenderWinsBattleTargetNode,
  "A winning defending battleship should remain on its original target node."
);
assert(defenderWinsBattleShipGame.players[1].halfMedals === 1, "A defending battleship winner should receive one half medal.");

let supernovaMissionWinGame = createGameState({
  language: "de",
  playerCount: 2,
  boardLayout,
  gameVariant: gameVariants.supernova
});
supernovaMissionWinGame = normalizeGameState({
  ...supernovaMissionWinGame,
  phase: "tradeBuild",
  currentPlayerIndex: 0,
  players: supernovaMissionWinGame.players.map((player, index) => index === 0
    ? {
      ...player,
      specialMedals: Array.from({ length: 15 }, (_, medalIndex) => `supernova-test-medal-${medalIndex + 1}`)
    }
    : player)
}, {
  language: "de",
  playerCount: 2,
  boardLayout
});
assert(!supernovaMissionWinGame.gameOver, "Supernova should not end at 15 points without a fulfilled mission.");
const firstMissionId = getSupernovaMissionsForPlayer(supernovaMissionWinGame, "player-1")[0]?.id;
supernovaMissionWinGame = toggleSupernovaMissionFulfilled(supernovaMissionWinGame, "player-1", firstMissionId);
assert(supernovaMissionWinGame.gameOver && supernovaMissionWinGame.winnerPlayerId === "player-1", "Supernova should end at 15 points only after a mission is fulfilled.");

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

function findBuildableFactoryPlanet(gameState) {
  return (gameState.board?.placedSystems ?? [])
    .flatMap((system) => (system.planets ?? []).map((planet) => ({
      ...planet,
      systemId: system.id
    })))
    .find((planet) => {
      const token = gameState.board?.numberTokens?.planetTokensById?.[planet.id];
      return token?.type === "number" && Boolean(getSiteAdjacentToPlanet(gameState, planet.id));
    });
}

function getSiteAdjacentToPlanet(gameState, planetId) {
  return [
    ...(boardLayout.startSites ?? []),
    ...(gameState.board?.placedSystems ?? []).flatMap((system) => system.colonySites ?? [])
  ].find((site) => site.adjacentPlanetIds?.includes(planetId));
}

function diceForTotal(total) {
  if (total <= 2) return [1, 1];
  if (total >= 12) return [6, 6];
  const firstDie = Math.max(1, Math.min(6, total - 1));
  return [firstDie, total - firstDie];
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

function createSupernovaBattleMovementState(defenderShipType, options = {}) {
  const baseGame = createGameState({
    language: "de",
    playerCount: 2,
    boardLayout,
    gameVariant: gameVariants.supernova
  });
  const path = findPlainMovementTriplet(baseGame);
  if (!path) throw new Error("Supernova battle tests require two connected open space points.");
  const ships = [
    {
      id: "battle-attacker",
      ownerPlayerId: "player-1",
      type: "battleShip",
      variant: 1,
      locationId: path.start,
      status: "active"
    },
    {
      id: "battle-defender",
      ownerPlayerId: "player-2",
      type: defenderShipType,
      variant: 1,
      locationId: path.middle,
      status: "active"
    }
  ];

  return createMovementTestState(baseGame, {
    ships,
    remainingMovementByShipId: {
      "battle-attacker": 5,
      "battle-defender": 5
    },
    playerMutator: (player, index) => index === 0
      ? {
        ...player,
        resources: { ...player.resources, ...(options.attackerResources ?? {}) },
        upgrades: { ...player.upgrades, ...(options.attackerUpgrades ?? {}) },
        friendshipCards: options.attackerFriendshipCards ?? player.friendshipCards
      }
      : {
        ...player,
        resources: { ...player.resources, ...(options.defenderResources ?? {}) },
        upgrades: { ...player.upgrades, ...(options.defenderUpgrades ?? {}) },
        friendshipCards: options.defenderFriendshipCards ?? player.friendshipCards
      }
  });
}

function createMovementTestState(baseGame, {
  ships,
  remainingMovementByShipId,
  playerMutator = (player) => player,
  hasRolledFlightSpeed = true
}) {
  return {
    ...normalizeGameState(JSON.parse(JSON.stringify(baseGame)), {
      language: "de",
      playerCount: 2,
      boardLayout
    }),
    phase: "flight",
    currentPlayerIndex: 0,
    hasRolledFlightSpeed,
    activeEncounter: null,
    encounterTriggered: false,
    flightRoll: hasRolledFlightSpeed ? { balls: ["yellow", "red"], baseSpeed: 5, encounterTriggered: false } : null,
    flightSpeedBase: hasRolledFlightSpeed ? 5 : null,
    flightSpeedTotal: hasRolledFlightSpeed ? 5 : null,
    players: normalizeGameState(JSON.parse(JSON.stringify(baseGame)), {
      language: "de",
      playerCount: 2,
      boardLayout
    }).players.map(playerMutator),
    board: {
      ...normalizeGameState(JSON.parse(JSON.stringify(baseGame)), {
        language: "de",
        playerCount: 2,
        boardLayout
      }).board,
      selectedElement: ships[0] ? { type: "ship", id: ships[0].id } : null,
      ships
    },
    remainingMovementByShipId
  };
}

function findPlainMovementTriplet(gameState) {
  const graph = buildConnectionGraph();
  const blocked = getBlockedNodeIdSet(gameState);
  const colonySiteNodeIds = new Set(getAllColonySites(gameState).map((site) => site.nodeId));
  const dockNodeIds = new Set((gameState.board?.placedOutposts ?? []).map((outpost) => outpost.dockNodeId));
  const launchNodeIds = new Set((boardLayout.spaceportLaunchPoints ?? []).map((point) => point.id));

  for (const [start, neighbors] of graph.entries()) {
    if (blocked.has(start) || colonySiteNodeIds.has(start) || dockNodeIds.has(start) || launchNodeIds.has(start)) continue;
    for (const middle of neighbors) {
      if (blocked.has(middle) || colonySiteNodeIds.has(middle) || dockNodeIds.has(middle) || launchNodeIds.has(middle)) continue;
      for (const end of graph.get(middle) ?? []) {
        if (end === start) continue;
        if (blocked.has(end) || colonySiteNodeIds.has(end) || dockNodeIds.has(end) || launchNodeIds.has(end)) continue;
        if ((graph.get(start) ?? new Set()).has(end)) continue;
        return { start, middle, end };
      }
    }
  }

  return null;
}

function getAllColonySites(gameState) {
  return [
    ...(boardLayout.startSites ?? []),
    ...(gameState.board?.placedSystems ?? []).flatMap((system) => system.colonySites ?? [])
  ];
}

function findFreePlanetColonySite(gameState) {
  const occupied = new Set((gameState.board?.structures ?? []).map((structure) => structure.locationId));
  return (gameState.board?.placedSystems ?? [])
    .flatMap((system) => system.colonySites ?? [])
    .find((site) => !occupied.has(site.nodeId) && Array.isArray(site.launchNodeIds) && site.launchNodeIds.length > 0);
}

function findFreeNeighborNode(gameState, nodeId) {
  const graph = buildConnectionGraph();
  const blocked = getBlockedNodeIdSet(gameState);
  const occupied = new Set([
    ...(gameState.board?.ships ?? []).map((ship) => ship.locationId),
    ...(gameState.board?.structures ?? []).map((structure) => structure.locationId)
  ]);

  return [...(graph.get(nodeId) ?? [])].find((neighborId) => !blocked.has(neighborId) && !occupied.has(neighborId));
}

function findValidDockApproachScenario(baseGame) {
  for (const outpost of baseGame.board?.placedOutposts ?? []) {
    const approachNodeId = findFreeNeighborNode(baseGame, outpost.dockNodeId);
    if (!approachNodeId) continue;
    const testState = createMovementTestState(baseGame, {
      ships: [
        {
          id: "dock-check",
          ownerPlayerId: "player-1",
          type: "tradeShip",
          locationId: approachNodeId,
          status: "active"
        }
      ],
      playerMutator: (player, index) => index === 0
        ? {
          ...player,
          upgrades: {
            ...player.upgrades,
            cargo: 5
          }
        }
        : player,
      remainingMovementByShipId: {
        "dock-check": 1
      }
    });
    testState.board.exploredOutposts = [outpost.id];
    const destinationState = getShipDestinationState(testState, boardLayout, "dock-check", outpost.dockNodeId);
    if (destinationState?.validDestination) {
      return {
        outpost,
        approachNodeId
      };
    }
  }

  return null;
}

function buildConnectionGraph() {
  const graph = new Map();
  for (const point of boardLayout.points ?? []) {
    graph.set(point.id, new Set());
  }
  for (const connection of boardLayout.connections ?? []) {
    graph.get(connection.from)?.add(connection.to);
    graph.get(connection.to)?.add(connection.from);
  }
  return graph;
}

function getBlockedNodeIdSet(gameState) {
  return new Set([
    ...(boardLayout.startSystems ?? []),
    ...(gameState.board?.placedSystems ?? [])
  ].flatMap((system) => system.blockedNodeIds ?? []));
}
