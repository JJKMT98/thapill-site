const db = require('./db');

const stmts = {
  findById:   db.prepare('SELECT * FROM products WHERE id = ?'),
  findBySlug: db.prepare('SELECT * FROM products WHERE slug = ?'),
  listActive: db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY price_pence ASC'),
  listAll:    db.prepare('SELECT * FROM products ORDER BY created_at DESC'),

  create: db.prepare(`
    INSERT INTO products (slug, name, description, price_pence, compare_at_pence, type, subscription_interval_days, stock, image_url)
    VALUES (@slug, @name, @description, @price_pence, @compare_at_pence, @type, @subscription_interval_days, @stock, @image_url)
  `),

  update: db.prepare(`
    UPDATE products
    SET name = @name, description = @description, price_pence = @price_pence,
        compare_at_pence = @compare_at_pence, type = @type,
        subscription_interval_days = @subscription_interval_days,
        stock = @stock, image_url = @image_url, active = @active
    WHERE id = @id
  `),

  decrementStock: db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'),
};

module.exports = {
  findById:   (id) => stmts.findById.get(id),
  findBySlug: (slug) => stmts.findBySlug.get(slug),
  listActive: () => stmts.listActive.all(),
  listAll:    () => stmts.listAll.all(),

  create(data) {
    const info = stmts.create.run(data);
    return stmts.findById.get(info.lastInsertRowid);
  },

  update: (data) => stmts.update.run(data),

  decrementStock(id, qty) {
    const info = stmts.decrementStock.run(qty, id, qty);
    return info.changes > 0;
  },
};
