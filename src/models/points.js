const db = require('./db');

const stmts = {
  add: db.prepare(`
    INSERT INTO points_ledger (user_id, amount, type, description, reference_id)
    VALUES (@user_id, @amount, @type, @description, @reference_id)
  `),

  history: db.prepare('SELECT * FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'),

  lifetimeEarned: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM points_ledger WHERE user_id = ? AND amount > 0"),

  totalByType: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM points_ledger WHERE user_id = ? AND type = ?"),
};

const User = () => require('./user');

const addPoints = db.transaction((data) => {
  stmts.add.run(data);
  User().updatePoints(data.user_id, data.amount);
});

module.exports = {
  add: (data) => addPoints(data),

  history: (userId, limit = 50, offset = 0) => stmts.history.all(userId, limit, offset),

  lifetimeEarned: (userId) => stmts.lifetimeEarned.get(userId).total,

  totalByType: (userId, type) => stmts.totalByType.get(userId, type).total,
};
