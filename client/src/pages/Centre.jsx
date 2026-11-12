import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useClock } from '../hooks/hooks.js';
import { hhmm } from '../utils/format.js';
import Scene from '../components/three/Scene.jsx';
import Hexdump from '../components/ui/Hexdump.jsx';
import { PageHead, Pane } from '../components/ui/ui.jsx';

const MISSIONS = [
  [1, '/centre/mission-1', 'Analyser les journaux', 'less + grep'],
  [2, '/centre/mission-2', 'Décoder le message', 'CyberChef'],
  [3, '/centre/mission-3', 'Reconstituer l’attaque', 'MITRE ATT&CK'],
];

export default function Centre() {
  const { scenario, state, view } = useGame();
  const clock = useClock(state.startedAt, state.finishedAt);
  const missing = 12 - view.count;
  const log = state.log.length ? state.log : [{ at: null, kind: 'système', text: 'en attente : acceptez la mission dans le briefing' }];

  return (
    <main id="main">
      <div className="wrap">
        <PageHead title="Centre d’opérations" crumb="centre" tlp="amber" lead="Le paquet 0x7F3A est votre tableau de preuves. Résolvez les missions pour le réassembler." />
        <div className="kpi">
          <div>score provisoire<b>{view.score}<small>/100</small></b></div>
          <div>octets restaurés<b>{view.count}<small>/12</small></b></div>
          <div>indices utilisés<b>{view.hintsUsed}<small>/9</small></b></div>
          <div>temps écoulé<b>{clock}</b></div>
        </div>
        <div className="grid g-main">
          <div className="stack">
            <Pane title="evidence_board · paquet 0x7F3A" right="en-tête IPv4 + TCP · 12 octets de données" className="hot">
              <Scene type="lattice" className="board3d" tip="glisser pour tourner" label="Le paquet en volume : les octets prouvés rentrent en vert"
                opts={{ header: scenario.header, found: view.found }} />
              <div style={{ overflowX: 'auto' }}><Hexdump header={scenario.header} found={view.found} big /></div>
              <ul className="ev">
                {view.found.map((f, i) => (
                  <li key={i} className={f ? 'f' : 'm'}>
                    <span className="id">{f ? f.hex : '??'}</span>
                    <span>
                      {f ? <>{f.t}<small>{f.s}</small></>
                        : <>Preuve {String(i + 1).padStart(2, '0')}<small>mission {scenario.proofMissions[i]} à résoudre</small></>}
                    </span>
                  </li>
                ))}
              </ul>
            </Pane>
          </div>
          <div className="stack">
            <Pane title="missions">
              <div className="ml">
                {MISSIONS.map(([n, to, title, tool]) => {
                  const m = view.missions[n];
                  const st = m.solved ? ['ok', 'RÉSOLUE'] : m.done ? ['run', 'EN COURS'] : ['todo', 'À FAIRE'];
                  return (
                    <Link key={n} to={to}>
                      <span className="num">0{n}</span>
                      <span><h3>{title}</h3><small>{tool} · {m.done}/4 octets</small></span>
                      <span className={`st ${st[0]}`}>{st[1]}</span>
                    </Link>
                  );
                })}
              </div>
            </Pane>
            <Pane title="topologie">
              <Scene type="network" className="net3d" tip="glisser pour tourner" label="Topologie : attaquant, pare-feu, serveur, destination" />
            </Pane>
            <Pane title="tail -f activite.log">
              <div className="tail" aria-live="polite">
                {log.slice(-8).map((l, i) => <div key={i}>{hhmm(l.at)} <b>{l.kind}</b> {l.text}</div>)}
              </div>
            </Pane>
          </div>
        </div>
        <div className="actions">
          <Link className="btn" to="/briefing">Relire le briefing</Link>
          {view.complete
            ? <Link className="btn go" to="/rapport">Générer le rapport <kbd>↵</kbd></Link>
            : <button type="button" className="btn" disabled>Rapport : {missing} octet{missing > 1 ? 's' : ''} manquant{missing > 1 ? 's' : ''}</button>}
        </div>
      </div>
    </main>
  );
}
