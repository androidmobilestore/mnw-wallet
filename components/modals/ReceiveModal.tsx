'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Download } from 'lucide-react'
import QRCode from 'qrcode'

interface ReceiveModalProps {
  isOpen: boolean
  onClose: () => void
  currency: 'TRX' | 'USDT' | 'RUB'
  address: string
  cyberLogin: string
}

export default function ReceiveModal({ isOpen, onClose, currency, address, cyberLogin }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && (currency === 'TRX' || currency === 'USDT') && address) {
      QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrCode(url))
        .catch(err => console.error('Error generating QR code:', err))
    }
  }, [isOpen, currency, address])

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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-600" />
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

        {isCrypto && qrCode && (
          <div className="flex justify-center mb-6">
            <div className="relative p-4 bg-white rounded-2xl shadow-lg">
              <div className="absolute inset-0 rounded-2xl border-4 border-moneteum"></div>
              <img src={qrCode} alt="QR Code" className="relative z-10 w-48 h-48 rounded-xl" />
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-moneteum rounded-full"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-moneteum rounded-full"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-moneteum rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-moneteum rounded-full"></div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">
            {isCrypto ? 'TRON ADDRESS (TRC-20)' : 'ВАШ ID'}
          </p>
          <p className="text-gray-900 font-mono text-sm break-all mb-4">
            {displayValue}
          </p>
          <button
            onClick={handleCopy}
            className="w-full bg-moneteum hover:bg-moneteum-dark border border-moneteum/20 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {copied ? (
              <>
                <span className="text-white">✓</span>
                Скопировано
              </>
            ) : (
              <>
                <Copy size={18} className="text-white" />
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