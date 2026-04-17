const { verifyJWT, COOKIE_NAME } = require('../utils/tokens');
const User = require('../models/user');

async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = verifyJWT(token);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function optionalAuth(req, _res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return next();

  try {
    const payload = verifyJWT(token);
    req.user = (await User.findById(payload.id)) || null;
  } catch {
    req.user = null;
  }
  next();
}

function getAdminEmails() {
  // Supports comma-separated list via ADMIN_EMAILS, or a single ADMIN_EMAIL.
  // Falls back to hello@thapill.com so a first admin is always possible.
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'hello@thapill.com';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function requireAdmin(req, res, next) {
  const email = (req.user && req.user.email) ? req.user.email.toLowerCase() : null;
  if (!email || !getAdminEmails().includes(email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin, getAdminEmails };
