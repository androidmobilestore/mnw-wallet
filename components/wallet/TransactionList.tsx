'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Gift, ExternalLink } from 'lucide-react'
import { useBalanceUpdate } from '@/contexts/BalanceUpdateContext'

interface Transaction {
  id: string
  type: string
  currency: string
  amount: number
  status: string
  createdAt: string
  description?: string
  txHash?: string
  from?: string
  to?: string
}

interface TransactionListProps {
  transactions: Transaction[]
  userAddress?: string
}

export default function TransactionList({ transactions: mockTransactions, userAddress }: TransactionListProps) {
  const [realTransactions, setRealTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const { triggerBalanceUpdate } = useBalanceUpdate()

  useEffect(() => {
    if (userAddress) {
      loadTransactions()
    }
  }, [userAddress])

  const loadTransactions = async () => {
    if (!userAddress) return
    
    // Only show loading indicator for initial load
    const isFirstLoad = realTransactions.length === 0;
    if (isFirstLoad) {
      setLoading(true);
    }
    
    try {
      console.log('📊 Loading blockchain transactions...')
      
      const response = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRealTransactions(data.transactions)
        console.log('✅ Loaded', data.transactions.length, 'transactions')
        // Trigger balance update in WalletCard
        triggerBalanceUpdate()
      }
    } catch (error) {
      console.error('❌ Error loading transactions:', error)
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  }

  // Объединяем реальные и моковые транзакции
  const allTransactions = [...realTransactions, ...mockTransactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)

  const getIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="text-red-500" size={18} />
      case 'receive':
        return <ArrowDownLeft className="text-moneteum" size={18} />
      case 'exchange':
        return <RefreshCw className="text-blue-500" size={18} />
      case 'referral_reward':
        return <Gift className="text-orange-500" size={18} />
      default:
        return <RefreshCw className="text-gray-600" size={18} />
    }
  }

  const getTypeText = (type: string, description?: string) => {
    switch (type) {
      case 'send': return 'Отправлено'
      case 'receive': return 'Получено'
      case 'exchange': return 'Обмен'
      case 'referral_reward': return description || 'Реферальное вознаграждение'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receive':
      case 'referral_reward':
        return 'text-moneteum'
      case 'send':
        return 'text-red-500'
      case 'exchange':
        return 'text-blue-600'
      default:
        return 'text-gray-900'
    }
  }

  // Функция для усечения адреса
  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Операции</h2>
        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-gray-500 animate-pulse">Загрузка...</span>}
          <span className="text-xs text-gray-500">{allTransactions.length} записей</span>
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Обновить"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-moneteum' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      {allTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-sm text-gray-500">Нет транзакций</p>
          <p className="text-xs text-gray-400 mt-1">Ваши операции появятся здесь</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getIcon(tx.type)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {getTypeText(tx.type, tx.description)}
                  </p>
                  {/* Показываем отправителя для входящих транзакций */}
                  {tx.type === 'receive' && tx.from && (
                    <p className="text-xs text-gray-500">
                      От: {truncateAddress(tx.from)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className={`text-sm font-bold ${getTypeColor(tx.type)}`}>
                    {(tx.type === 'receive' || tx.type === 'referral_reward') ? '+' : '-'}
                    {tx.amount.toFixed(2)} {tx.currency}
                  </p>
                  <p className="text-xs text-gray-500">Завершено</p>
                </div>
                {tx.txHash && (
                  <a
                    href={`https://tronscan.org/#/transaction/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Посмотреть в обозревателе"
                  >
                    <ExternalLink size={16} className="text-moneteum hover:text-moneteum-dark" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}