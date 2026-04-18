import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Building Permits Made Simple | DC, MD, VA — Kealee'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F1E35 0%, #1A2B4A 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Badge */}
        <div style={{
          background: 'rgba(42,191,191,0.15)', border: '1px solid rgba(42,191,191,0.5)',
          borderRadius: '100px', padding: '8px 20px',
          color: '#2ABFBF', fontSize: '18px', fontWeight: '600', marginBottom: '28px',
        }}>
          Permit Services · DC · MD · VA
        </div>

        {/* Headline */}
        <div style={{
          color: '#FFFFFF', fontSize: '66px', fontWeight: '800',
          lineHeight: '1.05', letterSpacing: '-1.5px', maxWidth: '920px',
        }}>
          Building Permits Made Simple
        </div>

        {/* Subtext */}
        <div style={{
          color: '#94A3B8', fontSize: '26px', marginTop: '24px',
          maxWidth: '780px', lineHeight: '1.5',
        }}>
          Research, filing &amp; full coordination across DC, Maryland &amp; Virginia jurisdictions.
        </div>

        {/* Tiers */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '48px' }}>
          {[
            { label: 'Research', price: '$149', note: '24 hrs' },
            { label: 'Package', price: '$950', note: '1–2 days' },
            { label: 'Coordination', price: '$2,750', note: 'Full service' },
          ].map((tier) => (
            <div key={tier.label} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <span style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '700' }}>{tier.label}</span>
              <span style={{ color: '#E8793A', fontSize: '16px', fontWeight: '700' }}>{tier.price}</span>
              <span style={{ color: '#64748B', fontSize: '13px' }}>{tier.note}</span>
            </div>
          ))}
        </div>

        {/* Logo */}
        <div style={{
          position: 'absolute', bottom: '60px', right: '80px',
          color: '#FFFFFF', fontSize: '24px', fontWeight: '700', opacity: 0.6,
        }}>
          kealee.com
        </div>
      </div>
    ),
    { ...size }
  )
}
