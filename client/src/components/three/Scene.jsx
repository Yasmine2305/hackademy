import { useEffect, useRef, useState } from 'react';
import { createScene } from './engine.js';

/**
 * Monte une scène Three.js dans une div et la met à jour quand `opts` change.
 * Si WebGL est indisponible, la div affiche une grille de repli (classe .no3d).
 */
export default function Scene({ type, opts, className = '', tip, style, label = 'Illustration 3D' }) {
  const ref = useRef(null);
  const stage = useRef(null);
  const [fallback, setFallback] = useState(false);
  const optsKey = JSON.stringify(opts ?? {});
  const latest = useRef(opts);
  latest.current = opts;

  useEffect(() => {
    try {
      stage.current = createScene(type, ref.current, latest.current);
      if (!stage.current) setFallback(true);
    } catch (e) {
      console.error(e);
      setFallback(true);
    }
    return () => {
      stage.current?.dispose();
      stage.current = null;
    };
  }, [type]);

  useEffect(() => {
    stage.current?.update?.(latest.current ?? {});
  }, [optsKey]);

  return (
    <div ref={ref} className={`scene ${className}${fallback ? ' no3d' : ''}`} data-scene={type} role="img" aria-label={label} style={style}>
      {tip && <span className="tip">{tip}</span>}
    </div>
  );
}
