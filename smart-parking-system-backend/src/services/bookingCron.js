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
        console.log('Running Cron: Checking for overdue and expired bookings...');
        try {
            const now = new Date();

            // 1. Handle Overdue Bookings (Confirmed/Parked) -> Add Fine
            const overdueBookings = await Booking.find({
                endTime: { $lt: now },
                bookingStatus: { $in: ['confirmed', 'parked'] },
                finePaid: false
            }).populate('parkingId');

            for (const booking of overdueBookings) {
                const diffMs = now - booking.endTime;
                const extraHours = Math.ceil(diffMs / (1000 * 60 * 60));

                if (extraHours > 0) {
                    const hourlyRate = booking.parkingId?.hourlyRate || 50;
                    const fine = extraHours * hourlyRate * 1.5;

                    booking.fineAmount = fine;
                    booking.bookingStatus = 'overdue';
                    await booking.save();
                    console.log(`📑 Updated booking ${booking.bookingId} with fine: ₹${fine}`);
                }
            }

            // 2. Handle Expired Pending Bookings (Never paid) -> Cancel
            // If its already past endTime and still pending, cancel it.
            const expiredPending = await Booking.find({
                endTime: { $lt: now },
                bookingStatus: 'pending'
            });

            for (const b of expiredPending) {
                b.bookingStatus = 'cancelled';
                b.notes = 'System cancelled: Payment not completed before end time.';
                await b.save();
                console.log(`🚫 Cancelled expired pending booking: ${b.bookingId}`);
            }

            // 3. Optional: Cancel pending bookings older than 30 minutes (even if endTime not reached)
            const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
            const stalePending = await Booking.find({
                createdAt: { $lt: thirtyMinsAgo },
                bookingStatus: 'pending'
            });

            for (const b of stalePending) {
                b.bookingStatus = 'cancelled';
                b.notes = 'System cancelled: Payment timeout.';
                await b.save();
                console.log(`⌛ Cancelled stale pending booking: ${b.bookingId}`);
            }

        } catch (error) {
            console.error('Error in Booking Cron Job:', error);
        }
    });

    console.log('✅ Booking Status Cron Job Scheduled');
};

module.exports = startBookingCron;
