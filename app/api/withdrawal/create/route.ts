import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { amount, currency, city, fullName, contactType, contact } = body

    // Валидация
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
      where: { email: session.user.email },
      include: { wallets: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
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

    // Проверяем баланс
    if (wallet.balance < amount) {
      return NextResponse.json(
        { success: false, error: 'Недостаточно средств' },
        { status: 400 }
      )
    }

    // Создаем заявку на вывод
    const withdrawal = await prisma.withdrawal.create({
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
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - amount }
    })

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        token: withdrawal.token,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: withdrawal.status,
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