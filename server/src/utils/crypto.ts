import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getMasterKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: Encryption master key source (ENCRYPTION_KEY or JWT_SECRET) is not defined. Set it in your .env file.');
  }
  // Derive a 32-byte (256-bit) key using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts cleartext using AES-256-GCM.
 * Output format is `ivHex:encryptedHex:authTagHex`.
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getMasterKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
};

/**
 * Decrypts cipher text using AES-256-GCM.
 * If the input doesn't match the encrypted format, returns it as-is for legacy fallback in development.
 * Throws an error in production/staging if plaintext credentials are found.
 * Throws an error in all environments if decryption fails.
 */
export const decrypt = (cipherText: string): string => {
  if (!cipherText) return '';
  
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      throw new Error('Decryption failed: Plaintext credentials are not allowed in production/staging.');
    }
    // Return as-is for legacy fallback compatibility in development
    return cipherText;
  }
  
  try {
    const [ivHex, encryptedHex, tagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getMasterKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    throw new Error('Decryption failed: Secure payload was corrupted or encryption key is incorrect.');
  }
};
