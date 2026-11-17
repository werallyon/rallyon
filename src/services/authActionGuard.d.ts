export function isCurrentAuthAction(
  actionRevision: number,
  latestActionRevision: number,
  expectedUserId: string,
  sessionUserId: string | null
): boolean;

export function isCurrentAuthHydration(
  authRevision: number,
  latestAuthRevision: number,
  actionRevision: number,
  latestActionRevision: number
): boolean;
