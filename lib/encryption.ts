// lib/encryption.ts
import crypto from 'crypto';

// SEC-11 FIX: Fail fast if the encryption key is missing — never fall back to a
// hardcoded insecure key. Set SEARCH_ENCRYPTION_KEY in your .env file (32+ chars).
if (!process.env.SEARCH_ENCRYPTION_KEY) {
  throw new Error(
    '[encryption] SEARCH_ENCRYPTION_KEY environment variable is required but not set. ' +
    'Please add it to your .env file.'
  );
}

const SECRET_KEY = process.env.SEARCH_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

export function encryptData(data: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY.padEnd(32)), iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(SECRET_KEY.padEnd(32)), 
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}