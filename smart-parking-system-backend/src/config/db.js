const mongoose = require("mongoose");

const connectDB = async (retryCount = 0) => {
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 5000; // 5 seconds

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 MongoDB Connected Successfully");
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying connection in ${RETRY_INTERVAL/1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_INTERVAL);
    } else {
      console.error("⚠️  Maximum MongoDB connection retries reached. Backend running in DEGRADED MODE (Database offline).");
      // We don't exit the process here to allow the server to remain alive for health checks/other routes
    }
  }
};

module.exports = connectDB;
