const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { parseCSV } = require('../utils/invoiceUtils');

const VALID_GST_RATES = [0, 5, 12, 18, 28];
const VALID_UNITS = ['PCS', 'BOX', 'PACK', 'SET', 'ROLL', 'KG', 'LTR', 'MTR'];

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { search, status, isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { hsnSac: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    // Add stockStatus dynamically
    const productsWithStatus = products.map((p) => ({
      ...p,
      stockStatus:
        p.quantity <= 0 ? 'OUT_OF_STOCK' : p.quantity <= p.minimumStock ? 'LOW_STOCK' : 'IN_STOCK',
    }));

    if (status) {
      const filtered = productsWithStatus.filter((p) => p.stockStatus === status);
      return res.json({ success: true, data: filtered });
    }

    res.json({ success: true, data: productsWithStatus });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, hsnSac, description, quantity, unit, purchaseRate, sellingRate, gstRate, minimumStock, isActive } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Product name is required' });
    if (!sku || !sku.trim()) return res.status(400).json({ success: false, message: 'SKU is required' });
    if (sellingRate < 0) return res.status(400).json({ success: false, message: 'Selling rate cannot be negative' });
    if (quantity < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      hsnSac: hsnSac || '',
      description: description || '',
      quantity: quantity || 0,
      unit: unit || 'PCS',
      purchaseRate: purchaseRate || 0,
      sellingRate: sellingRate || 0,
      gstRate: gstRate || 18,
      minimumStock: minimumStock || 5,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Record initial stock movement if quantity > 0
    if (product.quantity > 0) {
      await StockMovement.create({
        productId: product._id,
        type: 'IN',
        quantity: product.quantity,
        previousQuantity: 0,
        newQuantity: product.quantity,
        reason: 'Initial Stock',
        referenceType: 'ADJUSTMENT',
        createdBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { name, sku, hsnSac, description, unit, purchaseRate, sellingRate, gstRate, minimumStock, isActive } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (sku !== undefined) product.sku = sku.trim().toUpperCase();
    if (hsnSac !== undefined) product.hsnSac = hsnSac;
    if (description !== undefined) product.description = description;
    if (unit !== undefined) product.unit = unit;
    if (purchaseRate !== undefined) product.purchaseRate = purchaseRate;
    if (sellingRate !== undefined) product.sellingRate = sellingRate;
    if (gstRate !== undefined) product.gstRate = gstRate;
    if (minimumStock !== undefined) product.minimumStock = minimumStock;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/stock/adjust
const adjustStock = async (req, res, next) => {
  try {
    const { productId, adjustment, reason } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
    if (adjustment === undefined || adjustment === null) return res.status(400).json({ success: false, message: 'Adjustment quantity is required' });
    if (!reason || !reason.trim()) return res.status(400).json({ success: false, message: 'Reason is required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const previousQty = product.quantity;
    const newQty = previousQty + Number(adjustment);

    if (newQty < 0) {
      return res.status(400).json({ success: false, message: `Cannot reduce stock below 0. Current stock: ${previousQty}` });
    }

    product.quantity = newQty;
    await product.save();

    await StockMovement.create({
      productId: product._id,
      type: adjustment > 0 ? 'IN' : 'OUT',
      quantity: Math.abs(adjustment),
      previousQuantity: previousQty,
      newQuantity: newQty,
      reason,
      referenceType: 'ADJUSTMENT',
      createdBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: { product, previousQuantity: previousQty, newQuantity: newQty },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/movements
const getStockMovements = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const filter = productId ? { productId } : {};
    const movements = await StockMovement.find(filter)
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/low
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$minimumStock'] },
    }).lean();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/import-csv
// Body: { csvContent: string, dryRun: boolean }
const importProductsCSV = async (req, res, next) => {
  try {
    const { csvContent, dryRun = true } = req.body;

    if (!csvContent || !csvContent.trim()) {
      return res.status(400).json({ success: false, message: 'CSV content is required.' });
    }

    const { headers, rows } = parseCSV(csvContent);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV is empty or has no data rows.' });
    }

    const requiredCols = ['name', 'sku'];
    const missingCols = requiredCols.filter(c => !headers.includes(c));
    if (missingCols.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required CSV columns: ${missingCols.join(', ')}. Required: name, sku. Optional: hsnsac, description, quantity, unit, purchaserate, sellingrate, gstrate, minimumstock`,
      });
    }

    const results = { newCount: 0, updateCount: 0, errorCount: 0, errors: [], preview: [] };

    for (const row of rows) {
      const rowNum = row._rowNumber;
      const rowErrors = [];

      const name = (row.name || '').trim();
      const sku = (row.sku || '').trim().toUpperCase();
      const hsnSac = (row.hsnsac || row['hsn/sac'] || row.hsn || '').trim();
      const description = (row.description || '').trim();
      const quantityRaw = row.quantity || '0';
      const quantity = parseFloat(quantityRaw);
      const unit = (row.unit || 'PCS').trim().toUpperCase();
      const purchaseRateRaw = row.purchaserate || row['purchase rate'] || '0';
      const purchaseRate = parseFloat(purchaseRateRaw);
      const sellingRateRaw = row.sellingrate || row['selling rate'] || '0';
      const sellingRate = parseFloat(sellingRateRaw);
      const gstRateRaw = row.gstrate || row['gst rate'] || '18';
      const gstRate = parseInt(gstRateRaw, 10);
      const minimumStockRaw = row.minimumstock || row['minimum stock'] || '5';
      const minimumStock = parseInt(minimumStockRaw, 10);

      if (!name) rowErrors.push('Product name is required');
      if (!sku) rowErrors.push('SKU is required');
      if (isNaN(quantity) || quantity < 0) rowErrors.push(`Invalid quantity: "${quantityRaw}"`);
      if (isNaN(purchaseRate) || purchaseRate < 0) rowErrors.push(`Invalid purchase rate: "${purchaseRateRaw}"`);
      if (isNaN(sellingRate) || sellingRate < 0) rowErrors.push(`Invalid selling rate: "${sellingRateRaw}"`);
      if (!VALID_GST_RATES.includes(gstRate)) rowErrors.push(`Invalid GST rate: "${gstRateRaw}". Must be 0, 5, 12, 18, or 28`);
      if (isNaN(minimumStock) || minimumStock < 0) rowErrors.push(`Invalid minimum stock: "${minimumStockRaw}"`);

      if (rowErrors.length > 0) {
        results.errorCount++;
        results.errors.push({ row: rowNum, messages: rowErrors });
        results.preview.push({ row: rowNum, action: 'error', name, sku, errors: rowErrors });
        continue;
      }

      const existing = sku ? await Product.findOne({ sku }).lean() : null;
      const action = existing ? 'update' : 'create';
      if (action === 'update') results.updateCount++;
      else results.newCount++;

      results.preview.push({ row: rowNum, action, name, sku, quantity, sellingRate, existingName: existing?.name });

      if (!dryRun) {
        const data = { name, sku, hsnSac, description, quantity: isNaN(quantity) ? 0 : quantity, unit, purchaseRate: isNaN(purchaseRate) ? 0 : purchaseRate, sellingRate: isNaN(sellingRate) ? 0 : sellingRate, gstRate: isNaN(gstRate) ? 18 : gstRate, minimumStock: isNaN(minimumStock) ? 5 : minimumStock };
        if (existing) {
          await Product.findByIdAndUpdate(existing._id, data);
        } else {
          await Product.create({ ...data, isActive: true });
          if (data.quantity > 0) {
            const newProd = await Product.findOne({ sku });
            if (newProd) {
              await StockMovement.create({ productId: newProd._id, type: 'IN', quantity: data.quantity, previousQuantity: 0, newQuantity: data.quantity, reason: 'CSV Import', referenceType: 'ADJUSTMENT', createdBy: req.user._id }).catch(() => {});
            }
          }
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
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getStockMovements,
  getLowStockProducts,
  importProductsCSV,
};
