const db = require('./db');

const stmts = {
  findById:     db.prepare('SELECT * FROM addresses WHERE id = ?'),
  findByUser:   db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'),
  findDefault:  db.prepare('SELECT * FROM addresses WHERE user_id = ? AND is_default = 1'),

  create: db.prepare(`
    INSERT INTO addresses (user_id, label, line1, line2, city, county, postcode, country, is_default)
    VALUES (@user_id, @label, @line1, @line2, @city, @county, @postcode, @country, @is_default)
  `),

  update: db.prepare(`
    UPDATE addresses SET label = @label, line1 = @line1, line2 = @line2, city = @city,
    county = @county, postcode = @postcode, country = @country WHERE id = @id
  `),

  clearDefault: db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?'),
  setDefault:   db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?'),
  remove:       db.prepare('DELETE FROM addresses WHERE id = ?'),
};

module.exports = {
  findById:    (id) => stmts.findById.get(id),
  findByUser:  (userId) => stmts.findByUser.all(userId),
  findDefault: (userId) => stmts.findDefault.get(userId),

  create(data) {
    if (data.is_default) stmts.clearDefault.run(data.user_id);
    const info = stmts.create.run(data);
    return stmts.findById.get(info.lastInsertRowid);
  },

  update: (data) => stmts.update.run(data),

  setDefault(userId, addressId) {
    stmts.clearDefault.run(userId);
    stmts.setDefault.run(addressId);
  },

  remove: (id) => stmts.remove.run(id),
};
