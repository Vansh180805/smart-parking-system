const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

dotenv.config();

const seedBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        // Fetch necessary data
        const users = await User.find({});
        const parkingLots = await ParkingLot.find({});
        const slots = await Slot.find({});

        if (users.length === 0 || parkingLots.length === 0 || slots.length === 0) {
            console.log('Error: Please run seed.js first to create Users, ParkingLots, and Slots.');
            process.exit(1);
        }

        console.log('Clearing existing bookings and payments...');
        await Booking.deleteMany({});
        await Payment.deleteMany({});

        // Reset all slots to available first
        await Slot.updateMany({}, { status: 'available' });

        const bookings = [];
        const payments = [];
        const now = new Date();

        // Helper to getRandom item from array
        const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // Helper to generate random date within last N days
        const getRandomDate = (daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
            date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
            return date;
        };

        console.log('Generating bookings and payments...');

        // 1. PAST COMPLETED BOOKINGS (Last 7 days) - Generate 50 bookings
        // Focused on last 7 days to populate the weekly charts
        for (let i = 0; i < 50; i++) {
            const parking = getRandom(parkingLots);
            const user = getRandom(users);
            const parkingSlots = slots.filter(s => s.parkingId.toString() === parking._id.toString());
            if (parkingSlots.length === 0) continue;
            const slot = getRandom(parkingSlots);

            const startTime = getRandomDate(7); // Last 7 days
            const durationHours = Math.floor(Math.random() * 5) + 1; // 1-6 hours
            const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

            const bookingAmount = durationHours * parking.hourlyRate;
            const fineAmount = Math.random() > 0.8 ? 100 : 0; // 20% chance of fine

            const bookingId = new mongoose.Types.ObjectId();

            const booking = {
                _id: bookingId,
                bookingId: `BK-${Date.now()}-${i}`,
                userId: user._id,
                parkingId: parking._id,
                slotId: slot._id,
                vehicleType: slot.slotType,
                vehicleNumber: `PB-${Math.floor(Math.random() * 99)}-${Math.floor(Math.random() * 9999)}`,
                startTime,
                endTime,
                bookingAmount,
                fineAmount,
                totalPaid: bookingAmount + fineAmount,
                paymentStatus: 'completed',
                bookingStatus: 'completed',
                isParked: false,
                parkedAt: startTime,
                unparkedAt: endTime,
                createdAt: startTime
            };
            bookings.push(booking);

            // Payment for Booking
            payments.push({
                transactionId: `TXN-${Date.now()}-${i}-B`,
                bookingId: bookingId,
                userId: user._id,
                amount: bookingAmount,
                paymentType: 'booking',
                status: 'completed',
                createdAt: startTime // Same time as booking for charts
            });

            // Payment for Fine (if any)
            if (fineAmount > 0) {
                payments.push({
                    transactionId: `TXN-${Date.now()}-${i}-F`,
                    bookingId: bookingId,
                    userId: user._id,
                    amount: fineAmount,
                    paymentType: 'fine',
                    status: 'completed',
                    createdAt: endTime // Fine paid at end
                });
            }
        }

        // 2. ACTIVE BOOKINGS (Currently Parked) - Generate 10 bookings
        for (let i = 0; i < 10; i++) {
            const parking = getRandom(parkingLots);
            const user = getRandom(users);
            // Find AVAILABLE slots only
            const parkingSlots = slots.filter(s =>
                s.parkingId.toString() === parking._id.toString() &&
                !bookings.some(b => b.slotId.toString() === s._id.toString() && b.bookingStatus === 'parked')
            );

            if (parkingSlots.length === 0) continue;
            const slot = getRandom(parkingSlots);

            const startTime = new Date(now.getTime() - Math.floor(Math.random() * 2) * 60 * 60 * 1000); // 0-2 hours ago
            const durationHours = 4;
            const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
            const bookingAmount = durationHours * parking.hourlyRate;

            const bookingId = new mongoose.Types.ObjectId();

            bookings.push({
                _id: bookingId,
                bookingId: `BK-ACTIVE-${i}`,
                userId: user._id,
                parkingId: parking._id,
                slotId: slot._id,
                vehicleType: slot.slotType,
                vehicleNumber: `HR-26-${Math.floor(Math.random() * 9999)}`,
                startTime,
                endTime,
                bookingAmount,
                paymentStatus: 'completed',
                bookingStatus: 'parked',
                isParked: true,
                parkedAt: startTime,
                createdAt: startTime
            });

            // Payment for Booking
            payments.push({
                transactionId: `TXN-ACTIVE-${i}`,
                bookingId: bookingId,
                userId: user._id,
                amount: bookingAmount,
                paymentType: 'booking',
                status: 'completed',
                createdAt: startTime
            });

            // Update Slot Status
            await Slot.updateOne({ _id: slot._id }, { status: 'occupied' });
        }

        // 3. UPCOMING BOOKINGS (Confirmed) - Generate 5 bookings
        for (let i = 0; i < 5; i++) {
            const parking = getRandom(parkingLots);
            const user = getRandom(users);
            const parkingSlots = slots.filter(s => s.parkingId.toString() === parking._id.toString());
            if (parkingSlots.length === 0) continue;
            const slot = getRandom(parkingSlots);

            const startTime = new Date(now.getTime() + Math.floor(Math.random() * 24) * 60 * 60 * 1000); // 1-24 hours from now
            const durationHours = 2;
            const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
            const bookingAmount = durationHours * parking.hourlyRate;

            const bookingId = new mongoose.Types.ObjectId();

            bookings.push({
                _id: bookingId,
                bookingId: `BK-FUTURE-${i}`,
                userId: user._id,
                parkingId: parking._id,
                slotId: slot._id,
                vehicleType: slot.slotType,
                vehicleNumber: `DL-10-${Math.floor(Math.random() * 9999)}`,
                startTime,
                endTime,
                bookingAmount,
                paymentStatus: 'pending',
                bookingStatus: 'confirmed',
                isParked: false,
                createdAt: now
            });
        }

        await Booking.insertMany(bookings);
        await Payment.insertMany(payments);

        console.log(`Successfully seeded:
    - ${bookings.length} Bookings
    - ${payments.length} Payments
    `);

        process.exit(0);
    } catch (err) {
        console.error('Error seeding bookings:', err);
        process.exit(1);
    }
};

seedBookings();
