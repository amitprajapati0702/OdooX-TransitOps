//  Database Connection

import pg, { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()


 export const pool = new Pool(
    {
        connectionString:process.env.DATABASE_URL
    }
)

pool.on("connect",() => {
      console.log("✅ PostgreSQL Connected");
})

pool.on("error", (err) => {
  console.error("Database Error:", err);
});

export default pool;