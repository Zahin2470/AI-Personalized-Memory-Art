const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    List the logged-in user's notifications (most recent first)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
});

// @desc    Mark a single notification read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.read = true;
  await notification.save();
  res.json({ success: true, data: notification });
});

// @desc    Mark all of the user's notifications read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ success: true, data: {} });
});

module.exports = { getNotifications, markRead, markAllRead };
