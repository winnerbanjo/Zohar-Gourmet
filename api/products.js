// CRUD endpoints for the products table.
// GET    /api/products       -> list all products
// POST   /api/products       -> create product   { product }
// PUT    /api/products?id=   -> update product   { product }
// DELETE /api/products?id=   -> delete product

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
      const { rows } = await db.query('SELECT data FROM products ORDER BY updated_at ASC');
      return res.status(200).json(rows.map((r) => r.data));
    }

    if (req.method === 'POST') {
      const product = req.body && req.body.product;
      if (!product || !product.id) return res.status(400).json({ error: 'product with id required' });
      await db.query(
        'INSERT INTO products (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()',
        [product.id, JSON.stringify(product)]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const product = req.body && req.body.product;
      if (!id || !product) return res.status(400).json({ error: 'id and product required' });
      // Merge (||) so partial updates keep untouched fields like inStock
      await db.query('UPDATE products SET data = data || $2, updated_at = now() WHERE id = $1', [
        id,
        JSON.stringify(product)
      ]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('products api error', err);
    return res.status(500).json({ error: 'database error' });
  }
};
