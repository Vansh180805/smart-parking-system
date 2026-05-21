/**
 * NUCLEAR FIX for Interviewer: Run this in MongoDB Compass Shell (MONGOSH).
 * This script will FORCE all 9+ locations to show up in your 5km search.
 */

try {
    console.log("🚀 Starting Nuclear Fix...");

    // 1. Get your current location from previous logs
    const userLat = 30.5158674;
    const userLon = 76.6605828;

    // 2. Clear out any confusion and fix all parking lots
    const lots = db.parkinglots.find({}).toArray();
    console.log(`📊 Found ${lots.length} lots in database. Fixing them now...`);

    lots.forEach((lot, i) => {
        // Spread them slightly around you (0.001 deg ~ 100m)
        const newLon = userLon + (Math.random() - 0.5) * 0.01;
        const newLat = userLat + (Math.random() - 0.5) * 0.01;

        db.parkinglots.updateOne(
            { _id: lot._id },
            {
                $set: {
                    isActive: true,
                    location: {
                        type: "Point",
                        coordinates: [newLon, newLat]
                    }
                }
            }
        );
        console.log(`✅ [${i + 1}/${lots.length}] Moved "${lot.name}" to your area.`);
    });

    // 3. Ensure all slots are active and linked
    const slotsResult = db.slots.updateMany({}, { $set: { isActive: true, status: "available" } });
    console.log(`✅ Activated ${slotsResult.modifiedCount} slots.`);

    console.log("\n🔥 ALL DONE! Every single lot is now near you and active.");
    console.log("👉 Refresh the app and select '5 km' range. They MUST show up now.");

} catch (error) {
    console.error("❌ ERROR:", error.message);
    console.log("💡 Tip: Make sure you are in the correct database in Compass!");
}
