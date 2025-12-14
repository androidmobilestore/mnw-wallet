'use client'

import { useState } from 'react'
import WalletSetup from '@/components/WalletSetup'

export default function TestWalletPage() {
  const [completed, setCompleted] = useState(false)
  const [walletData, setWalletData] = useState<any>(null)

  const handleWalletCreated = (
    userId: string,
    mnemonic: string,
    address: string,
    privateKey: string,
    cyberLogin: string,
    referralCode: string
  ) => {
    console.log('Wallet created:', { userId, mnemonic, address, privateKey, cyberLogin, referralCode })
    setWalletData({ userId, mnemonic, address, privateKey, cyberLogin, referralCode })
    setCompleted(true)
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-moneteum mb-6">✅ Wallet Created Successfully!</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-moneteum/5 p-6 rounded-xl border border-moneteum/20">
              <h2 className="text-xl font-bold text-gray-900 mb-3">User Information</h2>
              <p><strong>Cyber Login:</strong> {walletData.cyberLogin}</p>
              <p><strong>User ID:</strong> {walletData.userId}</p>
              <p><strong>Referral Code:</strong> {walletData.referralCode}</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Wallet Details</h2>
              <p><strong>Address:</strong> {walletData.address}</p>
              <p><strong>Private Key:</strong> {walletData.privateKey.substring(0, 10)}...</p>
            </div>
          </div>
          
          <div className="bg-moneteum/5 border-2 border-moneteum/20 p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">🔑 Secret Recovery Phrase</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
              {walletData.mnemonic.split(' ').map((word: string, index: number) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-500 block">{index + 1}.</span>
                  <span className="font-mono text-sm">{word}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-700 text-sm">
              <strong>Important:</strong> Save these 12 words in order. They cannot be recovered if lost.
            </p>
          </div>
          
          <button 
            onClick={() => {
              setCompleted(false)
              setWalletData(null)
            }}
            className="w-full bg-moneteum text-white py-3 rounded-xl font-bold hover:bg-moneteum-dark transition-colors"
          >
            Create Another Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Creation Test</h1>
          <p className="text-gray-600">Testing the wallet creation flow</p>
        </div>
        
        <WalletSetup onComplete={handleWalletCreated} />
      </div>
    </div>
  )
}