const fs = require('fs');
const path = require('path');
const db = require('../db/database');

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

function _buildName(sub) {
  return sub.type_id === 'single' ? sub.type_name : `${sub.type_name} — ${sub.duration}`;
}

function loadAll(includeHidden = false) {
  const sql = includeHidden
    ? 'SELECT * FROM subscriptions ORDER BY sort_order ASC, created_at ASC'
    : 'SELECT * FROM subscriptions WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC';
  return db.prepare(sql).all().map((s) => ({ ...s, name: _buildName(s) }));
}

function findById(id) {
  const s = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
  return s ? { ...s, name: _buildName(s) } : null;
}

function findPlanById(id) {
  const s = findById(id);
  if (!s) return null;
  return { ...s, typeId: s.type_id, typeName: s.type_name, typeDescription: s.type_desc };
}

function getTypes() {
  const rows = db
    .prepare(
      'SELECT DISTINCT type_id, type_name, type_desc, MIN(sort_order) as ord ' +
      'FROM subscriptions GROUP BY type_id ORDER BY ord ASC'
    )
    .all();
  return rows;
}

// Reconstruct the config-shaped object that catalog.js expects
function loadConfig() {
  const subs = loadAll();
  const typeMap = {};
  for (const sub of subs) {
    if (sub.type_id === 'single') continue;
    if (!typeMap[sub.type_id]) {
      typeMap[sub.type_id] = { id: sub.type_id, name: sub.type_name, description: sub.type_desc, plans: [] };
    }
    typeMap[sub.type_id].plans.push({
      id: sub.id,
      duration: sub.duration,
      durationDisplay: sub.duration_display,
      price: sub.price,
      badge: sub.badge,
    });
  }

  const singleSub = subs.find((s) => s.type_id === 'single');
  const single = singleSub
    ? { id: singleSub.id, name: singleSub.type_name, description: singleSub.type_desc, duration: singleSub.duration, price: singleSub.price }
    : null;

  const specRows = db
    .prepare('SELECT * FROM special_offers WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC')
    .all();
  const special = {
    offers: specRows.map((o) => ({ name: o.name, price: o.price, description: o.description })),
  };

  return { types: Object.values(typeMap), single, special };
}

function formatPrice(kopecks) {
  return (kopecks / 100).toLocaleString('ru-RU') + ' ₽';
}

// ---------------------------------------------------------------------------
// Write helpers (used by admin panel)
// ---------------------------------------------------------------------------

function updatePrice(id, newPriceKopecks, adminTelegramId, adminName) {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
  if (!sub) throw new Error('Абонемент не найден');
  db.prepare('UPDATE subscriptions SET price = ? WHERE id = ?').run(newPriceKopecks, id);
  _logChange(id, adminTelegramId, adminName, 'price_change',
    JSON.stringify({ price: sub.price }),
    JSON.stringify({ price: newPriceKopecks }));
}

function toggleActive(id, adminTelegramId, adminName) {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
  if (!sub) throw new Error('Абонемент не найден');
  const newActive = sub.is_active ? 0 : 1;
  db.prepare('UPDATE subscriptions SET is_active = ? WHERE id = ?').run(newActive, id);
  _logChange(id, adminTelegramId, adminName, newActive ? 'restored' : 'hidden', null, null);
  return newActive;
}

function addSubscription(data, adminTelegramId, adminName) {
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM subscriptions').get().m || 0;
  const id = data.id || `${data.type_id}_${Date.now()}`;
  db.prepare(`
    INSERT INTO subscriptions (id, type_id, type_name, type_desc, duration, duration_display, price, badge, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.type_id, data.type_name, data.type_desc || '',
    data.duration, data.duration_display || data.duration,
    data.price, data.badge || null, maxOrder + 1
  );
  _logChange(id, adminTelegramId, adminName, 'added', null, JSON.stringify({ ...data, id }));
  return id;
}

function deleteSubscription(id, adminTelegramId, adminName) {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
  if (!sub) throw new Error('Абонемент не найден');
  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id);
  _logChange(id, adminTelegramId, adminName, 'deleted', JSON.stringify(sub), null);
}

function getHistory(limit = 30) {
  return db.prepare(`
    SELECT sc.*, s.type_name, s.duration
    FROM subscription_changes sc
    LEFT JOIN subscriptions s ON s.id = sc.subscription_id
    ORDER BY sc.changed_at DESC
    LIMIT ?
  `).all(limit);
}

// ---------------------------------------------------------------------------
// Special offers (admin)
// ---------------------------------------------------------------------------

function loadSpecialOffers(includeHidden = false) {
  const sql = includeHidden
    ? 'SELECT * FROM special_offers ORDER BY sort_order ASC, created_at ASC'
    : 'SELECT * FROM special_offers WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC';
  return db.prepare(sql).all();
}

function findSpecialOfferById(id) {
  return db.prepare('SELECT * FROM special_offers WHERE id = ?').get(id) || null;
}

function addSpecialOffer(data, adminTelegramId, adminName) {
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM special_offers').get().m || 0;
  const result = db.prepare(
    'INSERT INTO special_offers (name, price, description, sort_order) VALUES (?, ?, ?, ?)'
  ).run(data.name, data.price, data.description || '', maxOrder + 1);
  const newId = result.lastInsertRowid;
  _logChange(`special_${newId}`, adminTelegramId, adminName, 'added', null, JSON.stringify(data));
  return newId;
}

function updateSpecialOffer(id, field, value, adminTelegramId, adminName) {
  const offer = findSpecialOfferById(id);
  if (!offer) throw new Error('Спецпредложение не найдено');
  const allowed = ['name', 'price', 'description'];
  if (!allowed.includes(field)) throw new Error('Недопустимое поле');
  db.prepare(`UPDATE special_offers SET ${field} = ? WHERE id = ?`).run(value, id);
  _logChange(`special_${id}`, adminTelegramId, adminName, `${field}_change`,
    JSON.stringify({ [field]: offer[field] }),
    JSON.stringify({ [field]: value }));
}

function toggleSpecialActive(id, adminTelegramId, adminName) {
  const offer = findSpecialOfferById(id);
  if (!offer) throw new Error('Спецпредложение не найдено');
  const newActive = offer.is_active ? 0 : 1;
  db.prepare('UPDATE special_offers SET is_active = ? WHERE id = ?').run(newActive, id);
  _logChange(`special_${id}`, adminTelegramId, adminName, newActive ? 'restored' : 'hidden', null, null);
  return newActive;
}

function deleteSpecialOffer(id, adminTelegramId, adminName) {
  const offer = findSpecialOfferById(id);
  if (!offer) throw new Error('Спецпредложение не найдено');
  db.prepare('DELETE FROM special_offers WHERE id = ?').run(id);
  _logChange(`special_${id}`, adminTelegramId, adminName, 'deleted', JSON.stringify(offer), null);
}

function _logChange(subscriptionId, adminTelegramId, adminName, action, oldValue, newValue) {
  db.prepare(`
    INSERT INTO subscription_changes (subscription_id, admin_telegram_id, admin_name, action, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(subscriptionId, adminTelegramId, adminName || '', action, oldValue || null, newValue || null);
}

module.exports = {
  loadAll, findById, findPlanById, loadConfig, getTypes, formatPrice,
  updatePrice, toggleActive, addSubscription, deleteSubscription, getHistory,
  loadSpecialOffers, findSpecialOfferById, addSpecialOffer,
  updateSpecialOffer, toggleSpecialActive, deleteSpecialOffer,
};
