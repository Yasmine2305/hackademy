/* Éléments communs aux trois pages de mission : onglets, indices, glossaire, objectif. */
import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { useGame } from '../../context/GameContext.jsx';
import { Pane } from './ui.jsx';

const TABS = [
  ['/centre/mission-1', 1, 'journaux'],
  ['/centre/mission-2', 2, 'décodage'],
  ['/centre/mission-3', 3, 'chronologie'],
];

export function MissionTabs({ current }) {
  const { view } = useGame();
  return (
    <nav className="mtabs" aria-label="Missions">
      {TABS.map(([to, n, name]) => {
        const on = current === n;
        const cls = on ? 'on' : view.missions[n].solved ? 'done' : undefined;
        return (
          <NavLink key={n} to={to} className={cls} aria-current={on ? 'page' : undefined}>
            {n}:{name}
            {on ? '*' : ''}
            <small>{view.missions[n].done}/4</small>
          </NavLink>
        );
      })}
    </nav>
  );
}

/** Indices payants : le texte n'arrive du serveur qu'une fois l'indice acheté. */
export function HintPane({ mission }) {
  const { scenario, view, dispatch, busy } = useGame();
  const total = scenario?.hintCounts?.[mission] ?? 3;
  const used = view.hints[mission] || {};
  return (
    <Pane title="indices">
      <div>
        {Array.from({ length: total }, (_, i) => {
          const text = used[i];
          return (
            <div className="hint" key={i}>
              <button
                type="button"
                aria-expanded={!!text}
                disabled={busy && !text}
                onClick={() => !text && dispatch({ type: 'useHint', mission, index: i })}
              >
                Indice {i + 1}
                <span>{text ? 'utilisé' : '−5 pts'}</span>
              </button>
              {text && <p>{text}</p>}
            </div>
          );
        })}
      </div>
    </Pane>
  );
}

export function GlossPane({ terms }) {
  const { scenario } = useGame();
  const g = scenario?.glossary || {};
  return (
    <Pane title="man glossaire">
      <dl className="gloss">
        {terms.map((k) => (
          <Fragment key={k}>
            <dt>{k}</dt>
            <dd>{g[k]}</dd>
          </Fragment>
        ))}
      </dl>
    </Pane>
  );
}

export function Objective({ n, children }) {
  const { view } = useGame();
  return (
    <Pane title="objectif" right={`${view.missions[n].done}/4 octets`}>
      <p>{children}</p>
    </Pane>
  );
}
