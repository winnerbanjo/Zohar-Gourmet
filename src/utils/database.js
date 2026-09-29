// Server state is authoritative. Browser storage is read only for an explicit legacy import.
let snapshot = null;
let latestRequest = 0;
let writeQueue = Promise.resolve();
let refreshPending;
export const getSnapshot = () => snapshot;
const notify = () => window.dispatchEvent(new Event('zohar-db-update'));
async function request(body) {
  const response = await fetch('/api/store', {
    method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The store could not be reached. Please try again.');
  if (!body && (!data.settings || !Array.isArray(data.products))) throw new Error('Shared storage is not configured yet.');
  return data;
}
export async function refreshDatabase() {
  if (refreshPending) return refreshPending;
  const sequence = ++latestRequest;
  refreshPending = request().then(data => {
    if (sequence === latestRequest && JSON.stringify(data) !== JSON.stringify(snapshot)) {
      // Preserve unchanged collection references so polling does not reset menu selections.
      for (const key of ['products', 'toppings', 'reviews', 'settings', 'orders']) {
        if (snapshot && JSON.stringify(snapshot[key]) === JSON.stringify(data[key])) data[key] = snapshot[key];
      }
      snapshot = data;
      notify();
    }
    return data;
  }).finally(() => { refreshPending = null; });
  return refreshPending;
}
async function mutate(action, value, revision = snapshot?.revision) {
  const run = writeQueue.then(async () => {
    // Invalidate an older poll before committing, then fetch the confirmed server state.
    ++latestRequest;
    const result = await request({ action, value, revision });
    if (refreshPending) await refreshPending.catch(() => {});
    try { await refreshDatabase(); }
    catch { window.dispatchEvent(new Event('zohar-sync-error')); }
    return result;
  });
  writeQueue = run.catch(() => {});
  return run;
}
export function readLegacyCatalog() {
  try {
    const catalog = Object.fromEntries(['products', 'toppings', 'reviews', 'settings'].map(key => [key, JSON.parse(localStorage.getItem(`zohar_${key}`))]));
    return Object.values(catalog).every(Boolean) ? catalog : null;
  } catch { return null; }
}
export const database = {
  getProducts: () => snapshot?.products || [],
  getToppings: () => snapshot?.toppings || [],
  getReviews: () => snapshot?.reviews || [],
  getSettings: () => snapshot.settings,
  getOrders: () => snapshot?.orders || [],
  login: passcode => mutate('login', passcode),
  logout: () => mutate('logout'),
  createOrder: async value => (await mutate('createOrder', value)).order,
  updateOrderStatus: (id, status) => mutate('updateOrderStatus', { id, status }),
  importLegacy: () => mutate('importLegacy', readLegacyCatalog()),
  // Check if store is open based on hours
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
    } else {
      return false;
    }
  },

  // Format active hours text for display
  getHoursDisplay: () => {
    const settings = database.getSettings();
    return {
      weekdays: `Mon - Fri: ${formatTime(settings.openHours.weekdays.start)} - ${formatTime(settings.openHours.weekdays.end)}`,
      saturday: `Saturday: ${formatTime(settings.openHours.saturday.start)} - ${formatTime(settings.openHours.saturday.end)}`,
      sunday: 'Sunday: Closed'
    };
  },

};
for (const action of ['toggleProductStock', 'updateProduct', 'addProduct', 'deleteProduct', 'toggleToppingStock', 'updateTopping', 'addTopping', 'deleteTopping', 'addReview', 'toggleReviewApproval', 'deleteReview', 'saveSettings', 'clearAllOrders', 'resetDatabase']) {
  database[action] = (value, revision) => mutate(action, value, revision);
}
function formatTime(timeString) {
  if (!timeString) return '';
  const [hour, minute] = timeString.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${minute} ${ampm}`;
}
