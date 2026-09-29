import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { initialize } from '../server/postgres.js';
import { createHandler } from '../api/store.js';
import { initialCatalog } from '../src/utils/defaults.js';
import { signSession, validSession } from '../server/store.js';

process.env.ADMIN_PASSCODE = 'test-only-passcode';
process.env.SESSION_SECRET = 'test-only-secret-for-cookie-signing';
const pg = new PGlite();
await initialize(pg);
const db = { query: (...args) => pg.query(...args), connect: async () => ({ query: (...args) => pg.query(...args), release() {} }) };
const handler = createHandler(async () => db);
function browser() {
  const jar = {};
  return async (body, query = {}) => {
    let status; let data; const headers = {};
    await handler({ method: body ? 'POST' : 'GET', body, query, headers: { 'content-type': 'application/json', cookie: Object.entries(jar).map(([k,v]) => `${k}=${v}`).join('; '), host: 'localhost', origin: 'http://localhost' } }, {
      setHeader(k, v) { headers[k] = v; }, status(value) { status = value; return this; }, json(value) { data = value; }, send(value) { data = value; },
    });
    for (const item of [headers['Set-Cookie']].flat().filter(Boolean)) {
      const [key, value] = item.split(';')[0].split('='); jar[key] = value;
    }
    return { status, data, headers };
  };
}

test('shared store: independent devices, auth, migration, concurrency and private orders', async () => {
  const admin = browser(); const phone = browser(); const stranger = browser();
  assert.equal((await admin({ action: 'login', value: 'wrong' })).status, 401);
  assert.equal((await phone({ action: 'saveSettings', value: initialCatalog.settings })).status, 401);
  assert.equal((await admin({ action: 'login', value: process.env.ADMIN_PASSCODE })).status, 200);
  let state = (await admin()).data;
  const legacy = structuredClone(initialCatalog);
  legacy.products[0].priceRegular = 4700;
  assert.equal((await admin({ action: 'importLegacy', value: legacy, revision: state.revision })).status, 200);
  state = (await phone()).data;
  assert.equal(state.products[0].priceRegular, 4700);
  assert.match((await phone()).headers['Cache-Control'], /no-store/);
  assert.equal((await admin({ action: 'importLegacy', value: legacy, revision: state.revision })).status, 409);
  const staleRevision = state.revision;
  assert.equal((await admin({ action: 'toggleProductStock', value: legacy.products[0].id, revision: staleRevision })).status, 200);
  assert.equal((await phone()).data.products[0].inStock, false);
  assert.equal((await admin({ action: 'updateProduct', value: legacy.products[0], revision: staleRevision })).status, 409);
  state = (await admin()).data;
  const settings = { ...state.settings, address: 'A shared shop address' };
  assert.equal((await admin({ action: 'saveSettings', value: settings, revision: state.revision })).status, 200);
  assert.equal((await phone()).data.settings.address, 'A shared shop address');
  state = (await admin()).data;
  assert.equal((await admin({ action: 'addTopping', value: { name: 'Honey', price: 0 }, revision: state.revision })).status, 200);
  assert.equal((await phone()).data.toppings.at(-1).price, 0);
  state = (await admin()).data;
  assert.equal((await admin({ action: 'addReview', value: { name: 'Customer', rating: 5, comment: 'Great', isApproved: false }, revision: state.revision })).status, 200);
  assert.equal((await admin()).data.reviews.length, (await phone()).data.reviews.length + 1);
  const order = { customerName: 'Customer', customerPhone: '08012345678', deliveryMethod: 'pickup', deliveryAddress: 'Store Pickup', items: [{ name: 'Yoghurt', price: 1200, quantity: 1 }], subtotal: 1200, deliveryFee: 0, total: 1200, receiptImage: 'data:image/png;base64,YQ==' };
  const saved = await phone({ action: 'createOrder', value: order });
  assert.equal(saved.status, 200);
  assert.equal((await admin()).data.orders[0].id, saved.data.order.id);
  assert.equal((await stranger()).data.orders.length, 0);
  assert.equal((await stranger(undefined, { receipt: saved.data.order.id })).status, 401);
  assert.equal((await admin(undefined, { receipt: saved.data.order.id })).status, 200);
  assert.equal((await admin({ action: 'updateOrderStatus', value: { id: saved.data.order.id, status: 'Preparing' } })).status, 200);
  assert.equal((await phone()).data.orders[0].status, 'Preparing');
  assert.equal((await phone({ action: 'createOrder', value: { ...order, total: -1 } })).status, 400);
  state = (await admin()).data;
  assert.equal((await admin({ action: 'updateProduct', value: { ...state.products[0], price: -5 }, revision: state.revision })).status, 400);
  assert.equal((await admin()).data.revision, state.revision, 'failed write rolls back revision');
  await initialize(pg);
  assert.equal((await phone()).data.settings.address, 'A shared shop address', 'deployment initialization preserves data');
  assert.equal((await admin({ action: 'logout' })).status, 200);
  assert.equal((await admin()).data.authenticated, false);
  assert.equal((await admin({ action: 'clearAllOrders' })).status, 401);
  await pg.close();
});

test('expired and forged sessions fail', () => {
  const secret = process.env.SESSION_SECRET;
  assert.equal(validSession(signSession(secret), secret), true);
  assert.equal(validSession(signSession(secret, Date.now() - 100), secret), false);
  assert.equal(validSession(signSession('other-secret'), secret), false);
});
