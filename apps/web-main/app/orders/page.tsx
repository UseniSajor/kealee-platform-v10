import type { Metadata } from 'next'
import { OrdersLookupClient } from './lookup-client'

export const metadata: Metadata = {
  title: 'Find your Kealee order',
  description: 'Get the link to your Kealee order and deliverables sent to the email on the order.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * The way back into a paid order without the confirmation email. Customers
 * reach here from the portal fallback and from links that no longer resolve,
 * so it must stand on its own and never end in a dead page.
 */
export default function OrdersIndexPage() {
  return <OrdersLookupClient />
}
