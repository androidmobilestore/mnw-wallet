import * as bip39 from 'bip39'
import { randomBytes } from 'crypto'

export function generateMnemonic(): string {
  return bip39.generateMnemonic(128) // 12 слов
}

export function generateCyberLogin(seed: string): string {
  const prefixes = ['Mega', 'Cyber', 'Crypto', 'Neo', 'Quantum', 'Alpha', 'Beta', 'Ultra', 'Super', 'Hyper']
  const suffixes = ['Tron', 'Wolf', 'Tiger', 'Dragon', 'Phoenix', 'Hawk', 'Lion', 'Eagle', 'Bear', 'Fox']
  
  // Используем seed для генерации индексов
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const prefix = prefixes[hash % prefixes.length]
  const suffix = suffixes[(hash * 7) % suffixes.length]
  const number = 1000 + (hash % 9000)
  
  return `${prefix}${suffix}#${number}`
}

export function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

export function encryptMnemonic(mnemonic: string, password: string): string {
  const buffer = Buffer.from(mnemonic, 'utf-8')
  return buffer.toString('base64')
}

export function decryptMnemonic(encrypted: string, password: string): string {
  const buffer = Buffer.from(encrypted, 'base64')
  return buffer.toString('utf-8')
}