const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      default: () => 'BK-' + Date.now(),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parkingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['twoWheeler', 'threeWheeler', 'fourWheeler', 'heavyVehicle'],
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    bookingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'parked', 'completed', 'cancelled', 'overdue'],
      default: 'pending',
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    qrCode: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'qr',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    isParked: {
      type: Boolean,
      default: false,
    },
    parkedAt: {
      type: Date,
      default: null,
    },
    unparkedAt: {
      type: Date,
      default: null,
    },
    staffVerificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for queries
BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ parkingId: 1, startTime: 1 });
BookingSchema.index({ bookingStatus: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
