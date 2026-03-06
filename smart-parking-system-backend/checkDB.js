const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        return checkParkingLots();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

async function checkParkingLots() {
    try {
        const ParkingLot = require('./src/models/ParkingLot');

        const count = await ParkingLot.countDocuments();
        console.log(`\n📊 Total Parking Lots: ${count}\n`);

        if (count > 0) {
            const parkingLots = await ParkingLot.find().limit(5);
            console.log('First 5 parking lots:');
            parkingLots.forEach((lot, index) => {
                console.log(`\n${index + 1}. ${lot.name}`);
                console.log(`   Address: ${lot.address}`);
                console.log(`   Total Slots: ${lot.totalSlots}`);
                console.log(`   Location: [${lot.location?.coordinates[1]}, ${lot.location?.coordinates[0]}]`);
                console.log(`   Active: ${lot.isActive}`);
            });
        } else {
            console.log('⚠️  No parking lots found in database!');
            console.log('💡 You need to create parking lots using the admin panel.');
        }

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        mongoose.connection.close();
        process.exit(1);
    }
}
