const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRY = '7d';

function signJWT(user) {
  return jwt.sign({ id: user.id, uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyJWT(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

const COOKIE_NAME = 'thapill_token';

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

module.exports = { signJWT, verifyJWT, generateToken, setAuthCookie, clearAuthCookie, COOKIE_NAME };
