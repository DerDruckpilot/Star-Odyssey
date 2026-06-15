const playerColorKeys = ["red", "blue", "yellow", "white"];

export const currentGameStorageKey = "star-odyssey-current-game";
export const turnPhases = ["setup", "production", "tradeBuild", "flight", "turnEnd"];

export function createGameState({ language, playerCount, boardLayout }) {
  const now = new Date().toISOString();
  const safePlayerCount = [2, 3, 4].includes(playerCount) ? playerCount : 2;

  return {
    gameId: createId("game"),
    createdAt: now,
    updatedAt: now,
    language,
    playerCount: safePlayerCount,
    players: createPlayers(safePlayerCount, language),
    currentPlayerIndex: 0,
    turnNumber: 1,
    phase: "production",
    lastRoll: null,
    board: {
      layoutVersion: boardLayout.layoutVersion,
      selectedElement: null,
      exploredSystems: [],
      colonies: [],
      stations: [],
      ships: []
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

export function rollProduction(gameState) {
  const firstDie = rollDie();
  const secondDie = rollDie();
  const total = firstDie + secondDie;

  return updateGameState(gameState, {
    phase: "tradeBuild",
    lastRoll: {
      dice: [firstDie, secondDie],
      total
    },
    logEntry: {
      type: "turn",
      messageKey: "logProductionRolled",
      messageParams: { total }
    }
  });
}

export function advanceToFlightPhase(gameState) {
  return updateGameState(gameState, {
    phase: "flight",
    logEntry: {
      type: "turn",
      messageKey: "logToFlightPhase",
      messageParams: {
        player: getActivePlayerName(gameState)
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
  const fallbackPlayers = createPlayers(normalizedPlayerCount, gameState.language || language);
  const normalizedPlayers = fallbackPlayers.map((fallbackPlayer, index) => (
    Array.isArray(gameState.players) && gameState.players[index]
      ? normalizePlayer(gameState.players[index], index, gameState.language || language)
      : fallbackPlayer
  ));
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
    phase: normalizePhase(gameState.phase),
    lastRoll: normalizeRoll(gameState.lastRoll),
    board: {
      ...fallback.board,
      ...(gameState.board || {}),
      layoutVersion: gameState.board?.layoutVersion || boardLayout.layoutVersion
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
    stations: []
  }));
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
    resources: {
      ...createEmptyResources(),
      ...(player.resources || {})
    },
    upgrades: {
      ...createDefaultUpgrades(),
      ...(player.upgrades || {})
    },
    halfMedals: Number.isInteger(player.halfMedals) ? player.halfMedals : 0,
    ships: Array.isArray(player.ships) ? player.ships : [],
    stations: Array.isArray(player.stations) ? player.stations : []
  };
}

function createEmptyResources() {
  return {
    erz: 0,
    treibstoff: 0,
    carbon: 0,
    nahrung: 0,
    handelsware: 0
  };
}

function createDefaultUpgrades() {
  return {
    antrieb: 0,
    frachtmodul: 0,
    bordkanone: 0
  };
}

function updateGameState(gameState, { logEntry, ...updates }) {
  const now = new Date().toISOString();

  return {
    ...gameState,
    ...updates,
    updatedAt: now,
    log: logEntry
      ? [
        ...normalizeLog(gameState.log, []),
        {
          id: createId("log"),
          createdAt: now,
          ...logEntry
        }
      ]
      : normalizeLog(gameState.log, [])
  };
}

function getActivePlayerName(gameState) {
  return gameState.players?.[gameState.currentPlayerIndex]?.name ?? "";
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
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
