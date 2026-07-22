import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon шаарддаг SSL — query параметрт найдахгүй, энд тодорхой зааж өгнө
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});

// Small helper so controllers can just `query(text, params)`
export const query = (text, params) => pool.query(text, params);