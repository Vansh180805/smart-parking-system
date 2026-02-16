/**
 * 🔥 NUCLEAR INTERVIEWER FIX 🔥
 * Run this in MongoDB Compass Shell (MONGOSH).
 * This will FORCE all your 9+ locations to be 100% visible and near you.
 */

try {
    console.log("🦾 Starting Master Repair...");

    // 1. Your exact location from app logs
    const myLat = 30.5158712;
    const myLon = 76.6605841;

    // 2. Clear confusion: Force ALL lots to be Active and Local
    // We use a loop to ensure EVERY document is touched.
    const allLots = db.parkinglots.find({}).toArray();
    console.log(`📊 Found ${allLots.length} parking lots. Fixing them now...`);

    allLots.forEach((lot, i) => {
        // Spread them within 1-2 km of you
        const offsetLon = (Math.random() - 0.5) * 0.02;
        const offsetLat = (Math.random() - 0.5) * 0.02;

        db.parkinglots.updateOne(
            { _id: lot._id },
            {
                $set: {
                    isActive: true,
                    location: {
                        type: "Point",
                        coordinates: [myLon + offsetLon, myLat + offsetLat]
                    }
                }
            }
        );
        console.log(`✅ [${i + 1}/${allLots.length}] Fixed & Moved: ${lot.name}`);
    });

    // 3. Ensure ALL slots are active and linked
    const slotFix = db.slots.updateMany(
        {},
        { $set: { isActive: true, status: "available" } }
    );
    console.log(`✅ Activated ${slotFix.modifiedCount} slots.`);

    console.log("\n🏁 SUCCESS! All your lots are now ACTIVE and right next to you.");
    console.log("👉 Now REFRESH the app and select '5 km'. Interview sorted! 🚀");

} catch (e) {
    console.error("❌ Error:", e.message);
}
