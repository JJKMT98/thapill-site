const express = require('express');
const router = express.Router();

const Shipping = require('../models/shipping');
const { ensureSession } = require('../middleware/session');

router.use(ensureSession);

// GET /api/shipping — returns shipping for the visitor's country (or ?country=XX override)
router.get('/', async (req, res) => {
  const code = (req.query.country || req.geo?.country || '').toUpperCase();
  const rule = await Shipping.resolve(code);
  res.json(rule);
});

module.exports = router;
