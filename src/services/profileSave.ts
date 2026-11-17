import type { User } from '../types';
import type { AuthResponse } from './authService';

type UpdateUser = (updates: Partial<User>) => Promise<AuthResponse>;

const DEFAULT_SAVE_ERROR = 'Unable to save your profile. Please try again.';

/**
 * Shared UI boundary for persisted profile changes. Success callbacks run only
 * after AuthService confirms the canonical profile transaction committed.
 */
export async function saveProfileUpdate(
  updateUser: UpdateUser,
  updates: Partial<User>,
  onError: (message: string) => void,
  onSuccess?: () => void
): Promise<boolean> {
  let result: AuthResponse;
  try {
    result = await updateUser(updates);
  } catch (error) {
    onError(error instanceof Error ? error.message : DEFAULT_SAVE_ERROR);
    return false;
  }

  if (!result.success) {
    onError(result.error || DEFAULT_SAVE_ERROR);
    return false;
  }

  onSuccess?.();
  return true;
}
