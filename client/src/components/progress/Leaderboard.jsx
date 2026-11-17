import { useAsync } from '../../hooks/hooks.js';
import { api } from '../../services/api.js';
import { formatDuration } from '../../utils/format.js';
import Button from '../ui/Button.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { Pane } from '../ui/ui.jsx';

/**
 * Classement des analystes : meilleur rapport de chaque compte, lu depuis l'API.
 * Trois états gérés : chargement (squelette), erreur (réessayer), données.
 */
export default function Leaderboard({ me, refreshKey }) {
  const { data, loading, error, reload } = useAsync(() => api.leaderboard(10), [refreshKey]);

  let body;
  if (loading && !data) {
    body = (
      <div aria-busy="true" aria-label="Chargement du classement">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} height={18} style={{ margin: '10px 0' }} />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <div className="fb" role="alert">
        <b className="c-r">[err]</b>
        <span>
          {error.message}{' '}
          <Button size="sm" onClick={reload}>
            Réessayer
          </Button>
        </span>
      </div>
    );
  } else if (!data.entries.length) {
    body = (
      <p className="m c-m" style={{ fontSize: 13 }}>
        Personne n’a encore signé de rapport. Soyez le premier analyste du classement.
      </p>
    );
  } else {
    body = (
      <table className="lb">
        <caption className="sr">Meilleurs scores des analystes</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">analyste</th>
            <th scope="col">score</th>
            <th scope="col">temps</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e, i) => (
            <tr key={e.username} className={e.username === me ? 'me' : undefined}>
              <td className="rk">{String(i + 1).padStart(2, '0')}</td>
              <td>
                {e.username}
                {e.username === me ? ' (vous)' : ''}
              </td>
              <td>{e.score}/100</td>
              <td>{e.duration_s != null ? formatDuration(e.duration_s) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <Pane
      title="classement des analystes"
      right={data ? `${data.players} analyste${data.players > 1 ? 's' : ''}` : undefined}
    >
      {body}
    </Pane>
  );
}
