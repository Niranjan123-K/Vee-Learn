import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ALGORITHM = 'aes-256-gcm';

// Derive a 32-byte key from the JWT_SECRET (or a dedicated GOOGLE_ENCRYPTION_KEY if provided)
const rawKey = process.env.GOOGLE_ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secret-key-for-dev-only';
const ENCRYPTION_KEY = crypto.scryptSync(rawKey, 'salt', 32);

/**
 * Encrypts a sensitive string (e.g., refresh_token)
 */
export function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a sensitive string
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encryption format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[Encryption] Decryption failed:', err.message);
    throw new Error('Failed to decrypt token');
  }
}
