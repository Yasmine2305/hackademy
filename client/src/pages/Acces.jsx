import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Scene from '../components/three/Scene.jsx';
import { PageHead, Pane } from '../components/ui/ui.jsx';

const USERNAME = /^[A-Za-z0-9_-]{3,20}$/;

/** Validation côté navigateur (le serveur revalide tout). */
function validate(mode, f) {
  const e = {};
  if (!USERNAME.test(f.username)) e.username = '3 à 20 caractères : lettres, chiffres, _ ou -.';
  if (f.password.length < 12) e.password = '12 caractères minimum.';
  if (mode === 'signup' && f.confirm !== f.password) e.confirm = 'Les deux mots de passe diffèrent.';
  return e;
}

export default function Acces() {
  const { user, login, register, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (touched) setErrors(validate(mode, next));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setTouched(true);
    const errs = validate(mode, form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    setServerError(null);
    try {
      const u = mode === 'signup' ? await register(form.username, form.password) : await login(form.username, form.password);
      notify('success', mode === 'signup' ? `Compte ${u.username} créé. Progression synchronisée.` : `Bienvenue, ${u.username}.`);
      navigate('/briefing');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSending(false);
    }
  }

  const tab = (m, label) => (
    <button type="button" role="tab" className={mode === m ? 'on' : ''} aria-selected={mode === m}
      onClick={() => { setMode(m); setErrors({}); setServerError(null); setTouched(false); }}>
      {label}
    </button>
  );

  return (
    <main id="main" className="authw">
      <Scene type="globe" opts={{ ry: -2.05, z: 52, cx: 9.5 }} label="Globe : la connexion qui traverse le réseau" />
      <div className="wrap">
        <PageHead title="Accès analyste" crumb="acces" tlp="clear" lead="Un compte sert à une seule chose : retrouver votre enquête sur n’importe quel appareil." />
        <div className="auth">
          <div>
            <Pane title="ssh analyste@soc.defensys.example">
              <div className="tty">
                <div className="l">The authenticity of host ‘soc.defensys.example’ can’t be established.</div>
                <div className="l">ED25519 key fingerprint is SHA256:VUIVFnAkkgioEblvlwo1bUqIGIRh3Hf3KSjSmkWwoKk.</div>
              </div>

              {user ? (
                <div style={{ marginTop: 20 }}>
                  <p>Connecté en tant que <b className="c-g m">{user.username}</b>. Votre enquête est sauvegardée sur le serveur.</p>
                  <div className="row" style={{ marginTop: 20 }}>
                    <Link className="btn go" to="/centre">Reprendre l’enquête <kbd>↵</kbd></Link>
                    <button type="button" className="btn" onClick={() => logout().then(() => notify('info', 'Session fermée.'))}>Se déconnecter</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate style={{ marginTop: 20 }}>
                  <div className="seg" role="tablist">
                    {tab('login', 'Connexion')}
                    {tab('signup', 'Créer un compte')}
                  </div>
                  <label className="field">
                    <span>login as:</span>
                    <input name="username" value={form.username} onChange={set('username')} placeholder="agent_0417"
                      autoComplete="username" aria-invalid={!!errors.username} required />
                    {errors.username && <small className="c-r">{errors.username}</small>}
                  </label>
                  <label className="field">
                    <span>password:</span>
                    <input name="password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••••••"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} aria-invalid={!!errors.password} required />
                    <small className={errors.password ? 'c-r' : undefined}>
                      {errors.password || '12 caractères minimum. Le serveur n’en garde qu’une empreinte bcrypt.'}
                    </small>
                  </label>
                  {mode === 'signup' && (
                    <label className="field">
                      <span>retype password:</span>
                      <input name="confirm" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••••••"
                        autoComplete="new-password" aria-invalid={!!errors.confirm} required />
                      {errors.confirm && <small className="c-r">{errors.confirm}</small>}
                    </label>
                  )}
                  {serverError && <div className="fb" role="alert"><b className="c-r">[refusé]</b><span>{serverError}</span></div>}
                  <div className="row" style={{ marginTop: 20 }}>
                    <button className="btn go" type="submit" disabled={sending}>
                      {sending ? 'Connexion…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'} <kbd>↵</kbd>
                    </button>
                    <Link className="btn" to="/briefing">Continuer sans compte</Link>
                  </div>
                </form>
              )}
            </Pane>
            <Pane title="ce qui est sauvegardé" right="node + sqlite" className="note">
              <ul className="chk">
                <li><b>[x]</b>Vos octets, preuves et réponses, à chaque validation</li>
                <li><b>[x]</b>Votre score, vos indices et votre temps</li>
                <li><b>[x]</b>Trois points de restauration pour revenir en arrière</li>
                <li><b>[x]</b>Vos rapports d’enquête signés</li>
                <li><b className="q">[ ]</b>Sans compte : tout reste dans ce navigateur</li>
              </ul>
            </Pane>
          </div>
          <div />
        </div>
      </div>
    </main>
  );
}
