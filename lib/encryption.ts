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

  const key = Buffer.from(encodedKey, 'base64');

  if (
    key.length !== KEY_LENGTH ||
    key.toString('base64') !== encodedKey
  ) {
    throw new Error(
      '[encryption] SEARCH_ENCRYPTION_KEY must be a valid Base64-encoded 32-byte key.'
    );
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
}

/**
 * Decrypts data previously encrypted with encryptData().
 */
export function decryptData(encryptedData: string): string {
  if (typeof encryptedData !== 'string') {
    throw new TypeError('[encryption] Encrypted data must be a string.');
  }

  const parts = encryptedData.split(':');

  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('[encryption] Invalid or unsupported encrypted data format.');
  }

  const [, ivEncoded, authTagEncoded, ciphertextEncoded] = parts;

  const iv = Buffer.from(ivEncoded, 'base64');
  const authTag = Buffer.from(authTagEncoded, 'base64');
  const ciphertext = Buffer.from(ciphertextEncoded, 'base64');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('[encryption] Invalid encrypted data.');
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