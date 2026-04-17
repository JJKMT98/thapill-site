const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const { ensureSession } = require('../middleware/session');
const Cart = require('../models/cart');
const Product = require('../models/product');

router.use(optionalAuth, ensureSession);

async function fetchCart(req) {
  const items = req.user ? await Cart.findByUser(req.user.id) : await Cart.findBySession(req.sessionId);
  return { items, total_pence: items.reduce((s, i) => s + i.price_pence * i.quantity, 0) };
}

router.get('/', async (req, res) => {
  res.json(await fetchCart(req));
});

router.get('/count', async (req, res) => {
  const count = req.user ? await Cart.countByUser(req.user.id) : await Cart.countBySession(req.sessionId);
  res.json({ count });
});

router.post('/add', async (req, res) => {
  const { product_id, slug, quantity = 1 } = req.body;
  if (!product_id && !slug) return res.status(400).json({ error: 'product_id or slug is required' });

  const product = slug ? await Product.findBySlug(slug) : await Product.findById(product_id);
  if (!product || !product.active) return res.status(404).json({ error: 'Product not found' });

  if (req.user) await Cart.addForUser(req.user.id, product.id, quantity);
  else await Cart.addForSession(req.sessionId, product.id, quantity);

  res.json(await fetchCart(req));
});

router.patch('/:id', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

  const item = await Cart.findItem(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  if (req.user && item.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (!req.user && item.session_id !== req.sessionId) return res.status(403).json({ error: 'Forbidden' });

  await Cart.updateQty(item.id, quantity);
  res.json(await fetchCart(req));
});

router.delete('/:id', async (req, res) => {
  const item = await Cart.findItem(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  if (req.user && item.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (!req.user && item.session_id !== req.sessionId) return res.status(403).json({ error: 'Forbidden' });

  await Cart.remove(item.id);
  res.json(await fetchCart(req));
});

router.post('/merge', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Must be logged in to merge cart' });
  await Cart.mergeGuestCart(req.user.id, req.sessionId);
  res.json(await fetchCart(req));
});

module.exports = router;
