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
const { protect } = require('../middleware/auth');

router.get('/', protect, getCustomers);
router.get('/by-phone/:phone', protect, getCustomerByPhone);
router.get('/:id', protect, getCustomer);
router.get('/:id/invoices', protect, getCustomerInvoices);
router.post('/', protect, createCustomer);
router.post('/import-csv', protect, importCustomersCSV);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

module.exports = router;
