import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import { updateBalancesFromBlockchain } from '@/lib/crypto/balanceUpdater'

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

    // Обновляем балансы из блокчейна
    if (user.tronAddress) {
      try {
        const balanceResult = await updateBalancesFromBlockchain(user.tronAddress, userId)
        if (balanceResult !== null) {
          console.log('✅ Balances updated from blockchain')
        } else {
          console.log('⚠️ Balances preserved due to network error')
        }
      } catch (error) {
        console.error('⚠️ Error updating balances from blockchain:', error)
      }
    }

    // Получаем обновленные кошельки
    const updatedWallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { currency: 'asc' }
    })

    // Формируем балансы
    const balances: { [key: string]: number } = {
      RUB: 0,
      USDT: 0,
      TRX: 0
    }

    updatedWallets.forEach((wallet) => {
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