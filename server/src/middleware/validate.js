// ─── Validation Helpers ─────────────────────────────────────
// Lightweight validators used across controllers.
// Return { valid, errors } for consistent error reporting.
// ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check that an email string is well-formed.
 */
export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

/**
 * Check that a string value is present and non-empty after trimming.
 */
export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check that a value is a valid UUID v4 (basic pattern match).
 */
export function isValidUUID(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Validate that all required field names exist in the body object.
 * @param {object} body   Request body
 * @param {string[]} fields  List of required field names
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function requireFields(body, fields) {
  const missing = fields.filter((f) => {
    const val = body[f];
    return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
  });
  return { valid: missing.length === 0, missing };
}

/**
 * Validate a password meets minimum requirements.
 */
export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/**
 * Validate an integer is within a range (inclusive).
 */
export function isInRange(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

/**
 * Validate that a value is one of the allowed enum values.
 */
export function isValidEnum(value, allowed) {
  return allowed.includes(value);
}
