const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');

// @desc    Create parking lot (Admin only)
// @route   POST /api/parking/create
// @access  Private/Admin
exports.createParking = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      latitude,
      longitude,
      totalSlots,
      slotsByType,
      hourlyRate,
      maxHours,
      overStayFinePerHour,
    } = req.body;

    const userId = req.user.userId;

    // Validation
    if (!name || !address || !city || !totalSlots || !hourlyRate) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing',
      });
    }

    // Create parking lot
    const parking = await ParkingLot.create({
      name,
      address,
      city,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // [lon, lat] for MongoDB
      },
      totalSlots,
      slotsByType: slotsByType || {
        twoWheeler: Math.floor(totalSlots * 0.4),
        threeWheeler: Math.floor(totalSlots * 0.2),
        fourWheeler: Math.floor(totalSlots * 0.3),
        heavyVehicle: Math.floor(totalSlots * 0.1),
      },
      hourlyRate,
      maxHours: maxHours || 24,
      overStayFinePerHour: overStayFinePerHour || 100,
      createdBy: userId,
    });

    // Create slots based on type
    const slots = [];
    const typeSlots = parking.slotsByType;
    let slotCounter = 1;

    // Create 2wheeler slots
    for (let i = 0; i < typeSlots.twoWheeler; i++) {
      slots.push({
        slotNumber: `A${slotCounter++}`,
        parkingId: parking._id,
        slotType: 'twoWheeler',
        status: 'available',
      });
    }

    // Create 3wheeler slots
    for (let i = 0; i < typeSlots.threeWheeler; i++) {
      slots.push({
        slotNumber: `B${slotCounter++}`,
        parkingId: parking._id,
        slotType: 'threeWheeler',
        status: 'available',
      });
    }

    // Create 4wheeler slots
    for (let i = 0; i < typeSlots.fourWheeler; i++) {
      slots.push({
        slotNumber: `C${slotCounter++}`,
        parkingId: parking._id,
        slotType: 'fourWheeler',
        status: 'available',
      });
    }

    // Create heavy vehicle slots
    for (let i = 0; i < typeSlots.heavyVehicle; i++) {
      slots.push({
        slotNumber: `D${slotCounter++}`,
        parkingId: parking._id,
        slotType: 'heavyVehicle',
        status: 'available',
      });
    }

    await Slot.insertMany(slots);

    return res.status(201).json({
      success: true,
      message: 'Parking lot created successfully with all slots',
      data: {
        parking,
        slotsCreated: slots.length,
      },
    });
  } catch (error) {
    console.error('Create parking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all parking lots
// @route   GET /api/parking/all
// @access  Public
exports.getAllParking = async (req, res) => {
  try {
    const { page = 1, limit = 10, city } = req.query;

    let query = { isActive: true };

    if (city) {
      query.city = city;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const parkingLots = await ParkingLot.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ParkingLot.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: parkingLots.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: parkingLots,
    });
  } catch (error) {
    console.error('Get parking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get parking details with availability
// @route   GET /api/parking/:parkingId/details
// @access  Public
exports.getParkingDetails = async (req, res) => {
  try {
    const { parkingId } = req.params;

    const parking = await ParkingLot.findById(parkingId);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking not found',
      });
    }

    // Get slot statistics
    const slots = await Slot.find({ parkingId });
    const availableSlots = slots.filter((s) => s.status === 'available').length;
    const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;
    const reservedSlots = slots.filter((s) => s.status === 'reserved').length;
    const occupancyPercentage = ((occupiedSlots + reservedSlots) / parking.totalSlots) * 100;

    // Group slots by type
    const slotsByType = {
      twoWheeler: slots.filter((s) => s.slotType === 'twoWheeler'),
      threeWheeler: slots.filter((s) => s.slotType === 'threeWheeler'),
      fourWheeler: slots.filter((s) => s.slotType === 'fourWheeler'),
      heavyVehicle: slots.filter((s) => s.slotType === 'heavyVehicle'),
    };

    return res.status(200).json({
      success: true,
      data: {
        parking,
        statistics: {
          totalSlots: parking.totalSlots,
          availableSlots,
          occupiedSlots,
          reservedSlots,
          occupancyPercentage: occupancyPercentage.toFixed(2),
        },
        slotsByType,
      },
    });
  } catch (error) {
    console.error('Get parking details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update parking lot
// @route   PUT /api/parking/:parkingId/update
// @access  Private/Admin
exports.updateParking = async (req, res) => {
  try {
    const { parkingId } = req.params;
    const { name, hourlyRate, maxHours, overStayFinePerHour, isActive } = req.body;

    const parking = await ParkingLot.findByIdAndUpdate(
      parkingId,
      {
        ...(name && { name }),
        ...(hourlyRate && { hourlyRate }),
        ...(maxHours && { maxHours }),
        ...(overStayFinePerHour && { overStayFinePerHour }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Parking updated successfully',
      data: parking,
    });
  } catch (error) {
    console.error('Update parking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get nearby parking lots
// @route   GET /api/parking/nearby?lat=x&lon=y&radius=5
// @access  Public
exports.getNearbyParking = async (req, res) => {
  try {
    const { lat, lon, radius = 5 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const parkingLots = await ParkingLot.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000, // Convert to meters
        },
      },
      isActive: true,
    });

    const { findNearestParking } = require('../utils/locationUtil');
    const nearbyParking = findNearestParking(
      parkingLots,
      parseFloat(lat),
      parseFloat(lon),
      parseFloat(radius)
    );

    return res.status(200).json({
      success: true,
      count: nearbyParking.length,
      data: nearbyParking,
    });
  } catch (error) {
    console.error('Get nearby parking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get parking statistics
// @route   GET /api/parking/:parkingId/stats
// @access  Private
exports.getParkingStats = async (req, res) => {
  try {
    const { parkingId } = req.params;

    const parking = await ParkingLot.findById(parkingId);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking not found',
      });
    }

    const slots = await Slot.find({ parkingId });

    const stats = {
      totalSlots: parking.totalSlots,
      availableSlots: slots.filter((s) => s.status === 'available').length,
      occupiedSlots: slots.filter((s) => s.status === 'occupied').length,
      reservedSlots: slots.filter((s) => s.status === 'reserved').length,
      maintenanceSlots: slots.filter((s) => s.status === 'maintenance').length,
      occupancyRate:
        ((slots.filter((s) => s.status === 'occupied').length + slots.filter((s) => s.status === 'reserved').length) /
          parking.totalSlots) *
        100,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get parking stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
