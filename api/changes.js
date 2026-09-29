// Lightweight change-detection endpoint for polling clients.
// GET /api/changes -> { products: <unix ms>, toppings, reviews, orders, settings }
// Clients compare stamps with their cache and only refetch tables that changed.

const { getPool, ensureSchema } = require('./db');

module.exports = async (req, res) => {
  try {
    await ensureSchema();
    const db = getPool();

    const stamp = async (table) => {
      try {
        const col = table === 'orders' ? 'created_at' : 'updated_at';
        const { rows } = await db.query(`SELECT COALESCE(MAX(${col}), 0) AS t FROM ${table}`);
        const t = rows[0].t;
        return t ? new Date(t).getTime() : 0;
      } catch (stampErr) {
        console.error(`changes: stamp query failed for ${table}:`, stampErr.message);
        throw stampErr;
      }
    };

    const [products, toppings, reviews, orders] = await Promise.all([
      stamp('products'),
      stamp('toppings'),
      stamp('reviews'),
      stamp('orders')
    ]);

    // Debuggability: surface stamp errors instead of silently reporting 0.
    // (A failed stamp used to return 0 forever, so devices never detected changes.)

    // settings has no updated_at column; version lives inside the JSON
    const { rows: settingsRows } = await db.query("SELECT data FROM settings WHERE id = 'store'");
    const settings = settingsRows.length > 0 && settingsRows[0].data ? settingsRows[0].data.version || 0 : 0;

    return res.status(200).json({ products, toppings, reviews, orders, settings });
  } catch (err) {
    console.error('changes api error', err);
    return res.status(500).json({ error: 'database error' });
  }
};
