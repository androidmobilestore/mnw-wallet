'use client'

import { useState, useEffect } from 'react'
import { Copy, Eye, EyeOff, Send, Download, RefreshCw } from 'lucide-react'
import SendModal from '@/components/modals/SendModal'
import ReceiveModal from '@/components/modals/ReceiveModal'
import ExchangeModal from '@/components/modals/ExchangeModal'
import { ExchangeService } from '@/lib/exchangeService'

interface WalletCardProps {
  user: any
}

export default function WalletCard({ user }: WalletCardProps) {
  const [showAddress, setShowAddress] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Модальные окна
  const [sendModal, setSendModal] = useState<{ isOpen: boolean; currency: 'TRX' | 'USDT' | 'RUB' | null }>({
    isOpen: false,
    currency: null
  })
  const [receiveModal, setReceiveModal] = useState<{ isOpen: boolean; currency: 'TRX' | 'USDT' | 'RUB' | null }>({
    isOpen: false,
    currency: null
  })
  const [exchangeModal, setExchangeModal] = useState(false)

  // Реальные балансы из блокчейна
  const [realBalances, setRealBalances] = useState<{
    TRX: number
    USDT: number
    loading: boolean
  }>({
    TRX: 0,
    USDT: 0,
    loading: true
  })

  // Курсы валют
  const [rates, setRates] = useState<any>({})

  useEffect(() => {
    loadRates()
    const interval = setInterval(loadRates, 30000) // Обновление каждые 30 сек
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadBalances()
    const interval = setInterval(loadBalances, 30000) // Обновление каждые 30 сек
    return () => clearInterval(interval)
  }, [user?.tronAddress])

  const loadBalances = async () => {
    if (!user?.tronAddress) return
    
    try {
      console.log('💰 Loading balances for:', user.tronAddress)
      
      const response = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: user.tronAddress })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRealBalances({
          TRX: data.balanceTRX,
          USDT: data.balanceUSDT,
          loading: false
        })
        console.log('✅ Balances loaded:', data)
      } else {
        console.error('❌ Balance fetch failed:', data.error)
        setRealBalances(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('❌ Error loading balances:', error)
      setRealBalances(prev => ({ ...prev, loading: false }))
    }
  }

  const loadRates = async () => {
    await ExchangeService.getRates()
    const usdtToRub = ExchangeService.getRate('USDT', 'RUB')
    const trxToRub = ExchangeService.getRate('TRX', 'RUB')
    
    setRates({
      USDT: usdtToRub?.rate || 0,
      TRX: trxToRub?.rate || 0
    })
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(user?.tronAddress || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const getTotalInRub = () => {
    const trxInRub = realBalances.TRX * rates.TRX
    const usdtInRub = realBalances.USDT * rates.USDT
    const rub = user?.balanceRUB || 0
    return trxInRub + usdtInRub + rub
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Баланс кошелька</h2>
            <p className="text-xs text-gray-500 mt-1">{user?.cyberLogin}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Всего</p>
            <p className="text-lg font-bold text-gray-900">
              {realBalances.loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                `≈ ${getTotalInRub().toLocaleString('ru-RU')} ₽`
              )}
            </p>
          </div>
        </div>

        {/* Адрес */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">TRON ADDRESS</p>
              <p className="text-sm font-mono text-gray-900 font-medium">
                {showAddress ? user?.tronAddress : formatAddress(user?.tronAddress || '')}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setShowAddress(!showAddress)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
              >
                {showAddress ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={copyAddress}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? <span className="text-moneteum text-xs">✓</span> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Балансы */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* TRX */}
          <div className="col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs opacity-70 mb-1">TRX</p>
                <p className="text-3xl font-bold">
                  {realBalances.loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    realBalances.TRX.toFixed(2)
                  )}
                </p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-lg">◈</span>
              </div>
            </div>
            <p className="text-xs opacity-60">
              ≈ {(realBalances.TRX * rates.TRX).toLocaleString('ru-RU')} ₽
            </p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setSendModal({ isOpen: true, currency: 'TRX' })}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Send size={14} />
                Отправить
              </button>
              <button 
                onClick={() => setReceiveModal({ isOpen: true, currency: 'TRX' })}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Download size={14} />
                Получить
              </button>
            </div>
          </div>

          {/* USDT */}
          <div className="border-2 border-moneteum rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">USDT TRC-20</p>
                <p className="text-2xl font-bold text-gray-900">
                  {realBalances.loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    realBalances.USDT.toFixed(2)
                  )}
                </p>
              </div>
              <div className="w-8 h-8 bg-moneteum rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">₮</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              ≈ {(realBalances.USDT * rates.USDT).toLocaleString('ru-RU')} ₽
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setSendModal({ isOpen: true, currency: 'USDT' })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Send size={12} className="inline mr-1" />
                Отправить
              </button>
              <button 
                onClick={() => setReceiveModal({ isOpen: true, currency: 'USDT' })}
                className="flex-1 bg-moneteum hover:bg-moneteum-dark text-white py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download size={12} className="inline mr-1" />
                Получить
              </button>
            </div>
          </div>

          {/* RUB */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Рубли</p>
                <p className="text-2xl font-bold text-gray-900">{user?.balanceRUB?.toLocaleString('ru-RU') || '0'}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-700 text-sm font-bold">₽</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">Виртуальный баланс</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setSendModal({ isOpen: true, currency: 'RUB' })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Send size={12} className="inline mr-1" />
                Отправить
              </button>
              <button 
                onClick={() => setReceiveModal({ isOpen: true, currency: 'RUB' })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download size={12} className="inline mr-1" />
                Получить
              </button>
            </div>
          </div>
        </div>

        {/* Кнопка обмена */}
        <button 
          onClick={() => setExchangeModal(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
        >
          <RefreshCw size={20} />
          Обменять валюту
        </button>
      </div>

      {/* Модальные окна */}
      {sendModal.isOpen && sendModal.currency && (
        <SendModal
          isOpen={sendModal.isOpen}
          onClose={() => setSendModal({ isOpen: false, currency: null })}
          currency={sendModal.currency}
          balance={sendModal.currency === 'RUB' ? user?.balanceRUB || 0 : realBalances[sendModal.currency]}
          privateKey={user?.privateKey}
        />
      )}

      {receiveModal.isOpen && receiveModal.currency && (
        <ReceiveModal
          isOpen={receiveModal.isOpen}
          onClose={() => setReceiveModal({ isOpen: false, currency: null })}
          currency={receiveModal.currency}
          address={user?.tronAddress || ''}
          cyberLogin={user?.cyberLogin || ''}
        />
      )}

      <ExchangeModal
        isOpen={exchangeModal}
        onClose={() => setExchangeModal(false)}
        balances={{
          TRX: realBalances.TRX,
          USDT: realBalances.USDT,
          RUB: user?.balanceRUB || 0
        }}
      />
    </>
  )
}