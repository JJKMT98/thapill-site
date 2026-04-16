const { one, run } = require('./db');

module.exports = {
  findById:    (id) => one('SELECT * FROM shipments WHERE id = $1', [id]),
  findByOrder: (orderId) => one('SELECT * FROM shipments WHERE order_id = $1', [orderId]),

  create: (data) =>
    one(
      `INSERT INTO shipments (order_id, carrier, tracking_number, tracking_url, estimated_delivery)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.order_id, data.carrier, data.tracking_number, data.tracking_url, data.estimated_delivery]
    ),

  updateStatus: (id, status, historyJson) => {
    if (status === 'delivered') {
      return run('UPDATE shipments SET status = $1, delivered_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
    }
    return run(
      `UPDATE shipments SET status = $1, status_history = $2,
       shipped_at = COALESCE(shipped_at, CASE WHEN $1 IN ('in-transit','out-for-delivery','delivered') THEN CURRENT_TIMESTAMP END)
       WHERE id = $3`,
      [status, historyJson, id]
    );
  },

  setTracking: (id, number, url) =>
    run('UPDATE shipments SET tracking_number = $1, tracking_url = $2 WHERE id = $3', [number, url, id]),
};
