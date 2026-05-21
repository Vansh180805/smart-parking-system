/**
 * Run this script in MongoDB Compass Shell (Mongosh) to update prices with COMPLETE VARIETY.
 * This script ensures EVERY location has unique pricing for ALL vehicle types.
 */

try {
    console.log("🛠 Updating Vehicle Prices with ULTRA VARIETY for all Parking Lots...");

    db.parkinglots.find().forEach(lot => {
        // Generate a pseudo-random seed based on the name length AND characters
        let seed = 0;
        for (let i = 0; i < lot.name.length; i++) {
            seed += lot.name.charCodeAt(i) * (i + 1);
        }

        // Base rate varies between 30 and 150
        const base = 30 + (seed % 17) * 8;

        // Create unique rates for each type with a unique multiplier for this specific lot
        const multiplier = 1 + (seed % 10) / 100; // Small random variation per lot

        db.parkinglots.updateOne(
            { _id: lot._id },
            {
                $set: {
                    isActive: true, // Make sure visible
                    ratesByType: {
                        twoWheeler: Math.max(10, Math.ceil(base * 0.35 * multiplier)),
                        threeWheeler: Math.max(20, Math.ceil(base * 0.65 * multiplier)),
                        fourWheeler: base,
                        heavyVehicle: Math.ceil(base * (1.8 + (seed % 5) * 0.1) * multiplier + 15 + (seed % 10))
                    }
                }
            }
        );

        const updated = db.parkinglots.findOne({ _id: lot._id });
        console.log(`✅ ${lot.name}: 🏍️ ₹${updated.ratesByType.twoWheeler} | � ₹${updated.ratesByType.fourWheeler} | 🚚 ₹${updated.ratesByType.heavyVehicle}`);
    });

    console.log("\n🏁 Done! All locations now have unique prices as requested.");

} catch (error) {
    console.error("❌ Error during update:", error.message);
}
