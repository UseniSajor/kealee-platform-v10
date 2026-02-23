import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Finance & Trust Hub | Kealee',
  description: 'Manage escrow accounts, payments, and financial transactions',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>{children}</div>
  )
}
