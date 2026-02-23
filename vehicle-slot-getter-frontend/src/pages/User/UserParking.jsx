import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import SlotGrid from '../../components/SlotGrid';
import '../../styles/UserParking.css';

const VEHICLE_TYPES = [
  { value: 'twoWheeler', label: '🏍️ Two Wheeler', rate: '₹20' },
  { value: 'threeWheeler', label: '🛺 Three Wheeler', rate: '₹40' },
  { value: 'fourWheeler', label: '🚗 Four Wheeler', rate: '₹60' },
  { value: 'heavyVehicle', label: '🚚 Heavy Vehicle', rate: '₹100' },
];

const UserParking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // DATA
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [slots, setSlots] = useState([]);

  // Booking
  const [vehicleType, setVehicleType] = useState('fourWheeler');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState('1');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [radius, setRadius] = useState(5);
  const [userCoords, setUserCoords] = useState(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('location'); // location -> parking -> slots
  const [bookingAmount, setBookingAmount] = useState(0);

  // ================= FETCH PARKING =================
  const fetchNearbyParking = useCallback(async (coords, r) => {
    try {
      setLoading(true);
      setError('');
      setParkingLots([]);

      console.log('🔍 Searching parking at radius:', r);

      const response = await bookingService.getNearestParking(
        coords.latitude,
        coords.longitude,
        r
      );

      const lots = response?.data?.data?.parkingLots || [];
      setParkingLots(lots);

      if (lots.length === 0) {
        setError('🚫 No parking found nearby. Try increasing search radius.');
      }
    } catch (err) {
      console.error('Parking fetch error:', err);
      setError('Failed to fetch nearby parking.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= GET LOCATION =================
  const getLocation = useCallback((forceRefresh = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }

    if (userCoords && !forceRefresh) {
      fetchNearbyParking(userCoords, radius);
      return;
    }

    setLoading(true);
    setStep('location');
    setError('');

    console.log('📡 Getting location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        console.log('✅ Location:', coords);
        setUserCoords(coords);
        setStep('parking');
      },
      (err) => {
        console.error('Geolocation error:', err);
        let msg = 'Failed to get location.';
        if (err.code === 1) msg = 'Location denied. Please allow GPS.';
        if (err.code === 3) msg = 'Location timeout. Try again.';
        setError(msg);
        setLoading(false);
        setStep('parking'); // Allow manual retry
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [userCoords, radius, fetchNearbyParking]);

  // ================= SIDE EFFECTS =================

  // 1. Initial location fetch
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!userCoords && !loading) {
      getLocation();
    }
  }, [user, userCoords, loading, getLocation, navigate]);

  // 2. Search trigger when radius or coords change
  useEffect(() => {
    if (userCoords) {
      fetchNearbyParking(userCoords, radius);
    }
  }, [radius, userCoords, fetchNearbyParking]);

  // 3. Amount calculation
  useEffect(() => {
    if (selectedParking && hours) {
      const rate = selectedParking.hourlyRate || 60;
      setBookingAmount(rate * parseInt(hours));
    }
  }, [selectedParking, hours]);


  // ================= HANDLERS =================

  const handleParkingSelect = async (parking) => {
    setSelectedParking(parking);
    setSlots([]);
    setSelectedSlot(null);
    setStep('slots');
    await fetchSlots(parking._id, vehicleType);
  };

  const fetchSlots = async (parkingId, vType) => {
    try {
      setLoading(true);
      const response = await bookingService.getParkingSlots(parkingId, vType);

      // Robust mapping for manually created slots
      const slotsData = (response?.data?.data?.slots || []).map(slot => ({
        ...slot,
        // Map common manual naming errors
        slotType: slot.slotType || slot.vehicleType,
        status: slot.status || (slot.isOccupied === true ? 'occupied' : 'available')
      }));

      setSlots(slotsData);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to load slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!vehicleNumber || !startTime || !selectedSlot) {
      setError('Please complete booking form.');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        parkingId: selectedParking._id,
        slotId: selectedSlot._id,
        vehicleType,
        vehicleNumber: vehicleNumber.toUpperCase(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(new Date(startTime).getTime() + hours * 3600000).toISOString(),
        bookingAmount,
      };

      console.log('📤 Sending Booking Data:', bookingData);
      const response = await bookingService.createBooking(bookingData);
      if (response.data.success) {
        navigate(`/payment/${response.data.data._id}`);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setError('Booking failed.');
    } finally {
      setLoading(false);
    }
  };


  // ================= UI RENDERING =================
  return (
    <div className="user-parking">
      <div className="parking-header">
        <h1>Find Your Parking 🅿️</h1>
        <p>Quick, Easy, Secure</p>
      </div>

      <div className="parking-container">
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* STEP 1: Location Loading */}
        {step === 'location' && loading && (
          <div className="step-container">
            <div className="step-icon">📍</div>
            <h2>Getting Your Location...</h2>
            <p>Finding nearby parking lots for you</p>
            <div className="spinner"></div>
          </div>
        )}

        {/* STEP 2: Parking List */}
        {step === 'parking' && (
          <>
            <div className="step-controls">
              <div className="search-header-group">
                <h2>Nearby Parking Lots</h2>
                <div className="radius-selector">
                  <label>Search Radius:</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="radius-dropdown"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={15}>15 km</option>
                    <option value={20}>20 km</option>
                    <option value={5000}>Anywhere (All India)</option>
                  </select>
                </div>
              </div>
              <div className="controls-group">
                <button
                  className="demo-loc-btn"
                  onClick={() => {
                    const coords = { latitude: 30.5158674, longitude: 76.6605828 };
                    setUserCoords(coords);
                    setStep('parking');
                    setRadius(5000); // Set dropdown to Anywhere
                    fetchNearbyParking(coords, 5000);
                  }}
                  title="Use fixed location if GPS fails"
                >
                  📍 Use Demo Location
                </button>
                <button className="refresh-btn" onClick={() => getLocation(true)}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Searching...</p>
              </div>
            ) : parkingLots.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚫</div>
                <h3>No Parking Found</h3>
                <p>Try increasing the search radius or check your GPS.</p>
              </div>
            ) : (
              <div className="parking-grid">
                {parkingLots.map((parking) => (
                  <div
                    key={parking._id}
                    className={`parking-card ${selectedParking?._id === parking._id ? 'selected' : ''}`}
                    onClick={() => handleParkingSelect(parking)}
                  >
                    <div className="parking-name">{parking.name}</div>
                    <div className="parking-address">{parking.address}</div>
                    <div className="parking-info-row">
                      <span>📏 {parking.totalSlots} slots</span>
                      <span>💰 ₹{parking.hourlyRate}/hr</span>
                    </div>

                    <button className="select-btn">Select Parking →</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 3: Slots & Booking */}
        {step === 'slots' && selectedParking && (
          <div className="booking-container">
            <div className="booking-sidebar">
              <h3>Booking Details</h3>

              <div className="form-group">
                <label>Selected Parking</label>
                <div className="parking-display">
                  {selectedParking.name}
                  <button className="change-btn" onClick={() => setStep('parking')}>
                    Change
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value);
                    fetchSlots(selectedParking._id, e.target.value);
                  }}
                  className="form-control"
                >
                  {VEHICLE_TYPES.map(vt => (
                    <option key={vt.value} value={vt.value}>{vt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vehicle Number</label>
                <input
                  type="text"
                  placeholder="MH02AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="booking-summary">
                <div className="summary-row">
                  <span>Total Amount:</span>
                  <span className="amount">₹{bookingAmount}</span>
                </div>
              </div>

              <button
                className="book-btn"
                onClick={handleCreateBooking}
                disabled={!selectedSlot || loading}
              >
                {loading ? 'Processing...' : 'Proceed to Payment →'}
              </button>
            </div>

            <div className="slots-section">
              <h3>Select a Slot</h3>
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              ) : (
                <SlotGrid
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                  vehicleType={vehicleType}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserParking;
