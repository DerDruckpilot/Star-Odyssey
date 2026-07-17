export const playerGenders = Object.freeze(["male", "female"]);

export function normalizePlayerGender(value) {
  return value === "female" ? "female" : "male";
}

export function getPlayerGrammar(gender, language = "de") {
  const normalizedGender = normalizePlayerGender(gender);
  if (language === "en") {
    return normalizedGender === "female"
      ? { subject: "she", possessive: "her", possessiveDative: "her", role: "player" }
      : { subject: "he", possessive: "his", possessiveDative: "his", role: "player" };
  }
  return normalizedGender === "female"
    ? { subject: "sie", possessive: "ihr", possessiveDative: "ihrem", role: "Spielerin" }
    : { subject: "er", possessive: "sein", possessiveDative: "seinem", role: "Spieler" };
}

export function getPlayerGrammarParams(player, language = "de") {
  return getPlayerGrammar(player?.gender, language);
}
