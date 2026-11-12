import { useEffect } from 'react';
import { createAmbient } from './engine.js';

/** Champ d'étoiles fixe derrière tout le site (dans la div #amb de index.html). */
export default function Ambient() {
  useEffect(() => {
    const el = document.getElementById('amb');
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let st = null;
    try { st = createAmbient(el); } catch { /* pas de WebGL : le dégradé CSS suffit */ }
    return () => st?.dispose();
  }, []);
  return null;
}
