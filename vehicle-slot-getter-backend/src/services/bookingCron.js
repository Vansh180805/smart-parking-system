const cron = require('node-cron');
const Booking = require('../models/Booking');
const ParkingLot = require('../models/ParkingLot');

/**
 * Cron job to check for expired bookings every minute
 * and calculate fines if needed.
 */
const startBookingCron = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running Cron: Checking for overdue bookings...');
        try {
            const now = new Date();

            // Find bookings that have passed their endTime but are not yet completed or cancelled
            const overdueBookings = await Booking.find({
                endTime: { $lt: now },
                bookingStatus: { $in: ['confirmed', 'parked', 'pending'] },
                finePaid: false
            }).populate('parkingId');

            for (const booking of overdueBookings) {
                const diffMs = now - booking.endTime;
                const extraHours = Math.ceil(diffMs / (1000 * 60 * 60)); // Round up to nearest hour

                if (extraHours > 0) {
                    const hourlyRate = booking.parkingId.hourlyRate || 50; // Fallback to 50 if rate not found
                    const fine = extraHours * hourlyRate * 1.5;

                    booking.fineAmount = fine;
                    booking.bookingStatus = 'overdue';
                    await booking.save();

                    console.log(`Updated booking ${booking.bookingId} with fine: ₹${fine}`);
                }
            }
        } catch (error) {
            console.error('Error in Booking Cron Job:', error);
        }
    });

    console.log('✅ Booking Status Cron Job Scheduled');
};

module.exports = startBookingCron;
