import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { requireAuth, rateLimit } from '../middleware/auth.js';
import { sanitizeState, buildView } from '../game/engine.js';
import { reportHash } from './game.js';

const USERNAME = /^[A-Za-z0-9_-]{3,20}$/;
const MIN_PASSWORD = 12;
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7; // 7 jours
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

function validate({ username, password }) {
  if (typeof username !== 'string' || !USERNAME.test(username)) {
    return 'Identifiant : 3 à 20 caractères, lettres, chiffres, _ ou -.';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 128) {
    return `Mot de passe : ${MIN_PASSWORD} caractères minimum.`;
  }
  return null;
}

/** Une partie « vide » : rien de commencé, rien de trouvé. */
function isEmpty(state) {
  return !state || (!state.startedAt && buildView(sanitizeState(state)).count === 0);
}

export function authRoutes(repo) {
  const r = Router();
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

  function openSession(res, user, status = 200) {
    const token = crypto.randomBytes(32).toString('base64url');
    repo.createSession(token, user.id, SESSION_TTL);
    res.status(status).json({ token, user: { id: user.id, username: user.username, createdAt: user.created_at } });
  }

  /** Reprend la partie jouée sans compte si le compte n'en a pas encore. */
  function adoptGuestState(userId, guestState) {
    if (!guestState) return;
    const stored = repo.getProgress(userId);
    if (stored && !isEmpty(stored.state)) return;
    const clean = sanitizeState(guestState);
    if (isEmpty(clean)) return;
    repo.saveProgress(userId, clean);
    repo.addSnapshot(userId, 'partie importée de ce navigateur', clean);
    const view = buildView(clean);
    if (view.complete && clean.finishedAt) {
      const { username } = repo.findUserById(userId);
      const durationS = clean.startedAt
        ? Math.round((Date.parse(clean.finishedAt) - Date.parse(clean.startedAt)) / 1000)
        : null;
      repo.addReport(userId, {
        caseId: '0417',
        score: view.score,
        durationS,
        sha256: reportHash({ username, score: view.score, finishedAt: clean.finishedAt }),
      });
    }
  }

  r.post('/register', limiter, async (req, res) => {
    const err = validate(req.body || {});
    if (err) return res.status(400).json({ error: err });
    const { username, password, guestState } = req.body;
    if (repo.findUserByName(username)) return res.status(409).json({ error: 'Cet identifiant est déjà pris.' });
    const hash = await bcrypt.hash(password, 10);
    const id = repo.createUser(username, hash);
    adoptGuestState(id, guestState);
    openSession(res, repo.findUserById(id), 201);
  });

  r.post('/login', limiter, async (req, res) => {
    const { username, password, guestState } = req.body || {};
    const user = typeof username === 'string' ? repo.findUserByName(username) : null;
    // on compare toujours un hachage pour ne pas révéler si l'identifiant existe
    const hash = user ? user.password_hash : DUMMY_HASH;
    const ok = typeof password === 'string' && (await bcrypt.compare(password, hash));
    if (!user || !ok) return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    adoptGuestState(user.id, guestState);
    openSession(res, user);
  });

  r.get('/me', requireAuth, (req, res) => {
    res.json({ user: { id: req.user.id, username: req.user.username, createdAt: req.user.created_at } });
  });

  r.post('/logout', requireAuth, (req, res) => {
    repo.deleteSession(req.token);
    res.status(204).end();
  });

  /** Droit à l'effacement : supprime le compte, la progression, les sauvegardes et les rapports. */
  r.delete('/me', requireAuth, async (req, res) => {
    const full = repo.findUserByName(req.user.username);
    const ok = typeof req.body?.password === 'string' && (await bcrypt.compare(req.body.password, full.password_hash));
    if (!ok) return res.status(401).json({ error: 'Mot de passe incorrect.' });
    repo.deleteUser(req.user.id);
    res.status(204).end();
  });

  /** Mise à jour du mot de passe : l'ancien est exigé, les autres appareils sont déconnectés. */
  r.patch('/password', requireAuth, limiter, async (req, res) => {
    const { current, next } = req.body || {};
    const full = repo.findUserByName(req.user.username);
    const ok = typeof current === 'string' && (await bcrypt.compare(current, full.password_hash));
    if (!ok)
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.', fields: { current: 'Incorrect.' } });
    if (typeof next !== 'string' || next.length < MIN_PASSWORD || next.length > 128) {
      return res
        .status(400)
        .json({ error: 'Nouveau mot de passe trop court.', fields: { next: `${MIN_PASSWORD} caractères minimum.` } });
    }
    if (next === current) {
      return res
        .status(400)
        .json({ error: 'Le nouveau mot de passe doit être différent.', fields: { next: 'Identique à l’actuel.' } });
    }
    repo.updatePassword(req.user.id, await bcrypt.hash(next, 10), req.token);
    res.status(204).end();
  });

  return r;
}
