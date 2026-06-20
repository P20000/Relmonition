import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '../crypto';

describe('crypto utilities', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Isolate process.env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encrypt and decrypt', () => {
    it('successfully encrypts and decrypts text', () => {
      process.env.ENCRYPTION_KEY = 'test-secret-encryption-key-for-vitest';
      const plainText = 'super-secret-api-key-1234';
      const cipherText = encrypt(plainText);

      expect(cipherText).toContain(':');
      expect(cipherText.split(':')).toHaveLength(3);

      const decrypted = decrypt(cipherText);
      expect(decrypted).toBe(plainText);
    });

    it('throws decryption error when ciphertext is corrupted/incorrect key is used', () => {
      process.env.ENCRYPTION_KEY = 'key-number-one-is-used-here';
      const cipherText = encrypt('some-data');

      // Change encryption key to simulate a key change without cache eviction or incorrect key loading
      process.env.ENCRYPTION_KEY = 'key-number-two-is-used-here-instead';

      expect(() => decrypt(cipherText)).toThrow(/Decryption failed/);
    });

    it('throws decryption error when secure payload formatting is corrupted', () => {
      process.env.ENCRYPTION_KEY = 'test-secret-encryption-key-for-vitest';
      const badCipherText = 'a1b2c3:d4e5f6'; // only 2 parts

      // In production/staging, invalid format throws
      process.env.NODE_ENV = 'production';
      expect(() => decrypt(badCipherText)).toThrow(/Plaintext credentials are not allowed/);

      // In development, invalid format returns as-is
      process.env.NODE_ENV = 'development';
      expect(decrypt(badCipherText)).toBe(badCipherText);
    });

    it('throws fatal error in production/staging if ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      // Re-importing or calling encrypt/decrypt should throw when key is missing
      expect(() => encrypt('test')).toThrow(/Encryption master key source/);
    });
  });
});
