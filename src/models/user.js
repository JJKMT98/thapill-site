const { one, many, run } = require('./db');

module.exports = {
  findById:       (id) => one('SELECT * FROM users WHERE id = $1', [id]),
  findByUid:      (uid) => one('SELECT * FROM users WHERE uid = $1', [uid]),
  findByEmail:    (email) => one('SELECT * FROM users WHERE email = $1', [email]),
  findByReferral: (code) => one('SELECT * FROM users WHERE referral_code = $1', [code]),

  async create(data) {
    const row = await one(
      `INSERT INTO users (uid, email, password_hash, first_name, last_name, phone,
                          referral_code, referred_by, country, city, region, ip_address,
                          user_agent, signup_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [data.uid, data.email, data.password_hash, data.first_name, data.last_name, data.phone,
       data.referral_code, data.referred_by, data.country || null, data.city || null,
       data.region || null, data.ip_address || null, data.user_agent || null,
       data.signup_source || null]
    );
    return row;
  },

  updateProfile: (data) =>
    run(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [data.first_name, data.last_name, data.phone, data.id]
    ),

  verifyEmail:    (id) => run('UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]),
  updatePassword: (id, hash) => run('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, id]),
  updatePoints:   (id, delta) => run('UPDATE users SET points_balance = points_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [delta, id]),
  updateTier:     (id, tier) => run('UPDATE users SET tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [tier, id]),

  count: async () => {
    const row = await one('SELECT COUNT(*)::int as total FROM users');
    return row.total;
  },

  list: (limit = 50, offset = 0) =>
    many(
      `SELECT u.id, u.uid, u.email, u.first_name, u.last_name, u.phone, u.tier,
              u.points_balance, u.country, u.city, u.region, u.ip_address, u.signup_source,
              u.created_at,
              COALESCE(o.paid_orders, 0)::int AS paid_orders,
              COALESCE(o.total_spent_pence, 0)::int AS total_spent_pence,
              o.last_order_at,
              CASE WHEN COALESCE(o.paid_orders, 0) > 0 THEN 'customer' ELSE 'lead' END AS status
       FROM users u
       LEFT JOIN (
         SELECT user_id,
                COUNT(*) FILTER (WHERE status IN ('paid','processing','shipped','delivered')) AS paid_orders,
                SUM(total_pence) FILTER (WHERE status NOT IN ('pending','cancelled')) AS total_spent_pence,
                MAX(created_at) AS last_order_at
         FROM orders WHERE user_id IS NOT NULL GROUP BY user_id
       ) o ON o.user_id = u.id
       ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),

  countByStatus: (status) => {
    if (status === 'customer') {
      return one(`SELECT COUNT(DISTINCT u.id)::int AS c FROM users u
                  JOIN orders o ON o.user_id = u.id
                  WHERE o.status IN ('paid','processing','shipped','delivered')`);
    }
    return one(`SELECT COUNT(*)::int AS c FROM users u
                WHERE NOT EXISTS (SELECT 1 FROM orders o
                  WHERE o.user_id = u.id AND o.status IN ('paid','processing','shipped','delivered'))`);
  },
};
