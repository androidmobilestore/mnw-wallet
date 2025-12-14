'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

type Exchange = any

export default function ExchangeAdminPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = params.id
  const token = useMemo(() => searchParams.get('t'), [searchParams])

  const [exchange, setExchange] = useState<Exchange | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState('')
  const [txid, setTxid] = useState('')
  const [buyoutRate, setBuyoutRate] = useState('')
  const [buyoutAmount, setBuyoutAmount] = useState('')
  const [profit, setProfit] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        if (!token) {
          setError('Token is required')
          setLoading(false)
          return
        }

        const res = await fetch(`/api/admin/exchanges/${id}?t=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Failed to load exchange')
          setLoading(false)
          return
        }

        setExchange(data.exchange)
        setStatus(data.exchange.status || '')
        setTxid(data.exchange.txid || '')
        setBuyoutRate(data.exchange.buyoutRate != null ? String(data.exchange.buyoutRate) : '')
        setBuyoutAmount(data.exchange.buyoutAmount != null ? String(data.exchange.buyoutAmount) : '')
        setProfit(data.exchange.profit != null ? String(data.exchange.profit) : '')
        setLoading(false)
      } catch (e) {
        setError((e as Error).message)
        setLoading(false)
      }
    }

    load()
  }, [id, token])

  const handleSave = async () => {
    try {
      setError(null)
      if (!token) {
        setError('Token is required')
        return
      }

      const res = await fetch(`/api/admin/exchanges/${id}?t=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status || undefined,
          txid: txid || undefined,
          buyoutRate: buyoutRate === '' ? undefined : Number(buyoutRate),
          buyoutAmount: buyoutAmount === '' ? undefined : Number(buyoutAmount),
          profit: profit === '' ? undefined : Number(profit)
        })
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to save')
        return
      }

      setExchange(data.exchange)
      alert('✅ Сохранено')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <p className="text-gray-700 font-semibold">Загрузка...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-semibold">Ошибка</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-black text-gray-900 mb-1">Заявка обмена</h1>
        <p className="text-xs text-gray-500 mb-6">ID: {id}</p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900">Клиент: {exchange?.user?.cyberLogin}</p>
          <p className="text-xs text-gray-600 mt-1">{exchange?.type}: {exchange?.fromAmount} {exchange?.fromCurrency} → {exchange?.toAmount} {exchange?.toCurrency}</p>
          <p className="text-xs text-gray-600 mt-1">Курс для клиента: {exchange?.exchangeRate}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm">
              <option value="">(не менять)</option>
              <option value="PENDING">PENDING</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="APPROVED">APPROVED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">TXID (hash)</label>
            <input value={txid} onChange={(e) => setTxid(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm" placeholder="(если применимо)" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Откуп, ₽/USDT</label>
              <input value={buyoutRate} onChange={(e) => setBuyoutRate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm" placeholder="98" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Сумма откупа, ₽</label>
              <input value={buyoutAmount} onChange={(e) => setBuyoutAmount(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm" placeholder="98000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Прибыль, ₽</label>
              <input value={profit} onChange={(e) => setProfit(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm" placeholder="2000" />
            </div>
          </div>

          <button onClick={handleSave} className="w-full bg-moneteum text-white py-3 rounded-xl font-bold hover:bg-moneteum-dark transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
