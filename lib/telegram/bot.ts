import TelegramBot from 'node-telegram-bot-api'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma/db'

const prismaAny = prisma as any

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

const SUPER_ADMIN_TELEGRAM_ID = 910555909

async function ensureSuperAdmin() {
  try {
    const existing = await prisma.admin.findUnique({
      where: { telegramId: String(SUPER_ADMIN_TELEGRAM_ID) }
    })

    if (!existing) {
      await prisma.admin.create({
        data: {
          telegramId: String(SUPER_ADMIN_TELEGRAM_ID),
          role: 'SUPER_ADMIN',
          isActive: true
        }
      })
    }
  } catch (e) {
    console.error('❌ ensureSuperAdmin error:', e)
  }
}

async function getAdminByTelegramId(telegramId: number) {
  return prisma.admin.findFirst({
    where: { telegramId: String(telegramId), isActive: true }
  })
}

function buildAdminLink(resourceType: 'EXCHANGE' | 'WITHDRAWAL', resourceId: string, tokenValue: string) {
  if (resourceType === 'EXCHANGE') {
    return `${WEBAPP_URL}/admin/exchanges/${resourceId}?t=${encodeURIComponent(tokenValue)}`
  }
  return `${WEBAPP_URL}/admin/withdrawals/${resourceId}?t=${encodeURIComponent(tokenValue)}`
}

function canUseInlineUrlButtons() {
  return WEBAPP_URL.startsWith('https://')
}

async function issueAdminLinkToken(adminId: string, resourceType: 'EXCHANGE' | 'WITHDRAWAL', resourceId: string) {
  const tokenValue = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 минут

  await prismaAny.adminLinkToken.create({
    data: {
      token: tokenValue,
      adminId,
      resourceType,
      resourceId,
      expiresAt
    }
  })

  return tokenValue
}

async function sendAdminMenu(chatId: number) {
  await bot.sendMessage(chatId, '🛠️ Админ-панель: выберите раздел', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💱 Заявки обмена', callback_data: 'admin_exchanges' }],
        [{ text: '🏦 Выдача наличных', callback_data: 'admin_withdrawals' }]
      ]
    }
  })
}

async function sendExchangeList(chatId: number, adminId: string) {
  const exchanges = await prisma.exchange.findMany({
    where: {
      status: { in: ['PENDING', 'PENDING_APPROVAL', 'APPROVED'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { cyberLogin: true } } }
  })

  if (exchanges.length === 0) {
    await bot.sendMessage(chatId, 'Нет заявок обмена.')
    return
  }

  for (const ex of exchanges) {
    const tokenValue = await issueAdminLinkToken(adminId, 'EXCHANGE', ex.id)
    const link = buildAdminLink('EXCHANGE', ex.id, tokenValue)

    const text = `💱 *${ex.type}*\nКлиент: *${ex.user?.cyberLogin || '-'}*\n${ex.fromAmount} ${ex.fromCurrency} → ${ex.toAmount} ${ex.toCurrency}\nСтатус: ${ex.status}`
    if (canUseInlineUrlButtons()) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть заявку', url: link }]]
        }
      })
    } else {
      await bot.sendMessage(chatId, `${text}\n\n🔗 Ссылка (открыть в браузере на этом компьютере):\n${link}`, {
        parse_mode: 'Markdown'
      })
    }
  }
}

async function sendWithdrawalList(chatId: number, adminId: string) {
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      status: { in: ['PENDING', 'APPROVED'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { cyberLogin: true } } }
  })

  if (withdrawals.length === 0) {
    await bot.sendMessage(chatId, 'Нет заявок на выдачу наличных.')
    return
  }

  for (const w of withdrawals) {
    const tokenValue = await issueAdminLinkToken(adminId, 'WITHDRAWAL', w.id)
    const link = buildAdminLink('WITHDRAWAL', w.id, tokenValue)

    const text = `🏦 *Выдача наличных*\nКлиент: *${w.user?.cyberLogin || '-'}*\nСумма: ${w.amount} ${w.currency}\nГород: ${w.city}\nСтатус: ${w.status}`
    if (canUseInlineUrlButtons()) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть заявку', url: link }]]
        }
      })
    } else {
      await bot.sendMessage(chatId, `${text}\n\n🔗 Ссылка (открыть в браузере на этом компьютере):\n${link}`, {
        parse_mode: 'Markdown'
      })
    }
  }
}

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

bot.onText(/\/admin$/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from?.id
  if (!telegramId) return

  const admin = await getAdminByTelegramId(telegramId)
  if (!admin) {
    await bot.sendMessage(chatId, '⛔️ Доступ запрещён')
    return
  }

  await sendAdminMenu(chatId)
})

bot.onText(/\/admin_add\s+(\d+)\s+(\S+)(?:\s+(\S+))?/, async (msg, match) => {
  const chatId = msg.chat.id
  const fromId = msg.from?.id
  if (!fromId) return

  if (fromId !== SUPER_ADMIN_TELEGRAM_ID) {
    await bot.sendMessage(chatId, '⛔️ Только супер-админ может добавлять админов')
    return
  }

  const telegramId = match?.[1]
  const role = match?.[2]
  const city = match?.[3]

  if (!telegramId || !role) {
    await bot.sendMessage(chatId, 'Формат: /admin_add <telegramId> <role> [city]')
    return
  }

  const allowedRoles = ['SUPER_ADMIN', 'EXCHANGE_OPERATOR', 'WITHDRAWAL_OPERATOR']
  if (!allowedRoles.includes(role)) {
    await bot.sendMessage(chatId, `Роль должна быть одной из: ${allowedRoles.join(', ')}`)
    return
  }

  const existing = await prisma.admin.findUnique({ where: { telegramId: String(telegramId) } })
  if (existing) {
    const updated = await prisma.admin.update({
      where: { telegramId: String(telegramId) },
      data: { role, city: city ?? null, isActive: true }
    })
    await bot.sendMessage(chatId, `✅ Админ обновлён: ${updated.telegramId} (${updated.role})`)
    return
  }

  const created = await prisma.admin.create({
    data: {
      telegramId: String(telegramId),
      role,
      city: city ?? null,
      isActive: true
    }
  })

  await bot.sendMessage(chatId, `✅ Админ добавлен: ${created.telegramId} (${created.role})`)
})

// Обработчик callback-кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id
  const telegramId = query.from?.id
  
  if (!chatId) return
  if (!telegramId) return
  
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

  if (query.data === 'admin_exchanges' || query.data === 'admin_withdrawals') {
    bot.answerCallbackQuery(query.id)
    const admin = await getAdminByTelegramId(telegramId)
    if (!admin) {
      await bot.sendMessage(chatId, '⛔️ Доступ запрещён')
      return
    }

    if (query.data === 'admin_exchanges') {
      await sendExchangeList(chatId, admin.id)
    }

    if (query.data === 'admin_withdrawals') {
      await sendWithdrawalList(chatId, admin.id)
    }
  }
})

ensureSuperAdmin().then(() => {
  console.log('✅ Telegram Bot started')
})