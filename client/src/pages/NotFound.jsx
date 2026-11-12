import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <main id="main">
      <div className="wrap nf">
        <div className="crumb"><b>~</b>{pathname}</div>
        <div className="code">404</div>
        <h1>Ce paquet-là non plus n’a jamais été capturé.</h1>
        <p className="lead m">bash: {pathname}: No such file or directory</p>
        <div className="row" style={{ marginTop: 24 }}>
          <Link className="btn go" to="/">Retour à l’accueil <kbd>↵</kbd></Link>
          <Link className="btn" to="/centre">Centre d’opérations</Link>
        </div>
      </div>
    </main>
  );
}
