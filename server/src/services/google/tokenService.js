import { query } from '../../config/db.js';
import { encrypt, decrypt } from './encryptionService.js';
import { getOAuth2Client } from './authService.js';

/**
 * Stores a new refresh token securely.
 */
export async function storeRefreshToken(userId, googleEmail, refreshToken) {
  if (!refreshToken) {
    throw new Error('No refresh token provided. Ensure consent prompt is used.');
  }

  const encryptedToken = encrypt(refreshToken);

  // Upsert the integration
  await query(`
    INSERT INTO google_integrations (user_id, google_email, refresh_token, status, updated_at)
    VALUES ($1, $2, $3, 'CONNECTED', NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      google_email = EXCLUDED.google_email,
      refresh_token = EXCLUDED.refresh_token,
      status = 'CONNECTED',
      updated_at = NOW()
  `, [userId, googleEmail, encryptedToken]);
}

/**
 * Fetches the user's refresh token and returns an authenticated OAuth2Client.
 * This implicitly refreshes the access_token if needed when a request is made.
 */
export async function getAuthenticatedClient(userId) {
  const { rows } = await query(
    `SELECT refresh_token, status FROM google_integrations WHERE user_id = $1`,
    [userId]
  );

  if (rows.length === 0 || rows[0].status !== 'CONNECTED' || !rows[0].refresh_token) {
    throw new Error('Google Calendar is not connected or was revoked.');
  }

  const decryptedToken = decrypt(rows[0].refresh_token);
  const oauth2Client = getOAuth2Client();
  
  oauth2Client.setCredentials({
    refresh_token: decryptedToken,
  });
  
  return oauth2Client;
}

/**
 * Revokes Google access in the database.
 */
export async function revokeIntegration(userId) {
  await query(`
    UPDATE google_integrations 
    SET status = 'REVOKED', refresh_token = NULL, updated_at = NOW()
    WHERE user_id = $1
  `, [userId]);
}
