/**
 * Bouton de la charte : plein lumineux pour l'action principale (variant="go"),
 * contour pour le reste, rouge pour une action destructrice (variant="danger").
 * Avec `loading`, il affiche un indicateur et se désactive pour éviter les doubles clics.
 */
export function Spinner({ label = 'Chargement' }) {
  return <span className="spin" role="status" aria-label={label} />;
}

export default function Button({
  variant,
  size,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const cls = ['btn', variant, size, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner label="Envoi en cours" />}
      {children}
    </button>
  );
}
