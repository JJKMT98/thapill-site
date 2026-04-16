const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const Chat = require('../models/chat');

router.get('/history', optionalAuth, (req, res) => {
  const roomId = req.user ? `user-${req.user.id}` : req.cookies.thapill_session || 'anon';
  const messages = Chat.history(roomId, 100);
  res.json({ messages });
});

module.exports = router;
