const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const { ensureSession } = require('../middleware/session');
const Cart = require('../models/cart');
const Order = require('../models/order');
const Address = require('../models/address');
const Points = require('../models/points');
const Shipping = require('../models/shipping');
const db = require('../models/db');
const { generateOrderNumber } = require('../utils/order-number');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

router.post('/session', optionalAuth, ensureSession, async (req, res) => {
  try {
    const { address } = req.body;

    const items = req.user
      ? await Cart.findByUser(req.user.id)
      : await Cart.findBySession(req.sessionId);

    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

    // Resolve shipping for the destination country (falls back to visitor geo, then DEFAULT)
    const destCountry = (address?.country || req.geo?.country || 'GB').toUpperCase();
    const shipping = await Shipping.resolve(destCountry);
    if (shipping.blocked) {
      return res.status(403).json({
        error: shipping.message || `thaPill isn't shipping to ${destCountry} yet — drop your email and you'll be first in line when we plug in.`,
        blocked: true,
        country: destCountry,
      });
    }

    const subtotal = items.reduce((s, i) => s + i.price_pence * i.quantity, 0);
    const shippingPence = shipping.price_pence || 0;
    const orderNumber = await generateOrderNumber();

    let addressId = null;
    if (req.user && address) {
      const saved = await Address.create({
        user_id: req.user.id,
        label: 'shipping',
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city,
        county: address.county || null,
        postcode: address.postcode,
        country: address.country || 'GB',
        is_default: 1,
      });
      addressId = saved.id;
    }

    const pointsEarned = Math.floor(subtotal / 100) * 10;

    const order = await Order.create({
      order_number: orderNumber,
      user_id: req.user ? req.user.id : null,
      address_id: addressId,
      subtotal_pence: subtotal,
      discount_pence: 0,
      shipping_pence: shippingPence,
      total_pence: subtotal + shippingPence,
      points_earned: req.user ? pointsEarned : 0,
      points_redeemed: 0,
      stripe_session_id: null,
      notes: req.user ? null : JSON.stringify(address || {}),
    });

    for (const item of items) {
      await Order.addItem({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_pence: item.price_pence,
        total_pence: item.price_pence * item.quantity,
      });
    }

    if (stripe) {
      const lineItems = items.map((item) => ({
        price_data: {
          currency: 'gbp',
          product_data: { name: item.name, images: [BASE_URL + item.image_url] },
          unit_amount: item.price_pence,
          ...(item.type === 'subscription' ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: item.quantity,
      }));

      const hasSubscription = items.some((i) => i.type === 'subscription');
      const mode = hasSubscription ? 'subscription' : 'payment';

      const session = await stripe.checkout.sessions.create({
        mode,
        line_items: lineItems,
        success_url: `${BASE_URL}/order/success/${orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/checkout?cancelled=1`,
        customer_email: req.user ? req.user.email : undefined,
        metadata: { order_number: orderNumber, user_id: req.user ? String(req.user.id) : '0' },
        shipping_address_collection: { allowed_countries: ['GB'] },
      });

      await db.run('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [session.id, order.id]);

      if (req.user) await Cart.clearUser(req.user.id);
      else await Cart.clearSession(req.sessionId);

      return res.json({ url: session.url, order_number: orderNumber });
    }

    // No Stripe configured — mark as paid for dev/testing
    await Order.updateStatus(order.id, 'paid');
    if (req.user) {
      await Points.add({ user_id: req.user.id, amount: pointsEarned, type: 'purchase', description: `Order ${orderNumber}`, reference_id: order.id });
      const orderCount = await Order.countByUser(req.user.id);
      if (orderCount === 1) {
        await Points.add({ user_id: req.user.id, amount: 200, type: 'purchase', description: 'First order bonus', reference_id: order.id });
      }
      await Cart.clearUser(req.user.id);
    } else {
      await Cart.clearSession(req.sessionId);
    }

    res.json({ url: `/order/success/${orderNumber}`, order_number: orderNumber });
  } catch (err) {
    console.error('[checkout] session error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

router.get('/success/:orderNumber', async (req, res) => {
  const order = await Order.findByNumber(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = await Order.getItems(order.id);
  res.json({
    order_number: order.order_number,
    status: order.status,
    total_pence: order.total_pence,
    points_earned: order.points_earned,
    items: items.map((i) => ({ name: i.name, quantity: i.quantity, total_pence: i.total_pence })),
    created_at: order.created_at,
  });
});

module.exports = router;
