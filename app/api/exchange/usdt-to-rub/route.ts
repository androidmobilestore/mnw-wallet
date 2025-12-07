import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import TronWeb from 'tronweb'

// Корпоративный кошелек для приема USDT
const CORPORATE_WALLET = 'TRNcQRPDKJHwP6QQTbZYgQHHq45BD9FFsz'

// Текущий курс (позже можно сделать динамический)
const EXCHANGE_RATE = 80.0 // 1 USDT = 80 RUB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, amount } = body

    console.log('💱 Exchange USDT → RUB request:', { userId, amount })

    // Валидация
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные' },
        { status: 400 }
      )
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallets: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Находим USDT кошелек
    const usdtWallet = user.wallets.find(w => w.currency === 'USDT')

    if (!usdtWallet || usdtWallet.balance < amount) {
      return NextResponse.json(
        { success: false, error: 'Недостаточно USDT на балансе' },
        { status: 400 }
      )
    }

    // Рассчитываем сумму в рублях
    const rubAmount = amount * EXCHANGE_RATE

    console.log('📊 Exchange calculation:', {
      usdt: amount,
      rub: rubAmount,
      rate: EXCHANGE_RATE
    })

    // Отправляем USDT на корпоративный кошелек
    const tronWeb = new TronWeb({
      fullHost: 'https://api.trongrid.io'
    })

    // Расшифровываем приватный ключ пользователя (для отправки)
    // ВНИМАНИЕ: В production используйте защищенное хранилище ключей!
    const crypto = await import('crypto')
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32)
    
    const [ivHex, encryptedHex] = user.encryptedPrivateKey.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let privateKey = decipher.update(encryptedHex, 'hex', 'utf8')
    privateKey += decipher.final('utf8')

    // Отправляем USDT
    const contract = await tronWeb.contract().at('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t') // USDT TRC20
    
    const transaction = await contract.transfer(
      CORPORATE_WALLET,
      amount * 1e6 // USDT имеет 6 decimals
    ).send({
      feeLimit: 100_000_000,
      from: user.tronAddress,
      privateKey
    })

    const txid = transaction

    console.log('✅ USDT sent, TXID:', txid)

    // Списываем USDT с баланса пользователя
    await prisma.wallet.update({
      where: { id: usdtWallet.id },
      data: { balance: usdtWallet.balance - amount }
    })

    // Зачисляем RUB пользователю
    const rubWallet = user.wallets.find(w => w.currency === 'RUB')
    
    if (rubWallet) {
      await prisma.wallet.update({
        where: { id: rubWallet.id },
        data: { balance: rubWallet.balance + rubAmount }
      })
    }

    // Создаем запись обмена
    const exchange = await prisma.exchange.create({
      data: {
        userId: user.id,
        type: 'USDT_TO_RUB',
        fromAmount: amount,
        fromCurrency: 'USDT',
        toAmount: rubAmount,
        toCurrency: 'RUB',
        exchangeRate: EXCHANGE_RATE,
        status: 'PENDING_APPROVAL',
        txid
      }
    })

    console.log('📝 Exchange record created:', exchange.id)

    // TODO: Отправить уведомление администратору в Telegram

    return NextResponse.json({
      success: true,
      exchange: {
        id: exchange.id,
        fromAmount: amount,
        toAmount: rubAmount,
        rate: EXCHANGE_RATE,
        txid
      }
    })

  } catch (error) {
    console.error('❌ Exchange error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при обмене',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}