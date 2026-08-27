const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');
const path = require('path');
const fs = require('fs');
const { calculateInvoiceTotals, getFinancialYear } = require('../utils/invoiceUtils');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInvoiceEmail } = require('../services/emailService');

// Generate invoice number: OM/1/2026-27
const generateInvoiceNumber = async (prefix, financialYear) => {
  const pattern = new RegExp(`^${prefix}/\\d+/${financialYear}$`);
  const lastInvoice = await Invoice.findOne({ invoiceNumber: { $regex: pattern } })
    .sort({ createdAt: -1 })
    .lean();

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('/');
    nextNum = parseInt(parts[1]) + 1;
  }
  return `${prefix}/${nextNum}/${financialYear}`;
};

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { search, status, customerId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id
const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email phone gstin address state stateCode')
      .lean();
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// POST /api/invoices — NO TRANSACTIONS (standalone MongoDB compatible)
const createInvoice = async (req, res, next) => {
  // Track stock deductions so we can roll back on error
  const stockDeductions = []; // { productId, qty }

  try {
    const {
      customerId, invoiceDate, items, isInterState,
      paymentTerms, referenceNumber, buyersOrderNumber,
      deliveryNote, dispatchDetails, destination, termsOfDelivery,
      sendEmail,
    } = req.body;

    // --- Basic validation ---
    if (!customerId) return res.status(400).json({ success: false, message: 'Customer is required' });
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one item' });

    // --- Load customer ---
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // --- Load settings ---
    const settings = (await Settings.findOne({})) || {};
    const biz = settings.business || {};
    const bank = settings.bank || {};
    const invoiceSettings = settings.invoice || {};

    // --- Validate items & check stock BEFORE any modification ---
    const processedItems = [];
    for (const item of items) {
      if (!item.productId)
        return res.status(400).json({ success: false, message: 'Each item must have a product' });
      if (!item.quantity || Number(item.quantity) <= 0)
        return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
      if (item.rate === undefined || item.rate < 0)
        return res.status(400).json({ success: false, message: 'Rate cannot be negative' });

      const product = await Product.findById(item.productId);
      if (!product)
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (!product.isActive)
        return res.status(400).json({ success: false, message: `Product "${product.name}" is inactive` });
      if (product.quantity < Number(item.quantity))
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity} ${product.unit}`,
        });

      processedItems.push({
        product,
        itemData: {
          productId: product._id,
          description: item.description || product.name,
          hsnSac: item.hsnSac || product.hsnSac || '',
          quantity: Number(item.quantity),
          unit: item.unit || product.unit || 'PCS',
          rate: Number(item.rate),
          gstRate: item.gstRate !== undefined ? Number(item.gstRate) : product.gstRate,
        },
      });
    }

    // --- Calculate totals on backend ---
    const calculated = calculateInvoiceTotals(
      processedItems.map((p) => p.itemData),
      !!isInterState
    );

    // --- Generate invoice number ---
    const financialYear = getFinancialYear(invoiceDate ? new Date(invoiceDate) : new Date());
    const prefix = invoiceSettings.prefix || biz.prefix || 'OM';
    const invoiceNumber = await generateInvoiceNumber(prefix, financialYear);

    // --- Deduct stock first (before creating invoice) ---
    for (const { product, itemData } of processedItems) {
      const prevQty = product.quantity;
      const newQty = prevQty - itemData.quantity;

      await Product.findByIdAndUpdate(product._id, { quantity: newQty });
      stockDeductions.push({ productId: product._id, qty: itemData.quantity, prevQty });
    }

    // --- Create invoice document ---
    let invoice;
    try {
      invoice = await Invoice.create({
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        customerId,
        businessDetails: {
          name: biz.name || 'OM ENTERPRISE',
          brandName: biz.brandName || 'OM CARTRIDGE',
          address: biz.address || '10, C-DAC Computer,\nBavla Road,\nSanand, Ahmedabad,\nGujarat',
          gstin: biz.gstin || '24ACWPZ3281G1ZX',
          state: biz.state || 'Gujarat',
          stateCode: biz.stateCode || '24',
          phone1: biz.phone1 || '70967 06868',
          phone2: biz.phone2 || '70967 06363',
        },
        customerSnapshot: {
          name: customer.name,
          address: customer.address,
          gstin: customer.gstin,
          state: customer.state,
          stateCode: customer.stateCode,
          phone: customer.phone,
          email: customer.email,
        },
        bankDetails: {
          bankName: bank.bankName || 'THE KALUPUR COMMERCIAL CO.OP.BANK LTD.',
          accountNo: bank.accountNo || '00520103077',
          branch: bank.branch || 'SANAND',
          ifsc: bank.ifsc || 'KCCB0SNN005',
        },
        items: calculated.items,
        subtotal: calculated.subtotal,
        taxableValue: calculated.taxableValue,
        cgst: calculated.cgst,
        sgst: calculated.sgst,
        igst: calculated.igst,
        totalTax: calculated.totalTax,
        roundOff: calculated.roundOff,
        grandTotal: calculated.grandTotal,
        amountInWords: calculated.amountInWords,
        taxAmountInWords: calculated.taxAmountInWords,
        isInterState: !!isInterState,
        paymentTerms: paymentTerms || invoiceSettings.defaultPaymentTerms || '',
        referenceNumber: referenceNumber || '',
        buyersOrderNumber: buyersOrderNumber || '',
        deliveryNote: deliveryNote || '',
        dispatchDetails: dispatchDetails || '',
        destination: destination || '',
        termsOfDelivery: termsOfDelivery || '',
        status: 'GENERATED',
        declaration:
          invoiceSettings.declaration ||
          'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
        jurisdiction: invoiceSettings.jurisdiction || 'SUBJECT TO AHMEDABAD JURISDICTION',
        createdBy: req.user._id,
      });
    } catch (invoiceError) {
      // Roll back stock deductions if invoice creation failed
      console.error('Invoice creation failed, rolling back stock:', invoiceError.message);
      for (const { productId, prevQty } of stockDeductions) {
        await Product.findByIdAndUpdate(productId, { quantity: prevQty }).catch(() => {});
      }
      throw invoiceError;
    }

    // --- Create StockMovement records ---
    for (const { product, itemData } of processedItems) {
      const deduction = stockDeductions.find(
        (d) => d.productId.toString() === product._id.toString()
      );
      const prevQty = deduction ? deduction.prevQty : product.quantity + itemData.quantity;
      const newQty = prevQty - itemData.quantity;

      await StockMovement.create({
        productId: product._id,
        type: 'OUT',
        quantity: itemData.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: `Invoice: ${invoiceNumber}`,
        referenceType: 'INVOICE',
        referenceId: invoice._id.toString(),
        createdBy: req.user._id,
      }).catch((err) => console.error('StockMovement create error:', err.message));
    }

    // --- Generate PDF ---
    let pdfPath = '';
    try {
      const { filepath } = await generateInvoicePDF(invoice.toObject());
      pdfPath = filepath;
      await Invoice.findByIdAndUpdate(invoice._id, { pdfPath });
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError.message);
    }

    // --- Send email if requested ---
    let emailStatus = 'NOT_SENT';
    if (sendEmail && customer.email) {
      try {
        const smtp = settings.smtp || {};
        const smtpConfig = {
          host: smtp.host || process.env.SMTP_HOST || '',
          port: smtp.port || process.env.SMTP_PORT || 587,
          user: smtp.user || process.env.SMTP_USER || '',
          password: smtp.password || process.env.SMTP_PASSWORD || '',
          from: smtp.from || process.env.SMTP_FROM || '',
        };

        if (pdfPath && fs.existsSync(pdfPath)) {
          await sendInvoiceEmail({ invoice: invoice.toObject(), pdfPath, smtpConfig });
          emailStatus = 'SENT';
        } else {
          emailStatus = 'FAILED';
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        emailStatus = 'FAILED';
      }

      await Invoice.findByIdAndUpdate(invoice._id, {
        emailStatus,
        ...(emailStatus === 'SENT' ? { emailSentAt: new Date() } : {}),
      });
    }

    const responseMessage =
      emailStatus === 'FAILED'
        ? 'Invoice generated successfully, but email could not be sent.'
        : 'Invoice generated successfully';

    const freshInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email phone')
      .lean();

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: freshInvoice,
      emailStatus,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/invoices/:id/cancel — restore stock without transactions
const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status === 'CANCELLED')
      return res.status(400).json({ success: false, message: 'Invoice is already cancelled' });

    // Restore stock for each item
    for (const item of invoice.items) {
      if (!item.productId) continue;
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const prevQty = product.quantity;
      const newQty = prevQty + item.quantity;

      await Product.findByIdAndUpdate(product._id, { quantity: newQty });

      await StockMovement.create({
        productId: product._id,
        type: 'IN',
        quantity: item.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason: `Invoice Cancelled: ${invoice.invoiceNumber}`,
        referenceType: 'CANCELLATION',
        referenceId: invoice._id.toString(),
        createdBy: req.user._id,
      }).catch((err) => console.error('StockMovement (cancel) error:', err.message));
    }

    invoice.status = 'CANCELLED';
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice cancelled and stock restored successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id/pdf  (no auth — public so browsers can download directly)
const downloadInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    let pdfPath = invoice.pdfPath;

    // Regenerate if file doesn't exist or path is empty
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      try {
        const result = await generateInvoicePDF(invoice);
        pdfPath = result.filepath;
        await Invoice.findByIdAndUpdate(invoice._id, { pdfPath });
      } catch (err) {
        console.error('PDF generation error:', err.message);
        return res
          .status(500)
          .json({ success: false, message: 'PDF generation failed: ' + err.message });
      }
    }

    // Ensure absolute path (required by Express on Windows)
    const absolutePath = path.resolve(pdfPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on disk' });
    }

    const safeName = (invoice.invoiceNumber || 'invoice').replace(/[\/\\:*?"<>|]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OM-INV-${safeName}.pdf"`);

    res.sendFile(absolutePath, (err) => {
      if (err) {
        console.error('sendFile error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Failed to send PDF file' });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


// POST /api/invoices/:id/email
const emailInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const customerEmail = invoice.customerSnapshot?.email;
    if (!customerEmail)
      return res.status(400).json({ success: false, message: 'Customer email not available' });

    let pdfPath = invoice.pdfPath;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      const result = await generateInvoicePDF(invoice);
      pdfPath = result.filepath;
      await Invoice.findByIdAndUpdate(invoice._id, { pdfPath });
    }

    const settings = await Settings.findOne({});
    const smtp = settings?.smtp || {};
    const smtpConfig = {
      host: smtp.host || process.env.SMTP_HOST || '',
      port: smtp.port || process.env.SMTP_PORT || 587,
      user: smtp.user || process.env.SMTP_USER || '',
      password: smtp.password || process.env.SMTP_PASSWORD || '',
      from: smtp.from || process.env.SMTP_FROM || '',
    };

    await sendInvoiceEmail({ invoice, pdfPath, smtpConfig });
    await Invoice.findByIdAndUpdate(invoice._id, { emailStatus: 'SENT', emailSentAt: new Date() });

    res.json({ success: true, message: 'Invoice emailed successfully' });
  } catch (error) {
    await Invoice.findByIdAndUpdate(req.params.id, { emailStatus: 'FAILED' }).catch(() => {});
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  cancelInvoice,
  downloadInvoicePDF,
  emailInvoice,
};
