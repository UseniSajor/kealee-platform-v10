import type { Metadata } from 'next'
import './globals.css'
import { GlobalNav } from '@/components/navigation/GlobalNav'
import { Footer } from '@/components/home/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Kealee — The Full-Lifecycle Construction Platform',
    template: '%s | Kealee',
  },
  description:
    'From land acquisition to project closeout — 7 operating systems, 13 AI assistants, and digital twins for every project. Powered by Claude AI.',
  keywords: ['construction platform', 'project management', 'contractor marketplace', 'digital twin', 'AI construction'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Kealee',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <GlobalNav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
