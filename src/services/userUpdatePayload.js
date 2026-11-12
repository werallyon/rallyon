/**
 * Split device/session-only fields from the canonical profile RPC payload.
 * Favorite teams are persisted through the RPC's dedicated argument.
 */
export function splitUserUpdatePayload(updates) {
  const {
    favoriteTeams,
    locationPermissionStatus,
    notificationPermissionStatus,
    ...profileUpdates
  } = updates;

  return { profileUpdates, favoriteTeams, locationPermissionStatus, notificationPermissionStatus };
}
