// ─── Auth Controller ────────────────────────────────────────
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { grantBonusCredits } from '../services/creditLedger.js';
import { isValidEmail, isNonEmpty, isValidPassword, requireFields } from '../middleware/validate.js';

/**
 * Generate a signed JWT for the given user.
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' },
  );
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
}

/**
 * POST /api/auth/register
 * Create a new user, grant bonus credits, return JWT + profile.
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // ── Validate ─────────────────────────────────────────
    const { valid, missing } = requireFields(req.body, ['name', 'email', 'password']);
    if (!valid) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!isNonEmpty(name)) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    // ── Check duplicate ──────────────────────────────────
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // ── Course Tag Logic ─────────────────────────────────
    const isEdu = email.toLowerCase().trim().endsWith('.edu');
    const courseTag = isEdu ? 'Student' : 'Guest Campus';

    // ── Create user ──────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows: [user] } = await query(
      `INSERT INTO users (name, email, password_hash, course_tag)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, bio, avatar_url, course_tag, credit_balance, experience_level, preferred_language, location, availability, profile_completed, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, courseTag],
    );

    // ── Grant initial credits ────────────────────────────
    const initialCredits = parseInt(process.env.INITIAL_CREDITS, 10) || 3;
    await grantBonusCredits(user.id, initialCredits, 'Welcome bonus credits');
    user.credit_balance = initialCredits;

    // ── Respond ──────────────────────────────────────────
    const token = signToken(user);
    setTokenCookie(res, token);
    return res.status(201).json({ user });
  } catch (err) {
    console.error('[Auth] register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

/**
 * POST /api/auth/login
 * Validate credentials, return JWT + profile.
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows: [user] } = await query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.bio, u.avatar_url, u.course_tag, u.credit_balance, u.experience_level, u.preferred_language, u.location, u.availability, u.profile_completed, u.created_at,
              CASE WHEN gi.status = 'CONNECTED' AND gi.refresh_token IS NOT NULL THEN true ELSE false END AS "isGoogleConnected"
       FROM users u
       LEFT JOIN google_integrations gi ON u.id = gi.user_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()],
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Strip password_hash before sending
    delete user.password_hash;
    const token = signToken(user);
    setTokenCookie(res, token);
    return res.json({ user });
  } catch (err) {
    console.error('[Auth] login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

/**
 * GET /api/auth/me  (protected)
 * Return the authenticated user's profile.
 */
export async function getMe(req, res) {
  try {
    const { rows: [user] } = await query(
      `SELECT u.id, u.name, u.email, u.bio, u.avatar_url, u.course_tag, u.credit_balance, u.experience_level, u.preferred_language, u.location, u.availability, u.profile_completed, u.created_at,
              CASE WHEN gi.status = 'CONNECTED' AND gi.refresh_token IS NOT NULL THEN true ELSE false END AS "isGoogleConnected"
       FROM users u
       LEFT JOIN google_integrations gi ON u.id = gi.user_id
       WHERE u.id = $1`,
      [req.user.id],
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('[Auth] getMe error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
}

/**
 * POST /api/auth/logout
 * Clear the authentication cookie.
 */
export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ message: 'Logged out successfully.' });
}
