import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'

// Генерация уникального токена вывода
function generateWithdrawalToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = ''
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, amount, currency, city, fullName, contactType, contact } = body

    // Валидация
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма' },
        { status: 400 }
      )
    }

    if (!city || !fullName || !contactType || !contact) {
      return NextResponse.json(
        { success: false, error: 'Заполните все поля' },
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

    // Проверяем, что вывод только в RUB
    if (currency !== 'RUB') {
      return NextResponse.json(
        { success: false, error: 'Вывод возможен только в RUB' },
        { status: 400 }
      )
    }

    // Находим кошелек с нужной валютой
    const wallet = user.wallets.find(w => w.currency === currency)

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Кошелек не найден' },
        { status: 404 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Проверяем актуальный баланс в транзакции
      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id }
      })

      if (!currentWallet) {
        return { ok: false as const, error: 'Кошелек не найден' }
      }

      if (currentWallet.balance < amount) {
        return { ok: false as const, error: 'Недостаточно средств' }
      }

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          amount,
          currency,
          status: 'PENDING',
          token: generateWithdrawalToken(),
          city,
          fullName,
          contactType,
          contact,
        }
      })

      // Замораживаем средства на балансе
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } }
      })

      return { ok: true as const, withdrawal }
    })

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: result.withdrawal.id,
        token: result.withdrawal.token,
        amount: result.withdrawal.amount,
        currency: result.withdrawal.currency,
        status: result.withdrawal.status,
      }
    })

  } catch (error) {
    console.error('Withdrawal creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}