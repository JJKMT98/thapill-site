const { one, many, run } = require('./db');

module.exports = {
  findById:       (id) => one('SELECT * FROM referrals WHERE id = $1', [id]),
  findByReferred: (userId) => one('SELECT * FROM referrals WHERE referred_id = $1', [userId]),

  listByReferrer: (userId) =>
    many(
      `SELECT r.*, u.first_name, u.created_at as user_created_at
       FROM referrals r JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = $1 ORDER BY r.created_at DESC`,
      [userId]
    ),

  countByReferrer: async (userId) => {
    const row = await one('SELECT COUNT(*)::int as total FROM referrals WHERE referrer_id = $1', [userId]);
    return row.total;
  },

  create: (data) =>
    one(
      `INSERT INTO referrals (referrer_id, referred_id, referral_code) VALUES ($1, $2, $3) RETURNING *`,
      [data.referrer_id, data.referred_id, data.referral_code]
    ),

  updateStatus: (id, status, points) =>
    run('UPDATE referrals SET status = $1, reward_points = $2 WHERE id = $3', [status, points, id]),

  leaderboard: (limit = 10) =>
    many(
      `SELECT r.referrer_id, u.first_name, u.last_name,
              COUNT(*)::int as referral_count,
              COALESCE(SUM(r.reward_points), 0)::int as total_points
       FROM referrals r JOIN users u ON r.referrer_id = u.id
       GROUP BY r.referrer_id, u.first_name, u.last_name
       ORDER BY referral_count DESC LIMIT $1`,
      [limit]
    ),
};
