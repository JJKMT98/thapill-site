const express = require('express');
const router = express.Router();

const { requireAuth, requireAdmin } = require('../middleware/auth');
const Order = require('../models/order');
const User = require('../models/user');
const Shipment = require('../models/shipment');
const Chat = require('../models/chat');
const Product = require('../models/product');

router.use(requireAuth, requireAdmin);

router.get('/stats', (_req, res) => {
  const db = require('../models/db');
  const totalOrders = Order.countAll();
  const revenue = Order.revenueTotal();
  const totalUsers = User.count();
  const today = new Date().toISOString().slice(0, 10);
  const newUsersToday = db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at) = ?").get(today).c;
  const activeSubs = db.prepare("SELECT COUNT(DISTINCT user_id) as c FROM orders WHERE status != 'cancelled'").get().c;

  res.json({ totalOrders, revenue, totalUsers, newUsersToday, activeSubs });
});

router.get('/orders', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const status = req.query.status;

  let orders;
  if (status) {
    const db = require('../models/db');
    orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(status, limit, offset);
  } else {
    orders = Order.listAll(limit, offset);
  }

  res.json({ orders, total: Order.countAll() });
});

router.get('/orders/:id', (req, res) => {
  const order = Order.findById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = Order.getItems(order.id);
  const shipment = Shipment.findByOrder(order.id);
  const user = order.user_id ? User.findById(order.user_id) : null;

  res.json({
    order,
    items,
    shipment,
    user: user ? { id: user.id, uid: user.uid, email: user.email, first_name: user.first_name, last_name: user.last_name } : null,
  });
});

router.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  Order.updateStatus(Number(req.params.id), status);
  res.json({ ok: true });
});

router.get('/users', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const users = User.list(limit, offset);
  res.json({ users, total: User.count() });
});

router.get('/users/:id', (req, res) => {
  const user = User.findById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash: _, ...safe } = user;
  const orders = Order.findByUser(user.id, 20);
  res.json({ user: safe, orders });
});

router.get('/chat/rooms', (_req, res) => {
  const rooms = Chat.activeRooms();
  res.json({ rooms });
});

router.get('/chat/:roomId', (req, res) => {
  const messages = Chat.history(req.params.roomId, 200);
  res.json({ messages });
});

router.get('/products', (_req, res) => {
  res.json({ products: Product.listAll() });
});

router.patch('/products/:id', (req, res) => {
  const product = Product.findById(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  Product.update({ ...product, ...req.body, id: product.id });
  res.json({ ok: true, product: Product.findById(product.id) });
});

module.exports = router;
