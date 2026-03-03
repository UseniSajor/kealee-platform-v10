import { Metadata } from 'next'
import PMClient from './PMClient'

export const metadata: Metadata = {
  title: 'Project Management Software for Contractors | Kealee',
  description: 'PM software built for contractors. Milestone tracking, payment management, sub coordination, and client reporting. From $99/month. 14-day free trial.',
  openGraph: {
    title: 'PM Software for Contractors | Kealee',
    description: 'Manage projects, coordinate subs, track milestones, and get paid faster. Built for contractors with escrow-backed payments.',
    url: 'https://kealee.com/services/pm-software',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PM Software for Contractors | Kealee',
    description: 'Project management from $99/mo. Milestone tracking, payment management, mobile app. 14-day free trial.',
  },
  keywords: [
    'project management software', 'construction PM software', 'contractor project management',
    'milestone tracking', 'construction scheduling', 'subcontractor management',
    'construction document management', 'builder software', 'construction mobile app',
  ],
  alternates: { canonical: 'https://kealee.com/services/pm-software' },
}

export default function PMSoftwarePage() {
  return <PMClient />
}
