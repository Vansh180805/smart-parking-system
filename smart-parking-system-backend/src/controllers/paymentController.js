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

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment amount',
            });
        }

        const amountInPaise = Math.round(amount * 100);
        console.log(`💰 Generating order for Booking: ${bookingId}, Amount: ₹${amount} (${amountInPaise} paise)`);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${booking._id.toString().slice(-6)}_${Date.now()}`,
            notes: {
                bookingId: booking._id.toString(),
                type: type
            }
        };

        const order = await razorpay.orders.create(options);
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
        console.error('❌ Create Razorpay Order Error:', error);
        return res.status(500).json({
            success: false,
            message: error.description || 'Failed to create payment order',
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

                // Update Slot status
                const slot = await Slot.findById(booking.slotId);
                if (slot) {
                    slot.status = 'occupied';
                    slot.currentBookingId = booking._id;
                    await slot.save();
                }

                // Send Confirmation Email (Nodemailer)
                try {
                    const { sendBookingConfirmation } = require('../utils/emailSender');
                    // Fetch user and parking for email
                    const User = require('../models/User');
                    const ParkingLot = require('../models/ParkingLot');
                    const user = await User.findById(booking.userId);
                    const parking = await ParkingLot.findById(booking.parkingId);
                    await sendBookingConfirmation(booking, user, parking, slot);
                } catch (emailError) {
                    console.error('Failed to send confirmation email:', emailError);
                }
            }

            booking.razorpayPaymentId = razorpay_payment_id;
            booking.totalPaid = (booking.totalPaid || 0) + amountPaid;
            await booking.save();

            // Create Payment Record
            await Payment.create({
                bookingId,
                userId: booking.userId._id,
                amount: amountPaid,
                paymentType: type === 'FINE' ? 'fine' : 'booking',
                status: 'completed',
                transactionId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });

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
