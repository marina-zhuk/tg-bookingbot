const { YooCheckout } = require('@a2seven/yoo-checkout');
const db = require('../db/database');
let checkout;
function getCheckout() {
  if (!checkout) {
    checkout = new YooCheckout({
      shopId: process.env.YOOKASSA_SHOP_ID,
      secretKey: process.env.YOOKASSA_SECRET_KEY,
    });
  }
  return checkout;
}

function createPaymentRecord({ userId, subscriptionId, subscriptionName, amount }) {
  const stmt = db.prepare(`
    INSERT INTO payments (user_id, subscription_id, subscription_name, amount)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(userId, subscriptionId, subscriptionName, amount);
  return Number(result.lastInsertRowid);
}

async function createYookassaPayment({ paymentDbId, amount, subscriptionName, returnUrl }) {
  const ck = getCheckout();
  const idempotenceKey = require('crypto').randomUUID();

  const payment = await ck.createPayment(
    {
      amount: { value: (amount / 100).toFixed(2), currency: 'RUB' },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || 'https://t.me',
      },
      description: subscriptionName,
      metadata: { payment_db_id: String(paymentDbId) },
      capture: true,
    },
    idempotenceKey
  );

  db.prepare(
    'UPDATE payments SET yookassa_payment_id = ?, yookassa_payment_url = ? WHERE id = ?'
  ).run(payment.id, payment.confirmation.confirmation_url, paymentDbId);

  return payment;
}

function markSucceededById(id) {
  db.prepare(
    `UPDATE payments SET status = 'succeeded', paid_at = datetime('now') WHERE id = ?`
  ).run(id);
}

function markCanceledById(id) {
  db.prepare(
    `UPDATE payments SET status = 'canceled', canceled_at = datetime('now') WHERE id = ?`
  ).run(id);
}

function findByYookassaId(yookassaPaymentId) {
  return (
    db
      .prepare(
        `SELECT p.*, u.telegram_id FROM payments p
         JOIN users u ON u.id = p.user_id
         WHERE p.yookassa_payment_id = ?`
      )
      .get(yookassaPaymentId) || null
  );
}

function markSucceeded(yookassaPaymentId) {
  db.prepare(
    `UPDATE payments SET status = 'succeeded', paid_at = datetime('now')
     WHERE yookassa_payment_id = ?`
  ).run(yookassaPaymentId);
}

function markCanceled(yookassaPaymentId) {
  db.prepare(
    `UPDATE payments SET status = 'canceled', canceled_at = datetime('now') WHERE yookassa_payment_id = ?`
  ).run(yookassaPaymentId);
}

async function fetchFromYookassa(yookassaPaymentId) {
  const ck = getCheckout();
  return ck.getPayment(yookassaPaymentId);
}

module.exports = {
  createPaymentRecord,
  createYookassaPayment,
  markSucceededById,
  markCanceledById,
  findByYookassaId,
  markSucceeded,
  markCanceled,
  fetchFromYookassa,
};
