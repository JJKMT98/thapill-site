const db = require('./db');

const stmts = {
  findById:         db.prepare('SELECT * FROM users WHERE id = ?'),
  findByUid:        db.prepare('SELECT * FROM users WHERE uid = ?'),
  findByEmail:      db.prepare('SELECT * FROM users WHERE email = ?'),
  findByReferral:   db.prepare('SELECT * FROM users WHERE referral_code = ?'),

  create: db.prepare(`
    INSERT INTO users (uid, email, password_hash, first_name, last_name, phone, referral_code, referred_by)
    VALUES (@uid, @email, @password_hash, @first_name, @last_name, @phone, @referral_code, @referred_by)
  `),

  updateProfile: db.prepare(`
    UPDATE users SET first_name = @first_name, last_name = @last_name, phone = @phone, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  verifyEmail: db.prepare('UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),

  updatePassword: db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),

  updatePoints: db.prepare('UPDATE users SET points_balance = points_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),

  updateTier: db.prepare('UPDATE users SET tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),

  count: db.prepare('SELECT COUNT(*) as total FROM users'),

  list: db.prepare('SELECT id, uid, email, first_name, last_name, tier, points_balance, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'),
};

module.exports = {
  findById:       (id) => stmts.findById.get(id),
  findByUid:      (uid) => stmts.findByUid.get(uid),
  findByEmail:    (email) => stmts.findByEmail.get(email),
  findByReferral: (code) => stmts.findByReferral.get(code),

  create(data) {
    const info = stmts.create.run(data);
    return stmts.findById.get(info.lastInsertRowid);
  },

  updateProfile: (data) => stmts.updateProfile.run(data),
  verifyEmail:   (id) => stmts.verifyEmail.run(id),
  updatePassword:(id, hash) => stmts.updatePassword.run(hash, id),
  updatePoints:  (id, delta) => stmts.updatePoints.run(delta, id),
  updateTier:    (id, tier) => stmts.updateTier.run(tier, id),
  count:         () => stmts.count.get().total,
  list:          (limit = 50, offset = 0) => stmts.list.all(limit, offset),
};
