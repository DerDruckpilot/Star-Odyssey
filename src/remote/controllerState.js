function getResourceCount(resources) {
  return Object.values(resources ?? {}).reduce((sum, amount) => sum + (Number(amount) || 0), 0);
}

function getPublicFriendshipState(friendship) {
  if (!friendship) return friendship;
  const { cards: _privateCards, ...publicFriendship } = friendship;
  return publicFriendship;
}

function getPlayerView(player, viewerPlayerId) {
  const resourceCount = getResourceCount(player?.resources);
  if (player?.id === viewerPlayerId) {
    return {
      ...player,
      resourceCount
    };
  }

  const {
    resources: _privateResources,
    tradeRates: _privateTradeRates,
    upgradeBonuses: _privateUpgradeBonuses,
    effectiveUpgrades: _privateEffectiveUpgrades,
    supernovaMissions: _privateMissions,
    friendship,
    ...publicPlayer
  } = player ?? {};

  return {
    ...publicPlayer,
    resourceCount,
    friendship: getPublicFriendshipState(friendship)
  };
}

function getSevenResolutionView(sevenResolution, viewerPlayerId) {
  if (!sevenResolution) return sevenResolution;
  const ownSelection = sevenResolution.discardSelections?.[viewerPlayerId];
  return {
    ...sevenResolution,
    discardSelections: ownSelection ? { [viewerPlayerId]: ownSelection } : {}
  };
}

function getTradeView(trade, viewerPlayerId, activePlayerId) {
  if (!trade) return trade;
  const activeTradeOffer = trade.activeTradeOffer;
  const isOfferParticipant = Boolean(
    activeTradeOffer &&
    [activeTradeOffer.fromPlayerId, activeTradeOffer.toPlayerId].includes(viewerPlayerId)
  );
  const canSeeDraft = viewerPlayerId === activePlayerId;

  return {
    bankFromResource: canSeeDraft ? trade.bankFromResource : null,
    bankToResource: canSeeDraft ? trade.bankToResource : null,
    offerTargetPlayerId: canSeeDraft ? trade.offerTargetPlayerId : null,
    offeredResources: canSeeDraft ? trade.offeredResources : {},
    requestedResources: canSeeDraft ? trade.requestedResources : {},
    activeTradeOffer: isOfferParticipant ? activeTradeOffer : null
  };
}

function getActionView(actions, viewerPlayerId) {
  return Array.isArray(actions)
    ? actions.filter((action) => !action?.forPlayerId || action.forPlayerId === viewerPlayerId)
    : [];
}

function getFriendshipCardSelectionView(selection, viewerPlayerId) {
  if (!selection || selection.ownerPlayerId !== viewerPlayerId) return null;
  return selection;
}

export function createControllerViewState(remoteState, viewerPlayerId) {
  const players = Array.isArray(remoteState?.players) ? remoteState.players : [];
  const adminPlayerId = players[0]?.id ?? null;

  return {
    ...remoteState,
    viewerPlayerId,
    players: players.map((player) => getPlayerView(player, viewerPlayerId)),
    sevenResolution: getSevenResolutionView(remoteState?.sevenResolution, viewerPlayerId),
    trade: getTradeView(remoteState?.trade, viewerPlayerId, remoteState?.activePlayerId),
    friendshipCardSelection: getFriendshipCardSelectionView(remoteState?.friendshipCardSelection, viewerPlayerId),
    actions: getActionView(remoteState?.actions, viewerPlayerId),
    saves: viewerPlayerId === adminPlayerId ? remoteState?.saves ?? [] : []
  };
}

export function createControllerStatesByPlayerId(remoteState) {
  const playerIds = new Set([
    ...(remoteState?.controllerLobby?.slots ?? []).map((slot) => slot.playerId),
    ...(remoteState?.players ?? []).map((player) => player.id)
  ]);

  return Object.fromEntries(
    [...playerIds]
      .filter(Boolean)
      .map((playerId) => [playerId, createControllerViewState(remoteState, playerId)])
  );
}
