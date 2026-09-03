const express = require('express');
const router = express.Router();
const {
  getInvoices, getInvoice, createInvoice, cancelInvoice, downloadInvoicePDF, emailInvoice,
} = require('../controllers/invoiceController');
const { protect, requireAdmin } = require('../middleware/auth');

const rateLimit = require('express-rate-limit');

// Rate limit email sending: max 15 requests per 15 minutes per IP
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many email requests. Please try again later.' },
});

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoice);
router.post('/', protect, createInvoice);
router.post('/:id/cancel', protect, requireAdmin, cancelInvoice); // Cancel = admin only
router.get('/:id/pdf', protect, downloadInvoicePDF);              // Auth required for PDF
router.post('/:id/email', protect, emailLimiter, emailInvoice);

module.exports = router;
