const { one, many, run } = require('./db');

module.exports = {
  create: (data) =>
    run(
      `INSERT INTO chat_messages (room_id, user_id, sender, message) VALUES ($1, $2, $3, $4)`,
      [data.room_id, data.user_id, data.sender, data.message]
    ),

  history: (roomId, limit = 100, offset = 0) =>
    many('SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3', [roomId, limit, offset]),

  historySince: (roomId, sinceId) =>
    many('SELECT * FROM chat_messages WHERE room_id = $1 AND id > $2 ORDER BY created_at ASC LIMIT 50', [roomId, sinceId || 0]),

  markRead: (roomId) =>
    run("UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP WHERE room_id = $1 AND sender != 'user' AND read_at IS NULL", [roomId]),

  activeRooms: () =>
    many(
      `SELECT room_id, MAX(created_at) as last_message_at,
              COUNT(CASE WHEN read_at IS NULL AND sender != 'user' THEN 1 END)::int as unread
       FROM chat_messages GROUP BY room_id ORDER BY last_message_at DESC`
    ),

  unreadCount: async (roomId) => {
    const row = await one("SELECT COUNT(*)::int as total FROM chat_messages WHERE room_id = $1 AND sender != 'user' AND read_at IS NULL", [roomId]);
    return row.total;
  },
};
