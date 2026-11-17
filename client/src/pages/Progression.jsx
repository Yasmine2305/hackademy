import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useAsync, useClock } from '../hooks/hooks.js';
import AccountPanel from '../components/account/AccountPanel.jsx';
import Leaderboard from '../components/progress/Leaderboard.jsx';
import { SkeletonLines } from '../components/ui/Skeleton.jsx';
import Button from '../components/ui/Button.jsx';
import { api } from '../services/api.js';
import { guestStore } from '../services/storage.js';
import { dayTime, formatDuration } from '../utils/format.js';
import { ICONS, identRows } from '../assets/pixels.js';
import Scene from '../components/three/Scene.jsx';
import { PageHead, Pane, PixelIcon } from '../components/ui/ui.jsx';

function Bar({ label, pct }) {
  const on = Math.round(pct / 5);
  return (
    <div className="bar" role="img" aria-label={`${label} : ${pct} %`}>
      <span>{label}</span>
      <span className="tr">
        {Array.from({ length: 20 }, (_, i) => (
          <i key={i} className={i < on ? 'on' : ''} />
        ))}
      </span>
      <b>{pct}%</b>
    </div>
  );
}

export default function Progression() {
  const { user } = useAuth();
  const { state, view, savedAt, restore } = useGame();
  const clock = useClock(state.startedAt, state.finishedAt);
  // sauvegardes et rapports : depuis l'API si connecté, depuis ce navigateur sinon
  const saved = useAsync(
    () =>
      user
        ? Promise.all([api.snapshots(), api.reports()])
        : Promise.resolve([{ snapshots: guestStore.snapshots() }, { reports: [] }]),
    [user, savedAt, state.finishedAt],
  );
  const snapshots = saved.data?.[0].snapshots ?? [];
  const reports = saved.data?.[1].reports ?? [];

  const name = user?.username || 'invité';
  const m = view.missions;
  const badges = [
    ['log', 'Premier log', m[1].solved],
    ['key', 'Décodeur', m[2].solved],
    ['clk', 'Chronologue', m[3].solved],
    ['shd', 'Enquêteur', view.complete],
  ];

  return (
    <main id="main">
      <div className="wrap">
        <PageHead
          title="Votre progression"
          crumb="progression"
          tlp="green"
          lead="Ce que vous savez faire maintenant, et ce qui est en sécurité sur le serveur."
        />
        <div className="grid g-prog">
          <div className="stack">
            <Pane title="$ id">
              <Scene
                type="voxel"
                className="ava3d"
                tip="glisser pour tourner"
                opts={{ rows: identRows(name), color: 'green' }}
                label={`Avatar en voxels de ${name}`}
              />
              <div className="idc">
                <b>uid=0417({name})</b>
                <br />
                gid=100(soc) groups=100(soc),27(analystes)
              </div>
              <div className="kv" style={{ marginTop: 12 }}>
                <div>
                  <span>score</span>
                  <b className="c-g">{view.score}/100</b>
                </div>
                <div>
                  <span>rang</span>
                  <b>{view.rank}</b>
                </div>
                <div>
                  <span>enquêtes</span>
                  <b>
                    {reports.length
                      ? `${reports.length} terminée${reports.length > 1 ? 's' : ''}`
                      : view.complete
                        ? '1 terminée'
                        : state.startedAt
                          ? '1 en cours'
                          : 'aucune'}
                  </b>
                </div>
                <div>
                  <span>temps</span>
                  <b>{clock}</b>
                </div>
              </div>
              <AccountPanel />
            </Pane>
            <Pane title="sauvegardes" right={user ? 'sync serveur' : 'ce navigateur'}>
              <div aria-busy={saved.loading}>
                {saved.loading && !saved.data ? (
                  <SkeletonLines lines={3} />
                ) : snapshots.length ? (
                  snapshots.map((s) => (
                    <div className="bk" key={s.id}>
                      <span>
                        {s.label}
                        <small>{dayTime(s.created_at)}</small>
                      </span>
                      <Button size="sm" onClick={() => restore(s)}>
                        Restaurer
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="m c-m" style={{ fontSize: 13 }}>
                    Aucun point de restauration pour l’instant. Il s’en crée un à l’ouverture du dossier, à chaque
                    mission résolue et au rapport (les 3 derniers sont gardés).
                  </p>
                )}
              </div>
            </Pane>
          </div>
          <div className="stack">
            <Pane title="progression par mission">
              <Bar label="1 journaux" pct={Math.round((m[1].done / 4) * 100)} />
              <Bar label="2 décodage" pct={Math.round((m[2].done / 4) * 100)} />
              <Bar label="3 chronologie" pct={Math.round((m[3].done / 4) * 100)} />
            </Pane>
            <Pane title="badges" right={`${badges.filter((b) => b[2]).length}/4`}>
              <div className="badges">
                {badges.map(([icon, label, on]) => (
                  <div key={icon} className={`bdg${on ? '' : ' off'}`}>
                    <PixelIcon rows={ICONS[icon]} color={on ? 'var(--green)' : 'var(--dim)'} />
                    {label}
                  </div>
                ))}
              </div>
            </Pane>
            <div className="grid g-2">
              <Pane title="mini-cours">
                <ul className="chk">
                  <li>
                    <b className={m[1].solved ? '' : 'q'}>{m[1].solved ? '[x]' : '[ ]'}</b>Lire un journal
                    d’authentification
                  </li>
                  <li>
                    <b className={m[2].solved ? '' : 'q'}>{m[2].solved ? '[x]' : '[ ]'}</b>Encodage ou chiffrement ?
                  </li>
                  <li>
                    <b className={m[3].solved ? '' : 'q'}>{m[3].solved ? '[x]' : '[ ]'}</b>Lire une chaîne d’attaque
                  </li>
                </ul>
              </Pane>
              <Pane title="git log --oneline" right={user ? 'rapports signés' : undefined}>
                <div className="glog">
                  {reports.map((r) => (
                    <div key={r.id} title={`SHA-256 ${r.sha256}`}>
                      <i>*</i> <u>{r.sha256.slice(0, 7)}</u> enquête #{r.case_id}, {r.score}/100
                      {r.duration_s != null ? `, ${formatDuration(r.duration_s)}` : ''}
                    </div>
                  ))}
                  {state.startedAt && !view.complete && (
                    <div>
                      <i>*</i> <u>HEAD</u> enquête #0417 en cours, {view.count}/12 octets
                    </div>
                  )}
                  {user && (
                    <div>
                      <i>*</i> <u>0000000</u> compte créé, {dayTime(user.createdAt)}
                    </div>
                  )}
                  {!user && !state.startedAt && <div className="c-m">Aucune enquête pour l’instant.</div>}
                </div>
              </Pane>
            </div>
            <Leaderboard me={user?.username} refreshKey={reports.length} />
          </div>
        </div>
      </div>
    </main>
  );
}
