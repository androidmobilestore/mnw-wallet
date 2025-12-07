import dotenv from 'dotenv'

// Загружаем .env ПЕРВЫМ делом
dotenv.config()

console.log('🔑 Loading environment variables...')
console.log('📍 TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Loaded' : '❌ Not found')

// Импортируем сервис курсов
import { startRatesUpdater } from '../lib/rates/ratesService'

// Запускаем обновление курсов
startRatesUpdater()

// Импортируем бота ПОСЛЕ загрузки .env
import('../lib/telegram/bot').then(() => {
  console.log('🤖 Telegram Bot is running...')
  console.log('Press Ctrl+C to stop')
  
  // Prevent process from exiting
  process.stdin.resume()
}).catch((error) => {
  console.error('❌ Error loading bot:', error)
  process.exit(1)
})