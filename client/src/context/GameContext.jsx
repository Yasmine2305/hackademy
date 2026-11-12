import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { guestStore } from '../services/storage.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

/**
 * État de l'enquête. Le navigateur ne sait pas ce qui est juste :
 * chaque action part au serveur, qui renvoie le nouvel état et la « vue »
 * (octets mérités, score, statut des missions, notifications).
 */
const GameContext = createContext(null);

const EMPTY_VIEW = {
  found: new Array(12).fill(null), count: 0, score: 0, rank: 'Analyste junior', hintsUsed: 0, errors: 0,
  missions: { 1: { done: 0, solved: false }, 2: { done: 0, solved: false }, 3: { done: 0, solved: false } },
  marks: {}, q1: null, recipeClear: false, chainWrong: [], hints: { m1: {}, m2: {}, m3: {} }, complete: false, report: null,
};

export function GameProvider({ children }) {
  const { user, ready } = useAuth();
  const { notify } = useToast();
  const [scenario, setScenario] = useState(null);
  const [state, setState] = useState(null);
  const [view, setView] = useState(EMPTY_VIEW);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const stateRef = useRef(null);
  const queue = useRef(Promise.resolve());
  const userRef = useRef(user);
  userRef.current = user;

  const accept = useCallback((r) => {
    stateRef.current = r.state;
    setState(r.state);
    setView(r.view);
    if (r.savedAt !== undefined) setSavedAt(r.savedAt);
    if (!userRef.current) guestStore.save(r.state);
  }, []);

  // contenu public du scénario (journaux, cartes, glossaire…)
  useEffect(() => {
    api.scenario().then(setScenario).catch((e) => setError(e.message));
  }, []);

  // (re)charge la partie quand on se connecte ou se déconnecte
  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    const p = user ? api.getGame() : api.evaluate(guestStore.load());
    p.then((r) => { accept(r); setError(null); if (!user) setSavedAt(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, ready, accept]);

  /** Envoie une action ; les appels sont mis en file pour garder l'ordre des clics. */
  const dispatch = useCallback((action) => {
    const run = async () => {
      setBusy(true);
      try {
        const r = await api.action(action, userRef.current ? undefined : stateRef.current);
        accept(r);
        r.events.forEach((e) => notify(e.kind, e.text));
        if (!userRef.current) r.milestones.forEach((m) => guestStore.addSnapshot(m, r.state));
        return r;
      } catch (e) {
        notify('error', e.message);
        return null;
      } finally {
        setBusy(false);
      }
    };
    const p = queue.current.then(run);
    queue.current = p.catch(() => null);
    return p;
  }, [accept, notify]);

  /** Revient à un point de restauration (serveur si connecté, navigateur sinon). */
  const restore = useCallback(async (snapshot) => {
    try {
      const r = userRef.current ? await api.restore(snapshot.id) : await api.evaluate(snapshot.state);
      accept(r);
      notify('success', `Partie restaurée : ${snapshot.label}.`);
      return true;
    } catch (e) {
      notify('error', e.message);
      return false;
    }
  }, [accept, notify]);

  const value = useMemo(
    () => ({ scenario, state, view, savedAt, loading, error, busy, dispatch, restore }),
    [scenario, state, view, savedAt, loading, error, busy, dispatch, restore],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return ctx;
}
