import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffService } from '../../services/api';
import '../../styles/StaffDashboard.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tab, setTab] = useState('pending'); // pending, parked, verify
  const [pendingEntries, setPendingEntries] = useState([]);
  const [parkedVehicles, setParkedVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const loadData = useCallback(async () => {
    if (tab === 'pending') {
      await fetchPendingEntries();
    } else if (tab === 'parked') {
      await fetchParkedVehicles();
    }
  }, [tab]);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }

    loadData();
  }, [user, navigate, loadData]);

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return;
    }

    loadData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => loadData(), 10000);
    return () => clearInterval(interval);
  }, [loadData, user]);

  const fetchPendingEntries = async () => {
    try {
      setLoading(true);
      const response = await staffService.getPendingEntries(1, 50);
      console.log('📋 Staff Pending Response:', response);
      if (response.data.success) {
        setPendingEntries(response.data.data?.bookings || []);
      } else {
        setError(response.data.message || 'Failed to load pending entries');
      }
    } catch (err) {
      setError(err.message || 'Error fetching pending entries');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParkedVehicles = async () => {
    try {
      setLoading(true);
      const response = await staffService.getParkedVehicles(1, 50);
      console.log('🅿️ Staff Parked Response:', response);
      if (response.data.success) {
        setParkedVehicles(response.data.data?.bookings || []);
      } else {
        setError(response.data.message || 'Failed to load parked vehicles');
      }
    } catch (err) {
      setError(err.message || 'Error fetching parked vehicles');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyParking = async (bookingId) => {
    try {
      setLoading(true);
      setError('');

      const response = await staffService.verifyParking({
        bookingId,
        parkingId: pendingEntries.find(e => e._id === bookingId)?.parkingId,
        slotId: pendingEntries.find(e => e._id === bookingId)?.slotId,
      });

      if (response.data.success) {
        setVerificationResult({
          success: true,
          message: 'Vehicle entry verified successfully',
          booking: response.data.data.booking,
        });
        setTimeout(() => {
          setVerificationResult(null);
          fetchPendingEntries();
          fetchParkedVehicles();
        }, 3000);
      } else {
        setVerificationResult({
          success: false,
          message: response.message || 'Verification failed',
        });
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        message: err.message || 'Error verifying parking',
      });
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnparked = async (bookingId) => {
    try {
      setLoading(true);
      setError('');

      const response = await staffService.markUnparked(bookingId);

      if (response.data.success) {
        const fineInfo = response.data.data.overstayFine > 0
          ? ` (Fine: ₹${response.data.data.overstayFine})`
          : '';
        setVerificationResult({
          success: true,
          message: `Vehicle marked as unparked successfully${fineInfo}`,
        });
        setTimeout(() => {
          setVerificationResult(null);
          fetchParkedVehicles();
        }, 3000);
      } else {
        setVerificationResult({
          success: false,
          message: response.message || 'Failed to mark vehicle as unparked',
        });
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        message: err.message || 'Error marking vehicle as unparked',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError('Please scan a QR code');
      return;
    }

    try {
      // Extract booking ID from QR code data
      const bookingId = qrInput.match(/bookingId:([^,]+)/)?.[1] || qrInput;

      const pendingEntry = pendingEntries.find(e => e._id === bookingId);
      if (!pendingEntry) {
        setVerificationResult({
          success: false,
          message: 'Booking not found or already verified',
        });
        setQrInput('');
        return;
      }

      await handleVerifyParking(bookingId);
      setQrInput('');
    } catch (err) {
      setVerificationResult({
        success: false,
        message: 'Invalid QR code',
      });
      setQrInput('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="staff-dashboard">
      <div className="staff-header">
        <div className="header-content">
          <div className="header-intro">
            <h1>Staff Verification Panel 👮</h1>
            <p>Verify vehicle entry and manage parking</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="staff-container">
        {/* Verification Result */}
        {verificationResult && (
          <div className={`result-banner ${verificationResult.success ? 'success' : 'error'}`}>
            <span className="result-icon">
              {verificationResult.success ? '✅' : '❌'}
            </span>
            <span>{verificationResult.message}</span>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            📋 Pending Entries
            <span className="count">{pendingEntries.length}</span>
          </button>
          <button
            className={`tab-btn ${tab === 'parked' ? 'active' : ''}`}
            onClick={() => setTab('parked')}
          >
            🅿️ Parked Vehicles
            <span className="count">{parkedVehicles.length}</span>
          </button>
          <button
            className={`tab-btn ${tab === 'verify' ? 'active' : ''}`}
            onClick={() => setTab('verify')}
          >
            🔐 Scan QR Code
          </button>
        </div>

        {/* Content */}
        {tab === 'verify' && (
          <div className="verify-section">
            <div className="qr-scanner">
              <div className="qr-icon">📱</div>
              <h2>Scan Booking QR Code</h2>
              <p>Scan the QR code from the booking confirmation to verify entry</p>

              <form onSubmit={handleQRScan} className="qr-form">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="QR code will appear here"
                  autoFocus
                  className="qr-input"
                />
                <button type="submit" className="scan-btn" disabled={loading}>
                  {loading ? 'Processing...' : 'Process QR Code'}
                </button>
              </form>

              <div className="qr-instructions">
                <h4>Instructions:</h4>
                <ol>
                  <li>Ask customer for booking confirmation QR code</li>
                  <li>Scan the QR code using your device camera</li>
                  <li>System will automatically verify the entry</li>
                  <li>Confirm vehicle details and allow entry</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {loading && tab !== 'verify' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        )}

        {/* Pending Entries */}
        {tab === 'pending' && !loading && (
          <div className="entries-section">
            {pendingEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No Pending Entries</h3>
                <p>All bookings have been verified or there are no pending entries</p>
              </div>
            ) : (
              <div className="entries-grid">
                {pendingEntries.map((entry) => (
                  <div key={entry._id} className="entry-card">
                    <div className="entry-header">
                      <div className="vehicle-badge">
                        {entry.vehicleType === 'twoWheeler' && '🏍️'}
                        {entry.vehicleType === 'threeWheeler' && '🛺'}
                        {entry.vehicleType === 'fourWheeler' && '🚗'}
                        {entry.vehicleType === 'heavyVehicle' && '🚚'}
                      </div>
                      <span className="status-badge pending">Pending</span>
                    </div>

                    <div className="entry-info">
                      <div className="info-row">
                        <span className="label">Vehicle:</span>
                        <span className="value">{entry.vehicleNumber}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Customer:</span>
                        <span className="value">{entry.userId?.name || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Booking ID:</span>
                        <span className="value">{entry._id?.slice(-8)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Scheduled Time:</span>
                        <span className="value">
                          {new Date(entry.startTime).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <button
                      className="verify-btn"
                      onClick={() => handleVerifyParking(entry._id)}
                      disabled={loading}
                    >
                      ✓ Verify Entry
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Parked Vehicles */}
        {tab === 'parked' && !loading && (
          <div className="parked-section">
            {parkedVehicles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🅿️</div>
                <h3>No Parked Vehicles</h3>
                <p>No vehicles are currently parked</p>
              </div>
            ) : (
              <div className="parked-grid">
                {parkedVehicles.map((vehicle) => (
                  <div key={vehicle._id} className="parked-card">
                    <div className="parked-header">
                      <div className="vehicle-badge">
                        {vehicle.vehicleType === 'twoWheeler' && '🏍️'}
                        {vehicle.vehicleType === 'threeWheeler' && '🛺'}
                        {vehicle.vehicleType === 'fourWheeler' && '🚗'}
                        {vehicle.vehicleType === 'heavyVehicle' && '🚚'}
                      </div>
                      <span className="status-badge parked">Parked</span>
                    </div>

                    <div className="parked-info">
                      <div className="info-row">
                        <span className="label">Vehicle:</span>
                        <span className="value">{vehicle.vehicleNumber}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Customer:</span>
                        <span className="value">{vehicle.userId?.name || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Parked Since:</span>
                        <span className="value">
                          {vehicle.parkedAt
                            ? new Date(vehicle.parkedAt).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Slot:</span>
                        <span className="value">{vehicle.slotId?.slotNumber || 'N/A'}</span>
                      </div>
                    </div>

                    <button
                      className="unpark-btn"
                      onClick={() => handleMarkUnparked(vehicle._id)}
                      disabled={loading}
                    >
                      ✓ Mark as Unparked
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
