const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    hsnSac: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, required: true, default: 'PCS', trim: true },
    purchaseRate: { type: Number, required: true, default: 0, min: 0 },
    sellingRate: { type: Number, required: true, default: 0, min: 0 },
    gstRate: { type: Number, required: true, default: 18, enum: [0, 5, 12, 18, 28] },
    minimumStock: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.virtual('stockStatus').get(function () {
  if (this.quantity <= 0) return 'OUT_OF_STOCK';
  if (this.quantity <= this.minimumStock) return 'LOW_STOCK';
  return 'IN_STOCK';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
