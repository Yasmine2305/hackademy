import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext.jsx';
import { ROUTES } from '../../routes.js';

/** Où mène chaque terme du glossaire. */
const GLOSS_PAGE = {
  Base64: '/centre/mission-2',
  ROT13: '/centre/mission-2',
  'MITRE ATT&CK': '/centre/mission-3',
  'Kill chain': '/centre/mission-3',
};

/**
 * « grep le dossier » : recherche instantanée dans les pages, le glossaire et les journaux.
 * Raccourci clavier : « / ». Flèches pour naviguer, Entrée pour ouvrir, Échap pour fermer.
 */
export default function Search() {
  const { scenario } = useGame();
  const navigate = useNavigate();
  const input = useRef(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName) && input.current?.offsetParent) {
        e.preventDefault();
        input.current.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const hits = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return [];
    const out = [];
    ROUTES.forEach((r) => {
      if (r.title.toLowerCase().includes(v)) out.push({ to: r.path, label: r.title, sub: 'page' });
    });
    Object.entries(scenario?.glossary || {}).forEach(([k, d]) => {
      if ((k + d).toLowerCase().includes(v)) out.push({ to: GLOSS_PAGE[k] || '/centre/mission-1', label: k, sub: d });
    });
    (scenario?.logs || []).forEach((l) => {
      if (l.join(' ').toLowerCase().includes(v))
        out.push({ to: '/centre/mission-1', label: `auth.log L${l[0]} · ${l[2]}`, sub: l[4] });
    });
    return out.slice(0, 6);
  }, [q, scenario]);

  function go(hit) {
    setOpen(false);
    setQ('');
    input.current?.blur();
    navigate(hit.to);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      input.current.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  return (
    <label className="grep">
      <b>/</b>
      <input
        ref={input}
        value={q}
        placeholder="grep le dossier"
        aria-label="Rechercher dans le dossier"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && !!q}
        aria-controls="grep-results"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {open && q.trim() && (
        <div className="results" id="grep-results" role="listbox">
          {hits.length ? (
            hits.map((h, i) => (
              <a
                key={h.label + i}
                href={h.to}
                role="option"
                aria-selected={i === active}
                style={i === active ? { background: 'var(--raise2)' } : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(h);
                }}
              >
                {h.label}
                <small>{h.sub}</small>
              </a>
            ))
          ) : (
            <a role="option" aria-selected="false">
              Aucun résultat
            </a>
          )}
        </div>
      )}
    </label>
  );
}
