const express = require('express');
const router = express.Router();
const { adjustStock, getStockMovements, getLowStockProducts } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.post('/adjust', protect, adjustStock);
router.get('/movements', protect, getStockMovements);
router.get('/low', protect, getLowStockProducts);

module.exports = router;
