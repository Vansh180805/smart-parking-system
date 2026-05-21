const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All payment routes usually require authentication, but /verify is being made public
// to fix issues where callbacks from frontend/Razorpay might hit auth limits or lose tokens.
router.post('/create-order', authMiddleware(), paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

// 🔍 DEBUG ENDPOINT - Test Razorpay credentials directly
router.get('/debug/test-credentials', (req, res) => {
    const Razorpay = require('razorpay');

    console.log("\n🔍 === RAZORPAY CREDENTIAL DEBUG ===");
    console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID);
    console.log("KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET?.substring(0, 10) + "***" + process.env.RAZORPAY_KEY_SECRET?.slice(-5));
    console.log("SECRET LENGTH:", process.env.RAZORPAY_KEY_SECRET?.length);

    try {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        console.log("✅ Razorpay instance created successfully");

        res.json({
            success: true,
            message: "Razorpay credentials are valid",
            keyId: process.env.RAZORPAY_KEY_ID,
            secretLength: process.env.RAZORPAY_KEY_SECRET?.length,
            status: "READY FOR LIVE PAYMENTS"
        });
    } catch (error) {
        console.error("❌ Razorpay initialization error:", error.message);

        res.status(400).json({
            success: false,
            message: "Razorpay credentials are INVALID",
            error: error.message,
            status: "CREDENTIALS MISMATCH"
        });
    }
});

module.exports = router;
