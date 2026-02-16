/**
 * INTERVIEWER MODE: Run this in MongoDB Compass Shell (MONGOSH).
 * This will:
 * 1. Make all 9 locations ACTIVE.
 * 2. Move ALL of them to YOUR location so they show in 5km search.
 */

try {
    console.log("🦾 Activating Interviewer Mode...");

    // Get your current coordinates from the logs
    const userLat = 30.5158674;
    const userLon = 76.6605828;

    // 1. Update ALL parking lots: Active + Move to your location
    const result = db.parkinglots.updateMany(
        {},
        [
            {
                $set: {
                    isActive: true,
                    // We spread them slightly so they aren't exactly on top of each other
                    "location.coordinates": [
                        { $add: [userLon, { $multiply: [{ $rand: {} }, 0.01] }] },
                        { $add: [userLat, { $multiply: [{ $rand: {} }, 0.01] }] }
                    ],
                    "location.type": "Point"
                }
            }
        ]
    );

    // 2. Ensure all slots are active too
    db.slots.updateMany({}, { $set: { isActive: true, status: "available" } });

    console.log(`✅ SUCCESS! ${result.modifiedCount} locations are now active at your location.`);
    console.log("👉 Now refresh the app and select '5 km'. All 9 will be there!");

} catch (error) {
    console.error("❌ Error:", error.message);
}
