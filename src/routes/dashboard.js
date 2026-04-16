const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const Order = require('../models/order');
const Points = require('../models/points');
const Referral = require('../models/referral');

router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;

  const orders = Order.findByUser(userId, 5);
  const orderCount = Order.countByUser(userId);
  const pointsHistory = Points.history(userId, 10);
  const referralCount = Referral.countByReferrer(userId);

  const activeSubscription = orders.find(
    (o) => o.status !== 'cancelled' && orders.length > 0
  );

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
