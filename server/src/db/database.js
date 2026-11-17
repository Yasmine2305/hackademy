/**
 * Accès SQLite via le module natif de Node (node:sqlite, Node ≥ 22.13).
 * Aucun module natif à compiler : `npm install` suffit, y compris sous Windows.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL,
  expires_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS progress (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state      TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS snapshots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL,
  state      TEXT    NOT NULL,
  created_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id     TEXT    NOT NULL,
  score       INTEGER NOT NULL,
  duration_s  INTEGER,
  sha256      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON snapshots(user_id, id);
CREATE INDEX IF NOT EXISTS idx_reports_user   ON reports(user_id, id);
`;

/**
 * Ouvre (ou crée) la base. `file` peut valoir ':memory:' pour les tests.
 */
export function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

/** Petit dépôt (repository) : toutes les requêtes SQL au même endroit. */
export function createRepository(db) {
  const q = {
    insertUser: db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)'),
    userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
    userById: db.prepare('SELECT id, username, created_at FROM users WHERE id = ?'),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),

    insertSession: db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'),
    sessionUser: db.prepare(`SELECT u.id, u.username, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
                             WHERE s.token = ? AND s.expires_at > ?`),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
    purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),

    getProgress: db.prepare('SELECT state, updated_at FROM progress WHERE user_id = ?'),
    upsertProgress: db.prepare(`INSERT INTO progress (user_id, state, updated_at) VALUES (?, ?, ?)
                                ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`),

    insertSnapshot: db.prepare('INSERT INTO snapshots (user_id, label, state, created_at) VALUES (?, ?, ?, ?)'),
    listSnapshots: db.prepare('SELECT id, label, created_at FROM snapshots WHERE user_id = ? ORDER BY id DESC'),
    getSnapshot: db.prepare('SELECT * FROM snapshots WHERE id = ? AND user_id = ?'),
    trimSnapshots: db.prepare(`DELETE FROM snapshots WHERE user_id = ? AND id NOT IN
                               (SELECT id FROM snapshots WHERE user_id = ? ORDER BY id DESC LIMIT ?)`),

    insertReport: db.prepare(`INSERT INTO reports (user_id, case_id, score, duration_s, sha256, created_at)
                              VALUES (?, ?, ?, ?, ?, ?)`),
    listReports: db.prepare(
      'SELECT id, case_id, score, duration_s, sha256, created_at FROM reports WHERE user_id = ? ORDER BY id DESC LIMIT 20',
    ),

    // classement : le meilleur rapport de chaque analyste (score, puis temps le plus court)
    leaderboard: db.prepare(`SELECT username, score, duration_s, created_at FROM (
                               SELECT u.username, r.score, r.duration_s, r.created_at,
                                      ROW_NUMBER() OVER (PARTITION BY r.user_id
                                                         ORDER BY r.score DESC, r.duration_s ASC) AS rang
                               FROM reports r JOIN users u ON u.id = r.user_id)
                             WHERE rang = 1
                             ORDER BY score DESC, duration_s ASC
                             LIMIT ?`),
    countPlayers: db.prepare('SELECT COUNT(DISTINCT user_id) AS n FROM reports'),

    updatePassword: db.prepare('UPDATE users SET password_hash = ? WHERE id = ?'),
    deleteOtherSessions: db.prepare('DELETE FROM sessions WHERE user_id = ? AND token <> ?'),

    insertMessage: db.prepare('INSERT INTO messages (email, body, created_at) VALUES (?, ?, ?)'),
  };
  const now = () => new Date().toISOString();

  return {
    createUser(username, hash) {
      const r = q.insertUser.run(username, hash);
      return Number(r.lastInsertRowid);
    },
    findUserByName: (username) => q.userByName.get(username) ?? null,
    findUserById: (id) => q.userById.get(id) ?? null,
    deleteUser: (id) => q.deleteUser.run(id),
    /** Change le hachage du mot de passe et ferme les autres sessions ouvertes. */
    updatePassword(id, hash, keepToken) {
      q.updatePassword.run(hash, id);
      q.deleteOtherSessions.run(id, keepToken);
    },
    leaderboard: (limit = 10) => ({ entries: q.leaderboard.all(limit), players: q.countPlayers.get().n }),

    createSession(token, userId, ttlMs) {
      const t = Date.now();
      q.insertSession.run(token, userId, new Date(t).toISOString(), new Date(t + ttlMs).toISOString());
    },
    userForToken: (token) => q.sessionUser.get(token, now()) ?? null,
    deleteSession: (token) => q.deleteSession.run(token),
    purgeSessions: () => q.purgeSessions.run(now()),

    getProgress(userId) {
      const row = q.getProgress.get(userId);
      return row ? { state: JSON.parse(row.state), updatedAt: row.updated_at } : null;
    },
    saveProgress(userId, state) {
      const at = now();
      q.upsertProgress.run(userId, JSON.stringify(state), at);
      return at;
    },

    addSnapshot(userId, label, state, keep = 3) {
      q.insertSnapshot.run(userId, label, JSON.stringify(state), now());
      q.trimSnapshots.run(userId, userId, keep);
    },
    listSnapshots: (userId) => q.listSnapshots.all(userId),
    getSnapshot(userId, id) {
      const row = q.getSnapshot.get(id, userId);
      return row ? { ...row, state: JSON.parse(row.state) } : null;
    },

    addReport(userId, { caseId, score, durationS, sha256 }) {
      q.insertReport.run(userId, caseId, score, durationS, sha256, now());
    },
    listReports: (userId) => q.listReports.all(userId),

    addMessage: (email, body) => q.insertMessage.run(email, body, now()),
  };
}
