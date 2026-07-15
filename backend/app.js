const express = require('express');
const cors = require('cors');

const productsRouter = require('./routes/products');
const wishlistsRouter = require('./routes/wishlists');
const cartRouter = require('./routes/cart');
const checkoutRouter = require('./routes/checkout');

// CORS_ORIGIN in .env is a comma-separated list (see .env.example). Falls
// back to common local dev ports plus the deployed GitHub Pages origin.
const defaultOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'https://chamakura-suguna.github.io',
];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : defaultOrigins;

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, Postman, server-to-server) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/products', productsRouter);
app.use('/wishlists', wishlistsRouter);
app.use('/cart', cartRouter);
app.use('/checkout', checkoutRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler: catches asyncHandler rejections and Mongoose
// validation/cast errors so route handlers don't each need their own try/catch.
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }
  if (err.message && err.message.startsWith('Origin ') && err.message.endsWith('not allowed by CORS')) {
    return res.status(403).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
