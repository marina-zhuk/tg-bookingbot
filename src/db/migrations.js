const fs = require('fs');
const path = require('path');
const db = require('./database');

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id   INTEGER NOT NULL UNIQUE,
      full_name     TEXT    NOT NULL,
      phone         TEXT    NOT NULL,
      email         TEXT    NOT NULL,
      registered_at TEXT    NOT NULL DEFAULT (datetime('now')),
      is_blocked    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS payments (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id              INTEGER NOT NULL REFERENCES users(id),
      subscription_id      TEXT    NOT NULL,
      subscription_name    TEXT    NOT NULL,
      amount               INTEGER NOT NULL,
      currency             TEXT    NOT NULL DEFAULT 'RUB',
      yookassa_payment_id  TEXT    UNIQUE,
      yookassa_payment_url TEXT,
      status               TEXT    NOT NULL DEFAULT 'pending',
      created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
      paid_at              TEXT
    );

    CREATE TABLE IF NOT EXISTS visitors (
      telegram_id   INTEGER PRIMARY KEY,
      username      TEXT,
      first_seen    TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen     TEXT NOT NULL DEFAULT (datetime('now')),
      is_blocked    INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);
  `);

  // SQLite has no IF NOT EXISTS for ALTER TABLE — ignore only "duplicate column" errors
  try {
    db.exec('ALTER TABLE payments ADD COLUMN canceled_at TEXT');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) throw err;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id               TEXT    PRIMARY KEY,
      type_id          TEXT    NOT NULL,
      type_name        TEXT    NOT NULL,
      type_desc        TEXT    NOT NULL DEFAULT '',
      duration         TEXT    NOT NULL,
      duration_display TEXT    NOT NULL,
      price            INTEGER NOT NULL,
      badge            TEXT,
      is_active        INTEGER NOT NULL DEFAULT 1,
      sort_order       INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_changes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id   TEXT    NOT NULL,
      admin_telegram_id INTEGER NOT NULL,
      admin_name        TEXT    NOT NULL DEFAULT '',
      action            TEXT    NOT NULL,
      old_value         TEXT,
      new_value         TEXT,
      changed_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sub_changes_sub_id ON subscription_changes(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_sub_changes_at    ON subscription_changes(changed_at);

    CREATE TABLE IF NOT EXISTS special_offers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      price       INTEGER NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      is_active   INTEGER NOT NULL DEFAULT 1,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed subscriptions from JSON on first run
  const count = db.prepare('SELECT COUNT(*) as n FROM subscriptions').get().n;
  if (count === 0) {
    const configPath = path.resolve(process.env.SUBSCRIPTIONS_PATH || './config/subscriptions.json');
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const insert = db.prepare(`
        INSERT OR IGNORE INTO subscriptions
          (id, type_id, type_name, type_desc, duration, duration_display, price, badge, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let order = 0;
      for (const type of config.types || []) {
        for (const plan of type.plans || []) {
          insert.run(
            plan.id, type.id, type.name, type.description || '',
            plan.duration, plan.durationDisplay || plan.duration,
            plan.price, plan.badge || null, order++
          );
        }
      }
      if (config.single) {
        const s = config.single;
        insert.run(s.id, 'single', s.name, s.description || '',
          s.duration, s.duration, s.price, null, order);
      }
    } catch (e) {
      console.error('Failed to seed subscriptions from JSON:', e.message);
    }
  }

  // Seed special offers from JSON on first run
  const specCount = db.prepare('SELECT COUNT(*) as n FROM special_offers').get().n;
  if (specCount === 0) {
    const configPath = path.resolve(process.env.SUBSCRIPTIONS_PATH || './config/subscriptions.json');
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const insertSpec = db.prepare(
        'INSERT INTO special_offers (name, price, description, sort_order) VALUES (?, ?, ?, ?)'
      );
      let i = 0;
      for (const offer of config.special?.offers || []) {
        insertSpec.run(offer.name, offer.price, offer.description || '', i++);
      }
    } catch (e) {
      console.error('Failed to seed special offers from JSON:', e.message);
    }
  }
}

module.exports = { runMigrations };
