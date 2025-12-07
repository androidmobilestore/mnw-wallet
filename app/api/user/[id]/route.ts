import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    console.log('👤 Loading user:', id)
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallets: true,
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
      console.log('❌ User not found:', id)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', user.cyberLogin)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        cyberLogin: user.cyberLogin,
        tronAddress: user.tronAddress,
        balanceRUB: user.balanceRUB,
        referralCode: user.referralCode,
        referralBalance: user.referralBalance,
        totalDeals: user.totalDeals,
        totalVolume: user.totalVolume,
        isVerified: user.isVerified,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wallets: user.wallets,
        transactions: user.transactions,
        referrals: user.referrals,
        withdrawals: user.withdrawals,
      }
    })
  } catch (error) {
    console.error('❌ Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}