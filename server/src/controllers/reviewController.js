// ─── Review Controller ──────────────────────────────────────
import { query } from '../config/db.js';
import { isValidUUID, isInRange, requireFields } from '../middleware/validate.js';

/**
 * POST /api/reviews  (protected)
 * Submit a review for a completed session.
 */
export async function createReview(req, res) {
  try {
    const { session_id, rating, comment } = req.body;

    const { valid, missing } = requireFields(req.body, ['session_id', 'rating']);
    if (!valid) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (!isValidUUID(session_id)) {
      return res.status(400).json({ error: 'Invalid session_id.' });
    }
    if (!isInRange(rating, 1, 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Verify session exists and is completed
    const { rows: [session] } = await query(
      'SELECT * FROM sessions WHERE id = $1',
      [session_id],
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed sessions.' });
    }

    // Verify reviewer is a participant
    const reviewerId = req.user.id;
    if (session.teacher_id !== reviewerId && session.learner_id !== reviewerId) {
      return res.status(403).json({ error: 'You are not a participant of this session.' });
    }

    // The reviewee is the other participant
    const revieweeId = session.teacher_id === reviewerId
      ? session.learner_id
      : session.teacher_id;

    // Check for duplicate review
    const dup = await query(
      'SELECT id FROM reviews WHERE session_id = $1 AND reviewer_id = $2',
      [session_id, reviewerId],
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this session.' });
    }

    const { rows: [review] } = await query(
      `INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [session_id, reviewerId, revieweeId, parseInt(rating, 10), comment || ''],
    );

    return res.status(201).json({ review });
  } catch (err) {
    console.error('[Review] createReview error:', err.message);
    return res.status(500).json({ error: 'Failed to create review.' });
  }
}

/**
 * GET /api/reviews/user/:userId
 * Get all reviews for a user (as the reviewee), with pagination.
 */
export async function getReviewsForUser(req, res) {
  try {
    const { userId } = req.params;
    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const { rows } = await query(
      `SELECT r.*, u.name AS reviewer_name, u.avatar_url AS reviewer_avatar,
              s.scheduled_at, sk.name AS skill_name
       FROM reviews r
       JOIN users u   ON u.id  = r.reviewer_id
       JOIN sessions s ON s.id = r.session_id
       JOIN skills sk ON sk.id = s.skill_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit, 10), offset],
    );

    const { rows: [countRow] } = await query(
      'SELECT COUNT(*)::INT AS total FROM reviews WHERE reviewee_id = $1',
      [userId],
    );

    return res.json({
      reviews: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: countRow.total,
      },
    });
  } catch (err) {
    console.error('[Review] getReviewsForUser error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
}

/**
 * GET /api/reviews/session/:sessionId
 * Get review(s) for a specific session.
 */
export async function getReviewForSession(req, res) {
  try {
    const { sessionId } = req.params;
    if (!isValidUUID(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    const { rows } = await query(
      `SELECT r.*, u.name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.session_id = $1`,
      [sessionId],
    );

    return res.json({ reviews: rows });
  } catch (err) {
    console.error('[Review] getReviewForSession error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
}
