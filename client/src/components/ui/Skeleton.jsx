/**
 * Squelettes de chargement : des blocs gris animés qui ont la forme du contenu
 * à venir. La page ne « saute » pas quand les données arrivent (pas de décalage
 * de mise en page), et l'utilisateur voit tout de suite que quelque chose charge.
 */
export function Skeleton({ width = '100%', height = 14, radius = 4, style }) {
  return <span className="skel" aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />;
}

/** Quelques lignes de texte en attente. */
export function SkeletonLines({ lines = 3 }) {
  return (
    <span className="skel-lines" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '62%' : '100%'} />
      ))}
    </span>
  );
}

/** Page entière en attente : titre, indicateurs et deux colonnes de panneaux. */
export function PageSkeleton() {
  return (
    <main id="main" className="skel-page" aria-busy="true" aria-label="Chargement du dossier">
      <div className="wrap">
        <div className="phead">
          <div style={{ flex: 1 }}>
            <Skeleton width={120} height={12} />
            <Skeleton width="min(520px, 80%)" height={44} style={{ marginTop: 12 }} />
            <Skeleton width="min(420px, 70%)" height={16} style={{ marginTop: 14 }} />
          </div>
        </div>
        <div className="grid g-main">
          <div className="stack">
            <div className="pane skel-pane">
              <SkeletonLines lines={6} />
            </div>
            <div className="pane skel-pane">
              <SkeletonLines lines={3} />
            </div>
          </div>
          <div className="stack">
            <div className="pane skel-pane">
              <SkeletonLines lines={4} />
            </div>
          </div>
        </div>
        <p className="sr">Chargement du dossier #0417…</p>
      </div>
    </main>
  );
}
