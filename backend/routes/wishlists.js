const express = require('express');
const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const wishlists = await Wishlist.find();
    res.json(wishlists);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const wishlist = await Wishlist.create({ name: name.trim(), items: [] });
    res.status(201).json(wishlist);
  })
);

router.post(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productId } = req.body;

    if (!isValidId(id)) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }
    if (!productId || !isValidId(productId)) {
      return res.status(400).json({ error: 'A valid productId is required' });
    }

    const [wishlist, product] = await Promise.all([
      Wishlist.findById(id),
      Product.findById(productId),
    ]);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const alreadyPresent = wishlist.items.some((item) => item.productId.toString() === productId);
    if (alreadyPresent) {
      return res.status(409).json({ error: 'Product already in this wishlist' });
    }

    wishlist.items.push({ productId, dateAdded: new Date() });
    await wishlist.save();
    res.status(201).json(wishlist);
  })
);

router.delete(
  '/:id/items/:productId',
  asyncHandler(async (req, res) => {
    const { id, productId } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const wishlist = await Wishlist.findById(id);
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const originalLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter((item) => item.productId.toString() !== productId);

    if (wishlist.items.length === originalLength) {
      return res.status(404).json({ error: 'Product not found in this wishlist' });
    }

    await wishlist.save();
    res.json(wishlist);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const deleted = await Wishlist.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    res.status(204).send();
  })
);

// Destructive merge: sourceId's items are folded into targetId, deduped by
// productId (earlier dateAdded wins on a duplicate), targetId keeps its own
// name, and sourceId is deleted. See CLAUDE.md section 3.3 / 6 for the
// reasoning behind these choices.
router.post(
  '/merge',
  asyncHandler(async (req, res) => {
    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId || !isValidId(sourceId) || !isValidId(targetId)) {
      return res.status(400).json({ error: 'Both sourceId and targetId are required and must be valid ids' });
    }
    if (sourceId === targetId) {
      return res.status(400).json({ error: 'Cannot merge a wishlist with itself' });
    }

    const [source, target] = await Promise.all([
      Wishlist.findById(sourceId),
      Wishlist.findById(targetId),
    ]);
    if (!source || !target) {
      return res.status(404).json({ error: 'Source or target wishlist not found' });
    }

    const merged = new Map(); // productId -> dateAdded

    for (const item of [...target.items, ...source.items]) {
      const key = item.productId.toString();
      const existing = merged.get(key);
      if (!existing || item.dateAdded < existing) {
        merged.set(key, item.dateAdded);
      }
    }

    target.items = Array.from(merged.entries()).map(([productId, dateAdded]) => ({
      productId,
      dateAdded,
    }));

    await target.save();
    await Wishlist.findByIdAndDelete(sourceId);

    res.json(target);
  })
);

module.exports = router;
