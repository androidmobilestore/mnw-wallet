// Кэш курсов
let cachedRates = {
  USDT_TO_RUB: 80.0,
  RUB_TO_USDT: 0.0125,
  TRX_TO_RUB: 21.5,
  RUB_TO_TRX: 0.0445,
  lastUpdated: Date.now()
}

// URL API курсов
const RATES_API_URL = 'https://xn--e1anbce0ah.xn--p1ai/rates.json'

// Интервал обновления (30 секунд)
const UPDATE_INTERVAL = 30 * 1000

export interface ExchangeRates {
  USDT_TO_RUB: number
  RUB_TO_USDT: number
  TRX_TO_RUB: number
  RUB_TO_TRX: number
  lastUpdated: number
}

// Функция получения курсов из API
async function fetchRates(): Promise<ExchangeRates | null> {
  try {
    console.log('📡 Fetching rates from API...')
    
    // Используем прокси через наш сервер для обхода CORS
    const proxyUrl = 'http://localhost:3000/api/rates-proxy'
    const response = await fetch(proxyUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Ищем нужные курсы для города "nnov"
    const usdtToRubRate = data.find((item: any) => 
      item.from === 'USDCTRC20' && 
      item.to === 'CASHRUB' && 
      item.city === 'nnov'
    )

    const rubToUsdtRate = data.find((item: any) => 
      item.from === 'CASHRUB' && 
      item.to === 'USDCTRC20' && 
      item.city === 'nnov'
    )

    const trxToRubRate = data.find((item: any) => 
      item.from === 'TRX' && 
      item.to === 'CASHRUB' && 
      item.city === 'nnov'
    )

    const rubToTrxRate = data.find((item: any) => 
      item.from === 'CASHRUB' && 
      item.to === 'TRX' && 
      item.city === 'nnov'
    )

    if (!usdtToRubRate || !rubToUsdtRate || !trxToRubRate || !rubToTrxRate) {
      console.warn('⚠️ Some rates not found in API response')
      return null
    }

    const rates: ExchangeRates = {
      USDT_TO_RUB: parseFloat(usdtToRubRate.out),
      RUB_TO_USDT: parseFloat(rubToUsdtRate.out),
      TRX_TO_RUB: parseFloat(trxToRubRate.out),
      RUB_TO_TRX: parseFloat(rubToTrxRate.out),
      lastUpdated: Date.now()
    }

    console.log('✅ Rates fetched successfully:', rates)

    return rates

  } catch (error) {
    console.error('❌ Error fetching rates:', error)
    return null
  }
}

// Обновление кэша курсов
async function updateRatesCache() {
  const rates = await fetchRates()
  
  if (rates) {
    cachedRates = rates
    console.log('💾 Rates cache updated:', new Date().toISOString())
  } else {
    console.warn('⚠️ Using cached rates from:', new Date(cachedRates.lastUpdated).toISOString())
  }
}

// Получение текущих курсов (из кэша)
export function getRates(): ExchangeRates {
  return cachedRates
}

// Запуск автоматического обновления
export function startRatesUpdater() {
  console.log('🔄 Starting rates updater (every 30 seconds)...')
  
  // Обновляем сразу при старте
  updateRatesCache()
  
  // Затем обновляем каждые 30 секунд
  setInterval(updateRatesCache, UPDATE_INTERVAL)
}

// Для принудительного обновления
export async function forceUpdateRates(): Promise<ExchangeRates> {
  await updateRatesCache()
  return cachedRates
}