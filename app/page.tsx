'use client'

import { useState, useEffect } from 'react'
import WalletSetup from '@/components/WalletSetup'
import WalletCard from '@/components/wallet/WalletCard'
import TransactionList from '@/components/wallet/TransactionList'
import ProfileCard from '@/components/profile/ProfileCard'
import ReferralCard from '@/components/referral/ReferralCard'

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем сохраненный ID пользователя в localStorage
    const savedUserId = localStorage.getItem('monetum_userId')
    
    if (savedUserId) {
      console.log('📂 Found saved session:', savedUserId)
      setUserId(savedUserId)
      loadUser(savedUserId)
    } else {
      console.log('🆕 No session found, new user')
      setLoading(false)
    }
  }, [])

  const loadUser = async (id: string) => {
    setLoading(true)
    try {
      console.log('👤 Loading user data...')
      
      const response = await fetch(`/api/user/${id}`)
      
      if (!response.ok) {
        throw new Error('User not found')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        console.log('✅ User loaded:', data.user.cyberLogin)
      } else {
        // Пользователь не найден, очищаем сессию
        localStorage.removeItem('monetum_userId')
        setUserId(null)
      }
    } catch (error) {
      console.error('❌ Error loading user:', error)
      localStorage.removeItem('monetum_userId')
      setUserId(null)
    } finally {
      setLoading(false)
    }
  }

  const handleWalletCreated = (
    newUserId: string,
    mnemonic: string,
    address: string,
    privateKey: string,
    cyberLogin: string,
    referralCode: string
  ) => {
    console.log('💾 Saving session:', newUserId)
    
    // Сохраняем ID пользователя в localStorage
    localStorage.setItem('monetum_userId', newUserId)
    setUserId(newUserId)
    
    // Устанавливаем начальные данные пользователя
    setUser({
      id: newUserId,
      cyberLogin,
      tronAddress: address,
      privateKey,
      balanceRUB: 0,
      referralCode,
      referralBalance: 0,
      totalDeals: 0,
      totalVolume: 0,
      isVerified: false,
      transactions: [],
      referrals: [],
      withdrawals: []
    })
  }

  const handleLogout = () => {
    if (confirm('Вы уверены что хотите выйти? Убедитесь что сохранили мнемоническую фразу!')) {
      localStorage.removeItem('monetum_userId')
      setUserId(null)
      setUser(null)
      window.location.reload()
    }
  }

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-moneteum-light/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-moneteum border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Показываем создание кошелька
  if (!userId || !user) {
    return <WalletSetup onComplete={handleWalletCreated} />
  }

  return (
    <main className="min-h-screen bg-white relative px-4 py-6 max-w-[1400px] mx-auto">
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none"></div>

      {/* Кнопка выхода (для тестирования) */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
      >
        Выйти (тест)
      </button>

      <div className="relative z-10 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <WalletCard user={user} />
          <TransactionList 
            transactions={user.transactions} 
            userAddress={user.tronAddress}
          />
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <ProfileCard user={user} />
          <ReferralCard user={user} />
        </div>
      </div>
    </main>
  )
}