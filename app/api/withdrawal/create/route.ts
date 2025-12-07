import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
  try {
    const { userId, amount, city, fullName, contactType, contact } = await request.json()
    
    if (!userId || !amount || !city || !fullName || !contact) {
      return NextResponse.json(
        { success: false, error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      )
    }
    
    console.log('💸 Creating withdrawal request...')
    
    // Проверяем пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }
    
    // Проверяем баланс
    if (user.balanceRUB < amount) {
      return NextResponse.json(
        { success: false, error: 'Недостаточно средств на балансе' },
        { status: 400 }
      )
    }
    
    // Генерация токенов (8 символов)
    const token = randomBytes(4).toString('hex').toUpperCase()
    const operatorToken = randomBytes(4).toString('hex').toUpperCase()
    
    // Создаём заявку
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        city,
        fullName,
        contactType,
        contact,
        token,
        operatorToken,
        status: 'pending'
      }
    })
    
    // Вычитаем средства из баланса
    await prisma.user.update({
      where: { id: userId },
      data: {
        balanceRUB: user.balanceRUB - amount
      }
    })
    
    console.log('✅ Withdrawal created:', withdrawal.id)
    
    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        city: withdrawal.city,
        token: withdrawal.token,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error creating withdrawal:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}