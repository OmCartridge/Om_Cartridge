const express = require('express');
const router = express.Router();
const {
  getCustomers, getCustomer, getCustomerInvoices, createCustomer, updateCustomer, deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomer);
router.get('/:id/invoices', protect, getCustomerInvoices);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

module.exports = router;
