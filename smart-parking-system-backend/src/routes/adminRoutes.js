const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(authMiddleware(['admin']));

// Dashboard summary
router.get('/dashboard-summary', adminController.getDashboardSummary);

// Vehicle statistics
router.get('/vehicle-stats', adminController.getVehicleStats);

// Revenue statistics
router.get('/revenue-stats', adminController.getRevenueStats);

// Booking trends
router.get('/booking-trends', adminController.getBookingTrends);

// Fine statistics
router.get('/fine-stats', adminController.getFineStats);

// Parking performance
router.get('/parking-performance', adminController.getParkingPerformance);

// Hourly trends
router.get('/hourly-trends', adminController.getHourlyTrends);

module.exports = router;
