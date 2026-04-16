const db = require('../src/models/db');

const products = [
  {
    slug: 'try-it',
    name: 'Try It',
    description: '30 capsules — one month supply. No commitment, no subscription. Just try it.',
    price_pence: 4000,
    compare_at_pence: null,
    type: 'one-time',
    subscription_interval_days: null,
    stock: 1000,
    image_url: '/thapill-assets/hero-bottle.png',
  },
  {
    slug: 'lock-in',
    name: 'Lock In',
    description: '30 capsules delivered every month. Cancel anytime. The most popular choice.',
    price_pence: 2500,
    compare_at_pence: 4000,
    type: 'subscription',
    subscription_interval_days: 30,
    stock: 1000,
    image_url: '/thapill-assets/hero-bottle.png',
  },
  {
    slug: '3-month-bulk',
    name: '3-Month Bulk',
    description: '90 capsules — three month supply in one order. Best value per capsule.',
    price_pence: 6500,
    compare_at_pence: 12000,
    type: 'one-time',
    subscription_interval_days: null,
    stock: 1000,
    image_url: '/thapill-assets/hero-bottle.png',
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO products (slug, name, description, price_pence, compare_at_pence, type, subscription_interval_days, stock, image_url)
  VALUES (@slug, @name, @description, @price_pence, @compare_at_pence, @type, @subscription_interval_days, @stock, @image_url)
`);

const seedAll = db.transaction(() => {
  for (const p of products) insert.run(p);
});

seedAll();

const count = db.prepare('SELECT COUNT(*) as total FROM products').get().total;
console.log(`Seed complete — ${count} products in database`);
