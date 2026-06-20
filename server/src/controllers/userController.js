// ─── User Controller ────────────────────────────────────────
import { query } from '../config/db.js';
import { isValidUUID } from '../middleware/validate.js';

/**
 * GET /api/users/:id
 * Public profile with skills, avg rating, and total completed sessions.
 */
export async function getProfile(req, res) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const { rows: [user] } = await query(
      `SELECT id, name, email, bio, avatar_url, credit_balance, created_at
       FROM users WHERE id = $1`,
      [id],
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Skills
    const { rows: skills } = await query(
      `SELECT us.id, us.type, us.proficiency, us.description,
              s.id AS skill_id, s.name AS skill_name, s.category
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1
       ORDER BY us.type, s.category, s.name`,
      [id],
    );

    // Average rating
    const { rows: [ratingRow] } = await query(
      `SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,2) AS avg_rating,
              COUNT(*)::INT AS review_count
       FROM reviews WHERE reviewee_id = $1`,
      [id],
    );

    // Total completed sessions (as teacher or learner)
    const { rows: [sessionRow] } = await query(
      `SELECT COUNT(*)::INT AS total_sessions
       FROM sessions
       WHERE (teacher_id = $1 OR learner_id = $1) AND status = 'completed'`,
      [id],
    );

    return res.json({
      user: {
        ...user,
        skills,
        avg_rating: parseFloat(ratingRow.avg_rating),
        review_count: ratingRow.review_count,
        total_sessions: sessionRow.total_sessions,
      },
    });
  } catch (err) {
    console.error('[User] getProfile error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
}

/**
 * GET /api/users/teachers
 * List teachers, optionally filtered by skill ID.
 */
export async function getTeachers(req, res) {
  try {
    const { skill } = req.query;
    
    let queryStr = `
      SELECT DISTINCT
        u.id AS _id, u.id, u.name, u.avatar_url, u.bio, u.course_tag,
        COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE reviewee_id = u.id), 0) AS "averageRating",
        (SELECT COUNT(*)::INT FROM sessions WHERE teacher_id = u.id AND status = 'completed') AS "sessionsCompleted"
      FROM users u
    `;
    const params = [];

    if (skill && skill !== 'all') {
      queryStr += ` JOIN user_skills us ON u.id = us.user_id AND us.type = 'teach' `;
      if (isValidUUID(skill)) {
        queryStr += ` WHERE us.skill_id = $1 `;
        params.push(skill);
      } else {
        // If skill is passed as name instead of UUID
        queryStr += ` JOIN skills s ON s.id = us.skill_id WHERE s.name ILIKE $1 `;
        params.push(skill);
      }
    } else {
      // For "all", let's just return all users who have at least one skill to teach
      // OR for testing MVP, let's just return everyone except those with no course_tag
      // Actually, returning everyone is fine so users can find each other easily right now
    }

    queryStr += ` ORDER BY "averageRating" DESC LIMIT 50`;

    const { rows } = await query(queryStr, params);
    
    return res.json({ users: rows, skillName: skill === 'all' ? 'All Skills' : skill });
  } catch (err) {
    console.error('[User] getTeachers error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch teachers.' });
  }
}

/**
 * PUT /api/users/profile  (protected)
 * Update the authenticated user's name, bio, and/or avatar_url.
 */
export async function updateProfile(req, res) {
  try {
    const { name, bio, avatar_url } = req.body;

    const { rows: [user] } = await query(
      `UPDATE users
       SET name       = COALESCE($1, name),
           bio        = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, name, email, bio, avatar_url, credit_balance, created_at`,
      [name || null, bio ?? null, avatar_url ?? null, req.user.id],
    );

    return res.json({ user });
  } catch (err) {
    console.error('[User] updateProfile error:', err.message);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

/**
 * GET /api/users/leaderboard
 * Top users ranked by completed sessions.
 */
export async function getLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const { rows } = await query(
      `SELECT
         u.id, u.name, u.avatar_url,
         COUNT(s.id)::INT AS sessions_completed,
         COALESCE((SELECT AVG(r.rating)::NUMERIC(3,2) FROM reviews r WHERE r.reviewee_id = u.id), 0) AS avg_rating
       FROM users u
       LEFT JOIN sessions s ON (s.teacher_id = u.id OR s.learner_id = u.id) AND s.status = 'completed'
       GROUP BY u.id
       HAVING COUNT(s.id) > 0
       ORDER BY sessions_completed DESC, avg_rating DESC
       LIMIT $1`,
      [limit],
    );

    return res.json({ leaderboard: rows });
  } catch (err) {
    console.error('[User] getLeaderboard error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
}
