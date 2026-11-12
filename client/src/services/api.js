/**
 * Client HTTP de l'API Hackademy. Toutes les requêtes passent par ici.
 * Le jeton de session est gardé dans localStorage et envoyé en en-tête Bearer.
 */
const TOKEN_KEY = 'hackademy.token';

export const tokenStore = {
  get() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set(t) { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* navigation privée */ } },
  clear() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* idem */ } },
};

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || null;
  }
}

async function request(method, path, body) {
  const token = tokenStore.get();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Serveur injoignable. Vérifiez que l’API est lancée.', 0);
  }
  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch { /* réponse vide */ }
  }
  if (!res.ok) throw new ApiError(data?.error || `Erreur ${res.status}`, res.status, data?.fields);
  return data;
}

export const api = {
  scenario: () => request('GET', '/scenario'),

  register: (username, password, guestState) => request('POST', '/auth/register', { username, password, guestState }),
  login: (username, password, guestState) => request('POST', '/auth/login', { username, password, guestState }),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout'),
  deleteAccount: (password) => request('DELETE', '/auth/me', { password }),

  getGame: () => request('GET', '/game'),
  evaluate: (state) => request('POST', '/game/evaluate', { state }),
  action: (action, state) => request('POST', '/game/action', { action, state }),

  snapshots: () => request('GET', '/progress/snapshots'),
  restore: (id) => request('POST', `/progress/snapshots/${id}/restore`),
  reports: () => request('GET', '/progress/reports'),

  contact: (email, message) => request('POST', '/contact', { email, message }),
};
