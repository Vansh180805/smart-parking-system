const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const ParkingLot = require('../models/ParkingLot');
const Payment = require('../models/Payment');
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
    const { lat, lon, radius = 5 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const parkingLots = await ParkingLot.find({ isActive: true });

    console.log('🔍 Search params:', { lat, lon, radius });
    console.log('📊 Total active parking lots in DB:', parkingLots.length);

    const { findNearestParking } = require('../utils/locationUtil');
    const nearbyParking = findNearestParking(
      parkingLots,
      parseFloat(lat),
      parseFloat(lon),
      parseFloat(radius)
    );

    console.log('✅ Nearby parking found:', nearbyParking.length);
    if (nearbyParking.length > 0) {
      console.log('📍 First parking:', nearbyParking[0].name, 'Distance:', nearbyParking[0].distance + 'km');
    }

    return res.status(200).json({
      success: true,
      count: nearbyParking.length,
      data: { parkingLots: nearbyParking },
    });

  } catch (error) {
    console.log('Get nearest parking error:', error);
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
    console.log('📦 Create Booking Body:', req.body);
    if (!parkingId || !slotId || !vehicleType || !vehicleNumber || !startTime || !endTime) {
      console.log('❌ Missing fields:', { parkingId, slotId, vehicleType, vehicleNumber, startTime, endTime });
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
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

    // Calculate booking amount
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    const bookingAmount = hours * parking.hourlyRate;

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

    // Temporarily mark slot as reserved
    slot.status = 'reserved';
    slot.currentBookingId = booking._id;
    await slot.save();

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
