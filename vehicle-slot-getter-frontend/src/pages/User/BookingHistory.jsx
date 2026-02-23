import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import '../../styles/BookingHistory.css';

const BookingHistory = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                                        <span className="info-msg">Show QR code at entry</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingHistory;
