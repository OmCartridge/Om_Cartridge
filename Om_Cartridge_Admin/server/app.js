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

// Connect to MongoDB (uses cached connection in serverless)
connectDB();

// CORS — allow localhost in dev and production Vercel domain via env var
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5001',
];
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. same-origin on Vercel, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow localhost in dev
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
      // Allow any Vercel deployment domain (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow custom configured CORS_ORIGIN
      if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve generated invoices statically (local dev only — not persistent on Vercel)
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Ensure MongoDB is connected before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed: ' + err.message });
  }
});

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

module.exports = app;
