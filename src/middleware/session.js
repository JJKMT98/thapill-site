const { v4: uuidv4 } = require('uuid');

const COOKIE_NAME = 'thapill_session';

function ensureSession(req, res, next) {
  if (!req.cookies[COOKIE_NAME]) {
    const sid = uuidv4();
    res.cookie(COOKIE_NAME, sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    req.sessionId = sid;
  } else {
    req.sessionId = req.cookies[COOKIE_NAME];
  }
  next();
}

module.exports = { ensureSession, COOKIE_NAME };
