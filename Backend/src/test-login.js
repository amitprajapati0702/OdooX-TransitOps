import "dotenv/config";
import pool from "./config/database.js";
import bcrypt from "bcrypt";

const testLogin = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT
          u.user_id,
          u.email,
          u.password_hash,
          u.is_active,
          r.role_name
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.user_id
      LEFT JOIN roles r ON r.role_id = ur.role_id
      WHERE u.email = 'admin@gmail.com'
    `);
    
    console.log("Database lookup results for admin@gmail.com:", rows);

    if (rows.length > 0) {
      const dbHash = rows[0].password_hash;
      const pass = "Password@123";
      console.log("Testing bcrypt compare with:", pass);
      const matched = await bcrypt.compare(pass, dbHash);
      console.log("Password matched:", matched);
    }
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    process.exit(0);
  }
};

testLogin();
