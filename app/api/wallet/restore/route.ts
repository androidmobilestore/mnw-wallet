import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import * as bip39 from 'bip39'
import { utils } from 'tronweb'
import { encrypt } from '@/lib/crypto/encryption'
import { generateCyberLogin, generateReferralCode } from '@/lib/crypto/wallet'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mnemonic } = body

    console.log('📥 Received restore request')

    if (!mnemonic) {
      return NextResponse.json(
        { success: false, error: 'Mnemonic is required' },
        { status: 400 }
      )
    }

    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mnemonic phrase' },
        { status: 400 }
      )
    }

    // Generate wallet from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const privateKeyHex = seed.toString('hex').slice(0, 64)
    const address = utils.crypto.getBase58CheckAddress(utils.crypto.getAddressFromPriKey(Buffer.from(privateKeyHex, 'hex')))

    console.log('🔐 Private key generated from mnemonic')
    console.log('✅ Address generated:', address)

    // Check if user already exists with this address
    let user = await prisma.user.findUnique({
      where: { tronAddress: address }
    })

    if (user) {
      console.log('✅ User already exists:', user.cyberLogin)
      return NextResponse.json({
        success: true,
        userId: user.id,
        address: user.tronAddress,
        cyberLogin: user.cyberLogin,
        referralCode: user.referralCode,
        message: 'Wallet restored successfully'
      })
    }

    // Create new user with restored wallet
    const cyberLogin = generateCyberLogin(address)
    const referralCode = generateReferralCode()

    console.log('👤 Cyber login:', cyberLogin)
    console.log('🎟️ Referral code:', referralCode)

    const encryptedPrivateKey = encrypt(privateKeyHex)
    const encryptedMnemonic = encrypt(mnemonic)

    user = await prisma.user.create({
      data: {
        cyberLogin,
        tronAddress: address,
        encryptedPrivateKey,
        encryptedMnemonic,
        referralCode,
        balanceRUB: 0,
        referralBalance: 0,
        totalDeals: 0,
        totalVolume: 0,
        isVerified: false,
      }
    })

    console.log('✅ User created from restored wallet:', user.cyberLogin)

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

    console.log('✅ Wallets created for restored user')

    return NextResponse.json({
      success: true,
      userId: user.id,
      address,
      cyberLogin: user.cyberLogin,
      referralCode: user.referralCode,
      message: 'Wallet restored successfully'
    })

  } catch (error) {
    console.error('❌ Error restoring wallet:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}