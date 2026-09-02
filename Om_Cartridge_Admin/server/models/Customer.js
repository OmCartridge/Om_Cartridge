const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: '' },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    state: { type: String, trim: true, default: 'Gujarat' },
    stateCode: { type: String, trim: true, default: '24' },
    // phone is the primary unique identifier — null means not provided
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    email: { type: String, trim: true, lowercase: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Unique index on phone — sparse means null is allowed for multiple docs
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);
