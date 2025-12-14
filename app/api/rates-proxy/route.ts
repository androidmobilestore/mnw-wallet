import { NextResponse } from 'next/server'

const RATES_API_URL = 'https://xn--e1anbce0ah.xn--p1ai/rates.json'

export async function GET() {
  try {
    console.log('📡 Proxying rates request to external API...')
    
    const response = await fetch(RATES_API_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Moneteum/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Добавляем CORS заголовки
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    }

    return NextResponse.json(data, { headers })
  } catch (error) {
    console.error('❌ Error proxying rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  
  return new Response(null, { headers })
}