import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const { rows: users } = await pool.query(`SELECT id, name FROM users WHERE name = 'demotwo' LIMIT 1`);
    if (users.length === 0) {
      console.log('User demotwo not found.');
      return;
    }
    const user = users[0];
    const userId = user.id;

    // Get some skills
    const { rows: reactSkill } = await pool.query(`SELECT id FROM skills WHERE name = 'React' LIMIT 1`);
    const { rows: figmaSkill } = await pool.query(`SELECT id FROM skills WHERE name = 'Figma' LIMIT 1`);

    if (reactSkill.length > 0) {
      await pool.query(
        `INSERT INTO user_skills (user_id, skill_id, type, proficiency, description)
         VALUES ($1, $2, 'teach', 'expert', 'I will teach you advanced React patterns and Brutalist UI development.')
         ON CONFLICT DO NOTHING`,
        [userId, reactSkill[0].id]
      );
    }

    if (figmaSkill.length > 0) {
      await pool.query(
        `INSERT INTO user_skills (user_id, skill_id, type, proficiency, description)
         VALUES ($1, $2, 'teach', 'intermediate', 'Learn to design high-end tech products in Figma.')
         ON CONFLICT DO NOTHING`,
        [userId, figmaSkill[0].id]
      );
    }

    // Insert a dummy user to be the reviewer
    const { rows: reviewer } = await pool.query(`
      INSERT INTO users (name, email, password_hash) 
      VALUES ('Alex Design', 'alex@example.com', 'hash')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);

    // Insert dummy sessions
    const { rows: session1 } = await pool.query(`
      INSERT INTO sessions (teacher_id, learner_id, skill_id, status, duration_minutes, scheduled_at)
      VALUES ($1, $2, $3, 'completed', 60, NOW())
      RETURNING id
    `, [userId, reviewer[0].id, reactSkill[0].id]);

    const { rows: session2 } = await pool.query(`
      INSERT INTO sessions (teacher_id, learner_id, skill_id, status, duration_minutes, scheduled_at)
      VALUES ($1, $2, $3, 'completed', 60, NOW())
      RETURNING id
    `, [userId, reviewer[0].id, figmaSkill[0].id]);

    // Insert some reviews
    await pool.query(
      `INSERT INTO reviews (reviewer_id, reviewee_id, session_id, rating, comment)
       VALUES ($1, $2, $3, 5, 'Absolute legend. The React session completely blew my mind. Premium architecture.')
       ON CONFLICT DO NOTHING`,
      [reviewer[0].id, userId, session1[0].id]
    );

    await pool.query(
      `INSERT INTO reviews (reviewer_id, reviewee_id, session_id, rating, comment)
       VALUES ($1, $2, $3, 5, 'Great mentor. The Figma techniques were exactly what I needed for my portfolio.')
       ON CONFLICT DO NOTHING`,
      [reviewer[0].id, userId, session2[0].id]
    );

    console.log('Demo data inserted for user:', user.name);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

run();
