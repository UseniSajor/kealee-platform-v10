import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import { SiteNav } from '@/components/nav'
import { SiteFooter } from '@/components/footer'
import { VideoModalProvider } from '@/context/video-modal-context'
import { VideoModal } from '@/components/video-modal'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Kealee — Build Your Project in DC, MD, VA',
    template: '%s — Kealee',
  },
  description: 'AI-powered permits, design, and construction management for homeowners, contractors, and developers in Washington DC, Maryland, and Virginia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <VideoModalProvider>
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
          <VideoModal />
        </VideoModalProvider>
      </body>
    </html>
  )
}
