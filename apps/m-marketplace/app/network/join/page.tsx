import { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BuilderNetworkSignup } from '@/components/BuilderNetworkSignup'

export const metadata: Metadata = {
  title: 'Join the Builder Network | Kealee',
  description:
    'Apply to join the Kealee Builder Network. License-verified contractors get access to project leads, fair bid rotation, and the full Kealee construction platform.',
  openGraph: {
    title: 'Join the Builder Network | Kealee',
    description:
      'License-verified contractors get access to project leads, fair bid rotation, and the full Kealee platform.',
    url: 'https://kealee.com/network/join',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  keywords: [
    'contractor verification',
    'builder network',
    'construction license verification',
    'VA contractor license',
    'MD MHIC license',
    'DC contractor license',
    'join builder network',
  ],
}

export default function JoinBuilderNetworkPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <BuilderNetworkSignup />
      </main>
      <Footer />
    </>
  )
}
