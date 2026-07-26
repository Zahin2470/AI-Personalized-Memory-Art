const asyncHandler = require('express-async-handler');
const Stripe = require('stripe');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { CATALOG, isPhysical } = require('../config/catalog');

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// @desc    Create an order from a set of cart products
// @route   POST /api/orders
// @access  Private
// body: { items: [{ productId, quantity }], shippingAddress? }
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('items must be a non-empty array of { productId, quantity }');
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, user: req.user._id, ordered: false });

  if (products.length !== productIds.length) {
    res.status(400);
    throw new Error('One or more products were not found in your cart (already ordered, or don\u2019t belong to you)');
  }

  const needsShipping = products.some((p) => isPhysical(p.type));
  if (needsShipping && !shippingAddress?.line1) {
    res.status(400);
    throw new Error('A shipping address is required for physical products');
  }

  const orderItems = items.map(({ productId, quantity }) => {
    const product = products.find((p) => p._id.toString() === productId);
    return {
      product: product._id,
      quantity: Math.max(1, Number(quantity) || 1),
      unitPriceCents: product.priceCents,
    };
  });

  const totalCents = orderItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalCents,
    shippingAddress: needsShipping ? shippingAddress : undefined,
  });

  await Product.updateMany({ _id: { $in: productIds } }, { $set: { ordered: true } });

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

// @desc    Create a Stripe Checkout session for an order and return its URL
// @route   POST /api/orders/:id/checkout
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503);
    throw new Error('Payments aren\u2019t configured yet - set STRIPE_SECRET_KEY in the backend .env');
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

  const line_items = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: order.currency.toLowerCase(),
      unit_amount: item.unitPriceCents,
      product_data: {
        name: CATALOG[item.product.type]?.label || item.product.type,
      },
    },
  }));

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items,
    success_url: `${clientUrl}/checkout/success?orderId=${order._id}`,
    cancel_url: `${clientUrl}/checkout/cancel?orderId=${order._id}`,
    metadata: { orderId: order._id.toString() },
  });

  order.paymentReference = session.id;
  await order.save();

  res.json({ success: true, data: { url: session.url } });
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

  order.status = 'cancelled';
  await order.save();
  await Product.updateMany({ _id: { $in: order.items.map((i) => i.product) } }, { $set: { ordered: false } });

  res.json({ success: true, data: order });
});

module.exports = { createOrder, getOrders, getOrder, createCheckoutSession, cancelOrder };
