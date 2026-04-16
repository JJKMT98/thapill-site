const { one, many, run, transaction } = require('./db');

const JOIN = `ci.id, ci.user_id, ci.session_id, ci.product_id, ci.quantity, ci.created_at,
              p.name, p.slug, p.price_pence, p.image_url, p.type`;

module.exports = {
  findByUser: (userId) =>
    many(
      `SELECT ${JOIN} FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 ORDER BY ci.created_at`,
      [userId]
    ),

  findBySession: (sessionId) =>
    many(
      `SELECT ${JOIN} FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.session_id = $1 ORDER BY ci.created_at`,
      [sessionId]
    ),

  findItem: (id) => one('SELECT * FROM cart_items WHERE id = $1', [id]),

  countByUser: async (userId) => {
    const row = await one('SELECT COALESCE(SUM(quantity), 0)::int as total FROM cart_items WHERE user_id = $1', [userId]);
    return row.total;
  },

  countBySession: async (sid) => {
    const row = await one('SELECT COALESCE(SUM(quantity), 0)::int as total FROM cart_items WHERE session_id = $1', [sid]);
    return row.total;
  },

  addForUser: (userId, productId, qty = 1) =>
    run(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) WHERE user_id IS NOT NULL
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [userId, productId, qty]
    ),

  addForSession: (sessionId, productId, qty = 1) =>
    run(
      `INSERT INTO cart_items (session_id, product_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (session_id, product_id) WHERE session_id IS NOT NULL
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [sessionId, productId, qty]
    ),

  updateQty: (id, qty) => run('UPDATE cart_items SET quantity = $1 WHERE id = $2', [qty, id]),
  remove:    (id) => run('DELETE FROM cart_items WHERE id = $1', [id]),
  clearUser: (userId) => run('DELETE FROM cart_items WHERE user_id = $1', [userId]),
  clearSession: (sid) => run('DELETE FROM cart_items WHERE session_id = $1', [sid]),

  mergeGuestCart: (userId, sessionId) =>
    transaction(async (client) => {
      const guestItems = (await client.query('SELECT * FROM cart_items WHERE session_id = $1', [sessionId])).rows;
      for (const item of guestItems) {
        await client.query(
          `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) WHERE user_id IS NOT NULL
           DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
          [userId, item.product_id, item.quantity]
        );
      }
      await client.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
    }),
};
