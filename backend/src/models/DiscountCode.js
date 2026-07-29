const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true,
    },
    // percent: 0-100 (e.g. 15 = 15% off). fixed: paisa off (same unit as
    // Product/Order prices), e.g. 50000 = ৳500 off.
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    maxUses: {
      type: Number, // null/undefined = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date, // null/undefined = never expires
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Whether this code can currently be applied to a new order.
discountCodeSchema.methods.isValid = function isValid() {
  if (!this.active) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.maxUses != null && this.usedCount >= this.maxUses) return false;
  return true;
};

// Computes the discount in paisa for a given subtotal (also in paisa).
// Never discounts below zero.
discountCodeSchema.methods.computeDiscount = function computeDiscount(subtotalCents) {
  const raw = this.type === 'percent' ? Math.round((subtotalCents * this.value) / 100) : this.value;
  return Math.max(0, Math.min(raw, subtotalCents));
};

module.exports = mongoose.model('DiscountCode', discountCodeSchema);
