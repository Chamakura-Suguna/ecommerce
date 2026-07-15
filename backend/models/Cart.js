const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

// No auth/user accounts in scope (see CLAUDE.md), so the cart is a single
// global singleton document rather than keyed per-user.
const cartSchema = new mongoose.Schema({
  items: { type: [cartItemSchema], default: [] },
});

cartSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    ret.items = ret.items.map((item) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
    }));
    return ret;
  },
});

module.exports = mongoose.model('Cart', cartSchema);
