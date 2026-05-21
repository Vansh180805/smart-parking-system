import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import {
  ParkingSquare,
  LayoutList,
  User,
  Headphones,
  BarChart3,
  Zap,
  CheckCircle2,
  MapPin,
  CreditCard,
  Sparkles,
  ArrowRight,
  CalendarCheck,
} from 'lucide-react';
import '../../styles/UserHome.css';

const UserHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserStats();

    // Auto-refresh stats every 30 seconds
    const interval = setInterval(fetchUserStats, 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings(undefined, 1, 10);

      if (response.data.success && response.data.data?.bookings) {
        const bookings = response.data.data.bookings;
        const activeCount = bookings.filter(b =>
          b.bookingStatus === 'pending' ||
          b.bookingStatus === 'confirmed' ||
          b.bookingStatus === 'parked'
        ).length;
        const completedCount = bookings.filter(b =>
          b.bookingStatus === 'completed'
        ).length;

        setStats({ totalBookings: response.data.total || bookings.length, activeBookings: activeCount, completedBookings: completedCount });
        setRecentBookings(bookings.slice(0, 2));
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="user-home">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="user-home-header">
        <div className="header-bg-glow" />
        <div className="header-content">
          <div className="header-intro">
            <span className="header-eyebrow">
              <Sparkles size={12} strokeWidth={1.5} />
              Smart Parking Premium
            </span>
            <h1>Welcome back, {firstName}</h1>
            <p>Your premium parking experience awaits.</p>
          </div>
          <div className="header-stats-pills">
            <div className="header-stat-pill">
              <div className="pill-icon-wrap">
                <LayoutList size={16} strokeWidth={2} />
              </div>
              <div className="pill-content">
                <span className="pill-value">{stats.totalBookings}</span>
                <span className="pill-label">Total</span>
              </div>
            </div>
            <div className="header-stat-pill">
              <div className="pill-icon-wrap">
                <Zap size={16} strokeWidth={2} />
              </div>
              <div className="pill-content">
                <span className="pill-value">{stats.activeBookings}</span>
                <span className="pill-label">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="user-home-container">

        {/* ── Stats ──────────────────────────────────────────── */}
        <section className="stats-section">
          <h2 className="section-label">
            <BarChart3 size={14} strokeWidth={1.5} />
            Your Overview
          </h2>

          {loading ? (
            <div className="stats-loading">
              <div className="spinner-ring" />
              <p>Loading statistics...</p>
            </div>
          ) : error ? (
            <div className="stats-error">{error}</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-box neutral">
                  <BarChart3 size={20} strokeWidth={1.5} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Total Bookings</p>
                  <h3 className="stat-value">{stats.totalBookings}</h3>
                </div>
                <div className="stat-border neutral" />
              </div>

              <div className="stat-card">
                <div className="stat-icon-box blue">
                  <Zap size={20} strokeWidth={1.5} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Active Bookings</p>
                  <h3 className="stat-value">{stats.activeBookings}</h3>
                </div>
                <div className="stat-border blue" />
              </div>

              <div className="stat-card">
                <div className="stat-icon-box green">
                  <CheckCircle2 size={20} strokeWidth={1.5} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">Completed</p>
                  <h3 className="stat-value">{stats.completedBookings}</h3>
                </div>
                <div className="stat-border green" />
              </div>
            </div>
          )}
        </section>

        {/* ── Quick Actions ───────────────────────────────────── */}
        <section className="actions-section">
          <h2 className="section-label">
            <Zap size={14} strokeWidth={1.5} />
            Quick Actions
          </h2>
          <div className="actions-grid">
            <button className="action-card primary" onClick={() => navigate('/bookings')}>
              <div className="action-icon-wrap">
                <ParkingSquare size={24} strokeWidth={1.5} />
              </div>
              <div className="action-text">
                <h3>Book a Slot</h3>
                <p>Find and reserve your parking slot instantly</p>
              </div>
              <ArrowRight size={18} strokeWidth={1.5} className="action-arrow" />
            </button>

            <button className="action-card secondary" onClick={() => navigate('/bookings/history')}>
              <div className="action-icon-wrap">
                <LayoutList size={24} strokeWidth={1.5} />
              </div>
              <div className="action-text">
                <h3>Booking History</h3>
                <p>View your past and upcoming bookings</p>
              </div>
              <ArrowRight size={18} strokeWidth={1.5} className="action-arrow" />
            </button>

            <button className="action-card tertiary" onClick={() => navigate('/profile')}>
              <div className="action-icon-wrap">
                <User size={24} strokeWidth={1.5} />
              </div>
              <div className="action-text">
                <h3>My Profile</h3>
                <p>Update your personal information</p>
              </div>
              <ArrowRight size={18} strokeWidth={1.5} className="action-arrow" />
            </button>

            <button className="action-card quaternary" onClick={() => navigate('/support')}>
              <div className="action-icon-wrap">
                <Headphones size={24} strokeWidth={1.5} />
              </div>
              <div className="action-text">
                <h3>Support</h3>
                <p>Get help or report an issue</p>
              </div>
              <ArrowRight size={18} strokeWidth={1.5} className="action-arrow" />
            </button>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section className="info-section">
          <h2 className="section-label centered">
            <Sparkles size={14} strokeWidth={1.5} />
            How It Works
          </h2>
          <div className="steps">
            <div className="step">
              <div className="step-icon">
                <MapPin size={20} strokeWidth={1.5} />
              </div>
              <div className="step-line" />
              <h4>Enable Location</h4>
              <p>Grant location permission to find nearby parking lots</p>
            </div>

            <div className="step">
              <div className="step-icon">
                <ParkingSquare size={20} strokeWidth={1.5} />
              </div>
              <div className="step-line" />
              <h4>Browse Parking</h4>
              <p>View available slots and their real-time rates</p>
            </div>

            <div className="step">
              <div className="step-icon">
                <CalendarCheck size={20} strokeWidth={1.5} />
              </div>
              <div className="step-line" />
              <h4>Select Slot</h4>
              <p>Choose your preferred slot and time window</p>
            </div>

            <div className="step">
              <div className="step-icon">
                <CreditCard size={20} strokeWidth={1.5} />
              </div>
              <h4>Pay &amp; Book</h4>
              <p>Complete payment via QR to confirm your booking</p>
            </div>
          </div>
        </section>

        {/* ── Recent Activity ─────────────────────────────────── */}
        {stats.totalBookings > 0 && (
          <section className="activity-section">
            <h2 className="section-label">
              <LayoutList size={14} strokeWidth={1.5} />
              Recent Activity
            </h2>
            <div className="recent-bookings-list">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div 
                    key={booking._id} 
                    className="recent-booking-card" 
                    onClick={() => navigate('/bookings/history')}
                  >
                    <div className="rb-left">
                      <div className="rb-icon">
                        <ParkingSquare size={20} strokeWidth={1.5} />
                      </div>
                      <div className="rb-details">
                        <h4>{booking.parkingId?.name || 'Parking Lot'}</h4>
                        <p>{booking.parkingId?.address || 'Address not available'}</p>
                        <div className="rb-meta">
                          <span>{booking.vehicleNumber}</span>
                          <span className="dot" />
                          <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rb-right">
                      <div className={`status-pill ${booking.bookingStatus}`}>
                        {booking.bookingStatus}
                      </div>
                      <ArrowRight size={16} strokeWidth={1.5} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="activity-placeholder">
                  <MapPin size={16} strokeWidth={1.5} className="activity-icon" />
                  <p>Your recent bookings will appear here</p>
                </div>
              )}
            </div>
            <button className="view-all-btn" onClick={() => navigate('/bookings/history')}>
              View All Bookings
              <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          </section>
        )}

        {/* ── Empty State ──────────────────────────────────────── */}
        {!loading && stats.totalBookings === 0 && (
          <section className="empty-state">
            <div className="empty-icon-wrap">
              <CalendarCheck size={32} strokeWidth={1.5} />
            </div>
            <h3>No Bookings Yet</h3>
            <p>Start your journey by booking your first parking slot</p>
            <button className="start-booking-btn" onClick={() => navigate('/bookings')}>
              <ParkingSquare size={16} strokeWidth={1.5} />
              Book Your First Slot
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default UserHome;
