'use client'

import Link from 'next/link'
import { useVideoModal } from '@/context/video-modal-context'

export default function ProjectTypesSection() {
  const { openModal } = useVideoModal()
  return (
    <div className="sec" id="projects">
      <div className="ey">Project types</div>
      <h2 className="h2">Pick your project</h2>
      <p className="sub">Each card below starts with a $395 concept report unless noted. Click any card to see how the process works.</p>
      <div className="ptg">
        {/* Kitchen — spans 2 cols & 2 rows */}
        <div className="ptc s2" style={{ cursor: 'pointer' }} onClick={() => openModal({ tag: 'Most common project', title: 'Kitchen Remodels & Home Additions', description: 'You upload photos of your existing kitchen or the space for your addition. We generate a floor plan, check your zoning and setbacks, estimate a cost band, and identify your permit requirements — delivered the next day.', thumbUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&q=60&auto=format&fit=crop' })}>
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&q=60&auto=format&fit=crop" alt="Kitchen" />
          </div>
          <div className="pto" />
          <span className="ptpr">from $395</span>
          <div className="ptplay"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white" /></svg></div>
          <div className="ptb">
            <div className="ptpre">Most common project</div>
            <h3>Kitchen remodel &amp; home addition</h3>
            <p>Floor plan + zoning + permit scope in 24 hrs</p>
          </div>
        </div>
        {/* ADU */}
        <div className="ptc" style={{ cursor: 'pointer' }} onClick={() => openModal({ tag: 'High demand — DMV', title: 'ADU & In-Law Suite', description: 'We check your lot for setback compliance and ADU eligibility, generate a concept layout, identify the permit path, and match you with verified contractors who have completed ADU work in your county.', thumbUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=60&auto=format&fit=crop' })}>
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=60&auto=format&fit=crop" alt="ADU" />
          </div>
          <div className="pto" />
          <span className="ptpr">from $395</span>
          <div className="ptb"><div className="ptpre">High demand — DMV</div><h3>ADU &amp; in-law suite</h3><p>Zoning · Concept · Permits</p></div>
        </div>
        {/* Tiny home */}
        <Link href="/concept?q=Tiny+home" className="ptc">
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=60&auto=format&fit=crop" alt="Tiny home" />
          </div>
          <div className="pto" />
          <span className="ptpr">from $395</span>
          <div className="ptb"><div className="ptpre">AI design ready</div><h3>Tiny home</h3><p>Concept · Zoning · Permits</p></div>
        </Link>
        {/* Whole home */}
        <Link href="/concept-engine/whole-home" className="ptc">
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=60&auto=format&fit=crop" alt="Whole home" />
          </div>
          <div className="pto" />
          <span className="ptpr">from $395</span>
          <div className="ptb"><div className="ptpre">Full service available</div><h3>Whole home renovation</h3><p>End-to-end project management</p></div>
        </Link>
        {/* New build */}
        <Link href="/concept?q=New+build" className="ptc">
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=60&auto=format&fit=crop" alt="New build" />
          </div>
          <div className="pto" />
          <span className="ptpr">Architect required</span>
          <div className="ptb"><div className="ptpre">Projects over $65K</div><h3>New build / custom home</h3><p>DCS scored · Architect routed</p></div>
        </Link>
        {/* Exterior */}
        <Link href="/concept-engine/exterior" className="ptc">
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=60&auto=format&fit=crop" alt="Exterior" />
          </div>
          <div className="pto" />
          <span className="ptpr">from $149</span>
          <div className="ptb"><div className="ptpre">Quick permit turnaround</div><h3>Exterior renovation</h3><p>Deck · Siding · Roofing · Windows</p></div>
        </Link>
        {/* Landscape */}
        <Link href="/homeowners/garden-farming" className="ptc">
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=60&auto=format&fit=crop" alt="Landscape" />
          </div>
          <div className="pto" />
          <span className="ptpr">per service</span>
          <div className="ptb"><div className="ptpre">Design + install</div><h3>Landscape design &amp; install</h3><p>Full outdoor design + installation</p></div>
        </Link>
        {/* Garden */}
        <Link href="/concept-engine/garden" className="ptc">
          <div className="pti">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=60&auto=format&fit=crop" alt="Garden" />
          </div>
          <div className="pto" />
          <span className="ptpr">per service</span>
          <div className="ptb"><div className="ptpre">Design + install</div><h3>Garden design &amp; install</h3><p>Beds · Hardscape · Irrigation</p></div>
        </Link>
        {/* Other */}
        <Link href="/intake?type=other" className="ptc" style={{ background: 'var(--smoke2)', border: '2px dashed var(--b2)' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--w)', border: '1.5px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--smokedk)' }}>+</div>
            <h3 style={{ fontSize: 16, color: 'var(--ink2)' }}>My project type isn&apos;t listed</h3>
            <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6 }}>Bathroom remodel, commercial buildout, historic renovation, and more — describe your project and we&apos;ll scope it.</p>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--o)' }}>Tell us about your project →</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
