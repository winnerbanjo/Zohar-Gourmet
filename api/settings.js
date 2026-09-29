// Endpoints for store settings (single row with id 'store').
// GET /api/settings -> { ...settings, version }  (version bumps on every save)
// PUT /api/settings -> save settings { settings }

const { getPool, ensureSchema, isAuthorized } = require('./db');

module.exports = async (req, res) => {
  try {
    await ensureSchema();
    const db = getPool();

    if (req.method !== 'GET' && !isAuthorized(req)) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (req.method === 'GET') {
      const { rows } = await db.query("SELECT data FROM settings WHERE id = 'store'");
      const data = rows.length > 0 ? rows[0].data : {};
      return res.status(200).json({ ...data, version: data.version || 0 });
    }

    if (req.method === 'PUT') {
      const settings = req.body && req.body.settings;
      if (!settings) return res.status(400).json({ error: 'settings required' });
      // Stamp every save so clients can cheaply detect remote changes
      const withVersion = { ...settings, version: Date.now() };
      await db.query(
        "INSERT INTO settings (id, data) VALUES ('store', $1) ON CONFLICT (id) DO UPDATE SET data = $1",
        [JSON.stringify(withVersion)]
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('settings api error', err);
    return res.status(500).json({ error: 'database error' });
  }
};
