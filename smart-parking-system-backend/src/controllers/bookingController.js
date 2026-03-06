const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const ParkingLot = require('../models/ParkingLot');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { generateBookingQR } = require('../utils/qrGenerator');
const {
  sendBookingConfirmation,
  sendParkingConfirmation,
  sendOverstayNotification,
} = require('../utils/emailSender');

// @desc    Get nearest parking lots
// @route   GET /api/bookings/nearest-parking?lat=x&lon=y&radius=5
// @access  Private
exports.getNearestParking = async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;
    const searchRadius = parseFloat(radius || 5); // Default to 5km if not provided
    console.log(`📡 SEARCH: Lat:${lat}, Lon:${lon}, Radius:${searchRadius}km`);

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required.',
      });
    }

    const allActiveLots = await ParkingLot.find({ isActive: true });

    const { findNearestParking, calculateDistance } = require('../utils/locationUtil');

    // Calculate distance for all active lots
    const lotsWithDistance = allActiveLots.map(lot => {
      const doc = lot.toObject();
      const [longitude, latitude] = lot.location.coordinates;
      doc.distance = parseFloat(calculateDistance(
        parseFloat(lat || 0),
        parseFloat(lon || 0),
        latitude,
        longitude
      ).toFixed(2));
      return doc;
    }).sort((a, b) => a.distance - b.distance);

    // Filter by radius
    let nearbyParking = lotsWithDistance.filter(lot => lot.distance <= searchRadius);

    // If no parking found in radius, fallback to all active lots sorted by distance
    if (nearbyParking.length === 0) {
      console.log(`⚠️ Radius Empty. Falling back to all ${lotsWithDistance.length} active lots.`);
      nearbyParking = lotsWithDistance;
    }

    return res.status(200).json({
      success: true,
      count: nearbyParking.length,
      isFallback: nearbyParking.length === lotsWithDistance.length && searchRadius < 1000, // Consider fallback if radius was small and we returned all
      data: { parkingLots: nearbyParking },
    });

  } catch (error) {
    console.error('SEARCH ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get parking details and available slots
// @route   GET /api/bookings/parking/:parkingId/slots
// @access  Private
exports.getParkingSlots = async (req, res) => {
  try {
    const { parkingId } = req.params;
    const { vehicleType, date } = req.query;

    const parking = await ParkingLot.findById(parkingId);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking not found',
      });
    }

    let query = { parkingId };

    if (vehicleType) {
      query.slotType = vehicleType;
    }

    const slots = await Slot.find(query);
    const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;
    const availableSlots = slots.filter((s) => s.status === 'available').length;

    return res.status(200).json({
      success: true,
      data: {
        parking: {
          id: parking._id,
          name: parking.name,
          address: parking.address,
          city: parking.city,
          hourlyRate: parking.hourlyRate,
          maxHours: parking.maxHours,
          totalSlots: parking.totalSlots,
          occupiedSlots,
          availableSlots,
          slotsByType: parking.slotsByType,
        },
        slots: slots.map((slot) => ({
          id: slot._id,
          slotNumber: slot.slotNumber,
          slotType: slot.slotType,
          status: slot.status,
        })),
      },
    });
  } catch (error) {
    console.error('Get parking slots error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create booking
// @route   POST /api/bookings/create
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const {
      parkingId,
      slotId,
      vehicleType,
      vehicleNumber,
      startTime,
      endTime,
    } = req.body;

    const userId = req.user.userId;

    // Validation
    const missingFields = [];
    if (!parkingId) missingFields.push('parkingId');
    if (!slotId) missingFields.push('slotId');
    if (!vehicleType) missingFields.push('vehicleType');
    if (!vehicleNumber) missingFields.push('vehicleNumber');
    if (!startTime) missingFields.push('startTime');
    if (!endTime) missingFields.push('endTime');

    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missingFields.join(', ')}`,
      });
    }

    // Check parking exists
    const parking = await ParkingLot.findById(parkingId);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking not found',
      });
    }

    // Check slot exists and is available
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    if (slot.status !== 'available') {
      console.log('❌ Slot not available. Current status:', slot.status);
      return res.status(400).json({
        success: false,
        message: 'Slot is not available',
      });
    }

    // Calculate booking amount (pro-rated for short durations)
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const hours = diffMs / (1000 * 60 * 60);

    let bookingAmount;
    if (hours >= 1) {
      bookingAmount = Math.ceil(hours) * parking.hourlyRate;
    } else {
      // For under 1 hour, calculate by minute (pro-rated)
      const minutes = Math.ceil(diffMs / (1000 * 60));
      const proRated = Math.ceil((parking.hourlyRate / 60) * minutes);
      bookingAmount = Math.max(proRated, 10); // Minimum ₹10 charge
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      parkingId,
      slotId,
      vehicleType,
      vehicleNumber,
      startTime: start,
      endTime: end,
      bookingAmount,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
    });

    // Generate QR code for booking
    const qrCode = await generateBookingQR(booking);
    booking.qrCode = qrCode;
    await booking.save();

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Process QR Payment
// @route   POST /api/bookings/:bookingId/pay-qr
// @access  Private
exports.paymentQR = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed',
      });
    }

    // Simulate payment success
    const transactionId = 'TXN-' + Date.now();

    // Create payment record
    const payment = await Payment.create({
      bookingId,
      userId,
      amount: booking.bookingAmount,
      paymentType: 'booking',
      status: 'completed',
      transactionId,
    });

    // Update booking
    booking.paymentStatus = 'completed';
    booking.transactionId = transactionId;
    booking.bookingStatus = 'confirmed';
    await booking.save();

    // Update slot status
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.status = 'reserved';
    }
    await slot.save();

    // Send confirmation email
    const user = await User.findById(userId);
    const parking = await ParkingLot.findById(booking.parkingId);
    await sendBookingConfirmation(booking, user, parking, slot);

    return res.status(200).json({
      success: true,
      message: 'Payment successful',
      data: {
        booking,
        payment,
      },
    });
  } catch (error) {
    console.error('Payment QR error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    let query = { userId };

    if (status) {
      query.bookingStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('parkingId', 'name address')
      .populate('slotId', 'slotNumber slotType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: { bookings: bookings },
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Cancel booking
// @route   POST /api/bookings/:bookingId/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (booking.bookingStatus === 'parked' || booking.bookingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an active or completed booking',
      });
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Release slot
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.status = 'available';
      slot.currentBookingId = null;
      await slot.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Check overstay and calculate fine
// @route   GET /api/bookings/:bookingId/check-overstay
// @access  Private
exports.checkOverstay = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const now = new Date();
    const endTime = new Date(booking.endTime);

    if (now > endTime && !booking.fineAmount) {
      const parking = await ParkingLot.findById(booking.parkingId);
      const hoursOverstay = Math.ceil((now - endTime) / (1000 * 60 * 60));
      const fineAmount = hoursOverstay * parking.overStayFinePerHour;

      booking.fineAmount = fineAmount;
      booking.bookingStatus = 'overdue';
      await booking.save();

      // Send overstay notification
      const user = await User.findById(booking.userId);
      await sendOverstayNotification(booking, user, parking, fineAmount);

      return res.status(200).json({
        success: true,
        isOverstay: true,
        fineAmount,
        message: 'Overstay detected and fine calculated',
      });
    }

    return res.status(200).json({
      success: true,
      isOverstay: false,
      fineAmount: booking.fineAmount || 0,
      message: 'No overstay',
    });
  } catch (error) {
    console.error('Check overstay error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
// @desc    Process vehicle exit
// @route   POST /api/bookings/:bookingId/exit
// @access  Private
exports.processExit = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Vehicle already exited' });
    }

    const now = new Date();
    const endTime = new Date(booking.endTime);

    // If overstayed and fine not paid
    if (now > endTime && !booking.finePaid) {
      const parking = await ParkingLot.findById(booking.parkingId);
      const hoursOverstay = Math.ceil((now - endTime) / (1000 * 60 * 60));
      const fineAmount = hoursOverstay * (parking.overStayFinePerHour || 100);

      booking.fineAmount = fineAmount;
      booking.bookingStatus = 'overdue';
      await booking.save();

      return res.status(200).json({
        success: true,
        isOverstay: true,
        fineAmount,
        message: `Overstay detected. Please pay fine of ₹${fineAmount} to exit.`,
      });
    }

    // Normal Exit
    booking.bookingStatus = 'completed';
    booking.unparkedAt = now;
    booking.isParked = false;
    await booking.save();

    // Free the slot
    const Slot = require('../models/Slot');
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.status = 'available';
      slot.currentBookingId = null;
      await slot.save();
    }

    return res.status(200).json({
      success: true,
      isOverstay: false,
      message: 'Vehicle exited successfully. Thank you!',
    });
  } catch (error) {
    console.error('Process exit error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
