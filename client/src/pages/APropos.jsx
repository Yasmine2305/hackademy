import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { identRows } from '../assets/pixels.js';
import Scene from '../components/three/Scene.jsx';
import { Pane, Tlp } from '../components/ui/ui.jsx';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';

const SECTIONS = [
  ['nom', 'NOM'],
  ['description', 'DESCRIPTION'],
  ['apprendre', 'CE QUE VOUS APPRENEZ'],
  ['auteurs', 'AUTEURS'],
  ['stack', 'STACK'],
  ['contact', 'CONTACT'],
  ['mentions', 'MENTIONS LÉGALES'],
];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Formulaire de contact : validation immédiate, puis envoi à l'API (POST /api/contact). */
function ContactForm() {
  const { notify } = useToast();
  const [f, setF] = useState({ email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent

  const check = (v) => {
    const e = {};
    if (!EMAIL.test(v.email.trim())) e.email = 'Adresse e-mail invalide.';
    if (v.message.trim().length < 10) e.message = '10 caractères minimum.';
    return e;
  };
  const set = (k) => (e) => {
    const next = { ...f, [k]: e.target.value };
    setF(next);
    if (Object.keys(errors).length) setErrors(check(next));
  };

  async function submit(e) {
    e.preventDefault();
    const errs = check(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus('sending');
    try {
      await api.contact(f.email.trim(), f.message.trim());
      setStatus('sent');
      notify('success', 'Message envoyé à l’équipe.');
    } catch (ex) {
      setStatus('idle');
      if (ex.fields) setErrors(ex.fields);
      notify('error', ex.message);
    }
  }

  if (status === 'sent') {
    return (
      <div className="toast" role="status">
        <p>
          <b className="c-g m">[ok]</b> Message reçu. Nous répondons à {f.email} dès que possible.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setF({ email: '', message: '' });
            setStatus('idle');
          }}
        >
          Nouveau message
        </Button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate>
      <Field
        label="votre adresse"
        type="email"
        value={f.email}
        onChange={set('email')}
        placeholder="vous@exemple.tn"
        autoComplete="email"
        required
        error={errors.email}
        style={{ marginTop: 0 }}
      />
      <Field
        label="message"
        multiline
        value={f.message}
        onChange={set('message')}
        maxLength={2000}
        placeholder="Une question, un bug, une idée de mission"
        required
        error={errors.message}
        extra={<small style={{ display: 'inline', marginLeft: 6 }}>{f.message.length}/2000</small>}
      />
      <div className="row" style={{ marginTop: 16 }}>
        <Button variant="go" type="submit" loading={status === 'sending'}>
          {status === 'sending' ? 'Envoi…' : 'Envoyer'} <kbd>↵</kbd>
        </Button>
      </div>
    </form>
  );
}

export default function APropos() {
  return (
    <main id="main">
      <div className="wrap">
        <div className="manw">
          <div className="man">
            <div className="manh">
              <span>HACKADEMY(1)</span>
              <span>Manuel de l’analyste</span>
              <span>HACKADEMY(1)</span>
            </div>
            <div className="spread" style={{ marginTop: 8 }}>
              <h1>man hackademy</h1>
              <Tlp level="clear" />
            </div>
            <Scene type="logo" className="logo3d" label="Logotype Hackademy en voxels" />

            <h2 id="nom">NOM</h2>
            <div className="ind">
              <p>hackademy, l’enquête qui apprend la cybersécurité.</p>
            </div>

            <h2>SYNOPSIS</h2>
            <div className="ind">
              <div className="syn">
                hackademy <i>--role</i> analyste <i>--dossier</i> 0417 <i>[--sans-compte]</i>
              </div>
            </div>

            <h2 id="description">DESCRIPTION</h2>
            <div className="ind">
              <p>
                Hackademy place des étudiants débutants dans la peau d’un analyste SOC. En trois missions, ils lisent
                des journaux, décodent un message et reconstituent une attaque, sans cours magistral ni prérequis.
              </p>
              <p>
                Le scénario « The Missing Packet » est fictif. Defensys n’existe pas, et les adresses IP utilisées sont
                réservées à la documentation (RFC 5737) : rien ici ne pointe vers une vraie machine.
              </p>
            </div>

            <h2 id="apprendre">CE QUE VOUS APPRENEZ</h2>
            <div className="ind">
              <table className="mantab">
                <tbody>
                  <tr>
                    <td>-l, --logs</td>
                    <td>Repérer une intrusion dans un journal d’authentification.</td>
                  </tr>
                  <tr>
                    <td>-d, --decode</td>
                    <td>Distinguer encodage et chiffrement, retirer des couches.</td>
                  </tr>
                  <tr>
                    <td>-t, --timeline</td>
                    <td>Relier des preuves à la matrice MITRE ATT&amp;CK.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="auteurs">AUTEURS</h2>
            <div className="ind">
              <div className="team">
                <div className="tm">
                  <Scene
                    type="voxel"
                    opts={{ rows: identRows('Yasmine Sellami'), color: 'green', small: true }}
                    label="Avatar de Yasmine Sellami"
                  />
                  <div>
                    <b>Yasmine Sellami</b>
                    <span className="role">SUP’COM · conception et développement</span>
                  </div>
                </div>
                <div className="tm">
                  <Scene
                    type="voxel"
                    opts={{ rows: identRows('Ameni Kharrat'), color: 'amber', small: true }}
                    label="Avatar d’Ameni Kharrat"
                  />
                  <div>
                    <b>Ameni Kharrat</b>
                    <span className="role">SUP’COM · conception et développement</span>
                  </div>
                </div>
              </div>
            </div>

            <h2 id="stack">STACK</h2>
            <div className="ind">
              <table className="mantab">
                <thead>
                  <tr>
                    <th>couche</th>
                    <th>choix</th>
                    <th>rôle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>interface</td>
                    <td>React 18 + Vite</td>
                    <td>Composants réutilisables pour les missions et le rail d’octets, routes avec React Router.</td>
                  </tr>
                  <tr>
                    <td>3D</td>
                    <td>Three.js</td>
                    <td>Scènes WebGL : titre en voxels, paquet en volume, globe, topologie.</td>
                  </tr>
                  <tr>
                    <td>serveur</td>
                    <td>Node.js + Express</td>
                    <td>Vérifie les réponses et calcule le score côté serveur, sans les exposer.</td>
                  </tr>
                  <tr>
                    <td>données</td>
                    <td>SQLite</td>
                    <td>Comptes (bcrypt), progression, points de restauration et rapports.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="contact">CONTACT</h2>
            <div className="ind">
              <ContactForm />
            </div>

            <h2 id="mentions">MENTIONS LÉGALES</h2>
            <div className="ind">
              <p>
                Projet universitaire SUP’COM, 2026. Le site ne conserve que le compte et la progression, et les supprime
                sur simple demande (page Progression, « Supprimer mon compte »). Aucune technique présentée ne doit être
                utilisée sur un système sans autorisation.
              </p>
            </div>

            <h2>VOIR AUSSI</h2>
            <div className="ind">
              <div className="syn">
                <Link to="/briefing">briefing(1)</Link> <i>·</i> <Link to="/centre">centre(1)</Link> <i>·</i>{' '}
                <Link to="/rapport">rapport(5)</Link> <i>·</i> <Link to="/charte">charte(7)</Link>
              </div>
            </div>
          </div>
          <div className="toc">
            <Pane title="sections">
              <div>
                {SECTIONS.map(([id, label], i) => (
                  <Link key={id} to={`/a-propos#${id}`}>
                    {label}
                    <span>§{i + 1}</span>
                  </Link>
                ))}
              </div>
            </Pane>
          </div>
        </div>
      </div>
    </main>
  );
}
