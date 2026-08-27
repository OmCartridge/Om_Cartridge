const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// GET /api/dashboard/summary
const getSummary = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalProducts,
      products,
      totalInvoices,
      todaysSales,
      monthSales,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true }),
      Invoice.countDocuments({ status: { $ne: 'CANCELLED' } }),
      Invoice.aggregate([
        {
          $match: {
            invoiceDate: { $gte: startOfDay },
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Invoice.aggregate([
        {
          $match: {
            invoiceDate: { $gte: startOfMonth },
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
    ]);

    const totalStockQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStockCount = products.filter(
      (p) => p.quantity > 0 && p.quantity <= p.minimumStock
    ).length;
    const outOfStockCount = products.filter((p) => p.quantity <= 0).length;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalStockQuantity,
        lowStockCount,
        outOfStockCount,
        totalInvoices,
        todaysSales: todaysSales[0]?.total || 0,
        monthSales: monthSales[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/recent-invoices
const getRecentInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/low-stock
const getLowStock = async (req, res, next) => {
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

module.exports = { getSummary, getRecentInvoices, getLowStock };
