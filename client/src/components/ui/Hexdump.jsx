import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../../hooks/hooks.js';

const printable = (c) => (c >= 32 && c < 127 ? String.fromCharCode(c) : '.');

/**
 * Vidage hexadécimal du paquet 0x7F3A (4 lignes de 16 octets).
 * `header` : 40 octets publics ; `found` : 12 × (null | {hex, ch}) renvoyés par le serveur.
 * `flicker` : des octets manquants clignotent au hasard (page d'accueil).
 */
export default function Hexdump({ header, found, big = false, tight = false, flicker = false }) {
  const [flick, setFlick] = useState(null);
  const total = header.length + found.length;

  useEffect(() => {
    if (!flicker || prefersReducedMotion()) return undefined;
    const missing = found.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
    if (!missing.length) return undefined;
    let off;
    const id = setInterval(() => {
      const k = missing[Math.floor(Math.random() * missing.length)];
      setFlick({ k, v: Math.floor(Math.random() * 256).toString(16).padStart(2, '0') });
      off = setTimeout(() => setFlick(null), 140);
    }, 420);
    return () => { clearInterval(id); clearTimeout(off); };
  }, [flicker, found]);

  const rows = [];
  for (let r = 0; r < Math.ceil(total / 16); r++) {
    const cells = [];
    const asc = [];
    for (let i = r * 16; i < Math.min(r * 16 + 16, total); i++) {
      if (i % 16 === 8) cells.push(<span key={`sp${i}`} className="by sp" />);
      if (i < header.length) {
        cells.push(<span key={i} className="by">{header[i]}</span>);
        asc.push(printable(parseInt(header[i], 16)));
      } else {
        const k = i - header.length;
        const f = found[k];
        if (f) {
          cells.push(<span key={i} className="by ok">{f.hex}</span>);
          asc.push(<u key={i}>{f.ch}</u>);
        } else {
          cells.push(<span key={i} className="by pay">{flick && flick.k === k ? flick.v : '??'}</span>);
          asc.push(<em key={i}>?</em>);
        }
      }
    }
    rows.push(
      <div className="hexr" key={r}>
        <span className="off">{(r * 16).toString(16).padStart(4, '0')}</span>
        <span className="hexb">{cells}</span>
        <span className="asc">{asc}</span>
      </div>,
    );
  }
  return <div className={`hex${big ? ' big' : ''}${tight ? ' tight' : ''}`}>{rows}</div>;
}
