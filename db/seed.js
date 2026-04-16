require('dotenv').config();
const { run, one, init, pool } = require('../src/models/db');

// thaPill is a single product — these are 3 purchase options (one-time, subscription, bulk).
const products = [
  {
    slug: 'try-it',
    name: 'thaPill — Try It',
    description: '1 bottle (30 capsules). One-time purchase, no commitment.',
    price_pence: 4000,
    compare_at_pence: null,
    type: 'one-time',
    subscription_interval_days: null,
    stock: 1000,
    image_url: '/thapill-assets/hero-bottle.png',
  },
  {
    slug: 'lock-in',
    name: 'thaPill — Lock In',
    description: '1 bottle (30 capsules) delivered monthly. Cancel anytime.',
    price_pence: 2500,
    compare_at_pence: 4000,
    type: 'subscription',
    subscription_interval_days: 30,
    stock: 1000,
    image_url: '/thapill-assets/hero-bottle.png',
  },
  {
    slug: '3-month-bulk',
    name: 'thaPill — 3-Month Bulk',
    description: '3 bottles (90 capsules). Best value — one payment, three months sorted.',
    price_pence: 6500,
    compare_at_pence: 12000,
    type: 'one-time',
    subscription_interval_days: null,
    stock: 1000,
    image_url: '/thapill-assets/hero-bottle.png',
  },
];

async function seed() {
  await init();
  for (const p of products) {
    await run(
      `INSERT INTO products (slug, name, description, price_pence, compare_at_pence, type, subscription_interval_days, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO NOTHING`,
      [p.slug, p.name, p.description, p.price_pence, p.compare_at_pence, p.type, p.subscription_interval_days, p.stock, p.image_url]
    );
  }
  const { total } = await one('SELECT COUNT(*)::int as total FROM products');
  console.log(`Seed complete — ${total} products in database`);
}

module.exports = { seed };

if (require.main === module) {
  seed().then(() => pool.end()).catch((e) => { console.error(e); process.exit(1); });
}
