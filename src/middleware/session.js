const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

const COOKIE_NAME = 'thapill_session';

function extractGeo(req) {
  // Vercel sets these headers; fall back to CF-* or basic headers
  const country = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || null;
  const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;
  const region = req.headers['x-vercel-ip-country-region'] || req.headers['cf-region'] || null;
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || null;
  const ua = req.headers['user-agent'] || null;
  const referrer = req.headers['referer'] || req.headers['referrer'] || null;
  return { country, city, region, ip, ua, referrer };
}

async function ensureSession(req, res, next) {
  let sid = req.cookies[COOKIE_NAME];
  const isNew = !sid;

  if (isNew) {
    sid = uuidv4();
    res.cookie(COOKIE_NAME, sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
  req.sessionId = sid;

  // Store / update session geo best-effort (don't block the request if it fails)
  if (isNew) {
    const geo = extractGeo(req);
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    db.run(
      `INSERT INTO sessions (id, country, city, region, ip_address, user_agent, referrer, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [sid, geo.country, geo.city, geo.region, geo.ip, geo.ua, geo.referrer, expires]
    ).catch(() => {});
  }

  req.geo = extractGeo(req);
  next();
}

module.exports = { ensureSession, COOKIE_NAME };
