import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee Marketing OS',
  description: 'National construction market intelligence, content, distribution, and growth operations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
      <body>{children}</body>
    </html>
    </ClerkProvider>
  )
}
