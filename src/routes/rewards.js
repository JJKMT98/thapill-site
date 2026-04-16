const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const Points = require('../models/points');

const TIERS = [
  { name: 'starter', label: 'Starter', threshold: 0, multiplier: 1, color: '--text-dim', perks: ['Base earn rate'] },
  { name: 'locked-in', label: 'Locked In', threshold: 1000, multiplier: 1.5, color: '--electric', perks: ['1.5x earn rate', 'Free shipping'] },
  { name: 'elite', label: 'Elite', threshold: 5000, multiplier: 2, color: '--neon-purple', perks: ['2x earn rate', 'Free shipping', 'Early access', 'Priority support'] },
];

const EARN_ACTIONS = [
  { key: 'signup', label: 'Sign up', points: 100, oneTime: true },
  { key: 'purchase', label: 'First purchase bonus', points: 200, oneTime: true },
  { key: 'referral', label: 'Successful referral', points: 500, oneTime: false },
  { key: 'review', label: 'Leave a review', points: 50, oneTime: false },
];

router.use(requireAuth);

router.get('/', (req, res) => {
  const userId = req.user.id;
  const lifetimeEarned = Points.lifetimeEarned(userId);
  const balance = req.user.points_balance;

  let currentTier = TIERS[0];
  let nextTier = TIERS[1];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (lifetimeEarned >= TIERS[i].threshold) {
      currentTier = TIERS[i];
      nextTier = TIERS[i + 1] || null;
      break;
    }
  }

  const signupDone = Points.totalByType(userId, 'signup') > 0;
  const firstPurchaseDone = Points.totalByType(userId, 'purchase') > 0;

  const actions = EARN_ACTIONS.map(a => ({
    ...a,
    completed: (a.key === 'signup' && signupDone) || (a.key === 'purchase' && firstPurchaseDone),
  }));

  res.json({
    balance,
    lifetimeEarned,
    redemptionRate: 100,
    currentTier: { ...currentTier },
    nextTier,
    pointsToNextTier: nextTier ? Math.max(0, nextTier.threshold - lifetimeEarned) : 0,
    tierProgress: nextTier
      ? Math.min(100, Math.round(((lifetimeEarned - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100))
      : 100,
    actions,
    tiers: TIERS,
  });
});

router.get('/history', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const history = Points.history(req.user.id, limit, offset);
  res.json({ history });
});

router.get('/tiers', (_req, res) => {
  res.json({ tiers: TIERS });
});

module.exports = router;
