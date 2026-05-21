/**
 * Run this script in MongoDB Compass Shell (Mongosh) to REVERT all pricing variety changes.
 * This script removes 'ratesByType' and resets everything to a single source of truth: 'hourlyRate'.
 */

try {
    console.log("🛠 Reverting Vehicle Prices to simple hourlyRate...");

    const revertResult = db.parkinglots.updateMany(
        {},
        {
            $unset: { ratesByType: "" },
            $set: { isActive: true } // Keep them visible
        }
    );

    console.log(`✅ Reverted ${revertResult.modifiedCount} parking lots to simple pricing.`);
    console.log("\n🏁 Done! All your locations now use a single hourly rate again.");
    console.log("👉 Simple mode is restored.");

} catch (error) {
    console.error("❌ Error during revert:", error.message);
}
