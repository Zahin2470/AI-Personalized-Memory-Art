const Stripe = require('stripe');
const Order = require('../models/Order');

// This handler is mounted with express.raw() in server.js, NOT express.json() -
// Stripe's signature verification needs the exact raw request bytes.
const handleStripeWebhook = async (req, res) => {
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    // Not configured - accept and no-op rather than erroring, so Stripe
    // doesn't retry a webhook we're intentionally not handling yet.
    return res.status(200).json({ received: true, note: 'Webhook not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { status: 'paid' });
    }
  }

  res.status(200).json({ received: true });
};

module.exports = { handleStripeWebhook };
