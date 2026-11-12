import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../src/services/authService.ts';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function makeClient() {
  let sessionUser = null;
  const callbacks = [];
  const pendingSignIns = new Map();
  const client = {
    auth: {
      onAuthStateChange(callback) {
        callbacks.push(callback);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async getSession() {
        return { data: { session: sessionUser ? { user: sessionUser } : null }, error: null };
      },
      async signInWithPassword({ email }) {
        const pending = pendingSignIns.get(email);
        const result = await pending.promise;
        sessionUser = result.user;
        return { data: result, error: null };
      },
      async signOut() {
        sessionUser = null;
        return { error: null };
      },
      async getUser() {
        return { data: { user: sessionUser }, error: null };
      }
    },
    pendingSignIns,
    setSession(user) { sessionUser = user; },
    emit(event, session) { callbacks.forEach((callback) => callback(event, session)); }
  };
  return client;
}

const authUser = (id, email) => ({ id, email, email_confirmed_at: '2026-01-01T00:00:00Z' });

test('real AuthService sign-in operations reject an older request that resolves last', async () => {
  const client = makeClient();
  const service = new AuthService(client);
  service.hydrateUser = async (user) => ({ id: user.id, email: user.email });
  const first = deferred();
  const second = deferred();
  client.pendingSignIns.set('a@example.com', first);
  client.pendingSignIns.set('b@example.com', second);

  const signInA = service.signIn('a@example.com', 'passwordA');
  const signInB = service.signIn('b@example.com', 'passwordB');
  const userB = authUser('user-b', 'b@example.com');
  second.resolve({ user: userB, session: { user: userB } });
  const resultB = await signInB;
  assert.equal(resultB.success, true);
  assert.equal(service.getCurrentUser()?.id, 'user-b');

  const userA = authUser('user-a', 'a@example.com');
  first.resolve({ user: userA, session: { user: userA } });
  const resultA = await signInA;
  assert.equal(resultA.success, false);
  assert.equal(service.getCurrentUser()?.id, 'user-b');
});

test('a sign-in completing after sign-out cannot republish the signed-out user', async () => {
  const client = makeClient();
  const service = new AuthService(client);
  service.hydrateUser = async (user) => ({ id: user.id, email: user.email });
  const pending = deferred();
  client.pendingSignIns.set('a@example.com', pending);

  const signIn = service.signIn('a@example.com', 'passwordA');
  service.logout();
  const userA = authUser('user-a', 'a@example.com');
  pending.resolve({ user: userA, session: { user: userA } });

  const result = await signIn;
  assert.equal(result.success, false);
  assert.equal(service.getCurrentUser(), null);
});

test('initialization completing after a newer sign-in cannot overwrite that account', async () => {
  const client = makeClient();
  const initialSession = deferred();
  let getSessionCalls = 0;
  const originalGetSession = client.auth.getSession;
  client.auth.getSession = async () => {
    getSessionCalls += 1;
    if (getSessionCalls === 1) return initialSession.promise;
    return originalGetSession();
  };
  const service = new AuthService(client);
  service.hydrateUser = async (user) => ({ id: user.id, email: user.email });
  const pending = deferred();
  client.pendingSignIns.set('b@example.com', pending);

  const initialize = service.initialize();
  const signIn = service.signIn('b@example.com', 'passwordB');
  const userB = authUser('user-b', 'b@example.com');
  pending.resolve({ user: userB, session: { user: userB } });
  await signIn;

  const userA = authUser('user-a', 'a@example.com');
  initialSession.resolve({ data: { session: { user: userA } }, error: null });
  await initialize;
  assert.equal(service.getCurrentUser()?.id, 'user-b');
});

test('account-switch hydration clears the old account and rejects its late completion', async () => {
  const client = makeClient();
  const service = new AuthService(client);
  service.hydrateUser = async (user) => ({ id: user.id, email: user.email });
  const userA = authUser('user-a', 'a@example.com');
  client.pendingSignIns.set('a@example.com', { promise: Promise.resolve({ user: userA, session: { user: userA } }) });
  await service.signIn('a@example.com', 'passwordA');

  const notifications = [];
  service.subscribe((user) => notifications.push(user?.id ?? null));
  const hydrationA = deferred();
  const hydrationB = deferred();
  service.hydrateUser = (user) => user.id === 'user-a' ? hydrationA.promise : hydrationB.promise;

  client.setSession(userA);
  client.emit('TOKEN_REFRESHED', { user: userA });
  const userB = authUser('user-b', 'b@example.com');
  client.setSession(userB);
  client.emit('SIGNED_IN', { user: userB });
  assert.equal(service.getCurrentUser(), null, 'A must be cleared as soon as B becomes the authenticated identity');

  hydrationB.resolve({ id: 'user-b', email: 'b@example.com' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.getCurrentUser()?.id, 'user-b');

  hydrationA.resolve({ id: 'user-a', email: 'a@example.com' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.getCurrentUser()?.id, 'user-b');
  assert.deepEqual(notifications.slice(-3), [null, 'user-b', 'user-b']);
});
