const express = require('express');
const {
  getStats,
  getUsers,
  getAllOrders,
  updateOrderStatus,
  getAllContributions,
  deleteContribution,
} = require('../controllers/adminController');
const { createCode, getCodes, updateCode, deleteCode } = require('../controllers/discountCodeController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/contributions', getAllContributions);
router.delete('/contributions/:id', deleteContribution);
router.post('/discount-codes', createCode);
router.get('/discount-codes', getCodes);
router.put('/discount-codes/:id', updateCode);
router.delete('/discount-codes/:id', deleteCode);

module.exports = router;
