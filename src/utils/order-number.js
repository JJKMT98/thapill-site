const db = require('../models/db');

async function generateOrderNumber() {
  const date = new Date();
  const prefix = 'TP-' +
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');

  const row = await db.one("SELECT COUNT(*)::int as c FROM orders WHERE order_number LIKE $1", [prefix + '%']);
  return prefix + '-' + String(row.c + 1).padStart(3, '0');
}

module.exports = { generateOrderNumber };
