const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system', {});
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        console.log('Clearing existing data...');
        await User.deleteMany({});
        await ParkingLot.deleteMany({});
        await Slot.deleteMany({});

        console.log('Creating users...');
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const staffPassword = await bcrypt.hash('staff123', salt);
        const userPassword = await bcrypt.hash('password123', salt);

        const users = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                phone: '9999999999',
                password: adminPassword,
                role: 'admin',
                isVerified: true,
            },
            {
                name: 'Staff Member',
                email: 'staff@example.com',
                phone: '8888888888',
                password: staffPassword,
                role: 'staff',
                isVerified: true,
            },
            {
                name: 'Regular User',
                email: 'user@example.com',
                phone: '7777777777',
                password: userPassword,
                role: 'user',
                isVerified: true,
            },
        ]);

        console.log('Creating parking lots...');
        const parkingLots = await ParkingLot.create([
            {
                name: 'City Center Mall Parking',
                address: 'Sector 17, Chandigarh',
                city: 'Chandigarh',
                location: { type: 'Point', coordinates: [76.7794, 30.7333] }, // CHD
                totalSlots: 50,
                slotsByType: {
                    twoWheeler: 20,
                    threeWheeler: 5,
                    fourWheeler: 20,
                    heavyVehicle: 5
                },
                hourlyRate: 50,
                maxHours: 24,
                overStayFinePerHour: 100,
                createdBy: users[0]._id,
                isActive: true,
            },
            {
                name: 'Tech Park Plaza',
                address: 'IT Park, Bangalore',
                city: 'Bangalore',
                location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // BLR
                totalSlots: 100,
                slotsByType: {
                    twoWheeler: 50,
                    threeWheeler: 10,
                    fourWheeler: 30,
                    heavyVehicle: 10
                },
                hourlyRate: 80,
                maxHours: 48,
                overStayFinePerHour: 200,
                createdBy: users[0]._id,
                isActive: true,
            },
            {
                name: 'Downtown Market',
                address: 'Connaught Place, New Delhi',
                city: 'New Delhi',
                location: { type: 'Point', coordinates: [77.2167, 28.6328] }, // DEL
                totalSlots: 30,
                slotsByType: {
                    twoWheeler: 10,
                    threeWheeler: 5,
                    fourWheeler: 15,
                    heavyVehicle: 0
                },
                hourlyRate: 100,
                maxHours: 12,
                overStayFinePerHour: 500,
                createdBy: users[0]._id,
                isActive: true
            }
        ]);

        console.log('Generating slots...');
        const slots = [];

        for (const parking of parkingLots) {
            // Generate 2 Wheeler Slots
            for (let i = 1; i <= parking.slotsByType.twoWheeler; i++) {
                slots.push({
                    slotNumber: `2W-${i}`,
                    parkingId: parking._id,
                    slotType: 'twoWheeler',
                    status: 'available',
                    isActive: true
                });
            }
            // Generate 3 Wheeler Slots
            for (let i = 1; i <= parking.slotsByType.threeWheeler; i++) {
                slots.push({
                    slotNumber: `3W-${i}`,
                    parkingId: parking._id,
                    slotType: 'threeWheeler',
                    status: 'available',
                    isActive: true
                });
            }
            // Generate 4 Wheeler Slots
            for (let i = 1; i <= parking.slotsByType.fourWheeler; i++) {
                slots.push({
                    slotNumber: `4W-${i}`,
                    parkingId: parking._id,
                    slotType: 'fourWheeler',
                    status: 'available',
                    isActive: true
                });
            }
            // Generate Heavy Vehicle Slots
            for (let i = 1; i <= parking.slotsByType.heavyVehicle; i++) {
                slots.push({
                    slotNumber: `HV-${i}`,
                    parkingId: parking._id,
                    slotType: 'heavyVehicle',
                    status: 'available',
                    isActive: true
                });
            }
        }

        await Slot.insertMany(slots);

        console.log(`Successfully seeded:
    - ${users.length} Users
    - ${parkingLots.length} Parking Lots
    - ${slots.length} Slots
    `);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
