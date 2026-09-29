// Shared seed data. Existing server data is never overwritten during deployment.

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


export const initialCatalog = { products: INITIAL_PRODUCTS, toppings: INITIAL_TOPPINGS, reviews: INITIAL_REVIEWS, settings: DEFAULT_SETTINGS };
