const express = require('express');
const router = express.Router();
const { adjustStock, getStockMovements, getLowStockProducts } = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/auth');

// Read — any authenticated user
router.get('/movements', protect, getStockMovements);
router.get('/low', protect, getLowStockProducts);

// Manual stock adjustment — admin only
router.post('/adjust', protect, requireAdmin, adjustStock);

module.exports = router;
