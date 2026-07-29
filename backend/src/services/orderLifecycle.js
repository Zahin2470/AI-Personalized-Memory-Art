const Product = require('../models/Product');
const DiscountCode = require('../models/DiscountCode');

/**
 * Cancels a pending order: releases its products back to the cart and, if a
 * discount code was applied, releases that use back too (it was incremented
 * at order-creation time). No-ops if the order isn't currently pending -
 * safe to call defensively from multiple callback paths without double-
 * releasing an already-cancelled order.
 */
const releaseOrder = async (order) => {
  if (order.status !== 'pending') return order;

  order.status = 'cancelled';
  await order.save();

  await Product.updateMany({ _id: { $in: order.items.map((i) => i.product) } }, { $set: { ordered: false } });

  if (order.discountCode) {
    await DiscountCode.updateOne({ code: order.discountCode }, { $inc: { usedCount: -1 } });
  }

  return order;
};

module.exports = { releaseOrder };
