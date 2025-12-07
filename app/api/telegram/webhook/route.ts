import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram/bot'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Обрабатываем обновление от Telegram
    await bot.processUpdate(body)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// Отключаем body parser для webhook
export const config = {
  api: {
    bodyParser: false,
  },
}