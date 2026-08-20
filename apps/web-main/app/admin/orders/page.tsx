import type { Metadata } from 'next'
import { AdminOrdersClient } from './client'

export const metadata: Metadata = {
  title: 'Orders — Kealee Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminOrdersPage() {
  return <AdminOrdersClient />
}
