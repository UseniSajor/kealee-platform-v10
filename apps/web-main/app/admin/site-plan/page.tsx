import type { Metadata } from 'next'
import { AdminSitePlanClient } from './client'

export const metadata: Metadata = {
  title: 'Site Plans — Kealee Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminSitePlanPage() {
  return <AdminSitePlanClient />
}
