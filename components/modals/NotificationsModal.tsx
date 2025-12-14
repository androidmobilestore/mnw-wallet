'use client'

import { X, Bell, MessageSquare, TrendingUp, Gift, DollarSign } from 'lucide-react'
import { useState } from 'react'

interface NotificationsModalProps {
  onClose: () => void
}

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState({
    transactions: true,
    referrals: true,
    exchanges: true,
    withdrawals: false,
    news: true,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
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
            <Bell size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Уведомления
          </h2>
          <p className="text-sm text-gray-500">
            Настройте типы уведомлений
          </p>
        </div>

        <div className="space-y-3">
          {/* Транзакции */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-moneteum/10 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-moneteum" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Транзакции</p>
                <p className="text-xs text-gray-500">Отправка и получение средств</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.transactions}
                onChange={() => toggleNotification('transactions')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-moneteum"></div>
            </label>
          </div>

          {/* Рефералы */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Gift size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Рефералы</p>
                <p className="text-xs text-gray-500">Начисления вознаграждений</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.referrals}
                onChange={() => toggleNotification('referrals')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-moneteum"></div>
            </label>
          </div>

          {/* Обмены */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Обмены</p>
                <p className="text-xs text-gray-500">Конвертация валют</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.exchanges}
                onChange={() => toggleNotification('exchanges')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-moneteum"></div>
            </label>
          </div>

          {/* Выводы */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Выводы</p>
                <p className="text-xs text-gray-500">Статус заявок на вывод</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.withdrawals}
                onChange={() => toggleNotification('withdrawals')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-moneteum"></div>
            </label>
          </div>

          {/* Новости */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell size={20} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Новости</p>
                <p className="text-xs text-gray-500">Обновления и акции</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.news}
                onChange={() => toggleNotification('news')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-moneteum"></div>
            </label>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-moneteum text-white py-4 rounded-xl font-bold hover:bg-moneteum-dark transition-colors"
        >
          Сохранить настройки
        </button>
      </div>
    </div>
  )
}