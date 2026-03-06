import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import '../../styles/BookingHistory.css';

const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState('Calculating...');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('EXPIRED (Overstaying)');
                clearInterval(timer);
            } else {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    const isExpired = timeLeft.includes('EXPIRED');

    return (
        <div style={{
            marginTop: '15px',
            background: isExpired ? '#fef2f2' : '#f0fdf4',
            padding: '15px',
            borderRadius: '12px',
            border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`,
            textAlign: 'center'
        }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isExpired ? '⚠️ Time Overstayed' : '⏱️ Time Remaining'}
            </div>
            <div style={{
                color: isExpired ? '#dc2626' : '#16a34a',
                fontSize: '1.5rem',
                fontWeight: '900',
                fontFamily: 'monospace'
            }}>
                {timeLeft}
            </div>
        </div>
    );
};

const BookingHistory = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeQR, setActiveQR] = useState(null); // To show QR in modal
    const [copiedId, setCopiedId] = useState(null); // For copy feedback

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingService.getUserBookings();
            if (response.data.success) {
                setBookings(response.data.data.bookings);
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load booking history');
        } finally {
            setLoading(false);
        }
    };

    const handleExit = async (bookingId) => {
        try {
            setLoading(true);
            const response = await bookingService.exitParking(bookingId);
            if (response.data.success) {
                if (response.data.isOverstay) {
                    alert(`Overstay detected! Fine: ₹${response.data.fineAmount}. Redirecting to payment...`);
                    navigate(`/payment/${bookingId}?type=FINE`);
                } else {
                    alert('Exited successfully! Thank you.');
                    fetchBookings();
                }
            }
        } catch (err) {
            console.error('Exit error:', err);
            setError(err.response?.data?.message || 'Failed to process exit');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'confirmed': return 'badge-success';
            case 'parked': return 'badge-info';
            case 'completed': return 'badge-secondary';
            case 'cancelled': return 'badge-danger';
            case 'overdue': return 'badge-warning';
            default: return 'badge-light';
        }
    };

    return (
        <div className="booking-history-page">
            <div className="history-header">
                <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
                <h1>My Booking History</h1>
                <p>Track all your parking reservations</p>
            </div>

            <div className="history-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Fetching your history...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <p>{error}</p>
                        <button onClick={fetchBookings}>Retry</button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No Bookings Found</h3>
                        <p>You haven't made any parking reservations yet.</p>
                        <button onClick={() => navigate('/bookings')}>Book Now</button>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="booking-item-card">
                                <div className="booking-item-header">
                                    <div className="parking-info">
                                        <h3>{booking.parkingId?.name}</h3>
                                        <p>{booking.parkingId?.address}</p>
                                        <div style={{
                                            marginTop: '8px',
                                            fontSize: '0.8rem',
                                            background: '#f1f5f9',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            border: copiedId === booking.bookingId ? '1px solid #10b981' : '1px solid transparent'
                                        }}
                                            onClick={() => handleCopyId(booking.bookingId)}
                                            title="Click to copy ID"
                                        >
                                            <strong>ID: {booking.bookingId}</strong>
                                            <span>{copiedId === booking.bookingId ? '✅ Copied!' : '📋'}</span>
                                        </div>
                                    </div>
                                    <span className={`status-badge ${getStatusBadgeClass(booking.bookingStatus)}`}>
                                        {booking.bookingStatus.toUpperCase()}
                                    </span>
                                </div>

                                <div className="booking-item-details">
                                    <div className="detail-col">
                                        <span className="label">Vehicle</span>
                                        <span className="value">{booking.vehicleNumber} ({booking.vehicleType})</span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">Slot</span>
                                        <span className="value">{booking.slotId?.slotNumber}</span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">Date</span>
                                        <span className="value">{new Date(booking.startTime).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">Time</span>
                                        <span className="value">
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">Amount</span>
                                        <span className="value total-amt">₹{booking.bookingAmount}</span>
                                    </div>
                                </div>

                                <div className="booking-item-actions">
                                    {booking.paymentStatus === 'pending' && booking.bookingStatus !== 'cancelled' && (
                                        <button
                                            className="pay-btn"
                                            onClick={() => navigate(`/payment/${booking._id}`)}
                                        >
                                            Complete Payment
                                        </button>
                                    )}
                                    {booking.bookingStatus === 'confirmed' && (
                                        <button
                                            className="qr-btn"
                                            onClick={() => setActiveQR(booking.qrCode)}
                                            style={{
                                                backgroundColor: '#6366f1',
                                                color: 'white',
                                                padding: '10px 20px',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            📱 View QR Code
                                        </button>
                                    )}
                                    {booking.bookingStatus === 'parked' && (
                                        <CountdownTimer endTime={booking.endTime} />
                                    )}
                                    {(booking.bookingStatus === 'parked' || booking.bookingStatus === 'overdue') && (
                                        <button
                                            className="exit-btn"
                                            onClick={() => handleExit(booking._id)}
                                            style={{
                                                marginTop: '20px',
                                                padding: '14px',
                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '1rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 15px rgba(220, 38, 38, 0.3)',
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                transition: 'transform 0.2s'
                                            }}
                                        >
                                            🚪 EXIT & LEAVE SPOT
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* QR CODE MODAL */}
            {activeQR && (
                <div
                    className="qr-modal-overlay"
                    onClick={() => setActiveQR(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <div
                        className="qr-modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '24px',
                            textAlign: 'center',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <h2 style={{ color: '#111827', marginBottom: '20px' }}>Entry QR Code</h2>
                        <img
                            src={activeQR}
                            alt="Booking QR"
                            style={{
                                width: '250px',
                                height: '250px',
                                border: '1px solid #eee',
                                borderRadius: '12px'
                            }}
                        />
                        <p style={{ color: '#6b7280', marginTop: '20px', fontSize: '0.9rem' }}>
                            Show this QR code to the staff at the parking entrance.
                        </p>
                        <button
                            onClick={() => setActiveQR(null)}
                            style={{
                                marginTop: '25px',
                                width: '100%',
                                padding: '12px',
                                background: '#111827',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingHistory;
