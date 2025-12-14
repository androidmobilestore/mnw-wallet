import { decrypt } from '@/lib/crypto/encryption'
import { prisma } from '@/lib/prisma/db'

async function testDecrypt() {
  try {
    // Get the newly created user
    const user = await prisma.user.findFirst({
      where: {
        telegramId: 'test_user_123'
      },
      select: {
        encryptedPrivateKey: true
      }
    })

    if (!user) {
      console.log('User not found')
      return
    }

    console.log('Encrypted private key:', user.encryptedPrivateKey)
    
    // Try to decrypt
    const decrypted = decrypt(user.encryptedPrivateKey)
    console.log('Decrypted private key:', decrypted)
  } catch (error) {
    console.log('Decryption failed:', error)
  }
}

testDecrypt()