import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Kealee — Build Your Project in DC, MD, VA'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A2B4A',
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
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: '#2ABFBF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: '28px', height: '28px', background: '#1A2B4A', borderRadius: '6px' }} />
          </div>
          <span style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Kealee
          </span>
        </div>

        {/* Headline */}
        <div style={{
          color: '#FFFFFF', fontSize: '62px', fontWeight: '800',
          lineHeight: '1.1', letterSpacing: '-1px', maxWidth: '900px',
        }}>
          Build Your Project in DC, MD, VA
        </div>

        {/* Subtext */}
        <div style={{
          color: '#94A3B8', fontSize: '26px', marginTop: '24px',
          maxWidth: '800px', lineHeight: '1.5',
        }}>
          AI-powered permits, design, and construction management
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '48px' }}>
          {['AI Design', 'Permits', 'Construction'].map((label) => (
            <div key={label} style={{
              background: 'rgba(42,191,191,0.15)', border: '1px solid rgba(42,191,191,0.4)',
              borderRadius: '100px', padding: '10px 24px',
              color: '#2ABFBF', fontSize: '20px', fontWeight: '600',
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ color: '#E8793A', fontSize: '22px', marginTop: '40px', fontWeight: '600' }}>
          kealee.com
        </div>
      </div>
    ),
    { ...size }
  )
}
