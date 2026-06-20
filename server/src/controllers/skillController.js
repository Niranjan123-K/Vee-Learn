// ─── Skill Controller ───────────────────────────────────────
import { query } from '../config/db.js';
import { isValidUUID, isValidEnum, requireFields } from '../middleware/validate.js';

/**
 * GET /api/skills
 * Return all skills grouped by category.
 */
export async function getAllSkills(req, res) {
  try {
    const { rows } = await query('SELECT id, name, category FROM skills ORDER BY category, name');

    // Group into { category: [skills] }
    const grouped = {};
    for (const skill of rows) {
      if (!grouped[skill.category]) grouped[skill.category] = [];
      grouped[skill.category].push({ id: skill.id, name: skill.name });
    }

    return res.json({ skills: grouped, all: rows });
  } catch (err) {
    console.error('[Skill] getAllSkills error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch skills.' });
  }
}

/**
 * POST /api/skills/user-skills  (protected)
 * Add a skill to the authenticated user's profile.
 * Body: { skill_id, type, proficiency?, description? }
 */
export async function addUserSkill(req, res) {
  try {
    const { skill_id, type, proficiency, description } = req.body;

    const { valid, missing } = requireFields(req.body, ['skill_id', 'type']);
    if (!valid) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (!isValidUUID(skill_id)) {
      return res.status(400).json({ error: 'Invalid skill_id.' });
    }
    if (!isValidEnum(type, ['teach', 'learn'])) {
      return res.status(400).json({ error: "type must be 'teach' or 'learn'." });
    }
    if (proficiency && !isValidEnum(proficiency, ['beginner', 'intermediate', 'expert'])) {
      return res.status(400).json({ error: "proficiency must be 'beginner', 'intermediate', or 'expert'." });
    }

    // Verify skill exists
    const skillCheck = await query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skillCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found.' });
    }

    const { rows: [userSkill] } = await query(
      `INSERT INTO user_skills (user_id, skill_id, type, proficiency, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, skill_id, type) DO UPDATE
       SET proficiency = EXCLUDED.proficiency,
           description = EXCLUDED.description
       RETURNING *`,
      [
        req.user.id,
        skill_id,
        type,
        proficiency || 'beginner',
        description || '',
      ],
    );

    // Join with skill info for richer response
    const { rows: [enriched] } = await query(
      `SELECT us.*, s.name AS skill_name, s.category
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.id = $1`,
      [userSkill.id],
    );

    return res.status(201).json({ userSkill: enriched });
  } catch (err) {
    console.error('[Skill] addUserSkill error:', err.message);
    return res.status(500).json({ error: 'Failed to add skill.' });
  }
}

/**
 * DELETE /api/skills/user-skills/:id  (protected)
 * Remove a skill from the authenticated user's profile.
 */
export async function removeUserSkill(req, res) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid user_skill ID.' });
    }

    const result = await query(
      'DELETE FROM user_skills WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User skill not found or not yours.' });
    }

    return res.json({ message: 'Skill removed.' });
  } catch (err) {
    console.error('[Skill] removeUserSkill error:', err.message);
    return res.status(500).json({ error: 'Failed to remove skill.' });
  }
}

/**
 * GET /api/skills/user/:userId
 * Get all skills for a specific user.
 */
export async function getUserSkills(req, res) {
  try {
    const { userId } = req.params;
    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const { rows } = await query(
      `SELECT us.id, us.type, us.proficiency, us.description,
              s.id AS skill_id, s.name AS skill_name, s.category
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1
       ORDER BY us.type, s.category, s.name`,
      [userId],
    );

    return res.json({ skills: rows });
  } catch (err) {
    console.error('[Skill] getUserSkills error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user skills.' });
  }
}
