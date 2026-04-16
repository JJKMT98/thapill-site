const db = require('./db');

const stmts = {
  findByUser: db.prepare(`
    SELECT ci.*, p.name, p.slug, p.price_pence, p.image_url, p.type
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ? ORDER BY ci.created_at
  `),

  findBySession: db.prepare(`
    SELECT ci.*, p.name, p.slug, p.price_pence, p.image_url, p.type
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ? ORDER BY ci.created_at
  `),

  findItem: db.prepare('SELECT * FROM cart_items WHERE id = ?'),

  countByUser:    db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM cart_items WHERE user_id = ?'),
  countBySession: db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM cart_items WHERE session_id = ?'),

  upsertUser: db.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `),

  upsertSession: db.prepare(`
    INSERT INTO cart_items (session_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(session_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `),

  updateQty: db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?'),
  remove:    db.prepare('DELETE FROM cart_items WHERE id = ?'),
  clearUser: db.prepare('DELETE FROM cart_items WHERE user_id = ?'),
  clearSession: db.prepare('DELETE FROM cart_items WHERE session_id = ?'),

  sessionItems: db.prepare('SELECT * FROM cart_items WHERE session_id = ?'),
  transferToUser: db.prepare('UPDATE cart_items SET user_id = ?, session_id = NULL WHERE session_id = ?'),
};

const mergeGuestCart = db.transaction((userId, sessionId) => {
  const guestItems = stmts.sessionItems.all(sessionId);
  for (const item of guestItems) {
    stmts.upsertUser.run(userId, item.product_id, item.quantity);
  }
  stmts.clearSession.run(sessionId);
});

module.exports = {
  findByUser:    (userId) => stmts.findByUser.all(userId),
  findBySession: (sid) => stmts.findBySession.all(sid),
  findItem:      (id) => stmts.findItem.get(id),
  countByUser:   (userId) => stmts.countByUser.get(userId).total,
  countBySession:(sid) => stmts.countBySession.get(sid).total,

  addForUser:    (userId, productId, qty = 1) => stmts.upsertUser.run(userId, productId, qty),
  addForSession: (sid, productId, qty = 1) => stmts.upsertSession.run(sid, productId, qty),

  updateQty: (id, qty) => stmts.updateQty.run(qty, id),
  remove:    (id) => stmts.remove.run(id),
  clearUser: (userId) => stmts.clearUser.run(userId),

  mergeGuestCart,
};
