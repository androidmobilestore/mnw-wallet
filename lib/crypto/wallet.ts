import * as bip39 from 'bip39'
import { randomBytes } from 'crypto'

export function generateMnemonic(): string {
  return bip39.generateMnemonic(128) // 12 слов
}

export function generateCyberLogin(seed: string): string {
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y']
  const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z']

  // Используем seed для детерминированной генерации слова и номера
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const length = 4 + (hash % 3)

  let word = ''
  for (let i = 0; i < length; i++) {
    const pool = i % 2 === 0 ? consonants : vowels
    const idx = (hash + i * 17) % pool.length
    word += pool[idx]
  }

  const number = hash % 10000
  const tag = String(number).padStart(4, '0')

  return `${word}#${tag}`
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