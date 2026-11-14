import type { User } from '../types';

export function splitUserUpdatePayload(updates: Partial<User>): {
  profileUpdates: Record<string, unknown>;
  favoriteTeams?: User['favoriteTeams'];
  locationPermissionStatus?: User['locationPermissionStatus'];
  notificationPermissionStatus?: User['notificationPermissionStatus'];
};
