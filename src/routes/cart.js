const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const { ensureSession } = require('../middleware/session');
const Cart = require('../models/cart');
const Product = require('../models/product');

router.use(optionalAuth, ensureSession);

router.get('/', (req, res) => {
  const items = req.user
    ? Cart.findByUser(req.user.id)
    : Cart.findBySession(req.sessionId);
  res.json({ items, total_pence: items.reduce((s, i) => s + i.price_pence * i.quantity, 0) });
});

router.get('/count', (req, res) => {
  const count = req.user
    ? Cart.countByUser(req.user.id)
    : Cart.countBySession(req.sessionId);
  res.json({ count });
});

router.post('/add', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id is required' });

  const product = Product.findById(product_id);
  if (!product || !product.active) return res.status(404).json({ error: 'Product not found' });

  if (req.user) {
    Cart.addForUser(req.user.id, product_id, quantity);
  } else {
    Cart.addForSession(req.sessionId, product_id, quantity);
  }

  const items = req.user
    ? Cart.findByUser(req.user.id)
    : Cart.findBySession(req.sessionId);
  res.json({ items, total_pence: items.reduce((s, i) => s + i.price_pence * i.quantity, 0) });
});

router.patch('/:id', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

  const item = Cart.findItem(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  if (req.user && item.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (!req.user && item.session_id !== req.sessionId) return res.status(403).json({ error: 'Forbidden' });

  Cart.updateQty(item.id, quantity);

  const items = req.user
    ? Cart.findByUser(req.user.id)
    : Cart.findBySession(req.sessionId);
  res.json({ items, total_pence: items.reduce((s, i) => s + i.price_pence * i.quantity, 0) });
});

router.delete('/:id', (req, res) => {
  const item = Cart.findItem(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  if (req.user && item.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (!req.user && item.session_id !== req.sessionId) return res.status(403).json({ error: 'Forbidden' });

  Cart.remove(item.id);

  const items = req.user
    ? Cart.findByUser(req.user.id)
    : Cart.findBySession(req.sessionId);
  res.json({ items, total_pence: items.reduce((s, i) => s + i.price_pence * i.quantity, 0) });
});

router.post('/merge', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Must be logged in to merge cart' });
  Cart.mergeGuestCart(req.user.id, req.sessionId);
  const items = Cart.findByUser(req.user.id);
  res.json({ items, total_pence: items.reduce((s, i) => s + i.price_pence * i.quantity, 0) });
});

module.exports = router;
