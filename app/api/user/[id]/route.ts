import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import { decrypt } from '@/lib/crypto/encryption'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        referrals: true,
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Расшифровываем приватный ключ для использования
    const privateKey = decrypt(user.encryptedPrivateKey)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        cyberLogin: user.cyberLogin,
        username: user.username,
        tronAddress: user.tronAddress,
        privateKey, // Отправляем для использования в клиенте
        balanceRUB: user.balanceRUB,
        referralCode: user.referralCode,
        referralBalance: user.referralBalance,
        totalDeals: user.totalDeals,
        totalVolume: user.totalVolume,
        isVerified: user.isVerified,
        transactions: user.transactions,
        referrals: user.referrals,
        withdrawals: user.withdrawals
      }
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}