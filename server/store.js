import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { initialCatalog } from '../src/utils/defaults.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (message) => { throw new HttpError(400, message); };
const text = (value, max = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const money = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function validateCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') fail('Invalid store data.');
  for (const key of ['products', 'toppings', 'reviews']) {
    if (!Array.isArray(catalog[key]) || catalog[key].length > 500) fail(`Invalid ${key}.`);
    const ids = new Set();
    for (const item of catalog[key]) {
      if (!text(item.id, 100) || ids.has(item.id) || !text(item.name)) fail(`Invalid ${key} entry.`);
      ids.add(item.id);
      if (key !== 'reviews') {
        if (typeof item.inStock !== 'boolean') fail('Invalid stock status.');
        for (const field of ['price', 'priceRegular', 'priceGreek', 'pack6Price', 'pack12Price']) {
          if (item[field] !== undefined && !money(item[field])) fail('Prices must be positive numbers or zero.');
        }
      }
      if (key === 'toppings' && !money(item.price)) fail('Invalid topping price.');
      if (key === 'products') {
        if (!['parfaits', 'yoghurts', 'waffles'].includes(item.category)) fail('Invalid category.');
        if (item.hasBaseOptions ? !money(item.priceRegular) || !money(item.priceGreek) : !money(item.price)) fail('Product price is required.');
        if (item.hasPackOptions && (!money(item.pack6Price) || !money(item.pack12Price))) fail('Pack prices are required.');
        if (typeof item.image !== 'string' || !/^(\/|https:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(item.image)) fail('Invalid product image.');
      }
      if (key === 'reviews' && (!text(item.comment, 5000) || !Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5 || typeof item.isApproved !== 'boolean')) fail('Invalid review.');
    }
  }
  const settings = catalog.settings;
  if (!settings || !['whatsapp1', 'whatsapp2', 'opayNumber', 'opayName', 'opayBank', 'address'].every(key => text(settings[key]))) fail('Complete all store settings.');
  for (const day of ['weekdays', 'saturday']) {
    const hours = settings.openHours?.[day];
    if (!hours || ![hours.start, hours.end].every(value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))) fail('Invalid opening hours.');
  }
  if (Buffer.byteLength(JSON.stringify(catalog)) > 2_500_000) fail('Store images are too large. Use smaller images or hosted image URLs.');
  return catalog;
}

export function mutateCatalog(catalog, action, value) {
  if (action === 'resetDatabase') return structuredClone(initialCatalog);
  if (action === 'importLegacy') return validateCatalog(value);
  if (action === 'saveSettings') catalog.settings = value;
  else {
    const match = /^(add|update|delete|toggle)(Product|Topping|Review)(Stock|Approval)?$/.exec(action);
    if (!match) fail('Unknown action.');
    const [, verb, type] = match;
    const key = { Product: 'products', Topping: 'toppings', Review: 'reviews' }[type];
    if (verb === 'add') {
      catalog[key].push({ inStock: true, isApproved: true, date: new Date().toISOString().slice(0, 10), ...value, id: randomUUID() });
    } else {
      const id = verb === 'update' ? value?.id : value;
      const index = catalog[key].findIndex(item => item.id === id);
      if (index < 0) throw new HttpError(404, `${type} no longer exists. Refresh and try again.`);
      if (verb === 'delete') catalog[key].splice(index, 1);
      if (verb === 'update') catalog[key][index] = { ...catalog[key][index], ...value };
      if (verb === 'toggle') {
        const field = type === 'Review' ? 'isApproved' : 'inStock';
        catalog[key][index][field] = !catalog[key][index][field];
      }
    }
  }
  return validateCatalog(catalog);
}

export function validateOrder(value) {
  if (!value || !text(value.customerName, 200) || !text(value.customerPhone, 50) || !text(value.deliveryAddress, 1000) || !['delivery', 'pickup'].includes(value.deliveryMethod)) fail('Complete your contact and delivery details.');
  if (!Array.isArray(value.items) || !value.items.length || value.items.length > 100 || !['subtotal', 'deliveryFee', 'total'].every(key => money(value[key]))) fail('Invalid order.');
  if (value.items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || !money(item.price))) fail('Invalid order items.');
  if (Math.abs(value.items.reduce((sum, item) => sum + item.price * item.quantity, 0) - value.subtotal) > 0.01 || Math.abs(value.subtotal + value.deliveryFee - value.total) > 0.01) fail('Invalid order total.');
  if (value.receiptImage && !/^data:image\/(png|jpeg|webp|gif);base64,/.test(value.receiptImage)) fail('Invalid receipt image.');
  if (Buffer.byteLength(JSON.stringify(value)) > 2_500_000) fail('Receipt is too large. Please choose a smaller image.');
  return { ...value, id: `ZH-${randomUUID().toUpperCase()}`, status: 'Pending', createdAt: new Date().toISOString() };
}

export function signSession(secret, expires = Date.now() + 12 * 60 * 60 * 1000) {
  const payload = String(expires);
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
}
export function validSession(token, secret) {
  if (!secret || typeof token !== 'string') return false;
  const [expires] = token.split('.');
  return Number(expires) > Date.now() && safeEqual(token, signSession(secret, Number(expires)));
}
export function safeEqual(a, b) {
  return typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
