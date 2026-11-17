import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import Scene from '../components/three/Scene.jsx';
import { MissionDone, PageHead, Pane } from '../components/ui/ui.jsx';
import { GlossPane, HintPane, MissionTabs, Objective } from '../components/ui/MissionKit.jsx';

const LEVELS = ['ALL', 'WARN', 'DENY', 'CRIT', 'INFO'];
const QUESTION = [
  ['23:43', 'l’accès refusé sur le compte admin'],
  ['23:47', 'le transfert sortant interrompu'],
];

/** Mission 1 : lire auth.log comme avec less, filtrer, marquer les 4 lignes de l'intrusion. */
export default function Mission1() {
  const { scenario, state, view, dispatch, busy } = useGame();
  const [level, setLevel] = useState('ALL');
  const [find, setFind] = useState('');
  const list = useRef(null);

  const lines = useMemo(() => {
    const f = find.trim().toLowerCase();
    return scenario.logs.filter(
      (l) => (level === 'ALL' || l[2] === level) && (!f || l.join(' ').toLowerCase().includes(f)),
    );
  }, [scenario.logs, level, find]);

  const tag = (n) => dispatch({ type: 'tagLog', line: n });

  // navigation clavier dans le journal : ↑ ↓ pour se déplacer, m ou Entrée pour marquer
  function onKeyDown(e) {
    const btns = [...list.current.querySelectorAll('.ll')];
    const i = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      btns[Math.min(i + 1, btns.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      btns[Math.max(i - 1, 0)]?.focus();
    } else if (e.key === 'm' && i >= 0) {
      e.preventDefault();
      tag(Number(btns[i].dataset.log));
    }
  }

  // seules les lignes qui ont rapporté un octet allument l'histogramme en vert
  const scoringTags = state.tags.filter((t) => view.marks[t] && view.marks[t] !== '?');

  return (
    <main id="main">
      <div className="wrap">
        <PageHead title="Analyser les journaux" crumb="centre/mission_1" tlp="amber" />
        <MissionTabs current={1} />
        <MissionDone n={1} solved={view.missions[1].solved} to="/centre/mission-2" label="Mission suivante" />
        <div className="grid g-main">
          <div className="stack">
            <Pane title="less /var/log/auth.log" right="srv-03" className="flush">
              <Scene
                type="bars"
                className="m3d"
                opts={{ data: scenario.logs, tags: scoringTags }}
                label="Histogramme des événements du journal"
              />
              <div className="lessbar">
                <label className="find">
                  <b className="c-g">/</b>
                  <input
                    value={find}
                    onChange={(e) => setFind(e.target.value)}
                    placeholder="filtrer : ip, compte, mot-clé"
                    aria-label="Filtrer le journal"
                  />
                </label>
                {LEVELS.map((x) => (
                  <button
                    key={x}
                    type="button"
                    className={`chip${level === x ? ' on' : ''}`}
                    aria-pressed={level === x}
                    onClick={() => setLevel(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
              <div className="log" ref={list} onKeyDown={onKeyDown} role="list" aria-label="Lignes de journal">
                {lines.length ? (
                  lines.map((l) => {
                    const tagged = state.tags.includes(l[0]);
                    return (
                      <button
                        key={l[0]}
                        type="button"
                        role="listitem"
                        data-log={l[0]}
                        className={`ll${tagged ? ' tagged' : ''}`}
                        aria-pressed={tagged}
                        onClick={() => tag(l[0])}
                      >
                        <span className="no">{l[0]}</span>
                        <span className="tm">{l[1]}</span>
                        <span className={`lv ${l[2]}`}>{l[2]}</span>
                        <span className="pr">{l[3]}</span>
                        <span className="ms">{l[4]}</span>
                        <span className="tg">{tagged ? view.marks[l[0]] : ''}</span>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: '16px 20px' }} className="c-m m">
                    Aucune ligne ne correspond.
                  </div>
                )}
              </div>
              <div className="lessfoot">
                <span>
                  lignes {lines.length}/{scenario.logs.length} (FIN)
                </span>
                <span>clic ou m : marquer · ↑↓ : naviguer · / : filtrer</span>
              </div>
            </Pane>
            <Pane title="décision">
              <h3 style={{ fontSize: 15 }}>Deux alertes tombent en même temps. Laquelle examinez-vous d’abord ?</h3>
              <div className="qopts">
                {QUESTION.map(([time, label], i) => {
                  const chosen = view.q1?.choice === i;
                  const cls = chosen ? (view.q1.correct ? ' on' : ' bad') : '';
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`opt${cls}`}
                      aria-pressed={chosen}
                      disabled={busy}
                      onClick={() => dispatch({ type: 'answerQ1', choice: i })}
                    >
                      <b>{time}</b>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
              {view.q1 &&
                (view.q1.correct ? (
                  <div className="fb">
                    <b className="c-g">[ok]</b>
                    <span>
                      Exact. Un refus est une attaque bloquée. Un flux sortant coupé, ce sont peut-être des données déjà
                      parties.
                    </span>
                  </div>
                ) : (
                  <div className="fb">
                    <b className="c-r">[non]</b>
                    <span>
                      Ce refus montre que la défense a tenu. Cherchez plutôt ce qui a réussi et ce qui est sorti.
                    </span>
                  </div>
                ))}
            </Pane>
          </div>
          <div className="stack side">
            <Objective n={1}>
              Marquez les 4 événements qui racontent l’intrusion, de la première tentative jusqu’à la perte du paquet.
            </Objective>
            <HintPane mission="m1" />
            <GlossPane terms={['sshd', 'Failed / Accepted', 'svc', 'id=0x7f3a']} />
          </div>
        </div>
        <div className="actions">
          <Link className="btn" to="/centre">
            Retour au centre
          </Link>
          <Link className={`btn${view.missions[1].solved ? ' go' : ''}`} to="/centre/mission-2">
            Mission suivante
          </Link>
        </div>
      </div>
    </main>
  );
}
