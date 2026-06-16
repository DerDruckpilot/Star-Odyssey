export const startNumberTokenPools = {
  alpha: [4, 8, 11],
  beta: [8, 10, "3/12"],
  gamma: [3, 6, 5],
  delta: ["2/11", 6, 9]
};

export const normalNumberTokenPools = {
  triangle: [3, 4, 4, 11, 12, 3, 4, 11],
  bracket: [2, 5, 5, 6, 9, 5, 8, 9],
  hex: [10, 10, "pirate4", "pirate5", "ice3", "pirate6", 10, "ice4"]
};

export const reserveNumberTokenValues = [3, 9, 10, 11, 11];

const tokenGroupLabels = {
  alpha: "A",
  beta: "B",
  gamma: "G",
  delta: "D",
  triangle: "T",
  bracket: "B",
  hex: "H"
};

export function createNumberTokenState(boardLayout, boardPlacement) {
  const planetTokensById = {};

  for (const system of boardLayout.startSystems ?? []) {
    const pool = createTokenPool(system.name, startNumberTokenPools[system.name] ?? []);
    (system.planets ?? []).forEach((planet, index) => {
      planetTokensById[planet.id] = {
        ...pool[index],
        planetId: planet.id,
        revealed: true,
        resolved: false
      };
    });
  }

  const normalPools = Object.fromEntries(
    Object.entries(normalNumberTokenPools)
      .map(([group, values]) => [group, shuffle(createTokenPool(group, values))])
  );

  for (const system of boardPlacement?.placedSystems ?? []) {
    for (const planet of system.planets ?? []) {
      const group = planet.tokenGroup ?? "triangle";
      const token = normalPools[group]?.shift() ?? createFallbackToken(group);
      planetTokensById[planet.id] = {
        ...token,
        planetId: planet.id,
        revealed: false,
        resolved: false
      };
    }
  }

  return {
    planetTokensById,
    reserveTokens: shuffle(createTokenPool("reserve", reserveNumberTokenValues)),
    usedReserveTokens: [],
    specialMarkers: []
  };
}

export function normalizeNumberTokenState(numberTokens, boardLayout, boardPlacement) {
  const fallback = createNumberTokenState(boardLayout, boardPlacement);
  if (!numberTokens || typeof numberTokens !== "object") return fallback;

  const expectedPlanetIds = getExpectedPlanets(boardLayout, boardPlacement).map((planet) => planet.id);
  const savedTokens = numberTokens.planetTokensById && typeof numberTokens.planetTokensById === "object"
    ? numberTokens.planetTokensById
    : {};
  const planetTokensById = {};

  for (const planetId of expectedPlanetIds) {
    planetTokensById[planetId] = normalizeToken(savedTokens[planetId], fallback.planetTokensById[planetId], planetId);
  }

  return {
    planetTokensById,
    reserveTokens: normalizeTokenList(numberTokens.reserveTokens, fallback.reserveTokens),
    usedReserveTokens: normalizeTokenList(numberTokens.usedReserveTokens, []),
    specialMarkers: Array.isArray(numberTokens.specialMarkers) ? numberTokens.specialMarkers.filter(Boolean) : []
  };
}

export function revealSystemTokens(numberTokens, planetIds = []) {
  const planetTokensById = { ...(numberTokens?.planetTokensById ?? {}) };
  for (const planetId of planetIds) {
    if (!planetTokensById[planetId]) continue;
    planetTokensById[planetId] = {
      ...planetTokensById[planetId],
      revealed: true
    };
  }

  return {
    ...numberTokens,
    planetTokensById
  };
}

export function revealSystemsById(numberTokens, boardLayout, boardPlacement, systemIds = []) {
  const systems = [
    ...(boardLayout.startSystems ?? []),
    ...(boardPlacement?.placedSystems ?? [])
  ];
  const systemIdSet = new Set(systemIds);

  return systems
    .filter((system) => systemIdSet.has(system.id))
    .reduce((tokens, system) => revealSystemTokens(tokens, system.planetIds ?? (system.planets ?? []).map((planet) => planet.id)), numberTokens);
}

export function getPlanetToken(numberTokens, planetId) {
  return numberTokens?.planetTokensById?.[planetId] ?? null;
}

export function getTokenValues(token) {
  if (!token) return [];
  if (token.type === "number") return token.values ?? [];
  if (token.resolved && token.reserveToken) return token.reserveToken.values ?? [];
  return [];
}

export function doesTokenProduce(token, rollTotal) {
  return getTokenValues(token).includes(rollTotal);
}

export function isActiveSpecialToken(token) {
  return Boolean(token?.revealed && !token.resolved && ["pirate", "ice"].includes(token.type));
}

export function resolveSpecialToken(numberTokens, planetId, ownerPlayerId) {
  const token = getPlanetToken(numberTokens, planetId);
  if (!isActiveSpecialToken(token)) {
    return { numberTokens, reserveToken: null, marker: null };
  }

  const reserveToken = numberTokens.reserveTokens?.[0] ?? null;
  const reserveTokens = reserveToken ? numberTokens.reserveTokens.slice(1) : [];
  const usedReserveTokens = reserveToken
    ? [...(numberTokens.usedReserveTokens ?? []), reserveToken]
    : [...(numberTokens.usedReserveTokens ?? [])];
  const marker = {
    id: `${token.type}-${planetId}-${Date.now()}`,
    planetId,
    ownerPlayerId,
    type: token.type,
    value: token.value,
    reserveTokenId: reserveToken?.id ?? null
  };

  return {
    reserveToken,
    marker,
    numberTokens: {
      ...numberTokens,
      reserveTokens,
      usedReserveTokens,
      specialMarkers: [...(numberTokens.specialMarkers ?? []), marker],
      planetTokensById: {
        ...(numberTokens.planetTokensById ?? {}),
        [planetId]: {
          ...token,
          resolved: true,
          resolvedByPlayerId: ownerPlayerId,
          reserveToken
        }
      }
    }
  };
}

export function formatTokenLabel(token, hidden = false) {
  if (!token) return "";
  if (hidden) return getTokenGroupLabel(token.group);
  if (token.type === "pirate" && !token.resolved) return `P${token.value}`;
  if (token.type === "ice" && !token.resolved) return `E${token.value}`;
  return (getTokenValues(token).join("/") || getTokenGroupLabel(token.group));
}

export function getTokenGroupLabel(group) {
  return tokenGroupLabels[group] ?? "?";
}

export function getTokenRequirementUpgrade(token) {
  if (token?.type === "pirate") return "cannon";
  if (token?.type === "ice") return "cargo";
  return null;
}

function getExpectedPlanets(boardLayout, boardPlacement) {
  return [
    ...(boardLayout.startSystems ?? []),
    ...(boardPlacement?.placedSystems ?? [])
  ].flatMap((system) => system.planets ?? []);
}

function normalizeToken(token, fallback, planetId) {
  const base = token && typeof token === "object" ? token : fallback;
  if (!base) return createFallbackToken("triangle", planetId);

  return {
    ...base,
    planetId,
    group: base.group ?? fallback?.group ?? "triangle",
    type: ["number", "pirate", "ice"].includes(base.type) ? base.type : fallback?.type ?? "number",
    value: Number.isFinite(Number(base.value)) ? Number(base.value) : fallback?.value ?? null,
    values: Array.isArray(base.values) ? base.values.map(Number).filter(Number.isFinite) : fallback?.values ?? [],
    revealed: Boolean(base.revealed),
    resolved: Boolean(base.resolved),
    reserveToken: base.reserveToken ? normalizeToken(base.reserveToken, null, planetId) : null
  };
}

function normalizeTokenList(tokens, fallback) {
  if (!Array.isArray(tokens)) return fallback;
  return tokens
    .filter((token) => token && typeof token === "object")
    .map((token, index) => normalizeToken(token, fallback[index] ?? null, token.planetId ?? `reserve-${index + 1}`));
}

function createTokenPool(group, values) {
  return values.map((value, index) => createToken(group, value, index + 1));
}

function createToken(group, rawValue, index) {
  const parsed = parseRawTokenValue(rawValue);
  return {
    id: `${group}-${String(index).padStart(2, "0")}-${parsed.label}`,
    group,
    ...parsed
  };
}

function createFallbackToken(group) {
  return {
    id: `${group}-fallback-5`,
    group,
    type: "number",
    value: 5,
    values: [5],
    label: "5"
  };
}

function parseRawTokenValue(rawValue) {
  if (typeof rawValue === "string" && rawValue.startsWith("pirate")) {
    const value = Number(rawValue.replace("pirate", ""));
    return { type: "pirate", value, values: [], label: `pirate${value}` };
  }
  if (typeof rawValue === "string" && rawValue.startsWith("ice")) {
    const value = Number(rawValue.replace("ice", ""));
    return { type: "ice", value, values: [], label: `ice${value}` };
  }

  const values = String(rawValue).split("/").map(Number).filter(Number.isFinite);
  return {
    type: "number",
    value: values[0] ?? null,
    values,
    label: values.join("-")
  };
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }
  return shuffled;
}
