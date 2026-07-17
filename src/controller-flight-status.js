export function getControllerFlightStatus(flight, viewerPlayerId, viewerIsActive) {
  if (!flight) return { key: "boardViewOnly", replacements: {} };
  if (flight.activePlayerId !== viewerPlayerId || !viewerIsActive) {
    return {
      key: "controllerFlightWait",
      replacements: { playerName: flight.activePlayerName ?? "" },
      fallback: flight.waitHint ?? ""
    };
  }
  if (!flight.hasRolledSpeed) return { key: "boardViewOnly", replacements: {} };
  if (!flight.selectedShipId) {
    return {
      key: flight.movableShipCount > 0 ? "controllerFlightSelectOwnShip" : "controllerFlightNoMovableShips",
      replacements: {}
    };
  }
  if (flight.selectedShipBlocked) return { key: "controllerFlightShipBlocked", replacements: {} };
  const remaining = Math.max(0, Number(flight.selectedShipRemaining) || 0);
  if (remaining === 0) return { key: "controllerFlightNoMovementRemaining", replacements: {} };
  return {
    key: remaining === 1 ? "controllerFlightMovementRemainingOne" : "controllerFlightMovementRemainingMany",
    replacements: { count: remaining }
  };
}
