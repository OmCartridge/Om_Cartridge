const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');
const InvoiceCounter = require('../models/InvoiceCounter');
const { calculateInvoiceTotals, getFinancialYear } = require('../utils/invoiceUtils');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInvoiceEmail } = require('../services/emailService');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * validateObjectId — returns 400 if id is not a valid MongoDB ObjectId.
 */
const validateObjectId = (id, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return false;
  }
  return true;
};

/**
 * generateInvoiceNumber — atomic, race-condition-safe using InvoiceCounter.$inc.
 */
const generateInvoiceNumber = async (prefix, financialYear) => {
  const counterId = `${prefix}/${financialYear}`;
  const counter = await InvoiceCounter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true }
  );
  return `${prefix}/${counter.sequence}/${financialYear}`;
};

// ── GET /api/invoices ─────────────────────────────────────────────────────────
const getInvoices = async (req, res, next) => {
  try {
    const { search, status, customerId, businessType, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (businessType) filter.businessType = businessType;
    if (customerId) {
      if (!mongoose.isValidObjectId(customerId)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID' });
      }
      filter.customerId = customerId;
    }
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/invoices/:id ─────────────────────────────────────────────────────
const getInvoice = async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id, res)) return;

    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email phone gstin address state stateCode')
      .lean();
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/invoices ────────────────────────────────────────────────────────
const createInvoice = async (req, res, next) => {
  try {
    const {
      customerId, invoiceDate, items, isInterState,
      taxMode, businessType,
      paymentTerms, referenceNumber, buyersOrderNumber,
      deliveryNote, dispatchDetails, destination, termsOfDelivery,
      sendEmail,
    } = req.body;

    // Resolve businessType & taxMode: Om Cartridge = without_tax, Om Enterprise = with_tax
    const resolvedBusinessType = (businessType === 'OM_CARTRIDGE' || taxMode === 'without_tax')
      ? 'OM_CARTRIDGE'
      : 'OM_ENTERPRISE';
    const resolvedTaxMode = resolvedBusinessType === 'OM_CARTRIDGE' ? 'without_tax' : 'with_tax';

    // --- Basic validation ---
    if (!customerId || !mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: 'Valid customer ID is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one item' });
    }
    if (items.length > 100) {
      return res.status(400).json({ success: false, message: 'Invoice cannot have more than 100 line items' });
    }

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
      if (!item.productId || !mongoose.isValidObjectId(item.productId)) {
        return res.status(400).json({ success: false, message: 'Each item must have a valid product ID' });
      }

      const qty = Number(item.quantity);
      const rate = Number(item.rate);

      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
      }
      if (!Number.isFinite(rate) || rate < 0) {
        return res.status(400).json({ success: false, message: 'Rate cannot be negative or invalid' });
      }
      if (qty > 99999) {
        return res.status(400).json({ success: false, message: 'Quantity exceeds allowed maximum' });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }
      if (!product.isActive) {
        return res.status(400).json({ success: false, message: `Product "${product.name}" is inactive` });
      }

      processedItems.push({
        product,
        itemData: {
          productId: product._id,
          description: item.description || product.name,
          hsnSac: item.hsnSac || product.hsnSac || '',
          quantity: qty,
          unit: item.unit || product.unit || 'PCS',
          rate,
          gstRate: item.gstRate !== undefined ? Number(item.gstRate) : product.gstRate,
          discountType: item.discountType || 'none',
          discountValue: Number(item.discountValue) || 0,
        },
      });
    }

    // --- Calculate totals on backend (never trust client totals) ---
    const calculated = calculateInvoiceTotals(
      processedItems.map((p) => p.itemData),
      !!isInterState,
      resolvedTaxMode
    );

    // --- Generate invoice number (atomic) ---
    const financialYear = getFinancialYear(invoiceDate ? new Date(invoiceDate) : new Date());
    const prefix = invoiceSettings.prefix || biz.prefix || 'OM';
    const invoiceNumber = await generateInvoiceNumber(prefix, financialYear);

    // --- Deduct stock atomically (each item uses conditional $inc with $gte guard) ---
    const stockResults = [];
    for (const { product, itemData } of processedItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, quantity: { $gte: itemData.quantity } },
        { $inc: { quantity: -itemData.quantity } },
        { new: true }
      );

      if (!updated) {
        // Rollback already-decremented items
        for (const done of stockResults) {
          await Product.findByIdAndUpdate(done.productId, { $inc: { quantity: done.qty } }).catch(() => {});
        }
        // Decrement InvoiceCounter to reclaim the sequence number
        await InvoiceCounter.findByIdAndUpdate(
          `${prefix}/${financialYear}`,
          { $inc: { sequence: -1 } }
        ).catch(() => {});

        const fresh = await Product.findById(product._id).lean();
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${fresh?.quantity ?? 0} ${product.unit}`,
        });
      }

      stockResults.push({ productId: product._id, qty: itemData.quantity, prevQty: updated.quantity + itemData.quantity });
    }

    // --- Create invoice document ---
    let invoice;
    try {
      invoice = await Invoice.create({
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        customerId,
        businessDetails: {
          name: resolvedBusinessType === 'OM_CARTRIDGE' ? 'OM CARTRIDGE' : (biz.name || 'OM ENTERPRISE'),
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
        totalDiscount: calculated.totalDiscount || 0,
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
        taxMode: resolvedTaxMode,
        businessType: resolvedBusinessType,
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
      // Roll back stock deductions
      console.error('Invoice creation failed, rolling back stock:', invoiceError.message);
      for (const { productId, qty } of stockResults) {
        await Product.findByIdAndUpdate(productId, { $inc: { quantity: qty } }).catch(() => {});
      }
      await InvoiceCounter.findByIdAndUpdate(
        `${prefix}/${financialYear}`,
        { $inc: { sequence: -1 } }
      ).catch(() => {});
      throw invoiceError;
    }

    // --- Create StockMovement records ---
    for (const { product, itemData } of processedItems) {
      const result = stockResults.find((d) => d.productId.toString() === product._id.toString());
      const prevQty = result ? result.prevQty : product.quantity + itemData.quantity;
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

    // --- Generate PDF buffer (in-memory) ---
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInvoicePDF(invoice.toObject());
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

        if (pdfBuffer && smtpConfig.host && smtpConfig.user && smtpConfig.password) {
          await sendInvoiceEmail({ invoice: invoice.toObject(), pdfBuffer, smtpConfig });
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

// ── POST /api/invoices/:id/cancel ─────────────────────────────────────────────
const cancelInvoice = async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id, res)) return;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Invoice is already cancelled' });
    }

    // Restore stock for each item (atomic increment)
    for (const item of invoice.items) {
      if (!item.productId) continue;
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const prevQty = product.quantity;
      const newQty = prevQty + item.quantity;

      await Product.findByIdAndUpdate(product._id, { $inc: { quantity: item.quantity } });

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

// ── GET /api/invoices/:id/pdf ─────────────────────────────────────────────────
// Auth required (protect middleware in routes); returns 404 not 403 to avoid
// revealing whether other users' invoice IDs exist.
const downloadInvoicePDF = async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id, res)) return;

    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let pdfBuffer;
    try {
      pdfBuffer = await generateInvoicePDF(invoice);
    } catch (err) {
      console.error('PDF generation error:', err.message);
      return res.status(500).json({ success: false, message: 'PDF generation failed' });
    }

    const safeName = (invoice.invoiceNumber || 'invoice').replace(/[/\\:*?"<>|]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OM-INV-${safeName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/invoices/:id/email ──────────────────────────────────────────────
const emailInvoice = async (req, res, next) => {
  try {
    if (!validateObjectId(req.params.id, res)) return;

    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const customerEmail = invoice.customerSnapshot?.email;
    if (!customerEmail) {
      return res.status(400).json({ success: false, message: 'Customer email not available' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    const settings = await Settings.findOne({});
    const smtp = settings?.smtp || {};
    const smtpConfig = {
      host: smtp.host || process.env.SMTP_HOST || '',
      port: smtp.port || process.env.SMTP_PORT || 587,
      user: smtp.user || process.env.SMTP_USER || '',
      password: smtp.password || process.env.SMTP_PASSWORD || '',
      from: smtp.from || process.env.SMTP_FROM || '',
    };

    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.password) {
      return res.status(400).json({
        success: false,
        message: 'SMTP email credentials are not configured. Please set SMTP host, user, and app password in Settings.',
      });
    }

    await sendInvoiceEmail({ invoice, pdfBuffer, smtpConfig });
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
