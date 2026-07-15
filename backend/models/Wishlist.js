const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    dateAdded: { type: Date, default: Date.now },
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  items: { type: [wishlistItemSchema], default: [] },
});

wishlistSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    ret.items = ret.items.map((item) => ({
      productId: item.productId.toString(),
      dateAdded: item.dateAdded,
    }));
    return ret;
  },
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
