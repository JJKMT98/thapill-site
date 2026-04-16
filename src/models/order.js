const db = require('./db');

const stmts = {
  findById:     db.prepare('SELECT * FROM orders WHERE id = ?'),
  findByNumber: db.prepare('SELECT * FROM orders WHERE order_number = ?'),
  findByUser:   db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'),
  countByUser:  db.prepare('SELECT COUNT(*) as total FROM orders WHERE user_id = ?'),

  create: db.prepare(`
    INSERT INTO orders (order_number, user_id, address_id, subtotal_pence, discount_pence, shipping_pence, total_pence, points_earned, points_redeemed, stripe_session_id, notes)
    VALUES (@order_number, @user_id, @address_id, @subtotal_pence, @discount_pence, @shipping_pence, @total_pence, @points_earned, @points_redeemed, @stripe_session_id, @notes)
  `),

  updateStatus: db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),

  setStripePaymentIntent: db.prepare('UPDATE orders SET stripe_payment_intent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),

  listAll: db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?'),
  countAll: db.prepare('SELECT COUNT(*) as total FROM orders'),

  revenueTotal: db.prepare("SELECT COALESCE(SUM(total_pence), 0) as total FROM orders WHERE status NOT IN ('pending', 'cancelled')"),
};

const itemStmts = {
  create: db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, unit_price_pence, total_pence)
    VALUES (@order_id, @product_id, @quantity, @unit_price_pence, @total_pence)
  `),

  findByOrder: db.prepare(`
    SELECT oi.*, p.name, p.slug, p.image_url
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `),
};

module.exports = {
  findById:     (id) => stmts.findById.get(id),
  findByNumber: (num) => stmts.findByNumber.get(num),
  findByUser:   (userId, limit = 20, offset = 0) => stmts.findByUser.all(userId, limit, offset),
  countByUser:  (userId) => stmts.countByUser.get(userId).total,

  create(data) {
    const info = stmts.create.run(data);
    return stmts.findById.get(info.lastInsertRowid);
  },

  updateStatus:          (id, status) => stmts.updateStatus.run(status, id),
  setStripePaymentIntent:(id, pi) => stmts.setStripePaymentIntent.run(pi, id),

  listAll:      (limit = 50, offset = 0) => stmts.listAll.all(limit, offset),
  countAll:     () => stmts.countAll.get().total,
  revenueTotal: () => stmts.revenueTotal.get().total,

  addItem(data) {
    return itemStmts.create.run(data);
  },

  getItems: (orderId) => itemStmts.findByOrder.all(orderId),
};
