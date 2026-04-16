const { one, many, transaction } = require('./db');

module.exports = {
  add: (data) =>
    transaction(async (client) => {
      await client.query(
        `INSERT INTO points_ledger (user_id, amount, type, description, reference_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [data.user_id, data.amount, data.type, data.description, data.reference_id]
      );
      await client.query(
        'UPDATE users SET points_balance = points_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [data.amount, data.user_id]
      );
    }),

  history: (userId, limit = 50, offset = 0) =>
    many(
      'SELECT * FROM points_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    ),

  lifetimeEarned: async (userId) => {
    const row = await one(
      "SELECT COALESCE(SUM(amount), 0)::int as total FROM points_ledger WHERE user_id = $1 AND amount > 0",
      [userId]
    );
    return row.total;
  },

  totalByType: async (userId, type) => {
    const row = await one(
      "SELECT COALESCE(SUM(amount), 0)::int as total FROM points_ledger WHERE user_id = $1 AND type = $2",
      [userId, type]
    );
    return row.total;
  },
};
