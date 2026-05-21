import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    Copy, 
    Smartphone, 
    LogOut, 
    FolderOpen, 
    ArrowLeft,
    Check
} from 'lucide-react';
import '../../styles/BookingHistory.css';

const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState('Calculating...');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                clearInterval(timer);
            } else {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                
                const pad = (n) => n.toString().padStart(2, '0');
                setTimeLeft(`${pad(h)}h ${pad(m)}m ${pad(s)}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    const isExpired = timeLeft === 'EXPIRED';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: isExpired ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            padding: '10px 20px',
            borderRadius: '16px',
            border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
            textAlign: 'center',
            minWidth: '140px',
            height: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{ 
                color: isExpired ? '#ef4444' : '#10b981', 
                fontSize: '9.5px', 
                marginBottom: '6px', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '5px' 
            }}>
                {isExpired ? <><AlertTriangle size={12} /> Overstay</> : <><Clock size={12} /> Time Remaining</>}
            </div>
            <div style={{
                color: isExpired ? '#ef4444' : '#10b981',
                fontSize: '1.25rem',
                fontWeight: '700',
                letterSpacing: '0.5px'
            }}>
                {timeLeft.split(' ').map((part, i) => (
                    <span key={i} style={{ margin: '0 2px' }}>
                        {part.replace(/[hms]/, '')}<span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{part.replace(/[0-9]/g, '')}</span>
                    </span>
                ))}
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
            case 'pending': return 'badge-warning';
            default: return 'badge-light';
        }
    };

    return (
        <div className="booking-history-page">
            <div className="booking-history-header">
                <div className="header-bg-glow" />
                <div className="header-content">
                    <div className="header-intro">
                        <div className="header-eyebrow">
                            <FolderOpen size={12} /> SMART PARKING PREMIUM
                        </div>
                        <h1>Booking History</h1>
                        <p>Track all your parking reservations and activities.</p>
                    </div>
                </div>
            </div>

            <div className="history-container">
                <button className="back-btn" onClick={() => navigate('/home')} style={{ marginBottom: '24px' }}>
                    <ArrowLeft size={15} strokeWidth={1.5} /> Back to Home
                </button>
                {loading ? (
                    <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner"></div>
                        <p style={{ color: '#a1a1aa' }}>Fetching your history...</p>
                    </div>
                ) : error ? (
                    <div className="error-state" style={{ textAlign: 'center', padding: '40px', background: 'rgba(239,68,68,0.1)', borderRadius: '16px', color: '#ef4444' }}>
                        <p>{error}</p>
                        <button onClick={fetchBookings} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>Retry</button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <FolderOpen size={56} strokeWidth={1} className="empty-icon" />
                        <h3>No Bookings Found</h3>
                        <p>You haven't made any parking reservations yet.</p>
                        <button className="pay-btn" onClick={() => navigate('/bookings')} style={{ marginTop: '10px' }}>Book Now</button>
                    </div>
                ) : (
                    <div className="bookings-list timeline">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="booking-item-card">
                                <div className="booking-item-header">
                                    <div className="parking-info">
                                        <h3>{booking.parkingId?.name}</h3>
                                        <p>{booking.parkingId?.address}</p>
                                        <div 
                                            className="id-pill"
                                            onClick={() => handleCopyId(booking.bookingId)}
                                            title="Click to copy ID"
                                        >
                                            <strong>ID: {booking.bookingId}</strong>
                                            <span>{copiedId === booking.bookingId ? <Check size={14} color="#10b981" /> : <Copy size={14} />}</span>
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
                                        >
                                            <Smartphone size={15} strokeWidth={1.5} /> View QR Code
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
                                                flex: 1,
                                                padding: '12px 24px',
                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '16px',
                                                fontWeight: '700',
                                                fontSize: '13.5px',
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 15px rgba(220, 38, 38, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                transition: 'transform 0.2s',
                                                height: '100%'
                                            }}
                                        >
                                            <LogOut size={16} strokeWidth={2} /> EXIT & LEAVE SPOT
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
                            background: '#1a1a2e',
                            padding: '30px',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '20px' }}>Entry QR Code</h2>
                        <img
                            src={activeQR}
                            alt="Booking QR"
                            style={{
                                width: '250px',
                                height: '250px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                background: 'white',
                                padding: '10px',
                                margin: '0 auto'
                            }}
                        />
                        <p style={{ color: '#a1a1aa', marginTop: '20px', fontSize: '0.9rem' }}>
                            Show this QR code to the staff at the parking entrance.
                        </p>
                        <button
                            onClick={() => setActiveQR(null)}
                            style={{
                                marginTop: '25px',
                                width: '100%',
                                padding: '12px',
                                background: '#8B5CF6',
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
