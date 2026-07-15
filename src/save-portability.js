export const saveBackupFormat = "star-odyssey-save-backup";
export const saveBackupVersion = 1;
export const saveBackupMaxBytes = 5 * 1024 * 1024;

export const saveBackupErrorCodes = Object.freeze({
  invalidJson: "invalidJson",
  invalidFormat: "invalidFormat",
  unsupportedVersion: "unsupportedVersion",
  invalidSave: "invalidSave",
  tooLarge: "tooLarge"
});

export class SaveBackupError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SaveBackupError";
    this.code = code;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateSave(save) {
  if (!isRecord(save) || !isRecord(save.gameState)) {
    throw new SaveBackupError(saveBackupErrorCodes.invalidSave, "Backup does not contain a game state.");
  }

  const playerCount = save.gameState.playerCount ?? save.playerCount;
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 4) {
    throw new SaveBackupError(saveBackupErrorCodes.invalidSave, "Backup contains an invalid player count.");
  }
}

function cloneJsonValue(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    throw new SaveBackupError(saveBackupErrorCodes.invalidSave, "Save game is not JSON serializable.");
  }
}

export function createSaveBackup(save, exportedAt = new Date().toISOString()) {
  validateSave(save);
  return {
    format: saveBackupFormat,
    version: saveBackupVersion,
    exportedAt,
    save: cloneJsonValue(save)
  };
}

export function parseSaveBackup(text) {
  if (typeof text !== "string") {
    throw new SaveBackupError(saveBackupErrorCodes.invalidJson, "Backup must be JSON text.");
  }
  if (new TextEncoder().encode(text).byteLength > saveBackupMaxBytes) {
    throw new SaveBackupError(saveBackupErrorCodes.tooLarge, "Backup exceeds the size limit.");
  }

  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new SaveBackupError(saveBackupErrorCodes.invalidJson, "Backup is not valid JSON.");
  }

  if (!isRecord(backup) || backup.format !== saveBackupFormat) {
    throw new SaveBackupError(saveBackupErrorCodes.invalidFormat, "File is not a Star Odyssey save backup.");
  }
  if (backup.version !== saveBackupVersion) {
    throw new SaveBackupError(saveBackupErrorCodes.unsupportedVersion, "Backup version is not supported.");
  }

  validateSave(backup.save);
  return {
    ...backup,
    save: cloneJsonValue(backup.save)
  };
}

export function getSaveBackupFilename(save) {
  const sourceName = typeof save?.name === "string" ? save.name : "spielstand";
  const slug = sourceName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "spielstand";
  return `star-odyssey-${slug}.json`;
}
