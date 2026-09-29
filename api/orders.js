// Endpoints for the orders table.
// GET  /api/orders            -> list all orders (newest first)
// GET  /api/orders?id=ZH-...  -> fetch a single order
// POST /api/orders            -> create order { order }

const { getPool, ensureSchema, isAuthorized } = require('./db');

module.exports = async (req, res) => {
  try {
    await ensureSchema();
    const db = getPool();
    const id = req.query.id;

    // Anyone may create an order (checkout) or read one order (tracker).
    // Other mutations (PUT status updates) need the admin key.
    const mutating = req.method === 'PUT' || req.method === 'DELETE';
    if (mutating && !isAuthorized(req)) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (req.method === 'GET') {
      if (id) {
        const { rows } = await db.query('SELECT data FROM orders WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'order not found' });
        return res.status(200).json(rows[0].data);
      }
      const { rows } = await db.query('SELECT data FROM orders ORDER BY created_at DESC');
      return res.status(200).json(rows.map((r) => r.data));
    }

    if (req.method === 'POST') {
      const order = req.body && req.body.order;
      if (!order || !order.id) return res.status(400).json({ error: 'order with id required' });
      await db.query(
        'INSERT INTO orders (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [order.id, JSON.stringify(order)]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const order = req.body && req.body.order;
      if (!id || !order) return res.status(400).json({ error: 'id and order required' });
      // Merge so concurrent field updates never clobber each other
      await db.query('UPDATE orders SET data = data || $2 WHERE id = $1', [id, JSON.stringify(order)]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (req.query.all === 'true') {
        await db.query('DELETE FROM orders');
        return res.status(200).json({ ok: true });
      }
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.query('DELETE FROM orders WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('orders api error', err);
    return res.status(500).json({ error: 'database error' });
  }
};
