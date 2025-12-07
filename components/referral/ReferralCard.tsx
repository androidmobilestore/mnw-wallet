'use client'

import { useState } from 'react'
import { Users, Copy, Share2, Gift, TrendingUp } from 'lucide-react'

interface ReferralCardProps {
  user: any
}

export default function ReferralCard({ user }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const referralLink = `https://t.me/moneteum_bot?start=${user?.referralCode}`

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const referralBalance = user?.referralBalance || 0

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Gift size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Рефералы</h3>
            <p className="text-xs text-gray-500">Зарабатывай вместе с друзьями</p>
          </div>
        </div>
      </div>

      {/* Баланс вознаграждений */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-moneteum/30 rounded-xl p-5 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-moneteum/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-moneteum" />
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
              Баланс вознаграждений
            </p>
          </div>
          <p className="text-3xl font-black text-moneteum mb-1">
            {referralBalance.toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-xs text-gray-600">
            Автоматически на виртуальный баланс
          </p>
        </div>
      </div>

      {/* Информация о программе */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Получай 10% с каждой сделки</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Приглашай друзей и получай процент от прибыли с каждой их подтверждённой сделки навсегда!
            </p>
          </div>
        </div>
      </div>

      {/* Реферальный код */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-semibold">
          Ваш реферальный код
        </p>
        <div className="flex items-center justify-between">
          <p className="font-mono font-black text-xl text-gray-900">{user?.referralCode}</p>
          <button
            onClick={copyReferralCode}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? (
              <span className="text-moneteum font-black text-lg">✓</span>
            ) : (
              <Copy size={18} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl mb-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Users size={20} className="text-moneteum" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-gray-700">Приглашено друзей</span>
        </div>
        <span className="text-2xl font-black text-moneteum">{user?.referrals?.length || 0}</span>
      </div>

      {/* Кнопка поделиться */}
      <button
        onClick={copyReferralCode}
        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
      >
        <Share2 size={18} strokeWidth={2.5} />
        {copied ? 'Скопировано!' : 'Поделиться ссылкой'}
      </button>
    </div>
  )
}