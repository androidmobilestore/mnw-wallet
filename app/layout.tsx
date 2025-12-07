import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'МОНЕТУМ.РФ — Криптовалютный кошелёк',
  description: 'Современный крипто-кошелёк для безопасных операций с TRX, USDT и рублями',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}