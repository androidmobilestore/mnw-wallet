import { NextResponse } from 'next/server'
import { getRates, forceUpdateRates } from '@/lib/rates/ratesService'

export async function GET() {
  try {
    // Принудительно обновляем курсы при каждом запросе
    const rates = await forceUpdateRates()
    
    return NextResponse.json({
      success: true,
      rates: {
        USDT_TO_RUB: rates.USDT_TO_RUB,
        RUB_TO_USDT: rates.RUB_TO_USDT,
        TRX_TO_RUB: rates.TRX_TO_RUB,
        RUB_TO_TRX: rates.RUB_TO_TRX,
        lastUpdated: rates.lastUpdated
      }
    })
  } catch (error) {
    console.error('Error getting rates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get rates' },
      { status: 500 }
    )
  }
}