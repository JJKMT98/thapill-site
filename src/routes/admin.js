const express = require('express');
const router = express.Router();

const { requireAuth, requireAdmin, requireCap } = require('../middleware/auth');
const Order = require('../models/order');
const User = require('../models/user');
const Shipment = require('../models/shipment');
const Chat = require('../models/chat');
const Product = require('../models/product');
const Shipping = require('../models/shipping');
const Pricing = require('../models/pricing');
const db = require('../models/db');
const { ROLES, isValidRole } = require('../utils/roles');

// Every /api/admin/* route requires a logged-in user with some role.
// Individual routes layer a specific capability check on top.
router.use(requireAuth, requireAdmin);

// ── Stats ──────────────────────────────────────────────────
router.get('/stats', requireCap('stats:read'), async (_req, res) => {
  const [totalOrders, revenue, totalUsers, newUsersTodayRow, activeSubsRow, leadsRow, customersRow, sessionsRow] = await Promise.all([
    Order.countAll(),
    Order.revenueTotal(),
    User.count(),
    db.one("SELECT COUNT(*)::int as c FROM users WHERE DATE(created_at) = CURRENT_DATE"),
    db.one("SELECT COUNT(DISTINCT user_id)::int as c FROM orders WHERE status != 'cancelled' AND user_id IS NOT NULL"),
    User.countByStatus('lead'),
    User.countByStatus('customer'),
    db.one("SELECT COUNT(*)::int AS c FROM sessions WHERE DATE(created_at) = CURRENT_DATE"),
  ]);

  res.json({
    totalOrders, revenue, totalUsers,
    newUsersToday: newUsersTodayRow.c,
    activeSubs: activeSubsRow.c,
    leads: leadsRow.c,
    customers: customersRow.c,
    visitorsToday: sessionsRow.c,
  });
});

// ── Orders ─────────────────────────────────────────────────
router.get('/orders', requireCap('orders:read'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const status = req.query.status;

  const orders = status
    ? await db.many('SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [status, limit, offset])
    : await Order.listAll(limit, offset);

  res.json({ orders, total: await Order.countAll() });
});

router.get('/orders/:id', requireCap('orders:read'), async (req, res) => {
  const order = await Order.findById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const [items, shipment, user] = await Promise.all([
    Order.getItems(order.id),
    Shipment.findByOrder(order.id),
    order.user_id ? User.findById(order.user_id) : Promise.resolve(null),
  ]);

  res.json({
    order, items, shipment,
    user: user ? { id: user.id, uid: user.uid, email: user.email, first_name: user.first_name, last_name: user.last_name } : null,
  });
});

router.patch('/orders/:id/status', requireCap('orders:write'), async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  await Order.updateStatus(Number(req.params.id), status);
  res.json({ ok: true });
});

// ── Users ──────────────────────────────────────────────────
router.get('/users', requireCap('users:read'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const filter = req.query.status; // 'lead' | 'customer' | undefined
  let users = await User.list(limit, offset);
  if (filter === 'lead') users = users.filter(u => u.status === 'lead');
  if (filter === 'customer') users = users.filter(u => u.status === 'customer');
  res.json({ users, total: await User.count() });
});

router.get('/visitors', requireCap('visitors:read'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await db.many(
    `SELECT s.id, s.country, s.city, s.region, s.ip_address, s.referrer, s.created_at,
            u.uid, u.email, u.first_name
     FROM sessions s LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.created_at DESC LIMIT $1`,
    [limit]
  );
  res.json({ visitors: rows });
});

router.get('/users/:id', requireCap('users:read'), async (req, res) => {
  const user = await User.findById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash: _, ...safe } = user;
  const orders = await Order.findByUser(user.id, 20);
  res.json({ user: safe, orders });
});

// ── Chat ───────────────────────────────────────────────────
router.get('/chat/rooms', requireCap('chat:read'), async (_req, res) => {
  res.json({ rooms: await Chat.activeRooms() });
});

router.get('/chat/:roomId', requireCap('chat:read'), async (req, res) => {
  res.json({ messages: await Chat.history(req.params.roomId, 200) });
});

// ── Products ───────────────────────────────────────────────
router.get('/products', requireCap('products:read'), async (_req, res) => {
  res.json({ products: await Product.listAll() });
});

router.patch('/products/:id', requireCap('products:write'), async (req, res) => {
  const product = await Product.findById(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await Product.update({ ...product, ...req.body, id: product.id });
  res.json({ ok: true, product: await Product.findById(product.id) });
});

// ── Shipping rules ─────────────────────────────────────────
router.get('/shipping', requireCap('shipping:read'), async (_req, res) => {
  res.json({ rules: await Shipping.listAll() });
});

router.put('/shipping/:country', requireCap('shipping:write'), async (req, res) => {
  const country = req.params.country.toUpperCase();
  if (!country || (country !== 'DEFAULT' && country.length !== 2)) {
    return res.status(400).json({ error: 'country must be 2-letter code or DEFAULT' });
  }
  await Shipping.upsert({ ...req.body, country });
  res.json({ ok: true, rule: await Shipping.findByCountry(country) });
});

router.delete('/shipping/:country', requireCap('shipping:write'), async (req, res) => {
  const country = req.params.country.toUpperCase();
  if (country === 'DEFAULT') return res.status(400).json({ error: 'Cannot delete DEFAULT rule' });
  await Shipping.remove(country);
  res.json({ ok: true });
});

// ── Per-country product pricing overrides ──────────────────
router.get('/pricing', requireCap('pricing:read'), async (_req, res) => {
  res.json({ overrides: await Pricing.listAll() });
});

router.get('/pricing/:productId', requireCap('pricing:read'), async (req, res) => {
  const productId = Number(req.params.productId);
  if (!productId) return res.status(400).json({ error: 'invalid product_id' });
  res.json({ overrides: await Pricing.findByProduct(productId) });
});

router.put('/pricing/:productId/:country', requireCap('pricing:write'), async (req, res) => {
  const productId = Number(req.params.productId);
  const country = req.params.country.toUpperCase();
  const { amount_minor, currency } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'invalid product_id' });
  if (!country || (country !== 'DEFAULT' && country.length !== 2)) {
    return res.status(400).json({ error: 'country must be 2-letter code or DEFAULT' });
  }
  if (amount_minor == null || Number(amount_minor) < 0) return res.status(400).json({ error: 'amount_minor required' });
  if (!currency || currency.length !== 3) return res.status(400).json({ error: 'currency must be a 3-letter code (e.g. USD)' });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'product not found' });

  await Pricing.upsert({ product_id: productId, country, amount_minor: Number(amount_minor), currency });
  res.json({ ok: true, override: await Pricing.findOne(productId, country) });
});

router.delete('/pricing/:productId/:country', requireCap('pricing:write'), async (req, res) => {
  const productId = Number(req.params.productId);
  const country = req.params.country.toUpperCase();
  if (!productId) return res.status(400).json({ error: 'invalid product_id' });
  await Pricing.remove(productId, country);
  res.json({ ok: true });
});

// ── Team (owner only) ──────────────────────────────────────
router.get('/team/roles', requireCap('team:read'), (_req, res) => {
  res.json({ roles: ROLES });
});

router.get('/team', requireCap('team:read'), async (_req, res) => {
  res.json({ team: await User.listWithRole() });
});

router.put('/team', requireCap('team:write'), async (req, res) => {
  const { email, role } = req.body || {};
  if (!email || !role) return res.status(400).json({ error: 'email and role are required' });
  if (!isValidRole(role)) return res.status(400).json({ error: 'invalid role' });

  const target = await User.findByEmail(email.toLowerCase().trim());
  if (!target) return res.status(404).json({ error: 'No user with that email. Ask them to register first, then set their role.' });

  // Guard: never demote the last owner.
  if (target.role === 'owner' && role !== 'owner') {
    const owners = (await User.listWithRole()).filter(u => u.role === 'owner');
    if (owners.length <= 1) return res.status(400).json({ error: 'Cannot demote the last owner' });
  }

  await User.setRole(target.id, role);
  res.json({ ok: true, user: { id: target.id, email: target.email, role } });
});

router.delete('/team/:id', requireCap('team:write'), async (req, res) => {
  const id = Number(req.params.id);
  const target = await User.findById(id);
  if (!target) return res.status(404).json({ error: 'user not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: "Can't revoke your own access — ask another owner." });

  if (target.role === 'owner') {
    const owners = (await User.listWithRole()).filter(u => u.role === 'owner');
    if (owners.length <= 1) return res.status(400).json({ error: 'Cannot remove the last owner' });
  }

  await User.setRole(id, null);
  res.json({ ok: true });
});

module.exports = router;
