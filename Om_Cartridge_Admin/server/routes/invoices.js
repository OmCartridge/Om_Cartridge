const express = require('express');
const router = express.Router();
const {
  getInvoices, getInvoice, createInvoice, cancelInvoice, downloadInvoicePDF, emailInvoice,
} = require('../controllers/invoiceController');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoice);
router.post('/', protect, createInvoice);
router.post('/:id/cancel', protect, requireAdmin, cancelInvoice); // Cancel = admin only
router.get('/:id/pdf', protect, downloadInvoicePDF);              // Auth required for PDF
router.post('/:id/email', protect, emailInvoice);

module.exports = router;
