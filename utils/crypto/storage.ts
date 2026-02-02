// utils/crypto/storage.ts
import { CryptoCore } from './core'
import { EncryptionOptions } from './types'

export class CryptoStorage {
  private crypto: CryptoCore
  private storage: Storage

  constructor(cryptoInstance: CryptoCore, useSessionStorage: boolean = false) {
    this.crypto = cryptoInstance
    
    // Check if we're in a browser environment before accessing storage APIs
    if (typeof window !== 'undefined') {
      this.storage = useSessionStorage ? window.sessionStorage : window.localStorage
    } else {
      // Fallback for non-browser environments
      this.storage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      }
    }
  }

  /**
   * Stocke une donnée cryptée
   */
  async setItem(
    key: string, 
    value: any, 
    encryptionKey: string, 
    options?: Partial<EncryptionOptions>
  ): Promise<void> {
    const dataString = typeof value === 'string' ? value : JSON.stringify(value)
    const encrypted = await this.crypto.encrypt(dataString, encryptionKey, options)
    
    this.storage.setItem(
      `crypto_${key}`, 
      JSON.stringify(encrypted)
    )
  }

  /**
   * Récupère une donnée décryptée
   */
  async getItem(
    key: string, 
    encryptionKey: string
  ): Promise<any> {
    const stored = this.storage.getItem(`crypto_${key}`)
    if (!stored) return null

    try {
      const encryptedData = JSON.parse(stored)
      const decrypted = await this.crypto.decrypt(
        encryptedData.encrypted, 
        encryptionKey, 
        encryptedData.algorithm,
        encryptedData.iv,
        encryptedData.salt
      )

      try {
        return JSON.parse(decrypted)
      } catch {
        return decrypted
      }
    } catch (error) {
      console.error('Erreur de décryptage:', error)
      return null
    }
  }

  /**
   * Supprime une donnée cryptée
   */
  removeItem(key: string): void {
    this.storage.removeItem(`crypto_${key}`)
  }

  /**
   * Vide toutes les données cryptées
   */
  clear(): void {
    const keys = Object.keys(this.storage)
    keys.filter(k => k.startsWith('crypto_'))
        .forEach(k => this.storage.removeItem(k))
  }
}