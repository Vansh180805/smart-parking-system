const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.use(authMiddleware());

// Get nearest parking
router.get('/nearest-parking', bookingController.getNearestParking);

// Get parking slots
router.get('/parking/:parkingId/slots', bookingController.getParkingSlots);

// Create booking
router.post('/create', bookingController.createBooking);

// QR Payment
router.post('/:bookingId/pay-qr', bookingController.paymentQR);

// Get user bookings
router.get('/my-bookings', bookingController.getUserBookings);

// Cancel booking
router.post('/:bookingId/cancel', bookingController.cancelBooking);

// Check overstay
router.get('/:bookingId/check-overstay', bookingController.checkOverstay);

// Exit parking
router.post('/:bookingId/exit', bookingController.processExit);

module.exports = router;
