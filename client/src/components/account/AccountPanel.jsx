import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';

/** Formulaire de changement de mot de passe (mise à jour d'une donnée sur le serveur). */
function ChangePassword({ onDone }) {
  const { changePassword } = useAuth();
  const { notify } = useToast();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!f.current) errs.current = 'Obligatoire.';
    if (f.next.length < 12) errs.next = '12 caractères minimum.';
    if (f.confirm !== f.next) errs.confirm = 'Les deux mots de passe diffèrent.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    try {
      await changePassword(f.current, f.next);
      notify('success', 'Mot de passe modifié. Les autres appareils ont été déconnectés.');
      onDone();
    } catch (ex) {
      setErrors(ex.fields || { current: ex.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Field
        label="mot de passe actuel"
        type="password"
        value={f.current}
        onChange={set('current')}
        autoComplete="current-password"
        error={errors.current}
      />
      <Field
        label="nouveau mot de passe"
        type="password"
        value={f.next}
        onChange={set('next')}
        autoComplete="new-password"
        error={errors.next}
        help="12 caractères minimum."
      />
      <Field
        label="confirmer"
        type="password"
        value={f.confirm}
        onChange={set('confirm')}
        autoComplete="new-password"
        error={errors.confirm}
      />
      <div className="row" style={{ marginTop: 12 }}>
        <Button type="submit" variant="go" size="sm" loading={sending}>
          Enregistrer
        </Button>
        <Button size="sm" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/** Suppression définitive du compte (droit à l'effacement), avec confirmation par mot de passe. */
function DeleteAccount({ onDone }) {
  const { deleteAccount } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(null);
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await deleteAccount(pw);
      notify('info', 'Compte supprimé, ainsi que sa progression et ses rapports.');
      navigate('/');
    } catch (ex) {
      setErr(ex.message);
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p style={{ fontSize: 14 }}>
        Cette action efface définitivement le compte, la progression, les sauvegardes et les rapports.
      </p>
      <Field
        label="mot de passe pour confirmer"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="current-password"
        required
        error={err}
      />
      <div className="row" style={{ marginTop: 12 }}>
        <Button type="submit" variant="danger" size="sm" loading={sending}>
          Supprimer définitivement
        </Button>
        <Button size="sm" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/** Zone « compte » de la page Progression. */
export default function AccountPanel() {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const [open, setOpen] = useState(null); // null | 'password' | 'delete'

  if (!user) {
    return (
      <div className="danger-zone">
        <Link className="btn sm" to="/acces">
          Créer un compte pour synchroniser
        </Link>
      </div>
    );
  }
  return (
    <div className="danger-zone">
      {open === 'password' && <ChangePassword onDone={() => setOpen(null)} />}
      {open === 'delete' && <DeleteAccount onDone={() => setOpen(null)} />}
      {!open && (
        <div className="row">
          <Button size="sm" onClick={() => logout().then(() => notify('info', 'Session fermée.'))}>
            Se déconnecter
          </Button>
          <Button size="sm" onClick={() => setOpen('password')}>
            Changer le mot de passe
          </Button>
          <Button size="sm" variant="danger" onClick={() => setOpen('delete')}>
            Supprimer mon compte
          </Button>
        </div>
      )}
    </div>
  );
}
