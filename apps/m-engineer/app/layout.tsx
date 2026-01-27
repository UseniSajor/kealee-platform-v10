import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee Engineering Services',
  description: 'Professional structural, MEP, and civil engineering services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
