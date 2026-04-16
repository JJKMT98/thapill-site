const db = require('./db');

const stmts = {
  findById:  db.prepare('SELECT * FROM sessions WHERE id = ?'),
  findByUser: db.prepare('SELECT * FROM sessions WHERE user_id = ?'),

  upsert: db.prepare(`
    INSERT INTO sessions (id, user_id, data, expires_at)
    VALUES (@id, @user_id, @data, @expires_at)
    ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, data = excluded.data, expires_at = excluded.expires_at
  `),

  remove:  db.prepare('DELETE FROM sessions WHERE id = ?'),
  cleanup: db.prepare('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP'),
};

module.exports = {
  findById:   (id) => stmts.findById.get(id),
  findByUser: (userId) => stmts.findByUser.get(userId),
  upsert:     (data) => stmts.upsert.run(data),
  remove:     (id) => stmts.remove.run(id),
  cleanup:    () => stmts.cleanup.run(),
};
