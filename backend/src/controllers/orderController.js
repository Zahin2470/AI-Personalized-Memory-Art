const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DiscountCode = require('../models/DiscountCode');
const { CATALOG } = require('../config/catalog');
const sslcommerz = require('../services/sslcommerzClient');
const { releaseOrder } = require('../services/orderLifecycle');

// @desc    Create an order from a set of cart products
// @route   POST /api/orders
// @access  Private
// body: { items: [{ productId, quantity }], shippingAddress, promoCode?, giftMessage? }
// shippingAddress is always required - SSLCommerz mandates customer
// name/phone/address on every transaction, digital goods included.
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, promoCode, giftMessage } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('items must be a non-empty array of { productId, quantity }');
  }

  if (!shippingAddress?.line1 || !shippingAddress?.phone) {
    res.status(400);
    throw new Error('An address and phone number are required to check out');
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, user: req.user._id, ordered: false });

  if (products.length !== productIds.length) {
    res.status(400);
    throw new Error('One or more products were not found in your cart (already ordered, or don\u2019t belong to you)');
  }

  const orderItems = items.map(({ productId, quantity }) => {
    const product = products.find((p) => p._id.toString() === productId);
    return {
      product: product._id,
      quantity: Math.max(1, Number(quantity) || 1),
      unitPriceCents: product.priceCents,
    };
  });

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  // Re-validate the code server-side rather than trusting a client-computed
  // discount - the /validate endpoint is only a preview.
  let discount = null;
  let discountCents = 0;
  if (promoCode) {
    discount = await DiscountCode.findOne({ code: promoCode.trim().toUpperCase() });
    if (!discount || !discount.isValid()) {
      res.status(400);
      throw new Error('That discount code isn\u2019t valid or has expired');
    }
    discountCents = discount.computeDiscount(subtotalCents);
  }

  const totalCents = subtotalCents - discountCents;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    subtotalCents,
    discountCode: discount?.code,
    discountCents,
    totalCents,
    shippingAddress,
    giftMessage,
  });

  await Product.updateMany({ _id: { $in: productIds } }, { $set: { ordered: true } });

  if (discount) {
    discount.usedCount += 1;
    await discount.save();
  }

  res.status(201).json({ success: true, data: order });
});

// @desc    List the user's orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate({ path: 'items.product', populate: { path: 'artwork' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, data: orders });
});

// @desc    Get a single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate({
    path: 'items.product',
    populate: { path: 'artwork' },
  });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json({ success: true, data: order });
});

// @desc    Start an SSLCommerz payment session for an order and return its gateway URL
// @route   POST /api/orders/:id/checkout
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!sslcommerz.isConfigured()) {
    res.status(503);
    throw new Error('Payments aren\u2019t configured yet - set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in the backend .env');
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.status !== 'pending') {
    res.status(400);
    throw new Error(`This order is already ${order.status}`);
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  // Unique per attempt (not just per order) so a retried/failed payment can
  // be re-initiated with a fresh tran_id, as SSLCommerz requires.
  const tranId = `order_${order._id}_${Date.now()}`;
  const addr = order.shippingAddress;
  const productSummary = order.items
    .map((i) => CATALOG[i.product.type]?.label || i.product.type)
    .join(', ');

  const session = await sslcommerz.initSession({
    total_amount: order.totalCents / 100,
    currency: order.currency,
    tran_id: tranId,
    success_url: `${backendUrl}/api/orders/sslcommerz/success`,
    fail_url: `${backendUrl}/api/orders/sslcommerz/fail`,
    cancel_url: `${backendUrl}/api/orders/sslcommerz/cancel`,
    ipn_url: `${backendUrl}/api/orders/sslcommerz/ipn`,
    shipping_method: 'Courier',
    product_name: productSummary,
    product_category: 'Personalized Art',
    product_profile: 'general',
    cus_name: req.user.name,
    cus_email: req.user.email,
    cus_add1: addr.line1,
    cus_add2: addr.line2 || addr.line1,
    cus_city: addr.city,
    cus_state: addr.state || addr.city,
    cus_postcode: addr.postalCode,
    cus_country: addr.country,
    cus_phone: addr.phone,
    ship_name: req.user.name,
    ship_add1: addr.line1,
    ship_add2: addr.line2 || addr.line1,
    ship_city: addr.city,
    ship_state: addr.state || addr.city,
    ship_postcode: addr.postalCode,
    ship_country: addr.country,
    value_a: order._id.toString(), // carried through to the success/fail/cancel callbacks
  });

  if (session.status !== 'SUCCESS' || !session.GatewayPageURL) {
    res.status(502);
    throw new Error(`SSLCommerz session failed: ${session.failedreason || 'unknown error'}`);
  }

  order.paymentReference = tranId;
  await order.save();

  res.json({ success: true, data: { url: session.GatewayPageURL } });
});

// @desc    Cancel a pending order and release its products back to the cart
// @route   POST /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.status !== 'pending') {
    res.status(400);
    throw new Error(`Only pending orders can be cancelled (this one is ${order.status})`);
  }

  await releaseOrder(order);

  res.json({ success: true, data: order });
});

module.exports = { createOrder, getOrders, getOrder, createCheckoutSession, cancelOrder };
