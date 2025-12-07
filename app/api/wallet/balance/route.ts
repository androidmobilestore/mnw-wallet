import { NextResponse } from 'next/server'

const TRONGRID_API = 'https://api.trongrid.io'
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

export async function POST(request: Request) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }
    
    console.log('💰 Fetching balances for:', address)
    
    // Получаем баланс TRX
    const trxResponse = await fetch(`${TRONGRID_API}/v1/accounts/${address}`)
    const trxData = await trxResponse.json()
    
    let trxBalance = 0
    if (trxData.data && trxData.data.length > 0) {
      trxBalance = (trxData.data[0].balance || 0) / 1_000_000 // Sun to TRX
    }
    
    console.log('✅ TRX Balance:', trxBalance)
    
    // Получаем баланс USDT TRC-20
    let usdtBalance = 0
    try {
      const usdtResponse = await fetch(
        `${TRONGRID_API}/v1/accounts/${address}/transactions/trc20?limit=1&contract_address=${USDT_CONTRACT}`
      )
      const usdtData = await usdtResponse.json()
      
      // Если есть транзакции USDT, запрашиваем баланс
      if (usdtData.data && usdtData.data.length > 0) {
        const balanceResponse = await fetch(
          `${TRONGRID_API}/wallet/triggerconstantcontract`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              owner_address: address,
              contract_address: USDT_CONTRACT,
              function_selector: 'balanceOf(address)',
              parameter: address.replace(/^0x/, '').padStart(64, '0'),
              visible: true
            })
          }
        )
        const balanceData = await balanceResponse.json()
        
        if (balanceData.constant_result && balanceData.constant_result[0]) {
          const hexBalance = balanceData.constant_result[0]
          usdtBalance = parseInt(hexBalance, 16) / 1_000_000
        }
      }
    } catch (error) {
      console.log('⚠️ USDT balance check failed (probably no USDT):', error)
    }
    
    console.log('✅ USDT Balance:', usdtBalance)
    
    return NextResponse.json({
      success: true,
      address,
      balanceTRX: trxBalance,
      balanceUSDT: usdtBalance,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching balances:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    )
  }
}