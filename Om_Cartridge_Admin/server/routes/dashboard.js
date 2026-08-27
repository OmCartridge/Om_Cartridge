const express = require('express');
const router = express.Router();
const { getSummary, getRecentInvoices, getLowStock } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/recent-invoices', protect, getRecentInvoices);
router.get('/low-stock', protect, getLowStock);

module.exports = router;
