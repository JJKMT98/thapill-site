const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const { ensureSession } = require('../middleware/session');
const Chat = require('../models/chat');
const { getAutoResponse, FALLBACK } = require('../services/chat-bot');

router.use(optionalAuth, ensureSession);

function getRoomId(req) {
  return req.user ? `user-${req.user.id}` : `guest-${req.sessionId}`;
}

router.get('/history', async (req, res) => {
  const roomId = getRoomId(req);
  const since = Number(req.query.since) || 0;
  const messages = since
    ? await Chat.historySince(roomId, since)
    : await Chat.history(roomId, 100);
  res.json({ messages, roomId });
});

router.post('/message', async (req, res) => {
  const roomId = getRoomId(req);
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  await Chat.create({
    room_id: roomId,
    user_id: req.user ? req.user.id : null,
    sender: 'user',
    message: message.trim(),
  });

  const autoReply = getAutoResponse(message) || FALLBACK;
  await Chat.create({
    room_id: roomId,
    user_id: null,
    sender: 'bot',
    message: autoReply,
  });

  const messages = await Chat.history(roomId, 10);
  res.json({ ok: true, messages: messages.slice(-2) });
});

module.exports = router;
