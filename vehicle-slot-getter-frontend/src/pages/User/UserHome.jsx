import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import '../../styles/UserHome.css';

const UserHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchUserStats();
  }, [user, navigate]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings(1, 1000);

      console.log('📊 Home Stats Response:', response);

      if (response.data.success && response.data.data?.bookings) {
        const bookings = response.data.data.bookings;
        const activeBookings = bookings.filter(b =>
          b.bookingStatus === 'pending' ||
          b.bookingStatus === 'confirmed' ||
          b.bookingStatus === 'parked'
        ).length;
        const completedBookings = bookings.filter(b =>
          b.bookingStatus === 'completed'
        ).length;

        setStats({
          totalBookings: bookings.length,
          activeBookings,
          completedBookings,
        });
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="user-home">
      <div className="user-home-header">
        <div className="header-content">
          <div className="header-intro">
            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p>Ready to book your parking today?</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="user-home-container">
        {/* Quick Stats */}
        <section className="stats-section">
          <h2>Your Parking Stats</h2>
          {loading ? (
            <div className="stats-loading">
              <div className="spinner"></div>
              <p>Loading your data...</p>
            </div>
          ) : error ? (
            <div className="stats-error">
              <p>{error}</p>
            </div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <p className="stat-label">Total Bookings</p>
                  <h3 className="stat-value">{stats.totalBookings}</h3>
                </div>
              </div>

              <div className="stat-card active">
                <div className="stat-icon">🔵</div>
                <div className="stat-info">
                  <p className="stat-label">Active Bookings</p>
                  <h3 className="stat-value">{stats.activeBookings}</h3>
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <p className="stat-label">Completed</p>
                  <h3 className="stat-value">{stats.completedBookings}</h3>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button
              className="action-card primary"
              onClick={() => navigate('/bookings')}
            >
              <div className="action-icon">🅿️</div>
              <h3>Book a Slot</h3>
              <p>Find and reserve your parking slot</p>
              <span className="action-arrow">→</span>
            </button>

            <button
              className="action-card secondary"
              onClick={() => navigate('/bookings/history')}
            >
              <div className="action-icon">📋</div>
              <h3>Booking History</h3>
              <p>View your past and upcoming bookings</p>
              <span className="action-arrow">→</span>
            </button>

            <button
              className="action-card tertiary"
              onClick={() => navigate('/profile')}
            >
              <div className="action-icon">👤</div>
              <h3>My Profile</h3>
              <p>Update your personal information</p>
              <span className="action-arrow">→</span>
            </button>

            <button
              className="action-card quaternary"
              onClick={() => navigate('/support')}
            >
              <div className="action-icon">💬</div>
              <h3>Support</h3>
              <p>Get help or report an issue</p>
              <span className="action-arrow">→</span>
            </button>
          </div>
        </section>

        {/* Featured Info */}
        <section className="info-section">
          <h2>How it Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Enable Location</h4>
              <p>Grant location permission to find nearby parking</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h4>Browse Parking</h4>
              <p>View available parking lots and their rates</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h4>Select Slot</h4>
              <p>Choose your preferred parking slot and time</p>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <h4>Pay & Book</h4>
              <p>Complete payment using QR code to confirm booking</p>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        {stats.totalBookings > 0 && (
          <section className="activity-section">
            <h2>Recent Activity</h2>
            <div className="activity-placeholder">
              <p>📍 Your recent bookings will appear here</p>
              <button
                className="view-all-btn"
                onClick={() => navigate('/bookings/history')}
              >
                View All Bookings
              </button>
            </div>
          </section>
        )}

        {/* Empty State */}
        {stats.totalBookings === 0 && (
          <section className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Bookings Yet</h3>
            <p>Start your journey by booking your first parking slot</p>
            <button
              className="start-booking-btn"
              onClick={() => navigate('/bookings')}
            >
              Book Your First Slot
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default UserHome;
