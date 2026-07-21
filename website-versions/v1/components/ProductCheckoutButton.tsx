'use client'

import { useState } from 'react'

interface Props {
  slug: string
  productName: string
  cta: string
  price: string
  /** If false, renders as a plain Link to ctaHref instead */
  hasCheckout: boolean
  ctaHref: string
  style?: React.CSSProperties
  fullWidth?: boolean
}

export default function ProductCheckoutButton({ slug, productName, cta, price, hasCheckout, ctaHref, style, fullWidth }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const btn: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#C8521A',
    color: '#fff',
    padding: '13px 20px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'var(--font-dm, DM Sans, sans-serif)',
    ...style,
  }

  if (!hasCheckout) {
    return (
      <a href={ctaHref} style={btn}>
        {cta} →
      </a>
    )
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setErr('Email is required'); return }
    setErr('')
    setLoading(true)
    try {
      const res = await fetch('/api/product/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, customerEmail: email.trim(), customerName: name.trim(), productName }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setErr(data.error ?? 'Could not start checkout. Please try again.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setErr('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={btn}>
        {cta} →
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,.2)', fontFamily: 'var(--font-dm, DM Sans, sans-serif)' }}>
            <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{productName}</h2>
            <p style={{ fontSize: 14, color: '#6B7070', marginBottom: 24 }}>{price} · Secure checkout via Stripe</p>

            <form onSubmit={handleCheckout}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1A1C1B' }}>
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E1DC', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
              />
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1A1C1B' }}>
                Email address <span style={{ color: '#C8521A' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E1DC', borderRadius: 8, fontSize: 14, marginBottom: err ? 8 : 20, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
              />
              {err && <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 12 }}>{err}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ ...btn, width: '100%', padding: '13px 20px', marginBottom: 12, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Redirecting to Stripe…' : `Pay ${price} →`}
              </button>
              <button type="button" onClick={() => setOpen(false)} style={{ width: '100%', padding: '11px', border: '1.5px solid #E2E1DC', borderRadius: 8, background: 'transparent', fontSize: 14, color: '#6B7070', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </form>

            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
              Payments secured by Stripe. Your card is never stored on Kealee servers.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
