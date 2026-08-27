const express = require('express');
const router = express.Router();
const {
  getInvoices, getInvoice, createInvoice, cancelInvoice, downloadInvoicePDF, emailInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoice);
router.post('/', protect, createInvoice);
router.post('/:id/cancel', protect, cancelInvoice);
router.get('/:id/pdf', downloadInvoicePDF);  // Public — browser opens directly, ObjectId is unguessable
router.post('/:id/email', protect, emailInvoice);

module.exports = router;
