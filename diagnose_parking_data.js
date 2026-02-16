/**
 * Run this script in MongoDB Compass Shell (Mongosh) to diagnose why
 * your 9 parking lots aren't showing up.
 */

try {
    console.log("🔍 Running Data Diagnostics...");

    // 1. Check all parking lots
    const allLots = db.parkinglots.find({}).toArray();
    console.log(`📊 Total Lots in DB: ${allLots.length}`);

    allLots.forEach((lot, index) => {
        const isReady = lot.isActive === true &&
            lot.location &&
            lot.location.type === "Point" &&
            Array.isArray(lot.location.coordinates);

        console.log(`[${index + 1}] "${lot.name}"`);
        console.log(`   - isActive: ${lot.isActive}`);
        console.log(`   - Format OK: ${isReady ? "✅" : "❌ (Missing location or isActive: true)"}`);
        if (lot.location && lot.location.coordinates) {
            console.log(`   - Coords: ${JSON.stringify(lot.location.coordinates)} [Lon, Lat]`);
        }
    });

    // 2. Count slots for each
    console.log("\n🎰 Slot Count Check:");
    allLots.forEach(lot => {
        const count = db.slots.countDocuments({ parkingId: lot._id });
        console.log(`   - "${lot.name}": ${count} slots found`);
    });

    console.log("\n💡 TIP: If 'Format OK' is ❌, the app can't search for it. Make sure 'isActive' is true and 'location' is a GeoJSON Point.");

} catch (error) {
    console.error("❌ Error:", error.message);
}
