const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Slot = require('../models/Slot');

// Initialize Razorpay
// Note: These should be in your .env file
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

console.log('🔍 RAZORPAY INITIALIZED WITH KEY_ID:', process.env.RAZORPAY_KEY_ID ? `[${process.env.RAZORPAY_KEY_ID}]` : 'MISSING');

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { bookingId, type } = req.body; // type: 'BOOKING' or 'FINE'

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        let amount = 0;
        if (type === 'FINE') {
            amount = booking.fineAmount;
        } else {
            amount = booking.bookingAmount;
        }

        if (isNaN(amount) || amount <= 0) {
            console.error(`❌ INVALID AMOUNT for Booking ${bookingId}: ${amount}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid payment amount ($' + amount + ')',
            });
        }

        const amountInPaise = Math.round(parseFloat(amount) * 100);
        console.log(`💰 Generating order for Booking: ${bookingId}, Amount: ₹${amount} (${amountInPaise} paise)`);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: {
                bookingId: booking._id.toString(),
                type: type
            }
        };

        const order = await razorpay.orders.create(options);
        
        // Log to payment.log
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] SUCCESS: Order ${order.id} created for Booking ${bookingId}. Amount: ${order.amount}\n`;
        fs.appendFileSync('payment.log', logMsg);
        console.log('✅ Razorpay Order Created:', order.id);

        // Save order ID to booking for verification
        booking.razorpayOrderId = order.id;
        await booking.save();

        return res.status(200).json({
            success: true,
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_id'
            },
        });
    } catch (error) {
        console.error('❌ Create Payment Order Error:', error);
        
        // Log to payment.log
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] ERROR creating order for Booking ${req.body?.bookingId}: ${error.message}\n`;
        fs.appendFileSync('payment.log', logMsg);

        return res.status(500).json({
            success: false,
            message: 'Error creating payment order',
            error: error.message,
        });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            type // 'BOOKING' or 'FINE'
        } = req.body;

        // Log Verify Attempt Start
        const fs = require('fs');
        const startLogMsg = `[${new Date().toISOString()}] VERIFY START: Order ${razorpay_order_id}, Booking ${bookingId}, Type ${type}\n`;
        fs.appendFileSync('payment.log', startLogMsg);
        console.log(`🔥 VERIFY API HIT: ${razorpay_order_id} for ${bookingId}`);

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
        const expectedSign = crypto
            .createHmac("sha256", secret)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is verified
            const booking = await Booking.findById(bookingId)
                .populate('userId')
                .populate('parkingId')
                .populate('slotId');

            if (!booking) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }

            let amountPaid = 0;

            if (type === 'FINE') {
                // Update Booking for Fine
                booking.finePaid = true;
                booking.bookingStatus = 'completed';
                amountPaid = booking.fineAmount;

                // Update Slot status
                const slot = await Slot.findById(booking.slotId);
                if (slot) {
                    slot.status = 'available';
                    slot.currentBookingId = null;
                    await slot.save();
                }
            } else {
                // Update Booking for Initial Payment
                booking.paymentStatus = 'completed';
                booking.bookingStatus = 'confirmed';
                amountPaid = booking.bookingAmount;

                // Slot status updated - Should be 'reserved' until they actually park
                const slot = await Slot.findById(booking.slotId);
                if (slot) {
                    slot.status = 'reserved';
                    slot.currentBookingId = booking._id;
                    await slot.save();
                }
                
                console.log(`📧 [EMAIL SIMULATION]: Booking confirmation would be sent to: ${booking.userId?.email || 'user'}`);
            }

            booking.razorpayPaymentId = razorpay_payment_id;
            booking.totalPaid = (booking.totalPaid || 0) + amountPaid;
            booking.paymentMethod = 'razorpay';
            await booking.save();

            // Create Payment Record
            await Payment.create({
                bookingId,
                userId: booking.userId._id,
                amount: amountPaid,
                paymentType: type === 'FINE' ? 'fine' : 'booking',
                paymentMethod: 'card', // Or dynamically set from razorpay response if needed
                status: 'completed',
                transactionId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });

            // Log Success
            const fs = require('fs');
            const logMsg = `[${new Date().toISOString()}] VERIFIED: Payment ${razorpay_payment_id} for Booking ${bookingId} (${type})\n`;
            fs.appendFileSync('payment.log', logMsg);

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }
    } catch (error) {
        console.error('Verify Payment Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during verification',
            error: error.message,
        });
    }
};
