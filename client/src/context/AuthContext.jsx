import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';
import { guestStore } from '../services/storage.js';

/** Compte de l'analyste : connexion, inscription, déconnexion, suppression. */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // au chargement : un jeton existe-t-il encore côté serveur ?
  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  const open = useCallback((r) => {
    tokenStore.set(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  // la partie jouée sans compte est proposée au serveur, qui la reprend si le compte est vide
  const login = useCallback((u, p) => api.login(u, p, guestStore.load()).then(open), [open]);
  const register = useCallback((u, p) => api.register(u, p, guestStore.load()).then(open), [open]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* jeton déjà expiré */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await api.deleteAccount(password);
    tokenStore.clear();
    setUser(null);
  }, []);

  const changePassword = useCallback((current, next) => api.changePassword(current, next), []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, deleteAccount, changePassword }),
    [user, ready, login, register, logout, deleteAccount, changePassword],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
