/**
 * Run this script in MongoDB Compass Shell (Mongosh) to fix your WHOLE database.
 * This will make all your 9+ locations visible in the app.
 */

try {
    console.log("🛠 Starting Global Database Repair...");

    // 1. Fix all Parking Lots: Set isActive to true and add missing fields
    const parkingFixResult = db.parkinglots.updateMany(
        {}, // Update ALL lots
        [
            {
                $set: {
                    isActive: true,
                    // If city is missing, set to 'Local'
                    city: { $ifNull: ["$city", "Local"] },
                    // Ensure slotsByType exists
                    slotsByType: {
                        $ifNull: [
                            "$slotsByType",
                            { twoWheeler: 20, threeWheeler: 10, fourWheeler: 20, heavyVehicle: 10 }
                        ]
                    },
                    // Ensure locations are format OK (Point)
                    "location.type": "Point"
                }
            }
        ]
    );
    console.log(`✅ Fixed ${parkingFixResult.modifiedCount} parking lots (set isActive: true)`);

    // 2. Fix Slots: Ensure all have status and slotType
    const slotsFixResult = db.slots.updateMany(
        {},
        [
            {
                $set: {
                    isActive: true,
                    status: { $ifNull: ["$status", "available"] },
                    slotType: { $ifNull: ["$slotType", "$vehicleType"] } // Rename vehicleType if it exists
                }
            }
        ]
    );
    console.log(`✅ Checked/Fixed slots for all locations.`);

    console.log("\n🏁 Done! All your locations are now ACTIVE and visible.");
    console.log("👉 Now Refresh the app and select 'Anywhere' - everything will show up!");

} catch (error) {
    console.error("❌ Error during repair:", error.message);
}
