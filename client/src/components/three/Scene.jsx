import { useEffect, useRef, useState } from 'react';

/**
 * Le moteur 3D (Three.js, ~500 Ko) est chargé à la demande, une seule fois,
 * et seulement quand une scène doit vraiment s'afficher : la page apparaît
 * d'abord, la 3D arrive ensuite (lazy loading).
 */
let enginePromise = null;
export function loadEngine() {
  if (!enginePromise) enginePromise = import('./engine.js');
  return enginePromise;
}

/**
 * Monte une scène Three.js dans une div et la met à jour quand `opts` change.
 * Tant que la 3D charge, la div affiche un fond animé (classe .loading3d) ;
 * si WebGL est indisponible, une grille de repli (classe .no3d).
 */
export default function Scene({ type, opts, className = '', tip, style, label = 'Illustration 3D' }) {
  const ref = useRef(null);
  const stage = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | fallback
  const optsKey = JSON.stringify(opts ?? {});
  const latest = useRef(opts);
  latest.current = opts;

  useEffect(() => {
    let cancelled = false;
    const el = ref.current;

    // on ne charge la 3D que lorsque la scène approche de l'écran
    const mount = () =>
      loadEngine()
        .then(({ createScene }) => {
          if (cancelled) return;
          stage.current = createScene(type, el, latest.current);
          setStatus(stage.current ? 'ready' : 'fallback');
        })
        .catch((e) => {
          // page quittée pendant le chargement (fréquent sous Safari) : rien à signaler
          if (cancelled) return;
          console.error(e);
          setStatus('fallback');
        });

    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            mount();
          }
        },
        { rootMargin: '200px' },
      );
      io.observe(el);
    } else {
      mount();
    }

    return () => {
      cancelled = true;
      io?.disconnect();
      stage.current?.dispose();
      stage.current = null;
    };
  }, [type]);

  useEffect(() => {
    stage.current?.update?.(latest.current ?? {});
  }, [optsKey]);

  const stateCls = status === 'fallback' ? ' no3d' : status === 'loading' ? ' loading3d' : '';
  return (
    <div
      ref={ref}
      className={`scene ${className}${stateCls}`}
      data-scene={type}
      role="img"
      aria-label={label}
      style={style}
    >
      {tip && status === 'ready' && <span className="tip">{tip}</span>}
    </div>
  );
}
