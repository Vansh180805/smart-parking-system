const Parking = require("../models/ParkingLot");
const Slot = require("../models/Slot");


// ===============================
// ADMIN: CREATE PARKING LOT
// ===============================
exports.createParking = async (req, res) => {
  try {

    const { name, address, latitude, longitude, totalSlots } = req.body;

    if (!name || !address || !latitude || !longitude || !totalSlots) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const parking = await Parking.create({
      name,
      address,
      totalSlots,

      // ⭐ MOST IMPORTANT PART
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      },

      createdBy: req.user?.userId
    });


    // ✅ BULK INSERT (100x faster than loop)
    const slots = Array.from({ length: totalSlots }, (_, i) => ({
      slotNumber: `SLOT-${i + 1}`,
      parkingId: parking._id,
      isBooked: false
    }));

    await Slot.insertMany(slots);


    res.status(201).json({
      success: true,
      message: "Parking created successfully",
      parking
    });

  } catch (error) {

    console.error("CREATE PARKING ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ===============================
// 🔥 USER: NEARBY PARKING (SUPER FIXED)
// ===============================
exports.getNearbyParking = async (req, res) => {
  try {

    let { latitude, longitude, radius } = req.query;

    latitude = Number(latitude);
    longitude = Number(longitude);
    radius = Number(radius) || 5; // default 5km


    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude & longitude required"
      });
    }

    console.log("USER:", latitude, longitude);
    console.log("RADIUS:", radius);


    const parkings = await Parking.aggregate([

      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude] // ⚠️ order matters
          },
          distanceField: "distance",
          maxDistance: radius * 1000, // meters
          spherical: true
        }
      },

      // convert to KM
      {
        $addFields: {
          distanceInKM: {
            $round: [{ $divide: ["$distance", 1000] }, 2]
          }
        }
      },

      {
        $sort: { distance: 1 }
      },

      // safety
      {
        $limit: 50
      }

    ]);


    console.log("FOUND:", parkings.length);


    res.json({
      success: true,
      count: parkings.length,
      data: parkings
    });

  } catch (error) {

    console.error("NEARBY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ===============================
// USER: GET SLOTS (ENHANCED FOR UI)
// ===============================
exports.getSlotsByParking = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Parking not found"
      });
    }

    const slots = await Slot.find({ parkingId: req.params.id }).sort({ slotNumber: 1 });

    const availableSlots = slots.filter(s => s.status === 'available').length;
    const occupiedSlots = slots.length - availableSlots;

    res.json({
      success: true,
      data: {
        parkingName: parking.name,
        totalSlots: slots.length,
        availableSlots,
        occupiedSlots,
        slots
      }
    });

  } catch (error) {
    console.error("GET SLOTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ===============================
// USER: GET ALL PARKING
// ===============================
exports.getAllParking = async (req, res) => {
  try {

    const parkings = await Parking.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: parkings.length,
      data: parkings
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ===============================
// USER: GET PARKING DETAILS
// ===============================
exports.getParkingDetails = async (req, res) => {
  try {

    const parking = await Parking.findById(req.params.parkingId);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Parking not found"
      });
    }

    const slots = await Slot.find({ parkingId: parking._id });

    const availableSlots = slots.filter(s => !s.isBooked).length;

    res.json({
      success: true,
      parking,
      totalSlots: slots.length,
      availableSlots,
      occupiedSlots: slots.length - availableSlots
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ===============================
// ADMIN: UPDATE PARKING
// ===============================
exports.updateParking = async (req, res) => {
  try {

    const parking = await Parking.findById(req.params.parkingId);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Parking not found"
      });
    }

    const { name, address, totalSlots } = req.body;

    if (name) parking.name = name;
    if (address) parking.address = address;
    if (totalSlots) parking.totalSlots = totalSlots;

    await parking.save();

    res.json({
      success: true,
      message: "Parking updated"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ===============================
// USER: GET PARKING STATISTICS (RESTORED)
// ===============================
exports.getParkingStats = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.parkingId);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Parking not found"
      });
    }

    const slots = await Slot.find({ parkingId: parking._id });
    const availableSlots = slots.filter(s => s.status === 'available').length;

    res.json({
      success: true,
      data: {
        totalSlots: slots.length,
        availableSlots,
        occupiedSlots: slots.length - availableSlots,
        parkingName: parking.name,
        address: parking.address
      }
    });

  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
