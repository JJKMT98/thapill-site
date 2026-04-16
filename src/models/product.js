const { one, many, run } = require('./db');

module.exports = {
  findById:   (id) => one('SELECT * FROM products WHERE id = $1', [id]),
  findBySlug: (slug) => one('SELECT * FROM products WHERE slug = $1', [slug]),
  listActive: () => many('SELECT * FROM products WHERE active = 1 ORDER BY price_pence ASC'),
  listAll:    () => many('SELECT * FROM products ORDER BY created_at DESC'),

  create: (data) =>
    one(
      `INSERT INTO products (slug, name, description, price_pence, compare_at_pence, type, subscription_interval_days, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [data.slug, data.name, data.description, data.price_pence, data.compare_at_pence, data.type, data.subscription_interval_days, data.stock, data.image_url]
    ),

  update: (data) =>
    run(
      `UPDATE products
       SET name = $1, description = $2, price_pence = $3, compare_at_pence = $4,
           type = $5, subscription_interval_days = $6, stock = $7, image_url = $8, active = $9
       WHERE id = $10`,
      [data.name, data.description, data.price_pence, data.compare_at_pence, data.type, data.subscription_interval_days, data.stock, data.image_url, data.active, data.id]
    ),

  async decrementStock(id, qty) {
    const res = await run('UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [qty, id]);
    return res.changes > 0;
  },
};
