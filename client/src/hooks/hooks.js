import { useEffect, useRef, useState } from 'react';
import { elapsed, formatDuration } from '../utils/format.js';

/** Titre de l'onglet du navigateur. */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Hackademy` : 'Hackademy';
  }, [title]);
}

/** Chronomètre de l'enquête, rafraîchi chaque seconde tant qu'elle n'est pas finie. */
export function useClock(startedAt, finishedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt || finishedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, finishedAt]);
  return formatDuration(elapsed(startedAt, finishedAt, now));
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Effet d'inclinaison 3D d'une carte au survol. */
export function useTilt() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || reduced()) return undefined;
    const move = (e) => {
      const b = c.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5;
      const y = (e.clientY - b.top) / b.height - 0.5;
      c.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(6px)`;
    };
    const leave = () => {
      c.style.transform = '';
    };
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerleave', leave);
    return () => {
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerleave', leave);
    };
  }, []);
  return ref;
}

/** Garde la valeur précédente d'une variable entre deux rendus. */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export { reduced as prefersReducedMotion };

/**
 * Charge une donnée asynchrone (appel d'API) et expose son état :
 *   const { data, loading, error, reload } = useAsync(() => api.leaderboard(), [savedAt]);
 * Les réponses arrivées après le démontage du composant sont ignorées.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => fnRef.current())
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
