const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Slot = require('./src/models/Slot');

async function cleanup() {
    try {
        await mongoose.connect('mongodb://localhost:27017/parking_system');
        console.log('Connected to DB...');

        // 1. Mark unpaid overdue bookings as cancelled
        const bookings = await Booking.updateMany(
            { bookingStatus: 'overdue', totalPaid: 0 },
            { $set: { bookingStatus: 'cancelled', notes: 'System cleanup: unpaid stale booking.' } }
        );
        console.log(`✅ Cancelled ${bookings.modifiedCount} unpaid/overdue bookings.`);

        // 2. Release all slots that were incorrectly stuck in reserved
        const slots = await Slot.updateMany(
            { status: 'reserved' },
            { $set: { status: 'available', currentBookingId: null } }
        );
        console.log(`✅ Released ${slots.modifiedCount} stuck reserved slots.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanup();
