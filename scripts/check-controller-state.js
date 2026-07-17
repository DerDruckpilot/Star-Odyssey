import { createControllerStatesByPlayerId, createControllerViewState } from "../src/remote/controllerState.js";
import { getTranslationKeys } from "../src/i18n.js";
import { getControllerFlightStatus } from "../src/controller-flight-status.js";

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exitCode = 1;
  }
}

const remoteState = {
  language: "en",
  activePlayerId: "player-1",
  players: [
    {
      id: "player-1",
      name: "Alice",
      resources: { ore: 2, fuel: 1 },
      tradeRates: { ore: 2 },
      upgradeBonuses: { drive: 1 },
      effectiveUpgrades: { drive: 3 },
      friendship: { markers: ["outpost-1"], cards: [{ id: "friend-1" }] },
      supernovaMissions: [{ id: "mission-1" }]
    },
    {
      id: "player-2",
      name: "Bob",
      resources: { ore: 4, food: 2 },
      tradeRates: { ore: 3 },
      upgradeBonuses: { cannon: 1 },
      effectiveUpgrades: { cannon: 2 },
      friendship: { markers: ["outpost-2"], cards: [{ id: "friend-2" }] },
      supernovaMissions: [{ id: "mission-2" }]
    }
  ],
  sevenResolution: {
    active: true,
    discardSelections: {
      "player-1": { ore: 1 },
      "player-2": { food: 2 }
    }
  },
  trade: {
    bankFromResource: "ore",
    bankToResource: "fuel",
    offerTargetPlayerId: "player-2",
    offeredResources: { ore: 1 },
    requestedResources: { food: 1 },
    activeTradeOffer: null
  },
  friendshipCardSelection: {
    ownerPlayerId: "player-1",
    outpostId: "outpost-1",
    cards: [{ id: "friend-1", title: "Friendship", summary: "Choose me" }]
  },
  actions: [
    { id: "public.action", label: "Public" },
    { id: "battle.roll", label: "Alice roll", forPlayerId: "player-1" },
    { id: "battle.roll", label: "Bob roll", forPlayerId: "player-2" }
  ],
  saves: [{ id: "private-save" }]
};

const playerOneView = createControllerViewState(remoteState, "player-1");
const ownPlayer = playerOneView.players.find((player) => player.id === "player-1");
const foreignPlayer = playerOneView.players.find((player) => player.id === "player-2");

assert(ownPlayer.resources.ore === 2, "Own controller view should retain private resources.");
assert(playerOneView.language === "en", "Controller views should retain the selected language.");
assert(ownPlayer.supernovaMissions.length === 1, "Own controller view should retain private missions.");
assert(ownPlayer.friendship.cards.length === 1, "Own controller view should retain private cards.");
assert(ownPlayer.resourceCount === 3, "Own controller view should include the public resource count.");
assert(!Object.hasOwn(foreignPlayer, "resources"), "Foreign resources must not be serialized.");
assert(!Object.hasOwn(foreignPlayer, "supernovaMissions"), "Foreign missions must not be serialized.");
assert(!Object.hasOwn(foreignPlayer.friendship, "cards"), "Foreign private cards must not be serialized.");
assert(!Object.hasOwn(foreignPlayer, "upgradeBonuses"), "Foreign friendship upgrade bonuses must not be serialized.");
assert(foreignPlayer.resourceCount === 6, "Foreign players should expose only their public resource count.");
assert(Object.keys(playerOneView.sevenResolution.discardSelections).join() === "player-1", "Discard selections must be private per controller.");
assert(playerOneView.trade.offeredResources.ore === 1, "The active player should retain the private trade draft.");
assert(playerOneView.actions.length === 2, "A controller should receive public actions and only its own targeted actions.");
assert(playerOneView.actions.some((action) => action.label === "Alice roll"), "Player one should receive its targeted battle action.");
assert(!playerOneView.actions.some((action) => action.label === "Bob roll"), "Player one must not receive another player's targeted battle action.");
assert(playerOneView.saves.length === 1, "The admin controller should retain the save list.");
assert(playerOneView.friendshipCardSelection?.cards?.length === 1, "The awarded friendship-card choice should be visible to its owner.");

const playerTwoView = createControllerViewState(remoteState, "player-2");
assert(Object.keys(playerTwoView.trade.offeredResources).length === 0, "Other players must not receive a private trade draft.");
assert(playerTwoView.saves.length === 0, "Non-admin controllers must not receive the save list.");
assert(Object.keys(playerTwoView.sevenResolution.discardSelections).join() === "player-2", "Each controller should receive only its own discard selection.");
assert(playerTwoView.actions.length === 2, "Player two should receive public actions and only its targeted battle action.");
assert(playerTwoView.actions.some((action) => action.label === "Bob roll"), "Player two should receive its targeted battle action.");
assert(!playerTwoView.actions.some((action) => action.label === "Alice roll"), "Player two must not receive another player's targeted battle action.");
assert(playerTwoView.friendshipCardSelection === null, "Friendship-card choices must remain private to the owning controller.");

const baseFlight = {
  activePlayerId: "player-1",
  activePlayerName: "Alice",
  hasRolledSpeed: true,
  movableShipCount: 2,
  selectedShipId: "ship-1",
  selectedShipRemaining: 2,
  selectedShipBlocked: false
};
assert(
  getControllerFlightStatus(baseFlight, "player-1", true).key === "controllerFlightMovementRemainingMany",
  "The active controller should receive the plural remaining-movement status."
);
assert(
  getControllerFlightStatus({ ...baseFlight, selectedShipRemaining: 1 }, "player-1", true).key === "controllerFlightMovementRemainingOne",
  "The active controller should receive the singular remaining-movement status."
);
assert(
  getControllerFlightStatus({ ...baseFlight, selectedShipRemaining: 0 }, "player-1", true).key === "controllerFlightNoMovementRemaining",
  "A fully moved ship should report that no movement remains."
);
assert(
  getControllerFlightStatus({ ...baseFlight, selectedShipBlocked: true }, "player-1", true).key === "controllerFlightShipBlocked",
  "A blocked ship should report its movement restriction."
);
assert(
  getControllerFlightStatus({ ...baseFlight, selectedShipId: null }, "player-1", true).key === "controllerFlightSelectOwnShip",
  "The active controller should be prompted to select a ship."
);
assert(
  getControllerFlightStatus(baseFlight, "player-2", false).key === "controllerFlightWait",
  "Inactive controllers should retain the neutral flight wait status."
);

const statesByPlayerId = createControllerStatesByPlayerId(remoteState);
assert(statesByPlayerId["player-1"].viewerPlayerId === "player-1", "Player one should receive its personalized state.");
assert(statesByPlayerId["player-2"].viewerPlayerId === "player-2", "Player two should receive its personalized state.");

const germanTranslationKeys = getTranslationKeys("de").sort();
const englishTranslationKeys = getTranslationKeys("en").sort();
assert(
  JSON.stringify(germanTranslationKeys) === JSON.stringify(englishTranslationKeys),
  "German and English translations should expose identical key sets."
);

if (!process.exitCode) console.log("Controller privacy checks passed.");
