const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PARKING_DATA = [
    // 5 KM Bucket
    {
        name: "City Mall Parking",
        address: "Sector 17, Chandigarh",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.661, 30.516] },
        totalSlots: 20,
        hourlyRate: 50
    },
    {
        name: "Bus Stand Parking",
        address: "ISBT Sector 43, Chandigarh",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.675, 30.530] },
        totalSlots: 25,
        hourlyRate: 40
    },
    {
        name: "Market Complex Parking",
        address: "Sector 22, Chandigarh",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.685, 30.540] },
        totalSlots: 15,
        hourlyRate: 30
    },
    // 10 KM Bucket
    {
        name: "Hospital Parking",
        address: "GMSH Sector 16, Chandigarh",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.710, 30.570] },
        totalSlots: 30,
        hourlyRate: 20
    },
    {
        name: "University Parking",
        address: "Panjab University, Sector 14",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.725, 30.585] },
        totalSlots: 40,
        hourlyRate: 10
    },
    // 15 KM Bucket
    {
        name: "Railway Station Parking",
        address: "Chandigarh Railway Station",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.760, 30.600] },
        totalSlots: 35,
        hourlyRate: 60
    },
    {
        name: "IT Park Parking",
        address: "Rajiv Gandhi IT Park",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.770, 30.610] },
        totalSlots: 50,
        hourlyRate: 80
    },
    // 20 KM Bucket
    {
        name: "Airport Parking",
        address: "Chandigarh International Airport",
        city: "Mohali",
        location: { type: "Point", coordinates: [76.800, 30.640] },
        totalSlots: 60,
        hourlyRate: 100
    },
    {
        name: "Industrial Area Parking",
        address: "Phase 1, Industrial Area",
        city: "Chandigarh",
        location: { type: "Point", coordinates: [76.810, 30.650] },
        totalSlots: 45,
        hourlyRate: 40
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🚀 Connected to MongoDB');

        let admin = await User.findOne({ role: 'admin' });
        if (!admin) admin = await User.create({ name: 'System Admin', email: 'admin@system.com', password: 'password123', role: 'admin', isVerified: true });

        await ParkingLot.deleteMany({});
        await Slot.deleteMany({});

        for (const lotData of PARKING_DATA) {
            const total = lotData.totalSlots;
            const counts = {
                twoWheeler: Math.floor(total * 0.30),
                threeWheeler: Math.floor(total * 0.15),
                fourWheeler: Math.floor(total * 0.40),
                heavyVehicle: total - (Math.floor(total * 0.30) + Math.floor(total * 0.15) + Math.floor(total * 0.40))
            };

            const lot = await ParkingLot.create({
                ...lotData,
                createdBy: admin._id,
                isActive: true,
                slotsByType: counts
            });

            const slots = [];
            let slotCounter = 0;

            const prefixes = {
                twoWheeler: '2W',
                threeWheeler: '3W',
                fourWheeler: '4W',
                heavyVehicle: 'HV'
            };

            // Generate slots for each type
            for (const [type, count] of Object.entries(counts)) {
                for (let i = 1; i <= count; i++) {
                    slotCounter++;
                    slots.push({
                        parkingId: lot._id,
                        slotNumber: `${prefixes[type]}-${i}`,
                        slotType: type,
                        status: 'available'
                    });
                }
            }

            await Slot.insertMany(slots);
            console.log(`✅ Created ${lot.name} with ${total} slots (2W:${counts.twoWheeler}, 3W:${counts.threeWheeler}, 4W:${counts.fourWheeler}, Heavy:${counts.heavyVehicle})`);
        }

        console.log('✨ Seeded Successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ SEED ERROR:', err);
        process.exit(1);
    }
};

seedData();
