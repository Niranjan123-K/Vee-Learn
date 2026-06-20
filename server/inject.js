import 'dotenv/config';
import { query } from './src/config/db.js';

async function run() {
  try {
    const skillRes = await query("SELECT id FROM skills WHERE name = 'JavaScript' LIMIT 1");
    if (skillRes.rows.length === 0) {
      console.log('No JavaScript skill found.');
      process.exit(1);
    }
    const skillId = skillRes.rows[0].id;

    const usersRes = await query("SELECT id FROM users");
    const userIds = usersRes.rows.map(row => row.id);

    await Promise.all(userIds.map(userId => 
      query(
        'INSERT INTO user_skills (user_id, skill_id, type, proficiency) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, skill_id, type) DO NOTHING',
        [userId, skillId, 'teach', 'expert']
      )
    ));

    console.log('Skills injected successfully for all users.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
