'use client'

import { useState, useEffect } from 'react'
import { ArrowDownUp, ArrowUpRight, ArrowDownLeft, RefreshCw, Send } from 'lucide-react'
import { useBalanceUpdate } from '@/contexts/BalanceUpdateContext'
import ExchangeModal from '@/components/modals/ExchangeModal'
import ReceiveModal from '@/components/modals/ReceiveModal'
import UnifiedSendModal from '@/components/modals/UnifiedSendModal'

interface User {
  id: string
  tronAddress: string
  cyberLogin: string
  encryptedPrivateKey?: string
}

interface WalletCardProps {
  user: User
}

export default function WalletCard({ user }: WalletCardProps) {
  const [balances, setBalances] = useState({
    RUB: 0,
    USDT: 0,
    TRX: 0
  })
  const [rates, setRates] = useState({
    USDT_TO_RUB: 80,
    RUB_TO_USDT: 0.0125,
    TRX_TO_RUB: 21.5
  })
  const [loading, setLoading] = useState(true)
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const { lastBalanceUpdate } = useBalanceUpdate()

  useEffect(() => {
    if (user?.id) {
      loadBalances()
      loadRates()
      
      // Обновляем балансы и курсы каждые 30 секунд
      const interval = setInterval(() => {
        loadBalances()
        loadRates()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user, lastBalanceUpdate])

  const loadBalances = async () => {
    // Only show loading indicator for initial load
    const isFirstLoad = loading;
    if (isFirstLoad) {
      setLoading(true);
    }
    
    try {
      const response = await fetch(`/api/wallet/balance?userId=${user.id}`)
      
      if (!response.ok) {
        console.error('Failed to fetch balances:', response.status)
        if (isFirstLoad) {
          setLoading(false);
        }
        return
      }

      const text = await response.text()
      if (!text) {
        console.error('Empty response from server')
        if (isFirstLoad) {
          setLoading(false);
        }
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
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  }

  const loadRates = async () => {
    try {
      const response = await fetch('/api/rates')
      const data = await response.json()
      
      if (data.success) {
        setRates({
          USDT_TO_RUB: data.rates.USDT_TO_RUB,
          RUB_TO_USDT: data.rates.RUB_TO_USDT,
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
      <div className="bg-white border border-moneteum/20 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-moneteum/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-moneteum/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-moneteum/80 text-sm font-medium">Общий баланс</p>
            <button
              onClick={() => {
                loadBalances()
                loadRates()
              }}
              disabled={loading}
              className="w-8 h-8 bg-moneteum/10 hover:bg-moneteum/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-moneteum' : 'text-moneteum'} />
            </button>
          </div>

          <h2 className="text-moneteum text-4xl font-black mb-6">
            {loading ? '---' : totalInRUB.toFixed(2)} ₽
          </h2>

          {/* Балансы по валютам */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* RUB */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">₽</span>
                </div>
                <p className="text-gray-600 text-sm font-semibold">RUB</p>
              </div>
              <p className="text-gray-900 text-xl font-bold">
                {loading ? '---' : balances.RUB.toFixed(2)}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                ≈ {(balances.RUB * rates.RUB_TO_USDT).toFixed(2)} $
              </p>
            </div>

            {/* USDT */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <p className="text-gray-600 text-sm font-semibold">USDT</p>
              </div>
              <p className="text-gray-900 text-xl font-bold">
                {loading ? '---' : balances.USDT.toFixed(2)}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                ≈ {(balances.USDT * rates.USDT_TO_RUB).toFixed(2)} ₽
              </p>
            </div>

            {/* TRX */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <p className="text-gray-600 text-sm font-semibold">TRX</p>
              </div>
              <p className="text-gray-900 text-xl font-bold">
                {loading ? '---' : balances.TRX.toFixed(2)}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                ≈ {(balances.TRX * rates.TRX_TO_RUB).toFixed(2)} ₽
              </p>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setExchangeModalOpen(true)}
              className="bg-moneteum/10 hover:bg-moneteum/20 border border-moneteum/20 text-moneteum py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ArrowDownUp size={20} />
              Обменять
            </button>

            <button
              onClick={() => setReceiveModalOpen(true)}
              className="bg-moneteum hover:bg-moneteum-dark text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              Пополнить
              <ArrowUpRight size={20} />
            </button>
          </div>

          {/* Кнопки отправки */}
          <div className="mb-6">
            <button
              onClick={() => setSendModalOpen(true)}
              className="w-full bg-gray-800 hover:bg-black text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              Отправить средства
              <Send size={20} />
            </button>
          </div>

          {/* TRON адрес */}
          <div>
            <p className="text-gray-500 text-xs mb-2">TRON адрес:</p>
            <div className="relative">
              <input
                readOnly
                value={user?.tronAddress || ''}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono text-sm cursor-pointer select-all focus:outline-none focus:border-moneteum focus:ring-1 focus:ring-moneteum"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => {
                  if (user?.tronAddress) {
                    navigator.clipboard.writeText(user.tronAddress)
                    alert('✅ Адрес скопирован!')
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-moneteum transition"
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
          isOpen={exchangeModalOpen}
          onClose={() => setExchangeModalOpen(false)}
          userBalance={{
            USDT: balances.USDT,
            TRX: balances.TRX,
            RUB: balances.RUB
          }}
        />
      )}
      
      {/* Модальное окно пополнения */}
      {receiveModalOpen && (
        <ReceiveModal
          isOpen={receiveModalOpen}
          onClose={() => setReceiveModalOpen(false)}
          currency="TRX"
          address={user?.tronAddress || ''}
          cyberLogin={user?.cyberLogin || ''}
        />
      )}
      
      {/* Модальное окно отправки */}
      {sendModalOpen && (
        <UnifiedSendModal
          isOpen={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
          user={user}
          balances={balances}
        />
      )}
    </>
  )
}