const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Singleton - only one settings document
    singleton: { type: String, default: 'settings', unique: true },

    business: {
      name: { type: String, default: 'OM ENTERPRISE' },
      brandName: { type: String, default: 'OM CARTRIDGE' },
      address: { type: String, default: '10, C-DAC Computer,\nBavla Road,\nSanand, Ahmedabad,\nGujarat' },
      gstin: { type: String, default: '24ACWPZ3281G1ZX' },
      state: { type: String, default: 'Gujarat' },
      stateCode: { type: String, default: '24' },
      phone1: { type: String, default: '70967 06868' },
      phone2: { type: String, default: '70967 06363' },
    },

    bank: {
      bankName: { type: String, default: 'THE KALUPUR COMMERCIAL CO.OP.BANK LTD.' },
      accountNo: { type: String, default: '00520103077' },
      branch: { type: String, default: 'SANAND' },
      ifsc: { type: String, default: 'KCCB0SNN005' },
    },

    invoice: {
      prefix: { type: String, default: 'OM' },
      defaultGstRate: { type: Number, default: 18 },
      defaultPaymentTerms: { type: String, default: 'Due on Receipt' },
      jurisdiction: { type: String, default: 'SUBJECT TO AHMEDABAD JURISDICTION' },
      declaration: {
        type: String,
        default:
          'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      },
    },

    smtp: {
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      user: { type: String, default: '' },
      password: { type: String, default: '' }, // stored encrypted in production
      from: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
