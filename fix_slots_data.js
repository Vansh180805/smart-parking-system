/**
 * Run this script in MongoDB Compass Shell (Mongosh) to fix manually created slots.
 * This aligns manual slots with the application's schema.
 */

try {
    console.log("🛠 Starting database repair...");

    // 1. Fix Slots: Rename vehicleType -> slotType and set status
    const slotUpdateResult = db.slots.updateMany(
        { slotType: { $exists: false }, vehicleType: { $exists: true } },
        [
            {
                $set: {
                    slotType: "$vehicleType",
                    status: { $cond: { if: { $eq: ["$isOccupied", true] }, then: "occupied", else: "available" } },
                    isActive: true
                }
            },
            { $unset: ["vehicleType", "isOccupied"] }
        ]
    );
    console.log(`✅ Slots updated: ${slotUpdateResult.modifiedCount}`);

    // 2. Fix Slots: Ensure all have isActive set if missing
    const activeUpdateResult = db.slots.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true } }
    );
    console.log(`✅ Active status ensured on ${activeUpdateResult.modifiedCount} slots`);

    // 3. Fix Slots: Ensure all have status set if missing
    const statusUpdateResult = db.slots.updateMany(
        { status: { $exists: false } },
        { $set: { status: "available" } }
    );
    console.log(`✅ Default status set on ${statusUpdateResult.modifiedCount} slots`);

    console.log("🏁 Database repair complete! Please refresh the app.");
} catch (error) {
    console.error("❌ Error during repair:", error);
}
