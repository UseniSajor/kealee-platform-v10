import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee Project Owner Hub',
  description: 'Homeowner-facing hub for projects, readiness, contracts, and milestones.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body>{children}</body>
    </html>
  )
}

