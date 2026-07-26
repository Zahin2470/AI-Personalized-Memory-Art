const mongoose = require('mongoose');

const PRODUCT_TYPES = [
  'digital_download',
  'framed_print',
  'canvas_print',
  'photo_book',
  'mug',
  'cushion',
];

const productSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: PRODUCT_TYPES,
      required: true,
    },
    size: {
      type: String, // e.g. "8x10in", "A4", n/a for digital
      trim: true,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    previewUrl: {
      type: String, // realistic mockup (framed on wall, on a mug, etc.)
    },
    // Set true once this product is attached to an Order - lets the cart
    // query simply filter on { ordered: false } instead of cross-referencing orders.
    ordered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
module.exports.PRODUCT_TYPES = PRODUCT_TYPES;
