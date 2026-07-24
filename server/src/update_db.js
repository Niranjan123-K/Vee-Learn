import 'dotenv/config';
import { query } from './config/db.js';

async function migrate() {
  try {
    console.log('Running database migration...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT '',
      ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50) DEFAULT '',
      ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT '',
      ADD COLUMN IF NOT EXISTS availability VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
    `);
    console.log('Migration successful.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
