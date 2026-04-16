const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const Referral = require('../models/referral');
const User = require('../models/user');

router.use(requireAuth);

router.get('/', async (req, res) => {
  const [referrals, count] = await Promise.all([
    Referral.listByReferrer(req.user.id),
    Referral.countByReferrer(req.user.id),
  ]);

  const signedUp = referrals.filter(r => r.status === 'signed-up').length;
  const purchased = referrals.filter(r => ['first-purchase', 'rewarded'].includes(r.status)).length;
  const totalPoints = referrals.reduce((s, r) => s + (r.reward_points || 0), 0);

  res.json({
    referral_code: req.user.referral_code,
    link: (process.env.BASE_URL || 'http://localhost:3000') + '/?ref=' + req.user.referral_code,
    stats: { total: count, signedUp, purchased, totalPoints },
    referrals: referrals.map(r => ({
      first_name: r.first_name,
      status: r.status,
      reward_points: r.reward_points,
      created_at: r.created_at,
    })),
  });
});

router.get('/leaderboard', async (_req, res) => {
  const board = await Referral.leaderboard(10);
  res.json({
    leaderboard: board.map((r, i) => ({
      rank: i + 1,
      name: r.first_name.charAt(0) + '.' + r.last_name.charAt(0) + '.',
      count: r.referral_count,
      points: r.total_points || 0,
    })),
  });
});

router.post('/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  const user = await User.findByReferral(code.toUpperCase().trim());
  res.json({ valid: !!user });
});

module.exports = router;
