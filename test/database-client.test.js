import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCatalog } from '../src/utils/defaults.js';

test('client saves only after server confirmation and preserves old phone storage', async () => {
  globalThis.window = new EventTarget();
  const legacy = Object.fromEntries(Object.entries(initialCatalog).map(([k, v]) => [`zohar_${k}`, JSON.stringify(v)]));
  globalThis.localStorage = { getItem: key => legacy[key], setItem: () => assert.fail('Must not write legacy storage') };
  let server = { ...structuredClone(initialCatalog), orders: [], revision: '0', authenticated: false };
  let rejectWrite = false;
  let rejectRead = false;
  globalThis.fetch = async (_url, options) => {
    const body = options.body && JSON.parse(options.body);
    if (!body && rejectRead) throw new Error('Offline');
    if (body && rejectWrite) return new Response(JSON.stringify({ error: 'Save failed' }), { status: 503 });
    if (body) {
      server = { ...server, settings: body.value, revision: '1' };
      return new Response(JSON.stringify({ ok: true }));
    }
    return new Response(JSON.stringify(server));
  };
  const { database, refreshDatabase, readLegacyCatalog } = await import('../src/utils/database.js');
  await refreshDatabase();
  const products = database.getProducts();
  rejectWrite = true;
  await assert.rejects(database.saveSettings({ ...server.settings, address: 'Not saved' }), /Save failed/);
  assert.equal(database.getSettings().address, initialCatalog.settings.address);
  rejectWrite = false;
  await database.saveSettings({ ...server.settings, address: 'Shared' });
  assert.equal(database.getSettings().address, 'Shared');
  assert.equal(database.getProducts(), products, 'unrelated polling updates preserve product selections');
  assert.deepEqual(readLegacyCatalog(), initialCatalog);
  rejectRead = true;
  await assert.rejects(refreshDatabase(), /Offline/);
  assert.equal(database.getSettings().address, 'Shared', 'offline refresh never seeds default data');
});
