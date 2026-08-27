const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: '' },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    state: { type: String, trim: true, default: 'Gujarat' },
    stateCode: { type: String, trim: true, default: '24' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
