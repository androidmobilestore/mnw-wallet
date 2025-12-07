import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import TronWeb from 'tronweb'
import crypto from 'crypto'
import * as bip39 from 'bip39'

// Генерация уникального кибер-логина
function generateCyberLogin(): string {
  const adjectives = ['Neo', 'Cyber', 'Quantum', 'Alpha', 'Beta', 'Sigma', 'Omega']
  const nouns = ['Wolf', 'Tiger', 'Eagle', 'Dragon', 'Phoenix', 'Falcon']
  const randomNum = Math.floor(Math.random() * 9999)
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `${adj}${noun}#${randomNum}`
}

// Генерация реферального кода
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

// Шифрование данных
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-32-chars-minimum!', 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { telegramId, username, firstName, lastName, referredBy } = body

    console.log('📥 Received body:', body)
    console.log('🚀 Creating wallet for:', { telegramId, username })

    let user = null
    
    if (telegramId) {
      user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) }
      })
    }

    if (user) {
      console.log('✅ User already exists:', user.cyberLogin)
      return NextResponse.json({
        success: true,
        userId: user.id,
        mnemonic: null,
        address: user.tronAddress,
        privateKey: null,
        cyberLogin: user.cyberLogin,
        referralCode: user.referralCode,
      })
    }

    // ✅ ИСПРАВЛЕНО: Генерируем мнемонику через bip39
    const mnemonic = bip39.generateMnemonic(128) // 12 слов
    console.log('🔑 Mnemonic generated:', mnemonic.split(' ').length, 'words')

    // Создаём TRON кошелек из мнемоники
    const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' })
    
    // Генерируем приватный ключ из мнемоники
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const privateKeyHex = seed.toString('hex').slice(0, 64)
    
    // Создаём адрес из приватного ключа
    const address = tronWeb.address.fromPrivateKey(privateKeyHex)

    console.log('🔐 Private key generated')
    console.log('✅ Address generated:', address)

    const cyberLogin = generateCyberLogin()
    const referralCode = generateReferralCode()

    console.log('👤 Cyber login:', cyberLogin)
    console.log('🎟️ Referral code:', referralCode)

    const encryptedPrivateKey = encrypt(privateKeyHex)
    const encryptedMnemonic = encrypt(mnemonic)

    user = await prisma.user.create({
      data: {
        telegramId: telegramId ? String(telegramId) : null,
        cyberLogin,
        username: username || null,
        firstName: firstName || null,
        lastName: lastName || null,
        tronAddress: address,
        encryptedPrivateKey,
        encryptedMnemonic,
        referralCode,
        referredBy: referredBy || null,
        balanceRUB: 0,
        referralBalance: 0,
        totalDeals: 0,
        totalVolume: 0,
        isVerified: false,
      }
    })

    console.log('✅ User created:', user.cyberLogin)

    const currencies = ['RUB', 'USDT', 'TRX']
    
    for (const currency of currencies) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          currency,
          balance: 0,
          address: currency === 'RUB' ? null : address,
        }
      })
    }

    console.log('✅ Wallets created')

    // ✅ Возвращаем корректную мнемонику
    return NextResponse.json({
      success: true,
      userId: user.id,
      mnemonic,              // ← Теперь не пустая!
      address,
      privateKey: privateKeyHex,
      cyberLogin: user.cyberLogin,
      referralCode: user.referralCode,
    })

  } catch (error) {
    console.error('❌ Error creating wallet:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}