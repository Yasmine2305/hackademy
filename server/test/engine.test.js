import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, blankState, buildView, sanitizeState, GameError } from '../src/game/engine.js';

const NOW = new Date('2026-03-13T08:31:00Z');
/** Enchaîne des actions et renvoie le dernier résultat. */
function play(actions, state = blankState()) {
  let res = { state, events: [], milestones: [] };
  for (const a of actions) res = applyAction(res.state, a, NOW);
  return res;
}

const SOLVE_M1 = [
  { type: 'tagLog', line: 2 },
  { type: 'tagLog', line: 6 },
  { type: 'tagLog', line: 7 },
  { type: 'tagLog', line: 10 },
  { type: 'answerQ1', choice: 1 },
];
const SOLVE_M2 = [
  { type: 'setRecipe', ops: ['b64', 'rot'] },
  { type: 'markEntity', entity: 'ip' },
  { type: 'markEntity', entity: 'hr' },
];
const SOLVE_M3 = [
  ...['a', 'b', 'c', 'd', 'e'].map((card, slot) => ({ type: 'placeCard', card, slot })),
  { type: 'checkChain' },
];

test('une partie neuve ne révèle aucun octet', () => {
  const v = buildView(blankState());
  assert.equal(v.count, 0);
  assert.equal(v.score, 0);
  assert.ok(v.found.every((x) => x === null));
  assert.equal(v.report, null);
});

test('mission 1 : les 4 bonnes lignes + la bonne priorité résolvent la mission', () => {
  const { state, milestones } = play(SOLVE_M1);
  const v = buildView(state);
  assert.equal(v.missions[1].done, 4);
  assert.equal(v.missions[1].solved, true);
  assert.deepEqual(milestones, ['mission 1 résolue']);
  assert.equal(v.found[0].hex, '45');
  assert.equal(v.found[0].ch, 'E');
});

test('marquer une ligne anodine coûte une erreur', () => {
  const { state, events } = play([{ type: 'tagLog', line: 1 }]);
  assert.equal(state.errors, 1);
  assert.equal(events[0].kind, 'error');
  assert.equal(buildView(state).marks[1], '?');
});

test('les lignes plausibles (9, 11) ne pénalisent pas', () => {
  const { state } = play([
    { type: 'tagLog', line: 9 },
    { type: 'tagLog', line: 11 },
  ]);
  assert.equal(state.errors, 0);
});

test('une seule ligne par octet : la rafale SSH remplace la précédente', () => {
  const { state } = play([
    { type: 'tagLog', line: 2 },
    { type: 'tagLog', line: 3 },
  ]);
  assert.deepEqual(state.tags, [3]);
});

test('mission 2 : impossible de relever une info sans avoir décodé', () => {
  assert.throws(() => play([{ type: 'markEntity', entity: 'ip' }]), GameError);
});

test('mission 2 : la bonne recette restaure 4 octets', () => {
  const v = buildView(play(SOLVE_M2).state);
  assert.equal(v.missions[2].done, 4);
  assert.equal(v.recipeClear, true);
});

test('mission 3 : un mauvais ordre compte une erreur et signale les étapes', () => {
  const wrong = [
    ...['b', 'a', 'c', 'd', 'e'].map((card, slot) => ({ type: 'placeCard', card, slot })),
    { type: 'checkChain' },
  ];
  const { state } = play(wrong);
  const v = buildView(state);
  assert.equal(state.errors, 1);
  assert.deepEqual(v.chainWrong, [0, 1]);
  assert.equal(v.missions[3].done, 3);
});

test('vérifier une chaîne incomplète est refusé', () => {
  assert.throws(() => play([{ type: 'checkChain' }]), /cinq techniques/);
});

test('partie complète : rapport débloqué, score et jalon', () => {
  const { state, milestones } = play([{ type: 'start' }, ...SOLVE_M1, ...SOLVE_M2, ...SOLVE_M3]);
  const v = buildView(state);
  assert.equal(v.count, 12);
  assert.equal(v.complete, true);
  assert.equal(v.score, 100);
  assert.equal(v.report.word, 'EXFIL:BACKUP');
  assert.ok(milestones.includes('rapport signé'));
  assert.ok(state.finishedAt);
});

test('les indices coûtent 5 points et dévoilent leur texte', () => {
  const { state } = play([...SOLVE_M1, { type: 'useHint', mission: 'm1', index: 0 }]);
  const v = buildView(state);
  assert.equal(v.hintsUsed, 1);
  assert.equal(v.score, 33 - 5);
  assert.match(v.hints.m1[0], /203\.0\.113\.66/);
  assert.equal(v.hints.m2[0], undefined);
});

test('le score ne descend jamais sous zéro', () => {
  const { state } = play(Array.from({ length: 5 }, (_, i) => ({ type: 'tagLog', line: [1, 5, 8, 12, 1][i] })));
  assert.equal(buildView(state).score, 0);
});

test('sanitizeState ignore les valeurs forgées par le client', () => {
  const s = sanitizeState({
    tags: [2, 999, 'x', 2],
    rec: ['b64', 'rm -rf'],
    ents: ['ip', 'admin'],
    chain: ['a', 'a', 'z', null, 'e'],
    checked: true,
    errors: -5,
    hints: { m1: [0, 7] },
  });
  assert.deepEqual(s.tags, [2]);
  assert.deepEqual(s.rec, ['b64']);
  assert.deepEqual(s.ents, ['ip']);
  assert.deepEqual(s.chain, ['a', null, null, null, 'e']);
  assert.equal(s.checked, false);
  assert.equal(s.errors, 0);
  assert.deepEqual(s.hints.m1, [0]);
});

test('action inconnue refusée', () => {
  assert.throws(() => applyAction(blankState(), { type: 'win' }), GameError);
});
