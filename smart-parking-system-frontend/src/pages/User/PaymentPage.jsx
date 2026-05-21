import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import {
    AlertTriangle,
    CheckCircle2,
    Lock,
    Check,
    FlaskConical
} from 'lucide-react';
import '../../styles/PaymentPage.css';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [isSimulation, setIsSimulation] = useState(false);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const fetchBooking = useCallback(async () => {
        try {
            setLoading(true);
            const response = await bookingService.getBookingById(bookingId);
            if (response.data.success) {
                setBooking(response.data.data);
            } else {
                setError('Booking not found');
            }
        } catch (err) {
            console.error('Fetch booking error:', err);
            setError(err.response?.data?.message || 'Failed to load booking details.');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async (type = 'BOOKING', simulate = false) => {
        setError('');
        setIsSimulation(simulate);
        try {
            setVerifying(true);

            // 1. Create Payment Order
            const orderRes = await bookingService.createPaymentOrder(bookingId, type, simulate);
            if (!orderRes.data.success) {
                throw new Error(orderRes.data.message || 'Order creation failed');
            }

            const { order_id, amount, currency, key_id, isDemoMode } = orderRes.data.data;

            // If backend is in demo mode, automatically use simulation
            const useSimulation = simulate || isDemoMode;

            if (useSimulation) {
                // In simulation mode, we skip Razorpay UI and go straight to verification
                console.log('Simulation: Processing payment...');
                setIsSimulation(true);

                // Wait for 1.5s to show a "processing" state for realistic feel
                await new Promise(r => setTimeout(r, 1500));

                const verifyRes = await bookingService.verifyPayment({
                    razorpay_order_id: order_id,
                    razorpay_payment_id: `pay_sim_${Date.now()}`,
                    razorpay_signature: 'simulated_signature',
                    bookingId,
                    type
                });

                if (verifyRes.data.success) {
                    setSuccess(true);
                    setTimeout(() => navigate('/bookings/history'), 2000);
                } else {
                    throw new Error(verifyRes.data.message || 'Verification failed');
                }
                return;
            }

            // 2. Load Razorpay Script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
            }

            // 3. Open Razorpay Checkout
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: 'Smart Parking',
                description: type === 'FINE' ? 'Overstay Fine Payment' : 'Parking Slot Booking',
                order_id: order_id,
                handler: async (response) => {
                    setVerifying(true);
                    try {
                        const verifyRes = await bookingService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId,
                            type
                        });

                        if (verifyRes.data.success) {
                            setSuccess(true);
                            setTimeout(() => {
                                navigate('/bookings/history');
                            }, 2000);
                        } else {
                            throw new Error(verifyRes.data.message || 'Verification failed');
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        setError(err.response?.data?.message || err.message || 'Payment verification failed');
                    } finally {
                        setVerifying(false);
                    }
                },
                notes: {
                    booking_id: bookingId,
                    type: type
                },
                theme: {
                    color: '#8B5CF6',
                },
                modal: {
                    ondismiss: () => {
                        setVerifying(false);
                        setIsSimulation(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError(`Payment Failed: ${response.error.description}`);
                setIsSimulation(false);
            });
            rzp.open();

        } catch (err) {
            console.error('Payment Error:', err);
            setError(err.response?.data?.message || err.message || 'Payment initialization failed');
            setIsSimulation(false);
        } finally {
            if (!simulate) setVerifying(false);
        }
    };

    if (loading) return (
        <div className="payment-page">
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading booking details...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="payment-page">
            <div className="payment-card error-card animate-fade-in">
                <AlertTriangle size={64} className="error-icon" strokeWidth={1} style={{ margin: '0 auto', display: 'block', color: '#f87171' }} />
                <h2>Payment Error</h2>
                <p>{error}</p>
                <div className="error-actions">
                    <button onClick={fetchBooking} className="primary-btn">Retry Loading</button>
                    <button onClick={() => navigate('/bookings')} className="secondary-btn">Go Back</button>
                </div>
            </div>
        </div>
    );

    if (success) return (
        <div className="payment-page">
            {isSimulation && <div className="demo-badge"><Check size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Demo/Test Mode</div>}
            <div className="payment-card success-card animate-bounce-in">
                <CheckCircle2 size={64} className="success-icon" strokeWidth={1} style={{ margin: '0 auto', display: 'block', color: '#4ade80' }} />
                <h2>Payment Successful!</h2>
                <p>{isSimulation ? 'Demo payment simulation completed successfully.' : 'Your payment has been processed successfully.'}</p>
                <p className="redirect-text">Redirecting to your bookings...</p>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill"></div>
                </div>
                {isSimulation && (
                    <p style={{ marginTop: '20px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
                        Note: This is a test transaction. For production, use valid Razorpay credentials.
                    </p>
                )}
            </div>
        </div>
    );

    const isOverdue = booking?.bookingStatus === 'overdue' || booking?.fineAmount > 0;

    return (
        <div className="payment-page">
            <div className="payment-card animate-slide-up">
                {isSimulation && <div className="demo-badge"><Check size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Demo/Test Mode</div>}

                <div className="payment-header">
                    <div className="payment-badge">{isOverdue ? 'Fine Payment' : 'New Booking'}</div>
                    <h1>{isOverdue ? 'Clear Your Fine' : 'Secure Checkout'}</h1>
                    <p>Complete your transaction securely via Razorpay</p>
                </div>

                <div className="booking-summary-box">
                    <div className="summary-item">
                        <span className="summary-label">Parking Location</span>
                        <span className="summary-value">{booking?.parkingId?.name || 'N/A'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Assigned Slot</span>
                        <span className="summary-value highlight">{booking?.slotId?.slotNumber || 'N/A'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Vehicle Number</span>
                        <span className="summary-value">{booking?.vehicleNumber}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="summary-item total">
                        <span className="summary-label">Total Amount</span>
                        <span className="summary-value amount">₹{isOverdue ? booking?.fineAmount : booking?.bookingAmount}</span>
                    </div>
                </div>

                <div className="payment-options">
                    <button
                        className={`pay-now-btn ${verifying && !isSimulation ? 'processing' : ''}`}
                        onClick={() => handlePayment(isOverdue ? 'FINE' : 'BOOKING', false)}
                        disabled={verifying}
                    >
                        {verifying && !isSimulation ? (
                            <><span className="mini-spinner"></span> Processing...</>
                        ) : (
                            `Pay ₹${isOverdue ? booking?.fineAmount : booking?.bookingAmount} Now`
                        )}
                    </button>

                    <button
                        className={`secondary-btn simulation-btn ${verifying && isSimulation ? 'processing' : ''}`}
                        onClick={() => handlePayment(isOverdue ? 'FINE' : 'BOOKING', true)}
                        disabled={verifying}
                        style={{ marginTop: '10px', width: '100%', border: '1px dashed #8B5CF6', padding: '16px', borderRadius: '20px', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        {verifying && isSimulation ? (
                            <><span className="mini-spinner"></span> Simulating...</>
                        ) : (
                            <><FlaskConical size={16} /> Try Demo Payment (Simulation)</>
                        )}
                    </button>

                    <p className="payment-hint">You will be redirected to Razorpay secure gateway</p>
                </div>

                <div className="payment-footer">
                    <div className="security-info">
                        <Lock size={14} />
                        <span>SSL Encrypted & Secure</span>
                    </div>
                    <div className="payment-partners">
                        <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" width="20" />
                        <span>Powered by Razorpay</span>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default PaymentPage;
