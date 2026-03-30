const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All payment routes usually require authentication, but /verify is being made public
// to fix issues where callbacks from frontend/Razorpay might hit auth limits or lose tokens.
router.post('/create-order', authMiddleware(), paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
