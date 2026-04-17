const { verifyJWT, COOKIE_NAME } = require('../utils/tokens');
const User = require('../models/user');
const { can, isBootstrapEmail, isValidRole } = require('../utils/roles');

// Lazily promote a bootstrap email (from ADMIN_EMAILS / ADMIN_EMAIL env
// var, or the default justjaved@live.co.uk) to 'owner' the first time
// they're seen with a null/customer role. This means Javed can
// register on prod with justjaved@live.co.uk and immediately be owner.
async function promoteIfBootstrap(user) {
  if (!user || !user.email) return user;
  if (user.role) return user; // already has a role
  if (!isBootstrapEmail(user.email)) return user;
  await User.setRole(user.id, 'owner');
  return { ...user, role: 'owner' };
}

async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = verifyJWT(token);
    let user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    user = await promoteIfBootstrap(user);
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
    let user = await User.findById(payload.id);
    if (user) user = await promoteIfBootstrap(user);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}

// Back-compat: any role counts as admin. Use requireCap() below for
// fine-grained control per capability.
function requireAdmin(req, res, next) {
  const role = req.user && req.user.role;
  if (!role || !isValidRole(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

function requireCap(capability) {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!can(role, capability)) {
      return res.status(403).json({ error: 'Forbidden: missing capability ' + capability });
    }
    next();
  };
}

function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: role not permitted' });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireAdmin, requireCap, requireRole };
