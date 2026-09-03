const mongoose = require('mongoose');

/**
 * InvoiceCounter — atomic sequence generator per financial year.
 * Uses findOneAndUpdate + $inc to guarantee unique, gapless invoice numbers
 * even under concurrent requests.
 */
const invoiceCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "OM/2026-27"
  sequence: { type: Number, default: 0 },
});

module.exports = mongoose.model('InvoiceCounter', invoiceCounterSchema);
