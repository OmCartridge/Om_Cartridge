require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const settingsRoutes = require('./routes/settings');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve generated invoices statically
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OM Cartridge API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
