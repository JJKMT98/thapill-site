// Vercel serverless entry — wraps the Express app.
// The DB is initialized lazily and cached across warm invocations.

const app = require('../server');

let bootPromise = null;
let bootError = null;

function ensureBooted() {
  if (bootError) return Promise.reject(bootError);
  if (!bootPromise) {
    bootPromise = app.bootstrap().catch((e) => {
      bootError = e;
      throw e;
    });
  }
  return bootPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureBooted();
  } catch (e) {
    const msg = (e && e.message) ? e.message : 'unknown';
    console.error('[vercel] bootstrap error:', msg, e && e.stack);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server init failed: ' + msg }));
    return;
  }
  return app(req, res);
};
