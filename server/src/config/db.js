// ─── Database Configuration ──────────────────────────────────
// Creates a pg Pool from DATABASE_URL and exposes helpers for
// querying, getting raw clients, and bootstrapping the schema.
// ─────────────────────────────────────────────────────────────

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log pool-level errors so they don't crash the process silently.
pool.on('error', (err) => {
  console.error('[DB] Unexpected idle-client error:', err.message);
});

/**
 * Run a parameterised query through the connection pool.
 * @param {string} text  SQL statement (use $1, $2 … placeholders)
 * @param {any[]}  params Values bound to the placeholders
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Checkout a dedicated client — use for transactions.
 * **Always** call `client.release()` in a finally block.
 */
export const getClient = () => pool.connect();

/**
 * Run schema.sql then seed.sql to bootstrap the database.
 * Safe to call on every server start (IF NOT EXISTS / ON CONFLICT).
 */
export async function initializeDatabase() {
  try {
    const schemaPath = join(__dirname, '../db/schema.sql');
    const seedPath   = join(__dirname, '../db/seed.sql');

    const schemaSql = readFileSync(schemaPath, 'utf-8');
    const seedSql   = readFileSync(seedPath, 'utf-8');

    await pool.query(schemaSql);
    console.log('[DB] Schema initialised ✓');

    await pool.query(seedSql);
    console.log('[DB] Seed data loaded ✓');
  } catch (err) {
    console.error('[DB] Initialisation failed:', err.message);
    throw err;
  }
}

export default pool;
