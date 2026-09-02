const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: { type: String, required: true },
  hsnSac: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'PCS' },
  rate: { type: Number, required: true, min: 0 },         // original rate from product
  amount: { type: Number, required: true },               // qty × rate (before discount)
  // Discount support
  discountType: { type: String, enum: ['none', 'percent', 'fixed'], default: 'none' },
  discountValue: { type: Number, default: 0 },            // % value or fixed rupee amount
  discountAmount: { type: Number, default: 0 },           // computed discount rupee amount
  finalAmount: { type: Number, required: true },          // amount - discountAmount (taxable base)
  // GST
  gstRate: { type: Number, default: 18 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

    // Snapshot of business details at time of invoice creation
    businessDetails: {
      name: { type: String, default: 'OM ENTERPRISE' },
      brandName: { type: String, default: 'OM CARTRIDGE' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
      state: { type: String, default: 'Gujarat' },
      stateCode: { type: String, default: '24' },
      phone1: { type: String, default: '' },
      phone2: { type: String, default: '' },
    },

    // Snapshot of customer at time of invoice
    customerSnapshot: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
      state: { type: String, default: '' },
      stateCode: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },

    // Snapshot of bank details
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNo: { type: String, default: '' },
      branch: { type: String, default: '' },
      ifsc: { type: String, default: '' },
    },

    items: [invoiceItemSchema],

    subtotal: { type: Number, required: true },           // sum of amount (before discounts)
    totalDiscount: { type: Number, default: 0 },          // sum of all discountAmounts
    taxableValue: { type: Number, required: true },       // subtotal - totalDiscount
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, default: '' },
    taxAmountInWords: { type: String, default: '' },

    // Transaction type
    isInterState: { type: Boolean, default: false },
    taxMode: { type: String, enum: ['with_tax', 'without_tax'], default: 'with_tax' },

    // Invoice metadata
    paymentTerms: { type: String, default: '' },
    referenceNumber: { type: String, default: '' },
    buyersOrderNumber: { type: String, default: '' },
    deliveryNote: { type: String, default: '' },
    dispatchDetails: { type: String, default: '' },
    destination: { type: String, default: '' },
    termsOfDelivery: { type: String, default: '' },

    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'PAID', 'CANCELLED'],
      default: 'GENERATED',
    },

    pdfPath: { type: String, default: '' },

    emailStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED'],
      default: 'NOT_SENT',
    },
    emailSentAt: { type: Date },

    declaration: {
      type: String,
      default: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    },
    jurisdiction: { type: String, default: 'SUBJECT TO AHMEDABAD JURISDICTION' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
