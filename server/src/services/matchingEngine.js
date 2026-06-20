// ─── Matching Engine ────────────────────────────────────────
// Finds and ranks teachers for a given skill using a weighted
// composite score of rating, experience, and profile quality.
// ─────────────────────────────────────────────────────────────

import { query } from '../config/db.js';

/**
 * Find users who teach `skillId`, excluding `excludeUserId`.
 *
 * Ranking formula (0-100 scale):
 *   score = (avg_rating / 5 * 40) + (min(total_sessions, 50) / 50 * 30) + (profile_completeness * 30)
 *
 * Profile completeness heuristic:
 *   +0.4 if bio is non-empty
 *   +0.3 if avatar_url is non-empty
 *   +0.3 if they have ≥ 2 teaching skills
 *
 * Returns the top 20 results.
 */
export async function findTeachersForSkill(skillId, excludeUserId) {
  const sql = `
    WITH teacher_stats AS (
      SELECT
        u.id,
        u.name,
        u.email,
        u.bio,
        u.avatar_url,
        u.credit_balance,
        us.proficiency,
        us.description AS skill_description,
        -- Average rating (default 0 when no reviews yet)
        COALESCE(
          (SELECT AVG(r.rating)::NUMERIC(3,2) FROM reviews r WHERE r.reviewee_id = u.id),
          0
        ) AS avg_rating,
        -- Total completed sessions as teacher
        (SELECT COUNT(*) FROM sessions s
         WHERE s.teacher_id = u.id AND s.status = 'completed')::INT AS total_sessions,
        -- Profile completeness components
        CASE WHEN u.bio IS NOT NULL AND u.bio != '' THEN 0.4 ELSE 0 END +
        CASE WHEN u.avatar_url IS NOT NULL AND u.avatar_url != '' THEN 0.3 ELSE 0 END +
        CASE WHEN (SELECT COUNT(*) FROM user_skills us2
                    WHERE us2.user_id = u.id AND us2.type = 'teach') >= 2
             THEN 0.3 ELSE 0 END
        AS profile_completeness
      FROM users u
      JOIN user_skills us ON us.user_id = u.id
      WHERE us.skill_id = $1
        AND us.type = 'teach'
        AND u.id != $2
    )
    SELECT *,
      (
        (avg_rating / 5.0 * 40) +
        (LEAST(total_sessions, 50)::NUMERIC / 50.0 * 30) +
        (profile_completeness * 30)
      ) AS match_score
    FROM teacher_stats
    ORDER BY match_score DESC
    LIMIT 20
  `;

  const { rows } = await query(sql, [skillId, excludeUserId]);
  return rows;
}
