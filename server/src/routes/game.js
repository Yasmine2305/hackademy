import { Router } from 'express';
import crypto from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';
import { applyAction, buildView, sanitizeState, blankState, computeScore } from '../game/engine.js';
import { publicScenario, WORD } from '../game/scenario.js';

/** Empreinte SHA-256 du rapport signé : rejouable et vérifiable. */
export function reportHash({ username, score, finishedAt }) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ case: '0417', username, score, word: WORD, finishedAt }))
    .digest('hex');
}

export function gameRoutes(repo) {
  const r = Router();

  r.get('/scenario', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(publicScenario());
  });

  /** Partie enregistrée du joueur connecté. */
  r.get('/game', requireAuth, (req, res) => {
    const row = repo.getProgress(req.user.id);
    const state = row ? sanitizeState(row.state) : blankState();
    res.json({ state, view: buildView(state), savedAt: row?.updatedAt ?? null });
  });

  /** Évalue une partie invitée (stockée dans le navigateur) sans rien enregistrer. */
  r.post('/game/evaluate', (req, res) => {
    const state = sanitizeState(req.body?.state);
    res.json({ state, view: buildView(state) });
  });

  /**
   * Applique une action de jeu.
   *  - connecté : l'état fait foi côté serveur, il est relu puis sauvegardé ;
   *  - invité   : l'état est fourni par le navigateur, nettoyé, puis renvoyé.
   */
  r.post('/game/action', (req, res) => {
    const action = req.body?.action;
    const current = req.user ? (repo.getProgress(req.user.id)?.state ?? blankState()) : req.body?.state;
    const { state, events, milestones } = applyAction(current, action);
    const view = buildView(state);
    let savedAt = null;
    if (req.user) {
      savedAt = repo.saveProgress(req.user.id, state);
      milestones.forEach((label) => repo.addSnapshot(req.user.id, label, state));
      if (milestones.includes('rapport signé')) {
        const score = computeScore(state);
        const durationS = state.startedAt
          ? Math.max(0, Math.round((Date.parse(state.finishedAt) - Date.parse(state.startedAt)) / 1000))
          : null;
        repo.addReport(req.user.id, {
          caseId: '0417',
          score,
          durationS,
          sha256: reportHash({ username: req.user.username, score, finishedAt: state.finishedAt }),
        });
      }
    }
    res.json({ state, view, events, milestones, savedAt });
  });

  /* --------- Progression : points de restauration et rapports --------- */
  r.get('/progress/snapshots', requireAuth, (req, res) => {
    res.json({ snapshots: repo.listSnapshots(req.user.id) });
  });

  r.post('/progress/snapshots/:id/restore', requireAuth, (req, res) => {
    const snap = repo.getSnapshot(req.user.id, Number(req.params.id));
    if (!snap) return res.status(404).json({ error: 'Point de restauration introuvable.' });
    const state = sanitizeState(snap.state);
    const savedAt = repo.saveProgress(req.user.id, state);
    res.json({ state, view: buildView(state), savedAt });
  });

  r.get('/progress/reports', requireAuth, (req, res) => {
    res.json({ reports: repo.listReports(req.user.id) });
  });

  /** Classement public : meilleur rapport de chaque analyste (aucune donnée privée). */
  r.get('/leaderboard', (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    res.set('Cache-Control', 'no-cache');
    res.json(repo.leaderboard(limit));
  });

  return r;
}
