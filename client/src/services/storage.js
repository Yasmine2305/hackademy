/** Partie « invitée » : tout reste dans ce navigateur (localStorage). */
const GAME_KEY = 'hackademy.guest.v1';
const SNAP_KEY = 'hackademy.guest.snapshots.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible */
  }
}

export const guestStore = {
  load: () => read(GAME_KEY, null),
  save: (state) => write(GAME_KEY, state),
  clear() {
    try {
      localStorage.removeItem(GAME_KEY);
      localStorage.removeItem(SNAP_KEY);
    } catch {
      /* */
    }
  },

  snapshots: () => read(SNAP_KEY, []),
  addSnapshot(label, state, keep = 3) {
    const list = read(SNAP_KEY, []);
    list.unshift({ id: Date.now() + Math.random(), label, created_at: new Date().toISOString(), state });
    write(SNAP_KEY, list.slice(0, keep));
  },
  getSnapshot: (id) => read(SNAP_KEY, []).find((s) => s.id === id) || null,
};
