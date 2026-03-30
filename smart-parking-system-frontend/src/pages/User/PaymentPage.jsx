import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import '../../styles/PaymentPage.css';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [isDemoMode, setIsDemoMode] = useState(false); // Default to true for stable demo //testing ke liye kia false
    const [showDemoModal, setShowDemoModal] = useState(false);

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

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSimulationResult = async (success) => {
        setShowDemoModal(false);
        if (success) {
            setVerifying(true);
            try {
                // Use QR/Simulation endpoint on backend to mark as paid
                const res = await bookingService.paymentQR(bookingId);
                if (res.data.success) {
                    // Success Animation Simulation
                    setTimeout(() => {
                        navigate('/bookings/history');
                    }, 500);
                }
            } catch (err) {
                alert('❌ Simulation Sync Error: ' + err.message);
            } finally {
                setVerifying(false);
            }
        }
    };

    const handlePayment = async (type = 'BOOKING') => {
        // 🚨 PROTOCOL GUARDIAN: Check if on HTTPS (which breaks Razorpay standard checkout on localhost)
        if (window.location.protocol === 'https:' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            alert("⚠️ SECURITY BLOCK: You are on an HTTPS page. Razorpay will FAIL with a 500 error here. \n\nRedirecting to stable HTTP now...");
            window.location.href = window.location.href.replace('https:', 'http:');
            return;
        }

        if (isDemoMode) {
            setShowDemoModal(true);
            return;
        }

        try {
            setError('');
            setVerifying(true);

            const orderRes = await bookingService.createPaymentOrder(bookingId, type);
            console.log("FULL RESPONSE:", orderRes.data);
            if (!orderRes.data.success) throw new Error('Order creation failed');

            const { order_id, amount, currency, key_id } = orderRes.data.data;

            console.log("🔥 RAZORPAY DEBUG:", { order_id, amount, currency, key_id });
            console.log("📦 BACKEND RESPONSE DATA:", orderRes.data.data);

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                console.error("❌ Razorpay script load failed");
                setIsDemoMode(true);
                setShowDemoModal(true);
                return;
            }

            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: 'Smart Parking System',
                description: type === 'FINE' ? 'Fine Payment' : 'Slot Booking Fee',

                method: {
                    upi: false,
                    netbanking: false,
                    wallet: false,
                    emi: false
                },

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
                        if (verifyRes.data.success) navigate('/bookings/history');
                    } catch (err) {
                        alert('Verification Failed. Using Demo Fallback...');
                        handleSimulationResult(true);
                    }
                },

                prefill: { name: user?.name, email: user?.email },
                theme: { color: '#6366f1' },
                modal: { ondismiss: () => setVerifying(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (err) => {
                console.error("❌ Razorpay Checkout Failed:", err.error);
                // Smoothly switch to demo modal on external failure
                setIsDemoMode(true);
                setShowDemoModal(true);
            });
            rzp.open();

        } catch (err) {
            console.error('Payment Error:', err);
            setIsDemoMode(true);
            setShowDemoModal(true);
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return <div className="payment-page"><div className="spinner"></div></div>;
    if (error) return <div className="payment-page"><div className="payment-card"><h2>{error}</h2><button onClick={() => navigate('/bookings')} className="pay-now-btn">Go Back</button></div></div>;

    const isOverdue = booking.bookingStatus === 'overdue';
    const amountToPay = isOverdue ? booking.fineAmount : booking.bookingAmount;

    return (
        <div className="payment-page">
            <div className="payment-card">
                {isDemoMode && <div className="demo-badge">Demo Mode</div>}

                <div className="payment-header">
                    <h1>{isOverdue ? 'Overdue Fine ⚠️' : 'Secure Checkout 💳'}</h1>
                    <p>{isOverdue ? 'Pay fine to resume services' : 'Finalize your slot reservation'}</p>
                </div>

                <div className="booking-summary-box">
                    <div className="summary-item">
                        <span className="summary-label">Parking:</span>
                        <span className="summary-value">{booking.parkingId.name}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Slot:</span>
                        <span className="summary-value">{booking.slotId.slotNumber}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Vehicle:</span>
                        <span className="summary-value">{booking.vehicleNumber}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Amount:</span>
                        <span className="summary-value amount">₹{amountToPay}</span>
                    </div>
                </div>

                <div className="payment-options">
                    <button
                        className="pay-now-btn"
                        onClick={() => handlePayment(isOverdue ? 'FINE' : 'BOOKING')}
                        disabled={verifying}
                    >
                        {verifying ? <div className="spinner"></div> : `Pay ₹${amountToPay} Now →`}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={isDemoMode}
                                onChange={(e) => setIsDemoMode(e.target.checked)}
                                style={{ accentColor: '#6366f1' }}
                            />
                            Use Demo Simulation (Stable for Presentation)
                        </label>
                    </div>
                </div>

                {/* 🏆 PREMIUM RAZORPAY CLONE MODAL */}
                {showDemoModal && (
                    <div className="premium-modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(8px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999
                    }}>
                        <div className="razorpay-clone" style={{
                            background: '#fff', width: '380px', borderRadius: '16px',
                            overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            animation: 'modalIn 0.3s ease-out', color: '#1e293b'
                        }}>
                            {/* Header */}
                            <div style={{ background: '#2b2f3a', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyItems: 'center', fontWeight: 'bold', fontSize: '18px', justifyContent: 'center' }}>P</div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Smart Parking</div>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>TEST MODE</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '18px' }}>₹{amountToPay}</div>
                            </div>

                            {/* Options Body */}
                            <div style={{ padding: '24px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Options</p>

                                {[
                                    { id: 'card', name: 'Card', sub: 'Visa, MasterCard, RuPay', icon: '💳' },
                                    { id: 'upi', name: 'UPI', sub: 'Google Pay, PhonePe, Paytm', icon: '📱' },
                                    { id: 'net', name: 'Netbanking', sub: 'All Indian Banks', icon: '🏦' },
                                ].map(opt => (
                                    <div
                                        key={opt.id}
                                        onClick={() => handleSimulationResult(true)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '15px', padding: '16px',
                                            border: '1px solid #f1f5f9', borderRadius: '12px', marginBottom: '10px',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{opt.name}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{opt.sub}</div>
                                        </div>
                                        <span style={{ marginLeft: 'auto', color: '#cbd5e1' }}>→</span>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setShowDemoModal(false)}
                                    style={{
                                        width: '100%', marginTop: '10px', background: 'none', border: 'none',
                                        color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                                    }}
                                >
                                    Cancel Payment
                                </button>
                            </div>

                            {/* Footer */}
                            <div style={{ background: '#f8fafc', padding: '12px', textAlign: 'center', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                                Secured by <span style={{ fontWeight: '800', color: '#2b2f3a' }}>RAZORPAY</span> • Built for Academic Demo
                            </div>
                        </div>
                    </div>
                )}

                <div className="payment-footer">
                    🔒 SSL Secured • Powered by Razorpay Sandbox
                </div>
            </div>

            <style>{`
                @keyframes modalIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default PaymentPage;
