'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const WEB = process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'http://localhost:3000'

interface Partner {
  id: string
  partnerId: string
  companyName: string
  companyEmail: string
  primaryColor: string
  customDomain?: string | null
  status: string
}

export default function WhiteLabelPortalPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/v30/white-label/partners`)
      .then(r => r.json())
      .then(data => setPartners(data.partners ?? []))
      .catch(() => setError('Could not load partners — set NEXT_PUBLIC_API_URL'))
  }, [])

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32, fontFamily: 'system-ui' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.1em' }}>
        WHITE-LABEL PORTAL
      </p>
      <h1 style={{ fontSize: 28 }}>Kealee partner programs</h1>
      <p style={{ color: '#64748b' }}>
        Partners use v30 intake under their brand. Customer flow:{' '}
        <Link href={`${WEB}/get-concept`} style={{ color: '#7c3aed' }}>
          {WEB}/get-concept
        </Link>
      </p>

      <p style={{ marginTop: 16 }}>
        <Link href={`${WEB}/partners`} style={{ color: '#7c3aed', fontWeight: 600 }}>
          Register new partner →
        </Link>
        {' · '}
        <Link href="http://localhost:3020" style={{ color: '#64748b' }}>
          portal-admin
        </Link>
      </p>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        {partners.map(p => (
          <div
            key={p.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              borderLeft: `4px solid ${p.primaryColor}`,
            }}
          >
            <strong>{p.companyName}</strong>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>{p.partnerId}</span>
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>{p.companyEmail}</p>
            {p.customDomain && (
              <p style={{ fontSize: 12, color: '#64748b' }}>Domain: {p.customDomain}</p>
            )}
          </div>
        ))}
        {!partners.length && !error && <p style={{ color: '#94a3b8' }}>No partners yet.</p>}
      </div>
    </main>
  )
}
