require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

require('./src/models/db');
require('./db/seed');

const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const cartRoutes = require('./src/routes/cart');
const checkoutRoutes = require('./src/routes/checkout');
const rewardsRoutes = require('./src/routes/rewards');
const referralRoutes = require('./src/routes/referrals');
const trackingRoutes = require('./src/routes/tracking');
const chatRoutes = require('./src/routes/chat');
const { initSocket } = require('./src/services/socket');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

app.use(
  helmet({
    // The landing page relies on Google Fonts, inline styles on a few elements,
    // and a data: URI SVG noise texture. Relax CSP accordingly.
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
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { error: 'Rate limit exceeded' } });
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.JWT_SECRET || 'dev-cookie-secret'));

app.use(
  express.static(path.join(__dirname, 'public'), {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  })
);

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'thapill', time: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/tracking', trackingRoutes);

app.get('/tracking', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tracking.html'));
});
app.get('/tracking/:orderNumber', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tracking.html'));
});

app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.get('/order/success/:orderNumber', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-success.html'));
});

app.get('/api/products', (_req, res) => {
  const Product = require('./src/models/product');
  res.json(Product.listActive());
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((err, _req, res, _next) => {
  console.error('[thapill] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const http = require('http');
  const { Server } = require('socket.io');
  const server = http.createServer(app);
  const io = new Server(server);
  initSocket(io);
  server.listen(PORT, () => {
    console.log(`thaPill server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
