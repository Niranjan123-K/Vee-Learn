import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const sql = fs.readFileSync('migrations/01_add_meeting_columns.sql', 'utf8');
    await pool.query(sql);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    pool.end();
  }
}

run();
