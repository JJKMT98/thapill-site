const { one, many, run } = require('./db');

module.exports = {
  findByProduct: (productId) =>
    many('SELECT * FROM product_prices WHERE product_id = $1 ORDER BY country = \'DEFAULT\' ASC, country ASC', [productId]),

  findOne: (productId, country) =>
    one('SELECT * FROM product_prices WHERE product_id = $1 AND country = $2', [productId, (country || '').toUpperCase()]),

  listAll: () =>
    many(`SELECT pp.*, p.slug AS product_slug, p.name AS product_name
          FROM product_prices pp JOIN products p ON p.id = pp.product_id
          ORDER BY p.slug, pp.country = 'DEFAULT' ASC, pp.country ASC`),

  upsert: (data) =>
    run(
      `INSERT INTO product_prices (product_id, country, amount_minor, currency, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (product_id, country) DO UPDATE SET
         amount_minor = EXCLUDED.amount_minor,
         currency     = EXCLUDED.currency,
         updated_at   = CURRENT_TIMESTAMP`,
      [data.product_id, data.country.toUpperCase(), Number(data.amount_minor) || 0, data.currency.toUpperCase()]
    ),

  remove: (productId, country) =>
    run('DELETE FROM product_prices WHERE product_id = $1 AND country = $2', [productId, country.toUpperCase()]),

  // Resolver: returns the override for (product, country), the DEFAULT override,
  // or null if no override exists. Caller falls back to base GBP price.
  async resolve(productId, country) {
    const code = (country || '').toUpperCase();
    if (code) {
      const specific = await one('SELECT * FROM product_prices WHERE product_id = $1 AND country = $2', [productId, code]);
      if (specific) return specific;
    }
    const fallback = await one("SELECT * FROM product_prices WHERE product_id = $1 AND country = 'DEFAULT'", [productId]);
    return fallback || null;
  },
};
