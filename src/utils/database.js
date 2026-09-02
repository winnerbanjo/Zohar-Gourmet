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
    image: '/parfait_cup.jpg',
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
    image: '/parfait_cup.jpg',
    inStock: true
  },
  {
    id: 'parfait-330',
    name: 'Mini Nutty (330ml)',
    category: 'parfaits',
    description: 'Perfect portion size of yogurt, apple, granola, coconut flakes, cashew nut, almond nut, and grapes.',
    priceRegular: 3000,
    priceGreek: 4000,
    hasBaseOptions: true,
    image: '/parfait_cup.jpg',
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
    image: '/parfait_cup.jpg',
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
    image: '/yogurt_bottles_6.jpg',
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
    image: '/yogurt_bottles_4.jpg',
    inStock: true
  },
  {
    id: 'waffle-single-honey',
    name: 'Single Waffle + Honey',
    category: 'waffles',
    description: 'Freshly baked golden waffle served with premium natural honey.',
    price: 1700,
    image: '/waffles.jpg',
    inStock: true
  },
  {
    id: 'waffle-double-honey',
    name: 'Double Waffles + Honey',
    category: 'waffles',
    description: 'Two stacks of our signature golden waffles served with natural honey.',
    price: 3000,
    image: '/waffles.jpg',
    inStock: true
  },
  {
    id: 'waffle-double-honey-apples',
    name: 'Double Waffles + Honey + Apples',
    category: 'waffles',
    description: 'Two stacks of our signature golden waffles served with natural honey and fresh apple slices.',
    price: 3500,
    image: '/waffles.jpg',
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

// Initial Customer Reviews Data
const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Chidimma K.',
    rating: 5,
    comment: 'The Nutty Parfait is out of this world! Fresh crunchy granola and generous cashew portions. Umuahia needed this!',
    date: '2026-07-15',
    isApproved: true
  },
  {
    id: 'rev-2',
    name: 'Emeka O.',
    rating: 5,
    comment: 'Super fast delivery and the Greek yoghurt base is so thick and creamy. Will definitely order again.',
    date: '2026-07-22',
    isApproved: true
  },
  {
    id: 'rev-3',
    name: 'Blessing A.',
    rating: 5,
    comment: 'Golden waffles with natural honey were delivered warm and crisp. Best treat in Afara Majestic!',
    date: '2026-08-01',
    isApproved: true
  }
];

// Default Store Settings
const DEFAULT_SETTINGS = {
  whatsapp1: '+2348121040943',
  whatsapp2: '+2348086674676',
  opayNumber: '8121040943',
  opayName: 'Atuma Shalom Chiamaka',
  opayBank: 'OPay',
  address: 'Ify Jones Junction, Afara Majestic, Umuahia, Abia State',
  openHours: {
    weekdays: { start: '09:00', end: '17:00' },
    saturday: { start: '12:00', end: '17:00' }
  }
};

// Initial Database Seeding without overwriting user customizations
const initDB = () => {
  if (!localStorage.getItem('zohar_products')) {
    localStorage.setItem('zohar_products', JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem('zohar_toppings')) {
    localStorage.setItem('zohar_toppings', JSON.stringify(INITIAL_TOPPINGS));
  }
  if (!localStorage.getItem('zohar_settings')) {
    localStorage.setItem('zohar_settings', JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem('zohar_reviews')) {
    localStorage.setItem('zohar_reviews', JSON.stringify(INITIAL_REVIEWS));
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

  // Add a new product to catalog
  addProduct: (productData) => {
    const products = database.getProducts();
    const newProduct = {
      id: 'prod-' + Date.now(),
      inStock: true,
      ...productData
    };
    products.push(newProduct);
    localStorage.setItem('zohar_products', JSON.stringify(products));
    broadcastUpdate();
    return newProduct;
  },

  // Delete product from catalog
  deleteProduct: (id) => {
    const products = database.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem('zohar_products', JSON.stringify(filtered));
    broadcastUpdate();
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

  // Add a new topping
  addTopping: (toppingData) => {
    const toppings = database.getToppings();
    const newTopping = {
      id: 'top-' + Date.now(),
      inStock: true,
      price: Number(toppingData.price) || 500,
      name: toppingData.name
    };
    toppings.push(newTopping);
    localStorage.setItem('zohar_toppings', JSON.stringify(toppings));
    broadcastUpdate();
    return newTopping;
  },

  // Update existing topping
  updateTopping: (updatedTopping) => {
    const toppings = database.getToppings();
    const index = toppings.findIndex(t => t.id === updatedTopping.id);
    if (index !== -1) {
      toppings[index] = { ...toppings[index], ...updatedTopping };
      localStorage.setItem('zohar_toppings', JSON.stringify(toppings));
      broadcastUpdate();
    }
  },

  // Delete topping
  deleteTopping: (id) => {
    const toppings = database.getToppings();
    const filtered = toppings.filter(t => t.id !== id);
    localStorage.setItem('zohar_toppings', JSON.stringify(filtered));
    broadcastUpdate();
  },

  // Get all reviews
  getReviews: () => {
    return JSON.parse(localStorage.getItem('zohar_reviews')) || INITIAL_REVIEWS;
  },

  // Add a review
  addReview: (reviewData) => {
    const reviews = database.getReviews();
    const newReview = {
      id: 'rev-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      isApproved: true,
      ...reviewData
    };
    reviews.unshift(newReview);
    localStorage.setItem('zohar_reviews', JSON.stringify(reviews));
    broadcastUpdate();
    return newReview;
  },

  // Toggle review approval
  toggleReviewApproval: (id) => {
    const reviews = database.getReviews();
    const index = reviews.findIndex(r => r.id === id);
    if (index !== -1) {
      reviews[index].isApproved = !reviews[index].isApproved;
      localStorage.setItem('zohar_reviews', JSON.stringify(reviews));
      broadcastUpdate();
    }
  },

  // Delete review
  deleteReview: (id) => {
    const reviews = database.getReviews();
    const filtered = reviews.filter(r => r.id !== id);
    localStorage.setItem('zohar_reviews', JSON.stringify(filtered));
    broadcastUpdate();
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
      id: 'ZH-' + Math.floor(100000 + Math.random() * 900000),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...orderData
    };
    orders.unshift(newOrder);
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

  // Clear all order history
  clearAllOrders: () => {
    localStorage.setItem('zohar_orders', JSON.stringify([]));
    broadcastUpdate();
  },

  // Reset all settings, inventory and reviews to defaults
  resetDatabase: () => {
    localStorage.removeItem('zohar_products');
    localStorage.removeItem('zohar_toppings');
    localStorage.removeItem('zohar_settings');
    localStorage.removeItem('zohar_reviews');
    localStorage.removeItem('zohar_orders');
    initDB();
    broadcastUpdate();
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
