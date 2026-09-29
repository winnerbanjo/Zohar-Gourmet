// CRUD endpoints for the reviews table.
// GET    /api/reviews?approvedOnly=true  -> list reviews (optionally only approved)
// POST   /api/reviews                    -> create review { review }
// PUT    /api/reviews?id=                -> update review { review }
// DELETE /api/reviews?id=                -> delete review

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
      const { rows } = await db.query('SELECT data FROM reviews ORDER BY updated_at ASC');
      let reviews = rows.map((r) => r.data);
      if (req.query.approvedOnly === 'true') {
        reviews = reviews.filter((r) => r.isApproved);
      }
      return res.status(200).json(reviews);
    }

    if (req.method === 'POST') {
      const review = req.body && req.body.review;
      if (!review || !review.id) return res.status(400).json({ error: 'review with id required' });
      await db.query(
        'INSERT INTO reviews (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()',
        [review.id, JSON.stringify(review)]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const review = req.body && req.body.review;
      if (!id || !review) return res.status(400).json({ error: 'id and review required' });
      // Merge (||) for consistency with partial-update semantics
      await db.query('UPDATE reviews SET data = data || $2, updated_at = now() WHERE id = $1', [
        id,
        JSON.stringify(review)
      ]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.query('DELETE FROM reviews WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('reviews api error', err);
    return res.status(500).json({ error: 'database error' });
  }
};
