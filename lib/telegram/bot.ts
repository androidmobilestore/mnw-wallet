import TelegramBot from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_BOT_TOKEN!

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env')
}

// ✅ ИСПРАВЛЕНО: Всегда включаем polling для локальной разработки
export const bot = new TelegramBot(token, { 
  polling: true
})

// URL вашего Mini App
const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3000'

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  const firstName = msg.from?.first_name || 'друг'
  
  const welcomeMessage = `
👋 Привет, ${firstName}!

Добро пожаловать в **МОНЕТУМ.РФ** — ваш безопасный криптовалютный кошелёк.

🔹 **Что вы можете:**
✅ Создать TRON кошелёк за 1 минуту
✅ Хранить TRX, USDT и рубли в одном месте
✅ Мгновенно обменивать валюты
✅ Выводить наличные в наших офисах

🔐 **Безопасность:**
Только вы имеете доступ к своим средствам через мнемоническую фразу.

👇 Нажмите кнопку ниже, чтобы начать!
  `
  
  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '💎 Открыть кошелёк',
            web_app: { url: WEBAPP_URL }
          }
        ],
        [
          {
            text: '❓ Помощь',
            callback_data: 'help'
          },
          {
            text: '📞 Поддержка',
            callback_data: 'support'
          }
        ]
      ]
    }
  })
})

// Обработчик команды /help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id
  
  const helpMessage = `
📚 **Помощь по использованию**

**Основные команды:**
/start - Открыть кошелёк
/balance - Проверить баланс
/help - Эта справка
/support - Связаться с поддержкой

**Как пользоваться:**
1️⃣ Нажмите "Открыть кошелёк"
2️⃣ Создайте или восстановите кошелёк
3️⃣ Пополните баланс
4️⃣ Обменивайте и выводите средства

**Безопасность:**
🔐 Сохраните мнемоническую фразу
🔐 Никому её не показывайте
🔐 Не отправляйте в чатах

Остались вопросы? Нажмите /support
  `
  
  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown'
  })
})

// Обработчик callback-кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id
  
  if (!chatId) return
  
  if (query.data === 'help') {
    bot.answerCallbackQuery(query.id)
    bot.sendMessage(chatId, 'Сейчас откроется справка...')
  }
  
  if (query.data === 'support') {
    bot.answerCallbackQuery(query.id)
    
    const supportMessage = `
📞 **Служба поддержки**

По всем вопросам обращайтесь:

📧 Email: support@monetum.ru
📱 Telegram: @monetum_support
🕐 Время работы: Пн-Пт 9:00-21:00

Мы ответим в течение 1 часа!
    `
    
    bot.sendMessage(chatId, supportMessage, {
      parse_mode: 'Markdown'
    })
  }
})

console.log('✅ Telegram Bot started')