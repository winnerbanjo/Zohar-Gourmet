// Danger zone: reset the whole store back to factory seed data.
// POST /api/reset  (admin key required)

const { getPool, ensureSchema, isAuthorized } = require('./db');
const seed = require('../src/utils/seed.json');

module.exports = async (req, res) => {
  try {
    await ensureSchema();
    if (req.method !== 'POST' || !isAuthorized(req)) {
      return res.status(req.method !== 'POST' ? 405 : 401).json({ error: 'forbidden' });
    }

    const db = getPool();
    await db.query('DELETE FROM products');
    await db.query('DELETE FROM toppings');
    await db.query('DELETE FROM reviews');
    await db.query('DELETE FROM orders');
    await db.query('DELETE FROM settings');

    for (const product of seed.products) {
      await db.query('INSERT INTO products (id, data) VALUES ($1, $2)', [product.id, JSON.stringify(product)]);
    }
    for (const topping of seed.toppings) {
      await db.query('INSERT INTO toppings (id, data) VALUES ($1, $2)', [topping.id, JSON.stringify(topping)]);
    }
    for (const review of seed.reviews) {
      await db.query('INSERT INTO reviews (id, data) VALUES ($1, $2)', [review.id, JSON.stringify(review)]);
    }
    await db.query('INSERT INTO settings (id, data) VALUES ($1, $2)', ['store', JSON.stringify(seed.settings)]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('reset api error', err);
    return res.status(500).json({ error: 'database error' });
  }
};
