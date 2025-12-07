'use client'

import { useState } from 'react'
import { X, ArrowDownUp, AlertCircle } from 'lucide-react'

interface ExchangeModalProps {
  onClose: () => void
  userId: string
  usdtBalance: number
  rubBalance: number
  currentRate: number
}

export default function ExchangeModal({ 
  onClose, 
  userId, 
  usdtBalance, 
  rubBalance,
  currentRate
}: ExchangeModalProps) {
  const [mode, setMode] = useState<'USDT_TO_RUB' | 'RUB_TO_USDT'>('USDT_TO_RUB')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const EXCHANGE_RATE = currentRate

  const calculateExchange = () => {
    const inputAmount = parseFloat(amount) || 0
    
    if (mode === 'USDT_TO_RUB') {
      return (inputAmount * EXCHANGE_RATE).toFixed(2)
    } else {
      return (inputAmount / EXCHANGE_RATE).toFixed(2)
    }
  }

  const handleExchange = async () => {
    setError('')
    setLoading(true)

    const inputAmount = parseFloat(amount)

    if (!inputAmount || inputAmount <= 0) {
      setError('Введите корректную сумму')
      setLoading(false)
      return
    }

    // Проверка баланса
    if (mode === 'USDT_TO_RUB' && inputAmount > usdtBalance) {
      setError('Недостаточно USDT')
      setLoading(false)
      return
    }

    if (mode === 'RUB_TO_USDT' && inputAmount > rubBalance) {
      setError('Недостаточно RUB')
      setLoading(false)
      return
    }

    try {
      const endpoint = mode === 'USDT_TO_RUB' 
        ? '/api/exchange/usdt-to-rub' 
        : '/api/exchange/rub-to-usdt'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: inputAmount })
      })

      const data = await response.json()

      if (data.success) {
        const fromCurrency = mode === 'USDT_TO_RUB' ? 'USDT' : 'RUB'
        const toCurrency = mode === 'USDT_TO_RUB' ? 'RUB' : 'USDT'
        
        alert(`✅ Обмен выполнен!\n${data.exchange.fromAmount} ${fromCurrency} → ${data.exchange.toAmount} ${toCurrency}`)
        onClose()
        window.location.reload() // Обновить баланс
      } else {
        setError(data.error || 'Ошибка обмена')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <ArrowDownUp size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Обмен валюты
          </h2>
          <p className="text-sm text-gray-500">
            Мгновенный обмен по выгодному курсу
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Переключатель направления обмена */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('USDT_TO_RUB')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'USDT_TO_RUB'
                ? 'bg-moneteum text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            USDT → RUB
          </button>
          <button
            onClick={() => setMode('RUB_TO_USDT')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'RUB_TO_USDT'
                ? 'bg-moneteum text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            RUB → USDT
          </button>
        </div>

        {/* Ввод суммы */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            {mode === 'USDT_TO_RUB' ? 'Отдаёте USDT' : 'Отдаёте RUB'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-moneteum transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {mode === 'USDT_TO_RUB' ? 'USDT' : '₽'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Доступно: {mode === 'USDT_TO_RUB' ? usdtBalance.toFixed(2) + ' USDT' : rubBalance.toFixed(2) + ' ₽'}
          </p>
        </div>

        {/* Результат обмена */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-600 mb-1">Получите</p>
          <p className="text-2xl font-bold text-gray-900">
            {calculateExchange()} {mode === 'USDT_TO_RUB' ? '₽' : 'USDT'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Курс: 1 USDT = {EXCHANGE_RATE.toFixed(2)} RUB
          </p>
        </div>

        <button
          onClick={handleExchange}
          disabled={loading || !amount}
          className="w-full bg-moneteum text-white py-4 rounded-xl font-bold hover:bg-moneteum-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Обмен...' : 'Обменять'}
        </button>
      </div>
    </div>
  )
}