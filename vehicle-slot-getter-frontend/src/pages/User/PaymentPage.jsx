import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import '../../styles/PaymentPage.css';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    const fetchBooking = useCallback(async () => {
        try {
            setLoading(true);
            const response = await bookingService.getUserBookings();
            const bookings = response.data.data.bookings || [];
            const current = bookings.find(b => b._id === bookingId);

            if (!current) {
                setError('Booking not found');
            } else {
                setBooking(current);
            }
        } catch (err) {
            console.error('Fetch booking error:', err);
            setError('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    // Load Razorpay script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async (type = 'BOOKING') => {
        try {
            setVerifying(true);
            const res = await loadRazorpayScript();

            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // 1. Create Order on Backend
            const orderRes = await bookingService.createPaymentOrder(bookingId, type);
            if (!orderRes.data.success) {
                throw new Error(orderRes.data.message);
            }

            const { order_id, amount, currency, key_id } = orderRes.data.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: 'Smart Parking System',
                description: type === 'FINE' ? 'Overstay Fine Payment' : 'Parking Slot Booking',
                order_id: order_id,
                handler: async (response) => {
                    // 3. Verify Payment on Backend
                    try {
                        const verifyRes = await bookingService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId,
                            type
                        });

                        if (verifyRes.data.success) {
                            alert('Payment Successful!');
                            navigate('/my-bookings');
                        } else {
                            alert('Verification failed: ' + verifyRes.data.message);
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        alert('Error verifying payment');
                    }
                },
                prefill: {
                    name: 'User',
                    email: 'user@example.com',
                },
                theme: {
                    color: '#3399cc',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment Failed: ' + response.error.description);
            });
            rzp.open();

        } catch (err) {
            console.error('Payment Error:', err);
            alert('Error initiating payment.');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return (
        <div className="payment-page">
            <div className="spinner"></div>
        </div>
    );

    if (error) return (
        <div className="payment-page">
            <div className="payment-card">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/bookings')} className="pay-now-btn">Go Back</button>
            </div>
        </div>
    );

    const isOverdue = booking.bookingStatus === 'overdue';

    return (
        <div className="payment-page">
            <div className="payment-card">
                <div className="payment-header">
                    <h1>{isOverdue ? 'Overdue Fine ⚠️' : 'Finalize Booking 💳'}</h1>
                    <p>{isOverdue ? 'Please pay the fine to complete your booking' : 'Secure payment via Razorpay'}</p>
                </div>

                <div className="booking-summary-box">
                    <div className="summary-item">
                        <span className="summary-label">Parking:</span>
                        <span className="summary-value">{booking.parkingId.name}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Vehicle:</span>
                        <span className="summary-value">{booking.vehicleNumber}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Slot:</span>
                        <span className="summary-value">{booking.slotId.slotNumber}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Amount to Pay:</span>
                        <span className="summary-value amount">₹{isOverdue ? booking.fineAmount : booking.bookingAmount}</span>
                    </div>
                </div>

                <div className="payment-options">
                    <button
                        className="pay-now-btn"
                        onClick={() => handlePayment(isOverdue ? 'FINE' : 'BOOKING')}
                        disabled={verifying}
                    >
                        {verifying ? 'Processing...' : `Pay ₹${isOverdue ? booking.fineAmount : booking.bookingAmount} →`}
                    </button>
                </div>

                <div className="payment-footer">
                    🔒 100% Secure Transaction
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
