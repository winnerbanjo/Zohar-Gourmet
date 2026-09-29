// CRUD endpoints for the toppings table.
// GET    /api/toppings       -> list all toppings
// POST   /api/toppings       -> create topping   { topping }
// PUT    /api/toppings?id=   -> update topping   { topping }
// DELETE /api/toppings?id=   -> delete topping

const { getPool, ensureSchema, isAuthorized } = require('./db');

module.exports = async (req, res) => {
  try {
    await ensureSchema();
    const db = getPool();
    const id = req.query.id;

    if (req.method !== 'GET' && !isAuthorized(req)) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (req.method === 'GET') {
      const { rows } = await db.query('SELECT data FROM toppings ORDER BY updated_at ASC');
      return res.status(200).json(rows.map((r) => r.data));
    }

    if (req.method === 'POST') {
      const topping = req.body && req.body.topping;
      if (!topping || !topping.id) return res.status(400).json({ error: 'topping with id required' });
      await db.query(
        'INSERT INTO toppings (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()',
        [topping.id, JSON.stringify(topping)]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const topping = req.body && req.body.topping;
      if (!id || !topping) return res.status(400).json({ error: 'id and topping required' });
      // Merge (||) so partial updates keep untouched fields like inStock
      await db.query('UPDATE toppings SET data = data || $2, updated_at = now() WHERE id = $1', [
        id,
        JSON.stringify(topping)
      ]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.query('DELETE FROM toppings WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('toppings api error', err);
    return res.status(500).json({ error: 'database error' });
  }
};
