const db = require('./db');

const stmts = {
  findById:    db.prepare('SELECT * FROM shipments WHERE id = ?'),
  findByOrder: db.prepare('SELECT * FROM shipments WHERE order_id = ?'),

  create: db.prepare(`
    INSERT INTO shipments (order_id, carrier, tracking_number, tracking_url, estimated_delivery)
    VALUES (@order_id, @carrier, @tracking_number, @tracking_url, @estimated_delivery)
  `),

  updateStatus: db.prepare(`
    UPDATE shipments SET status = ?, status_history = ?, shipped_at = COALESCE(shipped_at, CASE WHEN ? IN ('in-transit','out-for-delivery','delivered') THEN CURRENT_TIMESTAMP END)
    WHERE id = ?
  `),

  markDelivered: db.prepare('UPDATE shipments SET status = ?, delivered_at = CURRENT_TIMESTAMP WHERE id = ?'),

  setTracking: db.prepare('UPDATE shipments SET tracking_number = ?, tracking_url = ? WHERE id = ?'),
};

module.exports = {
  findById:    (id) => stmts.findById.get(id),
  findByOrder: (orderId) => stmts.findByOrder.get(orderId),

  create(data) {
    const info = stmts.create.run(data);
    return stmts.findById.get(info.lastInsertRowid);
  },

  updateStatus(id, status, historyJson) {
    if (status === 'delivered') {
      return stmts.markDelivered.run(status, id);
    }
    return stmts.updateStatus.run(status, historyJson, status, id);
  },

  setTracking: (id, number, url) => stmts.setTracking.run(number, url, id),
};
