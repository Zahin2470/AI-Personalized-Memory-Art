const express = require('express');
const { handleSuccess, handleFail, handleCancel, handleIPN } = require('../controllers/sslcommerzController');

const router = express.Router();

// SSLCommerz posts form-encoded bodies to all four of these - the app's
// global express.urlencoded() middleware (mounted in server.js) covers that,
// no special body parsing needed here the way Stripe's webhook needed raw().
router.post('/success', handleSuccess);
router.post('/fail', handleFail);
router.post('/cancel', handleCancel);
router.post('/ipn', handleIPN);

module.exports = router;
