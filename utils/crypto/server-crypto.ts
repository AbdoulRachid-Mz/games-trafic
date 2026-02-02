// utils/crypto/server-crypto.ts
// Crypto sécurisé côté SERVEUR uniquement (Node.js)
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class ServerCrypto {
  /**
   * Hash un PIN/mot de passe avec bcrypt (côté serveur)
   */
  static async hashPassword(data: string, saltRounds: number = 12): Promise<string> {
    return await bcrypt.hash(data, saltRounds);
  }

  /**
   * Vérifie un hash bcrypt
   */
  static async verifyPassword(data: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(data, hash);
  }

  /**
   * Génère un hash SHA-256 (pour d'autres usages)
   */
  static generateSHA256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Génère une clé aléatoire sécurisée
   */
  static generateRandomKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Génère un salt aléatoire
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Chiffrement simple AES (pour données sensibles)
   */
  static encryptAES(data: string, key: string): string {
// utils/crypto/server-crypto.ts
    const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.alloc(16, 0));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Déchiffrement AES
   */
  static decryptAES(encrypted: string, key: string): string {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.alloc(16, 0));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Instance globale pour le serveur
export const serverCrypto = new ServerCrypto();