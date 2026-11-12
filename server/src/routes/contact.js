import { Router } from 'express';
import { rateLimit } from '../middleware/auth.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export function contactRoutes(repo) {
  const r = Router();
  r.post('/contact', rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }), (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    const message = String(req.body?.message ?? '').trim();
    const errors = {};
    if (!EMAIL.test(email)) errors.email = 'Adresse e-mail invalide.';
    if (message.length < 10) errors.message = 'Message trop court (10 caractères minimum).';
    if (message.length > 2000) errors.message = 'Message trop long (2000 caractères maximum).';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Formulaire incomplet.', fields: errors });
    repo.addMessage(email, message);
    res.status(201).json({ ok: true });
  });
  return r;
}
