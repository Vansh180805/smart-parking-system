const mongoose = require('mongoose');

const ParkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide parking name'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide parking address'],
    },
    city: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 1,
    },
    slotsByType: {
      twoWheeler: {
        type: Number,
        default: 0,
      },
      threeWheeler: {
        type: Number,
        default: 0,
      },
      fourWheeler: {
        type: Number,
        default: 0,
      },
      heavyVehicle: {
        type: Number,
        default: 0,
      },
    },
    hourlyRate: {
      type: Number,
      required: true,
      default: 50,
    },
    maxHours: {
      type: Number,
      default: 24,
    },
    overStayFinePerHour: {
      type: Number,
      default: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Enable GPS search in MongoDB
ParkingLotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ParkingLot', ParkingLotSchema);
