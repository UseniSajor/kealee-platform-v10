import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Permit Coordination — Kealee',
  description: 'Request a project-specific permit and approval-path review from Kealee.',
}

export default function PermitsPage() {
  redirect('/intake/permit_path_only')
}
