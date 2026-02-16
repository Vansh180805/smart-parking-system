const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();


// ===== MIDDLEWARE =====

// ✅ SIMPLE CORS (BEST FOR DEVELOPMENT)
app.use(cors());

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ===== ROUTES =====
const authRoutes = require('./routes/authRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const startBookingCron = require('./services/bookingCron');

// Start Cron Jobs
startBookingCron();


// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Vehicle Parking Backend API',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/staff', staffRoutes);
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

app.listen(PORT, () => {
  console.log(`
✅ Smart Vehicle Parking Backend Running
🚀 Port: ${PORT}
🌍 Mode: ${process.env.NODE_ENV || 'development'}
📊 MongoDB Connected
  `);
});
