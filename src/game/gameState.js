const playerColorKeys = ["red", "blue", "yellow", "white"];

export const currentGameStorageKey = "star-odyssey-current-game";

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
    phase: "preparation",
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
        message: language === "en" ? "New game started." : "Neues Spiel gestartet."
      }
    ]
  };
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
    phase: gameState.phase || "preparation",
    board: {
      ...fallback.board,
      ...(gameState.board || {}),
      layoutVersion: gameState.board?.layoutVersion || boardLayout.layoutVersion
    },
    log: Array.isArray(gameState.log) ? gameState.log : fallback.log
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

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
