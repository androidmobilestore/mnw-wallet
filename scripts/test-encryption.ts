import { encrypt, decrypt } from '@/lib/crypto/encryption'

// Test encryption and decryption
const testText = 'This is a test private key'
console.log('Original text:', testText)

const encrypted = encrypt(testText)
console.log('Encrypted:', encrypted)

const decrypted = decrypt(encrypted)
console.log('Decrypted:', decrypted)

console.log('Match:', testText === decrypted)