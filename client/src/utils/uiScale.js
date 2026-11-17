/**
 * Mise à l'échelle des grands écrans.
 *
 * La maquette est dessinée pour une largeur de 1 440 px. En dessous de 1 600 px, la mise en page
 * s'adapte d'elle-même (colonnes, tablette, téléphone : voir les @media du CSS).
 * Au-delà, sur un écran 1080p, 1440p, 4K ou avec un zoom navigateur réduit, le site restait
 * une colonne étroite au milieu de l'écran. On agrandit alors toute l'interface en proportion
 * (propriété CSS `zoom`), pour qu'elle occupe l'écran comme sur un portable.
 *
 *   largeur 1536 px → ×1      1920 px → ×1,2      2560 px → ×1,6      3840 px (4K) → ×2,4
 *
 * Deux compensations :
 *  - `--vh` : la hauteur d'écran utile, divisée par l'échelle (sinon le zoom l'agrandirait aussi) ;
 *  - `window.__uiScale` : lu par le moteur 3D pour dessiner plus de pixels et rester net.
 */
const BASE_WIDTH = 1600;
const MAX_SCALE = 3;

export function computeScale(width) {
  return Math.min(MAX_SCALE, Math.max(1, width / BASE_WIDTH));
}

function apply() {
  const s = computeScale(window.innerWidth);
  const root = document.getElementById('root');
  if (root) root.style.zoom = s === 1 ? '' : String(s);
  document.documentElement.style.setProperty('--vh', `${window.innerHeight / s}px`);
  const changed = window.__uiScale !== s;
  window.__uiScale = s;
  // prévient le moteur 3D, qui recalcule sa résolution avec la nouvelle échelle
  if (changed) window.dispatchEvent(new Event('hackademy:uiscale'));
}

/** À appeler une fois au démarrage : suit ensuite les redimensionnements et changements de zoom. */
export function initUiScale() {
  apply();
  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(apply);
  });
}
