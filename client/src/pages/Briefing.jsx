import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import Scene from '../components/three/Scene.jsx';
import { PageHead, Pane } from '../components/ui/ui.jsx';

/** Sous-titres du message vidéo (visage flouté) : [seconde, texte]. */
const CAPTIONS = [
  [0, 'Bonjour. Ici le RSSI de Defensys.'],
  [6, 'Hier soir, à 23h47, srv-03 a coupé un transfert sortant.'],
  [14, 'Le paquet 0x7F3A n’a jamais été capturé. Douze octets manquent.'],
  [24, 'Chaque preuve solide vous en rend un.'],
  [32, 'Journaux, message intercepté, chronologie : dans cet ordre.'],
  [41, 'Je veux votre rapport avant la réunion de crise.'],
];
const LENGTH = 48;

/** Mosaïque floutée en pixels, générée en SVG. */
function Mosaic() {
  const cells = [];
  const w = 48; const h = 20; const cx = 24;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x - cx);
      const head = d * d / 20 + (y - 6) * (y - 6) / 18 < 1;
      const sh = y > 12 && d < (y - 8) * 1.8;
      const n = ((x * 7 + y * 13) % 11) / 11;
      const v = head ? 0.34 + n * 0.12 : sh ? 0.22 + n * 0.08 : 0.05 + n * 0.05;
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#E6EAE3" opacity={v.toFixed(2)} />);
    }
  }
  return <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">{cells}</svg>;
}

function Video() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setT((v) => {
      if (v + 1 >= LENGTH) { setPlaying(false); return LENGTH; }
      return v + 1;
    }), 1000);
    return () => clearInterval(id);
  }, [playing]);
  const caption = [...CAPTIONS].reverse().find(([s]) => s <= t)?.[1];
  const fmt = (s) => `00:${String(s).padStart(2, '0')}`;
  const toggle = () => { if (t >= LENGTH) setT(0); setPlaying((p) => !p); };

  return (
    <>
      <div className="vid">
        <Mosaic />
        <button type="button" className="play" onClick={toggle} aria-label={playing ? 'Mettre en pause' : 'Lire le message vidéo du RSSI'}>
          {playing ? '❚❚' : '▶'} {fmt(playing || t ? t : LENGTH)}
        </button>
        {(playing || t > 0) && caption && <p className="subt" aria-live="polite">{caption}</p>}
      </div>
      <div className="vbar">
        <span>{fmt(t)}</span>
        <i style={{ backgroundSize: `${(t / LENGTH) * 100}% 100%` }} />
        <span>{fmt(LENGTH)}</span>
      </div>
    </>
  );
}

export default function Briefing() {
  const { dispatch, state, busy } = useGame();
  const navigate = useNavigate();
  const started = Boolean(state?.startedAt);

  async function accept() {
    if (!started) await dispatch({ type: 'start' });
    navigate('/centre');
  }

  return (
    <main id="main">
      <div className="wrap">
        <PageHead title="Briefing de mission" crumb="briefing" tlp="green" lead="Lisez le dossier avant d’ouvrir le centre d’opérations." />
        <div className="grid g-main">
          <div className="stack">
            <Pane title="mutt · message 1/1">
              <div className="pgp">
                <div className="arm">-----BEGIN PGP SIGNED MESSAGE-----</div>
                <div className="hdr">
                  <div><b>De :</b><span>rssi@defensys.example</span></div>
                  <div><b>À :</b><span>analyste-soc@defensys.example</span></div>
                  <div><b>Date :</b><span>Ven 13 mars 2026, 06:58 UTC+1</span></div>
                  <div><b>Objet :</b><span className="c-w">Incident #0417, on a perdu un paquet</span></div>
                </div>
                <div className="body">
                  <p>Bonjour. Vous prenez le dossier #0417 ce matin.</p>
                  <p>Hier soir à 23h47, un transfert sortant de srv-03, notre serveur de sauvegardes, s’est coupé net. Le paquet d’identifiant 0x7F3A n’a jamais été capturé. Il contenait 12 octets, et l’attaquant comptait sans doute là-dessus.</p>
                  <p>Retrouvez ce qui s’est passé dans l’ordre : qui est entré, ce qui est sorti, où ça allait. Chaque preuve solide vous redonne un octet. Je veux un rapport signé avant la réunion de crise.</p>
                  <p>Vous débutez : tant mieux, chaque terme technique est expliqué à côté de vous dans le dossier.</p>
                </div>
                <div className="arm">-----BEGIN PGP SIGNATURE-----</div>
                <div className="arm" style={{ overflowWrap: 'anywhere' }}>iQEzBAEBCAAdFiEE7f3Aq0417dEfEnSyS0cKeTLPx7kFAmXw9sA…</div>
                <div className="arm">-----END PGP SIGNATURE-----</div>
                <div className="good">gpg: Good signature from "RSSI Defensys"</div>
              </div>
            </Pane>
            <Pane title="objectifs de l’enquête">
              <ul className="chk">
                <li><b className="q">[ ]</b>Repérer l’intrusion dans les journaux de srv-03</li>
                <li><b className="q">[ ]</b>Lire le message que l’attaquant a laissé passer</li>
                <li><b className="q">[ ]</b>Reconstituer l’enchaînement de l’attaque</li>
                <li><b className="q">[ ]</b>Signer un rapport d’incident avec un verdict</li>
              </ul>
            </Pane>
          </div>
          <div className="stack">
            <Pane title="origine et destination">
              <Scene type="globe" opts={{ z: 44 }} style={{ height: 280 }} tip="glisser pour tourner" label="Globe : d’où vient l’attaque, où partent les données" />
            </Pane>
            <Pane title="message_rssi.mp4" right="visage flouté">
              <Video />
            </Pane>
            <Pane title="fiche incident">
              <div className="kv">
                <div><span>référence</span><b>#0417</b></div>
                <div><span>client</span><b>Defensys</b></div>
                <div><span>date</span><b>12 mars 2026, 23:47</b></div>
                <div><span>machine</span><b>srv-03 (sauvegardes)</b></div>
                <div><span>gravité</span><b className="c-r">CRITIQUE</b></div>
                <div><span>statut</span><b className="c-a">{started ? 'EN COURS' : 'NON ASSIGNÉ'}</b></div>
              </div>
            </Pane>
          </div>
        </div>
        <div className="actions">
          <Link className="btn" to="/">Retour à l’accueil</Link>
          <button type="button" className="btn go" onClick={accept} disabled={busy}>
            {started ? 'Reprendre la mission' : 'Accepter la mission'} <kbd>↵</kbd>
          </button>
        </div>
      </div>
    </main>
  );
}
