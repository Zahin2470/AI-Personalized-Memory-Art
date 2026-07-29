const express = require('express');
const { validateCode } = require('../controllers/discountCodeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/validate', protect, validateCode);

module.exports = router;
