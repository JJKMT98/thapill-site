const { one, many, run } = require('./db');

module.exports = {
  findById:     (id) => one('SELECT * FROM orders WHERE id = $1', [id]),
  findByNumber: (num) => one('SELECT * FROM orders WHERE order_number = $1', [num]),
  findByUser:   (userId, limit = 20, offset = 0) =>
    many('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]),

  countByUser: async (userId) => {
    const row = await one('SELECT COUNT(*)::int as total FROM orders WHERE user_id = $1', [userId]);
    return row.total;
  },

  create: (data) =>
    one(
      `INSERT INTO orders (order_number, user_id, address_id, subtotal_pence, discount_pence, shipping_pence, total_pence, points_earned, points_redeemed, stripe_session_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [data.order_number, data.user_id, data.address_id, data.subtotal_pence, data.discount_pence, data.shipping_pence, data.total_pence, data.points_earned, data.points_redeemed, data.stripe_session_id, data.notes]
    ),

  updateStatus: (id, status) =>
    run('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]),

  setStripePaymentIntent: (id, pi) =>
    run('UPDATE orders SET stripe_payment_intent = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [pi, id]),

  listAll: (limit = 50, offset = 0) =>
    many('SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),

  countAll: async () => {
    const row = await one('SELECT COUNT(*)::int as total FROM orders');
    return row.total;
  },

  revenueTotal: async () => {
    const row = await one("SELECT COALESCE(SUM(total_pence), 0)::int as total FROM orders WHERE status NOT IN ('pending', 'cancelled')");
    return row.total;
  },

  addItem: (data) =>
    run(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price_pence, total_pence)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.order_id, data.product_id, data.quantity, data.unit_price_pence, data.total_pence]
    ),

  getItems: (orderId) =>
    many(
      `SELECT oi.*, p.name, p.slug, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [orderId]
    ),
};
