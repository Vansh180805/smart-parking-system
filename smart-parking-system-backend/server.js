const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();


// ===== MIDDLEWARE =====

// ✅ SIMPLE CORS (BEST FOR DEVELOPMENT)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://127.0.0.1:3002', process.env.FRONTEND_URL], // frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['x-rtb-fingerprint-id', 'request-id'] // 🔥 FIX
}));

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Expose-Headers",
    "x-rtb-fingerprint-id, request-id"
  );
  next();
});

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ===== ROUTES =====
const authRoutes = require('./src/routes/authRoutes');
const parkingRoutes = require('./src/routes/parkingRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const startBookingCron = require('./src/services/bookingCron');

// Start Cron Jobs
startBookingCron();


// Health check
app.get('/', (req, res) => {
  const mongoose = require('mongoose');
  res.status(200).json({
    success: true,
    message: 'Smart Vehicle Parking Backend API',
    version: '1.0.0',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);


// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});


// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅ Smart Vehicle Parking Backend Running
🚀 Port: ${PORT}
🌍 Mode: ${process.env.NODE_ENV || 'development'}
📊 MongoDB Connected
  `);
});
