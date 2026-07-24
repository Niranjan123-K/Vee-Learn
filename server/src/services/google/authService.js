import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback'
  );
}

/**
 * Generates the Google OAuth authorization URL.
 */
export function getAuthUrl(userId) {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Crucial for receiving a refresh_token
    prompt: 'consent',      // Force consent to ensure refresh_token is always provided
    scope: SCOPES,
    state: userId,          // Pass userId to link the callback to the right user
  });
}

/**
 * Exchanges the auth code for tokens and returns user info.
 */
export async function handleCallback(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  oauth2Client.setCredentials(tokens);
  
  // Fetch user info to get Google email
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  
  return {
    tokens,
    googleEmail: userInfo.data.email,
  };
}
