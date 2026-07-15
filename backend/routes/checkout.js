const express = require('express');
const crypto = require('crypto');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Avoids floating-point drift (e.g. 79.99 * 3 === 239.96999999999997) on currency math.
function round2(n) {
  return Math.round(n * 100) / 100;
}

// Mock checkout: no real payment integration. Snapshots the current cart,
// prices it against current product data, "confirms" it, then empties the
// cart. Purely a UI-facing flow, per CLAUDE.md section 4.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await Cart.findOne();
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const lineItems = cart.items.map((item) => {
      const product = productMap.get(item.productId.toString());
      const unitPrice = product ? product.price : 0;
      return {
        productId: item.productId.toString(),
        name: product ? product.name : 'Unknown product',
        quantity: item.quantity,
        unitPrice,
        lineTotal: round2(unitPrice * item.quantity),
      };
    });

    const total = round2(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));

    const confirmation = {
      orderId: crypto.randomUUID(),
      status: 'confirmed',
      items: lineItems,
      total,
      placedAt: new Date().toISOString(),
      note: 'Mock checkout — no real payment was processed.',
    };

    cart.items = [];
    await cart.save();

    res.status(201).json(confirmation);
  })
);

module.exports = router;
