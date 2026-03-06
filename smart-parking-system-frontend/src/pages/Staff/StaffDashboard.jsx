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
  const [lookupResult, setLookupResult] = useState(null);
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
      const response = await staffService.getPendingEntries(null, 1, 50);
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
      const response = await staffService.getParkedVehicles(null, 1, 50);
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

  const handleLookupBooking = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError('Please scan a QR code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setLookupResult(null);
      setVerificationResult(null);

      // Extract booking ID or use raw ID
      let bookingId = qrInput;
      try {
        const parsed = JSON.parse(qrInput);
        bookingId = parsed.bookingId || qrInput;
      } catch (e) {
        // Not JSON, try regex match for 'bookingId:xxxx'
        const match = qrInput.match(/bookingId:["']?([^,"'}]+)/);
        if (match) bookingId = match[1];
      }

      const response = await staffService.getBookingDetails(bookingId);
      if (response.data.success) {
        setLookupResult(response.data.data);
      } else {
        setError('Booking not found or invalid QR');
      }
    } catch (err) {
      setError('Invalid QR code format');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEntry = async () => {
    if (!lookupResult) return;
    try {
      setLoading(true);
      const response = await staffService.verifyParking({
        bookingId: lookupResult._id,
        parkingId: lookupResult.parkingId?._id || lookupResult.parkingId,
        slotId: lookupResult.slotId?._id || lookupResult.slotId,
      });

      if (response.data.success) {
        setVerificationResult({
          success: true,
          message: `Entry Granted! Vehicle ${lookupResult.vehicleNumber} parked in ${lookupResult.slotId?.slotNumber || 'slot'}.`,
        });
        setLookupResult(null);
        setQrInput('');
        fetchPendingEntries();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (e) => {
    await handleLookupBooking(e);
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
              <div className="qr-icon">🔐</div>
              <h2>Scan Booking QR</h2>
              <p>Paste the QR data string to lookup booking</p>

              <form className="qr-form" onSubmit={handleLookupBooking} style={{ display: 'flex', gap: '12px', maxWidth: '500px', margin: '0 auto 30px' }}>
                <input
                  type="text"
                  className="qr-input"
                  placeholder="Paste QR data here..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  disabled={loading}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <button type="submit" className="scan-btn" disabled={loading || !qrInput} style={{ padding: '12px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'Searching...' : 'Lookup'}
                </button>
              </form>

              {lookupResult && (
                <div className="lookup-preview-card" style={{
                  background: '#f0f9ff',
                  border: '2px solid #0ea5e9',
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '600px',
                  margin: '0 auto 30px',
                  textAlign: 'left',
                  boxShadow: '0 10px 25px rgba(14,165,233, 0.15)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ color: '#0369a1', margin: 0 }}>Booking Details Found! ✅</h3>
                    <span style={{
                      padding: '4px 12px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>{lookupResult.bookingStatus.toUpperCase()}</span>
                  </div>

                  <div className="preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="preview-item">
                      <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>USER</label>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{lookupResult.userId?.name}</span>
                    </div>
                    <div className="preview-item">
                      <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>VEHICLE NUMBER</label>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{lookupResult.vehicleNumber}</span>
                    </div>
                    <div className="preview-item">
                      <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>ASSIGNED SLOT</label>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0369a1' }}>{lookupResult.slotId?.slotNumber}</span>
                    </div>
                    <div className="preview-item">
                      <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>VEHICLE TYPE</label>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{lookupResult.vehicleType}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed #bae6fd' }}>
                    {lookupResult.bookingStatus === 'confirmed' ? (
                      <button
                        onClick={handleConfirmEntry}
                        className="confirm-park-btn"
                        style={{
                          width: '100%',
                          padding: '16px',
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                      >
                        🚀 ALLOW ENTRY & MARK PARKED
                      </button>
                    ) : (
                      <div style={{ color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>
                        ⚠️ This vehicle is already marked as {lookupResult.bookingStatus}.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="qr-instructions">
                <h4>Safety Check:</h4>
                <ol>
                  <li>Ask customer for booking confirmation QR code</li>
                  <li>Scan or paste the QR data string to verify details</li>
                  <li>Confirm vehicle number matches physical plate</li>
                  <li>Click 'Allow Entry' to mark slot as occupied</li>
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
