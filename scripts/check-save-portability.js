import assert from "node:assert/strict";
import {
  createSaveBackup,
  getSaveBackupFilename,
  parseSaveBackup,
  saveBackupErrorCodes,
  saveBackupFormat,
  saveBackupVersion
} from "../src/save-portability.js";

const pendingSupernovaSave = {
  id: "save-supernova-pending",
  name: "Supernova: Zug 7 / Test",
  savedAt: "2026-07-14T20:00:00.000Z",
  language: "de",
  playerCount: 3,
  gameState: {
    playerCount: 3,
    gameVariant: "supernova",
    phase: "flight",
    activePlayerId: "player-1",
    activeEncounter: {
      cardId: "encounter-17",
      pendingStep: {
        type: "dualMothershipRoll",
        activePlayerId: "player-1",
        opponentPlayerId: "player-2",
        rolls: {
          "player-1": { value: 4 },
          "player-2": null
        }
      }
    },
    supernova: {
      missionCount: 2,
      factories: [{ id: "factory-1", playerId: "player-1", planetId: "planet-1" }]
    }
  }
};

const exportedAt = "2026-07-14T21:00:00.000Z";
const backup = createSaveBackup(pendingSupernovaSave, exportedAt);
assert.equal(backup.format, saveBackupFormat);
assert.equal(backup.version, saveBackupVersion);
assert.equal(backup.exportedAt, exportedAt);

const parsed = parseSaveBackup(JSON.stringify(backup));
assert.deepEqual(parsed.save, pendingSupernovaSave);
assert.notEqual(parsed.save, pendingSupernovaSave);
assert.equal(parsed.save.gameState.activeEncounter.pendingStep.rolls["player-2"], null);
assert.equal(parsed.save.gameState.supernova.missionCount, 2);
assert.equal(getSaveBackupFilename(pendingSupernovaSave), "star-odyssey-supernova-zug-7-test.json");

const classicSave = {
  id: "save-classic",
  name: "Classic",
  savedAt: exportedAt,
  playerCount: 4,
  gameState: {
    playerCount: 4,
    gameVariant: "classic",
    phase: "production",
    activeEncounter: null
  }
};
assert.deepEqual(
  parseSaveBackup(JSON.stringify(createSaveBackup(classicSave, exportedAt))).save,
  classicSave
);

assert.throws(
  () => parseSaveBackup("not json"),
  (error) => error.code === saveBackupErrorCodes.invalidJson
);
assert.throws(
  () => parseSaveBackup(JSON.stringify({ ...backup, format: "another-app" })),
  (error) => error.code === saveBackupErrorCodes.invalidFormat
);
assert.throws(
  () => parseSaveBackup(JSON.stringify({ ...backup, version: saveBackupVersion + 1 })),
  (error) => error.code === saveBackupErrorCodes.unsupportedVersion
);
assert.throws(
  () => parseSaveBackup(JSON.stringify({ ...backup, save: { id: "missing-state" } })),
  (error) => error.code === saveBackupErrorCodes.invalidSave
);

console.log("Save portability checks passed.");
