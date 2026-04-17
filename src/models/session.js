const { one, run } = require('./db');

module.exports = {
  findById:   (id) => one('SELECT * FROM sessions WHERE id = $1', [id]),
  findByUser: (userId) => one('SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),

  upsert: (data) =>
    run(
      `INSERT INTO sessions (id, user_id, data, country, city, region, ip_address, user_agent, referrer, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id, data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
      [data.id, data.user_id || null, data.data || null, data.country || null, data.city || null,
       data.region || null, data.ip_address || null, data.user_agent || null, data.referrer || null,
       data.expires_at]
    ),

  remove:  (id) => run('DELETE FROM sessions WHERE id = $1', [id]),
  cleanup: () => run('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP'),
};
