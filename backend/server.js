const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routesRouter = require('./routes/routes');
const geocodeRouter = require('./routes/geocode');
const sosRouter = require('./routes/sos');
const authRouter = require('./routes/auth');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS – allow all localhost origins during development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (file://, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost / 127.0.0.1 port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow configured frontend URL
    if (origin === (process.env.FRONTEND_URL || 'http://localhost:3000')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/routes', routesRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/sos', sosRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SheRoutes API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SheRoutes API 🌸' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ─── DB Connection & Start ──────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => {
      console.log(`\n🌸 SheRoutes server running on http://localhost:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔑 Google Maps API: ${process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' ? '✅ Configured' : '⚠️  Not configured (Demo Mode)'}\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

module.exports = app;
