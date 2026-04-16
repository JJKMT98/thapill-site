// Vercel serverless entry point — wraps the Express app.
// The DB is initialized lazily and cached across warm invocations.

const app = require('../server');

let bootPromise = null;
function ensureBooted() {
  if (!bootPromise) bootPromise = app.bootstrap();
  return bootPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureBooted();
  } catch (e) {
    console.error('[vercel] bootstrap error:', e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Database unavailable' }));
    return;
  }
  return app(req, res);
};
