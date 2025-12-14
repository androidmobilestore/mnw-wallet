'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

type Withdrawal = any

export default function WithdrawalAdminPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = params.id
  const token = useMemo(() => searchParams.get('t'), [searchParams])

  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        if (!token) {
          setError('Token is required')
          setLoading(false)
          return
        }

        const res = await fetch(`/api/admin/withdrawals/${id}?t=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Failed to load withdrawal')
          setLoading(false)
          return
        }

        setWithdrawal(data.withdrawal)
        setStatus(data.withdrawal.status || '')
        setNotes(data.withdrawal.notes || '')
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

      const res = await fetch(`/api/admin/withdrawals/${id}?t=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status || undefined,
          notes: notes || undefined
        })
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to save')
        return
      }

      setWithdrawal(data.withdrawal)
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
        <h1 className="text-xl font-black text-gray-900 mb-1">Заявка на выдачу наличных</h1>
        <p className="text-xs text-gray-500 mb-6">ID: {id}</p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900">Клиент: {withdrawal?.user?.cyberLogin}</p>
          <p className="text-xs text-gray-600 mt-1">Сумма: {withdrawal?.amount} {withdrawal?.currency}</p>
          <p className="text-xs text-gray-600 mt-1">Город: {withdrawal?.city}</p>
          <p className="text-xs text-gray-600 mt-1">Токен клиента: <span className="font-mono">{withdrawal?.token}</span></p>
          <p className="text-xs text-gray-600 mt-1">Контакт: {withdrawal?.contactType} — {withdrawal?.contact}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm">
              <option value="">(не менять)</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Заметки</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm min-h-[120px]" placeholder="Комментарий оператора" />
          </div>

          <button onClick={handleSave} className="w-full bg-moneteum text-white py-3 rounded-xl font-bold hover:bg-moneteum-dark transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
