const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { parseCSV } = require('../utils/invoiceUtils');

// Validate exactly 10 digits — any digit 0-9 in any position
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

// Validate email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validate GSTIN
const isValidGSTIN = (gstin) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase());

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

// GET /api/customers/by-phone/:phone
const getCustomerByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number. Must be 10 digits starting with 6-9.' });
    }
    const customer = await Customer.findOne({ phone }).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'No customer found with this mobile number.' });
    }
    res.json({ success: true, data: customer });
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
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }

    // Phone validation
    const cleanPhone = phone ? phone.replace(/\s/g, '') : null;
    if (cleanPhone) {
      if (!isValidPhone(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number. Please enter a valid 10-digit mobile number.' });
      }
      // Check uniqueness
      const existing = await Customer.findOne({ phone: cleanPhone });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `A customer with mobile number ${cleanPhone} already exists: "${existing.name}".`,
          data: existing,
        });
      }
    }

    if (email && email.trim()) {
      if (!isValidEmail(email.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
      }
    }

    if (gstin && gstin.trim()) {
      if (!isValidGSTIN(gstin.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5' });
      }
    }

    const customer = await Customer.create({
      name: name.trim(),
      address: address || '',
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      state: state || 'Gujarat',
      stateCode: stateCode || '24',
      phone: cleanPhone || null,
      email: email ? email.trim().toLowerCase() : '',
      contactPerson: contactPerson || '',
      notes: notes || '',
    });

    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A customer with this mobile number already exists.' });
    }
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
    if (gstin !== undefined) {
      if (gstin && !isValidGSTIN(gstin.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid GSTIN format.' });
      }
      customer.gstin = gstin ? gstin.trim().toUpperCase() : '';
    }
    if (state !== undefined) customer.state = state;
    if (stateCode !== undefined) customer.stateCode = stateCode;
    if (phone !== undefined) {
      const cleanPhone = phone ? phone.replace(/\s/g, '') : null;
      if (cleanPhone) {
        if (!isValidPhone(cleanPhone)) {
          return res.status(400).json({ success: false, message: 'Invalid mobile number. Mobile number must contain exactly 10 digits.' });
        }
        // Check uniqueness (exclude current customer)
        const existing = await Customer.findOne({ phone: cleanPhone, _id: { $ne: req.params.id } });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: `Mobile number ${cleanPhone} is already used by "${existing.name}".`,
          });
        }
      }
      customer.phone = cleanPhone || null;
    }
    if (email !== undefined) {
      if (email && !isValidEmail(email.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
      }
      customer.email = email ? email.trim().toLowerCase() : '';
    }
    if (contactPerson !== undefined) customer.contactPerson = contactPerson;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();
    res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A customer with this mobile number already exists.' });
    }
    next(error);
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Check for invoices
    const invoiceCount = await Invoice.countDocuments({ customerId: req.params.id });
    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${customer.name}" — they have ${invoiceCount} invoice(s) on record. Cancel invoices first or deactivate the customer instead.`,
      });
    }

    await customer.deleteOne();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/customers/import-csv
// Body: { csvContent: string, dryRun: boolean }
const importCustomersCSV = async (req, res, next) => {
  try {
    const { csvContent, dryRun = true } = req.body;

    if (!csvContent || !csvContent.trim()) {
      return res.status(400).json({ success: false, message: 'CSV content is required.' });
    }

    const { headers, rows } = parseCSV(csvContent);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV is empty or has no data rows.' });
    }

    // Check required columns
    const requiredCols = ['name', 'phone'];
    const missingCols = requiredCols.filter(c => !headers.includes(c));
    if (missingCols.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required CSV columns: ${missingCols.join(', ')}. Required: name, phone. Optional: email, gstin, address, state, statecode, contactperson, notes`,
      });
    }

    const results = { newCount: 0, updateCount: 0, errorCount: 0, errors: [], preview: [] };

    for (const row of rows) {
      const rowNum = row._rowNumber;
      const rowErrors = [];

      const name = (row.name || '').trim();
      const phone = (row.phone || '').replace(/\s/g, '');
      const email = (row.email || '').trim();
      const gstin = (row.gstin || '').trim().toUpperCase();
      const address = (row.address || '').trim();
      const state = (row.state || 'Gujarat').trim();
      const stateCode = (row.statecode || row['state code'] || '24').trim();
      const contactPerson = (row.contactperson || row['contact person'] || '').trim();
      const notes = (row.notes || '').trim();

      if (!name) rowErrors.push('Name is required');
      if (!phone) rowErrors.push('Phone is required');
      else if (!isValidPhone(phone)) rowErrors.push(`Mobile: ${phone} - Mobile number must contain exactly 10 digits.`);
      if (email && !isValidEmail(email)) rowErrors.push(`Invalid email: "${email}"`);
      if (gstin && !isValidGSTIN(gstin)) rowErrors.push(`Invalid GSTIN: "${gstin}"`);

      if (rowErrors.length > 0) {
        results.errorCount++;
        results.errors.push({ row: rowNum, messages: rowErrors });
        results.preview.push({ row: rowNum, action: 'error', name, phone, errors: rowErrors });
        continue;
      }

      const existing = phone ? await Customer.findOne({ phone }).lean() : null;
      const action = existing ? 'update' : 'create';
      if (action === 'update') results.updateCount++;
      else results.newCount++;

      results.preview.push({ row: rowNum, action, name, phone, email, gstin, address, existingName: existing?.name });

      if (!dryRun) {
        const data = {
          name,
          phone: phone || null,
          email: email ? email.toLowerCase() : '',
          gstin,
          address,
          state,
          stateCode,
          contactPerson,
          notes,
        };
        if (existing) {
          await Customer.findByIdAndUpdate(existing._id, data);
        } else {
          await Customer.create(data);
        }
      }
    }

    res.json({
      success: true,
      message: dryRun
        ? `Preview: ${results.newCount} new, ${results.updateCount} updates, ${results.errorCount} errors`
        : `Import complete: ${results.newCount} created, ${results.updateCount} updated, ${results.errorCount} skipped`,
      data: results,
      dryRun,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerByPhone,
  getCustomer,
  getCustomerInvoices,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomersCSV,
};
