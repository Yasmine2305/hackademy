import { useEffect } from 'react';
import { loadEngine } from './Scene.jsx';

/**
 * Champ d'étoiles fixe derrière tout le site (dans la div #amb de index.html).
 * Purement décoratif : il démarre quand le navigateur est inactif, après
 * l'affichage de la page, et jamais sur petit écran ni si l'utilisateur
 * a demandé moins d'animations.
 */
export default function Ambient() {
  useEffect(() => {
    const el = document.getElementById('amb');
    const small = matchMedia('(max-width: 640px)').matches;
    if (!el || small || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let st = null;
    let cancelled = false;
    const start = () =>
      loadEngine()
        .then(({ createAmbient }) => {
          if (!cancelled) st = createAmbient(el);
        })
        .catch(() => {
          /* pas de WebGL : le dégradé CSS suffit */
        });

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 3000 })
      : window.setTimeout(start, 1500);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      st?.dispose();
    };
  }, []);
  return null;
}
