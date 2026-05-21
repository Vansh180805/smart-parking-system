/**
 * Run this script in MongoDB Compass Shell (Mongosh) to add a parking lot
 * exactly at your current detected location.
 */

try {
    console.log("📍 Adding parking lot at your detected location...");

    const adminUser = db.users.findOne({ role: "admin" });
    if (!adminUser) {
        throw new Error("Admin user not found. Please run seed script first.");
    }

    // Use the coordinates detected from your console logs
    const userLat = 30.5158674;
    const userLon = 76.6605828;

    // 1. Create Parking Lot
    const parkingResult = db.parkinglots.insertOne({
        name: "Sector 5 Local Park",
        address: "Nearby Your Location",
        city: "Local",
        location: { type: "Point", coordinates: [userLon, userLat] },
        totalSlots: 30,
        slotsByType: {
            twoWheeler: 10,
            threeWheeler: 5,
            fourWheeler: 10,
            heavyVehicle: 5
        },
        hourlyRate: 40,
        maxHours: 24,
        overStayFinePerHour: 80,
        createdBy: adminUser._id,
        isActive: true,
        createdAt: new Date()
    });

    const parkingId = parkingResult.insertedId;
    console.log(`✅ Parking Lot Created: ${parkingId}`);

    // 2. Generate Slots
    const slots = [];

    // 4W Slots
    for (let i = 1; i <= 10; i++) {
        slots.push({
            slotNumber: `4W-L-${i}`,
            parkingId: parkingId,
            slotType: "fourWheeler",
            status: "available",
            isActive: true,
            createdAt: new Date()
        });
    }

    // 2W Slots
    for (let i = 1; i <= 10; i++) {
        slots.push({
            slotNumber: `2W-L-${i}`,
            parkingId: parkingId,
            slotType: "twoWheeler",
            status: "available",
            isActive: true,
            createdAt: new Date()
        });
    }

    db.slots.insertMany(slots);
    console.log(`✅ Created ${slots.length} slots for the local park.`);
    console.log("🏁 Done! Refresh the app and select '5 km' - you should see it now!");

} catch (error) {
    console.error("❌ Error:", error.message);
}
