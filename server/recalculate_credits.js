import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`
      WITH user_credits AS (
        SELECT 
          u.id,
          COALESCE(SUM(CASE 
            WHEN ct.to_user_id = u.id AND ct.type IN ('bonus', 'earn', 'refund') THEN ct.amount 
            WHEN ct.from_user_id = u.id AND ct.type = 'spend' THEN -ct.amount 
            ELSE 0 
          END), 0) as calculated_balance
        FROM users u
        LEFT JOIN credit_transactions ct ON ct.to_user_id = u.id OR ct.from_user_id = u.id
        GROUP BY u.id
      )
      UPDATE users u
      SET credit_balance = uc.calculated_balance
      FROM user_credits uc
      WHERE u.id = uc.id;
    `);
    console.log('Credits recalculated successfully based on transaction history.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
