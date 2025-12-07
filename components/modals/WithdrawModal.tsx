'use client'

import { useState } from 'react'
import { X, Banknote, MapPin, User, Phone, AlertCircle } from 'lucide-react'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  balance: number
}

export default function WithdrawModal({ isOpen, onClose, balance }: WithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [city, setCity] = useState('moscow')
  const [fullName, setFullName] = useState('')
  const [contact, setContact] = useState('')
  const [contactType, setContactType] = useState<'telegram' | 'phone'>('telegram')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleWithdraw = async () => {
  setError('')

  if (!amount || parseFloat(amount) <= 0) {
    setError('Введите сумму')
    return
  }

  if (parseFloat(amount) > balance) {
    setError('Недостаточно средств')
    return
  }

  if (!fullName) {
    setError('Введите ФИО получателя')
    return
  }

  if (!contact) {
    setError('Введите контакт для связи')
    return
  }

  try {
    const response = await fetch('/api/withdrawal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id,
        amount: parseFloat(amount),
        city,
        fullName,
        contactType,
        contact
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      alert(`✅ Заявка создана!\n\nСумма: ${amount} ₽\nГород: ${cities.find(c => c.value === city)?.label}\nТокен получателя: ${data.withdrawal.token}\n\nСохраните этот токен для получения средств!`)
      onClose()
      window.location.reload()
    } else {
      setError(data.error || 'Ошибка создания заявки')
    }
  } catch (error: any) {
    setError(error.message || 'Ошибка сети')
  }
}

  // ... validation ...

  try {
    const response = await fetch('/api/withdrawal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        amount: parseFloat(amount),
        city,
        fullName,
        contactType,
        contact
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      alert(`✅ Заявка создана!\nСумма: ${amount} RUB\nТокен: ${data.withdrawal.token}`)
      onClose()
      window.location.reload()
    } else {
      setError(data.error)
    }
  } catch (error: any) {
    setError(error.message)
  }
}

  const cities = [
    { value: 'moscow', label: 'Москва' },
    { value: 'nnov', label: 'Нижний Новгород' },
    { value: 'kaliningrad', label: 'Калининград' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Banknote size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Вывод рублей
          </h2>
          <p className="text-sm text-gray-500">
            Получите наличные в офисе
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Сумма */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Сумма вывода
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-moneteum transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">₽</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Доступно: {balance.toFixed(2)} ₽
            </p>
          </div>

          {/* Город */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
              <MapPin size={14} />
              Город получения
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-moneteum transition-colors"
            >
              {cities.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* ФИО */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
              <User size={14} />
              ФИО получателя
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-moneteum transition-colors"
            />
          </div>

          {/* Контакт */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
              <Phone size={14} />
              Контакт для связи
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setContactType('telegram')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  contactType === 'telegram'
                    ? 'bg-moneteum text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Telegram
              </button>
              <button
                onClick={() => setContactType('phone')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  contactType === 'phone'
                    ? 'bg-moneteum text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Телефон
              </button>
            </div>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={contactType === 'telegram' ? '@username' : '+7 (999) 123-45-67'}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-moneteum transition-colors"
            />
          </div>
        </div>

        {/* Информация */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-blue-800 leading-relaxed">
            ℹ️ После создания заявки вы получите уникальный токен для получения средств. 
            Оператор свяжется с вами для подтверждения времени и места выдачи.
          </p>
        </div>

        <button
          onClick={handleWithdraw}
          className="w-full bg-moneteum text-white py-4 rounded-xl font-bold hover:bg-moneteum-dark transition-colors"
        >
          Создать заявку на вывод
        </button>
      </div>
    </div>
  )
}
