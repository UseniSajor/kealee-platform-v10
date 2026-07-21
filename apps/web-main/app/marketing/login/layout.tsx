import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marketing Partner Sign In | Kealee',
  description: 'Sign in to the Kealee marketing workspace for agency partners.',
  robots: { index: false, follow: false },
}

export default function MarketingLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
