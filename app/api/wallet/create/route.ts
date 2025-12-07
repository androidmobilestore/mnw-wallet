import { NextResponse } from 'next/server'
import * as bip39 from 'bip39'
import createHash from 'create-hash'
import bs58 from 'bs58'
import { prisma } from '@/lib/prisma/db'
import { encrypt } from '@/lib/crypto/encryption'
import { generateCyberLogin, generateReferralCode } from '@/lib/crypto/wallet'

const hdkey = require('hdkey')
const { ec: EC } = require('elliptic')

export async function POST(request: Request) {
  try {
    // Проверяем что запрос содержит body
    let body: any = {}
    
    try {
      const text = await request.text()
      console.log('📥 Received body:', text)
      
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      console.log('⚠️ No body or invalid JSON, using defaults')
    }
    
    const { 
      telegramId = null, 
      username = 'user', 
      firstName = null, 
      lastName = null, 
      referredBy = null 
    } = body
    
    console.log('🚀 Creating wallet for:', { telegramId, username })
    
    // Генерация мнемонической фразы (12 слов)
    const mnemonic = bip39.generateMnemonic(128)
    console.log('🔑 Mnemonic generated')
    
    // Генерация seed
    const seed = await bip39.mnemonicToSeed(mnemonic)
    
    // Генерация приватного ключа
    const root = hdkey.fromMasterSeed(seed)
    const addrNode = root.derive("m/44'/195'/0'/0/0")
    
    if (!addrNode || !addrNode.privateKey) {
      throw new Error('Failed to derive key')
    }
    
    const privateKey = addrNode.privateKey.toString('hex')
    console.log('🔐 Private key generated')
    
    // Генерация публичного ключа
    const ec = new EC('secp256k1')
    const keyPair = ec.keyFromPrivate(privateKey, 'hex')
    const publicKey = keyPair.getPublic().encode('hex', false).slice(2)
    
    // Генерация TRON адреса
    const address = generateTronAddress(publicKey)
    console.log('✅ Address generated:', address)
    
    // Шифруем приватный ключ и мнемонику
    const encryptedPrivateKey = encrypt(privateKey)
    const encryptedMnemonic = encrypt(mnemonic)
    
    // Генерация уникального кибер-логина
    const cyberLogin = generateCyberLogin(address)
    const referralCode = generateReferralCode()
    
    console.log('👤 Cyber login:', cyberLogin)
    console.log('🎟️ Referral code:', referralCode)
    
    // Проверяем существующего пользователя
    let user = null
    
    if (telegramId) {
      user = await prisma.user.findUnique({
        where: { telegramId }
      })
    }
    
    if (!user) {
      // Создаём нового пользователя в БД
      user = await prisma.user.create({
        data: {
          telegramId,
          cyberLogin,
          username,
          firstName,
          lastName,
          tronAddress: address,
          encryptedPrivateKey,
          encryptedMnemonic,
          referralCode,
          referredBy,
          balanceRUB: 0,
          referralBalance: 0,
          totalDeals: 0,
          totalVolume: 0,
          isVerified: false
        }
      })
      
      console.log('💾 User saved to database:', user.id)
      
      // Если есть реферер, создаем связь
      if (referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode: referredBy }
        })
        
        if (referrer) {
          await prisma.referral.create({
            data: {
              userId: referrer.id,
              referredUserId: user.id
            }
          })
          console.log('🎁 Referral link created')
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      mnemonic,
      address,
      privateKey,
      cyberLogin,
      referralCode,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Error creating wallet:', error)
    console.error('Stack:', error.stack)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Функция генерации TRON адреса
function generateTronAddress(publicKey: string): string {
  const hash = createHash('sha3-256').update(Buffer.from(publicKey, 'hex')).digest()
  const addressBytes = hash.slice(-20)
  const addressWithPrefix = Buffer.concat([Buffer.from([0x41]), addressBytes])
  const hash1 = createHash('sha256').update(addressWithPrefix).digest()
  const hash2 = createHash('sha256').update(hash1).digest()
  const checksum = hash2.slice(0, 4)
  const addressWithChecksum = Buffer.concat([addressWithPrefix, checksum])
  return bs58.encode(addressWithChecksum)
}