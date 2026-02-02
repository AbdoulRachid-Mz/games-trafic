// utils/crypto/types.ts
export interface EncryptionResult {
  encrypted: string
  iv?: string
  salt?: string
  algorithm: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface EncryptionOptions {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'bcrypt' | 'rsa-oaep' | 'xchacha20'
  keyLength?: number
  ivLength?: number
  saltRounds?: number
  encoding?: 'base64' | 'hex' | 'utf8'
  compress?: boolean
  metadata?: Record<string, any>
}

export interface KeyPair {
  publicKey: string
  privateKey: string
  algorithm: string
  timestamp: number
}

export interface CryptoConfig {
  defaultAlgorithm: EncryptionOptions['algorithm']
  keyDerivation: {
    iterations: number
    keyLength: number
    digest: string
  }
  storage: {
    prefix: string
    secure: boolean
  }
}

export interface PasswordStrength {
  score: number
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'
  feedback: string[]
  color: string
}