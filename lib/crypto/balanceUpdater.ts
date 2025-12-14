import { prisma } from '@/lib/prisma/db'

const TRONGRID_API = 'https://api.trongrid.io'
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

interface TronToken {
  tokenInfo: {
    symbol: string
    address: string
  }
  balance: string
}

/**
 * Updates wallet balances based on blockchain transactions
 * @param address TRON address to check
 * @param userId User ID to update balances for
 */
export async function updateBalancesFromBlockchain(address: string, userId: string) {
  try {
    console.log('🔄 Updating balances from blockchain for:', address)
    
    // Get current wallet balances from database
    const wallets = await prisma.wallet.findMany({
      where: { userId, address }
    })
    
    if (wallets.length === 0) {
      console.log('❌ No wallets found for user:', userId)
      return
    }
    
    // Calculate actual balances from blockchain
    const blockchainBalances = await getBlockchainBalances(address)
    
    // If we couldn't fetch blockchain balances due to network issues, preserve existing balances
    if (blockchainBalances.TRX === 0 && blockchainBalances.USDT === 0) {
      console.log('⚠️ Network error or no balances found, preserving existing balances')
      return null // Return null to indicate no update should be made
    }
    
    // Update database with new balances
    for (const wallet of wallets) {
      const blockchainBalance = blockchainBalances[wallet.currency] || 0
      console.log(`📊 Updating ${wallet.currency} balance: ${wallet.balance} -> ${blockchainBalance}`)
      
      // Only update if balance has changed
      if (wallet.balance !== blockchainBalance) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: blockchainBalance }
        })
        console.log(`✅ Updated ${wallet.currency} wallet balance to:`, blockchainBalance)
      }
    }
    
    return blockchainBalances
  } catch (error) {
    console.error('❌ Error updating balances from blockchain:', error)
    throw error
  }
}

/**
 * Gets actual balances from the TRON blockchain
 * @param address TRON address to check
 */
async function getBlockchainBalances(address: string) {
  const balances: { [key: string]: number } = {
    TRX: 0,
    USDT: 0
  }
  
  try {
    // Get TRX balance
    const trxResponse = await fetch(`${TRONGRID_API}/v1/accounts/${address}`)
    const trxData = await trxResponse.json()
    
    if (trxData.data && trxData.data.length > 0) {
      balances.TRX = Number(trxData.data[0].balance) / 1_000_000 // Convert from SUN to TRX
    }
    console.log('💰 TRX balance:', balances.TRX)
    
    // Get USDT (TRC-20) balance
    const usdtResponse = await fetch(
      `${TRONGRID_API}/v1/accounts/${address}/trc20?contract_address=${USDT_CONTRACT}`
    )
    const usdtData = await usdtResponse.json()
    
    if (usdtData.data && usdtData.data.length > 0) {
      const usdtToken = usdtData.data.find((token: TronToken) => token.tokenInfo.symbol === 'USDT')
      if (usdtToken) {
        balances.USDT = Number(usdtToken.balance) / 1_000_000 // Convert from smallest unit
      }
    }
    console.log('💰 USDT balance:', balances.USDT)
    
  } catch (error) {
    console.error('❌ Error fetching blockchain balances:', error)
  }
  
  return balances
}

/**
 * Updates balances when transactions are fetched
 * @param address TRON address
 * @param userId User ID
 */
export async function updateBalancesOnTransactionFetch(address: string, userId: string) {
  try {
    // Update balances from blockchain
    const newBalances = await updateBalancesFromBlockchain(address, userId)
    
    // If we couldn't fetch blockchain balances due to network issues, preserve existing balances
    if (newBalances === null) {
      return null // Return null to indicate no update should be made
    }
    
    // Also update the main user RUB balance based on crypto balances
    if (newBalances) {
      // Get current rates
      const ratesResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron,tether&vs_currencies=rub')
      const ratesData = await ratesResponse.json()
      
      const trxBalanceInRub = newBalances.TRX * (ratesData.tron?.rub || 0)
      const usdtBalanceInRub = newBalances.USDT * (ratesData.tether?.rub || 0)
      const totalCryptoInRub = trxBalanceInRub + usdtBalanceInRub
      
      await prisma.user.update({
        where: { id: userId },
        data: { balanceRUB: totalCryptoInRub }
      })
      
      console.log('✅ Updated user RUB balance to:', totalCryptoInRub)
    }
    
    return newBalances
  } catch (error) {
    console.error('❌ Error updating balances on transaction fetch:', error)
    throw error
  }
}