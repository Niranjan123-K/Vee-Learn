// ─── Authentication Middleware ───────────────────────────────
// Verifies the JWT from the HttpOnly cookie and attaches
// the decoded payload (id, email, name) to req.user.
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';

/**
 * Express middleware — requires a valid token in cookies.
 * Sends 401 on missing / invalid / expired tokens.
 */
export function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach only the fields downstream code needs.
    req.user = {
      id:    decoded.id,
      email: decoded.email,
      name:  decoded.name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}
