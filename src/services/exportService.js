const { stringify } = require('csv-stringify/sync');
const db = require('../db/database');

function generateCSV() {
  const rows = db
    .prepare(
      `SELECT u.full_name   AS "ФИО",
              u.phone       AS "Телефон",
              u.email       AS "Email",
              p.subscription_name AS "Абонемент",
              (p.amount / 100.0) AS "Сумма (руб)",
              p.paid_at     AS "Дата оплаты",
              p.yookassa_payment_id AS "ID платежа ЮКасса"
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE p.status = 'succeeded'
       ORDER BY p.paid_at DESC`
    )
    .all();

  return Buffer.from(
    stringify(rows, { header: true, bom: true }),
    'utf-8'
  );
}

module.exports = { generateCSV };
