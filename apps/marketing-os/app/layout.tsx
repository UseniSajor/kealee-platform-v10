import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee Marketing OS',
  description: 'National construction market intelligence, content, distribution, and growth operations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
