import { randomUUID } from 'node:crypto';
import { getPool } from '../server/postgres.js';
import { HttpError, mutateCatalog, validateOrder, signSession, validSession, safeEqual } from '../server/store.js';

const cookie = (name, value, age) => `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.VERCEL ? '; Secure' : ''}`;
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => { const i = part.indexOf('='); return [part.slice(0, i).trim(), part.slice(i + 1)]; }));
export function createHandler(database = getPool) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    try {
      if (!['GET', 'POST'].includes(req.method)) throw new HttpError(405, 'Method not allowed.');
      const jar = cookies(req);
      const admin = validSession(jar.zohar_admin, process.env.SESSION_SECRET);
      let owner = jar.zohar_customer;
      if (!/^[0-9a-f-]{36}$/.test(owner || '')) {
        owner = randomUUID();
        res.setHeader('Set-Cookie', cookie('zohar_customer', owner, 60 * 60 * 24 * 365));
      }
      if (req.method === 'POST') {
        if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'JSON is required.');
        if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new HttpError(403, 'Invalid request origin.');
        const { action, value, revision } = req.body || {};
        if (action === 'login') {
          if (!process.env.ADMIN_PASSCODE || !process.env.SESSION_SECRET) throw new HttpError(503, 'Admin access is not configured.');
          if (!safeEqual(value, process.env.ADMIN_PASSCODE)) throw new HttpError(401, 'Incorrect passcode.');
          res.setHeader('Set-Cookie', [cookie('zohar_admin', signSession(process.env.SESSION_SECRET), 43200), cookie('zohar_customer', owner, 31536000)]);
          return res.status(200).json({ ok: true });
        }
        if (action === 'logout') {
          res.setHeader('Set-Cookie', cookie('zohar_admin', '', 0));
          return res.status(200).json({ ok: true });
        }
        if (action !== 'createOrder' && !admin) throw new HttpError(401, 'Please log in again before saving.');
        const db = await database();
        if (action === 'createOrder') {
          const order = validateOrder(value);
          await db.query('INSERT INTO zohar_orders (id, owner, data) VALUES ($1, $2, $3::jsonb)', [order.id, owner, JSON.stringify(order)]);
          return res.status(200).json({ order: { ...order, receiptImage: undefined } });
        }
        if (action === 'updateOrderStatus') {
          if (!['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'].includes(value?.status)) throw new HttpError(400, 'Invalid order status.');
          const result = await db.query(`UPDATE zohar_orders SET data = jsonb_set(data, '{status}', $2::jsonb) WHERE id = $1 RETURNING id`, [value.id, JSON.stringify(value.status)]);
          if (!result.rows.length) throw new HttpError(404, 'Order not found.');
        } else if (action === 'clearAllOrders') {
          await db.query('DELETE FROM zohar_orders');
        } else {
          const client = await db.connect();
          try {
            await client.query('BEGIN');
            const { rows: [row] } = await client.query('SELECT * FROM zohar_catalog WHERE id = 1 FOR UPDATE');
            if (String(revision) !== String(row.revision)) throw new HttpError(409, 'The store changed on another device. Refresh and review your changes before saving again.');
            if (action === 'importLegacy' && (row.imported || Number(row.revision) !== 0)) throw new HttpError(409, 'Import is only available before the first shared store edit.');
            const catalog = mutateCatalog(row.data, action, value);
            await client.query('UPDATE zohar_catalog SET data = $1::jsonb, revision = revision + 1, imported = imported OR $2 WHERE id = 1', [JSON.stringify(catalog), action === 'importLegacy']);
            if (action === 'resetDatabase') await client.query('DELETE FROM zohar_orders');
            await client.query('COMMIT');
          } catch (error) { await client.query('ROLLBACK'); throw error; }
          finally { client.release(); }
        }
        return res.status(200).json({ ok: true });
      }
      const db = await database();
      if (req.query?.receipt) {
        if (!admin) throw new HttpError(401, 'Please log in.');
        const { rows: [row] } = await db.query('SELECT data FROM zohar_orders WHERE id = $1', [req.query.receipt]);
        const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(row?.data.receiptImage || '');
        if (!match) throw new HttpError(404, 'Receipt not found.');
        res.setHeader('Content-Type', match[1]);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(Buffer.from(match[2], 'base64'));
      }
      const { rows: [row] } = await db.query('SELECT * FROM zohar_catalog WHERE id = 1');
      const { rows } = await db.query(`SELECT id, data - 'receiptImage' AS data, (COALESCE(data->>'receiptImage', '') <> '') AS has_receipt FROM zohar_orders ${admin ? '' : 'WHERE owner = $1'} ORDER BY created_at DESC LIMIT 200`, admin ? [] : [owner]);
      const orders = rows.map(order => ({ ...order.data, receiptImage: admin && order.has_receipt ? `/api/store?receipt=${encodeURIComponent(order.id)}` : '' }));
      return res.status(200).json({ ...row.data, reviews: admin ? row.data.reviews : row.data.reviews.filter(review => review.isApproved), orders, revision: String(row.revision), canImport: !row.imported && Number(row.revision) === 0, authenticated: admin });
    } catch (error) {
      if (!(error instanceof HttpError)) console.error('Store request failed:', error.message);
      return res.status(error.status || 503).json({ error: error instanceof HttpError ? error.message : 'The shared store is unavailable. Please try again shortly.' });
    }
  };
}
export default createHandler();
