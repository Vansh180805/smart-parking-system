const mongoose = require('mongoose');

// Define models locally to avoid require issues
const parkingLotSchema = new mongoose.Schema({
    name: String,
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    isActive: { type: Boolean, default: true },
    totalSlots: Number,
    hourlyRate: Number
});

const slotSchema = new mongoose.Schema({
    parkingId: mongoose.Schema.Types.ObjectId,
    status: { type: String, default: 'available' },
    isActive: { type: Boolean, default: true }
});

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);
const Slot = mongoose.model('Slot', slotSchema);

const MONGO_URI = 'mongodb://localhost:27017/parking_system';

async function fixAndDiagnose() {
    try {
        console.log('--- DIAGNOSIS START ---');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB:', MONGO_URI);

        const totalLots = await ParkingLot.countDocuments({});
        console.log('Total Lots in DB:', totalLots);

        if (totalLots === 0) {
            console.log('CRITICAL: No parking lots found. Your database might be empty or using a different name.');
        }

        const activeLots = await ParkingLot.find({ isActive: true });
        console.log('Active Lots in DB:', activeLots.length);

        // Fixed coordinates for the button
        const myLat = 30.5158674;
        const myLon = 76.6605828;

        console.log('Applying Force Fix to 9 lots...');
        const allLots = await ParkingLot.find({}).sort({ createdAt: -1 });

        for (let i = 0; i < allLots.length && i < 9; i++) {
            let offset;
            let rangeName;

            if (i < 3) {
                offset = 0.015; // ~1.5km
                rangeName = "5km Range";
            } else if (i < 6) {
                offset = 0.065; // ~7km
                rangeName = "10km Range";
            } else {
                offset = 0.11; // ~12km
                rangeName = "15km Range";
            }

            const lot = allLots[i];
            await ParkingLot.findByIdAndUpdate(lot._id, {
                isActive: true,
                name: `${lot.name.split(' (')[0].trim()} (${rangeName})`,
                location: {
                    type: 'Point',
                    coordinates: [myLon + offset, myLat]
                }
            });
            console.log(`Updated: ${lot.name} -> ${rangeName}`);
        }

        await Slot.updateMany({}, { isActive: true, status: 'available' });
        console.log('All slots activated.');

        console.log('--- DIAGNOSIS END ---');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

fixAndDiagnose();
