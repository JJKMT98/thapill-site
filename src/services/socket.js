const Chat = require('../models/chat');
const { getAutoResponse, FALLBACK } = require('./chat-bot');

function initSocket(io) {
  io.on('connection', (socket) => {
    socket.on('chat:join', (data) => {
      const roomId = data.roomId || 'anon-' + socket.id;
      socket.join(roomId);
      socket.roomId = roomId;
    });

    socket.on('chat:message', (data) => {
      const roomId = socket.roomId || 'anon-' + socket.id;
      const userId = data.userId || null;

      Chat.create({
        room_id: roomId,
        user_id: userId,
        sender: 'user',
        message: data.message,
      });

      io.to(roomId).emit('chat:message', {
        sender: 'user',
        message: data.message,
        created_at: new Date().toISOString(),
      });

      const autoReply = getAutoResponse(data.message);
      setTimeout(() => {
        io.to(roomId).emit('chat:typing', { typing: true });
      }, 400);

      setTimeout(() => {
        const reply = autoReply || FALLBACK;
        Chat.create({
          room_id: roomId,
          user_id: null,
          sender: 'bot',
          message: reply,
        });
        io.to(roomId).emit('chat:typing', { typing: false });
        io.to(roomId).emit('chat:message', {
          sender: 'bot',
          message: reply,
          created_at: new Date().toISOString(),
        });
      }, autoReply ? 1200 : 2000);
    });
  });
}

module.exports = { initSocket };
