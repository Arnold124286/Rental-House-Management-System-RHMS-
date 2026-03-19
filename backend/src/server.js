require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const {
  propRouter, unitRouter, leaseRouter, payRouter, maintRouter,
  dashRouter, userRouter, reviewRouter, leaseReqRouter, complaintRouter,
  relocationRouter
} = require('./routes/index');
const uploadRouter = require('./routes/uploadRouter');

const app = express();

// Security & middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests.' } }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏠 RHMS API is running',
    version: '1.0.0',
    endpoints: '/api/...'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propRouter);
app.use('/api/units', unitRouter);
app.use('/api/leases', leaseRouter);
app.use('/api/payments', payRouter);
app.use('/api/maintenance', maintRouter);
app.use('/api/dashboard', dashRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/lease-requests', leaseReqRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/relocations', relocationRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'RHMS API is running 🏠', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('🏠 ======================================');
  console.log(`🏠  RHMS Backend running on port ${PORT}`);
  console.log(`🏠  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🏠 ======================================');
  console.log('');
});

module.exports = app;