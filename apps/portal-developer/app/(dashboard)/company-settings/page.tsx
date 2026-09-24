'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { TenantSelfServiceSettings } from '@kealee/ui'

export default function CompanySettingsPage() {
  const { getToken } = useAuth()
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  useEffect(() => setOrganizationId(new URLSearchParams(window.location.search).get('orgId')), [])
  return <div className="mx-auto max-w-6xl p-6 sm:p-8"><TenantSelfServiceSettings apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'} getToken={getToken} organizationId={organizationId} /></div>
}
