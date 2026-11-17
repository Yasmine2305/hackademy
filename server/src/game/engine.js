/**
 * Moteur de jeu : fonctions pures, sans base de données ni HTTP.
 *
 *   blankState()          → nouvelle partie
 *   sanitizeState(raw)    → partie nettoyée (on ne fait jamais confiance au client)
 *   applyAction(s, a, now)→ { state, events } ou lève une GameError
 *   buildView(s)          → ce que l'interface affiche (octets mérités, score, statut des missions…)
 *
 * Toute la logique « est-ce juste ? » vit ici, côté serveur.
 */
import {
  PACKET,
  PAYLOAD_OFFSET,
  WORD,
  LOG_TO_BYTE,
  LOG_PLAUSIBLE,
  Q1_ANSWER,
  RECIPE,
  ENTITIES,
  CHAIN_ORDER,
  PROOFS,
  HINTS,
  REPORT,
  LOGS,
  CARDS,
  OPERATIONS,
} from './scenario.js';

export const BYTES = 12;
export const POINTS_PER_HINT = 5;
export const POINTS_PER_ERROR = 4;
const MAX_LOG = 30;
const MISSION_KEYS = ['m1', 'm2', 'm3'];
const MISSION_NAMES = { 1: 'journaux', 2: 'décodage', 3: 'chronologie' };

export class GameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameError';
    this.status = 400;
  }
}

export function blankState() {
  return {
    v: 1,
    tags: [],
    q1: null,
    rec: [],
    ents: [],
    chain: [null, null, null, null, null],
    checked: false,
    hints: { m1: [], m2: [], m3: [] },
    errors: 0,
    startedAt: null,
    finishedAt: null,
    log: [],
  };
}

/* ------------------------------------------------------------------ */
/* Nettoyage d'un état venu du navigateur                              */
/* ------------------------------------------------------------------ */
const LOG_IDS = LOGS.map((l) => l[0]);
const CARD_IDS = Object.keys(CARDS);
const isInt = (n) => Number.isInteger(n);
const uniq = (arr) => [...new Set(arr)];
const isoOrNull = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

export function sanitizeState(raw) {
  const s = blankState();
  if (!raw || typeof raw !== 'object') return s;
  if (Array.isArray(raw.tags)) s.tags = uniq(raw.tags.filter((t) => LOG_IDS.includes(t)));
  if (raw.q1 === 0 || raw.q1 === 1) s.q1 = raw.q1;
  if (Array.isArray(raw.rec)) s.rec = raw.rec.filter((o) => OPERATIONS.includes(o)).slice(0, 8);
  if (Array.isArray(raw.ents)) s.ents = uniq(raw.ents.filter((e) => ENTITIES.includes(e)));
  if (Array.isArray(raw.chain) && raw.chain.length === 5) {
    const seen = new Set();
    s.chain = raw.chain.map((c) => {
      if (CARD_IDS.includes(c) && !seen.has(c)) {
        seen.add(c);
        return c;
      }
      return null;
    });
  }
  s.checked = raw.checked === true && s.chain.every(Boolean);
  if (raw.hints && typeof raw.hints === 'object') {
    for (const k of MISSION_KEYS) {
      const list = Array.isArray(raw.hints[k]) ? raw.hints[k] : [];
      s.hints[k] = uniq(list.filter((i) => isInt(i) && i >= 0 && i < HINTS[k].length));
    }
  }
  if (isInt(raw.errors) && raw.errors >= 0) s.errors = Math.min(raw.errors, 99);
  s.startedAt = isoOrNull(raw.startedAt);
  s.finishedAt = isoOrNull(raw.finishedAt);
  if (Array.isArray(raw.log)) {
    s.log = raw.log
      .filter((e) => e && typeof e.text === 'string' && isoOrNull(e.at))
      .slice(-MAX_LOG)
      .map((e) => ({ at: isoOrNull(e.at), kind: String(e.kind || 'info').slice(0, 12), text: e.text.slice(0, 120) }));
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Évaluation                                                          */
/* ------------------------------------------------------------------ */

/** Tableau de 12 booléens : quels octets du paquet sont prouvés. */
export function foundBytes(s) {
  const f = new Array(BYTES).fill(false);
  s.tags.forEach((t) => {
    if (LOG_TO_BYTE[t] !== undefined) f[LOG_TO_BYTE[t]] = true;
  });
  if (s.rec[0] === RECIPE[0]) f[4] = true;
  if (s.rec[0] === RECIPE[0] && s.rec[1] === RECIPE[1]) f[5] = true;
  if (s.ents.includes('ip')) f[6] = true;
  if (s.ents.includes('hr')) f[7] = true;
  if (s.checked) {
    if (s.chain[0] === CHAIN_ORDER[0] && s.chain[1] === CHAIN_ORDER[1]) f[8] = true;
    if (s.chain[2] === CHAIN_ORDER[2]) f[9] = true;
    if (s.chain[3] === CHAIN_ORDER[3]) f[10] = true;
    if (s.chain[4] === CHAIN_ORDER[4]) f[11] = true;
  }
  return f;
}

export const hintsUsed = (s) => s.hints.m1.length + s.hints.m2.length + s.hints.m3.length;

export function computeScore(s, found = foundBytes(s)) {
  const n = found.filter(Boolean).length;
  return Math.max(0, Math.round((n / BYTES) * 100) - POINTS_PER_HINT * hintsUsed(s) - POINTS_PER_ERROR * s.errors);
}

export function missionDone(s, m, found = foundBytes(s)) {
  return PROOFS.reduce((acc, p, i) => acc + (p.m === m && found[i] ? 1 : 0), 0);
}

export function missionSolved(s, m, found = foundBytes(s)) {
  return missionDone(s, m, found) === 4 && (m !== 1 || s.q1 === Q1_ANSWER);
}

export const recipeIsClear = (s) => s.rec.length === RECIPE.length && s.rec.every((o, i) => o === RECIPE[i]);

export const rankFor = (score, complete) => (complete && score >= 80 ? 'Analyste confirmé' : 'Analyste junior');

function hintsText(s) {
  const out = {};
  for (const k of MISSION_KEYS) out[k] = Object.fromEntries(s.hints[k].map((i) => [i, HINTS[k][i]]));
  return out;
}

function remarkFor(s, k) {
  const n = s.hints[k].length;
  return n ? `${n} indice${n > 1 ? 's' : ''}` : 'sans indice';
}

/** Vue envoyée au navigateur : seulement ce que le joueur a mérité. */
export function buildView(s) {
  const found = foundBytes(s);
  const count = found.filter(Boolean).length;
  const score = computeScore(s, found);
  const complete = count === BYTES;
  const marks = {};
  s.tags.forEach((t) => {
    marks[t] = LOG_TO_BYTE[t] !== undefined ? PACKET[PAYLOAD_OFFSET + LOG_TO_BYTE[t]] : '?';
  });
  const missions = {};
  [1, 2, 3].forEach((m) => {
    missions[m] = { done: missionDone(s, m, found), solved: missionSolved(s, m, found) };
  });

  let report = null;
  if (complete) {
    const e = s.errors;
    report = {
      ...REPORT,
      word: WORD,
      remarks: {
        m1: remarkFor(s, 'm1'),
        m2: remarkFor(s, 'm2'),
        m3: remarkFor(s, 'm3') + (e ? `, ${e} erreur${e > 1 ? 's' : ''} : ${REPORT.chainError}` : ''),
      },
    };
    delete report.chainError;
  }

  return {
    found: found.map((ok, i) =>
      ok ? { hex: PACKET[PAYLOAD_OFFSET + i], ch: WORD[i], t: PROOFS[i].t, s: PROOFS[i].s } : null,
    ),
    count,
    score,
    rank: rankFor(score, complete),
    hintsUsed: hintsUsed(s),
    errors: s.errors,
    missions,
    marks,
    q1: s.q1 === null ? null : { choice: s.q1, correct: s.q1 === Q1_ANSWER },
    recipeClear: recipeIsClear(s),
    chainWrong: s.checked ? s.chain.map((c, i) => (c !== CHAIN_ORDER[i] ? i : -1)).filter((i) => i >= 0) : [],
    hints: hintsText(s),
    complete,
    report,
  };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */
const clone = (s) => JSON.parse(JSON.stringify(s));

function pushLog(s, now, kind, text) {
  s.log.push({ at: now.toISOString(), kind, text });
  if (s.log.length > MAX_LOG) s.log = s.log.slice(-MAX_LOG);
}

const ACTIONS = {
  start(s, _a, now) {
    if (!s.startedAt) {
      s.startedAt = now.toISOString();
      pushLog(s, now, 'système', 'dossier #0417 ouvert');
    }
  },

  tagLog(s, { line }, _now, ev) {
    if (!LOG_IDS.includes(line)) throw new GameError('Ligne de journal inconnue.');
    const i = s.tags.indexOf(line);
    if (i >= 0) {
      s.tags.splice(i, 1);
      return;
    }
    if (LOG_TO_BYTE[line] !== undefined) {
      // une seule ligne par octet : on remplace les autres lignes qui visent le même
      s.tags = s.tags.filter((t) => LOG_TO_BYTE[t] !== LOG_TO_BYTE[line]);
      s.tags.push(line);
    } else if (LOG_PLAUSIBLE.includes(line)) {
      s.tags.push(line);
      ev.push({ kind: 'info', text: 'Ligne suspecte, mais elle ne restaure aucun octet.' });
    } else {
      s.tags.push(line);
      s.errors += 1;
      ev.push({ kind: 'error', text: `Ligne ${line} : rien d’anormal ici. −${POINTS_PER_ERROR} pts.` });
    }
  },

  answerQ1(s, { choice }, _now, ev) {
    if (choice !== 0 && choice !== 1) throw new GameError('Réponse invalide.');
    if (choice !== Q1_ANSWER && s.q1 !== choice) {
      s.errors += 1;
      ev.push({ kind: 'error', text: `Mauvaise priorité. −${POINTS_PER_ERROR} pts.` });
    }
    s.q1 = choice;
  },

  useHint(s, { mission, index }) {
    if (!MISSION_KEYS.includes(mission)) throw new GameError('Mission inconnue.');
    if (!isInt(index) || index < 0 || index >= HINTS[mission].length) throw new GameError('Indice inconnu.');
    if (!s.hints[mission].includes(index)) s.hints[mission].push(index);
  },

  setRecipe(s, { ops }) {
    if (!Array.isArray(ops) || ops.length > 8 || !ops.every((o) => OPERATIONS.includes(o))) {
      throw new GameError('Recette invalide.');
    }
    s.rec = ops.slice();
  },

  markEntity(s, { entity }, _now, ev) {
    if (!ENTITIES.includes(entity)) throw new GameError('Information inconnue.');
    if (!recipeIsClear(s)) throw new GameError('Décodez d’abord le message.');
    if (!s.ents.includes(entity)) s.ents.push(entity);
    else ev.push({ kind: 'info', text: 'Information déjà relevée.' });
  },

  placeCard(s, { card, slot }) {
    if (!CARD_IDS.includes(card)) throw new GameError('Carte inconnue.');
    if (slot !== null && slot !== undefined && !(isInt(slot) && slot >= 0 && slot < 5))
      throw new GameError('Étape inconnue.');
    s.chain = s.chain.map((c) => (c === card ? null : c));
    if (slot !== null && slot !== undefined) s.chain[slot] = card;
    s.checked = false;
  },

  checkChain(s, _a, _now, ev) {
    if (!s.chain.every(Boolean)) throw new GameError('Placez les cinq techniques avant de vérifier.');
    s.checked = true;
    const wrong = s.chain.filter((c, i) => c !== CHAIN_ORDER[i]).length;
    if (wrong) {
      s.errors += 1;
      ev.push({ kind: 'error', text: `${wrong} étape${wrong > 1 ? 's' : ''} à revoir. −${POINTS_PER_ERROR} pts.` });
    }
  },

  reset(s, _a, now) {
    Object.assign(s, blankState());
    s.startedAt = now.toISOString();
    pushLog(s, now, 'système', 'enquête relancée');
  },
};

export const ACTION_TYPES = Object.keys(ACTIONS);

/**
 * Applique une action. Renvoie le nouvel état, les notifications à afficher
 * et les jalons franchis (utilisés pour les points de restauration).
 */
export function applyAction(state, action, now = new Date()) {
  if (!action || typeof action.type !== 'string' || !ACTIONS[action.type]) {
    throw new GameError('Action inconnue.');
  }
  const prev = sanitizeState(state);
  const next = clone(prev);
  const events = [];
  ACTIONS[action.type](next, action, now, events);

  // octets gagnés → notification et journal d'activité
  const before = foundBytes(prev);
  const after = foundBytes(next);
  const gained = after.map((v, i) => (v && !before[i] ? i : -1)).filter((i) => i >= 0);
  gained.forEach((i) => {
    events.push({ kind: 'byte', text: `Octet ${i + 1}/12 restauré : 0x${PACKET[PAYLOAD_OFFSET + i]}` });
  });
  [1, 2, 3].forEach((m) => {
    const d0 = missionDone(prev, m, before);
    const d1 = missionDone(next, m, after);
    if (d1 > d0) pushLog(next, now, 'preuve', `${MISSION_NAMES[m]} : ${d1}/4 octets`);
  });

  // jalons
  const milestones = [];
  if (action.type === 'start' && !prev.startedAt) milestones.push('dossier ouvert');
  [1, 2, 3].forEach((m) => {
    if (missionSolved(next, m, after) && !missionSolved(prev, m, before)) {
      milestones.push(`mission ${m} résolue`);
      pushLog(next, now, 'mission', `mission ${m} résolue`);
      events.push({ kind: 'success', text: `Mission ${m} résolue : quatre octets de plus.` });
    }
  });
  const wasComplete = before.every(Boolean);
  const isComplete = after.every(Boolean);
  if (isComplete && !wasComplete) {
    if (!next.finishedAt) next.finishedAt = now.toISOString();
    milestones.push('rapport signé');
    pushLog(next, now, 'rapport', 'paquet complet, rapport disponible');
    events.push({ kind: 'success', text: 'Paquet complet : le rapport est débloqué.' });
  }

  return { state: next, events, milestones };
}
