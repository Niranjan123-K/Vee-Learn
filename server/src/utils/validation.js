/**
 * Validates a Google Meet link against strict criteria.
 * @param {string} link - The meeting link to validate.
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateGoogleMeetLink(link) {
  if (!link || typeof link !== 'string') {
    return { valid: false, error: 'Meeting link is required.' };
  }

  // Check for max length
  if (link.length > 512) {
    return { valid: false, error: 'Meeting link is too long (max 512 characters).' };
  }

  // Check for whitespaces
  if (/\s/.test(link)) {
    return { valid: false, error: 'Meeting link must not contain whitespace.' };
  }

  // Must strictly start with https://meet.google.com/
  if (!link.startsWith('https://meet.google.com/')) {
    return { valid: false, error: 'Link must start with https://meet.google.com/' };
  }

  // Validate URL format
  try {
    new URL(link);
  } catch (error) {
    return { valid: false, error: 'Invalid URL format.' };
  }

  // Additionally check that it has an identifier after the slash
  const identifier = link.slice('https://meet.google.com/'.length);
  if (!identifier) {
    return { valid: false, error: 'Meeting link must contain a meeting ID.' };
  }

  return { valid: true, error: null };
}
