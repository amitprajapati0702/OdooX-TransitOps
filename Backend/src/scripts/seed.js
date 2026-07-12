import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../config/database.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Password@123";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "TransitOps Admin";

const roles = [
  "Admin",
  "Fleet Manager",
  "Driver",
  "Safety Officer",
  "Financial Analyst",
];

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const roleName of roles) {
      await client.query(
        `
        INSERT INTO roles (role_name)
        VALUES ($1)
        ON CONFLICT (role_name) DO NOTHING;
        `,
        [roleName],
      );
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const { rows: userRows } = await client.query(
      `
      INSERT INTO users (full_name, email, password_hash, is_active, is_verified)
      VALUES ($1, $2, $3, TRUE, TRUE)
      ON CONFLICT (email)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        is_active = TRUE,
        is_verified = TRUE,
        updated_at = NOW()
      RETURNING user_id;
      `,
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash],
    );

    const { rows: roleRows } = await client.query(
      `
      SELECT role_id
      FROM roles
      WHERE role_name = 'Admin'
      LIMIT 1;
      `,
    );

    await client.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING;
      `,
      [userRows[0].user_id, roleRows[0].role_id],
    );

    await client.query("COMMIT");

    console.log(`Seeded admin user: ${ADMIN_EMAIL}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });