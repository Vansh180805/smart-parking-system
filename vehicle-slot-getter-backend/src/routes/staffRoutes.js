const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All staff routes require authentication and staff/admin role
router.use(authMiddleware(['staff', 'admin']));

// Verify parking entry via QR
router.post('/verify-parking', staffController.verifyParking);

// Mark vehicle as unparked
router.post('/mark-unparked/:bookingId', staffController.markUnparked);

// Get pending entries
router.get('/pending-entries', staffController.getPendingEntries);

// Get currently parked vehicles
router.get('/parked-vehicles', staffController.getParkedVehicles);

// Get booking details
router.get('/booking/:bookingId', staffController.getBookingDetails);

module.exports = router;
