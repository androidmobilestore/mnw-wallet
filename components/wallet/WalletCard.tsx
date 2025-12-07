'use client'

import { useState, useEffect } from 'react'
import { ArrowDownUp, ArrowUpRight, RefreshCw } from 'lucide-react'
import ExchangeModal from '@/components/modals/ExchangeModal'

interface WalletCardProps {
  user: any
}

export default function WalletCard({ user }: WalletCardProps) {
  const [balances, setBalances] = useState({
    RUB: 0,
    USDT: 0,
    TRX: 0
  })
  const [rates, setRates] = useState({
    USDT_TO_RUB: 80,
    TRX_TO_RUB: 21.5
  })
  const [loading, setLoading] = useState(true)
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadBalances()
      loadRates()
      
      // Обновляем курсы каждые 30 секунд
      const interval = setInterval(loadRates, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadBalances = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/wallet/balance?userId=${user.id}`)
      
      if (!response.ok) {
        console.error('Failed to fetch balances:', response.status)
        setLoading(false)
        return
      }

      const text = await response.text()
      if (!text) {
        console.error('Empty response from server')
        setLoading(false)
        return
      }

      const data = JSON.parse(text)
      
      if (data.success && data.balances) {
        setBalances({
          RUB: data.balances.RUB || 0,
          USDT: data.balances.USDT || 0,
          TRX: data.balances.TRX || 0
        })
      }
    } catch (error) {
      console.error('Error loading balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRates = async () => {
    try {
      const response = await fetch('/api/rates')
      const data = await response.json()
      
      if (data.success) {
        setRates({
          USDT_TO_RUB: data.rates.USDT_TO_RUB,
          TRX_TO_RUB: data.rates.TRX_TO_RUB
        })
      }
    } catch (error) {
      console.error('Error loading rates:', error)
    }
  }

  // Расчёт общего баланса в рублях
  const totalInRUB = 
    balances.RUB + 
    (balances.USDT * rates.USDT_TO_RUB) + 
    (balances.TRX * rates.TRX_TO_RUB)

  return (
    <>
      <div className="bg-gradient-to-br from-moneteum to-moneteum-dark rounded-2xl p-6 relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm">Общий баланс</p>
            <button
              onClick={() => {
                loadBalances()
                loadRates()
              }}
              disabled={loading}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <h2 className="text-white text-4xl font-black mb-6">
            {loading ? '---' : totalInRUB.toFixed(2)} ₽
          </h2>

          {/* Балансы по валютам */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* RUB */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-white/70 text-xs mb-1">₽ RUB</p>
              <p className="text-white text-xl font-bold">
                {loading ? '---' : balances.RUB.toFixed(2)}
              </p>
            </div>

            {/* USDT */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-white/70 text-xs mb-1">$ USDT</p>
              <p className="text-white text-xl font-bold">
                {loading ? '---' : balances.USDT.toFixed(2)}
              </p>
              <p className="text-white/50 text-xs mt-1">
                ≈ {(balances.USDT * rates.USDT_TO_RUB).toFixed(2)} ₽
              </p>
            </div>

            {/* TRX */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-white/70 text-xs mb-1">□ TRX</p>
              <p className="text-white text-xl font-bold">
                {loading ? '---' : balances.TRX.toFixed(2)}
              </p>
              <p className="text-white/50 text-xs mt-1">
                ≈ {(balances.TRX * rates.TRX_TO_RUB).toFixed(2)} ₽
              </p>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setExchangeModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ArrowDownUp size={20} />
              Обменять
            </button>

            <button className="bg-white hover:bg-white/90 text-moneteum py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              Пополнить
              <ArrowUpRight size={20} />
            </button>
          </div>

          {/* TRON адрес */}
          <div>
            <p className="text-white/70 text-xs mb-2">TRON адрес:</p>
            <div className="relative">
              <input
                readOnly
                value={user?.tronAddress || ''}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-sm cursor-pointer select-all focus:outline-none focus:border-white/40"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => {
                  if (user?.tronAddress) {
                    navigator.clipboard.writeText(user.tronAddress)
                    alert('✅ Адрес скопирован!')
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
                aria-label="Копировать адрес"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно обмена */}
      {exchangeModalOpen && (
        <ExchangeModal
          onClose={() => setExchangeModalOpen(false)}
          userId={user.id}
          usdtBalance={balances.USDT}
          rubBalance={balances.RUB}
          currentRate={rates.USDT_TO_RUB}
        />
      )}
    </>
  )
}