import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import { decrypt } from '@/lib/crypto/encryption'
import TronWeb from 'tronweb'

export async function POST(request: Request) {
  try {
    const { userId, toAddress, amount } = await request.json()
    
    if (!userId || !toAddress || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    console.log('🚀 Sending TRX...')
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
    
    // Проверка валидности адреса получателя
    if (!tronWeb.isAddress(toAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recipient address' },
        { status: 400 }
      )
    }
    
    // Устанавливаем приватный ключ
    tronWeb.setPrivateKey(privateKey)
    
    // Получаем адрес отправителя
    const fromAddress = tronWeb.address.fromPrivateKey(privateKey)
    console.log('From:', fromAddress)
    
    // Проверяем баланс
    const balance = await tronWeb.trx.getBalance(fromAddress)
    const balanceInTRX = Number(balance) / 1_000_000
    
    console.log('Balance:', balanceInTRX, 'TRX')
    
    if (balanceInTRX < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }
    
    // Конвертируем TRX в Sun (1 TRX = 1,000,000 Sun)
    const amountInSun = tronWeb.toSun(amount)
    
    // Создаём транзакцию
    const transaction = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      amountInSun,
      fromAddress
    )
    
    console.log('📝 Transaction created')
    
    // Подписываем транзакцию
    const signedTransaction = await tronWeb.trx.sign(transaction, privateKey)
    
    console.log('✍️ Transaction signed')
    
    // Отправляем транзакцию
    const result = await tronWeb.trx.sendRawTransaction(signedTransaction)
    
    console.log('📤 Transaction sent:', result.txid)
    
    if (result.result) {
      return NextResponse.json({
        success: true,
        txHash: result.txid,
        message: 'Transaction sent successfully',
        explorerUrl: `https://tronscan.org/#/transaction/${result.txid}`
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message || 'Transaction failed' 
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ Error sending TRX:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'Failed to send transaction' 
      },
      { status: 500 }
    )
  }
}