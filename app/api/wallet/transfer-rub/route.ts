import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromUserId, toCyberLogin, amount } = body

    // Валидация
    if (!fromUserId || !toCyberLogin || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Находим отправителя
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      include: { wallets: true }
    })

    if (!fromUser) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      )
    }

    // Находим кошелек отправителя с RUB
    const fromWallet = fromUser.wallets.find(w => w.currency === 'RUB')

    if (!fromWallet) {
      return NextResponse.json(
        { success: false, error: 'Sender RUB wallet not found' },
        { status: 404 }
      )
    }

    // Проверяем баланс
    if (fromWallet.balance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Находим получателя по cyberLogin
    const toUser = await prisma.user.findUnique({
      where: { cyberLogin: toCyberLogin },
      include: { wallets: true }
    })

    if (!toUser) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Находим кошелек получателя с RUB
    let toWallet = toUser.wallets.find(w => w.currency === 'RUB')

    // Если у получателя нет RUB кошелька, создаем его
    if (!toWallet) {
      toWallet = await prisma.wallet.create({
        data: {
          userId: toUser.id,
          currency: 'RUB',
          balance: 0
        }
      })
    }

    // Выполняем перевод
    // 1. Списываем с отправителя
    await prisma.wallet.update({
      where: { id: fromWallet.id },
      data: { balance: fromWallet.balance - amount }
    })

    // 2. Зачисляем получателю
    await prisma.wallet.update({
      where: { id: toWallet.id },
      data: { balance: toWallet.balance + amount }
    })

    // 3. Создаем транзакции
    await prisma.transaction.create({
      data: {
        userId: fromUser.id,
        walletId: fromWallet.id,
        type: 'TRANSFER',
        amount: amount,
        currency: 'RUB',
        status: 'COMPLETED',
        description: `Transfer to ${toUser.cyberLogin}`,
        metadata: JSON.stringify({ toUserId: toUser.id, toCyberLogin: toUser.cyberLogin })
      }
    })

    await prisma.transaction.create({
      data: {
        userId: toUser.id,
        walletId: toWallet.id,
        type: 'TRANSFER',
        amount: amount,
        currency: 'RUB',
        status: 'COMPLETED',
        description: `Transfer from ${fromUser.cyberLogin}`,
        metadata: JSON.stringify({ fromUserId: fromUser.id, fromCyberLogin: fromUser.cyberLogin })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully'
    })

  } catch (error) {
    console.error('Transfer error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}