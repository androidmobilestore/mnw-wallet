import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'

const prismaAny = prisma as any

function getToken(req: NextRequest): string | null {
  const url = new URL(req.url)
  return url.searchParams.get('t')
}

async function validateTokenOrThrow(token: string, resourceType: 'EXCHANGE' | 'WITHDRAWAL', resourceId: string) {
  const link: any = await prismaAny.adminLinkToken.findUnique({
    where: { token },
    include: { admin: true }
  })

  if (!link) {
    throw new Error('Invalid token')
  }

  if (link.resourceType !== resourceType || link.resourceId !== resourceId) {
    throw new Error('Token does not match resource')
  }

  if (link.expiresAt.getTime() < Date.now()) {
    throw new Error('Token expired')
  }

  return link
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = getToken(req)

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 401 })
    }

    await validateTokenOrThrow(token, 'WITHDRAWAL', id)

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, cyberLogin: true, tronAddress: true } },
        wallet: { select: { id: true, currency: true } }
      }
    })

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: 'Withdrawal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, withdrawal })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Unknown error' },
      { status: 400 }
    )
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = getToken(req)

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 401 })
    }

    const link = await validateTokenOrThrow(token, 'WITHDRAWAL', id)

    const body = await req.json()
    const { status, notes } = body

    const updated = await prismaAny.withdrawal.update({
      where: { id },
      data: {
        status: status ?? undefined,
        notes: notes ?? undefined,
        adminId: link.adminId,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    })

    await prismaAny.adminLinkToken.update({
      where: { token },
      data: { usedAt: link.usedAt ?? new Date() }
    })

    return NextResponse.json({ success: true, withdrawal: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Unknown error' },
      { status: 400 }
    )
  }
}
