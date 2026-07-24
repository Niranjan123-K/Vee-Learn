import 'dotenv/config';
import { query } from '../../config/db.js';

async function migrate() {
  try {
    console.log('Running 001_add_google_meet migration...');
    
    await query(`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(512) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS meeting_provider VARCHAR(50) DEFAULT 'google_meet',
      ADD COLUMN IF NOT EXISTS meeting_status VARCHAR(50) DEFAULT 'NOT_CREATED',
      ADD COLUMN IF NOT EXISTS meeting_created_at TIMESTAMPTZ DEFAULT NULL;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS google_integrations (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        google_email  VARCHAR(255),
        refresh_token TEXT,
        status        VARCHAR(50) DEFAULT 'CONNECTED',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    console.log('Migration successful.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
