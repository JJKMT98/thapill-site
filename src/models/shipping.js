const { one, many, run } = require('./db');

module.exports = {
  findByCountry: (code) => one('SELECT * FROM shipping_rules WHERE country = $1', [code]),
  listAll:       () => many('SELECT * FROM shipping_rules ORDER BY country = \'DEFAULT\' ASC, country ASC'),

  async resolve(countryCode) {
    // Returns { price_pence, blocked, message, country } — falls back to DEFAULT if country not configured.
    const code = (countryCode || '').toUpperCase();
    let rule = code ? await one('SELECT * FROM shipping_rules WHERE country = $1', [code]) : null;
    if (!rule) rule = await one("SELECT * FROM shipping_rules WHERE country = 'DEFAULT'");
    if (!rule) return { country: code || null, price_pence: 0, blocked: 0, message: null };
    return {
      country: rule.country === 'DEFAULT' ? (code || null) : rule.country,
      price_pence: rule.price_pence,
      blocked: rule.blocked,
      message: rule.message,
    };
  },

  upsert: (data) =>
    run(
      `INSERT INTO shipping_rules (country, country_name, price_pence, blocked, message, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (country) DO UPDATE SET
         country_name = EXCLUDED.country_name,
         price_pence  = EXCLUDED.price_pence,
         blocked      = EXCLUDED.blocked,
         message      = EXCLUDED.message,
         updated_at   = CURRENT_TIMESTAMP`,
      [
        data.country.toUpperCase(),
        data.country_name || null,
        Number(data.price_pence) || 0,
        data.blocked ? 1 : 0,
        data.message || null,
      ]
    ),

  remove: (country) => run('DELETE FROM shipping_rules WHERE country = $1', [country.toUpperCase()]),
};
