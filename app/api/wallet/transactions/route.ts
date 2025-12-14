import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/db'
import { updateBalancesOnTransactionFetch } from '@/lib/crypto/balanceUpdater'

const TRONGRID_API = 'https://api.trongrid.io'
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

interface Transaction {
  id: string
  type: string
  currency: string
  amount: number
  from: string
  to: string
  status: string
  createdAt: string
  txHash: string
}

export async function POST(request: Request) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address required' },
        { status: 400 }
      )
    }
    
    console.log('📊 Fetching transactions for:', address)
    
    const transactions: Transaction[] = []
    
    // Получаем TRX транзакции
    try {
      const trxResponse = await fetch(
        `${TRONGRID_API}/v1/accounts/${address}/transactions?limit=20&only_confirmed=true`
      )
      const trxData = await trxResponse.json()
      
      if (trxData.data && trxData.data.length > 0) {
        for (const tx of trxData.data) {
          if (tx.raw_data?.contract?.[0]?.type === 'TransferContract') {
            const contract = tx.raw_data.contract[0].parameter.value
            const isSent = contract.owner_address === address
            
            transactions.push({
              id: tx.txID,
              type: isSent ? 'send' : 'receive',
              currency: 'TRX',
              amount: contract.amount / 1_000_000,
              from: contract.owner_address,
              to: contract.to_address,
              status: 'completed',
              createdAt: new Date(tx.block_timestamp).toISOString(),
              txHash: tx.txID
            })
          }
        }
        console.log('✅ Found', trxData.data.length, 'TRX transactions')
      }
    } catch (error) {
      console.error('⚠️ Error fetching TRX transactions:', error)
    }
    
    // Получаем USDT (TRC-20) транзакции
    try {
      const usdtResponse = await fetch(
        `${TRONGRID_API}/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${USDT_CONTRACT}&only_confirmed=true`
      )
      const usdtData = await usdtResponse.json()
      
      if (usdtData.data && usdtData.data.length > 0) {
        for (const tx of usdtData.data) {
          const isSent = tx.from === address
          
          transactions.push({
            id: tx.transaction_id,
            type: isSent ? 'send' : 'receive',
            currency: 'USDT',
            amount: parseInt(tx.value) / 1_000_000,
            from: tx.from,
            to: tx.to,
            status: 'completed',
            createdAt: new Date(tx.block_timestamp).toISOString(),
            txHash: tx.transaction_id
          })
        }
        console.log('✅ Found', usdtData.data.length, 'USDT transactions')
      }
    } catch (error) {
      console.error('⚠️ Error fetching USDT transactions:', error)
    }
    
    // Сортируем по дате (новые сначала)
    transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    console.log('✅ Total transactions:', transactions.length)
    
    // Обновляем балансы пользователя
    try {
      const user = await prisma.user.findFirst({
        where: { tronAddress: address }
      })
      
      if (user) {
        const balanceResult = await updateBalancesOnTransactionFetch(address, user.id)
        if (balanceResult !== null) {
          console.log('✅ Balances updated after transaction fetch')
        } else {
          console.log('⚠️ Balances preserved due to network error')
        }
      }
    } catch (error) {
      console.error('⚠️ Error updating balances:', error)
    }
    
    return NextResponse.json({
      success: true,
      transactions: transactions.slice(0, 20),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}