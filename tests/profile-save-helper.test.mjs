import assert from 'node:assert/strict';
import test from 'node:test';
import { saveProfileUpdate } from '../src/services/profileSave.ts';

test('failed profile UI saves surface the transaction error and never run success callbacks', async () => {
  let visibleError = null;
  let successCalls = 0;
  const updates = { favoriteSports: ['NFL'] };

  const saved = await saveProfileUpdate(
    async (received) => {
      assert.deepEqual(received, updates);
      return { success: false, error: 'database transaction rejected' };
    },
    updates,
    (message) => { visibleError = message; },
    () => { successCalls += 1; }
  );

  assert.equal(saved, false);
  assert.equal(visibleError, 'database transaction rejected');
  assert.equal(successCalls, 0);
});

test('profile UI success callbacks run only after updateUser confirms commit', async () => {
  let committed = false;
  let successCalls = 0;
  let visibleError = null;

  const saved = await saveProfileUpdate(
    async () => {
      await Promise.resolve();
      committed = true;
      return { success: true };
    },
    { homeCity: 'Committed City' },
    (message) => { visibleError = message; },
    () => {
      assert.equal(committed, true);
      successCalls += 1;
    }
  );

  assert.equal(saved, true);
  assert.equal(successCalls, 1);
  assert.equal(visibleError, null);
});

test('thrown profile save errors are surfaced as failures', async () => {
  let visibleError = null;
  const saved = await saveProfileUpdate(
    async () => { throw new Error('network unavailable'); },
    { username: 'new_name' },
    (message) => { visibleError = message; }
  );

  assert.equal(saved, false);
  assert.equal(visibleError, 'network unavailable');
});
