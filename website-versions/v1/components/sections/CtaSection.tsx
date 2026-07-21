import Link from 'next/link'

export default function CtaSection() {
  return (
    <div className="cta">
      <div className="ctai">
        <div>
          <h2>Start with a $395 concept report.</h2>
          <p>Upload photos. Floor plan, zoning check, cost band, and permit scope — delivered the next day. No architect fee upfront. No commitment beyond the report.</p>
        </div>
        <div className="ccards">
          <Link href="/products" className="cc">
            <div>
              <h4>Browse all services</h4>
              <p>AI design, permits, estimation, PM — every service in one place</p>
            </div>
            <span className="ccarr">→</span>
          </Link>
          <Link href="/permits" className="cc">
            <div>
              <h4>Get a free permit checklist</h4>
              <p>Know what your project requires in your county — free</p>
            </div>
            <span className="ccarr">→</span>
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_CONTRACTOR_PORTAL_URL ?? '/auth/sign-in'}
            className="cc"
          >
            <div>
              <h4>Contractor portal</h4>
              <p>Project leads, PM platform, and project operations services</p>
            </div>
            <span className="ccarr">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
