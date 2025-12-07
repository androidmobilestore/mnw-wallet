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
  const [step, setStep] = useState<'create' | 'show'>('create')
  const [copied, setCopied] = useState(false)
  const [demoMnemonic, setDemoMnemonic] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      console.log('🚀 Starting wallet creation...')
      
      // Генерируем мнемонику локально
      const bip39 = await import('bip39')
      const newMnemonic = bip39.generateMnemonic(128)
      
      console.log('✅ Mnemonic generated locally')
      
      setDemoMnemonic(newMnemonic.split(' '))
      setStep('show')
    } catch (error) {
      console.error('❌ Error generating mnemonic:', error)
      alert('Ошибка при создании кошелька: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(demoMnemonic.join(' '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleContinue = async () => {
    setLoading(true)
    
    try {
      console.log('🔐 Creating wallet with database save...')
      
      // Вызываем API который создаст кошелёк И сохранит в БД
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
      
      if (!data.success) {
        throw new Error(data.error || 'Wallet creation failed')
      }
      
      console.log('✅ Wallet created and saved:', data.userId)
      
      // Передаём все данные включая userId
      onComplete(
        data.userId,
        data.mnemonic,
        data.address,
        data.privateKey,
        data.cyberLogin,
        data.referralCode
      )
    } catch (error) {
      console.error('❌ Error:', error)
      alert('Ошибка при создании кошелька: ' + (error as Error).message)
      setLoading(false)
    }
  }

  if (step === 'create') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-moneteum-light/30 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-moneteum to-moneteum-dark rounded-2xl flex items-center justify-center shadow-lg">
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
              disabled={loading}
              className="w-full bg-moneteum text-white py-4 rounded-xl font-bold text-base hover:bg-moneteum-dark transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Создание...' : 'Создать кошелёк'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-moneteum-light/30 px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4 shadow-lg">
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

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {demoMnemonic.map((word, index) => (
                <div
                  key={index}
                  className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3"
                >
                  <span className="text-white/50 font-bold text-sm w-6">
                    {index + 1}.
                  </span>
                  <span className="text-white font-mono font-semibold text-sm">
                    {word}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <span className="text-moneteum text-lg">✓</span>
                  Скопировано
                </>
              ) : (
                <>
                  <Copy size={18} />
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

          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl mb-6 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              id="confirm"
              className="mt-1 w-5 h-5 accent-moneteum cursor-pointer"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              Я понимаю, что только я несу ответственность за сохранность фразы. 
              При её потере доступ к кошельку будет невозможно восстановить.
            </span>
          </label>

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-moneteum text-white py-4 rounded-xl font-bold text-base hover:bg-moneteum-dark transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание кошелька...' : 'Я сохранил фразу, продолжить'}
          </button>
        </div>
      </div>
    </main>
  )
}