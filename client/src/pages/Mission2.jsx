import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { OPS, runRecipe } from '../utils/decoders.js';
import Scene from '../components/three/Scene.jsx';
import { MissionDone, PageHead, Pane } from '../components/ui/ui.jsx';
import { GlossPane, HintPane, MissionTabs, Objective } from '../components/ui/MissionKit.jsx';

/** Les deux informations cliquables du texte clair. */
const ENTITIES = [
  ['198.51.100.23', 'ip'],
  ['23h47', 'hr'],
];

/** Découpe le texte clair et rend l'IP et l'heure cliquables. */
function ClearText({ text, marked, onMark }) {
  const parts = [];
  let rest = text;
  while (rest) {
    const next = ENTITIES.map(([s, k]) => [rest.indexOf(s), s, k])
      .filter(([i]) => i >= 0)
      .sort((a, b) => a[0] - b[0])[0];
    if (!next) {
      parts.push(rest);
      break;
    }
    const [i, s, k] = next;
    if (i > 0) parts.push(rest.slice(0, i));
    parts.push(
      <button
        key={k}
        type="button"
        className={`ent${marked.includes(k) ? ' ok' : ''}`}
        onClick={() => onMark(k)}
        aria-pressed={marked.includes(k)}
      >
        {s}
      </button>,
    );
    rest = rest.slice(i + s.length);
  }
  return parts;
}

/** Mission 2 : atelier façon CyberChef. La recette est décodée dans le navigateur, validée par le serveur. */
export default function Mission2() {
  const { scenario, state, view, dispatch } = useGame();
  const rec = state.rec;
  const result = useMemo(() => runRecipe(scenario.message, rec), [scenario.message, rec]);
  const setRecipe = (ops) => dispatch({ type: 'setRecipe', ops });
  const layers = (view.found[4] ? 1 : 0) + (view.found[5] ? 1 : 0);

  let out;
  if (result.error) out = <span className="c-r">{result.error}</span>;
  else if (view.recipeClear)
    out = (
      <ClearText text={result.text} marked={state.ents} onMark={(entity) => dispatch({ type: 'markEntity', entity })} />
    );
  else out = result.text;

  return (
    <main id="main">
      <div className="wrap">
        <PageHead title="Décoder le message" crumb="centre/mission_2" tlp="amber" />
        <MissionTabs current={2} />
        <MissionDone n={2} solved={view.missions[2].solved} to="/centre/mission-3" label="Mission suivante" />
        <div className="grid g-main">
          <div className="stack">
            <Pane title="couches du message" right="chaque opération retire une couche" className="flush">
              <Scene
                type="layers"
                className="m3d"
                opts={{ n: layers }}
                label="Les couches d’encodage du message, retirées une à une"
              />
            </Pane>
            <div className="chef">
              <Pane title="opérations">
                <div className="ops">
                  {scenario.operations.map((k) => (
                    <button key={k} type="button" disabled={rec.length >= 8} onClick={() => setRecipe([...rec, k])}>
                      {OPS[k].name}
                      <i>+</i>
                    </button>
                  ))}
                </div>
              </Pane>
              <Pane title="recette" right={`${rec.length} étape${rec.length > 1 ? 's' : ''}`}>
                <div className="rec">
                  {rec.map((k, i) => (
                    <div className="stepc" key={`${k}-${i}`}>
                      <span>
                        {OPS[k].name}
                        <small>étape {i + 1}</small>
                      </span>
                      <button
                        type="button"
                        aria-label={`Retirer ${OPS[k].name}`}
                        onClick={() => setRecipe(rec.filter((_, j) => j !== i))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="ghost">
                    {rec.length ? 'ajoutez une opération si besoin' : 'ajoutez une première opération'}
                  </div>
                </div>
              </Pane>
              <div className="stack iocol">
                <Pane title="entrée" right="interception fw-01">
                  <div className="io">{scenario.message}</div>
                  <div className="meter">
                    <span>{scenario.message.length} caractères</span>
                    <span>· se termine par =</span>
                  </div>
                </Pane>
                <Pane
                  title="sortie"
                  right={view.recipeClear ? 'texte clair' : 'à décoder'}
                  className={view.recipeClear ? 'hot' : ''}
                >
                  <div className="io out" aria-live="polite">
                    {out}
                  </div>
                  {view.recipeClear && !view.missions[2].solved && (
                    <div className="meter c-a">Cliquez sur les deux informations qui comptent pour l’enquête.</div>
                  )}
                </Pane>
              </div>
            </div>
          </div>
          <div className="stack side">
            <Objective n={2}>
              Retirez les couches d’encodage, puis repérez dans le texte clair où partent les données et à quelle heure.
            </Objective>
            <HintPane mission="m2" />
            <GlossPane terms={['Base64', 'ROT13']} />
          </div>
        </div>
        <div className="actions">
          <Link className="btn" to="/centre/mission-1">
            Mission précédente
          </Link>
          <Link className={`btn${view.missions[2].solved ? ' go' : ''}`} to="/centre/mission-3">
            Mission suivante
          </Link>
        </div>
      </div>
    </main>
  );
}
