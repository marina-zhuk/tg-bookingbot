const ExcelJS = require('exceljs');
const db = require('../db/database');

async function generateXLSX() {
  const rows = db
    .prepare(
      `SELECT u.full_name   AS full_name,
              u.phone       AS phone,
              u.email       AS email,
              p.subscription_name AS subscription_name,
              (p.amount / 100.0) AS amount_rub,
              p.paid_at     AS paid_at,
              p.yookassa_payment_id AS provider_payment_id
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE p.status = 'succeeded'
       ORDER BY p.paid_at DESC`
    )
    .all();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FitAdmin Demo Club Bot';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Оплаты');
  worksheet.columns = [
    { header: 'ФИО', key: 'full_name', width: 28 },
    { header: 'Телефон', key: 'phone', width: 18 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Абонемент', key: 'subscription_name', width: 24 },
    { header: 'Сумма (руб)', key: 'amount_rub', width: 14 },
    { header: 'Дата оплаты', key: 'paid_at', width: 20 },
    { header: 'ID платежного провайдера (если подключен)', key: 'provider_payment_id', width: 42 },
  ];

  worksheet.addRows(rows);
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle' };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.getColumn('amount_rub').numFmt = '#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { generateXLSX };
