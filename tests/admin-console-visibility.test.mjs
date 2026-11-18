import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const auth = readFileSync('src/services/authService.ts', 'utf8');
const profile = readFileSync('src/services/profileService.ts', 'utf8');
const types = readFileSync('src/types.ts', 'utf8');
const screen = readFileSync('src/components/ProfileScreen.tsx', 'utf8');

test('platform admin status comes only from trusted Supabase app metadata', () => {
  assert.match(auth, /isPlatformAdmin: u\.app_metadata\?\.role === 'admin'/);
  assert.match(profile, /isPlatformAdmin: authUser\.app_metadata\?\.role === 'admin'/);
  assert.doesNotMatch(auth, /isPlatformAdmin: m\.role|user_metadata[\s\S]{0,100}isPlatformAdmin/);
  assert.match(types, /isPlatformAdmin\?: boolean/);
});

test('the platform moderation entry point is hidden from non-admin users', () => {
  assert.match(screen, /onOpenAdminModeration && currentUser\?\.isPlatformAdmin === true/);
});
