export const defaultLanguage = "de";

export const languages = ["de", "en"];

const translations = {
  de: {
    subtitle: "Ein digitales Weltraum-Brettspiel",
    newGame: "Neues Spiel",
    loadGame: "Spiel laden",
    languageToggle: "Sprache wechseln",
    loadPlaceholder: "Spiel laden wird später ergänzt.",
    selectPlayers: "Spieleranzahl wählen",
    playersLabel: "{count} Spieler",
    continue: "Weiter",
    back: "Zurück",
    connectControllers: "Controller verbinden",
    playerNumber: "Spieler {number}",
    qrPlaceholderHint: "QR-Verbindung wird später ergänzt.",
    startGameNow: "Spiel jetzt starten",
    boardAreaLabel: "Erste Spielfeld-Ansicht",
    startArea: "Startbereich",
    progressRight: "Fortschritt nach rechts",
    quadrantCount: "15 Raumquadranten · 4 Startsysteme",
    backToMenu: "Zurück zum Menü",
    ingameMenu: "Menü",
    save: "Speichern",
    saveGame: "Spiel speichern",
    saveNamePlaceholder: "Name des Spielstands",
    defaultSaveName: "Spielstand",
    saveSuccess: "Spiel gespeichert.",
    load: "Laden",
    loadSuccess: "Spielstand geladen.",
    close: "Schließen",
    delete: "Löschen",
    noSaves: "Keine Spielstände vorhanden.",
    savePlayers: "{count} Spieler",
    unnamedSave: "Spielstand",
    unknownDate: "Unbekanntes Datum",
    confirmBackToMenu: "Zum Hauptmenü zurückkehren?"
  },
  en: {
    subtitle: "A digital space board game",
    newGame: "New Game",
    loadGame: "Load Game",
    languageToggle: "Change language",
    loadPlaceholder: "Load game will be added later.",
    selectPlayers: "Select number of players",
    playersLabel: "{count} players",
    continue: "Continue",
    back: "Back",
    connectControllers: "Connect controllers",
    playerNumber: "Player {number}",
    qrPlaceholderHint: "QR connection will be added later.",
    startGameNow: "Start game now",
    boardAreaLabel: "First board view",
    startArea: "Start area",
    progressRight: "Progress to the right",
    quadrantCount: "15 space quadrants · 4 start systems",
    backToMenu: "Back to menu",
    ingameMenu: "Menu",
    save: "Save",
    saveGame: "Save game",
    saveNamePlaceholder: "Save name",
    defaultSaveName: "Save game",
    saveSuccess: "Game saved.",
    load: "Load",
    loadSuccess: "Save game loaded.",
    close: "Close",
    delete: "Delete",
    noSaves: "No saved games available.",
    savePlayers: "{count} players",
    unnamedSave: "Save game",
    unknownDate: "Unknown date",
    confirmBackToMenu: "Return to the main menu?"
  }
};

export function getText(language, key) {
  const selectedLanguage = translations[language] ? language : defaultLanguage;
  return translations[selectedLanguage][key] ?? translations[defaultLanguage][key] ?? key;
}
