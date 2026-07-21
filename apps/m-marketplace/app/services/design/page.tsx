import { Metadata } from 'next'
import DesignClient from './DesignClient'

export const metadata: Metadata = {
  title: 'AI Design Concepts — Architecture & Interior Design | Kealee',
  description: 'Get AI-powered concept designs for kitchens, bathrooms, additions, and more. From $199 with unlimited revisions. 48-hour delivery. Professional architect review included.',
  openGraph: {
    title: 'AI Design Concepts | Kealee',
    description: 'Transform your space with AI-powered concept designs. Professional architect review, unlimited revisions, 48-hour delivery.',
    url: 'https://kealee.com/services/design',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Design Concepts | Kealee',
    description: 'AI-powered concept designs from $199. Kitchens, bathrooms, additions — delivered in 48 hours with unlimited revisions.',
  },
  keywords: [
    'AI design concepts', 'kitchen design', 'bathroom design', 'home renovation design',
    'architecture concepts', 'interior design AI', 'concept drawings', 'renovation ideas',
    'home remodel design', 'AI architect', 'design packages', 'construction design',
  ],
  alternates: { canonical: 'https://kealee.com/services/design' },
}

export default function DesignPage() {
  return <DesignClient />
}
