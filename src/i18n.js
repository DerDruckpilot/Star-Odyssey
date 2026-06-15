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
    continuePlaceholder: "Neues Spiel mit {count} Spielern wird später gestartet."
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
    continuePlaceholder: "New game with {count} players will start later."
  }
};

export function getText(language, key) {
  const selectedLanguage = translations[language] ? language : defaultLanguage;
  return translations[selectedLanguage][key] ?? translations[defaultLanguage][key] ?? key;
}
