import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/** Notifications éphémères (octet restauré, erreur, mission résolue…). */
const ToastContext = createContext(null);
const LABEL = { byte: '[+1]', success: '[ok]', error: '[err]', info: '[i]' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (kind, text, ms = 4200) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-3), { id, kind, text }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <button key={t.id} type="button" className={`ntf ${t.kind}`} onClick={() => dismiss(t.id)} title="Fermer">
            <b>{LABEL[t.kind] || '[i]'}</b>
            <span>{t.text}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return ctx;
}
