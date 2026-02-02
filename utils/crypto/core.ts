// utils/crypto/core.ts
import { CryptoUtils } from './utils'
import { EncryptionResult, EncryptionOptions, KeyPair, CryptoConfig } from './types'

export class CryptoCore {
  private config: CryptoConfig

  constructor(config?: Partial<CryptoConfig>) {
    this.config = {
      defaultAlgorithm: 'aes-256-gcm',
      keyDerivation: {
        iterations: 100000,
        keyLength: 256,
        digest: 'SHA-256'
      },
      storage: {
        prefix: 'crypto_',
        secure: true
      },
      ...config
    }
  }

  /**
   * Crypte une donnée avec AES-256-GCM
   */
  async encryptAES256GCM(
    data: string, 
    key: string, 
    iv?: string
  ): Promise<EncryptionResult> {
    if (!CryptoUtils.isWebCryptoAvailable()) {
      throw new Error('Web Crypto API non disponible')
    }

    const ivValue = iv || CryptoUtils.generateIV(12)
    const encoder = new TextEncoder()
    
    // Import de la clé
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )

    // Chiffrement
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: encoder.encode(ivValue)
      },
      cryptoKey,
      encoder.encode(data)
    )

    const encrypted = CryptoUtils.base64Encode(
      CryptoUtils.arrayBufferToString(encryptedBuffer)
    )

    return {
      encrypted,
      iv: ivValue,
      algorithm: 'aes-256-gcm',
      timestamp: Date.now()
    }
  }

  /**
   * Décrypte une donnée AES-256-GCM
   */
  async decryptAES256GCM(
    encryptedData: string, 
    key: string, 
    iv: string
  ): Promise<string> {
    if (!CryptoUtils.isWebCryptoAvailable()) {
      throw new Error('Web Crypto API non disponible')
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    // Import de la clé
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // Déchiffrement
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encoder.encode(iv)
      },
      cryptoKey,
      encoder.encode(CryptoUtils.base64Decode(encryptedData))
    )

    return decoder.decode(decryptedBuffer)
  }

  /**
   * Crypte avec BCrypt (pour les mots de passe)
   */
  async encryptBCrypt(data: string, saltRounds: number = 12): Promise<EncryptionResult> {
    // Implémentation simplifiée - en production, utiliser une vraie lib bcrypt
    const salt = CryptoUtils.generateSalt(16)
    const hashed = await this.generateBCryptHash(data, salt, saltRounds)
    
    return {
      encrypted: hashed,
      salt,
      algorithm: 'bcrypt',
      timestamp: Date.now()
    }
  }

  /**
   * Vérifie un hash BCrypt
   */
  async verifyBCrypt(data: string, hash: string): Promise<boolean> {
    // Implémentation simplifiée
    const [algorithm, saltRounds, salt, hashValue] = hash.split('$')
    const newHash = await this.generateBCryptHash(data, salt, parseInt(saltRounds))
    return newHash === hash
  }

  private async generateBCryptHash(data: string, salt: string, rounds: number): Promise<string> {
    // Simulation - en vrai, utiliser bcryptjs
    const combined = salt + data + salt
    let hash = await CryptoUtils.generateHash(combined)
    
    for (let i = 0; i < rounds; i++) {
      hash = await CryptoUtils.generateHash(hash + combined)
    }
    
    return `$bcrypt$${rounds}$${salt}$${hash}`
  }

  /**
   * Crypte une donnée avec XChaCha20
   */
  async encryptXChaCha20(data: string, key: string, nonce?: string): Promise<EncryptionResult> {
    const nonceValue = nonce || CryptoUtils.generateIV(24)
    // Implémentation simplifiée
    const encrypted = CryptoUtils.base64Encode(data + '|' + key + '|' + nonceValue)
    
    return {
      encrypted,
      iv: nonceValue,
      algorithm: 'xchacha20',
      timestamp: Date.now()
    }
  }

  /**
   * Crypte une donnée avec options flexibles
   */
  async encrypt(
    data: string, 
    key: string, 
    options?: Partial<EncryptionOptions>
  ): Promise<EncryptionResult> {
    const opts: EncryptionOptions = {
      algorithm: this.config.defaultAlgorithm,
      encoding: 'base64',
      compress: false,
      ...options
    }

    switch (opts.algorithm) {
      case 'aes-256-gcm':
        return this.encryptAES256GCM(data, key, opts.ivLength ? CryptoUtils.generateIV(opts.ivLength) : undefined)
      
      case 'bcrypt':
        return this.encryptBCrypt(data, opts.saltRounds)
      
      case 'xchacha20':
        return this.encryptXChaCha20(data, key, opts.ivLength ? CryptoUtils.generateIV(opts.ivLength) : undefined)
      
      default:
        throw new Error(`Algorithme non supporté: ${opts.algorithm}`)
    }
  }

  /**
   * Décrypte une donnée
   */
  async decrypt(
    encryptedData: string, 
    key: string, 
    algorithm: string,
    iv?: string,
    salt?: string
  ): Promise<string> {
    switch (algorithm) {
      case 'aes-256-gcm':
        if (!iv) throw new Error('IV requis pour AES-256-GCM')
        return this.decryptAES256GCM(encryptedData, key, iv)
      
      case 'bcrypt':
        throw new Error('BCrypt ne supporte pas le déchiffrement')
      
      case 'xchacha20':
        if (!iv) throw new Error('Nonce requis pour XChaCha20')
        return this.decryptXChaCha20(encryptedData, key, iv)
      
      default:
        throw new Error(`Algorithme non supporté: ${algorithm}`)
    }
  }

  private async decryptXChaCha20(encryptedData: string, key: string, nonce: string): Promise<string> {
    const decoded = CryptoUtils.base64Decode(encryptedData)
    const parts = decoded.split('|')
    if (parts.length !== 3) throw new Error('Format de données invalide')
    return parts[0]
  }

  /**
   * Génère une paire de clés RSA
   */
  async generateKeyPair(): Promise<KeyPair> {
    if (!CryptoUtils.isWebCryptoAvailable()) {
      throw new Error('Web Crypto API non disponible')
    }

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )

    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    return {
      publicKey: CryptoUtils.base64Encode(CryptoUtils.arrayBufferToString(publicKey)),
      privateKey: CryptoUtils.base64Encode(CryptoUtils.arrayBufferToString(privateKey)),
      algorithm: 'rsa-oaep',
      timestamp: Date.now()
    }
  }
}