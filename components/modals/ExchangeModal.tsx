'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import { ExchangeService } from '@/lib/exchangeService'

interface ExchangeModalProps {
  isOpen: boolean
  onClose: () => void
  balances: {
    TRX: number
    USDT: number
    RUB: number
  }
}

export default function ExchangeModal({ isOpen, onClose, balances }: ExchangeModalProps) {
  const [fromCurrency, setFromCurrency] = useState<'TRX' | 'USDT' | 'RUB'>('USDT')
  const [toCurrency, setToCurrency] = useState<'TRX' | 'USDT' | 'RUB'>('RUB')
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState(0)
  const [rate, setRate] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadRates()
      const interval = setInterval(loadRates, 30000) // Обновление каждые 30 сек
      return () => clearInterval(interval)
    }
  }, [isOpen, fromCurrency, toCurrency])

  useEffect(() => {
    if (amount && rate) {
      const calculated = parseFloat(amount) * rate
      setResult(calculated)
    } else {
      setResult(0)
    }
  }, [amount, rate])

  const loadRates = async () => {
    setLoading(true)
    await ExchangeService.getRates()
    const exchangeRate = ExchangeService.getRate(fromCurrency, toCurrency)
    if (exchangeRate) {
      setRate(exchangeRate.rate)
    }
    setLoading(false)
  }

  const handleExchange = () => {
    setError('')
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Введите сумму')
      return
    }

    const amountNum = parseFloat(amount)
    const balance = balances[fromCurrency]

    if (amountNum > balance) {
      setError('Недостаточно средств')
      return
    }

    // Проверка минимальных сумм
    if (fromCurrency === 'USDT' && toCurrency === 'RUB' && amountNum < 1500) {
      setError('Минимальная сумма продажи USDT: 1500')
      return
    }

    if (fromCurrency === 'RUB' && (toCurrency === 'USDT' || toCurrency === 'TRX') && amountNum < 150000) {
      setError('Минимальная сумма покупки криптовалюты: 150,000 ₽')
      return
    }

    // Здесь логика обмена
    alert(`Обмен ${amount} ${fromCurrency} на ${result.toFixed(2)} ${toCurrency}`)
    onClose()
  }

  const swap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setAmount('')
  }

  if (!isOpen) return null

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
            <RefreshCw size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Обмен валюты
          </h2>
          <p className="text-sm text-gray-500">
            Мгновенный обмен по актуальному курсу
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Курс */}
        <div className="bg-moneteum-light/50 border border-moneteum/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-moneteum" />
              <span className="text-sm font-semibold text-gray-700">Текущий курс</span>
            </div>
            <span className="font-bold text-gray-900">
              1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
            </span>
          </div>
        </div>

        {/* Отдаёте */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Отдаёте
          </label>
          <div className="border border-gray-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-2xl font-bold outline-none flex-1"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as any)}
                className="text-lg font-bold bg-gray-100 px-3 py-1 rounded-lg outline-none"
              >
                <option value="USDT">USDT</option>
                <option value="TRX">TRX</option>
                <option value="RUB">RUB</option>
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Доступно: {balances[fromCurrency].toFixed(2)} {fromCurrency}
            </p>
          </div>
        </div>

        {/* Кнопка обмена */}
        <div className="flex justify-center -my-2 mb-3">
          <button
            onClick={swap}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <RefreshCw size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Получаете */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Получаете
          </label>
          <div className="border-2 border-moneteum rounded-xl p-4 bg-moneteum-light/30">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {result.toFixed(2)}
              </span>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as any)}
                className="text-lg font-bold bg-white px-3 py-1 rounded-lg outline-none"
              >
                <option value="USDT">USDT</option>
                <option value="TRX">TRX</option>
                <option value="RUB">RUB</option>
              </select>
            </div>
          </div>
        </div>

        {/* Минимальные суммы */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6">
          <p className="text-xs text-gray-600 leading-relaxed">
            {fromCurrency === 'RUB' && '💡 Минимальная сумма покупки: 150,000 ₽'}
            {fromCurrency === 'USDT' && toCurrency === 'RUB' && '💡 Минимальная сумма продажи: 1,500 USDT'}
            {fromCurrency === 'TRX' && toCurrency === 'RUB' && '💡 Минимальная сумма продажи: 5,500 TRX'}
          </p>
        </div>

        <button
          onClick={handleExchange}
          disabled={loading}
          className="w-full bg-moneteum text-white py-4 rounded-xl font-bold hover:bg-moneteum-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Обменять'}
        </button>
      </div>
    </div>
  )
}