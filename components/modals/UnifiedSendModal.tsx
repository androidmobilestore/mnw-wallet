'use client'

import { useState, useEffect } from 'react'
import { X, Send, AlertCircle, CheckCircle, ExternalLink, Wallet, CreditCard, Coins } from 'lucide-react'

interface UnifiedSendModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    tronAddress: string
    cyberLogin: string
    encryptedPrivateKey?: string
  }
  balances: {
    RUB: number
    USDT: number
    TRX: number
  }
}

export default function UnifiedSendModal({ isOpen, onClose, user, balances }: UnifiedSendModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'TRX' | 'USDT' | 'RUB'>('RUB')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')

  // Reset form when currency changes
  useEffect(() => {
    setRecipient('')
    setAmount('')
    setError('')
  }, [selectedCurrency])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency('RUB')
      setRecipient('')
      setAmount('')
      setError('')
      setSuccess(false)
      setTxHash('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const isCrypto = selectedCurrency === 'TRX' || selectedCurrency === 'USDT'
  const placeholderText = isCrypto
    ? 'TXYZpkJ5QD5GHRUuJPNK9...'
    : 'user#1234'

  const currencyIcons = {
    RUB: <CreditCard className="w-5 h-5" />,
    USDT: <Coins className="w-5 h-5" />,
    TRX: <Wallet className="w-5 h-5" />
  }

  const currencyNames = {
    RUB: 'Рубли',
    USDT: 'USDT',
    TRX: 'TRX'
  }

  const handleSend = async () => {
    setError('')
    
    if (!recipient) {
      setError(isCrypto ? 'Введите адрес кошелька' : 'Введите логин получателя')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Введите сумму')
      return
    }
    
    if (parseFloat(amount) > balances[selectedCurrency]) {
      setError('Недостаточно средств')
      return
    }

    if (isCrypto && !recipient.startsWith('T')) {
      setError('Неверный формат TRON адреса')
      return
    }

    if (!isCrypto && !recipient.includes('#')) {
      setError('Неверный формат ID (например: user#1234)')
      return
    }

    // Send crypto
    if (isCrypto) {
      setLoading(true)
      
      try {
        const endpoint = selectedCurrency === 'TRX' ? '/api/wallet/send-trx' : '/api/wallet/send-usdt'
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            toAddress: recipient,
            amount: parseFloat(amount)
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setSuccess(true)
          setTxHash(data.txHash)
          console.log('✅ Transaction sent:', data.txHash)
          
          // Close modal after 5 seconds
          setTimeout(() => {
            onClose()
            window.location.reload() // Refresh page to update balance
          }, 5000)
        } else {
          setError(data.error || 'Ошибка отправки')
        }
      } catch (err) {
        setError((err as Error).message || 'Ошибка сети')
      } finally {
        setLoading(false)
      }
    } else {
      // For RUB (internal transfers)
      setLoading(true)
      try {
        const response = await fetch('/api/wallet/transfer-rub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromUserId: user.id,
            toCyberLogin: recipient,
            amount: parseFloat(amount)
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setSuccess(true)
          setTimeout(() => {
            onClose()
            window.location.reload()
          }, 3000)
        } else {
          setError(data.error || 'Ошибка перевода')
        }
      } catch (err) {
        setError((err as Error).message || 'Ошибка сети')
      } finally {
        setLoading(false)
      }
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-xl">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Успешно отправлено!
            </h2>
            
            <p className="text-gray-600 mb-6">
              {amount} {selectedCurrency} отправлено {isCrypto ? 'на' : 'пользователю'}<br />
              <span className="font-mono text-sm">
                {isCrypto ? `${recipient.slice(0, 10)}...${recipient.slice(-6)}` : recipient}
              </span>
            </p>

            {isCrypto && txHash && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-500 mb-2">Хеш транзакции:</p>
                <p className="font-mono text-xs text-gray-900 break-all mb-3">
                  {txHash}
                </p>
                <a
                  href={`https://tronscan.org/#/transaction/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  Посмотреть в обозревателе
                  <ExternalLink size={16} />
                </a>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Окно закроется автоматически...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-moneteum rounded-xl flex items-center justify-center mb-4">
            <Send size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Отправить средства
          </h2>
          <p className="text-sm text-gray-500">
            Выберите валюту и введите данные получателя
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Currency selection */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(['RUB', 'USDT', 'TRX'] as const).map((currency) => (
            <button
              key={currency}
              onClick={() => setSelectedCurrency(currency)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                selectedCurrency === currency
                  ? 'border-moneteum bg-moneteum/10'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                selectedCurrency === currency ? 'bg-moneteum text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {currencyIcons[currency]}
              </div>
              <span className={`text-xs font-semibold ${
                selectedCurrency === currency ? 'text-moneteum' : 'text-gray-600'
              }`}>
                {currency}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Доступно:</span>
            <span className="font-semibold">
              {balances[selectedCurrency].toFixed(2)} {selectedCurrency}
            </span>
          </div>
          {selectedCurrency === 'USDT' && (
            <div className="mt-1 text-xs text-yellow-600">
              ⚠️ Для отправки USDT необходимо минимум 15 TRX на балансе для оплаты комиссии сети.
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {isCrypto ? 'Адрес получателя (TRC-20)' : 'Логин получателя'}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={placeholderText}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-moneteum transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Сумма
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-moneteum transition-colors"
                disabled={loading}
              />
              <button
                onClick={() => setAmount(balances[selectedCurrency].toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-moneteum hover:text-moneteum-dark"
                disabled={loading}
              >
                Всё
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-moneteum text-white py-4 rounded-xl font-bold hover:bg-moneteum-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Отправка...
            </span>
          ) : (
            `Отправить ${selectedCurrency}`
          )}
        </button>
      </div>
    </div>
  )
}