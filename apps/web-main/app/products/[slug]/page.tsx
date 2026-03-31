import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProduct, getAllProductSlugs } from '@/lib/products'
import ProductCheckoutButton from '@/components/ProductCheckoutButton'

export function generateStaticParams() {
  return getAllProductSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.name} — Kealee`,
    description: product.tagline,
  }
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug)
  if (!product) notFound()

  const hasCheckout = !!product.stripeEnvVar

  return (
    <main style={{ fontFamily: 'var(--font-dm, DM Sans, sans-serif)', color: 'var(--ink)' }}>

      {/* Hero */}
      <div style={{ background: '#F0F1F2', borderBottom: '1px solid #E2E1DC' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 32px 0' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7070', marginBottom: 28 }}>
            <Link href="/" style={{ color: '#6B7070', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/#featured" style={{ color: '#6B7070', textDecoration: 'none' }}>Products</Link>
            <span>/</span>
            <span style={{ color: '#1A1C1B' }}>{product.name}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: 56, alignItems: 'end' }}>
            <div style={{ paddingBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: product.badgeColor }}>{product.label}</span>
                <span style={{ background: product.badgeColor, color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{product.badge}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 'clamp(36px,4vw,58px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 20 }}>{product.name}</h1>
              <p style={{ fontSize: 18, fontWeight: 300, color: '#3D4040', maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}>{product.tagline}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
                <span style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 36, fontWeight: 800, color: '#1A1C1B' }}>{product.price}</span>
                <span style={{ fontSize: 14, color: '#6B7070' }}>{product.priceNote}</span>
              </div>
              <ProductCheckoutButton
                slug={product.slug}
                productName={product.name}
                cta={product.cta}
                price={product.price}
                hasCheckout={hasCheckout}
                ctaHref={product.ctaHref}
                style={{ padding: '14px 28px', fontSize: 15 }}
              />
            </div>

            {/* Hero image */}
            <div style={{ height: 360, borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56 }}>
          <div>
            <p style={{ fontSize: 17, lineHeight: 1.8, color: '#3D4040', marginBottom: 40 }}>{product.description}</p>

            {/* How it works */}
            <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 28, fontWeight: 700, marginBottom: 28 }}>How it works</h2>
            <div style={{ display: 'grid', gap: 24, marginBottom: 48 }}>
              {product.steps.map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1A1C1B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne, Syne, sans-serif)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{step.n}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{step.title}</div>
                    <div style={{ fontSize: 14, color: '#6B7070', lineHeight: 1.65 }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Common questions</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              {product.faq.map((item, i) => (
                <div key={i} style={{ borderBottom: '1px solid #E2E1DC', paddingBottom: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{item.q}</div>
                  <div style={{ fontSize: 14, color: '#6B7070', lineHeight: 1.7 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: '#F8F9F9', border: '1px solid #E2E1DC', borderRadius: 16, padding: 28, position: 'sticky', top: 80 }}>
              <h3 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>What&apos;s included</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                {product.includes.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.55 }}>
                    <span style={{ color: '#3A7D52', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 24, padding: '20px 0 0', borderTop: '1px solid #E2E1DC' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 26, fontWeight: 800 }}>{product.price}</span>
                  <span style={{ fontSize: 12, color: '#6B7070' }}>{product.priceNote}</span>
                </div>
                <ProductCheckoutButton
                  slug={product.slug}
                  productName={product.name}
                  cta={product.cta}
                  price={product.price}
                  hasCheckout={hasCheckout}
                  ctaHref={product.ctaHref}
                  fullWidth
                />
              </div>

              {/* Trust badges */}
              {hasCheckout && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9CA3AF' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, flexShrink: 0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  Secure checkout via Stripe · No card stored
                </div>
              )}

              {/* For who */}
              <div style={{ marginTop: 20, padding: '16px', background: '#fff', borderRadius: 10, border: '1px solid #E2E1DC' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7070', marginBottom: 8 }}>Who this is for</div>
                <div style={{ fontSize: 13, color: '#3D4040', lineHeight: 1.65 }}>{product.forWho}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ background: '#1A1C1B', padding: '56px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Ready to get started?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', marginBottom: 28, lineHeight: 1.7 }}>No commitment beyond this order. Every service is separate. Stop at any step.</p>
          <ProductCheckoutButton
            slug={product.slug}
            productName={product.name}
            cta={product.cta}
            price={product.price}
            hasCheckout={hasCheckout}
            ctaHref={product.ctaHref}
            style={{ padding: '14px 32px', fontSize: 15 }}
          />
        </div>
      </div>

    </main>
  )
}
