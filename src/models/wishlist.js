const { one, many, run } = require('./db');

module.exports = {
  findByUser: (userId) =>
    many(
      `SELECT w.id, w.created_at, p.id as product_id, p.slug, p.name,
              p.description, p.price_pence, p.type, p.image_url
       FROM wishlist_items w JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
      [userId]
    ),

  find: (userId, productId) =>
    one('SELECT * FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId]),

  add: (userId, productId) =>
    run(
      `INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    ),

  remove: (userId, productId) =>
    run('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId]),

  count: async (userId) => {
    const row = await one('SELECT COUNT(*)::int AS c FROM wishlist_items WHERE user_id = $1', [userId]);
    return row.c;
  },
};
