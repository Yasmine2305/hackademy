/* Petits composants d'interface réutilisés sur toutes les pages. */
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { PageSkeleton } from './Skeleton.jsx';

/** Étiquette du Traffic Light Protocol : clear, green, amber, red. */
export function Tlp({ level }) {
  return <span className={`tlp ${level}`}>TLP:{level.toUpperCase()}</span>;
}

/** Logo texte : le A est l'octet manquant. */
export function Logo({ style }) {
  return (
    <Link className="logo" to="/" aria-label="Hackademy, accueil" style={style}>
      HACK<i>A</i>DEMY
    </Link>
  );
}

/** Panneau « verre » avec titre façon onglet de terminal. */
export function Pane({ title, right, className = '', as: Tag = 'div', children, ...rest }) {
  return (
    <Tag className={`pane${className ? ` ${className}` : ''}`} {...rest}>
      <i className="led" />
      <i className="hl" />
      <h2 className="t">{title}</h2>
      {right != null && <div className="r">{right}</div>}
      {children}
    </Tag>
  );
}

/** En-tête de page : fil d'Ariane façon chemin, titre, accroche et niveau TLP. */
export function PageHead({ title, crumb, tlp, lead }) {
  return (
    <div className="phead">
      <div>
        <div className="crumb">
          <b>~</b>/{crumb}
        </div>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
      <Tlp level={tlp} />
    </div>
  );
}

/** Icône pixel 8 × 8 en SVG. */
export function PixelIcon({ rows, size = 40, color = 'var(--green)' }) {
  const c = size / rows.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {rows.flatMap((r, y) =>
        r
          .split('')
          .map((b, x) =>
            b === '1' ? (
              <rect key={`${x}-${y}`} x={x * c} y={y * c} width={c} height={c} style={{ fill: color }} />
            ) : null,
          ),
      )}
    </svg>
  );
}

/** Les 12 cases du paquet : pleine = prouvée, pointillée = à prouver. */
export function Cells({ found, fresh = [] }) {
  const n = found.filter(Boolean).length;
  return (
    <div className="cells" role="img" aria-label={`${n} octets sur 12 retrouvés`}>
      {found.map((f, i) => (
        <Fragment key={i}>
          {(i === 4 || i === 8) && <i className="sep" />}
          {f ? (
            <span className={`cell ok${fresh.includes(i) ? ' fresh' : ''}`}>{f.hex}</span>
          ) : (
            <span className="cell no">??</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/** Bandeau d'état de mission résolue, avec le lien vers la suite. */
export function MissionDone({ n, solved, to, label }) {
  if (!solved) return null;
  return (
    <div className="toast" role="status">
      <p>
        <b className="c-g m">MISSION {n} RÉSOLUE.</b> Quatre octets de plus pour le paquet.
      </p>
      <Link className="btn go sm" to={to}>
        {label} <kbd>↵</kbd>
      </Link>
    </div>
  );
}

/** Message d'attente ou d'erreur pendant le chargement de l'API. */
export function Loading({ error, onRetry }) {
  if (!error) return <PageSkeleton />;
  return (
    <main id="main">
      <div className="wrap" style={{ padding: '80px 0' }}>
        <div className="toast err" role="alert">
          <p>
            <b className="c-r m">[err]</b> {error}
          </p>
          {onRetry && (
            <button type="button" className="btn sm" onClick={onRetry}>
              Réessayer
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
