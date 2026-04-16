const { one, run } = require('./db');

module.exports = {
  findById:   (id) => one('SELECT * FROM sessions WHERE id = $1', [id]),
  findByUser: (userId) => one('SELECT * FROM sessions WHERE user_id = $1', [userId]),

  upsert: (data) =>
    run(
      `INSERT INTO sessions (id, user_id, data, expires_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
      [data.id, data.user_id, data.data, data.expires_at]
    ),

  remove:  (id) => run('DELETE FROM sessions WHERE id = $1', [id]),
  cleanup: () => run('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP'),
};
