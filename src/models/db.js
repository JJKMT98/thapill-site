const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Get a free Postgres at https://neon.tech and set it in your environment.');
}

const needsSSL = /neon|supabase|render|aws|azure|heroku/i.test(connectionString) || /sslmode=require/i.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => console.error('[pg] pool error:', err));

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function one(text, params) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

async function many(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

async function run(text, params) {
  const res = await pool.query(text, params);
  return { changes: res.rowCount, lastInsertRowid: res.rows[0]?.id };
}

async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

let initialized = false;
async function init() {
  if (initialized) return;
  const schema = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema.sql'), 'utf-8');
  await pool.query(schema);
  initialized = true;
}

module.exports = { pool, query, one, many, run, transaction, init };
