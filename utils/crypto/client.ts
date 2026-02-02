// utils/crypto/client.ts
// Client unifié pour une utilisation facile
import { CryptoCore } from './core'
import { CryptoStorage } from './storage'
import { CryptoUtils } from './utils'
import { EncryptionOptions, KeyPair, PasswordStrength } from './types'

// utils/crypto/client.ts
export class CryptoClient {
  private core: CryptoCore
  private storage: CryptoStorage

  constructor(config?: any) {
    this.core = new CryptoCore(config)
    this.storage = new CryptoStorage(this.core)
  }

  // Méthodes de cryptage (appel direct)
  encrypt(data: string, key: string, options?: Partial<EncryptionOptions>) {
    return this.core.encrypt(data, key, options)
  }

  decrypt(encryptedData: string, key: string, algorithm: string, iv?: string, salt?: string) {
    return this.core.decrypt(encryptedData, key, algorithm, iv, salt)
  }

  encryptAES256GCM(data: string, key: string, iv?: string) {
    return this.core.encryptAES256GCM(data, key, iv)
  }

  decryptAES256GCM(encryptedData: string, key: string, iv: string) {
    return this.core.decryptAES256GCM(encryptedData, key, iv)
  }

  encryptBCrypt(data: string, saltRounds: number = 12) {
    return this.core.encryptBCrypt(data, saltRounds)
  }

  verifyBCrypt(data: string, hash: string) {
    return this.core.verifyBCrypt(data, hash)
  }

  // Méthodes de stockage
  setItem(key: string, value: any, encryptionKey: string, options?: Partial<EncryptionOptions>) {
    return this.storage.setItem(key, value, encryptionKey, options)
  }

  getItem(key: string, encryptionKey: string) {
    return this.storage.getItem(key, encryptionKey)
  }

  removeItem(key: string) {
    return this.storage.removeItem(key)
  }

  clear() {
    return this.storage.clear()
  }

  // Utilitaires (méthodes statiques)
  generateRandomKey = CryptoUtils.generateRandomKey
  generateIV = CryptoUtils.generateIV
  generateSalt = CryptoUtils.generateSalt
  calculatePasswordStrength = CryptoUtils.calculatePasswordStrength
  generateHash = CryptoUtils.generateHash

  generateKeyPair() {
    return this.core.generateKeyPair()
  }

  async verifyIntegrity(
    encryptedData: string, 
    originalData: string, 
    key: string,
    algorithm: string
  ): Promise<boolean> {
    try {
      const decrypted = await this.decrypt(encryptedData, key, algorithm)
      return decrypted === originalData
    } catch {
      return false
    }
  }

  async migrateAlgorithm(
    encryptedData: string,
    oldKey: string,
    oldAlgorithm: string,
    newKey: string,
    newAlgorithm: string,
    iv?: string
  ): Promise<string> {
    const decrypted = await this.decrypt(encryptedData, oldKey, oldAlgorithm, iv)
    const reencrypted = await this.encrypt(decrypted, newKey, { algorithm: newAlgorithm as any })
    return reencrypted.encrypted
  }
}

// Instance globale par défaut
export const crypto = new CryptoClient()

// Hook React personnalisé
export const useCrypto = () => {
  return {
    crypto: new CryptoClient(),
    encrypt: async (data: string, key: string, options?: EncryptionOptions) => {
      const client = new CryptoClient()
      return client.encrypt(data, key, options)
    },
    decrypt: async (encryptedData: string, key: string, algorithm: string, iv?: string) => {
      const client = new CryptoClient()
      return client.decrypt(encryptedData, key, algorithm, iv)
    }
  }
}