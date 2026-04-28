import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import Script from 'next/script'
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

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const metadata: Metadata = {
  title: {
    default: 'Kealee — Build Your Project in DC, MD, VA',
    template: '%s — Kealee',
  },
  description: 'AI-powered permits, design, and construction management for homeowners, contractors, and developers in Washington DC, Maryland, and Virginia.',
  openGraph: {
    type: 'website',
    siteName: 'Kealee',
    title: 'Kealee — Build Your Project in DC, MD, VA',
    description: 'AI-powered permits, design, and construction management for homeowners, contractors, and developers in Washington DC, Maryland, and Virginia.',
    url: 'https://kealee.com',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@kealee',
    title: 'Kealee — Build Your Project in DC, MD, VA',
    description: 'AI-powered permits, design, and construction management for homeowners, contractors, and developers in Washington DC, Maryland, and Virginia.',
  },
  metadataBase: new URL('https://kealee.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-warm-50">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
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
