const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const Order = require('../models/order');
const Points = require('../models/points');
const Referral = require('../models/referral');

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const [orders, orderCount, pointsHistory, referralCount] = await Promise.all([
    Order.findByUser(userId, 5),
    Order.countByUser(userId),
    Points.history(userId, 10),
    Referral.countByReferrer(userId),
  ]);

  const activeSubscription = orders.find((o) => o.status !== 'cancelled' && orders.length > 0);

  const { password_hash: _, ...user } = req.user;

  res.json({
    user,
    stats: {
      totalOrders: orderCount,
      pointsBalance: req.user.points_balance,
      referrals: referralCount,
      hasActiveSubscription: !!activeSubscription,
    },
    recentOrders: orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total_pence: o.total_pence,
      created_at: o.created_at,
    })),
    pointsHistory: pointsHistory.map((p) => ({
      amount: p.amount,
      type: p.type,
      description: p.description,
      created_at: p.created_at,
    })),
  });
});

module.exports = router;
