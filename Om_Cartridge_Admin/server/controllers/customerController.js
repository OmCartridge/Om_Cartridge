const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

// GET /api/customers
const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// GET /api/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// GET /api/customers/:id/invoices
const getCustomerInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ customerId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

// POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const { name, address, gstin, state, stateCode, phone, email, contactPerson, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
    }

    if (gstin && gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin.trim().toUpperCase())) {
        return res.status(400).json({ success: false, message: 'Invalid GSTIN format' });
      }
    }

    const customer = await Customer.create({
      name: name.trim(),
      address: address || '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      state: state || 'Gujarat',
      stateCode: stateCode || '24',
      phone: phone || '',
      email: email ? email.trim().toLowerCase() : '',
      contactPerson: contactPerson || '',
      notes: notes || '',
    });

    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const { name, address, gstin, state, stateCode, phone, email, contactPerson, notes } = req.body;

    if (name !== undefined) customer.name = name.trim();
    if (address !== undefined) customer.address = address;
    if (gstin !== undefined) customer.gstin = gstin.trim().toUpperCase();
    if (state !== undefined) customer.state = state;
    if (stateCode !== undefined) customer.stateCode = stateCode;
    if (phone !== undefined) customer.phone = phone;
    if (email !== undefined) customer.email = email.trim().toLowerCase();
    if (contactPerson !== undefined) customer.contactPerson = contactPerson;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();
    res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    await customer.deleteOne();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  getCustomerInvoices,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
