import { ICONS } from '../utils/pixels.js';
import Scene from '../components/three/Scene.jsx';
import { Cells, Logo, PageHead, Pane, PixelIcon, Tlp } from '../components/ui/ui.jsx';

const DEMO = Array.from({ length: 12 }, (_, i) => (i < 3 ? { hex: ['45', '58', '46'][i] } : null));

function Swatch({ bg, fg, lab, name, hex, role, border }) {
  return (
    <div className="ch-col">
      <div className="ch-sw" style={{ background: bg, color: fg, border: border ? '1px solid var(--line2)' : undefined }}>{lab}</div>
      <h3>{name}</h3>
      <p>{hex}<br />{role}</p>
    </div>
  );
}

const TOOLS = [
  ['Accueil', 'Wireshark', 'Titre en voxels, train de paquets avec un trou.'],
  ['Accès analyste', 'ssh', 'Globe : la connexion qui traverse le réseau.'],
  ['Briefing', 'mutt + PGP', 'Globe : d’où vient l’attaque, où partent les données.'],
  ['Centre d’opérations', 'hexdump + tmux', 'Le paquet en volume, qui se complète, et la topologie.'],
  ['Mission 1', 'less + grep', 'Histogramme des événements, s’allume à chaque preuve.'],
  ['Mission 2', 'CyberChef', 'Couches du message, retirées une à une.'],
  ['Mission 3', 'MITRE ATT&CK', 'Chaîne d’attaque à franchir porte après porte.'],
  ['Rapport', 'rapport d’incident TLP', 'Le mot final inscrit sur les 12 octets.'],
  ['Progression', 'id + git log', 'Avatar d’analyste en voxels.'],
  ['À propos', 'man', 'Logotype en voxels, avatars de l’équipe.'],
];

export default function Charte() {
  return (
    <main id="main">
      <div className="wrap">
        <PageHead title="Charte graphique" crumb="charte" tlp="clear" lead="Système « PCAP 3D » : l’interface se lit comme une capture de paquets, en volume." />
        <div className="grid g-2 ch-sec">
          <Pane title="logotype">
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', borderRadius: 8 }}>
              <Logo style={{ fontSize: 40 }} />
            </div>
            <p style={{ marginTop: 12, fontSize: 15, color: 'var(--muted)' }}>Le A est l’octet manquant. Écrit en texte brut : HACK\x41DEMY, car 0x41 est le code ASCII de A.</p>
          </Pane>
          <Pane title="motif : la case manquante">
            <div style={{ height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, border: '1px solid var(--line)', borderRadius: 8, padding: '0 16px', overflow: 'hidden' }}>
              <Cells found={DEMO} />
              <div className="m c-m" style={{ fontSize: 12 }}>plein = prouvé · pointillé = à prouver</div>
            </div>
            <p style={{ marginTop: 12, fontSize: 15, color: 'var(--muted)' }}>Un seul motif, partout : le logo, le titre, les preuves, la progression et les états vides.</p>
          </Pane>
        </div>
        <div className="ch-sec">
          <Pane title="couleurs de signal" right="ratios mesurés sur le fond Nuit">
            <div className="ch-5">
              <Swatch bg="var(--green)" fg="#000" lab="15.3:1" name="Vert signal" hex="#3DFFA0" role="vérifié, action qui fait avancer" />
              <Swatch bg="var(--amber)" fg="#000" lab="12.4:1" name="Ambre" hex="#FFC23D" role="hypothèse, indice, manquant" />
              <Swatch bg="var(--red)" fg="#000" lab="6.2:1" name="Rouge" hex="#FF4D5E" role="trace hostile, confidentiel" />
              <Swatch bg="var(--cyan)" fg="#000" lab="9.4:1" name="Cyan" hex="#38BDF8" role="structure, liens, profondeur 3D" />
            </div>
            <div className="ch-4n">
              <Swatch bg="#05080F" fg="#fff" lab="fond" name="Nuit" hex="#05080F" role="fond de page" border />
              <Swatch bg="#0D1623" fg="#fff" lab="verre" name="Verre" hex="#0D1623 · 72 %" role="panneaux, avec flou d’arrière-plan" border />
              <Swatch bg="#E8F1F5" fg="#000" lab="17.5:1" name="Texte" hex="#E8F1F5" role="lecture courante" />
              <Swatch bg="#9AABBA" fg="#000" lab="8.5:1" name="Gris" hex="#9AABBA" role="texte secondaire" />
              <Swatch bg="var(--paper)" fg="#000" lab="16.3:1" name="Papier" hex="#EEF2F4" role="le rapport imprimé" />
            </div>
          </Pane>
        </div>
        <div className="ch-sec">
          <Pane title="typographie">
            <div>
              <div className="ch-ty"><small>Chakra Petch · 38–52 px<br />titres</small><div className="h1">The Missing Packet</div></div>
              <div className="ch-ty"><small>JetBrains Mono · 12–15 px<br />données, boutons, journaux</small><div className="m" style={{ fontSize: 14, color: 'var(--fg)' }}>23:43:12 DENY sshd User admin from 203.0.113.66</div></div>
              <div className="ch-ty"><small>IBM Plex Sans · 15–18 px<br />tout ce qui s’explique</small><div style={{ fontSize: 17 }}>Un encodage n’est pas un chiffrement : n’importe qui peut le lire sans clé.</div></div>
              <div className="ch-ty"><small>Voxels · sur mesure, en 3D<br />titre principal et logo uniquement</small><Scene type="logo" style={{ height: 150 }} label="Logotype en voxels" /></div>
            </div>
          </Pane>
        </div>
        <div className="grid g-2 ch-sec">
          <Pane title="boutons et états">
            <div className="row"><span className="btn go">Action principale <kbd>↵</kbd></span><span className="btn">Secondaire</span><button type="button" className="btn" disabled>Verrouillé</button></div>
            <div className="row" style={{ marginTop: 16 }}><span className="chip on">ALL</span><span className="chip">WARN</span><span className="st ok">RÉSOLUE</span><span className="st run">EN COURS</span><span className="st todo">À FAIRE</span></div>
            <div className="row" style={{ marginTop: 16 }}><Tlp level="clear" /><Tlp level="green" /><Tlp level="amber" /><Tlp level="red" /></div>
          </Pane>
          <Pane title="icônes : pixels 8 × 8, voxels en 3D">
            <div className="badges">
              <div className="bdg"><PixelIcon rows={ICONS.log} />journal</div>
              <div className="bdg"><PixelIcon rows={ICONS.key} />clé</div>
              <div className="bdg"><PixelIcon rows={ICONS.clk} />horloge</div>
              <div className="bdg off"><PixelIcon rows={ICONS.shd} color="var(--dim)" />verrouillé</div>
            </div>
          </Pane>
        </div>
        <div className="ch-sec">
          <Pane title="une page, un vrai outil, une scène 3D">
            <table className="mantab">
              <thead><tr><th>page</th><th>outil imité</th><th>scène 3D</th></tr></thead>
              <tbody>{TOOLS.map((t) => <tr key={t[0]}><td>{t[0]}</td><td>{t[1]}</td><td>{t[2]}</td></tr>)}</tbody>
            </table>
          </Pane>
        </div>
      </div>
    </main>
  );
}
