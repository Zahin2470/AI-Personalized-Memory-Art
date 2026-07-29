const rateLimit = require('express-rate-limit');

// Forgot-password sends an email per request - without a limit, it's a easy
// way to spam an inbox or rack up SMTP-provider costs. Keyed by IP; 5
// requests per 15 minutes is generous for a real user, tight for abuse.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset attempts - try again in a few minutes.' },
});

module.exports = { forgotPasswordLimiter };
