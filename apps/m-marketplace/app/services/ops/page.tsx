import { Metadata } from 'next'
import OpsClient from './OpsClient'

export const metadata: Metadata = {
  title: 'Operations Services — Managed PM Teams for Contractors | Kealee',
  description: 'Dedicated operations teams handle permits, coordination, reporting, and admin. Save 22+ hours/week. From $1,750/month. 14-day free trial, no contracts.',
  openGraph: {
    title: 'Operations Services | Kealee',
    description: 'Managed PM teams for contractors. Permits, coordination, scheduling, reporting — handled. Save 22+ hours/week.',
    url: 'https://kealee.com/services/ops',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Operations Services | Kealee',
    description: 'Your operations team, on demand. From $1,750/mo. 14-day free trial, no contracts. Save 22+ hours/week.',
  },
  keywords: [
    'construction operations', 'project management services', 'managed PM team',
    'contractor operations', 'construction coordination', 'permit tracking service',
    'construction admin', 'operations outsourcing', 'construction reporting',
    'project coordinator', 'vendor coordination', 'schedule management',
  ],
  alternates: { canonical: 'https://kealee.com/services/ops' },
}

export default function OpsPage() {
  return <OpsClient />
}
