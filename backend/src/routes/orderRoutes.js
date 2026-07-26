const express = require('express');
const {
  createOrder,
  getOrders,
  getOrder,
  createCheckoutSession,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/:id/checkout', createCheckoutSession);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
