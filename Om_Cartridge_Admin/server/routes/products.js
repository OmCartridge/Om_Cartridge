const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements, getLowStockProducts, importProductsCSV,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// Product routes
router.get('/', protect, getProducts);
router.get('/:id', protect, getProduct);
router.post('/', protect, createProduct);
router.post('/import-csv', protect, importProductsCSV);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
