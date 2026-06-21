// Local Storage Database with Multi-Tab Live Sync for Zohar Gourmet

// Initial Products Data
const INITIAL_PRODUCTS = [
  {
    id: 'nutty-500',
    name: 'Nutty Parfait (500ml)',
    category: 'parfaits',
    description: 'Rich layers of fresh yogurt, apple, granola, coconut flakes, cashew nut, almond nut, and grapes.',
    priceRegular: 4000,
    priceGreek: 5000,
    hasBaseOptions: true,
    image: '/parfait_cup.jpg', // Client parfait image
    inStock: true
  },
  {
    id: 'regular-500',
    name: 'Regular Parfait (500ml)',
    category: 'parfaits',
    description: 'Refreshing parfait with layers of fresh yogurt, apple, granola, coconut flakes, and grapes.',
    priceRegular: 3000,
    priceGreek: 4000,
    hasBaseOptions: true,
    image: '/parfait_cup.jpg', // Client parfait image
    inStock: true
  },
  {
    id: 'parfait-330',
    name: 'Classic Parfait (330ml)',
    category: 'parfaits',
    description: 'Perfect portion size of yogurt, apple, granola, coconut flakes, cashew nut, almond nut, and grapes.',
    priceRegular: 3000,
    priceGreek: 4000,
    hasBaseOptions: true,
    image: '/parfait_cup.jpg', // Client parfait image
    inStock: true
  },
  {
    id: 'biggy-1000',
    name: 'Biggy Parfait (1 Litre)',
    category: 'parfaits',
    description: 'The ultimate yogurt feast! 1 Litre of layers containing apple, granola, coconut flakes, cashew, almond, and grapes.',
    priceRegular: 6500,
    priceGreek: 7500,
    hasBaseOptions: true,
    image: '/parfait_cup.jpg', // Client parfait image
    inStock: true
  },
  {
    id: 'yoghurt-25cl',
    name: 'Premium Yoghurt Bottle (25 Cl)',
    category: 'yoghurts',
    description: 'Rich in calcium, high in protein, rich in Vitamin B. Available in Classic Cream and Sweet Strawberry.',
    price: 1200,
    pack6Price: 7000,
    pack12Price: 14000,
    hasPackOptions: true,
    image: '/yogurt_bottles_6.jpg', // Client wrapped pack
    inStock: true
  },
  {
    id: 'yoghurt-35cl',
    name: 'Premium Yoghurt Bottle (35 Cl)',
    category: 'yoghurts',
    description: 'Rich in calcium, high in protein, rich in Vitamin B. Available in Classic Cream and Sweet Strawberry.',
    price: 1800,
    pack6Price: 10500,
    pack12Price: 21000,
    hasPackOptions: true,
    image: '/yogurt_bottles_4.jpg', // Client 4 bottles
    inStock: true
  },
  {
    id: 'waffle-single',
    name: 'Single Golden Waffle',
    category: 'waffles',
    description: 'Freshly baked golden waffle served with premium chocolate syrup or maple glaze.',
    price: 1500,
    image: '/waffles.jpg', // Client waffles stack
    inStock: true
  },
  {
    id: 'waffle-double',
    name: 'Double Waffle Stack',
    category: 'waffles',
    description: 'Two stacks of our signature golden waffles with syrup, granola, and sliced grapes.',
    price: 2800,
    image: '/waffles.jpg', // Client waffles stack
    inStock: true
  }
];

// Initial Customizer Data
const INITIAL_TOPPINGS = [
  { id: 'apple', name: 'Fresh Apple Slices', price: 500, inStock: true },
  { id: 'granola', name: 'Crunchy Granola', price: 500, inStock: true },
  { id: 'coconut', name: 'Toasted Coconut Shavings', price: 500, inStock: true },
  { id: 'cashew', name: 'Premium Cashew Nuts', price: 700, inStock: true },
  { id: 'almond', name: 'Sliced Almond Nuts', price: 700, inStock: true },
  { id: 'grape', name: 'Fresh Sweet Grapes', price: 500, inStock: true }
];

// Default Store Settings
const DEFAULT_SETTINGS = {
  whatsapp1: '+2348121040943',
  whatsapp2: '+2348086674676',
  opayNumber: '8121040943',
  opayName: 'ZOHAR GOURMET',
  opayBank: 'OPay',
  address: 'Ify Jones Junction, Afara Majestic, Umuahia, Abia State',
  openHours: {
    weekdays: { start: '09:00', end: '17:00' }, // Mon-Fri 9am - 5pm
    saturday: { start: '12:00', end: '17:00' }  // Sat 12pm - 5pm
  }
};

// Initial Database Seeding
const initDB = () => {
  const storedProducts = localStorage.getItem('zohar_products');
  if (!storedProducts) {
    localStorage.setItem('zohar_products', JSON.stringify(INITIAL_PRODUCTS));
  } else {
    // Migration: Update image paths to local copied assets if they are Unsplash
    try {
      const parsed = JSON.parse(storedProducts);
      let updated = false;
      parsed.forEach(p => {
        const matchingInitial = INITIAL_PRODUCTS.find(i => i.id === p.id);
        if (matchingInitial && (p.image.includes('unsplash.com') || p.image !== matchingInitial.image)) {
          p.image = matchingInitial.image;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('zohar_products', JSON.stringify(parsed));
      }
    } catch (e) {
      localStorage.setItem('zohar_products', JSON.stringify(INITIAL_PRODUCTS));
    }
  }

  if (!localStorage.getItem('zohar_toppings')) {
    localStorage.setItem('zohar_toppings', JSON.stringify(INITIAL_TOPPINGS));
  }
  if (!localStorage.getItem('zohar_settings')) {
    localStorage.setItem('zohar_settings', JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem('zohar_orders')) {
    localStorage.setItem('zohar_orders', JSON.stringify([]));
  }
};

// Seed db immediately on file import
initDB();

// Trigger a custom event in the current tab and rely on storage event for other tabs
const broadcastUpdate = () => {
  window.dispatchEvent(new Event('zohar-db-update'));
  // Update storage timestamp to trigger the storage event in other tabs
  localStorage.setItem('zohar_db_sync_time', Date.now().toString());
};

export const database = {
  // Get all products
  getProducts: () => {
    return JSON.parse(localStorage.getItem('zohar_products')) || INITIAL_PRODUCTS;
  },

  // Update product stock status
  toggleProductStock: (id) => {
    const products = database.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index].inStock = !products[index].inStock;
      localStorage.setItem('zohar_products', JSON.stringify(products));
      broadcastUpdate();
    }
  },

  // Update product price or details (Admin customization)
  updateProduct: (updatedProduct) => {
    const products = database.getProducts();
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct };
      localStorage.setItem('zohar_products', JSON.stringify(products));
      broadcastUpdate();
    }
  },

  // Get all toppings
  getToppings: () => {
    return JSON.parse(localStorage.getItem('zohar_toppings')) || INITIAL_TOPPINGS;
  },

  // Toggle topping stock status
  toggleToppingStock: (id) => {
    const toppings = database.getToppings();
    const index = toppings.findIndex(t => t.id === id);
    if (index !== -1) {
      toppings[index].inStock = !toppings[index].inStock;
      localStorage.setItem('zohar_toppings', JSON.stringify(toppings));
      broadcastUpdate();
    }
  },

  // Get Store Settings
  getSettings: () => {
    return JSON.parse(localStorage.getItem('zohar_settings')) || DEFAULT_SETTINGS;
  },

  // Save Store Settings
  saveSettings: (newSettings) => {
    localStorage.setItem('zohar_settings', JSON.stringify(newSettings));
    broadcastUpdate();
  },

  // Get all orders
  getOrders: () => {
    return JSON.parse(localStorage.getItem('zohar_orders')) || [];
  },

  // Create/Save a new order
  createOrder: (orderData) => {
    const orders = database.getOrders();
    const newOrder = {
      id: 'ZH-' + Math.floor(100000 + Math.random() * 900000), // Random 6 digit ID
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...orderData
    };
    orders.unshift(newOrder); // Add to the beginning
    localStorage.setItem('zohar_orders', JSON.stringify(orders));
    broadcastUpdate();
    return newOrder;
  },

  // Update order status
  updateOrderStatus: (orderId, newStatus) => {
    const orders = database.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = newStatus;
      localStorage.setItem('zohar_orders', JSON.stringify(orders));
      broadcastUpdate();
    }
  },

  // Check if store is open based on hours
  isStoreOpen: () => {
    const settings = database.getSettings();
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    
    // Format current time as HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${hours}:${minutes}`;

    if (day >= 1 && day <= 5) {
      // Mon - Fri
      const { start, end } = settings.openHours.weekdays;
      return currentTimeString >= start && currentTimeString <= end;
    } else if (day === 6) {
      // Saturday
      const { start, end } = settings.openHours.saturday;
      return currentTimeString >= start && currentTimeString <= end;
    } else {
      // Sunday (Closed)
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
  }
};

// Helper function to format HH:MM into AM/PM
function formatTime(timeString) {
  if (!timeString) return '';
  const [hour, minute] = timeString.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${minute} ${ampm}`;
}
