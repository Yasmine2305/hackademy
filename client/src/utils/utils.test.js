import { describe, expect, it } from 'vitest';
import { runRecipe, OPS } from './decoders.js';
import { formatDuration, elapsed, plural } from './format.js';
import { identRows } from './pixels.js';

const MESSAGE = 'bmVwdXZpciBjZXJnci4gcG5hbnk6IGZpcC1vbnB4aGMgLT4gMTk4LjUxLjEwMC4yMy4gc3JhcmdlciAyM3U0Ny4=';

describe('atelier de décodage', () => {
  it('Base64 puis ROT13 donne le texte clair', () => {
    const r = runRecipe(MESSAGE, ['b64', 'rot']);
    expect(r.error).toBeNull();
    expect(r.text).toBe('archive prete. canal: svc-backup -> 198.51.100.23. fenetre 23h47.');
  });
  it('une opération inadaptée renvoie une erreur lisible', () => {
    const r = runRecipe(MESSAGE, ['hex']);
    expect(r.error).toMatch(/From Hex/);
  });
  it('ROT13 appliqué deux fois rend le texte d’origine', () => {
    expect(OPS.rot.run(OPS.rot.run('Hackademy'))).toBe('Hackademy');
  });
  it('recette vide : le texte est inchangé', () => {
    expect(runRecipe('abc', []).text).toBe('abc');
  });
});

describe('formatage', () => {
  it('formate une durée en hh:mm:ss', () => {
    expect(formatDuration(3725)).toBe('01:02:05');
    expect(formatDuration(-3)).toBe('00:00:00');
  });
  it('le chronomètre se fige à la fin de l’enquête', () => {
    expect(elapsed('2026-03-13T08:00:00Z', '2026-03-13T08:41:07Z')).toBe(2467);
    expect(elapsed(null)).toBe(0);
  });
  it('accorde le pluriel', () => {
    expect(plural(1, 'octet')).toBe('1 octet');
    expect(plural(3, 'octet')).toBe('3 octets');
  });
});

describe('avatars', () => {
  it('même nom → même avatar symétrique 8 × 8', () => {
    const a = identRows('agent_0417');
    expect(a).toEqual(identRows('agent_0417'));
    expect(a).toHaveLength(8);
    a.forEach((row) => expect(row).toBe(row.split('').reverse().join('')));
  });
});
