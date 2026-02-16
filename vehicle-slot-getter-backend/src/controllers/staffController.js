const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const ParkingLot = require('../models/ParkingLot');
const { sendParkingConfirmation } = require('../utils/emailSender');
const User = require('../models/User');

// @desc    Verify QR code and allow parking entry
// @route   POST /api/staff/verify-parking
// @access  Private/Staff
exports.verifyParking = async (req, res) => {
  try {
    const { bookingId, slotId } = req.body;
    const staffId = req.user.userId;

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify booking details
    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
      });
    }

    if (booking.slotId.toString() !== slotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Slot mismatch',
      });
    }

    const now = new Date();

    // Check if booking time has started
    if (now < new Date(booking.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Booking time has not started yet',
      });
    }

    // Check if booking has expired
    if (now > new Date(booking.endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Booking time has expired',
      });
    }

    // Update booking status
    booking.isParked = true;
    booking.parkedAt = now;
    booking.bookingStatus = 'parked';
    booking.staffVerificationId = staffId;
    await booking.save();

    // Update slot status
    const slot = await Slot.findById(slotId);
    if (slot) {
      slot.status = 'occupied';
      slot.currentBookingId = bookingId;
      slot.lastOccupiedTime = now;
      await slot.save();
    }

    // Send parking confirmation email
    const user = await User.findById(booking.userId);
    const parking = await ParkingLot.findById(booking.parkingId);
    await sendParkingConfirmation(booking, user, parking, slot);

    return res.status(200).json({
      success: true,
      message: 'Vehicle verified and entry granted',
      data: {
        bookingId: booking._id,
        vehicleNumber: booking.vehicleNumber,
        slotNumber: slot.slotNumber,
        userName: user.name,
        parkedAt: booking.parkedAt,
      },
    });
  } catch (error) {
    console.error('Verify parking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Mark vehicle as unparked
// @route   POST /api/staff/mark-unparked/:bookingId
// @access  Private/Staff
exports.markUnparked = async (req, res) => {
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
    let fineAmount = 0;

    // Calculate fine if overstayed
    if (now > endTime) {
      const parking = await ParkingLot.findById(booking.parkingId);
      const hoursOverstayed = Math.ceil((now - endTime) / (1000 * 60 * 60));
      fineAmount = hoursOverstayed * (parking.overStayFinePerHour || 100);

      booking.fineAmount = fineAmount;
      booking.notes = (booking.notes || '') + ` Overstay fine: ₹${fineAmount} for ${hoursOverstayed} hour(s).`;
    }

    booking.unparkedAt = now;
    booking.bookingStatus = 'completed';
    booking.isParked = false;
    await booking.save();

    // Free up the slot
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.status = 'available';
      slot.currentBookingId = null;
      slot.lastOccupiedBy = booking.userId;
      await slot.save();
    }

    return res.status(200).json({
      success: true,
      message: fineAmount > 0
        ? `Vehicle marked as unparked. Overstay fine calculated: ₹${fineAmount}`
        : 'Vehicle marked as unparked',
      data: {
        ...booking.toObject(),
        overstayFine: fineAmount
      },
    });
  } catch (error) {
    console.error('Mark unparked error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get parking entry requests (staff dashboard)
// @route   GET /api/staff/pending-entries?parkingId=x
// @access  Private/Staff
exports.getPendingEntries = async (req, res) => {
  try {
    const { parkingId, page = 1, limit = 10 } = req.query;

    let query = {
      bookingStatus: 'confirmed',
      paymentStatus: 'completed',
      isParked: false,
    };

    if (parkingId) {
      query.parkingId = parkingId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('userId', 'name phone email vehicleNumber')
      .populate('slotId', 'slotNumber slotType')
      .populate('parkingId', 'name address')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings,
    });
  } catch (error) {
    console.error('Get pending entries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get currently parked vehicles
// @route   GET /api/staff/parked-vehicles?parkingId=x
// @access  Private/Staff
exports.getParkedVehicles = async (req, res) => {
  try {
    const { parkingId, page = 1, limit = 10 } = req.query;

    let query = {
      bookingStatus: 'parked',
      isParked: true,
    };

    if (parkingId) {
      query.parkingId = parkingId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('userId', 'name phone vehicleNumber')
      .populate('slotId', 'slotNumber slotType')
      .sort({ parkedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings,
    });
  } catch (error) {
    console.error('Get parked vehicles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get booking details for verification
// @route   GET /api/staff/booking/:bookingId
// @access  Private/Staff
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email phone')
      .populate('slotId', 'slotNumber slotType')
      .populate('parkingId', 'name address');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
