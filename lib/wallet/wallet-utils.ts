// @/lib/wallet/wallet-utils.ts - Version SERVEUR uniquement
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // Node.js crypto
import { type User } from '@/database/schema';

export class WalletUtils {
  /**
   * Génère un numéro de carte sécurisé
   */
  static generateSecureCardNumber(): string {
    // Format: 4 groupes de 4 chiffres
    const parts: string[] = [];
    for (let i = 0; i < 4; i++) {
      const part = Math.floor(1000 + Math.random() * 9000).toString();
      parts.push(part);
    }
    return parts.join('');
  }

  /**
   * Hash un PIN de manière sécurisée (bcrypt côté serveur)
   */
  static async hashPin(pin: string): Promise<string> {
    // Valider le PIN
    const validation = this.validatePinStrength(pin);
    if (!validation.isValid) {
      throw new Error(`PIN invalide: ${validation.errors.join(', ')}`);
    }

    // Hash avec bcryptjs (12 tours de sel)
    const saltRounds = 12;
    return await bcrypt.hash(pin, saltRounds);
  }

  /**
   * Vérifie un PIN
   */
  static async verifyPin(pin: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(pin, hash);
    } catch (error) {
      console.error('Erreur vérification PIN:', error);
      return false;
    }
  }

  /**
   * Génère une clé d'encryption unique basée sur l'ID utilisateur
   */
  static generateUserEncryptionKey(userId: string): string {
    const timestamp = Date.now().toString();
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${userId}-${timestamp}-${randomPart}`;
  }

  /**
   * Valide la force d'un PIN
   */
  static validatePinStrength(pin: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];

    if (!pin) {
      errors.push('PIN requis');
    }

    if (pin.length < 4) {
      errors.push('Le PIN doit contenir au moins 4 chiffres');
    }

    if (!/^\d+$/.test(pin)) {
      errors.push('Le PIN ne doit contenir que des chiffres');
    }

    // Éviter les séquences simples
    const sequences = [
      '1234', '4321', '0000', '1111', '2222', '3333',
      '4444', '5555', '6666', '7777', '8888', '9999',
      '0123', '1230', '2345', '3456', '4567', '5678', '6789',
      '9876', '8765', '7654', '6543', '5432', '4321', '3210'
    ];

    if (sequences.includes(pin)) {
      errors.push('Veuillez éviter les séquences trop simples');
    }

    // Éviter les dates de naissance courantes (1900-2024)
    if (/^(19|20)\d{2}$/.test(pin)) {
      const year = parseInt(pin);
      if (year >= 1900 && year <= 2024) {
        errors.push('Évitez d\'utiliser une année de naissance');
      }
    }

    const isValid = errors.length === 0;
    const strength = errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak';

    return { isValid, errors, strength };
  }

  /**
   * Formatte le solde pour l'affichage
   * ⚠️ NOTE: Le solde doit être calculé via getAccountBalance() de ledger-utils
   * Ne jamais utiliser le champ `balance` de userWallets directement
   */
  static formatBalance(balance: string | number, currency: string = 'GTC'): string {
    try {
      const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;

      if (currency === 'GTC') {
        // Format personnalisé pour GTC
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numBalance) + ' GTC';
      }

      // Pour les vraies devises
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numBalance);
    } catch (error) {
      return `${balance} ${currency}`;
    }
  }

  /**
   * Génère un code de vérification sécurisé
   */
  static generateVerificationCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Vérifie si l'utilisateur peut créer un wallet
   */
  static canCreateWallet(user: User): { canCreate: boolean; reason?: string } {
    if (!user) {
      return { canCreate: false, reason: 'Utilisateur non trouvé' };
    }

    if (user.isDeleted) {
      return { canCreate: false, reason: 'Compte désactivé' };
    }

    if (user.banned) {
      return { canCreate: false, reason: 'Compte banni' };
    }

    // Note: On vérifie l'existence du wallet dans l'action serveur

    return { canCreate: true };
  }

  /**
   * Crypte une donnée avec AES (Node.js crypto)
   */
  static encryptAES(data: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key.padEnd(32).slice(0, 32)), iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm
    });
  }

  /**
   * Décrypte une donnée AES
   */
  static decryptAES(encryptedData: string, key: string): string {
    const data = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(
      data.algorithm,
      Buffer.from(key.padEnd(32).slice(0, 32)),
      Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Crypte les données sensibles du wallet
   */
  static async encryptWalletData(data: any, encryptionKey: string): Promise<string> {
    const dataString = JSON.stringify(data);
    return this.encryptAES(dataString, encryptionKey);
  }

  /**
   * Décrypte les données du wallet
   */
  static async decryptWalletData(encryptedData: string, encryptionKey: string): Promise<any> {
    const decrypted = this.decryptAES(encryptedData, encryptionKey);
    return JSON.parse(decrypted);
  }

  /**
   * Génère un salt aléatoire
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Génère un hash SHA256
   */
  static generateSHA256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Célébration côté client uniquement
   */
  static async celebrateWalletCreation(): Promise<void> {
    // Cette fonction doit être appelée uniquement côté client
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Importer dynamiquement confetti pour éviter l'erreur côté serveur
      const { fireConfetti, fireConfettiPreset } = await import('@/utils/confetti');

      await fireConfettiPreset('success');

      setTimeout(async () => {
        await fireConfetti({
          intensity: 'medium',
          angle: 90,
          spread: 80,
          origin: { x: 0.5, y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7'],
          startVelocity: 40,
          gravity: 0.8,
          ticks: 200,
          scalar: 1.3,
        });
      }, 500);
    } catch (error) {
      console.log('Confetti non disponible côté serveur (normal)');
    }
  }

}
