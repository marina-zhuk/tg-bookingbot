const fs = require('fs');
const path = require('path');

const notifiersPath = path.resolve(
  process.env.NOTIFIERS_PATH || './config/notifiers.json'
);

function load() {
  try {
    return JSON.parse(fs.readFileSync(notifiersPath, 'utf-8'));
  } catch {
    return [];
  }
}

function save(list) {
  fs.writeFileSync(notifiersPath, JSON.stringify(list, null, 2), 'utf-8');
}

function add({ telegram_id, username }) {
  const list = load();
  if (list.find((n) => n.telegram_id === telegram_id)) return false;
  list.push({
    telegram_id,
    username: username || null,
    added_at: new Date().toISOString().slice(0, 10),
  });
  save(list);
  return true;
}

function remove(telegram_id) {
  const list = load();
  const next = list.filter((n) => n.telegram_id !== telegram_id);
  if (next.length === list.length) return false;
  save(next);
  return true;
}

function getAll() {
  return load();
}

function getMainAdminIds() {
  return (process.env.ADMIN_IDS || '')
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter(Boolean);
}

async function notifyAll(telegram, text) {
  const notifiers = load().map((n) => n.telegram_id);
  const all = [...new Set([...getMainAdminIds(), ...notifiers])];
  for (const id of all) {
    await telegram.sendMessage(id, text).catch(() => {});
  }
}

function getAllRecipientIds() {
  const notifiers = load().map((n) => n.telegram_id);
  return [...new Set([...getMainAdminIds(), ...notifiers])];
}

module.exports = { add, remove, getAll, notifyAll, getAllRecipientIds };
