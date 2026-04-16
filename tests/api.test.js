const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const DB_PATH = require('path').join(__dirname, '..', 'db', 'thapill.db');
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const app = require('../server');
let server;
let port;

function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const options = { hostname: '127.0.0.1', port, method, path, headers: { 'Content-Type': 'application/json' } };
    if (cookie) options.headers.Cookie = cookie;
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        try { resolve({ status: res.statusCode, body: JSON.parse(data), cookie: setCookie }); }
        catch { resolve({ status: res.statusCode, body: data, cookie: setCookie }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function extractCookie(setCookie) {
  if (!setCookie) return '';
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

before(() => new Promise(resolve => {
  server = http.createServer(app);
  server.listen(0, () => { port = server.address().port; resolve(); });
}));

after(() => new Promise(resolve => {
  server.close(resolve);
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
}));

describe('Auth', () => {
  let cookie;

  test('register creates user with UID and points', async () => {
    const res = await req('POST', '/api/auth/register', { email: 'test@test.com', password: 'testpass123', first_name: 'Test', last_name: 'User' });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.user.uid.startsWith('TP-'));
    assert.strictEqual(res.body.user.points_balance, 100);
    assert.ok(res.body.user.referral_code);
    cookie = extractCookie(res.cookie);
  });

  test('GET /me returns user when authenticated', async () => {
    const res = await req('GET', '/api/auth/me', null, cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, 'test@test.com');
  });

  test('GET /me returns 401 without cookie', async () => {
    const res = await req('GET', '/api/auth/me');
    assert.strictEqual(res.status, 401);
  });

  test('duplicate registration returns 409', async () => {
    const res = await req('POST', '/api/auth/register', { email: 'test@test.com', password: 'testpass123', first_name: 'A', last_name: 'B' });
    assert.strictEqual(res.status, 409);
  });

  test('login with correct password', async () => {
    const res = await req('POST', '/api/auth/login', { email: 'test@test.com', password: 'testpass123' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.user);
  });

  test('login with wrong password returns 401', async () => {
    const res = await req('POST', '/api/auth/login', { email: 'test@test.com', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });

  test('logout clears cookie', async () => {
    const res = await req('POST', '/api/auth/logout', null, cookie);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.ok);
  });
});

describe('Cart', () => {
  let cookie;
  let itemId;

  test('guest can add to cart', async () => {
    const res = await req('POST', '/api/cart/add', { product_id: 1 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 1);
    assert.strictEqual(res.body.total_pence, 4000);
    cookie = extractCookie(res.cookie);
    itemId = res.body.items[0].id;
  });

  test('guest can get cart', async () => {
    const res = await req('GET', '/api/cart', null, cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 1);
  });

  test('guest can update quantity', async () => {
    const res = await req('PATCH', '/api/cart/' + itemId, { quantity: 2 }, cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total_pence, 8000);
  });

  test('guest can remove item', async () => {
    const res = await req('DELETE', '/api/cart/' + itemId, null, cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.items.length, 0);
  });
});

describe('Checkout', () => {
  let cookie;

  test('authenticated checkout creates order', async () => {
    const reg = await req('POST', '/api/auth/register', { email: 'buyer@test.com', password: 'testpass123', first_name: 'Buyer', last_name: 'X' });
    cookie = extractCookie(reg.cookie);

    await req('POST', '/api/cart/add', { product_id: 2 }, cookie);
    const res = await req('POST', '/api/checkout/session', { address: { line1: '1 St', city: 'London', postcode: 'SW1' } }, cookie);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.order_number.startsWith('TP-'));
    assert.ok(res.body.url.includes('/order/success/'));
  });

  test('checkout with empty cart returns 400', async () => {
    const res = await req('POST', '/api/checkout/session', { address: { line1: '1', city: 'L', postcode: 'S' } }, cookie);
    assert.strictEqual(res.status, 400);
  });
});

describe('Products', () => {
  test('GET /api/products returns 3 products', async () => {
    const res = await req('GET', '/api/products');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 3);
  });
});

describe('Health', () => {
  test('GET /healthz returns ok', async () => {
    const res = await req('GET', '/healthz');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
  });
});
