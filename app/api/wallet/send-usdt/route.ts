import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import { decrypt } from '@/lib/crypto/encryption'
import TronWeb from 'tronweb'

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

export async function POST(request: Request) {
  try {
    const { userId, toAddress, amount } = await request.json()
    
    if (!userId || !toAddress || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    console.log('🚀 Sending USDT...')
    console.log('User ID:', userId)
    console.log('To:', toAddress)
    console.log('Amount:', amount)
    
    // Get user with encrypted private key
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        encryptedPrivateKey: true,
        tronAddress: true
      }
    })
    
    if (!user || !user.encryptedPrivateKey) {
      return NextResponse.json(
        { success: false, error: 'User or private key not found' },
        { status: 404 }
      )
    }
    
    // Decrypt the private key
    const privateKey = decrypt(user.encryptedPrivateKey)
    
    const tronWeb = new (TronWeb as any).TronWeb({
      fullHost: 'https://api.trongrid.io',
    })
    
    // Проверка валидности адреса
    if (!tronWeb.isAddress(toAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recipient address' },
        { status: 400 }
      )
    }
    
    // Устанавливаем приватный ключ
    tronWeb.setPrivateKey(privateKey)
    
    const fromAddress = tronWeb.address.fromPrivateKey(privateKey)
    console.log('From:', fromAddress)
    
    // Получаем контракт USDT
    const contract = await tronWeb.contract().at(USDT_CONTRACT)
    
    // Проверяем баланс USDT
    const balance = await contract.balanceOf(fromAddress).call()
    const balanceInUSDT = Number(balance) / 1_000_000
    
    console.log('USDT Balance:', balanceInUSDT)
    
    if (balanceInUSDT < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient USDT balance' },
        { status: 400 }
      )
    }
    
    // Проверяем баланс TRX для оплаты комиссии (минимум 15 TRX рекомендуется)
    const trxBalance = await tronWeb.trx.getBalance(fromAddress)
    const trxBalanceInTRX = trxBalance / 1_000_000
    
    console.log('TRX Balance for fee:', trxBalanceInTRX)
    
    if (trxBalanceInTRX < 15) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient TRX for transaction fee. Need at least 15 TRX' 
        },
        { status: 400 }
      )
    }
    
    // Конвертируем amount в единицы контракта (USDT имеет 6 decimals)
    const amountInUnits = amount * 1_000_000
    
    console.log('📝 Creating USDT transaction...')
    
    // Отправляем USDT
    const transaction = await contract.transfer(
      toAddress,
      amountInUnits
    ).send({
      feeLimit: 100_000_000, // 100 TRX лимит комиссии
      callValue: 0,
      shouldPollResponse: true // Ждём подтверждения
    })
    
    console.log('✅ USDT transaction sent:', transaction)
    
    return NextResponse.json({
      success: true,
      txHash: transaction,
      message: 'USDT sent successfully',
      explorerUrl: `https://tronscan.org/#/transaction/${transaction}`
    })
    
  } catch (error) {
    console.error('❌ Error sending USDT:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'Failed to send USDT' 
      },
      { status: 500 }
    )
  }
}