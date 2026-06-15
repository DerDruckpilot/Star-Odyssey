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
    backToMenu: "Zurück zum Menü"
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
    backToMenu: "Back to menu"
  }
};

export function getText(language, key) {
  const selectedLanguage = translations[language] ? language : defaultLanguage;
  return translations[selectedLanguage][key] ?? translations[defaultLanguage][key] ?? key;
}
