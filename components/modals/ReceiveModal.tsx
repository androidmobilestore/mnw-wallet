'use client'

import { useState } from 'react'
import { X, Copy, Download } from 'lucide-react'

interface ReceiveModalProps {
  isOpen: boolean
  onClose: () => void
  currency: 'TRX' | 'USDT' | 'RUB'
  address: string
  cyberLogin: string
}

export default function ReceiveModal({ isOpen, onClose, currency, address, cyberLogin }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const isCrypto = currency === 'TRX' || currency === 'USDT'
  const displayValue = isCrypto ? address : cyberLogin

  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <div className="w-12 h-12 bg-moneteum rounded-xl flex items-center justify-center mb-4">
            <Download size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Получить {currency}
          </h2>
          <p className="text-sm text-gray-500">
            {isCrypto ? 'Ваш адрес для получения' : 'Ваш ID для внутренних переводов'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6">
          <p className="text-xs text-white/60 mb-3 uppercase tracking-wide font-semibold">
            {isCrypto ? 'TRON ADDRESS (TRC-20)' : 'ВАШ ID'}
          </p>
          <p className="text-white font-mono text-sm break-all mb-4">
            {displayValue}
          </p>
          <button
            onClick={handleCopy}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <span className="text-moneteum">✓</span>
                Скопировано
              </>
            ) : (
              <>
                <Copy size={18} />
                Скопировать
              </>
            )}
          </button>
        </div>

        {isCrypto && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-yellow-800 leading-relaxed">
              ⚠️ Отправляйте только {currency} в сети TRC-20. Другие токены или сети могут быть потеряны безвозвратно.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}