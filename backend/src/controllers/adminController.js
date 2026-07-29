const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Memory = require('../models/Memory');
const Artwork = require('../models/Artwork');
const Order = require('../models/Order');
const Contribution = require('../models/Contribution');
const { notify } = require('../services/notify');

// @desc    Dashboard summary numbers
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
  const [userCount, memoryCount, artworkCount, orders] = await Promise.all([
    User.countDocuments(),
    Memory.countDocuments(),
    Artwork.countDocuments(),
    Order.find({ status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } }),
  ]);

  const revenueCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const orderCountByStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      userCount,
      memoryCount,
      artworkCount,
      paidOrderCount: orders.length,
      revenueCents,
      orderCountByStatus,
    },
  });
});

// @desc    List all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

// @desc    List all orders across all users
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate({ path: 'items.product', populate: { path: 'artwork' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, count: orders.length, data: orders });
});

// @desc    Update an order's fulfillment status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
// body: { status }
const ADVANCEABLE_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ADVANCEABLE_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${ADVANCEABLE_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = status;
  const updated = await order.save();

  try {
    await notify({
      userId: order.user,
      type: 'order_status',
      message: `Your order is now ${status}.`,
      link: '/orders',
    });
  } catch (error) {
    console.error('Failed to create order_status notification:', error.message);
  }

  res.json({ success: true, data: updated });
});

// @desc    List contributions across all memories, for moderation
// @route   GET /api/admin/contributions
// @access  Private/Admin
const getAllContributions = asyncHandler(async (req, res) => {
  const contributions = await Contribution.find().populate('memory', 'title user').sort({ createdAt: -1 });
  res.json({ success: true, count: contributions.length, data: contributions });
});

// @desc    Remove an inappropriate contribution
// @route   DELETE /api/admin/contributions/:id
// @access  Private/Admin
const deleteContribution = asyncHandler(async (req, res) => {
  const contribution = await Contribution.findByIdAndDelete(req.params.id);
  if (!contribution) {
    res.status(404);
    throw new Error('Contribution not found');
  }
  res.json({ success: true, data: {} });
});

module.exports = {
  getStats,
  getUsers,
  getAllOrders,
  updateOrderStatus,
  getAllContributions,
  deleteContribution,
};
