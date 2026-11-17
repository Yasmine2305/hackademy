import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { createRepository } from './db/database.js';
import { authMiddleware } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { gameRoutes } from './routes/game.js';
import { contactRoutes } from './routes/contact.js';
import { GameError } from './game/engine.js';

/**
 * Construit l'application Express (sans l'écouter) : pratique pour les tests.
 * @param {{ db: import('node:sqlite').DatabaseSync, staticDir?: string }} opts
 */
export function createApp({ db, staticDir } = {}) {
  const repo = createRepository(db);
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  // en-têtes de sécurité de base
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
    });
    next();
  });
  // compression gzip de toutes les réponses texte (JS, CSS, JSON) : −70 % de poids transféré
  app.use(compression());
  app.use(express.json({ limit: '64kb' }));

  const api = express.Router();
  api.use(authMiddleware(repo));
  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use('/auth', authRoutes(repo));
  api.use(gameRoutes(repo));
  api.use(contactRoutes(repo));
  api.use((_req, res) => res.status(404).json({ error: 'Route inconnue.' }));
  app.use('/api', api);

  // en production : le serveur distribue aussi le site React compilé
  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    // fichiers de /assets : leur nom contient une empreinte (index-CgkFiLrJ.js),
    // ils ne changent donc jamais → cache navigateur d'un an.
    app.use('/assets', express.static(path.join(staticDir, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
    // index.html est toujours revalidé, pour récupérer la dernière version du site
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  // gestion centralisée des erreurs
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof GameError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Requête trop volumineuse.' });
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  });

  return app;
}
