import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAuthUrl, handleCallback } from '../services/google/authService.js';
import { storeRefreshToken } from '../services/google/tokenService.js';

const router = express.Router();

/**
 * GET /api/google/auth-url
 * Protected route that returns the Google OAuth URL for the authenticated user.
 */
router.get('/auth-url', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const url = getAuthUrl(userId);
    res.json({ url });
  } catch (error) {
    console.error('[GoogleAuth] Error generating auth URL:', error.message);
    res.status(500).json({ error: 'Failed to generate Google Auth URL' });
  }
});

/**
 * GET /api/google/callback
 * Handles the redirect back from Google OAuth.
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('[GoogleAuth] OAuth Error:', error);
      return res.redirect('http://localhost:5173/dashboard?google_auth=error');
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    const userId = state; // We passed userId in the state param
    const { tokens, googleEmail } = await handleCallback(code);

    if (tokens.refresh_token) {
      await storeRefreshToken(userId, googleEmail, tokens.refresh_token);
      return res.redirect('http://localhost:5173/dashboard?google_auth=success');
    } else {
      // If we don't get a refresh token, the user might need to revoke access and try again.
      console.warn('[GoogleAuth] No refresh token received.');
      return res.redirect('http://localhost:5173/dashboard?google_auth=no_refresh_token');
    }

  } catch (err) {
    console.error('[GoogleAuth] Callback error:', err.message);
    res.redirect('http://localhost:5173/dashboard?google_auth=error');
  }
});

export default router;
