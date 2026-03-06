const mongoose = require('mongoose');
const ParkingLot = require('./src/models/ParkingLot');

mongoose.connect('mongodb://localhost:27017/parking_system')
    .then(async () => {
        const lots = await ParkingLot.find({}, { name: 1, hourlyRate: 1, ratesByType: 1 });
        console.log('--- Current Parking Lots ---');
        lots.forEach(lot => {
            console.log(`ID: ${lot._id} | Name: ${lot.name} | Rate: ${lot.hourlyRate} | Differentiated: ${!!lot.ratesByType}`);
        });
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
