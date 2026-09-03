const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerByPhone,
  getCustomer,
  getCustomerInvoices,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomersCSV,
} = require('../controllers/customerController');
const { protect, requireAdmin } = require('../middleware/auth');

// Read — any authenticated user
router.get('/', protect, getCustomers);
router.get('/by-phone/:phone', protect, getCustomerByPhone);
router.get('/:id', protect, getCustomer);
router.get('/:id/invoices', protect, getCustomerInvoices);

// Write — admin only
router.post('/', protect, requireAdmin, createCustomer);
router.post('/import-csv', protect, requireAdmin, importCustomersCSV);
router.put('/:id', protect, requireAdmin, updateCustomer);
router.delete('/:id', protect, requireAdmin, deleteCustomer);

module.exports = router;
