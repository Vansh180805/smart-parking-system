const mongoose = require('mongoose');
const Slot = require('./src/models/Slot');
const ParkingLot = require('./src/models/ParkingLot');

mongoose.connect('mongodb://localhost:27017/parking_system')
    .then(async () => {
        // 1. Ensure all slots have correct status
        const slotFix = await Slot.updateMany(
            { status: { $nin: ['available', 'occupied', 'reserved', 'maintenance'] } },
            { $set: { status: 'available' } }
        );
        console.log(`✅ Fixed ${slotFix.modifiedCount} slots with invalid status.`);

        const missingStatus = await Slot.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'available' } }
        );
        console.log(`✅ Fixed ${missingStatus.modifiedCount} slots with missing status.`);

        // 2. Ensure all parking lots have hourlyRate
        const pFix = await ParkingLot.updateMany(
            { hourlyRate: { $exists: false } },
            { $set: { hourlyRate: 50 } }
        );
        console.log(`✅ Fixed ${pFix.modifiedCount} parking lots missing rate.`);

        // 3. Clear any stuck reservations
        const stuckFix = await Slot.updateMany(
            { status: 'reserved', currentBookingId: null },
            { $set: { status: 'available' } }
        );
        console.log(`✅ Fixed ${stuckFix.modifiedCount} stuck reservations.`);

        console.log('\n🏁 Data cleanup complete.');
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
