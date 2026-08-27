const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

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

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getStockMovements,
  getLowStockProducts,
};
