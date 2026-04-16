const db = require('./db');

const stmts = {
  findById:       db.prepare('SELECT * FROM referrals WHERE id = ?'),
  findByReferred: db.prepare('SELECT * FROM referrals WHERE referred_id = ?'),

  listByReferrer: db.prepare(`
    SELECT r.*, u.first_name, u.created_at as user_created_at
    FROM referrals r JOIN users u ON r.referred_id = u.id
    WHERE r.referrer_id = ? ORDER BY r.created_at DESC
  `),

  countByReferrer: db.prepare('SELECT COUNT(*) as total FROM referrals WHERE referrer_id = ?'),

  create: db.prepare(`
    INSERT INTO referrals (referrer_id, referred_id, referral_code)
    VALUES (@referrer_id, @referred_id, @referral_code)
  `),

  updateStatus: db.prepare('UPDATE referrals SET status = ?, reward_points = ? WHERE id = ?'),

  leaderboard: db.prepare(`
    SELECT r.referrer_id, u.first_name, u.last_name, COUNT(*) as referral_count,
           SUM(r.reward_points) as total_points
    FROM referrals r JOIN users u ON r.referrer_id = u.id
    GROUP BY r.referrer_id ORDER BY referral_count DESC LIMIT ?
  `),
};

module.exports = {
  findById:       (id) => stmts.findById.get(id),
  findByReferred: (userId) => stmts.findByReferred.get(userId),
  listByReferrer: (userId) => stmts.listByReferrer.all(userId),
  countByReferrer:(userId) => stmts.countByReferrer.get(userId).total,

  create(data) {
    const info = stmts.create.run(data);
    return stmts.findById.get(info.lastInsertRowid);
  },

  updateStatus: (id, status, points) => stmts.updateStatus.run(status, points, id),
  leaderboard:  (limit = 10) => stmts.leaderboard.all(limit),
};
