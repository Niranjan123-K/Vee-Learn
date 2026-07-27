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
      `SELECT id, name, email, bio, avatar_url, wallpaper_url, credit_balance, created_at, title, department, education, hourly_rate, languages, custom_availability
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
    const { q, category, experience_level, min_rating, availability, language, sort, limit = 50 } = req.query;
    
    const params = [];
    let paramCount = 1;

    let queryStr = `
      SELECT
        u.id AS _id, u.id, u.name, u.avatar_url, u.bio, u.experience_level, u.credit_balance, u.created_at, u.availability, u.preferred_language,
        COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE reviewee_id = u.id), 0) AS "averageRating",
        (SELECT COUNT(*)::INT FROM sessions WHERE teacher_id = u.id AND status = 'completed') AS "sessionsCompleted",
        (
          SELECT COALESCE(json_agg(json_build_object('name', sk.name, 'category', sk.category)), '[]'::json)
          FROM user_skills usk
          JOIN skills sk ON sk.id = usk.skill_id
          WHERE usk.user_id = u.id AND usk.type = 'teach'
        ) AS skills_offered
      FROM users u
      WHERE u.profile_completed = true
    `;

    // Ensure they have at least one teaching skill
    queryStr += ` AND EXISTS (SELECT 1 FROM user_skills usk WHERE usk.user_id = u.id AND usk.type = 'teach') `;

    // Exclude the current user from the results
    if (req.user && req.user.id) {
      queryStr += ` AND u.id != $${paramCount} `;
      params.push(req.user.id);
      paramCount++;
    }

    if (q) {
      queryStr += ` AND (u.name ILIKE $${paramCount} OR EXISTS (
        SELECT 1 FROM user_skills usq JOIN skills sq ON sq.id = usq.skill_id 
        WHERE usq.user_id = u.id AND usq.type = 'teach' AND (sq.name ILIKE $${paramCount} OR sq.category ILIKE $${paramCount})
      )) `;
      params.push(`%${q}%`);
      paramCount++;
    }

    if (category && category !== 'All') {
      queryStr += ` AND EXISTS (
        SELECT 1 FROM user_skills usc JOIN skills sc ON sc.id = usc.skill_id 
        WHERE usc.user_id = u.id AND usc.type = 'teach' AND sc.category = $${paramCount}
      ) `;
      params.push(category);
      paramCount++;
    }

    if (experience_level && experience_level !== 'all') {
      queryStr += ` AND u.experience_level = $${paramCount} `;
      params.push(experience_level);
      paramCount++;
    }

    if (availability && availability !== 'all') {
      queryStr += ` AND u.availability = $${paramCount} `;
      params.push(availability);
      paramCount++;
    }

    if (language && language !== 'all') {
      queryStr += ` AND u.preferred_language = $${paramCount} `;
      params.push(language);
      paramCount++;
    }

    // Since we can't reference an alias in WHERE clause easily in Postgres without a subquery,
    // we use a HAVING or subquery. Let's wrap the main query if we need min_rating.
    if (min_rating) {
      queryStr = `SELECT * FROM (${queryStr}) AS t WHERE t."averageRating" >= $${paramCount}`;
      params.push(parseFloat(min_rating));
      paramCount++;
    }

    // Sorting
    if (sort === 'rating_desc') {
      queryStr += ` ORDER BY "averageRating" DESC `;
    } else if (sort === 'sessions_desc') {
      queryStr += ` ORDER BY "sessionsCompleted" DESC `;
    } else if (sort === 'newest') {
      queryStr += ` ORDER BY created_at DESC `;
    } else if (sort === 'alpha_asc') {
      queryStr += ` ORDER BY name ASC `;
    } else {
      queryStr += ` ORDER BY "averageRating" DESC `; // Default
    }

    queryStr += ` LIMIT $${paramCount} `;
    params.push(Math.min(parseInt(limit, 10) || 50, 100));

    const { rows } = await query(queryStr, params);
    
    return res.json({ users: rows });
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
    const { name, bio, avatar_url, experience_level, preferred_language, location, availability, title, department, education, hourly_rate, languages, custom_availability } = req.body;

    const { rows: [user] } = await query(
      `UPDATE users
       SET name               = COALESCE($1, name),
           bio                = COALESCE($2, bio),
           avatar_url         = COALESCE($3, avatar_url),
           experience_level   = COALESCE($4, experience_level),
           preferred_language = COALESCE($5, preferred_language),
           location           = COALESCE($6, location),
           availability       = COALESCE($7, availability),
           title              = COALESCE($8, title),
           department         = COALESCE($9, department),
           education          = COALESCE($10, education),
           hourly_rate        = COALESCE($11, hourly_rate),
           languages          = COALESCE($12, languages),
           custom_availability= COALESCE($13, custom_availability)
       WHERE id = $14
       RETURNING id, name, email, bio, avatar_url, credit_balance, experience_level, preferred_language, location, availability, profile_completed, created_at, title, department, education, hourly_rate, languages, custom_availability`,
      [
        name || null, 
        bio ?? null, 
        avatar_url ?? null, 
        experience_level ?? null, 
        preferred_language ?? null, 
        location ?? null, 
        availability ?? null, 
        title ?? null,
        department ?? null,
        education ?? null,
        hourly_rate ?? null,
        languages ?? null,
        custom_availability ?? null,
        req.user.id
      ],
    );

    return res.json({ user });
  } catch (err) {
    console.error('[User] updateProfile error:', err.message);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function uploadDp(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const { rows: [user] } = await query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url`,
      [avatarUrl, req.user.id]
    );
    return res.json({ url: user.avatar_url });
  } catch (err) {
    console.error('[User] uploadDp error:', err.message);
    return res.status(500).json({ error: 'Failed to upload DP.' });
  }
}

export async function uploadWallpaper(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const wallpaperUrl = `/uploads/${req.file.filename}`;
    const { rows: [user] } = await query(
      `UPDATE users SET wallpaper_url = $1 WHERE id = $2 RETURNING wallpaper_url`,
      [wallpaperUrl, req.user.id]
    );
    return res.json({ url: user.wallpaper_url });
  } catch (err) {
    console.error('[User] uploadWallpaper error:', err.message);
    return res.status(500).json({ error: 'Failed to upload wallpaper.' });
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

/**
 * POST /api/users/complete-onboarding
 * Sets profile_completed to true after the wizard is finished.
 */
export async function completeOnboarding(req, res) {
  try {
    const { rows: [user] } = await query(
      `UPDATE users
       SET profile_completed = true
       WHERE id = $1
       RETURNING id, name, email, bio, avatar_url, credit_balance, experience_level, preferred_language, location, availability, profile_completed, created_at`,
      [req.user.id]
    );
    return res.json({ user });
  } catch (err) {
    console.error('[User] completeOnboarding error:', err.message);
    return res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
}
