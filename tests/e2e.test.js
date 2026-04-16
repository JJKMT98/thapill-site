const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = 'e2e-test-secret';
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@thapill.com';

const DB_PATH = path.join(__dirname, '..', 'db', 'thapill.db');
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const app = require('../server');
let server, port;

function req(method, urlPath, body, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1', port, method, path: urlPath,
      headers: { 'Content-Type': 'application/json' },
    };
    if (cookie) options.headers.Cookie = cookie;
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed, cookie: setCookie, headers: res.headers });
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function cookies(setCookie) {
  if (!setCookie) return '';
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

function mergeCookies(existing, newCookies) {
  if (!newCookies) return existing;
  const map = {};
  (existing || '').split('; ').filter(Boolean).forEach(c => {
    const [k] = c.split('=');
    map[k] = c;
  });
  newCookies.forEach(c => {
    const pair = c.split(';')[0];
    const [k] = pair.split('=');
    map[k] = pair;
  });
  return Object.values(map).join('; ');
}

before(() => new Promise(resolve => {
  server = http.createServer(app);
  server.listen(0, () => { port = server.address().port; resolve(); });
}));

after(() => new Promise(resolve => {
  server.close(resolve);
  try { fs.unlinkSync(DB_PATH); } catch {}
  try { fs.unlinkSync(DB_PATH + '-shm'); } catch {}
  try { fs.unlinkSync(DB_PATH + '-wal'); } catch {}
}));

// ═══════════════════════════════════════════════════════════════
// FULL E2E JOURNEY
// ═══════════════════════════════════════════════════════════════

describe('E2E: Full Customer Journey', () => {
  let javedCookie = '';
  let javedUser;
  let orderNumber;

  // ── 1. Landing page & products ──────────────────────────────
  test('landing page serves 200', async () => {
    const res = await req('GET', '/');
    assert.strictEqual(res.status, 200);
  });

  test('products API returns 3 purchase options', async () => {
    const res = await req('GET', '/api/products');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 3);
    const slugs = res.body.map(p => p.slug).sort();
    assert.deepStrictEqual(slugs, ['3-month-bulk', 'lock-in', 'try-it']);
    assert.ok(res.body.every(p => p.name.startsWith('thaPill')));
  });

  // ── 2. Guest cart flow ──────────────────────────────────────
  test('guest can add item to cart and gets session cookie', async () => {
    const res = await req('POST', '/api/cart/add', { product_id: 2, quantity: 1 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 1);
    assert.strictEqual(res.body.items[0].slug, 'lock-in');
    assert.strictEqual(res.body.total_pence, 2500);
    javedCookie = cookies(res.cookie);
    assert.ok(javedCookie.includes('thapill_session'));
  });

  test('guest cart persists across requests', async () => {
    const res = await req('GET', '/api/cart', null, javedCookie);
    assert.strictEqual(res.body.items.length, 1);
  });

  test('guest cart count endpoint works', async () => {
    const res = await req('GET', '/api/cart/count', null, javedCookie);
    assert.strictEqual(res.body.count, 1);
  });

  // ── 3. Registration with referral prep ──────────────────────
  test('register Javed (referrer)', async () => {
    const res = await req('POST', '/api/auth/register', {
      email: 'javed@thapill.com', password: 'securepass123',
      first_name: 'Javed', last_name: 'Khan',
    }, javedCookie);
    assert.strictEqual(res.status, 201);
    javedUser = res.body.user;
    javedCookie = mergeCookies(javedCookie, res.cookie);

    assert.ok(javedUser.uid.startsWith('TP-'));
    assert.strictEqual(javedUser.referral_code, 'JAVED-PILL');
    assert.strictEqual(javedUser.points_balance, 100);
    assert.strictEqual(javedUser.tier, 'starter');
  });

  test('merge guest cart into Javed account', async () => {
    const res = await req('POST', '/api/cart/merge', null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 1);
    assert.strictEqual(res.body.items[0].slug, 'lock-in');
  });

  // ── 4. Authenticated cart operations ────────────────────────
  test('add another product as authenticated user', async () => {
    const res = await req('POST', '/api/cart/add', { product_id: 1 }, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 2);
  });

  test('remove one item from cart', async () => {
    const cartRes = await req('GET', '/api/cart', null, javedCookie);
    const tryItItem = cartRes.body.items.find(i => i.slug === 'try-it');
    const res = await req('DELETE', '/api/cart/' + tryItItem.id, null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 1);
  });

  // ── 5. Checkout ─────────────────────────────────────────────
  test('checkout creates order (dev mode, no Stripe)', async () => {
    const res = await req('POST', '/api/checkout/session', {
      address: { line1: '42 Tech Lane', city: 'London', postcode: 'EC2A 4BX', county: 'Greater London' },
    }, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.order_number.startsWith('TP-'));
    assert.ok(res.body.url.includes('/order/success/'));
    orderNumber = res.body.order_number;
  });

  test('order success API returns correct data', async () => {
    const res = await req('GET', '/api/checkout/success/' + orderNumber);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.order_number, orderNumber);
    assert.strictEqual(res.body.status, 'paid');
    assert.strictEqual(res.body.total_pence, 2500);
    assert.strictEqual(res.body.items.length, 1);
    assert.ok(res.body.points_earned > 0);
  });

  test('cart is empty after checkout', async () => {
    const res = await req('GET', '/api/cart', null, javedCookie);
    assert.strictEqual(res.body.items.length, 0);
  });

  // ── 6. Dashboard ────────────────────────────────────────────
  test('dashboard returns user stats with order and points', async () => {
    const res = await req('GET', '/api/dashboard', null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.uid, javedUser.uid);
    assert.strictEqual(res.body.stats.totalOrders, 1);
    assert.ok(res.body.stats.pointsBalance > 100);
    assert.strictEqual(res.body.recentOrders.length, 1);
    assert.strictEqual(res.body.recentOrders[0].order_number, orderNumber);
    assert.ok(res.body.pointsHistory.length >= 2);
  });

  test('dashboard rejects unauthenticated request', async () => {
    const res = await req('GET', '/api/dashboard');
    assert.strictEqual(res.status, 401);
  });

  // ── 7. Rewards ──────────────────────────────────────────────
  test('rewards API returns correct tier and points data', async () => {
    const res = await req('GET', '/api/rewards', null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.balance > 0);
    assert.ok(res.body.lifetimeEarned > 0);
    assert.strictEqual(res.body.currentTier.name, 'starter');
    assert.ok(res.body.nextTier);
    assert.strictEqual(res.body.nextTier.name, 'locked-in');
    assert.ok(res.body.pointsToNextTier > 0);
    assert.ok(res.body.actions.length >= 4);
    assert.ok(res.body.actions.find(a => a.key === 'signup').completed);
    assert.ok(res.body.actions.find(a => a.key === 'purchase').completed);
  });

  test('rewards history returns transactions', async () => {
    const res = await req('GET', '/api/rewards/history', null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.history.length >= 2);
    const types = res.body.history.map(h => h.type);
    assert.ok(types.includes('signup'));
    assert.ok(types.includes('purchase'));
  });

  test('tiers endpoint returns 3 tiers', async () => {
    const res = await req('GET', '/api/rewards/tiers', null, javedCookie);
    assert.strictEqual(res.body.tiers.length, 3);
  });

  // ── 8. Referral flow ────────────────────────────────────────
  let sarahCookie = '';

  test('Javed referral info is correct', async () => {
    const res = await req('GET', '/api/referrals', null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.referral_code, 'JAVED-PILL');
    assert.ok(res.body.link.includes('JAVED-PILL'));
    assert.strictEqual(res.body.stats.total, 0);
  });

  test('validate referral code', async () => {
    const res = await req('POST', '/api/referrals/validate', { code: 'JAVED-PILL' }, javedCookie);
    assert.strictEqual(res.body.valid, true);

    const bad = await req('POST', '/api/referrals/validate', { code: 'FAKE-CODE' }, javedCookie);
    assert.strictEqual(bad.body.valid, false);
  });

  test('Sarah registers with Javed referral code', async () => {
    const res = await req('POST', '/api/auth/register', {
      email: 'sarah@test.com', password: 'securepass123',
      first_name: 'Sarah', last_name: 'M',
      referral_code: 'JAVED-PILL',
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.user.referred_by);
    sarahCookie = cookies(res.cookie);
  });

  test('Javed now has 1 referral', async () => {
    const res = await req('GET', '/api/referrals', null, javedCookie);
    assert.strictEqual(res.body.stats.total, 1);
    assert.strictEqual(res.body.stats.signedUp, 1);
    assert.strictEqual(res.body.referrals[0].first_name, 'Sarah');
    assert.strictEqual(res.body.referrals[0].status, 'signed-up');
  });

  test('leaderboard shows Javed', async () => {
    const res = await req('GET', '/api/referrals/leaderboard', null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.leaderboard.length >= 1);
    assert.strictEqual(res.body.leaderboard[0].name, 'J.K.');
  });

  // ── 9. Tracking ─────────────────────────────────────────────
  test('tracking API returns order timeline', async () => {
    const res = await req('GET', '/api/tracking/' + orderNumber);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.order_number, orderNumber);
    assert.strictEqual(res.body.steps.length, 6);
    assert.ok(res.body.steps[0].completed);
    assert.ok(res.body.steps[1].completed);
    assert.strictEqual(res.body.items.length, 1);
  });

  test('tracking 404 for nonexistent order', async () => {
    const res = await req('GET', '/api/tracking/TP-FAKE-999');
    assert.strictEqual(res.status, 404);
  });

  // ── 10. Chat history ────────────────────────────────────────
  test('chat history returns empty initially', async () => {
    const res = await req('GET', '/api/chat/history', null, javedCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.messages.length, 0);
  });

  // ── 11. Admin panel ─────────────────────────────────────────
  let adminCookie = '';

  test('non-admin gets 403 on admin routes', async () => {
    const res = await req('GET', '/api/admin/stats', null, javedCookie);
    assert.strictEqual(res.status, 403);
  });

  test('register admin user', async () => {
    const res = await req('POST', '/api/auth/register', {
      email: 'admin@thapill.com', password: 'adminpass123',
      first_name: 'Admin', last_name: 'User',
    });
    assert.strictEqual(res.status, 201);
    adminCookie = cookies(res.cookie);
  });

  test('admin stats returns dashboard data', async () => {
    const res = await req('GET', '/api/admin/stats', null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.totalOrders >= 1);
    assert.ok(res.body.revenue > 0);
    assert.ok(res.body.totalUsers >= 3);
  });

  test('admin can list orders', async () => {
    const res = await req('GET', '/api/admin/orders', null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.orders.length >= 1);
  });

  test('admin can filter orders by status', async () => {
    const res = await req('GET', '/api/admin/orders?status=paid', null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.orders.every(o => o.status === 'paid'));
  });

  test('admin can view order detail', async () => {
    const listRes = await req('GET', '/api/admin/orders', null, adminCookie);
    const orderId = listRes.body.orders[0].id;
    const res = await req('GET', '/api/admin/orders/' + orderId, null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.order);
    assert.ok(res.body.items.length > 0);
  });

  test('admin can update order status', async () => {
    const listRes = await req('GET', '/api/admin/orders', null, adminCookie);
    const orderId = listRes.body.orders[0].id;
    const res = await req('PATCH', '/api/admin/orders/' + orderId + '/status', { status: 'processing' }, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.ok);
  });

  test('admin can list users', async () => {
    const res = await req('GET', '/api/admin/users', null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.users.length >= 3);
    assert.ok(res.body.users.every(u => u.uid.startsWith('TP-')));
  });

  test('admin can view user detail', async () => {
    const listRes = await req('GET', '/api/admin/users', null, adminCookie);
    const userId = listRes.body.users[0].id;
    const res = await req('GET', '/api/admin/users/' + userId, null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.user);
    assert.ok(!res.body.user.password_hash);
  });

  test('admin can list products', async () => {
    const res = await req('GET', '/api/admin/products', null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.products.length, 3);
  });

  test('admin can update product', async () => {
    const listRes = await req('GET', '/api/admin/products', null, adminCookie);
    const productId = listRes.body.products[0].id;
    const res = await req('PATCH', '/api/admin/products/' + productId, { stock: 999 }, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.product.stock, 999);
  });

  test('admin can view chat rooms', async () => {
    const res = await req('GET', '/api/admin/chat/rooms', null, adminCookie);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.rooms));
  });

  // ── 12. Guest checkout (no account) ─────────────────────────
  let guestCookie = '';
  let guestOrderNumber;

  test('guest can checkout without creating account', async () => {
    const addRes = await req('POST', '/api/cart/add', { product_id: 3 });
    guestCookie = cookies(addRes.cookie);
    assert.strictEqual(addRes.body.items.length, 1);
    assert.strictEqual(addRes.body.items[0].slug, '3-month-bulk');

    const checkoutRes = await req('POST', '/api/checkout/session', {
      address: { line1: '99 Guest Road', city: 'Manchester', postcode: 'M1 1AA' },
    }, guestCookie);
    assert.strictEqual(checkoutRes.status, 200);
    assert.ok(checkoutRes.body.order_number.startsWith('TP-'));
    guestOrderNumber = checkoutRes.body.order_number;
  });

  test('guest can track their order', async () => {
    const res = await req('GET', '/api/tracking/' + guestOrderNumber);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.order_number, guestOrderNumber);
  });

  test('guest order has no points earned', async () => {
    const res = await req('GET', '/api/checkout/success/' + guestOrderNumber);
    assert.strictEqual(res.body.points_earned, 0);
  });

  // ── 13. Auth edge cases ─────────────────────────────────────
  test('register with missing fields returns 400', async () => {
    const res = await req('POST', '/api/auth/register', { email: 'x@x.com' });
    assert.strictEqual(res.status, 400);
  });

  test('register with short password returns 400', async () => {
    const res = await req('POST', '/api/auth/register', {
      email: 'x@x.com', password: 'short', first_name: 'X', last_name: 'Y',
    });
    assert.strictEqual(res.status, 400);
  });

  test('login with nonexistent email returns 401', async () => {
    const res = await req('POST', '/api/auth/login', { email: 'nobody@x.com', password: 'whatever' });
    assert.strictEqual(res.status, 401);
  });

  test('forgot password always returns ok (no information leak)', async () => {
    const res = await req('POST', '/api/auth/forgot', { email: 'nobody@x.com' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.ok);
  });

  // ── 14. Static pages all serve 200 ─────────────────────────
  test('all frontend pages serve 200', async () => {
    const pages = ['/', '/login', '/register', '/dashboard', '/checkout', '/rewards', '/referrals', '/tracking', '/admin'];
    for (const page of pages) {
      const res = await req('GET', page);
      assert.strictEqual(res.status, 200, `${page} returned ${res.status}`);
    }
  });

  test('404 page serves with correct status', async () => {
    const res = await req('GET', '/this-does-not-exist-at-all');
    assert.strictEqual(res.status, 404);
  });

  test('healthz endpoint returns ok', async () => {
    const res = await req('GET', '/healthz');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.service, 'thapill');
  });

  // ── 15. Static assets serve correctly ───────────────────────
  test('CSS, JS, and image assets serve 200', async () => {
    const assets = ['/css/style.css', '/js/app.js', '/js/cart.js', '/js/chat.js', '/js/toast.js', '/js/nav.js', '/thapill-assets/logo.png', '/manifest.json'];
    for (const asset of assets) {
      const res = await req('GET', asset);
      assert.strictEqual(res.status, 200, `${asset} returned ${res.status}`);
    }
  });

  // ── 16. Second purchase to test points accumulation ─────────
  test('Sarah makes purchase — points accumulate correctly', async () => {
    await req('POST', '/api/cart/add', { product_id: 1 }, sarahCookie);
    const res = await req('POST', '/api/checkout/session', {
      address: { line1: '10 Code St', city: 'Bristol', postcode: 'BS1 1AA' },
    }, sarahCookie);
    assert.strictEqual(res.status, 200);

    const dashRes = await req('GET', '/api/dashboard', null, sarahCookie);
    assert.strictEqual(dashRes.body.stats.totalOrders, 1);
    // signup(100) + purchase(400=40*10) + first_order_bonus(200) = 700
    assert.strictEqual(dashRes.body.stats.pointsBalance, 700);
  });

  // ── 17. Cross-user isolation ────────────────────────────────
  test('Sarah cannot see Javed dashboard', async () => {
    const res = await req('GET', '/api/dashboard', null, sarahCookie);
    assert.strictEqual(res.body.user.email, 'sarah@test.com');
    assert.notStrictEqual(res.body.user.email, 'javed@thapill.com');
  });

  test('Sarah referrals are separate from Javed', async () => {
    const res = await req('GET', '/api/referrals', null, sarahCookie);
    assert.strictEqual(res.body.stats.total, 0);
    assert.notStrictEqual(res.body.referral_code, 'JAVED-PILL');
  });
});
