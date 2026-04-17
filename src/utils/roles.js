// Role-based permissions for the admin panel.
// Edit this file to widen or narrow what each role can access.

// Canonical role list. Order roughly from most → least powerful.
const ROLES = [
  { key: 'owner',             label: 'Owner',             description: 'Full access, incl. managing other admins.' },
  { key: 'admin',             label: 'Admin',             description: 'Full access except managing admins.' },
  { key: 'ecommerce_manager', label: 'eCommerce Manager', description: 'Orders, shipping, pricing, products, users (read), visitors.' },
  { key: 'cfo',               label: 'CFO / Finance',     description: 'Orders (read), users (read), financial stats, pricing (read).' },
  { key: 'marketing',         label: 'Marketing',         description: 'Visitors, users (read), referrals. No orders or pricing.' },
  { key: 'support',           label: 'Support',           description: 'Orders (read + status update), users (read), chat.' },
];

const ROLE_KEYS = ROLES.map((r) => r.key);

// Capability matrix. Admin route handlers call can(role, 'cap').
// Each capability is a verb:noun. Keeping this flat and grep-able.
const MATRIX = {
  owner: new Set([
    'stats:read', 'orders:read', 'orders:write',
    'users:read', 'users:write',
    'visitors:read', 'products:read', 'products:write',
    'shipping:read', 'shipping:write', 'pricing:read', 'pricing:write',
    'chat:read', 'chat:write', 'team:read', 'team:write',
  ]),
  admin: new Set([
    'stats:read', 'orders:read', 'orders:write',
    'users:read', 'users:write',
    'visitors:read', 'products:read', 'products:write',
    'shipping:read', 'shipping:write', 'pricing:read', 'pricing:write',
    'chat:read', 'chat:write',
  ]),
  ecommerce_manager: new Set([
    'stats:read', 'orders:read', 'orders:write',
    'users:read', 'visitors:read',
    'products:read', 'products:write',
    'shipping:read', 'shipping:write',
    'pricing:read', 'pricing:write',
    'chat:read',
  ]),
  cfo: new Set([
    'stats:read', 'orders:read', 'users:read',
    'products:read', 'pricing:read', 'shipping:read',
  ]),
  marketing: new Set([
    'stats:read', 'users:read', 'visitors:read',
    'products:read', 'shipping:read',
  ]),
  support: new Set([
    'stats:read', 'orders:read', 'orders:write',
    'users:read', 'chat:read', 'chat:write',
  ]),
};

function can(role, capability) {
  if (!role) return false;
  const caps = MATRIX[role];
  return !!(caps && caps.has(capability));
}

function isValidRole(role) {
  return ROLE_KEYS.includes(role);
}

// Bootstrap emails → owner role. Comma-separated ADMIN_EMAILS (or
// single ADMIN_EMAIL) env var. Default is justjaved@live.co.uk so the
// first admin account is usable even before env vars are set.
function getBootstrapEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'justjaved@live.co.uk';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function isBootstrapEmail(email) {
  return !!email && getBootstrapEmails().includes(email.toLowerCase());
}

// Hard-coded master admin. Can never be demoted or revoked from the UI,
// even by another owner. Guaranteed re-promoted to owner on every login
// via the promoteIfBootstrap middleware hook.
const MASTER_EMAIL = (process.env.MASTER_ADMIN_EMAIL || 'justjaved@live.co.uk').toLowerCase();
function isMasterEmail(email) {
  return !!email && email.toLowerCase() === MASTER_EMAIL;
}

module.exports = {
  ROLES, ROLE_KEYS, MATRIX,
  can, isValidRole,
  getBootstrapEmails, isBootstrapEmail,
  MASTER_EMAIL, isMasterEmail,
};
