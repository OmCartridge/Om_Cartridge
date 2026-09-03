require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // disabled — React SPA sets its own inline scripts
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS — strict production allowlist ───────────────────────────────────────
const productionOrigins = [
  process.env.FRONTEND_URL, // e.g. https://om-cartridge.vercel.app
].filter(Boolean);

const developmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5001',
];

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? productionOrigins
    : [...productionOrigins, ...developmentOrigins];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / same-origin requests (no Origin header)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ── Body Parsing — tight limits ───────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Invoices are generated dynamically in-memory and downloaded via authenticated /api/invoices/:id/pdf

// ── Global API Rate Limiter ───────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // generous for normal dashboard usage
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', globalLimiter);

// ── DB Connection Middleware ───────────────────────────────────────────────────
// Ensure MongoDB is connected before handling API requests (serverless-safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    res
      .status(500)
      .json({ success: false, message: 'Database connection failed' });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);

// Health check (public, not rate-limited)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OM Cartridge API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
