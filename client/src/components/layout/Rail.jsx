import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { Cells } from '../ui/ui.jsx';

/** Rail de réassemblage : le paquet 0x7F3A toujours visible pendant l'enquête. */
export default function Rail() {
  const { view } = useGame();
  const prev = useRef(null);
  const [fresh, setFresh] = useState([]);

  // fait « sauter » les octets qui viennent d'être restaurés
  useEffect(() => {
    const now = view.found.map(Boolean);
    if (prev.current) {
      const gained = now.map((v, i) => (v && !prev.current[i] ? i : -1)).filter((i) => i >= 0);
      if (gained.length) {
        setFresh(gained);
        const t = setTimeout(() => setFresh([]), 700);
        prev.current = now;
        return () => clearTimeout(t);
      }
    }
    prev.current = now;
    return undefined;
  }, [view.found]);

  return (
    <div className="rail">
      <div className="wrap">
        <span className="lbl">paquet 0x7F3A</span>
        <Cells found={view.found} fresh={fresh} />
        <span className="ascii">{view.found.map((f, i) => (f ? f.ch : <em key={i}>·</em>))}</span>
        <span className="cnt">
          {view.count}/12 octets · {view.score} pts
        </span>
      </div>
    </div>
  );
}
