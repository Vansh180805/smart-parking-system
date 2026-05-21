import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldCheck, Check, X, AlertTriangle, ClipboardList, 
  ParkingCircle, ScanLine, Rocket, LogOut, Info,
  PackageOpen, Bike, Truck, Car, LayoutDashboard
} from 'lucide-react';
import '../../styles/StaffDashboard.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

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
      console.log('📋 Staff Pending Response:', response.data);
      if (response.data.success) {
        // Backend returns data directly as an array of bookings
        setPendingEntries(Array.isArray(response.data.data) ? response.data.data : []);
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
      console.log('🅿️ Staff Parked Response:', response.data);
      if (response.data.success) {
        // Backend returns data directly as an array of bookings
        setParkedVehicles(Array.isArray(response.data.data) ? response.data.data : []);
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

  // Helper component for live timer
  const ParkedTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
      const calculateElapsed = () => {
        const start = new Date(startTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000); // seconds

        if (diff < 0) return 'Just started';

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
      };

      setElapsed(calculateElapsed());
      const interval = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);

      return () => clearInterval(interval);
    }, [startTime]);

    return <span className="timer-value">{elapsed}</span>;
  };

  const handleVerifyParking = async (bookingId) => {
    try {
      setLoading(true);
      setError('');

      const entry = pendingEntries.find(e => e._id === bookingId);
      const response = await staffService.verifyParking({
        bookingId,
        parkingId: entry?.parkingId?._id || entry?.parkingId,
        slotId: entry?.slotId?._id || entry?.slotId,
      });

      if (response.data.success) {
        setVerificationResult({
          success: true,
          message: 'Vehicle entry verified successfully',
          booking: response.data.data.booking,
        });
        setTimeout(() => {
          setVerificationResult(null);
          setTab('parked');
          fetchPendingEntries();
          fetchParkedVehicles();
        }, 3000);
      } else {
        setVerificationResult({
          success: false,
          message: response.data.message || 'Verification failed',
        });
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Error verifying parking',
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
        }, 5000);
      } else {
        setVerificationResult({
          success: false,
          message: response.data.message || 'Failed to mark vehicle as unparked',
        });
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Error marking vehicle as unparked',
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
        
        // Refresh data and switch tab after a short delay
        setTimeout(() => {
          setVerificationResult(null);
          setTab('parked');
          fetchParkedVehicles();
        }, 2000);
      }
    } catch (err) {
      setVerificationResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Verification failed',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`staff-dashboard ${theme}`}>
      <div className="staff-header">
        <div className="header-bg-glow" />
        <div className="header-content">
          <div className="header-intro">
            <span className="header-eyebrow">
              <ShieldCheck size={12} strokeWidth={1.5} /> Staff Operations
            </span>
            <h1>Staff Verification Panel</h1>
            <p>Verify vehicle entry and manage parking.</p>
          </div>
          <div className="header-actions">
            <button 
              className="switch-btn" 
              onClick={() => navigate('/admin/dashboard')}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="staff-container">
        {/* Verification Result */}
        {verificationResult && (
          <div className={`result-banner ${verificationResult.success ? 'success' : 'error'}`}>
            <span className="result-icon">
              {verificationResult.success ? <Check size={20} /> : <X size={20} />}
            </span>
            <span>{verificationResult.message}</span>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span><AlertTriangle size={18} /></span>
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            <ClipboardList size={18} className="inline-icon" /> Pending Entries
            <span className="count">{pendingEntries.length}</span>
          </button>
          <button
            className={`tab-btn ${tab === 'parked' ? 'active' : ''}`}
            onClick={() => setTab('parked')}
          >
            <ParkingCircle size={18} className="inline-icon" /> Parked Vehicles
            <span className="count">{parkedVehicles.length}</span>
          </button>
          <button
            className={`tab-btn ${tab === 'verify' ? 'active' : ''}`}
            onClick={() => setTab('verify')}
          >
            <ScanLine size={18} className="inline-icon" /> Scan QR Code
          </button>
        </div>

        {/* Content */}
        {tab === 'verify' && (
          <div className="verify-section">
            <div className="qr-scanner">
              <div className="qr-icon"><ScanLine size={32} /></div>
              <h2>Scan Booking QR</h2>
              <p>Paste the QR data string to lookup booking</p>

              <form className="qr-form" onSubmit={handleLookupBooking}>
                <input
                  type="text"
                  className="qr-input"
                  placeholder="Paste QR data here..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="scan-btn" disabled={loading || !qrInput}>
                  {loading ? 'Searching...' : 'Lookup'}
                </button>
              </form>

              {lookupResult && (
                <div className="lookup-preview-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3>Booking Details Found! <Check size={20} color="#10b981" /></h3>
                    <span className="status-badge-preview">{lookupResult.bookingStatus.toUpperCase()}</span>
                  </div>

                  <div className="preview-grid">
                    <div className="preview-item">
                      <label>USER</label>
                      <span>{lookupResult.userId?.name}</span>
                    </div>
                    <div className="preview-item">
                      <label>VEHICLE NUMBER</label>
                      <span>{lookupResult.vehicleNumber}</span>
                    </div>
                    <div className="preview-item blue">
                      <label>ASSIGNED SLOT</label>
                      <span>{lookupResult.slotId?.slotNumber}</span>
                    </div>
                    <div className="preview-item">
                      <label>VEHICLE TYPE</label>
                      <span>{lookupResult.vehicleType}</span>
                    </div>
                  </div>

                  <div className="action-container">
                    {lookupResult.bookingStatus === 'confirmed' ? (
                      <button
                        onClick={handleConfirmEntry}
                        className="confirm-park-btn"
                      >
                        <Rocket size={18} /> ALLOW ENTRY & MARK PARKED
                      </button>
                    ) : lookupResult.bookingStatus === 'parked' ? (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'inherit', fontWeight: 600, marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Info size={16} /> Vehicle is currently parked. Ready for exit?
                        </p>
                        <button
                          onClick={() => handleMarkUnparked(lookupResult._id)}
                          className="exit-park-btn"
                        >
                          <LogOut size={18} /> EXIT VEHICLE & CALCULATE FINE
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: '#dc2626', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> This vehicle is already marked as {lookupResult.bookingStatus}.
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
                <div className="empty-icon"><PackageOpen size={56} strokeWidth={1.5} color="rgba(167, 139, 250, 0.72)" /></div>
                <h3>No Pending Entries</h3>
                <p>All bookings have been verified or there are no pending entries</p>
              </div>
            ) : (
              <div className="entries-grid">
                {pendingEntries.map((entry) => (
                  <div key={entry._id} className="entry-card">
                    <div className="entry-header">
                      <div className="vehicle-badge">
                        {entry.vehicleType === 'twoWheeler' && <Bike size={18} />}
                        {entry.vehicleType === 'threeWheeler' && <Car size={18} />}
                        {entry.vehicleType === 'fourWheeler' && <Car size={18} />}
                        {entry.vehicleType === 'heavyVehicle' && <Truck size={18} />}
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
                <div className="empty-icon"><ParkingCircle size={56} strokeWidth={1.5} color="rgba(167, 139, 250, 0.72)" /></div>
                <h3>No Parked Vehicles</h3>
                <p>No vehicles are currently parked</p>
              </div>
            ) : (
              <div className="parked-grid">
                {parkedVehicles.map((vehicle) => (
                  <div key={vehicle._id} className="parked-card">
                    <div className="parked-header">
                      <div className="vehicle-badge">
                        {vehicle.vehicleType === 'twoWheeler' && <Bike size={18} />}
                        {vehicle.vehicleType === 'threeWheeler' && <Car size={18} />}
                        {vehicle.vehicleType === 'fourWheeler' && <Car size={18} />}
                        {vehicle.vehicleType === 'heavyVehicle' && <Truck size={18} />}
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
                      {vehicle.parkedAt && (
                        <div className="info-row highlight">
                          <span className="label">Parked Duration:</span>
                          <span className="value timer">
                            <ParkedTimer startTime={vehicle.parkedAt} />
                          </span>
                        </div>
                      )}
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
