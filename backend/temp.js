import mongoose from "mongoose";
import User from "./models/User.js"; // adjust the path if needed

const MONGO_URI = "your_mongodb_connection_uri_here";

const runCleanup = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await User.updateMany({}, {
      $pull: {
        requestsNotifications: {
          $or: [
            { sender: { $exists: false } },
            { receiver: { $exists: false } },
            { direction: { $exists: false } },
            { type: { $exists: false } },
          ],
        },
      },
    });

    console.log("🧹 Cleanup done:", result);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
};

runCleanup();
