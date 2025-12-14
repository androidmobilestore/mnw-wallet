'use client'

import { useState } from 'react'
import { ShieldCheck, Copy, AlertTriangle, Sparkles, KeyRound } from 'lucide-react'

interface WalletSetupProps {
  onComplete: (
    userId: string,
    mnemonic: string,
    address: string,
    privateKey: string,
    cyberLogin: string,
    referralCode: string
  ) => void
}

export default function WalletSetup({ onComplete }: WalletSetupProps) {
  const [step, setStep] = useState<'create' | 'restore' | 'loading' | 'show'>('create')
  const [copied, setCopied] = useState(false)
  const [walletData, setWalletData] = useState<{
    userId: string
    mnemonic: string
    address: string
    privateKey: string
    cyberLogin: string
    referralCode: string
  } | null>(null)
  const [mnemonicInput, setMnemonicInput] = useState('')
  const [restoreError, setRestoreError] = useState('')

  const handleCreate = async () => {
    setStep('loading')
    
    try {
      console.log('🚀 Starting wallet creation...')
      
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          telegramId: null,
          username: 'user',
          firstName: null,
          lastName: null,
          referredBy: null
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error('Failed to create wallet')
      }
      
      const data = await response.json()
      
      console.log('📦 Received data:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Wallet creation failed')
      }
      
      if (!data.mnemonic) {
        throw new Error('Mnemonic not received from server')
      }
      
      console.log('✅ Wallet created and saved:', data.userId)
      
      setWalletData({
        userId: data.userId,
        mnemonic: data.mnemonic,
        address: data.address,
        privateKey: data.privateKey,
        cyberLogin: data.cyberLogin,
        referralCode: data.referralCode
      })
      
      setStep('show')
      
    } catch (error) {
      console.error('❌ Error:', error)
      alert('Ошибка при создании кошелька: ' + (error as Error).message)
      setStep('create')
    }
  }

  const handleRestore = async () => {
    setRestoreError('')
    setStep('loading')
    
    try {
      console.log('🚀 Starting wallet restoration...')
      
      const response = await fetch('/api/wallet/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          mnemonic: mnemonicInput.trim()
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error('Failed to restore wallet')
      }
      
      const data = await response.json()
      
      console.log('📦 Received restore data:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Wallet restoration failed')
      }
      
      console.log('✅ Wallet restored:', data.userId)
      
      // For restored wallets, we don't have the mnemonic or private key in the response
      setWalletData({
        userId: data.userId,
        mnemonic: '',
        address: data.address,
        privateKey: '',
        cyberLogin: data.cyberLogin,
        referralCode: data.referralCode
      })
      
      // Skip the mnemonic display step for restored wallets
      if (data.userId) {
        localStorage.setItem('user', JSON.stringify({
          userId: data.userId,
          cyberLogin: data.cyberLogin,
          tronAddress: data.address,
          referralCode: data.referralCode
        }))
        
        onComplete(
          data.userId,
          '', // No mnemonic for restored wallet
          data.address,
          '', // No private key for restored wallet
          data.cyberLogin,
          data.referralCode
        )
      }
      
    } catch (error) {
      console.error('❌ Error:', error)
      setRestoreError('Ошибка при восстановлении кошелька: ' + (error as Error).message)
      setStep('restore')
    }
  }

  const handleCopy = () => {
    if (walletData?.mnemonic) {
      navigator.clipboard.writeText(walletData.mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleContinue = () => {
    if (walletData) {
      localStorage.setItem('user', JSON.stringify({
        userId: walletData.userId,
        cyberLogin: walletData.cyberLogin,
        tronAddress: walletData.address,
        referralCode: walletData.referralCode
      }))
      
      onComplete(
        walletData.userId,
        walletData.mnemonic,
        walletData.address,
        walletData.privateKey,
        walletData.cyberLogin,
        walletData.referralCode
      )
    }
  }

  if (step === 'create') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-moneteum-light/30 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-moneteum rounded-2xl flex items-center justify-center shadow-lg">
                <KeyRound size={40} className="text-white" strokeWidth={2} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-3">
              Создание кошелька
            </h1>
            <p className="text-center text-gray-600 text-sm mb-8">
              МОНЕТУМ.РФ — ваш безопасный криптовалютный кошелёк
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 p-4 bg-moneteum-light/50 rounded-xl border border-moneteum/20">
                <div className="w-8 h-8 bg-moneteum rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">Безопасность</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Только вы будете иметь доступ к вашему кошельку через мнемоническую фразу
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">Удобство</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Храните TRX, USDT и рубли в одном месте с моментальными переводами
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full bg-moneteum text-white py-4 rounded-xl font-bold text-base hover:bg-moneteum-dark transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Создать кошелёк
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={() => setStep('restore')}
                className="text-moneteum hover:text-moneteum-dark text-sm font-medium underline"
              >
                Восстановить кошелёк из фразы
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-moneteum-light/30 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-moneteum rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <KeyRound size={40} className="text-white" strokeWidth={2} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Создаём ваш кошелёк...
            </h2>
            <p className="text-gray-600 text-sm">
              Генерируем безопасные ключи и сохраняем данные
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'restore') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-moneteum-light/30 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-moneteum rounded-2xl flex items-center justify-center shadow-lg">
                <KeyRound size={40} className="text-white" strokeWidth={2} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-3">
              Восстановление кошелька
            </h1>
            <p className="text-center text-gray-600 text-sm mb-6">
              Введите вашу секретную фразу из 12 слов
            </p>

            {restoreError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm">{restoreError}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Секретная фраза
              </label>
              <textarea
                value={mnemonicInput}
                onChange={(e) => setMnemonicInput(e.target.value)}
                placeholder="Введите 12 слов вашей секретной фразы через пробел"
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-moneteum focus:border-moneteum resize-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Введите слова в правильном порядке, разделенные пробелами
              </p>
            </div>

            <button
              onClick={handleRestore}
              disabled={!mnemonicInput.trim() || mnemonicInput.split(' ').length < 12}
              className="w-full bg-moneteum text-white py-4 rounded-xl font-bold text-base hover:bg-moneteum-dark transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Восстановить кошелёк
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={() => setStep('create')}
                className="text-moneteum hover:text-moneteum-dark text-sm font-medium underline"
              >
                Создать новый кошелёк
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const mnemonicWords = walletData?.mnemonic ? walletData.mnemonic.split(' ') : []

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-moneteum-light/30 px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-moneteum rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl">🔑</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ваша секретная фраза
            </h2>
            <p className="text-sm text-gray-600">
              Сохраните эти 12 слов в правильном порядке
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <p className="font-bold text-red-900 text-sm mb-2">
                  ⚠️ Важно! Прочитайте внимательно:
                </p>
                <ul className="text-xs text-red-800 space-y-1.5 leading-relaxed">
                  <li>• Никому не показывайте эту фразу</li>
                  <li>• Не храните скриншот или фото на телефоне</li>
                  <li>• Перепишите слова на бумагу и уберите в надёжное место</li>
                  <li>• При потере фразы восстановить кошелёк будет невозможно</li>
                </ul>
              </div>
            </div>
          </div>

          {mnemonicWords.length > 0 ? (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {mnemonicWords.map((word, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3"
                    >
                      <span className="text-gray-500 font-bold text-sm w-6">
                        {index + 1}.
                      </span>
                      <span className="text-gray-900 font-mono font-semibold text-sm">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full bg-moneteum hover:bg-moneteum-dark border border-moneteum/20 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  {copied ? (
                    <>
                      <span className="text-white text-lg">✓</span>
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy size={18} className="text-white" />
                      Скопировать фразу
                    </>
                  )}
                </button>
              </div>

              <div className="bg-moneteum-light/50 border border-moneteum/20 rounded-2xl p-5 mb-6">
                <p className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-moneteum" />
                  Рекомендации по хранению:
                </p>
                <ul className="text-xs text-gray-700 space-y-2 leading-relaxed pl-1">
                  <li>✅ Запишите фразу на бумаге или в блокноте</li>
                  <li>✅ Храните в сейфе или другом защищённом месте</li>
                  <li>✅ Можете сделать несколько копий и хранить отдельно</li>
                  <li>❌ Не храните в облаке, на почте или в заметках телефона</li>
                  <li>❌ Не отправляйте фразу по SMS, email или мессенджерам</li>
                </ul>
              </div>

              <button
                onClick={handleContinue}
                className="w-full bg-moneteum text-white py-4 rounded-xl font-bold text-base hover:bg-moneteum-dark transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                Я сохранил фразу, продолжить
              </button>
            </>
          ) : (
            <div className="text-center text-red-600 p-4">
              <p>Ошибка: мнемоническая фраза не получена</p>
              <button
                onClick={() => setStep('create')}
                className="mt-4 px-6 py-2 bg-moneteum text-white rounded-xl"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}