export const dynamic = 'force-dynamic';

import type { Metadata } from 'next'
import './globals.css'

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
    <div className="font-sans">{children}</div>
  )
}
