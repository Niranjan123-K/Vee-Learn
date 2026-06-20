// ─── Match Controller ───────────────────────────────────────
import { findTeachersForSkill } from '../services/matchingEngine.js';
import { isValidUUID } from '../middleware/validate.js';

/**
 * GET /api/match?skill_id=<uuid>  (protected)
 * Find and rank teachers for the requested skill.
 */
export async function findMatches(req, res) {
  try {
    const { skill_id } = req.query;

    if (!skill_id || !isValidUUID(skill_id)) {
      return res.status(400).json({ error: 'Valid skill_id query parameter is required.' });
    }

    const matches = await findTeachersForSkill(skill_id, req.user.id);

    return res.json({ matches });
  } catch (err) {
    console.error('[Match] findMatches error:', err.message);
    return res.status(500).json({ error: 'Failed to find matches.' });
  }
}
