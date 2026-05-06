const db = require('../db/database');

function findByTelegramId(telegramId) {
  return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) || null;
}

function create({ telegramId, fullName, phone, email }) {
  const stmt = db.prepare(
    'INSERT INTO users (telegram_id, full_name, phone, email) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(telegramId, fullName, phone, email);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
}

function findAll() {
  return db.prepare('SELECT * FROM users WHERE is_blocked = 0 ORDER BY registered_at DESC').all();
}

function markBlocked(telegramId) {
  db.prepare('UPDATE users SET is_blocked = 1 WHERE telegram_id = ?').run(telegramId);
}

function touchVisitor(telegramId, username) {
  db.prepare(`
    INSERT INTO visitors (telegram_id, username)
    VALUES (?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username  = excluded.username,
      last_seen = datetime('now')
  `).run(telegramId, username || null);
}

function findAllVisitors() {
  return db.prepare(
    'SELECT telegram_id, username FROM visitors WHERE is_blocked = 0'
  ).all();
}

function markVisitorBlocked(telegramId) {
  db.prepare('UPDATE visitors SET is_blocked = 1 WHERE telegram_id = ?').run(telegramId);
}

module.exports = { findByTelegramId, create, findAll, markBlocked, touchVisitor, findAllVisitors, markVisitorBlocked };
