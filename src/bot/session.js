const { session } = require('telegraf');
const db = require('../db/database');

db.exec(`CREATE TABLE IF NOT EXISTS sessions (key TEXT PRIMARY KEY, value TEXT)`);

const store = {
  get: (key) => {
    const row = db.prepare('SELECT value FROM sessions WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : undefined;
  },
  set: (key, value) => {
    db.prepare('INSERT OR REPLACE INTO sessions (key, value) VALUES (?, ?)').run(
      key,
      JSON.stringify(value)
    );
  },
  delete: (key) => {
    db.prepare('DELETE FROM sessions WHERE key = ?').run(key);
  },
};

function createSessionMiddleware() {
  return session({ store, defaultSession: () => ({}) });
}

module.exports = { createSessionMiddleware };
