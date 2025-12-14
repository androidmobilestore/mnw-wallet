'use client'

import { useState } from 'react'
import { X, Send, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  currency: 'TRX' | 'USDT' | 'RUB'
  balance: number
  privateKey?: string
  userId?: string
}

export default function SendModal({ isOpen, onClose, currency, balance, privateKey, userId }: SendModalProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')

  if (!isOpen) return null

  const isCrypto = currency === 'TRX' || currency === 'USDT'
  const placeholderText = isCrypto
    ? 'TXYZpkJ5QD5GHRUuJPNK9...'
    : 'user#1234'

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
    
    if (parseFloat(amount) > balance) {
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

    if (isCrypto && !privateKey) {
      setError('Приватный ключ не найден')
      return
    }

    // Отправка криптовалюты
    if (isCrypto) {
      setLoading(true)
      
      try {
        const endpoint = currency === 'TRX' ? '/api/wallet/send-trx' : '/api/wallet/send-usdt'
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privateKey,
            toAddress: recipient,
            amount: parseFloat(amount)
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setSuccess(true)
          setTxHash(data.txHash)
          console.log('✅ Transaction sent:', data.txHash)
          
          // Закрываем модалку через 5 секунд
          setTimeout(() => {
            onClose()
            window.location.reload() // Обновляем страницу для обновления баланса
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
      // Для рублей (внутренние переводы)
      setLoading(true)
      try {
        const response = await fetch('/api/wallet/transfer-rub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromUserId: userId,
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

  // Экран успеха
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
              {amount} {currency} отправлено {isCrypto ? 'на' : 'пользователю'}<br />
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
            Отправить {currency}
          </h2>
          <p className="text-sm text-gray-500">
            Доступно: <span className="font-semibold text-gray-900">{balance.toFixed(2)} {currency}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

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
                onClick={() => setAmount(balance.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-moneteum hover:text-moneteum-dark"
                disabled={loading}
              >
                Всё
              </button>
            </div>
          </div>
        </div>

        {isCrypto && currency === 'USDT' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-yellow-800">
              ⚠️ Для отправки USDT необходимо минимум 15 TRX на балансе для оплаты комиссии сети.
            </p>
          </div>
        )}

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
            'Отправить'
          )}
        </button>
      </div>
    </div>
  )
}