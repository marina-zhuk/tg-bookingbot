const cron = require('node-cron');
const db = require('../db/database');
const { getAllRecipientIds } = require('./notifierService');
const { formatPrice } = require('./subscriptionService');
const { escapeHtml } = require('../utils/html');

const MSK_OFFSET_MS = 3 * 3600 * 1000;

function toMoscow(utcStr) {
  return new Date(new Date(utcStr.replace(' ', 'T') + 'Z').getTime() + MSK_OFFSET_MS);
}

function fmtHeader(date) {
  const d = new Date(date.getTime() + MSK_OFFSET_MS);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${dd}.${mm} ${hh}:${min}`;
}

function fmtItem(utcStr) {
  const d = toMoscow(utcStr);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${dd}.${mm} в ${hh}:${min}`;
}

function toSqlite(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 19) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

function getPeriod() {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCHours(7, 0, 0, 0); // 07:00 UTC = 10:00 MSK
  const periodStart = new Date(periodEnd.getTime() - 24 * 3600 * 1000);
  return { periodStart, periodEnd };
}

async function sendDailyReport(telegram) {
  const { periodStart, periodEnd } = getPeriod();
  const startStr = toSqlite(periodStart);
  const endStr = toSqlite(periodEnd);

  const succeeded = db.prepare(`
    SELECT p.subscription_name, p.amount, p.paid_at,
           u.full_name, u.phone, u.email, v.username
    FROM payments p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN visitors v ON v.telegram_id = u.telegram_id
    WHERE p.status = 'succeeded' AND p.paid_at >= ? AND p.paid_at < ?
    ORDER BY p.paid_at ASC
  `).all(startStr, endStr);

  const canceled = db.prepare(`
    SELECT p.subscription_name, p.amount, p.canceled_at,
           u.full_name, u.phone, u.email, v.username
    FROM payments p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN visitors v ON v.telegram_id = u.telegram_id
    WHERE p.status = 'canceled' AND p.canceled_at >= ? AND p.canceled_at < ?
    ORDER BY p.canceled_at ASC
  `).all(startStr, endStr);

  const header = `${fmtHeader(periodStart)} — ${fmtHeader(periodEnd)}`;
  const clubName = process.env.CLUB_NAME || 'FitAdmin Demo Club';
  let text = `📊 <b>Ежедневный отчёт ${escapeHtml(clubName)}</b>\n📅 ${header}\n\n`;

  if (succeeded.length === 0 && canceled.length === 0) {
    text += 'Оплат за этот период не было.';
  } else {
    if (succeeded.length > 0) {
      text += '✅ <b>Успешные оплаты:</b>\n\n';
      for (const r of succeeded) {
        const uname = r.username ? ` (@${r.username})` : '';
        text += `${escapeHtml(r.full_name)}${escapeHtml(uname)} | ${escapeHtml(r.phone)} | ${escapeHtml(r.email)} — ${escapeHtml(r.subscription_name)} — ${formatPrice(r.amount)} — ${fmtItem(r.paid_at)}\n`;
      }
      const total = succeeded.reduce((s, r) => s + r.amount, 0);
      const word = plural(succeeded.length, 'покупка', 'покупки', 'покупок');
      text += `\n💰 <b>Итого успешных: ${succeeded.length} ${word} на ${formatPrice(total)}</b>`;
    }
    if (canceled.length > 0) {
      text += `\n\n❌ <b>Неудачные попытки:</b>\n\n`;
      for (const r of canceled) {
        const uname = r.username ? ` (@${r.username})` : '';
        text += `${escapeHtml(r.full_name)}${escapeHtml(uname)} | ${escapeHtml(r.phone)} | ${escapeHtml(r.email)} — ${escapeHtml(r.subscription_name)} — ${formatPrice(r.amount)} — ${fmtItem(r.canceled_at)}\n`;
      }
      text += `\n❌ <b>Неудачных попыток: ${canceled.length}</b>`;
    }
  }

  const recipients = getAllRecipientIds();
  for (const id of recipients) {
    await telegram.sendMessage(id, text, { parse_mode: 'HTML' }).catch((err) => {
      console.error(`Daily report: failed to send to ${id}:`, err.message);
    });
  }
}

function startScheduler(telegram) {
  // Every day at 10:00 Moscow time (UTC+3, no DST)
  cron.schedule('0 10 * * *', () => {
    console.log('Daily report: sending...');
    sendDailyReport(telegram)
      .then(() => console.log('Daily report: sent'))
      .catch((err) => console.error('Daily report error:', err));
  }, { timezone: 'Europe/Moscow' });

  console.log('Daily report scheduler started (10:00 MSK)');
}

module.exports = { startScheduler, sendDailyReport };
