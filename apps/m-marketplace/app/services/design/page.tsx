import { Metadata } from 'next'
import DesignClient from './DesignClient'

export const metadata: Metadata = {
  title: 'design concepts — Architecture & Interior Design | Kealee',
  description: 'Get powered by AI tools concept designs for kitchens, bathrooms, additions, and more. From $199 with unlimited revisions. 48-hour delivery. Professional architect review included.',
  openGraph: {
    title: 'design concepts | Kealee',
    description: 'Transform your space with powered by AI tools concept designs. Professional architect review, unlimited revisions, 48-hour delivery.',
    url: 'https://kealee.com/services/design',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'design concepts | Kealee',
    description: 'powered by AI tools concept designs from $199. Kitchens, bathrooms, additions — delivered in 48 hours with unlimited revisions.',
  },
  keywords: [
    'design concepts', 'kitchen design', 'bathroom design', 'home renovation design',
    'architecture concepts', 'interior design AI', 'concept drawings', 'renovation ideas',
    'home remodel design', 'AI architect', 'design packages', 'construction design',
  ],
  alternates: { canonical: 'https://kealee.com/services/design' },
}

export default function DesignPage() {
  return <DesignClient />
}
