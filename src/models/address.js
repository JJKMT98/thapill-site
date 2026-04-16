const { one, many, run, transaction } = require('./db');

module.exports = {
  findById:   (id) => one('SELECT * FROM addresses WHERE id = $1', [id]),
  findByUser: (userId) => many('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [userId]),
  findDefault:(userId) => one('SELECT * FROM addresses WHERE user_id = $1 AND is_default = 1', [userId]),

  create: (data) =>
    transaction(async (client) => {
      if (data.is_default) await client.query('UPDATE addresses SET is_default = 0 WHERE user_id = $1', [data.user_id]);
      const res = await client.query(
        `INSERT INTO addresses (user_id, label, line1, line2, city, county, postcode, country, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [data.user_id, data.label, data.line1, data.line2, data.city, data.county, data.postcode, data.country, data.is_default || 0]
      );
      return res.rows[0];
    }),

  update: (data) =>
    run(
      `UPDATE addresses SET label = $1, line1 = $2, line2 = $3, city = $4, county = $5, postcode = $6, country = $7 WHERE id = $8`,
      [data.label, data.line1, data.line2, data.city, data.county, data.postcode, data.country, data.id]
    ),

  setDefault: (userId, addressId) =>
    transaction(async (client) => {
      await client.query('UPDATE addresses SET is_default = 0 WHERE user_id = $1', [userId]);
      await client.query('UPDATE addresses SET is_default = 1 WHERE id = $1', [addressId]);
    }),

  remove: (id) => run('DELETE FROM addresses WHERE id = $1', [id]),
};
