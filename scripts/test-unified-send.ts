import { decrypt } from '@/lib/crypto/encryption'

// Test the encryption/decryption flow that would be used in the unified send modal
const testEncryptedKey = '7ccd2837513a23581c7209c0255dd474:a44defa648d78d71cc52a81bf96b5f845b806df56cabdb117212965a499df789'
console.log('Encrypted key:', testEncryptedKey)

try {
  const decryptedKey = decrypt(testEncryptedKey)
  console.log('Decrypted key:', decryptedKey)
  console.log('Decryption successful!')
} catch (error) {
  console.error('Decryption failed:', error)
}