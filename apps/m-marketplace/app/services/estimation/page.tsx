import { Metadata } from 'next'
import EstimationClient from './EstimationClient'

export const metadata: Metadata = {
  title: 'AI Cost Estimation — Construction Pricing & Budgets | Kealee',
  description: 'Get accurate construction cost estimates powered by AI and certified estimators. From $299. 96% accuracy with real-time market data. Residential and commercial.',
  openGraph: {
    title: 'AI Cost Estimation | Kealee',
    description: 'AI-powered construction estimates with 96% accuracy. Certified estimators, real-time market data, transparent line-item pricing.',
    url: 'https://kealee.com/services/estimation',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Cost Estimation | Kealee',
    description: 'Construction cost estimates from $299. AI + certified estimators. 96% accuracy. Know your costs before you build.',
  },
  keywords: [
    'construction cost estimation', 'AI cost estimator', 'building cost calculator',
    'renovation cost estimate', 'construction budget', 'project cost analysis',
    'contractor pricing', 'material cost estimation', 'labor cost estimate',
    'residential construction cost', 'commercial construction estimate',
  ],
  alternates: { canonical: 'https://kealee.com/services/estimation' },
}

export default function EstimationPage() {
  return <EstimationClient />
}
