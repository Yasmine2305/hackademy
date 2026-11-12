import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useTilt } from '../hooks/hooks.js';
import Scene from '../components/three/Scene.jsx';
import Hexdump from '../components/ui/Hexdump.jsx';
import { Pane, Tlp } from '../components/ui/ui.jsx';

const DST = '198.51.100.23';
const CAPTURE = [
  ['4410', '02.131', '10.0.3.3', DST, 'TCP', '52188 → 443 [ACK] Seq=1461 Len=1460', ''],
  ['4411', '02.149', '10.0.3.3', DST, 'TCP', '52188 → 443 [ACK] Seq=2921 Len=1460', ''],
  ['????', '??????', '10.0.3.3', DST, 'TCP', 'id=0x7f3a Seq=4381 Len=12, jamais capturé', 'gap'],
  ['4412', '03.204', '10.0.3.3', DST, 'TCP', '[TCP Previous segment not captured] Seq=4393', 'bad'],
  ['4413', '03.206', DST, '10.0.3.3', 'TCP', '[TCP Dup ACK 4411#1] 443 → 52188 Ack=4381', 'bad'],
];
const NONE = new Array(12).fill(null);

function MissionCard({ to, code, perm, scene, title, text, tool, level }) {
  const ref = useTilt();
  return (
    <Link ref={ref} className="pane mis tilt" to={to}>
      <i className="led" /><i className="hl" />
      <div className="t">{code}</div>
      <div className="r">{level}</div>
      {scene}
      <div className="perm">{perm}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="tool">{tool}</div>
      <span className="btn sm">Ouvrir le dossier</span>
    </Link>
  );
}

function Step({ n, title, children }) {
  return (
    <Pane title={n} className="step">
      <h3>{title}</h3>
      <p>{children}</p>
    </Pane>
  );
}

export default function Accueil() {
  const { scenario } = useGame();
  return (
    <main id="main">
      <div className="hero3d">
        <h1 className="sr">The Missing Packet</h1>
        <Scene type="hero" label="Titre en voxels : The Missing Packet, et un train de paquets avec un trou" />
        <div className="fade" />
        <div className="prompt">
          <div className="wrap">
            <span>$ ./open_case --id 0417<span className="caret" /></span>
            <span><Tlp level="clear" /></span>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="herob">
          <div className="hero-copy">
            <p className="sub">
              Cette nuit, un paquet réseau a disparu chez Defensys. Il manque 12 octets. Chaque preuve que vous trouvez en
              restaure un. Quand le paquet est complet, il dit qui a fait quoi.
            </p>
            <div className="row">
              <Link className="btn go" to="/briefing">Lancer l’enquête <kbd>↵</kbd></Link>
              <Link className="btn" to="/a-propos">C’est quoi Hackademy ?</Link>
            </div>
            <div className="stats">
              <span><b>03</b>missions</span>
              <span><b>12</b>octets à retrouver</span>
              <span><b>45</b>minutes environ</span>
              <span><b>00</b>prérequis</span>
            </div>
          </div>
          <Pane title="capture_defensys.pcap" right="filtre : ip.id == 0x7f3a" className="flush">
            <div className="cap">
              <table>
                <thead><tr><th>No.</th><th>Temps</th><th>Source</th><th>Destination</th><th>Proto</th><th>Info</th></tr></thead>
                <tbody>
                  {CAPTURE.map((r) => (
                    <tr key={r[0] + r[5]} className={r[6]}>{r.slice(0, 6).map((c, i) => <td key={i}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '14px 10px', borderTop: '1px solid var(--line)', marginTop: 6, overflow: 'hidden' }}>
              <Hexdump header={scenario.header} found={NONE} tight flicker />
            </div>
          </Pane>
        </div>

        <section>
          <div className="sec-h"><div className="crumb"># parcours</div><h2>Trois étapes, aucune leçon magistrale</h2></div>
          <div className="pipe">$ briefing <i>|</i> enquete --missions=3 <i>|</i> verdict --tlp=red</div>
          <div className="grid g-3">
            <Step n="step_01" title="Lire le briefing">
              Le RSSI de Defensys vous confie le dossier dans un message signé. Vous savez ce qui manque et ce qu’on attend de vous.
            </Step>
            <Step n="step_02" title="Enquêter sur trois fronts">
              Journaux, message intercepté, chronologie. Chaque preuve restaure un octet du paquet, visible en permanence en haut de l’écran.
            </Step>
            <Step n="step_03" title="Rendre le rapport">
              Le paquet complet révèle le verdict. Vous repartez avec un rapport d’incident, un score et une progression sauvegardée.
            </Step>
          </div>
        </section>

        <section>
          <div className="sec-h"><div className="crumb"># ls -l ./missions</div><h2>Trois missions, un vrai outil par mission</h2></div>
          <div className="grid g-3">
            <MissionCard
              to="/centre/mission-1" code="M01" level="Facile" perm="drwxr-x--- M01 journaux/ 4 octets"
              scene={<Scene type="bars" opts={{ data: scenario.logs, tags: [], mini: true }} />}
              title="Analyser les journaux" text="Parcourez auth.log comme avec less et marquez les lignes qui racontent l’intrusion."
              tool="outil réel : less + grep"
            />
            <MissionCard
              to="/centre/mission-2" code="M02" level="Moyen" perm="drwxr-x--- M02 decodage/ 4 octets"
              scene={<Scene type="layers" opts={{ n: 1, mini: true }} />}
              title="Décoder le message" text="Empilez les bonnes opérations pour lire ce que l’attaquant s’écrivait à lui-même."
              tool="outil réel : CyberChef"
            />
            <MissionCard
              to="/centre/mission-3" code="M03" level="Moyen" perm="drwxr-x--- M03 chronologie/ 4 octets"
              scene={<Scene type="chain" opts={{ chain: [null, null, null, null, null], mini: true }} />}
              title="Reconstituer l’attaque" text="Remettez les techniques dans l’ordre et situez chacune dans la chaîne d’attaque."
              tool="outil réel : MITRE ATT&CK"
            />
          </div>
        </section>

        <section>
          <div className="sec-h">
            <div className="crumb"># man tlp</div>
            <h2>Ici, la couleur dit ce qu’on sait</h2>
            <p className="lead">Nous utilisons le Traffic Light Protocol, le code que les analystes s’échangent vraiment. Vous l’aurez appris sans vous en rendre compte.</p>
          </div>
          <div className="tlpgrid">
            <div><Tlp level="clear" /><p>Information publique. Ce qui se lit sans précaution.</p></div>
            <div><Tlp level="green" /><p>Vérifié. Une preuve acquise, une action qui fait avancer.</p></div>
            <div><Tlp level="amber" /><p>Hypothèse. Un indice, un octet manquant, ce qu’il reste à prouver.</p></div>
            <div><Tlp level="red" /><p>Hostile. Une trace de l’attaquant ou un résultat confidentiel.</p></div>
          </div>
        </section>

        <div className="cta">
          <div>
            <div className="h2">Le dossier #0417 est ouvert.</div>
            <p>Sans compte, votre partie reste sur cet appareil. Avec un compte, elle vous suit partout.</p>
          </div>
          <div className="row">
            <Link className="btn go" to="/briefing">Lancer l’enquête <kbd>↵</kbd></Link>
            <Link className="btn" to="/acces">Créer un compte</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
