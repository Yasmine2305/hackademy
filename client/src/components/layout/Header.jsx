import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGame } from '../../context/GameContext.jsx';
import { NAV } from '../../routes.js';
import { hhmm } from '../../utils/format.js';
import { Logo } from '../ui/ui.jsx';
import Search from './Search.jsx';

const LABELS = {
  '/': 'accueil',
  '/briefing': 'briefing',
  '/centre': 'centre',
  '/rapport': 'rapport',
  '/progression': 'progression',
  '/a-propos': 'à propos',
};

export default function Header({ section }) {
  const { user } = useAuth();
  const { savedAt, busy } = useGame();
  const syncTxt = user ? (busy ? 'sync…' : `sync ${hhmm(savedAt)}`) : 'local';

  return (
    <>
      <a className="skip" href="#main">
        Aller au contenu
      </a>
      <header className="top">
        <div className="wrap">
          <Logo />
          <nav className="nav" aria-label="Navigation principale">
            {NAV.map(([to, key], i) => {
              const on = section === key;
              return (
                <Link key={to} to={to} className={on ? 'on' : undefined} aria-current={on ? 'page' : undefined}>
                  <span>{i}:</span>
                  {LABELS[to]}
                  {on && <em>*</em>}
                </Link>
              );
            })}
          </nav>
          <Search />
          <span
            className={`sync${user ? '' : ' local'}`}
            title={
              user ? 'Progression sauvegardée sur le serveur' : 'Sans compte : progression gardée dans ce navigateur'
            }
          >
            <i />
            {syncTxt}
          </span>
          {user ? (
            <Link className="me" to="/progression">
              {user.username}
            </Link>
          ) : (
            <Link className="me" to="/acces">
              connexion
            </Link>
          )}
        </div>
      </header>
      <nav className="tabbar" aria-label="Navigation mobile">
        {NAV.map(([to, key, short], i) => (
          <Link
            key={to}
            to={to}
            className={section === key ? 'on' : undefined}
            aria-current={section === key ? 'page' : undefined}
          >
            <span>{i}</span>
            {short}
          </Link>
        ))}
      </nav>
    </>
  );
}
