// utils/crypto/utils.ts
import { PasswordStrength } from './types'

export class CryptoUtils {
  /**
   * Génère une clé aléatoire sécurisée
   */
  static generateRandomKey(length: number = 32): string {
    const array = new Uint8Array(length)
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array)
    } else {
      // Fallback pour Node.js ou environnements sans window.crypto
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Génère un IV (Initialization Vector) aléatoire
   */
  static generateIV(length: number = 16): string {
    return this.generateRandomKey(length)
  }

  /**
   * Génère un salt aléatoire
   */
  static generateSalt(length: number = 16): string {
    return this.generateRandomKey(length)
  }

  /**
   * Convertit une string en ArrayBuffer
   */
  static stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder()
    return encoder.encode(str).buffer
  }

  /**
   * Convertit un ArrayBuffer en string
   */
  static arrayBufferToString(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder()
    return decoder.decode(buffer)
  }

  /**
   * Encode en base64
   */
  static base64Encode(data: string): string {
    if (typeof btoa !== 'undefined') {
      return btoa(data)
    }
    // Fallback pour Node.js
    return Buffer.from(data).toString('base64')
  }

  /**
   * Décode une base64
   */
  static base64Decode(data: string): string {
    if (typeof atob !== 'undefined') {
      return atob(data)
    }
    // Fallback pour Node.js
    return Buffer.from(data, 'base64').toString('utf8')
  }

  /**
   * Calcule la force d'un mot de passe
   */
  static calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0
    const feedback: string[] = []

    // Longueur
    if (password.length >= 12) score += 25
    else if (password.length >= 8) score += 15
    else feedback.push('Au moins 8 caractères')

    // Diversité des caractères
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (hasUpper) score += 15
    else feedback.push('Ajoutez des majuscules')
    
    if (hasLower) score += 15
    else feedback.push('Ajoutez des minuscules')
    
    if (hasNumber) score += 15
    else feedback.push('Ajoutez des chiffres')
    
    if (hasSpecial) score += 20
    else feedback.push('Ajoutez des caractères spéciaux')

    // Entropie
    const uniqueChars = new Set(password).size
    score += Math.min(uniqueChars * 2, 20)

    // Détermination de la force
    let strength: PasswordStrength['strength'] = 'very-weak'
    let color = '#ef4444' // red

    if (score >= 80) {
      strength = 'very-strong'
      color = '#22c55e' // green
    } else if (score >= 60) {
      strength = 'strong'
      color = '#84cc16' // lime
    } else if (score >= 40) {
      strength = 'medium'
      color = '#f59e0b' // amber
    } else if (score >= 20) {
      strength = 'weak'
      color = '#f97316' // orange
    }

    return { score, strength, feedback, color }
  }

  /**
   * Vérifie si Web Crypto API est disponible
   */
  static isWebCryptoAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.crypto !== 'undefined' &&
           typeof window.crypto.subtle !== 'undefined'
  }

  /**
   * Génère une empreinte (hash) d'une donnée
   */
  static async generateHash(data: string, algorithm: string = 'SHA-256'): Promise<string> {
    if (!this.isWebCryptoAvailable()) {
      throw new Error('Web Crypto API non disponible')
    }

    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await window.crypto.subtle.digest(algorithm, dataBuffer)
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}