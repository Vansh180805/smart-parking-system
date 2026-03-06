const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Payment = require('./src/models/Payment');
const Slot = require('./src/models/Slot');
const User = require('./src/models/User');

async function simulate() {
    try {
        await mongoose.connect('mongodb://localhost:27017/parking_system');
        console.log('Connected to DB...');

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Generate "Ghost" Bookings for the Hourly Chart
        console.log('Generating ghost bookings for chart...');
        const user = await User.findOne();
        const parking = await mongoose.model('ParkingLot').findOne();
        const slots = await Slot.find({ parkingId: parking._id }).limit(20);

        if (user && parking) {
            // Delete old ghost data for today to avoid clutter
            await Booking.deleteMany({ notes: 'SIMULATED_GHOST', createdAt: { $gte: today } });

            // Create 15 bookings spread across different hours
            for (let i = 0; i < 15; i++) {
                const randomHour = Math.floor(Math.random() * now.getHours());
                const ghostDate = new Date();
                ghostDate.setHours(randomHour, Math.floor(Math.random() * 60));

                await Booking.create({
                    userId: user._id,
                    parkingId: parking._id,
                    slotId: slots[i % slots.length]._id,
                    vehicleType: ['twoWheeler', 'fourWheeler'][i % 2],
                    vehicleNumber: `DL${10 + i}C${1000 + i}`,
                    startTime: ghostDate,
                    endTime: new Date(ghostDate.getTime() + 2 * 3600000),
                    bookingAmount: 120,
                    bookingStatus: 'completed',
                    paymentStatus: 'completed',
                    notes: 'SIMULATED_GHOST',
                    createdAt: ghostDate // This will populate the hourly chart
                });
            }
        }

        // 2. Create a "Paid Fine" history
        const oldBooking = await Booking.findOne({ bookingStatus: 'completed' });
        if (oldBooking) {
            console.log('Creating a dummy PAID fine...');
            await Payment.create({
                bookingId: oldBooking._id,
                userId: oldBooking.userId,
                amount: 150,
                paymentType: 'fine',
                paymentMethod: 'upi',
                status: 'completed',
                description: 'Demo Fine Payment'
            });
        }

        // 3. Current Overstay Simulation
        const latestBooking = await Booking.findOne({
            bookingStatus: { $in: ['confirmed', 'parked', 'pending'] },
            notes: { $ne: 'SIMULATED_GHOST' }
        }).sort({ createdAt: -1 });

        if (latestBooking) {
            console.log(`Setting Overstay for Booking: ${latestBooking._id}`);
            latestBooking.bookingStatus = 'parked';
            latestBooking.isParked = true;
            latestBooking.paymentStatus = 'completed';
            latestBooking.startTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
            latestBooking.endTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            latestBooking.finePaid = false;
            latestBooking.fineAmount = 200;
            await latestBooking.save();

            await Slot.findByIdAndUpdate(latestBooking.slotId, {
                status: 'occupied',
                currentBookingId: latestBooking._id
            });
        }

        console.log(`✅ Simulation Success!`);
        console.log('Hourly trends graph will now be full of data.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

simulate();
