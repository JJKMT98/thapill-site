const { one, many, run } = require('./db');

module.exports = {
  findById:       (id) => one('SELECT * FROM users WHERE id = $1', [id]),
  findByUid:      (uid) => one('SELECT * FROM users WHERE uid = $1', [uid]),
  findByEmail:    (email) => one('SELECT * FROM users WHERE email = $1', [email]),
  findByReferral: (code) => one('SELECT * FROM users WHERE referral_code = $1', [code]),

  async create(data) {
    const row = await one(
      `INSERT INTO users (uid, email, password_hash, first_name, last_name, phone, referral_code, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.uid, data.email, data.password_hash, data.first_name, data.last_name, data.phone, data.referral_code, data.referred_by]
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
      'SELECT id, uid, email, first_name, last_name, tier, points_balance, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    ),
};
