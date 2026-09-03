const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements, getLowStockProducts, importProductsCSV,
} = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/auth');

// Read — any authenticated user
router.get('/', protect, getProducts);
router.get('/:id', protect, getProduct);
router.get('/stock/movements', protect, getStockMovements);
router.get('/stock/low', protect, getLowStockProducts);

// Write — admin only
router.post('/', protect, requireAdmin, createProduct);
router.post('/import-csv', protect, requireAdmin, importProductsCSV);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
