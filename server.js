require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const db = require('./src/models/db');

const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const cartRoutes = require('./src/routes/cart');
const checkoutRoutes = require('./src/routes/checkout');
const rewardsRoutes = require('./src/routes/rewards');
const referralRoutes = require('./src/routes/referrals');
const trackingRoutes = require('./src/routes/tracking');
const chatRoutes = require('./src/routes/chat');
const adminRoutes = require('./src/routes/admin');
const shippingRoutes = require('./src/routes/shipping');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        "font-src": ["'self'", 'https://fonts.gstatic.com', 'data:'],
        "img-src": ["'self'", 'data:', 'blob:'],
        "connect-src": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());
app.use(cors({ origin: true, credentials: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts, try again later' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, message: { error: 'Rate limit exceeded' } });
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.JWT_SECRET || 'dev-cookie-secret'));

app.use(
  express.static(path.join(__dirname, 'public'), {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  })
);

app.get('/healthz', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, service: 'thapill', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shipping', shippingRoutes);

app.get('/tracking', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'tracking.html')));
app.get('/tracking/:orderNumber', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'tracking.html')));
app.get('/order/success/:orderNumber', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'order-success.html')));

app.get('/api/products', async (_req, res) => {
  const Product = require('./src/models/product');
  res.json(await Product.listActive());
});

const { ensureSession } = require('./src/middleware/session');
app.get('/api/geo', ensureSession, (req, res) => {
  res.json({
    country: req.geo?.country || null,
    city: req.geo?.city || null,
    region: req.geo?.region || null,
  });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((err, _req, res, _next) => {
  console.error('[thapill] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function bootstrap() {
  await db.init();
  const { seed } = require('./db/seed');
  await seed();
}

if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => {
      console.log(`thaPill server listening on http://localhost:${PORT}`);
    });
  }).catch((e) => { console.error('Bootstrap failed:', e); process.exit(1); });
}

module.exports = app;
module.exports.bootstrap = bootstrap;
