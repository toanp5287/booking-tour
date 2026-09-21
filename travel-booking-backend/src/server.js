import "dotenv/config";

import app from "./app.js";
import prisma from "./config/postgres.js";
import connectMongoDB from "./config/mongodb.js";

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected");

    await connectMongoDB();
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

startServer();
