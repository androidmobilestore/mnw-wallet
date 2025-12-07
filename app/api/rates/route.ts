import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Запрашиваем курсы с сервера (server-side, без CORS проблем)
    const response = await fetch('https://xn--e1anbce0ah.xn--p1ai/rates.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store', // Не кешируем, чтобы данные были актуальными
    })

    if (!response.ok) {
      throw new Error('Failed to fetch rates')
    }

    const data = await response.json()

    // Фильтруем только нужные пары для города Нижний Новгород
    const filteredRates = data.filter((item: any) => {
      return item.city === 'nnov' && (
        (item.from === 'CASHRUB' && item.to === 'USDCTRC20') ||
        (item.from === 'USDCTRC20' && item.to === 'CASHRUB') ||
        (item.from === 'CASHRUB' && item.to === 'TRX') ||
        (item.from === 'TRX' && item.to === 'CASHRUB')
      )
    })

    return NextResponse.json(filteredRates)
  } catch (error) {
    console.error('Error fetching rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    )
  }
}