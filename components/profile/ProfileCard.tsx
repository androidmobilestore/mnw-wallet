'use client'

import { useState } from 'react'
import { TrendingUp, Award, Banknote, Bell, Settings, Shield, Star, CheckCircle, AlertCircle } from 'lucide-react'
import WithdrawModal from '@/components/modals/WithdrawModal'
import NotificationsModal from '@/components/modals/NotificationsModal'
import VerificationModal from '@/components/modals/VerificationModal'

interface ProfileCardProps {
  user: any
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [notificationsModal, setNotificationsModal] = useState(false)
  const [verificationModal, setVerificationModal] = useState(false)

  const isVerified = user?.isVerified || false
  const balanceRUB = user?.balanceRUB || 0

  const getUserLevel = () => {
    const deals = user?.totalDeals || 0
    if (deals >= 100) return { name: 'Platinum', color: 'from-gray-400 to-gray-600', icon: '💎' }
    if (deals >= 50) return { name: 'Gold', color: 'from-yellow-400 to-yellow-600', icon: '🥇' }
    if (deals >= 20) return { name: 'Silver', color: 'from-gray-300 to-gray-500', icon: '🥈' }
    return { name: 'Bronze', color: 'from-orange-400 to-orange-600', icon: '🥉' }
  }

  const level = getUserLevel()

  // ✅ Обработчик открытия модального окна вывода
  const handleWithdrawClick = () => {
    if (balanceRUB <= 0) {
      alert('Недостаточно средств для вывода. Пополните баланс.')
      return
    }
    setWithdrawModal(true)
  }

  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-moneteum/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          {/* Заголовок с аватаром */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-moneteum to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg relative">
                <span className="text-3xl">👤</span>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-moneteum rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black mb-1">{user?.cyberLogin}</h3>
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-moneteum" />
                      <p className="text-xs text-moneteum font-semibold">Верифицирован</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertCircle size={14} className="text-yellow-400" />
                      <p className="text-xs text-yellow-400 font-semibold">Не верифицирован</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Кнопки настроек */}
            <div className="flex gap-2">
              <button
                onClick={() => setNotificationsModal(true)}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10"
              >
                <Bell size={18} />
              </button>
              <button className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10">
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Уведомление о верификации */}
          {!isVerified && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-yellow-100 mb-1">
                    Пройдите верификацию
                  </p>
                  <p className="text-xs text-yellow-200/80 mb-3 leading-relaxed">
                    Займёт не более 5 минут в офисе. Оператор поможет с процессом.
                  </p>
                  <button
                    onClick={() => setVerificationModal(true)}
                    className="text-xs font-bold text-yellow-400 hover:text-yellow-300 underline"
                  >
                    Пройти верификацию →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Уровень пользователя */}
          <div className={`bg-gradient-to-r ${level.color} rounded-xl p-4 mb-4 shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{level.icon}</span>
                <div>
                  <p className="text-xs font-semibold opacity-90">Ваш статус</p>
                  <p className="text-lg font-black">{level.name}</p>
                </div>
              </div>
              <Star size={24} className="opacity-80" />
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-moneteum" />
                <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Сделок</p>
              </div>
              <p className="text-2xl font-black">{user?.totalDeals || 0}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-yellow-400" />
                <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Объём</p>
              </div>
              <p className="text-2xl font-black">${user?.totalVolume?.toFixed(0) || '0'}</p>
            </div>
          </div>

          {/* Безопасность */}
          <div className="bg-moneteum/10 border border-moneteum/20 rounded-xl p-3 mb-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-moneteum" />
              <p className="text-xs font-semibold">Уровень безопасности</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-moneteum rounded-full transition-all duration-300" style={{ width: isVerified ? '100%' : '60%' }}></div>
              </div>
              <span className="text-xs font-bold text-moneteum">{isVerified ? '100%' : '60%'}</span>
            </div>
          </div>

          {/* Кнопка вывода */}
          <button
            onClick={handleWithdrawClick}
            disabled={balanceRUB <= 0}
            className={`w-full py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
              balanceRUB > 0
                ? 'bg-moneteum hover:bg-moneteum-dark text-white hover:shadow-xl hover:scale-[1.02]'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Banknote size={20} />
            {balanceRUB > 0 ? 'Вывести рубли' : 'Недостаточно средств'}
          </button>
        </div>
      </div>

      {/* ✅ Модальное окно открывается только при withdrawModal = true И балансе > 0 */}
      {withdrawModal && balanceRUB > 0 && (
        <WithdrawModal
          onClose={() => setWithdrawModal(false)}
          balance={balanceRUB}
        />
      )}

      {notificationsModal && (
        <NotificationsModal
          onClose={() => setNotificationsModal(false)}
        />
      )}

      {verificationModal && (
        <VerificationModal
          onClose={() => setVerificationModal(false)}
        />
      )}
    </>
  )
}