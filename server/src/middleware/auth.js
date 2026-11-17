/** Authentification par jeton opaque (Bearer), stocké dans la table sessions. */
export function authMiddleware(repo) {
  return function readUser(req, _res, next) {
    const h = req.get('authorization') || '';
    const m = /^Bearer ([A-Za-z0-9_-]{20,})$/.exec(h);
    req.token = m ? m[1] : null;
    req.user = req.token ? repo.userForToken(req.token) : null;
    next();
  };
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Connexion requise.' });
  next();
}

/**
 * Limiteur très simple, en mémoire : `max` requêtes par fenêtre de `windowMs`
 * pour une même adresse. Suffisant pour freiner la force brute sur /login.
 */
export function rateLimit({ windowMs, max: baseMax }) {
  // RATE_LIMIT_FACTOR (défaut 1) n'est relevé que par les tests multi-navigateurs,
  // qui enchaînent des dizaines d'inscriptions depuis la même machine.
  const max = baseMax * (Number(process.env.RATE_LIMIT_FACTOR) || 1);
  const hits = new Map();
  return function limit(req, res, next) {
    const key = req.ip;
    const t = Date.now();
    const entry = hits.get(key);
    if (!entry || t - entry.start > windowMs) {
      hits.set(key, { start: t, n: 1 });
      return next();
    }
    entry.n += 1;
    if (entry.n > max) {
      res.set('Retry-After', String(Math.ceil((entry.start + windowMs - t) / 1000)));
      return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
    }
    next();
  };
}
