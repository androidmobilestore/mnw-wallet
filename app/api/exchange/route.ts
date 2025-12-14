import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRates } from '@/lib/rates/ratesService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Получить сессию пользователя
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { from, to, fromAmount, toAmount, rate } = await req.json();

    // Валидация
    if (!from || !to || !fromAmount || !toAmount || fromAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Проверка актуальности курса
    const currentRates = getRates();
    // Добавьте логику проверки курса...

    // Проверить баланс пользователя (пример)
    const userWallet = await prisma.wallet.findFirst({
      where: {
        userId: session.user.id,
        currency: from
      }
    });

    if (!userWallet || userWallet.balance < fromAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Выполнить обмен в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Списать from валюту
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: fromAmount } }
      });

      // Найти или создать to кошелёк
      let toWallet = await tx.wallet.findFirst({
        where: {
          userId: session.user.id,
          currency: to
        }
      });

      if (!toWallet) {
        toWallet = await tx.wallet.create({
          data: {
            userId: session.user.id,
            currency: to,
            balance: toAmount
          }
        });
      } else {
        await tx.wallet.update({
          where: { id: toWallet.id },
          data: { balance: { increment: toAmount } }
        });
      }

      // Создать запись транзакции
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'EXCHANGE',
          from,
          to,
          fromAmount,
          toAmount,
          rate,
          status: 'SUCCESS',
          // ... другие поля
        }
      });

      return { transaction, received: toAmount };
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Exchange error:', error);
    return NextResponse.json(
      { error: 'Exchange failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}