const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const Pricing = require('../models/pricing');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const country = ((req.query.country || req.geo?.country || '') + '').toUpperCase();
  const items = await Wishlist.findByUser(req.user.id);
  const enriched = await Promise.all(items.map(async (it) => {
    const override = await Pricing.resolve(it.product_id, country);
    return {
      ...it,
      resolved_price: override
        ? { amount_minor: override.amount_minor, currency: override.currency, country: override.country, is_override: true }
        : { amount_minor: it.price_pence, currency: 'GBP', country: country || null, is_override: false },
    };
  }));
  res.json({ items: enriched });
});

router.post('/add', async (req, res) => {
  const { slug, product_id } = req.body || {};
  if (!slug && !product_id) return res.status(400).json({ error: 'slug or product_id is required' });
  const product = slug ? await Product.findBySlug(slug) : await Product.findById(product_id);
  if (!product || !product.active) return res.status(404).json({ error: 'Product not found' });
  await Wishlist.add(req.user.id, product.id);
  res.json({ ok: true, product_id: product.id });
});

router.delete('/:productId', async (req, res) => {
  const productId = Number(req.params.productId);
  if (!productId) return res.status(400).json({ error: 'invalid product_id' });
  await Wishlist.remove(req.user.id, productId);
  res.json({ ok: true });
});

router.get('/count', async (req, res) => {
  res.json({ count: await Wishlist.count(req.user.id) });
});

module.exports = router;
