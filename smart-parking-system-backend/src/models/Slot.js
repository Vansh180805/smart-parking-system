const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: [true, 'Please provide slot number'],
    },
    parkingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
    },
    slotType: {
      type: String,
      enum: ['twoWheeler', 'threeWheeler', 'fourWheeler', 'heavyVehicle'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    lastOccupiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastOccupiedTime: {
      type: Date,
      default: null,
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

// Compound index for parking and slot number
SlotSchema.index({ parkingId: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Slot', SlotSchema);
