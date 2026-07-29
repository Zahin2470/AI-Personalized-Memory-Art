const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPriceCents: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    // Amounts are stored in the smallest currency unit - paisa for BDT
    // (same 1/100 subdivision as cents, so display math is unchanged).
    // totalCents is the FINAL amount charged (subtotal - discountCents).
    subtotalCents: {
      type: Number,
      required: true,
      min: 0,
    },
    discountCode: {
      type: String,
      uppercase: true,
    },
    discountCents: {
      type: Number,
      default: 0,
    },
    totalCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    giftMessage: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // SSLCommerz requires customer name/phone/address on every transaction,
    // digital or physical - so this is always collected at checkout now,
    // not just for physical products.
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentReference: {
      type: String, // set by whichever payment provider is wired up
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
