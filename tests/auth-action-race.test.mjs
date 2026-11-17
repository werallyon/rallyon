import assert from 'node:assert/strict';
import test from 'node:test';
import { isCurrentAuthAction, isCurrentAuthHydration } from '../src/services/authActionGuard.js';

test('an older sign-in completion cannot publish after a newer action starts', () => {
  assert.equal(isCurrentAuthAction(4, 5, 'user-a', 'user-a'), false);
});

test('a sign-in completion cannot publish a session belonging to another identity', () => {
  assert.equal(isCurrentAuthAction(5, 5, 'user-a', 'user-b'), false);
});

test('the latest sign-in completion may publish only its matching session', () => {
  assert.equal(isCurrentAuthAction(5, 5, 'user-b', 'user-b'), true);
});

test('auth-state hydration started before a newer action cannot publish afterward', () => {
  assert.equal(isCurrentAuthHydration(8, 8, 4, 5), false);
});

test('auth-state hydration is allowed only while both revisions remain current', () => {
  assert.equal(isCurrentAuthHydration(8, 8, 5, 5), true);
});
