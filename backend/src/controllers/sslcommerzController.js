const Order = require('../models/Order');
const Product = require('../models/Product');
const sslcommerz = require('../services/sslcommerzClient');

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

// Finds the order this callback refers to. SSLCommerz echoes back
// `value_a` (we set it to the order id at session-init time) as well as
// `tran_id` (which we generated as `order_<id>_<timestamp>`) - value_a is
// the more direct lookup, tran_id as a fallback.
const findOrderForCallback = async (body) => {
  if (body.value_a) {
    const byValueA = await Order.findById(body.value_a).populate('items.product');
    if (byValueA) return byValueA;
  }
  if (body.tran_id) {
    return Order.findOne({ paymentReference: body.tran_id }).populate('items.product');
  }
  return null;
};

const markPaid = async (order) => {
  if (order.status === 'pending') {
    order.status = 'paid';
    await order.save();
  }
};

const releaseToCart = async (order) => {
  if (order.status === 'pending') {
    order.status = 'cancelled';
    await order.save();
    await Product.updateMany({ _id: { $in: order.items.map((i) => i.product) } }, { $set: { ordered: false } });
  }
};

// SSLCommerz POSTs the browser here after a successful payment. This must
// validate against their Validation API before trusting it - a POST to this
// URL alone is not proof of payment (it's a browser redirect, not a
// signed server-to-server call).
// @route   POST /api/orders/sslcommerz/success
// @access  Public (called by the customer's browser via SSLCommerz's redirect)
const handleSuccess = async (req, res) => {
  try {
    const order = await findOrderForCallback(req.body);
    if (!order) return res.redirect(`${clientUrl()}/checkout/cancel`);

    const validation = await sslcommerz.validateTransaction(req.body.val_id);
    if (sslcommerz.isValidStatus(validation.status)) {
      await markPaid(order);
      return res.redirect(`${clientUrl()}/checkout/success?orderId=${order._id}`);
    }

    return res.redirect(`${clientUrl()}/checkout/cancel?orderId=${order._id}&reason=unverified`);
  } catch (error) {
    console.error('SSLCommerz success handler error:', error.message);
    return res.redirect(`${clientUrl()}/checkout/cancel`);
  }
};

// @route   POST /api/orders/sslcommerz/fail
// @access  Public
const handleFail = async (req, res) => {
  try {
    const order = await findOrderForCallback(req.body);
    if (order) await releaseToCart(order);
    res.redirect(`${clientUrl()}/checkout/cancel?orderId=${order?._id || ''}&reason=fail`);
  } catch (error) {
    console.error('SSLCommerz fail handler error:', error.message);
    res.redirect(`${clientUrl()}/checkout/cancel?reason=fail`);
  }
};

// @route   POST /api/orders/sslcommerz/cancel
// @access  Public
const handleCancel = async (req, res) => {
  try {
    const order = await findOrderForCallback(req.body);
    if (order) await releaseToCart(order);
    res.redirect(`${clientUrl()}/checkout/cancel?orderId=${order?._id || ''}&reason=cancel`);
  } catch (error) {
    console.error('SSLCommerz cancel handler error:', error.message);
    res.redirect(`${clientUrl()}/checkout/cancel?reason=cancel`);
  }
};

// The reliable, server-to-server notification - unlike success/fail/cancel
// (which ride on the customer's browser and could drop if they close the
// tab), SSLCommerz sends this directly regardless of what the browser does.
// @route   POST /api/orders/sslcommerz/ipn
// @access  Public
const handleIPN = async (req, res) => {
  try {
    const order = await findOrderForCallback(req.body);
    if (!order) return res.status(200).json({ received: true, note: 'order not found' });

    const validation = await sslcommerz.validateTransaction(req.body.val_id);
    if (sslcommerz.isValidStatus(validation.status)) {
      await markPaid(order);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('SSLCommerz IPN handler error:', error.message);
    // Still 200 - a 4xx/5xx here just makes SSLCommerz retry the same IPN,
    // which won't fix a bug on our end and only adds noise.
    res.status(200).json({ received: true, error: error.message });
  }
};

module.exports = { handleSuccess, handleFail, handleCancel, handleIPN };
