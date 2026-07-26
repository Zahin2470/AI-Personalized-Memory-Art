const express = require('express');
const { createProduct, getProducts, getProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
