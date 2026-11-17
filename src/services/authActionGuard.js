/**
 * Pure guards shared by Auth API completions and asynchronous auth-state hydration.
 * Revisions are monotonically increasing within one AuthService instance.
 */
export function isCurrentAuthAction(actionRevision, latestActionRevision, expectedUserId, sessionUserId) {
  return actionRevision === latestActionRevision && expectedUserId === sessionUserId;
}

export function isCurrentAuthHydration(authRevision, latestAuthRevision, actionRevision, latestActionRevision) {
  return authRevision === latestAuthRevision && actionRevision === latestActionRevision;
}
