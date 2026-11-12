/**
 * Opérations de l'atelier de décodage (mission 2), façon CyberChef.
 * Chaque opération lève une erreur si l'entrée n'a pas le bon format.
 */
const shift = (n) => (s) =>
  s.replace(/[a-z]/gi, (c) => {
    const a = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - a + n) % 26) + a);
  });

export const OPS = {
  b64: {
    name: 'From Base64',
    run(s) {
      const clean = s.replace(/\s/g, '');
      if (!/^[A-Za-z0-9+/]+=*$/.test(clean)) throw new Error('format');
      const bin = atob(clean);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    },
  },
  rot: { name: 'ROT13', run: shift(13) },
  hex: {
    name: 'From Hex',
    run(s) {
      const h = s.replace(/\s/g, '');
      if (!/^([0-9a-f]{2})+$/i.test(h)) throw new Error('format');
      return h.match(/../g).map((x) => String.fromCharCode(parseInt(x, 16))).join('');
    },
  },
  cae: { name: 'César −3', run: shift(23) },
  url: { name: 'URL Decode', run: (s) => decodeURIComponent(s) },
};

/** Applique la recette dans l'ordre. Renvoie { text, error }. */
export function runRecipe(input, recipe) {
  let text = input;
  for (const key of recipe) {
    const op = OPS[key];
    if (!op) return { text, error: `Opération inconnue : ${key}` };
    try {
      text = op.run(text);
    } catch {
      return { text, error: `${op.name} : cette entrée ne correspond pas à ce format.` };
    }
  }
  return { text, error: null };
}
