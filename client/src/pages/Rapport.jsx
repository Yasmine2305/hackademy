import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useClock } from '../hooks/hooks.js';
import Scene from '../components/three/Scene.jsx';
import Hexdump from '../components/ui/Hexdump.jsx';
import { PageHead, Pane, Tlp } from '../components/ui/ui.jsx';

export default function Rapport() {
  const { scenario, state, view, dispatch } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();
  const clock = useClock(state.startedAt, state.finishedAt);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!view.complete) {
    const missing = 12 - view.count;
    return (
      <main id="main">
        <div className="wrap">
          <PageHead
            title="Rapport d’incident"
            crumb="rapport"
            tlp="red"
            lead="Le rapport se débloque quand le paquet est complet."
          />
          <Pane title="paquet 0x7F3A">
            <div style={{ overflowX: 'auto' }}>
              <Hexdump header={scenario.header} found={view.found} big />
            </div>
            <p style={{ marginTop: 20 }}>
              Il manque encore {missing} octet{missing > 1 ? 's' : ''}. Vos preuves sont sauvegardées : reprenez où vous
              en étiez.
            </p>
            <div className="row" style={{ marginTop: 16 }}>
              <Link className="btn go" to="/centre">
                Retour au centre <kbd>↵</kbd>
              </Link>
            </div>
          </Pane>
        </div>
      </main>
    );
  }

  const r = view.report;
  async function replay() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await dispatch({ type: 'reset' });
    navigate('/briefing');
  }

  return (
    <main id="main">
      <div className="wrap">
        <PageHead
          title="Rapport d’incident #0417"
          crumb="rapport"
          tlp="red"
          lead="Le paquet est complet. Voici ce qu’il disait, et ce que vous en concluez."
        />
        <div className="grid g-rep">
          <article className="paper">
            <div className="tlpb">
              <Tlp level="red" />
            </div>
            <div className="m" style={{ fontSize: 12, color: 'var(--ink2)' }}>
              DEFENSYS · CENTRE D’OPÉRATIONS DE SÉCURITÉ
            </div>
            <h1>{r.title}</h1>
            <div className="meta">
              <div>
                référence<b>#0417</b>
              </div>
              <div>
                analyste<b>{user?.username || 'invité'}</b>
              </div>
              <div>
                machine<b>srv-03</b>
              </div>
              <div>
                gravité<b style={{ color: 'var(--ink-red)' }}>CRITIQUE</b>
              </div>
            </div>
            <div className="reveal">
              <Scene type="word" opts={{ word: r.word }} label={`Les 12 octets du paquet forment le mot ${r.word}`} />
              <div className="rt">
                <div className="big">{r.word}</div>
                <small>
                  12 octets du paquet 0x7F3A, en ASCII : le compte de sauvegarde a servi à exfiltrer les données.
                </small>
              </div>
            </div>
            <h3>Verdict</h3>
            <p>{r.verdict}</p>
            <h3>Correction par mission</h3>
            <table className="ptab">
              <thead>
                <tr>
                  <th>Mission</th>
                  <th>Résultat</th>
                  <th>Remarque</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1 · Journaux</td>
                  <td className="ok">4/4</td>
                  <td>{r.remarks.m1}</td>
                </tr>
                <tr>
                  <td>2 · Décodage</td>
                  <td className="ok">4/4</td>
                  <td>{r.remarks.m2}</td>
                </tr>
                <tr>
                  <td>3 · Chronologie</td>
                  <td className="ok">4/4</td>
                  <td>{r.remarks.m3}</td>
                </tr>
              </tbody>
            </table>
            <h3>Chronologie</h3>
            <table className="ptab">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>ATT&amp;CK</th>
                  <th>Événement</th>
                </tr>
              </thead>
              <tbody>
                {r.timeline.map((t) => (
                  <tr key={t[1]}>
                    <td>{t[0]}</td>
                    <td>{t[1]}</td>
                    <td>{t[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Indicateurs de compromission</h3>
            <table className="ptab">
              <tbody>
                {r.iocs.map((t) => (
                  <tr key={t[0]}>
                    <td>{t[0]}</td>
                    <td>{t[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Recommandations</h3>
            <ul className="reco">
              {r.recommendations.map((t, i) => (
                <li key={i}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  {t}
                </li>
              ))}
            </ul>
            <div className="sig">
              Analyste : {user?.username || 'invité'} · terminé le {new Date(state.finishedAt).toLocaleString('fr-FR')}
            </div>
            <div className="tlpb" style={{ paddingBottom: 0, marginBottom: -24 }}>
              <Tlp level="red" />
            </div>
          </article>
          <div className="stack">
            <Pane title="score final">
              <div className="score">
                {view.score}
                <small>/100</small>
              </div>
              <div className="kv" style={{ marginTop: 16 }}>
                <div>
                  <span>octets</span>
                  <b>+100</b>
                </div>
                <div>
                  <span>indices ({view.hintsUsed})</span>
                  <b className="c-a">−{view.hintsUsed * 5}</b>
                </div>
                <div>
                  <span>erreurs ({view.errors})</span>
                  <b className="c-a">−{view.errors * 4}</b>
                </div>
                <div>
                  <span>temps</span>
                  <b>{clock}</b>
                </div>
                <div>
                  <span>rang</span>
                  <b className="c-g">{view.rank.toUpperCase()}</b>
                </div>
              </div>
            </Pane>
            <Pane title="actions">
              <div className="stack" style={{ gap: 8 }}>
                <button type="button" className="btn go" style={{ width: '100%' }} onClick={() => window.print()}>
                  Exporter en PDF
                </button>
                <Link className="btn" style={{ width: '100%' }} to="/progression">
                  Voir ma progression
                </Link>
                <button
                  type="button"
                  className={`btn${confirmReset ? ' danger' : ''}`}
                  style={{ width: '100%' }}
                  onClick={replay}
                  onBlur={() => setConfirmReset(false)}
                >
                  {confirmReset ? 'Confirmer : tout effacer et rejouer' : 'Rejouer l’enquête'}
                </button>
                {!user && (
                  <p className="m c-m" style={{ fontSize: 12 }}>
                    Sans compte, ce rapport reste dans ce navigateur. <Link to="/acces">Créer un compte</Link> pour le
                    garder.
                  </p>
                )}
              </div>
            </Pane>
          </div>
        </div>
      </div>
    </main>
  );
}
