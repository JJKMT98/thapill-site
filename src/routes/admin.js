const express = require('express');
const router = express.Router();

const { requireAuth, requireAdmin } = require('../middleware/auth');
const Order = require('../models/order');
const User = require('../models/user');
const Shipment = require('../models/shipment');
const Chat = require('../models/chat');
const Product = require('../models/product');
const db = require('../models/db');

router.use(requireAuth, requireAdmin);

router.get('/stats', async (_req, res) => {
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
    totalOrders,
    revenue,
    totalUsers,
    newUsersToday: newUsersTodayRow.c,
    activeSubs: activeSubsRow.c,
    leads: leadsRow.c,
    customers: customersRow.c,
    visitorsToday: sessionsRow.c,
  });
});

router.get('/orders', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const status = req.query.status;

  const orders = status
    ? await db.many('SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [status, limit, offset])
    : await Order.listAll(limit, offset);

  res.json({ orders, total: await Order.countAll() });
});

router.get('/orders/:id', async (req, res) => {
  const order = await Order.findById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const [items, shipment, user] = await Promise.all([
    Order.getItems(order.id),
    Shipment.findByOrder(order.id),
    order.user_id ? User.findById(order.user_id) : Promise.resolve(null),
  ]);

  res.json({
    order,
    items,
    shipment,
    user: user ? { id: user.id, uid: user.uid, email: user.email, first_name: user.first_name, last_name: user.last_name } : null,
  });
});

router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  await Order.updateStatus(Number(req.params.id), status);
  res.json({ ok: true });
});

router.get('/users', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const filter = req.query.status; // 'lead' | 'customer' | undefined
  let users = await User.list(limit, offset);
  if (filter === 'lead') users = users.filter(u => u.status === 'lead');
  if (filter === 'customer') users = users.filter(u => u.status === 'customer');
  res.json({ users, total: await User.count() });
});

router.get('/visitors', async (req, res) => {
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

router.get('/users/:id', async (req, res) => {
  const user = await User.findById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash: _, ...safe } = user;
  const orders = await Order.findByUser(user.id, 20);
  res.json({ user: safe, orders });
});

router.get('/chat/rooms', async (_req, res) => {
  const rooms = await Chat.activeRooms();
  res.json({ rooms });
});

router.get('/chat/:roomId', async (req, res) => {
  const messages = await Chat.history(req.params.roomId, 200);
  res.json({ messages });
});

router.get('/products', async (_req, res) => {
  res.json({ products: await Product.listAll() });
});

router.patch('/products/:id', async (req, res) => {
  const product = await Product.findById(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await Product.update({ ...product, ...req.body, id: product.id });
  res.json({ ok: true, product: await Product.findById(product.id) });
});

module.exports = router;
