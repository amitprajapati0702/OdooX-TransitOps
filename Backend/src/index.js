import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/database.js";
import authRoutes from "./modules/auth/auth.route.js"



dotenv.config();

const PORT = process.env.PORT || 5000;
export default authRoutes;

const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database Connected Successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();