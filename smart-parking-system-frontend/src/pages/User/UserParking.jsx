import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import SlotGrid from '../../components/SlotGrid';
import { ParkingSquare, MapPin, AlertTriangle, RefreshCw, Search, Navigation, X, Calendar, Clock, Banknote, Bike, Car, Truck, ChevronDown, Timer } from 'lucide-react';
import '../../styles/UserParking.css';

const VEHICLE_TYPES = [
  { value: 'twoWheeler', label: 'Two Wheeler', icon: Bike },
  { value: 'threeWheeler', label: 'Three Wheeler', icon: Car },
  { value: 'fourWheeler', label: 'Four Wheeler', icon: Car },
  { value: 'heavyVehicle', label: 'Heavy Vehicle', icon: Truck },
];

const toLocalISOString = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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
  const [duration, setDuration] = useState('1');
  const [durationUnit, setDurationUnit] = useState('hours');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [radius, setRadius] = useState(5000); // Default to Anywhere (All India)
  const [userCoords, setUserCoords] = useState(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('location'); // location -> parking -> slots
  const [bookingAmount, setBookingAmount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [radiusDropdownOpen, setRadiusDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);
  const radiusRef = React.useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (radiusRef.current && !radiusRef.current.contains(event.target)) {
        setRadiusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedVehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
  const VehicleIcon = selectedVehicle?.icon || Car;

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
    if (selectedParking && duration) {
      const rate = selectedParking.hourlyRate || 60;
      if (durationUnit === 'hours') {
        setBookingAmount(rate * parseFloat(duration));
      } else {
        // Minimum amount for minutes or pro-rated
        const minAmount = Math.ceil((rate / 60) * parseInt(duration));
        setBookingAmount(Math.max(minAmount, 10)); // Min ₹10 charge
      }
    }
  }, [selectedParking, duration, durationUnit]);


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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const calendarRef = React.useRef(null);

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date) => {
    // Keep the time if already set
    const current = startTime ? new Date(startTime) : new Date();
    date.setHours(current.getHours());
    date.setMinutes(current.getMinutes());
    setStartTime(toLocalISOString(date));
    setShowDatePicker(false);
  };

  const generateCalendarDays = () => {
    const now = new Date();
    const date = startTime ? new Date(startTime) : now;
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: 'prev', date: new Date(year, month - 1, prevMonthDays - i) });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current', date: new Date(year, month, i) });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: 'next', date: new Date(year, month + 1, i) });
    }
    
    return days;
  };

  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const durationRef = React.useRef(null);
  const hourScrollRef = React.useRef(null);
  const minScrollRef = React.useRef(null);

  // Close duration picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (durationRef.current && !durationRef.current.contains(event.target)) {
        setShowDurationPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Force one-step scroll
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      const currentScroll = e.currentTarget.scrollTop;
      const targetScroll = Math.round(currentScroll / 36) * 36 + (direction * 36);
      e.currentTarget.scrollTo({ top: targetScroll, behavior: 'smooth' });
    };

    const hScroll = hourScrollRef.current;
    const mScroll = minScrollRef.current;

    if (hScroll) hScroll.addEventListener('wheel', handleWheel, { passive: false });
    if (mScroll) mScroll.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (hScroll) hScroll.removeEventListener('wheel', handleWheel);
      if (mScroll) mScroll.removeEventListener('wheel', handleWheel);
    };
  }, [showDurationPicker]);

  const getDurationDisplay = () => {
    if (durationUnit === 'hours') {
      const h = Math.floor(parseFloat(duration));
      const m = Math.round((parseFloat(duration) - h) * 60);
      return `${h}h ${m > 0 ? m + 'm' : ''}`;
    }
    return `${duration}m`;
  };

  const handleCreateBooking = async () => {
  if (!vehicleNumber || !startTime || !selectedSlot) {
    setError('Please complete booking form.');
    return;
  }

  if (new Date(startTime) < new Date()) {
    setError('Booking time cannot be in the past.');
    return;
  }

  // ✅ Slot validation (IMPORTANT)
  const finalSlotId = selectedSlot?._id || selectedSlot?.id;

  if (!finalSlotId) {
    setError("Invalid slot selected. Please try again.");
    return;
  }

  try {
    setLoading(true);

    const durationMs =
      durationUnit === 'hours'
        ? parseFloat(duration) * 3600000
        : parseInt(duration) * 60000;

    const bookingData = {
      parkingId: selectedParking._id,
      slotId: finalSlotId, // ✅ FIXED
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(
        new Date(startTime).getTime() + durationMs
      ).toISOString(),
      bookingAmount,
    };

    console.log("✅ FINAL BOOKING DATA:", bookingData);

    const response = await bookingService.createBooking(bookingData);

    if (response.data.success) {
      const bookingId = response.data.data?._id;

      if (!bookingId) {
        setError("Booking created but ID missing.");
        return;
      }

      navigate(`/payment/${bookingId}`);
    }
  } catch (err) {
    console.error('❌ Booking failed:', err);
    const msg = err.response?.data?.message || 'Booking failed.';
    setError(msg);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="user-parking">
      <div className="parking-header">
        <div className="header-bg-glow" />
        <div className="header-content">
          <div className="header-intro">
            <div className="header-eyebrow">
              <ParkingSquare size={12} /> SMART PARKING PREMIUM
            </div>
            <h1>Find Your Parking</h1>
            <p>Quick, Easy, and Secure booking at your fingertips.</p>
          </div>
        </div>
      </div>

      <div className="parking-container">
        {error && (
          <div className="error-banner">
            <span><AlertTriangle size={18} /></span>
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}

        {/* STEP 1: Location Loading */}
        {step === 'location' && loading && (
          <div className="step-container">
            <div className="step-icon"><Navigation size={32} /></div>
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
                <div className="radius-selector-unified" ref={radiusRef}>
                  <div 
                    className={`radius-pill ${radiusDropdownOpen ? 'active' : ''}`}
                    onClick={() => setRadiusDropdownOpen(!radiusDropdownOpen)}
                  >
                    <span className="pill-label">Search Area:</span>
                    <span className="pill-value">{radius === 5000 ? 'Anywhere (All India)' : `${radius} km`}</span>
                    <ChevronDown size={14} className={`chevron ${radiusDropdownOpen ? 'open' : ''}`} />
                  </div>
                  
                  {radiusDropdownOpen && (
                    <div className="radius-menu">
                      {[5, 10, 15, 20, 5000].map(r => (
                        <div 
                          key={r}
                          className={`radius-option ${radius === r ? 'selected' : ''}`}
                          onClick={() => {
                            setRadius(r);
                            setRadiusDropdownOpen(false);
                          }}
                        >
                          {r === 5000 ? 'Anywhere (All India)' : `${r} km`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="controls-group">
                <button
                  className="demo-loc-btn"
                  onClick={() => {
                    const coords = { latitude: 30.5158674, longitude: 76.6605828 };
                    setUserCoords(coords);
                    setStep('parking');
                    setRadius(5000); // Set dropdown to Anywhere (All India)
                    fetchNearbyParking(coords, 5000);
                  }}
                  title="Use fixed location if GPS fails"
                >
                  <MapPin size={15} className="inline-icon" /> Use Demo Location
                </button>
                <button className="refresh-btn" onClick={() => getLocation(true)}>
                  <RefreshCw size={18} />
                  <span>Refresh</span>
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
                <div className="empty-icon"><Search size={48} strokeWidth={1} opacity={0.5} /></div>
                <h3>No Parking Found Nearby</h3>
                <p>We couldn't find anything within {radius} km. Try searching across all areas.</p>
                <button
                  className="global-search-btn"
                  onClick={() => {
                    setRadius(5000);
                    if (userCoords) fetchNearbyParking(userCoords, 5000);
                  }}
                  style={{
                    marginTop: '15px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Search size={16} /> Search Anywhere (All India)
                </button>
              </div>
            ) : (
      <div className="parking-grid">
        {parkingLots.map((parking) => (
          <div
            key={parking._id}
            className={`parking-card ${selectedParking?._id === parking._id ? 'selected' : ''}`}
            onClick={() => handleParkingSelect(parking)}
          >
            <div className="parking-card-body">
              <div className="parking-name">{parking.name}</div>
              <div className="parking-address">
                <MapPin size={14} className="addr-icon" />
                {parking.address}
              </div>
              
              <div className="parking-info-grid">
                <div className="info-item">
                  <ParkingSquare size={16} />
                  <div className="info-text">
                    <span className="info-value">{parking.totalSlots}</span>
                    <span className="info-label">Total Slots</span>
                  </div>
                </div>
                <div className="info-item">
                  <Banknote size={16} />
                  <div className="info-text">
                    <span className="info-value">₹{parking.hourlyRate}</span>
                    <span className="info-label">per hour</span>
                  </div>
                </div>
              </div>

              <button className="select-btn">
                Select Parking
              </button>
            </div>
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
                <div className="selected-parking-pill">
                  <div className="sp-info">
                    <MapPin size={16} className="sp-icon" />
                    <span>{selectedParking.name}</span>
                  </div>
                  <button className="change-link-btn" onClick={() => setStep('parking')}>
                    Change
                  </button>
                </div>
              </div>


              <div className="form-group">
                <label>Vehicle Type</label>
                <div className="custom-dropdown-container" ref={dropdownRef}>
                  <div 
                    className={`custom-dropdown-trigger ${dropdownOpen ? 'active' : ''}`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="trigger-left">
                      <VehicleIcon size={18} className="vehicle-icon" />
                      <span>{selectedVehicle?.label}</span>
                    </div>
                    <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
                  </div>
                  
                  {dropdownOpen && (
                    <div className="custom-dropdown-menu">
                      {VEHICLE_TYPES.map(vt => {
                        const Icon = vt.icon;
                        return (
                          <div 
                            key={vt.value}
                            className={`dropdown-option ${vehicleType === vt.value ? 'selected' : ''}`}
                            onClick={() => {
                              setVehicleType(vt.value);
                              fetchSlots(selectedParking._id, vt.value);
                              setDropdownOpen(false);
                            }}
                          >
                            <Icon size={18} />
                            <span>{vt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                <label>Start Date & Time</label>
                <div className="custom-date-container" ref={calendarRef}>
                  <div 
                    className={`date-trigger ${showDatePicker ? 'active' : ''}`}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Calendar size={18} className="field-icon-inline" />
                    <span>{startTime ? new Date(startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Select Date & Time'}</span>
                    <ChevronDown size={14} className={`chevron ${showDatePicker ? 'open' : ''}`} />
                  </div>

                  {showDatePicker && (
                    <div className="premium-calendar-popup">
                      <div className="calendar-header">
                        <div className="header-date-title">
                          {new Date(startTime || new Date()).toLocaleString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div className="header-year-nav">
                          <span>{new Date(startTime || new Date()).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                          <div className="nav-arrows">
                            <ChevronDown size={14} className="nav-arrow up" onClick={(e) => {
                              e.stopPropagation();
                              const d = new Date(startTime || new Date());
                              d.setMonth(d.getMonth() - 1);
                              setStartTime(toLocalISOString(d));
                            }} />
                            <ChevronDown size={14} className="nav-arrow" onClick={(e) => {
                              e.stopPropagation();
                              const d = new Date(startTime || new Date());
                              d.setMonth(d.getMonth() + 1);
                              setStartTime(toLocalISOString(d));
                            }} />
                          </div>
                        </div>
                      </div>

                      <div className="calendar-grid">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} className="weekday-label">{day}</div>
                        ))}
                        {generateCalendarDays().map((d, i) => {
                          const isSelected = startTime && new Date(startTime).toDateString() === d.date.toDateString();
                          
                          // Check if date is before today
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const dCopy = new Date(d.date);
                          dCopy.setHours(0, 0, 0, 0);
                          const isPast = dCopy < today;

                          return (
                            <div 
                              key={i} 
                              className={`calendar-day ${d.month} ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
                              onClick={() => {
                                if (!isPast) handleDateSelect(d.date);
                              }}
                              style={isPast ? { opacity: 0.3, cursor: 'not-allowed', background: 'transparent' } : {}}
                            >
                              {d.day}
                            </div>
                          );
                        })}
                      </div>

                      <div className="calendar-footer">
                        <div className="time-picker-inline">
                          <Clock size={14} />
                          <input 
                            type="time" 
                            value={startTime ? new Date(startTime).toTimeString().slice(0, 5) : ''}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const [h, m] = e.target.value.split(':');
                              if (h === undefined || m === undefined) return;
                              
                              const d = startTime ? new Date(startTime) : new Date();
                              d.setHours(parseInt(h, 10));
                              d.setMinutes(parseInt(m, 10));
                              
                              if (!isNaN(d.getTime())) {
                                setStartTime(toLocalISOString(d));
                              }
                            }}
                          />
                        </div>
                        <button className="today-btn" onClick={() => handleDateSelect(new Date())}>Today</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Duration</label>
                <div className="custom-duration-container" ref={durationRef}>
                  <div 
                    className={`duration-trigger ${showDurationPicker ? 'active' : ''}`}
                    onClick={() => setShowDurationPicker(!showDurationPicker)}
                  >
                    <Timer size={18} className="field-icon-inline" />
                    <span>{getDurationDisplay()}</span>
                    <ChevronDown size={14} className={`chevron ${showDurationPicker ? 'open' : ''}`} />
                  </div>

                  {showDurationPicker && (
                    <div className="wheel-picker-popup">
                      <div className="manual-input-row">
                        <div className="manual-field">
                          <input 
                            type="number" 
                            value={Math.floor(parseFloat(duration))}
                            onChange={(e) => {
                              const h = parseInt(e.target.value) || 0;
                              const m = Math.round((parseFloat(duration) % 1) * 60);
                              setDuration((h + m/60).toString());
                              setDurationUnit('hours');
                            }}
                          />
                          <span>hours</span>
                        </div>
                        <div className="manual-field">
                          <input 
                            type="number" 
                            value={Math.round((parseFloat(duration) % 1) * 60)}
                            onChange={(e) => {
                              const m = parseInt(e.target.value) || 0;
                              const h = Math.floor(parseFloat(duration));
                              setDuration((h + m/60).toString());
                              setDurationUnit('hours');
                            }}
                          />
                          <span>mins</span>
                        </div>
                      </div>

                      <div className="wheel-labels-row">
                        <div className="wheel-label">Hours</div>
                        <div className="wheel-label">Mins</div>
                      </div>

                      <div className="wheel-picker-container">
                        <div className="wheel-column">
                          <div className="wheel-scroll" ref={hourScrollRef} onScroll={(e) => {
                            const index = Math.round(e.target.scrollTop / 36);
                            if (index >= 0 && index < 24) {
                              const m = Math.round((parseFloat(duration) % 1) * 60);
                              const newDuration = (index + m/60).toString();
                              if (duration !== newDuration) setDuration(newDuration);
                            }
                          }}>
                            <div className="wheel-spacer" />
                            {[...Array(24)].map((_, i) => (
                              <div 
                                key={i} 
                                className={`wheel-item ${durationUnit === 'hours' && Math.floor(parseFloat(duration)) === i ? 'selected' : ''}`}
                                onClick={(e) => {
                                  e.target.parentElement.scrollTo({ top: i * 36, behavior: 'smooth' });
                                }}
                              >
                                {i}
                              </div>
                            ))}
                            <div className="wheel-spacer" />
                          </div>
                        </div>
                        <div className="wheel-column">
                          <div className="wheel-scroll" ref={minScrollRef} onScroll={(e) => {
                            const mOptions = [0, 15, 30, 45];
                            const index = Math.round(e.target.scrollTop / 36);
                            if (index >= 0 && index < mOptions.length) {
                              const m = mOptions[index];
                              const h = Math.floor(parseFloat(duration));
                              const newDuration = (h + m/60).toString();
                              if (duration !== newDuration) setDuration(newDuration);
                            }
                          }}>
                            <div className="wheel-spacer" />
                            {[0, 15, 30, 45].map((m, i) => (
                              <div 
                                key={m} 
                                className={`wheel-item ${durationUnit === 'hours' && Math.round((parseFloat(duration) % 1) * 60) === m ? 'selected' : ''}`}
                                onClick={(e) => {
                                  e.target.parentElement.scrollTo({ top: i * 36, behavior: 'smooth' });
                                }}
                              >
                                {m}
                              </div>
                            ))}
                            <div className="wheel-spacer" />
                          </div>
                        </div>
                      </div>
                      <button className="confirm-btn" onClick={() => setShowDurationPicker(false)}>Confirm</button>
                    </div>
                  )}
                </div>
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
