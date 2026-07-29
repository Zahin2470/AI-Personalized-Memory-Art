const Notification = require('../models/Notification');

/**
 * Creates a notification. Deliberately fire-and-forget from callers'
 * perspective in spirit (a failed notification shouldn't break the action
 * that triggered it) - callers should wrap this in try/catch and just log
 * on failure rather than let it fail the parent request.
 */
const notify = async ({ userId, type, message, link }) => {
  return Notification.create({ user: userId, type, message, link });
};

module.exports = { notify };
