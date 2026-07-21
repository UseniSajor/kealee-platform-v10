export const dynamic = 'force-dynamic';

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kealee Engineering Services',
  description: 'Professional structural, MEP, and civil engineering services',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function EngineerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="antialiased">{children}</div>
}
