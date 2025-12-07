'use client'

import { X, Shield, MapPin, Clock, CheckCircle } from 'lucide-react'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  if (!isOpen) return null

  const offices = [
    {
      city: 'Москва',
      address: 'ул. Примерная, д. 123',
      time: 'Пн-Пт: 10:00-19:00, Сб: 11:00-17:00',
    },
    {
      city: 'Нижний Новгород',
      address: 'ул. Образцовая, д. 45',
      time: 'Пн-Пт: 10:00-19:00, Сб: 11:00-17:00',
    },
    {
      city: 'Калининград',
      address: 'пр. Пример, д. 78',
      time: 'Пн-Пт: 10:00-19:00',
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="w-14 h-14 bg-moneteum rounded-xl flex items-center justify-center mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Верификация личности
          </h2>
          <p className="text-sm text-gray-600">
            Повысьте безопасность аккаунта и получите доступ к расширенным функциям
          </p>
        </div>

        {/* Преимущества */}
        <div className="bg-gradient-to-br from-moneteum-light to-green-50 border-2 border-moneteum/20 rounded-2xl p-5 mb-6">
          <p className="text-sm font-bold text-gray-900 mb-3">Преимущества верификации:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-moneteum flex-shrink-0" />
              <p className="text-sm text-gray-700">Повышенные лимиты на операции</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-moneteum flex-shrink-0" />
              <p className="text-sm text-gray-700">Приоритетная поддержка</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-moneteum flex-shrink-0" />
              <p className="text-sm text-gray-700">Защита от мошенничества</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-moneteum flex-shrink-0" />
              <p className="text-sm text-gray-700">Ускоренные выплаты</p>
            </div>
          </div>
        </div>

        {/* Процесс */}
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-900 mb-4">Как проходит верификация:</p>
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-moneteum rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Посетите офис</p>
                <p className="text-xs text-gray-600">Выберите удобный офис из списка ниже</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-moneteum rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Предъявите документ</p>
                <p className="text-xs text-gray-600">Паспорт или водительские права</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-moneteum rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Готово!</p>
                <p className="text-xs text-gray-600">Оператор подтвердит верификацию за 2 минуты</p>
              </div>
            </div>
          </div>
        </div>

        {/* Офисы */}
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-900 mb-4">Наши офисы:</p>
          <div className="space-y-3">
            {offices.map((office, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-moneteum hover:bg-gray-50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-moneteum/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-moneteum" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 mb-1">{office.city}</p>
                    <p className="text-xs text-gray-600 mb-2">{office.address}</p>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <p className="text-xs text-gray-500">{office.time}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопка */}
        <button
          onClick={onClose}
          className="w-full bg-moneteum text-white py-4 rounded-xl font-bold hover:bg-moneteum-dark transition-colors"
        >
          Понятно, спасибо
        </button>
      </div>
    </div>
  )
}