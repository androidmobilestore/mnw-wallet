export interface ExchangeRate {
  from: string
  to: string
  rate: number
  minAmount: number
  maxAmount: number
}

export class ExchangeService {
  private static rates: ExchangeRate[] = []
  private static lastUpdate: number = 0

  static async fetchRates(): Promise<void> {
    try {
      // Запрашиваем через наш API роут (без CORS проблем)
      const response = await fetch('/api/rates')
      
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      
      const data = await response.json()
      
      this.rates = []
      
      // Парсим данные
      data.forEach((item: any) => {
        // CASHRUB -> USDCTRC20 (Покупка USDT за рубли)
        if (item.from === 'CASHRUB' && item.to === 'USDCTRC20') {
          this.rates.push({
            from: 'RUB',
            to: 'USDT',
            rate: parseFloat(item.out),
            minAmount: item.minamount,
            maxAmount: item.maxamount
          })
        }
        
        // USDCTRC20 -> CASHRUB (Продажа USDT за рубли)
        if (item.from === 'USDCTRC20' && item.to === 'CASHRUB') {
          this.rates.push({
            from: 'USDT',
            to: 'RUB',
            rate: parseFloat(item.out),
            minAmount: item.minamount,
            maxAmount: item.maxamount
          })
        }
        
        // CASHRUB -> TRX (Покупка TRX за рубли)
        if (item.from === 'CASHRUB' && item.to === 'TRX') {
          this.rates.push({
            from: 'RUB',
            to: 'TRX',
            rate: parseFloat(item.out),
            minAmount: item.minamount,
            maxAmount: item.maxamount
          })
        }
        
        // TRX -> CASHRUB (Продажа TRX за рубли)
        if (item.from === 'TRX' && item.to === 'CASHRUB') {
          this.rates.push({
            from: 'TRX',
            to: 'RUB',
            rate: parseFloat(item.out),
            minAmount: item.minamount,
            maxAmount: item.maxamount
          })
        }
      })
      
      this.lastUpdate = Date.now()
      console.log('✅ Курсы успешно обновлены:', this.rates)
    } catch (error) {
      console.error('❌ Ошибка загрузки курсов:', error)
      
      // Устанавливаем демо-курсы на случай ошибки
      this.rates = [
        { from: 'USDT', to: 'RUB', rate: 95.5, minAmount: 1500, maxAmount: 1000000 },
        { from: 'RUB', to: 'USDT', rate: 0.0104, minAmount: 150000, maxAmount: 80000000 },
        { from: 'TRX', to: 'RUB', rate: 22.3, minAmount: 5500, maxAmount: 3300000 },
        { from: 'RUB', to: 'TRX', rate: 0.0448, minAmount: 150000, maxAmount: 80000000 },
      ]
      console.log('⚠️ Используются демо-курсы')
    }
  }

  static getRate(from: string, to: string): ExchangeRate | null {
    return this.rates.find(r => r.from === from && r.to === to) || null
  }

  static shouldUpdate(): boolean {
    return Date.now() - this.lastUpdate > 30000 // 30 секунд
  }

  static async getRates(): Promise<ExchangeRate[]> {
    if (this.rates.length === 0 || this.shouldUpdate()) {
      await this.fetchRates()
    }
    return this.rates
  }

  static calculate(amount: number, from: string, to: string): number {
    const rate = this.getRate(from, to)
    if (!rate) return 0
    
    return amount * rate.rate
  }
}