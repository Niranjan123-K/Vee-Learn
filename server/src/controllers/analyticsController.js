// ─── Analytics Controller ───────────────────────────────────
import { query } from '../config/db.js';

/**
 * GET /api/analytics/dashboard  (protected)
 * Aggregate dashboard stats for the authenticated user.
 */
export async function getDashboardStats(req, res) {
  try {
    const userId = req.user.id;

    // ── Balance ──────────────────────────────────────────
    const { rows: [user] } = await query(
      'SELECT credit_balance FROM users WHERE id = $1',
      [userId],
    );

    // ── Credits earned & spent ───────────────────────────
    const { rows: [earned] } = await query(
      `SELECT COALESCE(SUM(amount), 0)::INT AS total
       FROM credit_transactions
       WHERE to_user_id = $1 AND type IN ('earn', 'bonus', 'refund')`,
      [userId],
    );
    const { rows: [spent] } = await query(
      `SELECT COALESCE(SUM(amount), 0)::INT AS total
       FROM credit_transactions
       WHERE from_user_id = $1 AND type = 'spend'`,
      [userId],
    );

    // ── Sessions ─────────────────────────────────────────
    const { rows: [sessionsCompleted] } = await query(
      `SELECT COUNT(*)::INT AS total FROM sessions
       WHERE (teacher_id = $1 OR learner_id = $1) AND status = 'completed'`,
      [userId],
    );
    const { rows: [sessionsUpcoming] } = await query(
      `SELECT COUNT(*)::INT AS total FROM sessions
       WHERE (teacher_id = $1 OR learner_id = $1)
         AND status IN ('pending', 'confirmed')
         AND scheduled_at > NOW()`,
      [userId],
    );

    // ── Average rating ───────────────────────────────────
    const { rows: [ratingRow] } = await query(
      `SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,2) AS avg_rating
       FROM reviews WHERE reviewee_id = $1`,
      [userId],
    );

    // ── Skill counts ─────────────────────────────────────
    const { rows: [teachCount] } = await query(
      `SELECT COUNT(*)::INT AS total FROM user_skills
       WHERE user_id = $1 AND type = 'teach'`,
      [userId],
    );
    const { rows: [learnCount] } = await query(
      `SELECT COUNT(*)::INT AS total FROM user_skills
       WHERE user_id = $1 AND type = 'learn'`,
      [userId],
    );

    // ── Recent transactions (last 5) ────────────────────
    const { rows: recentTransactions } = await query(
      `SELECT ct.*, fu.name AS from_user_name, tu.name AS to_user_name
       FROM credit_transactions ct
       LEFT JOIN users fu ON fu.id = ct.from_user_id
       JOIN users tu ON tu.id = ct.to_user_id
       WHERE ct.from_user_id = $1 OR ct.to_user_id = $1
       ORDER BY ct.created_at DESC LIMIT 5`,
      [userId],
    );

    // ── Recent sessions (last 5) ────────────────────────
    const { rows: recentSessions } = await query(
      `SELECT s.*, t.name AS teacher_name, l.name AS learner_name,
              sk.name AS skill_name
       FROM sessions s
       JOIN users t  ON t.id  = s.teacher_id
       JOIN users l  ON l.id  = s.learner_id
       JOIN skills sk ON sk.id = s.skill_id
       WHERE s.teacher_id = $1 OR s.learner_id = $1
       ORDER BY s.created_at DESC LIMIT 5`,
      [userId],
    );

    return res.json({
      credit_balance:       user?.credit_balance ?? 0,
      total_earned:         earned.total,
      total_spent:          spent.total,
      sessions_completed:   sessionsCompleted.total,
      sessions_upcoming:    sessionsUpcoming.total,
      avg_rating:           parseFloat(ratingRow.avg_rating),
      skills_teaching_count: teachCount.total,
      skills_learning_count: learnCount.total,
      recent_transactions:  recentTransactions,
      recent_sessions:      recentSessions,
    });
  } catch (err) {
    console.error('[Analytics] getDashboardStats error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
}

/**
 * GET /api/analytics/activity  (protected)
 * Monthly session counts for the past 6 months (for charts).
 */
export async function getActivityData(req, res) {
  try {
    const userId = req.user.id;

    const { rows } = await query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', scheduled_at), 'YYYY-MM') AS month,
         COUNT(*)::INT AS session_count,
         COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_count
       FROM sessions
       WHERE (teacher_id = $1 OR learner_id = $1)
         AND scheduled_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
       GROUP BY DATE_TRUNC('month', scheduled_at)
       ORDER BY month`,
      [userId],
    );

    return res.json({ activity: rows });
  } catch (err) {
    console.error('[Analytics] getActivityData error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch activity data.' });
  }
}
