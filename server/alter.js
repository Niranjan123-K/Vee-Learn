import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS course_tag VARCHAR(50) DEFAULT ''`);
    console.log('Column course_tag added successfully.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    pool.end();
  }
}

run();
