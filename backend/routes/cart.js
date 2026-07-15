const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// No auth in scope: there is exactly one cart document, created lazily.
async function getOrCreateCart() {
  let cart = await Cart.findOne();
  if (!cart) {
    cart = await Cart.create({ items: [] });
  }
  return cart;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart();
    res.json(cart);
  })
);

router.post(
  '/items',
  asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: 'A valid productId is required' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const cart = await getOrCreateCart();
    const existing = cart.items.find((item) => item.productId.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.status(201).json(cart);
  })
);

router.put(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    const cart = await getOrCreateCart();
    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  })
);

router.delete(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const cart = await getOrCreateCart();

    const originalLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

    if (cart.items.length === originalLength) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    await cart.save();
    res.json(cart);
  })
);

module.exports = router;
