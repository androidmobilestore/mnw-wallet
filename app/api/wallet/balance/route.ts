import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    
    console.log('📊 Balance request for userId:', userId)
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' }, 
        { status: 400 }
      )
    }

    // Получаем пользователя с кошельками
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { wallets: true } 
    })

    if (!user) {
      console.log('❌ User not found:', userId)
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      )
    }

    // Формируем балансы
    const balances: { [key: string]: number } = {
      RUB: 0,
      USDT: 0,
      TRX: 0
    }

    user.wallets.forEach((wallet) => {
      if (wallet.currency in balances) {
        balances[wallet.currency] = wallet.balance
      }
    })

    console.log('✅ Balances loaded:', balances)

    return NextResponse.json({ 
      success: true, 
      balances 
    })

  } catch (error) {
    console.error('❌ Error in /api/wallet/balance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}