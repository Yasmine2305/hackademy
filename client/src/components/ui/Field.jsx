import { useId } from 'react';

/**
 * Champ de formulaire réutilisable : étiquette façon terminal, saisie,
 * message d'aide ou d'erreur relié au champ pour les lecteurs d'écran.
 *
 *   <Field label="password:" type="password" value={v} onChange={…} error={err} help="12 caractères minimum." />
 *   <Field label="message" multiline … />
 */
export default function Field({ label, error, help, multiline = false, extra, style, ...input }) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || help;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <label className="field" htmlFor={id} style={style}>
      <span>
        {label}
        {extra}
      </span>
      <Tag id={id} aria-invalid={error ? true : undefined} aria-describedby={note ? noteId : undefined} {...input} />
      {note && (
        <small id={noteId} className={error ? 'c-r' : undefined} role={error ? 'alert' : undefined}>
          {note}
        </small>
      )}
    </label>
  );
}
