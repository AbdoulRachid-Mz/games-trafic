// lib/encryption.ts
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Retrieves and validates the encryption key only when encryption
 * or decryption is actually requested.
 *
 * SEARCH_ENCRYPTION_KEY must contain a Base64-encoded 32-byte key.
 */
function getEncryptionKey(): Buffer {
  const encodedKey = process.env.SEARCH_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error(
      '[encryption] SEARCH_ENCRYPTION_KEY environment variable is required.'
    );
  }

  // Support base64 encoded 32-byte key or 32-char utf8 key
  let key: Buffer;
  try {
    const fromBase64 = Buffer.from(encodedKey, 'base64');
    if (fromBase64.length === KEY_LENGTH) {
      key = fromBase64;
    } else {
      key = Buffer.from(encodedKey.slice(0, 32).padEnd(32, '0'), 'utf8');
    }
  } catch {
    key = Buffer.from(encodedKey.slice(0, 32).padEnd(32, '0'), 'utf8');
  }

  return key;
}

/**
 * Encrypts a string using AES-256-GCM.
 *
 * Format:
 * version:iv:authTag:ciphertext
 */
export function encryptData(data: string): string {
  if (typeof data !== 'string') {
    throw new TypeError('[encryption] Data must be a string.');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      'v1',
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * Decrypts data previously encrypted with encryptData().
 */
export function decryptData(encryptedData: string): string {
  if (typeof encryptedData !== 'string') {
    return '';
  }

  try {
    const parts = encryptedData.split(':');

    // Support v1 format (v1:iv:authTag:ciphertext)
    if (parts.length === 4 && parts[0] === 'v1') {
      const [, ivEncoded, authTagEncoded, ciphertextEncoded] = parts;

      const iv = Buffer.from(ivEncoded, 'base64');
      const authTag = Buffer.from(authTagEncoded, 'base64');
      const ciphertext = Buffer.from(ciphertextEncoded, 'base64');

      if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
        return '';
      }

      const key = getEncryptionKey();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    }

    // Support legacy format (ivHex:authTagHex:encryptedHex)
    if (parts.length === 3) {
      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = getEncryptionKey();

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    return '';
  } catch (error) {
    return '';
  }
}