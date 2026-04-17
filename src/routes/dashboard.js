const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const Order = require('../models/order');
const Points = require('../models/points');
const Referral = require('../models/referral');
const Wishlist = require('../models/wishlist');

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const [orders, orderCount, pointsHistory, lifetimeEarned, referralCount, wishlistCount] = await Promise.all([
    Order.findByUser(userId, 10),
    Order.countByUser(userId),
    Points.history(userId, 10),
    Points.lifetimeEarned(userId),
    Referral.countByReferrer(userId),
    Wishlist.count(userId),
  ]);

  // Tier progress context so the frontend can render a progress bar
  let currentTierThreshold = 0;
  let nextTierThreshold = 1000;
  let nextTierName = 'locked-in';
  if (lifetimeEarned >= 5000) {
    currentTierThreshold = 5000;
    nextTierThreshold = 5000;
    nextTierName = null;
  } else if (lifetimeEarned >= 1000) {
    currentTierThreshold = 1000;
    nextTierThreshold = 5000;
    nextTierName = 'elite';
  }

  // Enrich recent orders with their items so the dashboard can show
  // which product was bought in each — saves round-trips.
  const recentOrders = await Promise.all(orders.map(async (o) => {
    const items = await Order.getItems(o.id);
    return {
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total_pence: o.total_pence,
      subtotal_pence: o.subtotal_pence,
      shipping_pence: o.shipping_pence,
      points_earned: o.points_earned,
      created_at: o.created_at,
      items: items.map((i) => ({
        name: i.name, slug: i.slug, image_url: i.image_url,
        quantity: i.quantity, total_pence: i.total_pence,
      })),
    };
  }));

  const activeSubscription = orders.find((o) =>
    o.status !== 'cancelled' && orders.length > 0
  );

  const { password_hash: _, ...user } = req.user;

  res.json({
    user,
    stats: {
      totalOrders: orderCount,
      pointsBalance: req.user.points_balance,
      lifetimeEarned,
      referrals: referralCount,
      wishlistCount,
      hasActiveSubscription: !!activeSubscription,
      currentTierThreshold,
      nextTierThreshold,
      nextTierName,
    },
    recentOrders,
    pointsHistory: pointsHistory.map((p) => ({
      amount: p.amount,
      type: p.type,
      description: p.description,
      created_at: p.created_at,
    })),
    referral_link: (process.env.BASE_URL || 'http://localhost:3000') + '/?ref=' + req.user.referral_code,
  });
});

module.exports = router;
