// Zohar Gourmet data layer — cloud-backed with offline cache.
//
// Architecture:
//   • Cloud (Vercel serverless /api/* + Neon Postgres) is the SINGLE SOURCE OF TRUTH.
//   • localStorage is only an instant-render cache + offline fallback.
//   • Every device polls /api/changes every few seconds and refetches tables
//     whose cloud "stamp" changed — so admin edits on one phone appear on
//     every other phone within seconds.
//   • Mutations write to the cloud first, then update the cache and notify
//     the UI (same-tab listeners + cross-tab storage events still work).

import seed from './seed.json';

const INITIAL_PRODUCTS = seed.products;
const INITIAL_TOPPINGS = seed.toppings;
const INITIAL_REVIEWS = seed.reviews;
const DEFAULT_SETTINGS = seed.settings;

const POLL_INTERVAL = 4000;
const ADMIN_KEY_HEADER = 'X-Admin-Key';

// ---------------------------------------------------------------------------
// Cache helpers (localStorage = fast cache only, never the source of truth)
// ---------------------------------------------------------------------------

function readCache(key, fallback) {
  try {
    const raw = localStorage.getItem(`zohar_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(`zohar_${key}`, JSON.stringify(data));
  } catch {
    /* storage full (e.g. huge receipt images) — cloud still holds the data */
  }
}

// Seed the cache with defaults so first paint on a brand-new device is never
// empty; the first cloud sync immediately replaces this with live truth.
function seedCache() {
  if (localStorage.getItem('zohar_products') === null) writeCache('products', INITIAL_PRODUCTS);
  if (localStorage.getItem('zohar_toppings') === null) writeCache('toppings', INITIAL_TOPPINGS);
  if (localStorage.getItem('zohar_reviews') === null) writeCache('reviews', INITIAL_REVIEWS);
  if (localStorage.getItem('zohar_settings') === null) writeCache('settings', DEFAULT_SETTINGS);
  if (localStorage.getItem('zohar_orders') === null) writeCache('orders', []);
}
seedCache();

// Old orders could carry huge base64 receipts — never let them bloat the cache
// beyond ~2.5MB (localStorage quota is ~5MB per origin).
function pruneOrdersCache(orders) {
  let total = 0;
  const kept = [];
  for (const o of orders) {
    const size = o.receiptImage ? o.receiptImage.length : 0;
    if (total + size > 2_500_000) {
      kept.push({ ...o, receiptImage: '' }); // keep the order, drop the image
    } else {
      total += size;
      kept.push(o);
    }
  }
  return kept;
}

// ---------------------------------------------------------------------------
// Cloud API helpers
// ---------------------------------------------------------------------------

async function apiGet(path) {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiSend(method, path, body, { admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (admin) headers[ADMIN_KEY_HEADER] = 'zohar123';
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Change stamps + subscription (UI live refresh)
// ---------------------------------------------------------------------------

const stamps = { products: 0, toppings: 0, reviews: 0, orders: 0, settings: 0 };
const listeners = new Set();
let syncStarted = false;

function notify() {
  listeners.forEach((fn) => {
    try { fn(); } catch { /* listener error must not break others */ }
  });
  // cross-tab: other tabs (and the storage event listener) re-read the cache
  try { localStorage.setItem('zohar_db_sync_time', Date.now().toString()); } catch { /* ignore */ }
}

export const database = {
  // Register a callback fired whenever cloud data changed (this tab's writes,
  // another tab, or another device). Returns an unsubscribe function.
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // Start background polling so remote changes appear automatically.
  startSync() {
    if (syncStarted) return;
    syncStarted = true;

    const poll = () => database.syncNow().catch(() => { /* offline: cache still works */ });
    setInterval(poll, POLL_INTERVAL);
    // Refresh promptly when the user returns to the tab or comes back online
    document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
    window.addEventListener('online', poll);
    // Cross-tab: another tab wrote to the cache — refresh the UI
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('zohar_')) notify();
    });
    poll();
  },

  // One sync pass: compare cloud stamps with local ones, refetch what changed.
  async syncNow() {
    const remote = await apiGet('/api/changes');
    const jobs = [];

    for (const table of ['products', 'toppings', 'reviews', 'orders']) {
      if ((remote[table] || 0) !== stamps[table]) {
        stamps[table] = remote[table] || 0;
        jobs.push(database[`refresh_${table}`]());
      }
    }
    if ((remote.settings || 0) !== stamps.settings) {
      stamps.settings = remote.settings || 0;
      jobs.push(database.refresh_settings());
    }

    if (jobs.length > 0) {
      await Promise.all(jobs);
      notify();
    }
  },

  // Mark a table as locally up-to-date after our own successful write, so the
  // poller doesn't immediately re-download what we just uploaded.
  _touch(table) {
    stamps[table] = Date.now() + 5000; // small skew guard vs clock differences
  },

  // ---------------------------------------------------------------------------
  // PRODUCTS
  // ---------------------------------------------------------------------------

  getProducts: () => readCache('products', INITIAL_PRODUCTS),

  async refresh_products() {
    writeCache('products', await apiGet('/api/products'));
  },

  async toggleProductStock(id) {
    const products = database.getProducts();
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const updated = { ...p, inStock: !p.inStock };
    writeCache('products', products.map((x) => (x.id === id ? updated : x)));
    notify();
    await apiSend('PUT', `/api/products?id=${encodeURIComponent(id)}`, { product: updated }, { admin: true });
    database._touch('products');
  },

  async updateProduct(updatedProduct) {
    const products = database.getProducts();
    writeCache('products', products.map((x) => (x.id === updatedProduct.id ? { ...x, ...updatedProduct } : x)));
    notify();
    await apiSend('PUT', `/api/products?id=${encodeURIComponent(updatedProduct.id)}`, { product: updatedProduct }, { admin: true });
    database._touch('products');
  },

  async addProduct(productData) {
    const newProduct = { inStock: true, ...productData, id: 'prod-' + Date.now() };
    writeCache('products', [...database.getProducts(), newProduct]);
    notify();
    await apiSend('POST', '/api/products', { product: newProduct }, { admin: true });
    database._touch('products');
    return newProduct;
  },

  async deleteProduct(id) {
    writeCache('products', database.getProducts().filter((p) => p.id !== id));
    notify();
    await apiSend('DELETE', `/api/products?id=${encodeURIComponent(id)}`, null, { admin: true });
    database._touch('products');
  },

  // ---------------------------------------------------------------------------
  // TOPPINGS
  // ---------------------------------------------------------------------------

  getToppings: () => readCache('toppings', INITIAL_TOPPINGS),

  async refresh_toppings() {
    writeCache('toppings', await apiGet('/api/toppings'));
  },

  async toggleToppingStock(id) {
    const toppings = database.getToppings();
    const t = toppings.find((x) => x.id === id);
    if (!t) return;
    const updated = { ...t, inStock: !t.inStock };
    writeCache('toppings', toppings.map((x) => (x.id === id ? updated : x)));
    notify();
    await apiSend('PUT', `/api/toppings?id=${encodeURIComponent(id)}`, { topping: updated }, { admin: true });
    database._touch('toppings');
  },

  async addTopping(toppingData) {
    const newTopping = {
      id: 'top-' + Date.now(),
      inStock: true,
      price: Number(toppingData.price) || 500,
      name: toppingData.name
    };
    writeCache('toppings', [...database.getToppings(), newTopping]);
    notify();
    await apiSend('POST', '/api/toppings', { topping: newTopping }, { admin: true });
    database._touch('toppings');
    return newTopping;
  },

  async updateTopping(updatedTopping) {
    const toppings = database.getToppings();
    writeCache('toppings', toppings.map((t) => (t.id === updatedTopping.id ? { ...t, ...updatedTopping } : t)));
    notify();
    await apiSend('PUT', `/api/toppings?id=${encodeURIComponent(updatedTopping.id)}`, { topping: updatedTopping }, { admin: true });
    database._touch('toppings');
  },

  async deleteTopping(id) {
    writeCache('toppings', database.getToppings().filter((t) => t.id !== id));
    notify();
    await apiSend('DELETE', `/api/toppings?id=${encodeURIComponent(id)}`, null, { admin: true });
    database._touch('toppings');
  },

  // ---------------------------------------------------------------------------
  // REVIEWS
  // ---------------------------------------------------------------------------

  getReviews: () => readCache('reviews', INITIAL_REVIEWS),

  async refresh_reviews() {
    writeCache('reviews', await apiGet('/api/reviews'));
  },

  async addReview(reviewData) {
    const newReview = {
      id: 'rev-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      isApproved: true,
      ...reviewData
    };
    writeCache('reviews', [newReview, ...database.getReviews()]);
    notify();
    await apiSend('POST', '/api/reviews', { review: newReview }, { admin: true });
    database._touch('reviews');
    return newReview;
  },

  async toggleReviewApproval(id) {
    const reviews = database.getReviews();
    const r = reviews.find((x) => x.id === id);
    if (!r) return;
    const updated = { ...r, isApproved: !r.isApproved };
    writeCache('reviews', reviews.map((x) => (x.id === id ? updated : x)));
    notify();
    await apiSend('PUT', `/api/reviews?id=${encodeURIComponent(id)}`, { review: updated }, { admin: true });
    database._touch('reviews');
  },

  async deleteReview(id) {
    writeCache('reviews', database.getReviews().filter((r) => r.id !== id));
    notify();
    await apiSend('DELETE', `/api/reviews?id=${encodeURIComponent(id)}`, null, { admin: true });
    database._touch('reviews');
  },

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------

  getSettings: () => readCache('settings', DEFAULT_SETTINGS),

  async refresh_settings() {
    writeCache('settings', await apiGet('/api/settings'));
  },

  async saveSettings(newSettings) {
    writeCache('settings', { ...database.getSettings(), ...newSettings });
    notify();
    await apiSend('PUT', '/api/settings', { settings: newSettings }, { admin: true });
    database._touch('settings');
  },

  // ---------------------------------------------------------------------------
  // ORDERS
  // ---------------------------------------------------------------------------

  getOrders: () => readCache('orders', []),

  async refresh_orders() {
    writeCache('orders', pruneOrdersCache(await apiGet('/api/orders')));
  },

  async createOrder(orderData) {
    const newOrder = {
      id: 'ZH-' + Math.floor(100000 + Math.random() * 900000),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...orderData
    };
    writeCache('orders', pruneOrdersCache([newOrder, ...database.getOrders()]));
    notify();
    await apiSend('POST', '/api/orders', { order: newOrder }); // customers order — not admin-gated
    database._touch('orders');
    return newOrder;
  },

  // Fetch a single order straight from the cloud (order tracker).
  async getOrderById(orderId) {
    try {
      const order = await apiGet(`/api/orders?id=${encodeURIComponent(orderId)}`);
      return order;
    } catch {
      return null;
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    const orders = database.getOrders();
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    const updated = { ...target, status: newStatus };
    writeCache('orders', pruneOrdersCache(orders.map((o) => (o.id === orderId ? updated : o))));
    notify();
    await apiSend('PUT', `/api/orders?id=${encodeURIComponent(orderId)}`, { order: updated }, { admin: true });
    database._touch('orders');
  },

  // ---------------------------------------------------------------------------
  // STORE HELPERS (synchronous — computed from cached settings, like before)
  // ---------------------------------------------------------------------------

  isStoreOpen: () => {
    const settings = database.getSettings();
    const now = new Date();
    const day = now.getDay();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${hours}:${minutes}`;

    if (day >= 1 && day <= 5) {
      const { start, end } = settings.openHours.weekdays;
      return currentTimeString >= start && currentTimeString <= end;
    } else if (day === 6) {
      const { start, end } = settings.openHours.saturday;
      return currentTimeString >= start && currentTimeString <= end;
    }
    return false;
  },

  getHoursDisplay: () => {
    const settings = database.getSettings();
    return {
      weekdays: `Mon - Fri: ${formatTime(settings.openHours.weekdays.start)} - ${formatTime(settings.openHours.weekdays.end)}`,
      saturday: `Saturday: ${formatTime(settings.openHours.saturday.start)} - ${formatTime(settings.openHours.saturday.end)}`,
      sunday: 'Sunday: Closed'
    };
  },

  // ---------------------------------------------------------------------------
  // DANGER ZONE
  // ---------------------------------------------------------------------------

  async clearAllOrders() {
    writeCache('orders', []);
    notify();
    await apiSend('DELETE', '/api/orders?all=true', null, { admin: true });
    database._touch('orders');
  },

  async resetDatabase() {
    await apiSend('POST', '/api/reset', {}, { admin: true });
    localStorage.removeItem('zohar_products');
    localStorage.removeItem('zohar_toppings');
    localStorage.removeItem('zohar_reviews');
    localStorage.removeItem('zohar_orders');
    localStorage.removeItem('zohar_settings');
    seedCache();
    notify();
  },

  // One-time helper: push whatever local data a device already has into the
  // cloud (used to migrate the admin phone's existing localStorage catalog).
  async migrateLocalToCloud() {
    const push = async (table, items, admin = true) => {
      for (const item of items) {
        await apiSend('POST', `/api/${table}`, { [table.slice(0, -1)]: item }, { admin });
      }
    };
    await push('products', database.getProducts());
    await push('toppings', database.getToppings());
    await push('reviews', database.getReviews());
    await apiSend('PUT', '/api/settings', { settings: database.getSettings() }, { admin: true });
    for (const order of database.getOrders()) {
      await apiSend('POST', '/api/orders', { order });
    }
    database._touch('products');
    database._touch('toppings');
    database._touch('reviews');
    database._touch('orders');
    database._touch('settings');
  }
};

function formatTime(timeString) {
  if (!timeString) return '';
  const [hour, minute] = timeString.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${minute} ${ampm}`;
}
