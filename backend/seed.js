require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');

const products = [
  {
    name: 'Classic Cotton Tee',
    price: 19.99,
    image: 'https://picsum.photos/seed/tee/400/400',
    category: 'Apparel',
    description: 'A soft, everyday cotton t-shirt.',
    inStock: true,
  },
  {
    name: 'Running Sneakers',
    price: 79.99,
    image: 'https://picsum.photos/seed/sneakers/400/400',
    category: 'Footwear',
    description: 'Lightweight sneakers built for daily runs.',
    inStock: true,
  },
  {
    name: 'Leather Wallet',
    price: 34.5,
    image: 'https://picsum.photos/seed/wallet/400/400',
    category: 'Accessories',
    description: 'Slim bifold wallet in genuine leather.',
    inStock: true,
  },
  {
    name: 'Wireless Headphones',
    price: 129.0,
    image: 'https://picsum.photos/seed/headphones/400/400',
    category: 'Electronics',
    description: 'Over-ear headphones with active noise cancellation.',
    inStock: false,
  },
  {
    name: 'Ceramic Coffee Mug',
    price: 12.0,
    image: 'https://picsum.photos/seed/mug/400/400',
    category: 'Home',
    description: 'Dishwasher-safe 12oz ceramic mug.',
    inStock: true,
  },
  {
    name: 'Yoga Mat',
    price: 28.75,
    image: 'https://picsum.photos/seed/yogamat/400/400',
    category: 'Fitness',
    description: 'Non-slip mat with carrying strap.',
    inStock: true,
  },
  {
    name: 'Denim Jacket',
    price: 64.0,
    image: 'https://picsum.photos/seed/jacket/400/400',
    category: 'Apparel',
    description: 'Classic mid-wash denim jacket.',
    inStock: true,
  },
  {
    name: 'Canvas Backpack',
    price: 45.99,
    image: 'https://picsum.photos/seed/backpack/400/400',
    category: 'Accessories',
    description: 'Durable canvas backpack with laptop sleeve.',
    inStock: true,
  },
  {
    name: 'Stainless Water Bottle',
    price: 22.0,
    image: 'https://picsum.photos/seed/bottle/400/400',
    category: 'Fitness',
    description: 'Insulated 750ml water bottle, keeps drinks cold for 24h.',
    inStock: true,
  },
  {
    name: 'Desk Lamp',
    price: 38.5,
    image: 'https://picsum.photos/seed/lamp/400/400',
    category: 'Home',
    description: 'Adjustable LED desk lamp with 3 brightness settings.',
    inStock: true,
  },
  {
    name: 'Mechanical Keyboard',
    price: 89.99,
    image: 'https://picsum.photos/seed/keyboard/400/400',
    category: 'Electronics',
    description: 'Compact mechanical keyboard with hot-swappable switches.',
    inStock: true,
  },
  {
    name: 'Sunglasses',
    price: 54.0,
    image: 'https://picsum.photos/seed/sunglasses/400/400',
    category: 'Accessories',
    description: 'Polarized UV400 sunglasses.',
    inStock: false,
  },
  {
    name: 'Hiking Boots',
    price: 112.0,
    image: 'https://picsum.photos/seed/boots/400/400',
    category: 'Footwear',
    description: 'Waterproof boots built for rough trails.',
    inStock: true,
  },
  {
    name: 'Scented Candle',
    price: 16.5,
    image: 'https://picsum.photos/seed/candle/400/400',
    category: 'Home',
    description: 'Soy wax candle, sandalwood scent, 40h burn time.',
    inStock: true,
  },
];

async function seed() {
  await connectDB(process.env.MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
