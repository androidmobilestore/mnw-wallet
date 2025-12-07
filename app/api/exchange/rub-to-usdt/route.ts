import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'

// Текущий курс обмена
const EXCHANGE_RATE = 80.0 // 1 USDT = 80 RUB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, amount } = body

    console.log('💱 RUB → USDT exchange request:', { userId, amount })

    // Валидация входных данных
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные' },
        { status: 400 }
      )
    }

    // Получаем пользователя с кошельками
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

    // Находим RUB кошелек
    const rubWallet = user.wallets.find(w => w.currency === 'RUB')

    if (!rubWallet) {
      return NextResponse.json(
        { success: false, error: 'RUB кошелек не найден' },
        { status: 404 }
      )
    }

    // Проверяем баланс
    if (rubWallet.balance < amount) {
      return NextResponse.json(
        { success: false, error: `Недостаточно RUB. Доступно: ${rubWallet.balance.toFixed(2)} ₽` },
        { status: 400 }
      )
    }

    // Рассчитываем сумму в USDT
    const usdtAmount = amount / EXCHANGE_RATE

    console.log('📊 Exchange calculation:', {
      rub: amount,
      usdt: usdtAmount,
      rate: EXCHANGE_RATE
    })

    // Списываем RUB с баланса
    await prisma.wallet.update({
      where: { id: rubWallet.id },
      data: { balance: rubWallet.balance - amount }
    })

    console.log('✅ RUB balance updated')

    // Создаем заявку на обмен со статусом PENDING
    // Администратор должен вручную отправить USDT
    const exchange = await prisma.exchange.create({
      data: {
        userId: user.id,
        type: 'RUB_TO_USDT',
        fromAmount: amount,
        fromCurrency: 'RUB',
        toAmount: usdtAmount,
        toCurrency: 'USDT',
        exchangeRate: EXCHANGE_RATE,
        status: 'PENDING', // Ожидает отправки USDT администратором
        destinationAddress: user.tronAddress // Адрес для отправки USDT
      }
    })

    console.log('📝 Exchange request created:', exchange.id)

    // TODO: Отправить уведомление администратору в Telegram
    // Это будет в следующем шаге

    return NextResponse.json({
      success: true,
      exchange: {
        id: exchange.id,
        fromAmount: amount,
        toAmount: usdtAmount,
        rate: EXCHANGE_RATE,
        status: 'PENDING',
        message: 'Заявка создана. Администратор отправит USDT в ближайшее время.'
      }
    })

  } catch (error) {
    console.error('❌ Exchange error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при создании заявки',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}