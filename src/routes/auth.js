const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../models/user');
const Points = require('../models/points');
const Referral = require('../models/referral');
const { generateUID, generateReferralCode } = require('../utils/uid');
const { signJWT, generateToken, setAuthCookie, clearAuthCookie } = require('../utils/tokens');
const { requireAuth } = require('../middleware/auth');
const { ensureSession } = require('../middleware/session');
const { sendVerification, sendPasswordReset } = require('../services/email');

router.use(ensureSession);

const BCRYPT_ROUNDS = 12;

const resetTokens = new Map();
const verifyTokens = new Map();

router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, referral_code } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let uid = generateUID();
    while (await User.findByUid(uid)) uid = generateUID();

    let refCode = generateReferralCode(first_name);
    while (await User.findByReferral(refCode)) refCode = generateUID();

    let referred_by = null;
    if (referral_code) {
      const referrer = await User.findByReferral(referral_code.toUpperCase().trim());
      if (referrer) referred_by = referrer.id;
    }

    const user = await User.create({
      uid,
      email: email.toLowerCase().trim(),
      password_hash,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone ? phone.trim() : null,
      referral_code: refCode,
      referred_by,
      country: (req.body.country || req.geo?.country || null),
      city: req.geo?.city || null,
      region: req.geo?.region || null,
      ip_address: req.geo?.ip || null,
      user_agent: req.geo?.ua || null,
      signup_source: req.body.source || 'website',
    });

    await Points.add({
      user_id: user.id,
      amount: 100,
      type: 'signup',
      description: 'Welcome bonus',
      reference_id: null,
    });

    if (referred_by) {
      await Referral.create({
        referrer_id: referred_by,
        referred_id: user.id,
        referral_code: referral_code.toUpperCase().trim(),
      });
    }

    const verifyToken = generateToken();
    verifyTokens.set(verifyToken, { userId: user.id, expires: Date.now() + 24 * 60 * 60 * 1000 });
    sendVerification(user, verifyToken).catch(() => {});

    const jwt = signJWT(user);
    setAuthCookie(res, jwt);

    const fresh = await User.findById(user.id);
    const { password_hash: _, ...safe } = fresh;
    res.status(201).json({ user: safe });
  } catch (err) {
    console.error('[auth] register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const jwt = signJWT(user);
    setAuthCookie(res, jwt);

    const { password_hash: _, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    console.error('[auth] login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const { password_hash: _, ...safe } = req.user;
  res.json({ user: { ...safe, is_admin: !!safe.role } });
});

router.get('/verify/:token', async (req, res) => {
  const entry = verifyTokens.get(req.params.token);
  if (!entry || Date.now() > entry.expires) {
    return res.status(400).json({ error: 'Invalid or expired verification link' });
  }

  await User.verifyEmail(entry.userId);
  verifyTokens.delete(req.params.token);

  res.redirect('/login?verified=1');
});

router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await User.findByEmail(email.toLowerCase().trim());
  if (!user) return res.json({ ok: true });

  const token = generateToken();
  resetTokens.set(token, { userId: user.id, expires: Date.now() + 60 * 60 * 1000 });

  sendPasswordReset(user, token).catch(() => {});
  res.json({ ok: true });
});

router.post('/reset/:token', async (req, res) => {
  try {
    const entry = resetTokens.get(req.params.token);
    if (!entry || Date.now() > entry.expires) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await User.updatePassword(entry.userId, hash);
    resetTokens.delete(req.params.token);

    res.json({ ok: true });
  } catch (err) {
    console.error('[auth] reset error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

module.exports = router;
