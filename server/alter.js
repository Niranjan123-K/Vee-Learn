import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS wallpaper_url VARCHAR(512) DEFAULT ''`);
    console.log('Column wallpaper_url added successfully.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    pool.end();
  }
}

run();
