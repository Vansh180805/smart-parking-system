/**
 * 🚀 DISTANCE DISTRIBUTION FIX 🚀
 * Run this in MongoDB Compass Shell (MONGOSH).
 * 
 * This script spreads your 9 parking lots across 3 ranges:
 * Group 1: ~2km (Visible in 5km, 10km, 15km)
 * Group 2: ~7km (Visible in 10km, 15km)
 * Group 3: ~12km (Visible in 15km)
 */

try {
    console.log("🦾 Starting Distance Distribution Fix...");

    // 1. Your current location (captured from your previous logs)
    const myLat = 30.5158674;
    const myLon = 76.6605828;

    const allLots = db.parkinglots.find({}).toArray();
    console.log(`📊 Found ${allLots.length} parking lots.`);

    // We only need 9 lots for the demo.
    const lotsToFix = allLots.slice(0, 9);

    lotsToFix.forEach((lot, i) => {
        let offset;
        let rangeName;

        if (i < 3) {
            // Group 1: ~2km away (0.015 degrees is approx 1.6km)
            offset = 0.015;
            rangeName = "5km Range (Close)";
        } else if (i < 6) {
            // Group 2: ~7km away (0.065 degrees is approx 7km)
            offset = 0.065;
            rangeName = "10km Range (Medium)";
        } else {
            // Group 3: ~12km away (0.11 degrees is approx 12km)
            offset = 0.11;
            rangeName = "15km Range (Far)";
        }

        // Add a slight random variation so they aren't in a perfectly straight line
        const variation = (Math.random() - 0.5) * 0.01;

        db.parkinglots.updateOne(
            { _id: lot._id },
            {
                $set: {
                    isActive: true,
                    name: `${lot.name.split(' (')[0]} (${rangeName})`,
                    location: {
                        type: "Point",
                        coordinates: [myLon + offset + variation, myLat + variation]
                    }
                }
            }
        );
        console.log(`✅ [${i + 1}/9] Moved: ${lot.name} to ${rangeName}`);
    });

    // 2. Ensure ALL slots are active and available
    db.slots.updateMany(
        {},
        { $set: { isActive: true, status: "available" } }
    );
    console.log(`✅ Activated all slots.`);

    console.log("\n🏁 SUCCESS! Your lots are now distributed across 5km, 10km, and 15km areas.");
    console.log("👉 REFRESH the app and test the different 'Search Radius' options! 🚀");

} catch (e) {
    console.error("❌ Error:", e.message);
}
