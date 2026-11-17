import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db/database.js';
import { createApp } from '../src/app.js';

let server;
let base;

before(async () => {
  const app = createApp({ db: openDatabase(':memory:') });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

test('GET /scenario ne contient aucune réponse', async () => {
  const { status, body } = await call('GET', '/scenario');
  assert.equal(status, 200);
  assert.equal(body.header.length, 40);
  const raw = JSON.stringify(body);
  assert.ok(!raw.includes('EXFIL'), 'le mot final ne doit pas fuiter');
  assert.ok(!('order' in body));
});

test('partie invitée : le serveur évalue sans stocker', async () => {
  const r = await call('POST', '/game/action', { state: null, action: { type: 'tagLog', line: 7 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.view.count, 1);
  assert.equal(r.body.savedAt, null);
  const r2 = await call('POST', '/game/evaluate', { state: r.body.state });
  assert.equal(r2.body.view.count, 1);
});

test('action invalide → 400 avec message', async () => {
  const r = await call('POST', '/game/action', { action: { type: 'markEntity', entity: 'ip' } });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Décodez/);
});

test('inscription, partie sauvegardée, points de restauration et rapport', async () => {
  const bad = await call('POST', '/auth/register', { username: 'x', password: 'court' });
  assert.equal(bad.status, 400);

  // une partie commencée sans compte est reprise à l'inscription
  const guest = await call('POST', '/game/action', { state: null, action: { type: 'start' } });
  const reg = await call('POST', '/auth/register', {
    username: 'agent_0417',
    password: 'correct-horse-battery',
    guestState: guest.body.state,
  });
  assert.equal(reg.status, 201);
  const { token } = reg.body;

  const dup = await call('POST', '/auth/register', { username: 'AGENT_0417', password: 'correct-horse-battery' });
  assert.equal(dup.status, 409);

  const me = await call('GET', '/auth/me', undefined, token);
  assert.equal(me.body.user.username, 'agent_0417');

  const g0 = await call('GET', '/game', undefined, token);
  assert.ok(g0.body.state.startedAt, 'la partie invitée a été reprise');

  const actions = [
    { type: 'tagLog', line: 2 },
    { type: 'tagLog', line: 6 },
    { type: 'tagLog', line: 7 },
    { type: 'tagLog', line: 10 },
    { type: 'answerQ1', choice: 1 },
    { type: 'setRecipe', ops: ['b64', 'rot'] },
    { type: 'markEntity', entity: 'ip' },
    { type: 'markEntity', entity: 'hr' },
    ...['a', 'b', 'c', 'd', 'e'].map((card, slot) => ({ type: 'placeCard', card, slot })),
    { type: 'checkChain' },
  ];
  let last;
  // l'état envoyé par le client est ignoré quand on est connecté
  for (const action of actions) last = await call('POST', '/game/action', { action, state: { errors: 50 } }, token);
  assert.equal(last.body.view.complete, true);
  assert.equal(last.body.view.score, 100);
  assert.ok(last.body.savedAt);

  const snaps = await call('GET', '/progress/snapshots', undefined, token);
  assert.equal(snaps.body.snapshots.length, 3, 'on ne garde que 3 points de restauration');
  assert.equal(snaps.body.snapshots[0].label, 'rapport signé');

  const reports = await call('GET', '/progress/reports', undefined, token);
  assert.equal(reports.body.reports.length, 1);
  assert.match(reports.body.reports[0].sha256, /^[0-9a-f]{64}$/);

  const restore = await call('POST', `/progress/snapshots/${snaps.body.snapshots[2].id}/restore`, undefined, token);
  assert.equal(restore.status, 200);
  assert.ok(restore.body.view.count < 12);

  const login = await call('POST', '/auth/login', { username: 'agent_0417', password: 'mauvais-mot-de-passe' });
  assert.equal(login.status, 401);

  const out = await call('POST', '/auth/logout', undefined, token);
  assert.equal(out.status, 204);
  const after = await call('GET', '/auth/me', undefined, token);
  assert.equal(after.status, 401);
});

test('suppression de compte', async () => {
  const reg = await call('POST', '/auth/register', { username: 'temp_user', password: 'un-mot-de-passe-long' });
  const del = await call('DELETE', '/auth/me', { password: 'un-mot-de-passe-long' }, reg.body.token);
  assert.equal(del.status, 204);
  const login = await call('POST', '/auth/login', { username: 'temp_user', password: 'un-mot-de-passe-long' });
  assert.equal(login.status, 401);
});

test('formulaire de contact validé côté serveur', async () => {
  const bad = await call('POST', '/contact', { email: 'pas-un-mail', message: 'court' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.email && bad.body.fields.message);
  const ok = await call('POST', '/contact', { email: 'vous@exemple.tn', message: 'Une idée de quatrième mission.' });
  assert.equal(ok.status, 201);
});

test('route inconnue → 404 JSON', async () => {
  const r = await call('GET', '/nope');
  assert.equal(r.status, 404);
});

test('changement de mot de passe : ancien exigé, autres sessions fermées', async () => {
  const reg = await call('POST', '/auth/register', { username: 'pw_user', password: 'ancien-mot-de-passe' });
  const other = await call('POST', '/auth/login', { username: 'pw_user', password: 'ancien-mot-de-passe' });
  const bad = await call(
    'PATCH',
    '/auth/password',
    { current: 'faux-mot-de-passe', next: 'nouveau-mot-de-passe' },
    reg.body.token,
  );
  assert.equal(bad.status, 401);
  const short = await call(
    'PATCH',
    '/auth/password',
    { current: 'ancien-mot-de-passe', next: 'court' },
    reg.body.token,
  );
  assert.equal(short.status, 400);
  const ok = await call(
    'PATCH',
    '/auth/password',
    { current: 'ancien-mot-de-passe', next: 'nouveau-mot-de-passe' },
    reg.body.token,
  );
  assert.equal(ok.status, 204);
  assert.equal(
    (await call('GET', '/auth/me', undefined, reg.body.token)).status,
    200,
    'la session courante reste ouverte',
  );
  assert.equal(
    (await call('GET', '/auth/me', undefined, other.body.token)).status,
    401,
    'les autres sessions sont fermées',
  );
  assert.equal(
    (await call('POST', '/auth/login', { username: 'pw_user', password: 'nouveau-mot-de-passe' })).status,
    200,
  );
});

test('classement : meilleur score par analyste, sans données privées', async () => {
  const { status, body } = await call('GET', '/leaderboard');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.entries));
  assert.equal(body.entries[0].username, 'agent_0417');
  assert.equal(body.entries[0].score, 100);
  assert.ok(!('user_id' in body.entries[0]) && !('sha256' in body.entries[0]));
  assert.equal(body.players, 1);
});

test('les réponses sont compressées en gzip', async () => {
  const res = await fetch(`${base}/scenario`, { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(res.headers.get('content-encoding'), 'gzip');
});
