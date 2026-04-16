const db = require('./db');

const stmts = {
  create: db.prepare(`
    INSERT INTO chat_messages (room_id, user_id, sender, message)
    VALUES (@room_id, @user_id, @sender, @message)
  `),

  history: db.prepare('SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'),

  markRead: db.prepare("UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP WHERE room_id = ? AND sender != 'user' AND read_at IS NULL"),

  activeRooms: db.prepare(`
    SELECT room_id, MAX(created_at) as last_message_at,
           COUNT(CASE WHEN read_at IS NULL AND sender != 'user' THEN 1 END) as unread
    FROM chat_messages GROUP BY room_id ORDER BY last_message_at DESC
  `),

  unreadCount: db.prepare("SELECT COUNT(*) as total FROM chat_messages WHERE room_id = ? AND sender != 'user' AND read_at IS NULL"),
};

module.exports = {
  create(data) {
    return stmts.create.run(data);
  },

  history:     (roomId, limit = 100, offset = 0) => stmts.history.all(roomId, limit, offset),
  markRead:    (roomId) => stmts.markRead.run(roomId),
  activeRooms: () => stmts.activeRooms.all(),
  unreadCount: (roomId) => stmts.unreadCount.get(roomId).total,
};
