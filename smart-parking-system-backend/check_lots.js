require('dotenv').config();
const mongoose = require('mongoose');
const ParkingLot = require('./src/models/ParkingLot');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    const lots = await ParkingLot.find({});
    console.log('Total lots:', lots.length);
    console.log('Lots:', JSON.stringify(lots, null, 2));
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
