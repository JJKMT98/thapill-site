const db = require('../models/db');

function generateOrderNumber() {
  const date = new Date();
  const prefix = 'TP-' +
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');

  const count = db.prepare(
    "SELECT COUNT(*) as c FROM orders WHERE order_number LIKE ?"
  ).get(prefix + '%').c;

  return prefix + '-' + String(count + 1).padStart(3, '0');
}

module.exports = { generateOrderNumber };
