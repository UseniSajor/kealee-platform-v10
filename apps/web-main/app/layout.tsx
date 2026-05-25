import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { SiteNav } from '@/components/nav'
import { VideoModalProvider } from '@/context/video-modal-context'
import { VideoModal } from '@/components/video-modal'
import { GlobalChatBar } from '@/components/GlobalChatBar'
import { AuthHashExchange } from '@/components/AuthHashExchange'
import { ConditionalSiteFooter } from '@/components/ConditionalSiteFooter'
import { UtmCaptureRoot } from '@/components/marketing/UtmCaptureRoot'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildGlobalJsonLdGraph } from '@/lib/seo/site-json-ld'
import { MobileConversionRail } from '@/components/marketing/MobileConversionRail'
import { ConversionPathTracker } from '@/components/marketing/ConversionPathTracker'

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

const GA_ID      = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const PIXEL_ID   = process.env.NEXT_PUBLIC_META_PIXEL_ID
const GADS_ID    = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID   // format: AW-XXXXXXXXXX

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
  keywords: [
    'AI kitchen design DC',
    'DC building permits',
    'home renovation estimate DMV',
    'construction cost estimator',
    'contractor marketplace DC',
  ],
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-warm-50">
        <JsonLd data={buildGlobalJsonLdGraph()} />
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
                ${GADS_ID ? `gtag('config', '${GADS_ID}');` : ''}
              `}
            </Script>
          </>
        )}
        {PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        <VideoModalProvider>
          <UtmCaptureRoot />
          <ConversionPathTracker />
          <SiteNav />
          <main className="pb-28 md:pb-24">{children}</main>
          <ConditionalSiteFooter />
          <VideoModal />
          <MobileConversionRail />
          <GlobalChatBar />
          <AuthHashExchange />
        </VideoModalProvider>
      </body>
    </html>
  )
}
