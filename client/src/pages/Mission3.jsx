import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import Scene from '../components/three/Scene.jsx';
import { MissionDone, PageHead, Pane } from '../components/ui/ui.jsx';
import { GlossPane, HintPane, MissionTabs, Objective } from '../components/ui/MissionKit.jsx';

/** Mission 3 : glisser-déposer (ou cliquer) les techniques ATT&CK dans la chaîne d'attaque. */
export default function Mission3() {
  const { scenario, state, view, dispatch, busy } = useGame();
  const [pick, setPick] = useState(null);
  const [over, setOver] = useState(null);
  const chain = state.chain;
  const used = chain.filter(Boolean);
  const pool = scenario.cardPool.filter((k) => !used.includes(k));
  const all = used.length === 5;

  const place = (card, slot) => { setPick(null); setOver(null); dispatch({ type: 'placeCard', card, slot }); };

  function onCardClick(e, k, inSlot) {
    e.stopPropagation();
    if (inSlot !== undefined && pick && pick !== k) place(pick, inSlot); // échange
    else if (inSlot !== undefined && !pick) place(k, null); // renvoie la carte dans la réserve
    else setPick(pick === k ? null : k);
  }

  const dropProps = (target) => ({
    onDragOver: (e) => { e.preventDefault(); setOver(target); },
    onDragLeave: () => setOver(null),
    onDrop: (e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain'); if (k) place(k, target === 'pool' ? null : target); },
  });

  const renderCard = (k, slot) => {
    const c = scenario.cards[k];
    return (
      <button key={k} type="button" className={`card${pick === k ? ' pick' : ''}`} draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', k)}
        onClick={(e) => onCardClick(e, k, slot)}
        aria-label={`${c.id} ${c.n}${slot !== undefined ? `, placée à l’étape ${slot + 1}` : ''}`}>
        <b>{c.id} · {c.n}</b>{c.d}<small>{c.r}</small>
      </button>
    );
  };

  return (
    <main id="main">
      <div className="wrap">
        <PageHead title="Reconstituer l’attaque" crumb="centre/mission_3" tlp="amber" />
        <MissionTabs current={3} />
        <MissionDone n={3} solved={view.missions[3].solved} to="/rapport" label="Générer le rapport" />
        <div className="grid g-main">
          <div className="stack">
            <Pane title="kill chain · nuit du 12 mars">
              <Scene type="chain" className="m3d" opts={{ chain, cards: scenario.cards }} label="La chaîne d’attaque, porte après porte" />
              <div className="chain">
                {chain.map((k, i) => {
                  const wrong = view.chainWrong.includes(i);
                  return (
                    <div key={i} className={`slot${k ? ' full' : ''}${over === i ? ' over' : ''}`} style={wrong ? { borderColor: 'var(--red)' } : undefined}
                      onClick={() => pick && place(pick, i)} {...dropProps(i)}>
                      <span className="pos">étape {i + 1}{wrong ? ' · à revoir' : ''}</span>
                      {k ? renderCard(k, i) : (
                        <button type="button" className="empty" onClick={(e) => { e.stopPropagation(); if (pick) place(pick, i); }}
                          aria-label={`Déposer à l’étape ${i + 1}`}>
                          {pick ? 'cliquez pour déposer' : 'déposez ici'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Pane>
            <Pane title="techniques observées" right={`${pool.length} à placer`}>
              <div className={`pool${over === 'pool' ? ' over' : ''}`} {...dropProps('pool')}>
                {pool.length ? pool.map((k) => renderCard(k))
                  : <span className="c-m m" style={{ fontSize: 13 }}>Toutes les techniques sont placées.</span>}
              </div>
            </Pane>
          </div>
          <div className="stack side">
            <Objective n={3}>Glissez chaque technique à sa place, ou cliquez sur une carte puis sur une étape. Vérifiez quand les cinq sont posées.</Objective>
            <HintPane mission="m3" />
            <GlossPane terms={['MITRE ATT&CK', 'Kill chain']} />
          </div>
        </div>
        <div className="actions">
          <Link className="btn" to="/centre/mission-2">Mission précédente</Link>
          <div className="row">
            <button type="button" className={`btn${all && !view.missions[3].solved ? ' go' : ''}`} disabled={!all || busy || state.checked}
              onClick={() => dispatch({ type: 'checkChain' })}>
              Vérifier l’ordre
            </button>
            <Link className={`btn${view.complete ? ' go' : ''}`} to="/rapport">Générer le rapport</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
