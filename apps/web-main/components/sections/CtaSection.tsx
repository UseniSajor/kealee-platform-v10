import Link from 'next/link'

export default function CtaSection() {
  return (
    <div className="cta">
      <div className="ctai">
        <div>
          <h2>Start your design from $599.</h2>
          <p>Answer 9 questions. Get photorealistic renderings, zoning check, cost estimate, and permit path — delivered to your portal in 5–7 business days.</p>
        </div>
        <div className="ccards">
          <Link href="/intake-wizard" className="cc">
            <div>
              <h4>Start the intake wizard</h4>
              <p>9 questions → your recommended package · Starter, Professional, or Enterprise</p>
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
