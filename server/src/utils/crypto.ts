import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getMasterKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-dev-secret-key-12345';
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
 * If the input doesn't match the encrypted format, returns it as-is for legacy fallback.
 */
export const decrypt = (cipherText: string): string => {
  if (!cipherText) return '';
  
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    // Return as-is for legacy fallback compatibility
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
    console.error('[Crypto] Decryption failed, returning plain text if legacy fallback:', error);
    return cipherText;
  }
};
