import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    console.log('🔐 Loading encrypted private key for user:', id)
    
    // Only allow users to get their own private key
    // In a real app, you would verify the session here
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        encryptedPrivateKey: true
      }
    })

    if (!user) {
      console.log('❌ User not found:', id)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ Encrypted private key loaded')
    
    return NextResponse.json({
      success: true,
      encryptedPrivateKey: user.encryptedPrivateKey
    })
  } catch (error) {
    console.error('❌ Error fetching encrypted private key:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}