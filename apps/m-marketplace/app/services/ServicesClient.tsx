'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import './services.css'

type Phase = 'design' | 'estimate' | 'permit' | 'build' | 'closeout'

export function ServicesClient() {
  const [activePhase, setActivePhase] = useState<Phase>('design')
  const [activePkgTab, setActivePkgTab] = useState('ai')
  const containerRef = useRef<HTMLDivElement>(null)

  const switchPhase = useCallback((phase: Phase) => {
    setActivePhase(phase)
    if (phase === 'design') setActivePkgTab('ai')
    window.scrollTo({ top: 116, behavior: 'smooth' })
  }, [])

  const switchPkg = useCallback((tab: string) => {
    setActivePkgTab(tab)
  }, [])

  useEffect(() => {
    const reveals = containerRef.current?.querySelectorAll('.scroll-reveal:not(.visible)')
    if (!reveals) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })
    reveals.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [activePhase])

  return (
    <div className="svc-page" ref={containerRef}>

      {/* ═══ PHASE TABS ═══ */}
      <div className="phase-bar">
        {([
          { id: 'design' as Phase, label: 'Design', sub: 'Architecture · AI Concepts' },
          { id: 'estimate' as Phase, label: 'Estimate', sub: 'AI Takeoff · Pricing' },
          { id: 'permit' as Phase, label: 'Permit', sub: 'AI Review · Submissions' },
          { id: 'build' as Phase, label: 'Build', sub: 'PM Software · Operations' },
          { id: 'closeout' as Phase, label: 'Closeout', sub: 'Escrow · Final Walkthrough' },
        ]).map(tab => (
          <button
            key={tab.id}
            className={`ptab ${activePhase === tab.id ? 'active' : ''}`}
            data-phase={tab.id}
            onClick={() => switchPhase(tab.id)}
          >
            <span className="ptab-label">{tab.label}</span>
            <span className="ptab-sub">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
           PANEL 1: DESIGN
      ═══════════════════════════════════════════ */}
      <div className={`panel ${activePhase === 'design' ? 'active' : ''}`}>
        <section className="svc-hero hero-design">
          <div className="hero-inner">
            <div>
              <div className="hero-badge"><span className="badge-dot" /> AI-Powered · Licensed Architect Review</div>
              <h1 className="fu1">Your Project Starts<br />with the Right <em>Design</em></h1>
              <p className="hero-sub fu2">From a rough idea to stamped architectural drawings — Kealee&apos;s AI generates concepts in 48 hours, and our licensed architects certify every drawing before it leaves our hands.</p>
              <div className="hero-btns fu3">
                <Link href="/get-started" className="btn-hero-gold">Start with AI Concept — $99</Link>
                <button className="btn-hero-outline" onClick={() => switchPkg('arch')}>View Architecture Packages</button>
              </div>
            </div>
            <div className="stat-box fu4">
              <div className="stat-grid">
                <div className="stat-cell"><div className="stat-num">48h</div><div className="stat-lbl">Concept delivery with money-back guarantee</div></div>
                <div className="stat-cell"><div className="stat-num">30%</div><div className="stat-lbl">Faster than traditional design firms</div></div>
                <div className="stat-cell"><div className="stat-num">500K+</div><div className="stat-lbl">Drawings in our AI training database</div></div>
                <div className="stat-cell"><div className="stat-num">94%</div><div className="stat-lbl">First-submission accuracy rate</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="sec accent-teal scroll-reveal">
          <div className="sec-label">How It Works</div>
          <h2 className="sec-h">Your Design Journey,<br />Step by Step</h2>
          <p className="sec-p">From your first idea to permit-ready drawings — here&apos;s exactly how Kealee moves your project forward.</p>
          <div className="rail">
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-owner">1</div></div><div className="rail-body"><span className="rail-tag tag-owner">Project Owner</span><h3 className="rail-title">Tell Us About Your Project</h3><p className="rail-desc">Submit your property address, project type, square footage, budget, and goals. Takes 5 minutes.</p><div className="chips"><span className="chip">Property Details</span><span className="chip">Project Type</span><span className="chip">Budget Range</span><span className="chip">Project Goals</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-ai">2</div></div><div className="rail-body"><span className="rail-tag tag-ai">AI Generation</span><h3 className="rail-title">AI Generates Your Concept Drawings</h3><p className="rail-desc">Our AI — trained on 500,000+ construction drawings and local jurisdiction requirements — generates floor plan concepts, spatial layouts, and multiple variations within 48 hours.</p><div className="chips"><span className="chip">Floor Plan Concepts</span><span className="chip">Multiple Layouts</span><span className="chip">Spatial Analysis</span><span className="chip">48-Hour Delivery</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-teal">3</div></div><div className="rail-body"><span className="rail-tag tag-arch">Architect Review</span><h3 className="rail-title">A Licensed Architect Reviews Every Drawing</h3><p className="rail-desc">Every AI-generated concept is reviewed, refined, and approved by a licensed architect before you receive it. No exceptions, no shortcuts.</p><div className="chips"><span className="chip">Code Compliance Check</span><span className="chip">Design Refinements</span><span className="chip">Quality Assurance</span><span className="chip">Architect Approval</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-owner">4</div></div><div className="rail-body"><span className="rail-tag tag-owner">Project Owner</span><h3 className="rail-title">You Review, Approve, or Request Changes</h3><p className="rail-desc">Log into your Owner Dashboard to review concepts side by side. Leave feedback, request revisions, or approve the direction.</p><div className="chips"><span className="chip">Owner Dashboard</span><span className="chip">Side-by-Side Comparison</span><span className="chip">Revision Requests</span><span className="chip">Design Approval</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-teal">5</div></div><div className="rail-body"><span className="rail-tag tag-arch">Architecture</span><h3 className="rail-title">Upgrade to Full Architectural Drawing Set</h3><p className="rail-desc">Once your concept is approved, upgrade to a full architectural package — permit-ready drawings, structural plans, MEP coordination, 4–8 weeks, 30% faster than traditional firms.</p><div className="chips"><span className="chip">Permit-Ready Drawings</span><span className="chip">Structural Plans</span><span className="chip">MEP Coordination</span><span className="chip">4–8 Week Timeline</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-teal">6</div></div><div className="rail-body"><span className="rail-tag tag-arch">Seamless Handoff</span><h3 className="rail-title">Designs Flow Into Permits Automatically</h3><p className="rail-desc">Approved drawings automatically populate your permit applications in the Kealee Permits module. No re-uploading, no re-entering data.</p><div className="chips"><span className="chip">Auto-Populated Permits</span><span className="chip">No Data Re-Entry</span><span className="chip">Connected to Estimate &amp; Build</span></div></div></div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="sec-alt scroll-reveal">
          <div className="trust-strip">
            <div className="trust-cell"><span className="trust-icon">⚡</span><div className="trust-title">AI Does the Heavy Lifting</div><div className="trust-desc">Our AI analyzes your requirements, local zoning, and 500,000+ comparable drawings to generate accurate, jurisdiction-aware concepts faster than any manual process.</div></div>
            <div className="trust-cell"><span className="trust-icon">🏛</span><div className="trust-title">Licensed Architects Make the Call</div><div className="trust-desc">Every drawing is reviewed and approved by a licensed architect before delivery. AI accelerates the process — architects ensure it&apos;s right. No exceptions.</div></div>
            <div className="trust-cell"><span className="trust-icon">🔑</span><div className="trust-title">You Approve Every Step</div><div className="trust-desc">Your dashboard gives you real-time visibility into every drawing and revision. You approve the design before it moves to permits.</div></div>
          </div>
        </section>

        {/* PACKAGES */}
        <section className="sec scroll-reveal">
          <div className="sec-label accent-teal">Pricing</div>
          <h2 className="sec-h">Choose Your Design Path</h2>
          <p className="sec-p">Start with an AI concept to validate your vision, then upgrade to full architectural services when you&apos;re ready to build.</p>
          <div className="pkg-tabs">
            <button className={`pkg-tab ${activePkgTab === 'ai' ? 'active' : ''}`} onClick={() => switchPkg('ai')}>AI Concept Generation</button>
            <button className={`pkg-tab ${activePkgTab === 'arch' ? 'active' : ''}`} onClick={() => switchPkg('arch')}>Architecture Packages</button>
          </div>

          {/* AI Concepts */}
          <div className={`pkg-panel ${activePkgTab === 'ai' ? 'active' : ''}`}>
            <div className="pkg4">
              <div className="pcard"><div className="ptier" style={{color:'var(--teal)'}}>Starter</div><div className="pname">Concept Starter</div><div className="pprice">$99</div><div className="pprice-note">One-time · 48-hr delivery</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-teal">✓</span>2 floor plan concept variations</li><li><span className="pchk chk-teal">✓</span>Basic spatial layout analysis</li><li><span className="pchk chk-teal">✓</span>Architect-reviewed output</li><li><span className="pchk chk-teal">✓</span>1 revision round</li><li><span className="pchk chk-teal">✓</span>PDF delivery</li><li><span className="pchk chk-teal">✓</span>Money-back guarantee</li></ul><Link href="/get-started" className="pbtn pbtn-outline-teal">Get Started</Link></div>
              <div className="pcard"><div className="ptier" style={{color:'var(--teal)'}}>Standard</div><div className="pname">Concept Standard</div><div className="pprice">$299</div><div className="pprice-note">One-time · 48-hr delivery</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-teal">✓</span>4 floor plan concept variations</li><li><span className="pchk chk-teal">✓</span>Site analysis &amp; zoning review</li><li><span className="pchk chk-teal">✓</span>Architect-reviewed output</li><li><span className="pchk chk-teal">✓</span>2 revision rounds</li><li><span className="pchk chk-teal">✓</span>3D massing concept</li><li><span className="pchk chk-teal">✓</span>Money-back guarantee</li></ul><Link href="/get-started" className="pbtn pbtn-outline-teal">Get Started</Link></div>
              <div className="pcard feat"><div className="pbadge">Most Popular</div><div className="ptier" style={{color:'var(--teal-light)'}}>Professional</div><div className="pname">Concept Pro</div><div className="pprice">$599</div><div className="pprice-note">One-time · 48-hr delivery</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-white">✓</span>6 concept variations</li><li><span className="pchk chk-white">✓</span>Full site &amp; zoning analysis</li><li><span className="pchk chk-white">✓</span>Architect-reviewed &amp; annotated</li><li><span className="pchk chk-white">✓</span>3 revision rounds</li><li><span className="pchk chk-white">✓</span>3D concepts + exterior views</li><li><span className="pchk chk-white">✓</span>Preliminary cost estimate</li><li><span className="pchk chk-white">✓</span>Money-back guarantee</li></ul><Link href="/get-started" className="pbtn pbtn-gold">Get Started</Link></div>
              <div className="pcard"><div className="ptier" style={{color:'var(--teal)'}}>Enterprise</div><div className="pname">Concept Enterprise</div><div className="pprice">$899</div><div className="pprice-note">One-time · 48-hr delivery</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-teal">✓</span>Unlimited concept variations</li><li><span className="pchk chk-teal">✓</span>Multi-phase site analysis</li><li><span className="pchk chk-teal">✓</span>Senior architect lead review</li><li><span className="pchk chk-teal">✓</span>Unlimited revisions (30 days)</li><li><span className="pchk chk-teal">✓</span>Full 3D rendering package</li><li><span className="pchk chk-teal">✓</span>Detailed cost estimate</li><li><span className="pchk chk-teal">✓</span>Dedicated project coordinator</li></ul><Link href="/get-started" className="pbtn pbtn-outline-teal">Get Started</Link></div>
            </div>
          </div>

          {/* Architecture */}
          <div className={`pkg-panel ${activePkgTab === 'arch' ? 'active' : ''}`}>
            <div className="pkg2">
              <div className="pcard" style={{padding:0,overflow:'hidden'}}><div style={{background:'var(--navy)',padding:'28px 28px 24px'}}><div className="ptier" style={{color:'rgba(255,255,255,.5)'}}>Package A</div><div className="pname" style={{color:'white',fontSize:22}}>Essential Plans</div><div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:14}}>Residential additions &amp; projects under 1,500 sqft</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:700,color:'white'}}>$2,500</div></div><div style={{padding:'24px 28px'}}><div style={{display:'flex',alignItems:'center',gap:10,background:'var(--g100)',borderRadius:9,padding:'11px 14px',marginBottom:18,fontSize:'12.5px',color:'var(--g700)'}}>⏱ <strong>4–5 Weeks</strong>&nbsp;vs. 8–10 weeks traditional</div><ul className="pfeats"><li><span className="pchk chk-teal">✓</span>Floor plans &amp; elevations</li><li><span className="pchk chk-teal">✓</span>Site plan</li><li><span className="pchk chk-teal">✓</span>Permit-ready drawings</li><li><span className="pchk chk-teal">✓</span>2 revision rounds</li><li><span className="pchk chk-teal">✓</span>Architect&apos;s stamp</li></ul><Link href="/get-started" className="pbtn pbtn-outline-teal">Start Package A</Link></div></div>
              <div className="pcard feat-teal" style={{padding:0,overflow:'hidden',borderColor:'var(--teal)',boxShadow:'0 0 0 2px var(--teal),0 14px 36px rgba(26,123,110,.18)'}}><div className="pbadge">Most Requested</div><div style={{background:'var(--teal)',padding:'28px 28px 24px'}}><div className="ptier" style={{color:'rgba(255,255,255,.6)'}}>Package B</div><div className="pname" style={{color:'white',fontSize:22}}>Full Residential</div><div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:14}}>New homes, ADUs &amp; major additions up to 3,000 sqft</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:700,color:'white'}}>$7,500</div></div><div style={{padding:'24px 28px',background:'var(--cream)'}}><div style={{display:'flex',alignItems:'center',gap:10,background:'var(--svc-white)',borderRadius:9,padding:'11px 14px',marginBottom:18,fontSize:'12.5px',color:'var(--g700)'}}>⏱ <strong>5–6 Weeks</strong>&nbsp;vs. 10–14 weeks traditional</div><ul className="pfeats"><li><span className="pchk chk-teal">✓</span>Full drawing set</li><li><span className="pchk chk-teal">✓</span>Structural coordination</li><li><span className="pchk chk-teal">✓</span>MEP rough-in plans</li><li><span className="pchk chk-teal">✓</span>Energy compliance docs</li><li><span className="pchk chk-teal">✓</span>3 revision rounds + 3D views</li><li><span className="pchk chk-teal">✓</span>Architect&apos;s stamp</li><li><span className="pchk chk-teal">✓</span>Permit submission support</li></ul><Link href="/get-started" className="pbtn" style={{background:'var(--teal)',color:'white'}}>Start Package B</Link></div></div>
              <div className="pcard" style={{padding:0,overflow:'hidden'}}><div style={{background:'var(--navy-mid)',padding:'28px 28px 24px'}}><div className="ptier" style={{color:'rgba(255,255,255,.5)'}}>Package C</div><div className="pname" style={{color:'white',fontSize:22}}>Commercial Light</div><div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:14}}>Tenant improvements, retail build-outs, office spaces</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:700,color:'white'}}>$18,000</div></div><div style={{padding:'24px 28px'}}><div style={{display:'flex',alignItems:'center',gap:10,background:'var(--g100)',borderRadius:9,padding:'11px 14px',marginBottom:18,fontSize:'12.5px',color:'var(--g700)'}}>⏱ <strong>6–8 Weeks</strong>&nbsp;vs. 12–18 weeks traditional</div><ul className="pfeats"><li><span className="pchk chk-teal">✓</span>Commercial drawing set</li><li><span className="pchk chk-teal">✓</span>Structural &amp; MEP full plans</li><li><span className="pchk chk-teal">✓</span>ADA compliance review</li><li><span className="pchk chk-teal">✓</span>Fire &amp; life safety plans</li><li><span className="pchk chk-teal">✓</span>Unlimited revisions</li><li><span className="pchk chk-teal">✓</span>Permit &amp; inspection support</li></ul><Link href="/get-started" className="pbtn pbtn-outline-teal">Start Package C</Link></div></div>
              <div className="pcard" style={{padding:0,overflow:'hidden'}}><div style={{background:'var(--navy)',padding:'28px 28px 24px'}}><div className="ptier" style={{color:'rgba(255,255,255,.5)'}}>Package D</div><div className="pname" style={{color:'white',fontSize:22}}>Full Commercial</div><div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:14}}>Ground-up commercial, mixed-use &amp; complex projects</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:700,color:'white'}}>$35,000</div></div><div style={{padding:'24px 28px'}}><div style={{display:'flex',alignItems:'center',gap:10,background:'var(--g100)',borderRadius:9,padding:'11px 14px',marginBottom:18,fontSize:'12.5px',color:'var(--g700)'}}>⏱ <strong>8–12 Weeks</strong>&nbsp;vs. 18–26 weeks traditional</div><ul className="pfeats"><li><span className="pchk chk-teal">✓</span>Full commercial drawing set</li><li><span className="pchk chk-teal">✓</span>All engineering coordination</li><li><span className="pchk chk-teal">✓</span>BIM model included</li><li><span className="pchk chk-teal">✓</span>Dedicated lead architect</li><li><span className="pchk chk-teal">✓</span>3D renderings included</li><li><span className="pchk chk-teal">✓</span>Full permit management</li></ul><Link href="/get-started" className="pbtn pbtn-outline-teal">Start Package D</Link></div></div>
            </div>
          </div>
        </section>

        <section className="sec-dark cta scroll-reveal">
          <h2>Ready to See What Your<br /><em>Project Could Look Like?</em></h2>
          <p>Start with a $99 AI concept. 48-hour delivery. Money-back if you&apos;re not satisfied.</p>
          <div className="cta-btns"><Link href="/get-started" className="btn-hero-gold">Get My AI Concept — From $99</Link><Link href="/contact" className="btn-hero-outline">Talk to an Architect</Link></div>
          <p className="cta-note">All concepts reviewed and approved by a licensed architect before delivery.</p>
        </section>
      </div>

      {/* ═══════════════════════════════════════════
           PANEL 2: ESTIMATE
      ═══════════════════════════════════════════ */}
      <div className={`panel ${activePhase === 'estimate' ? 'active' : ''}`}>
        <section className="svc-hero hero-estimate">
          <div className="hero-inner">
            <div>
              <div className="hero-badge"><span className="badge-dot" /> AI-Powered Estimation · Real Cost Databases</div>
              <h1 className="fu1">Know Your Numbers<br />Before You <em>Break Ground</em></h1>
              <p className="hero-sub fu2">Kealee&apos;s AI takeoff engine analyzes your drawings and generates detailed cost estimates using real material and labor databases — in hours, not weeks.</p>
              <div className="hero-btns fu3">
                <Link href="/get-started" className="btn-hero-gold">Get Instant Estimate — $195</Link>
                <button className="btn-hero-outline" onClick={() => {}}>View All Estimation Packages</button>
              </div>
            </div>
            <div className="stat-box fu4">
              <div className="stat-grid">
                <div className="stat-cell"><div className="stat-num">2h</div><div className="stat-lbl">Average AI takeoff delivery time</div></div>
                <div className="stat-cell"><div className="stat-num">±8%</div><div className="stat-lbl">Typical accuracy vs. final bid</div></div>
                <div className="stat-cell"><div className="stat-num">150K+</div><div className="stat-lbl">Assembly line items in our database</div></div>
                <div className="stat-cell"><div className="stat-num">3x</div><div className="stat-lbl">Faster than traditional estimating</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec accent-orange scroll-reveal">
          <div className="sec-label">How It Works</div>
          <h2 className="sec-h">From Drawings to<br />Detailed Cost Report</h2>
          <p className="sec-p">Upload your drawings and let our AI do the work — backed by real construction cost data for the DC-Baltimore market.</p>
          <div className="rail">
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-owner">1</div></div><div className="rail-body"><span className="rail-tag tag-owner">Project Owner or GC</span><h3 className="rail-title">Upload Your Drawings</h3><p className="rail-desc">Upload your architectural drawings, floor plans, or even a basic concept sketch. Our system accepts PDF, CAD, and image formats.</p><div className="chips"><span className="chip">PDF Drawings</span><span className="chip">CAD Files</span><span className="chip">Concept Sketches</span><span className="chip">Square Footage Input</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-ai">2</div></div><div className="rail-body"><span className="rail-tag tag-ai">AI Takeoff</span><h3 className="rail-title">AI Performs Automated Quantity Takeoff</h3><p className="rail-desc">Our AI reads your drawings and automatically counts, measures, and calculates every material quantity — what takes estimators 2–3 days takes our AI 2 hours.</p><div className="chips"><span className="chip">Automated Measurement</span><span className="chip">Material Quantities</span><span className="chip">Scope Detection</span><span className="chip">Multi-Trade Coverage</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-orange">3</div></div><div className="rail-body"><span className="rail-tag tag-finance">Assembly Pricing</span><h3 className="rail-title">Quantities Applied to Real Cost Databases</h3><p className="rail-desc">Takeoff quantities are automatically priced using our curated DC-Baltimore construction cost databases — updated regularly with real market rates.</p><div className="chips"><span className="chip">Current Market Rates</span><span className="chip">Labor + Material</span><span className="chip">DC-MD-VA Region</span><span className="chip">Assembly Pricing</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-owner">4</div></div><div className="rail-body"><span className="rail-tag tag-owner">You Review</span><h3 className="rail-title">Review Your Detailed Cost Report</h3><p className="rail-desc">Receive a line-item cost breakdown by trade and scope. Compare scenarios. Share directly with your lender, GC, or investment partners.</p><div className="chips"><span className="chip">Line-Item Breakdown</span><span className="chip">Trade-by-Trade View</span><span className="chip">Scenario Comparison</span><span className="chip">Shareable PDF Report</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-orange">5</div></div><div className="rail-body"><span className="rail-tag tag-gc">For GCs &amp; Contractors</span><h3 className="rail-title">Use Estimates to Generate &amp; Submit Bids</h3><p className="rail-desc">GCs can use the AI estimate as the foundation for formal bid submissions — adding markup, subcontractor quotes, and overhead.</p><div className="chips"><span className="chip">Bid Generation</span><span className="chip">Markup Tools</span><span className="chip">Sub-Quote Integration</span><span className="chip">Direct Bid Submission</span></div></div></div>
          </div>
        </section>

        <section className="sec-alt scroll-reveal">
          <div className="sec-label accent-orange">Estimation Packages</div>
          <h2 className="sec-h">Estimation Services</h2>
          <p className="sec-p">Seven service levels from quick ballpark figures to comprehensive bid-ready takeoffs.</p>
          <div className="pkg3">
            <div className="pcard"><div className="ptier" style={{color:'var(--orange)'}}>Quick</div><div className="pname">Ballpark Estimate</div><div className="pprice">$195</div><div className="pprice-note">Delivered in 2 hours</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-orange">✓</span>Sq ft-based cost range</li><li><span className="pchk chk-orange">✓</span>3-category breakdown</li><li><span className="pchk chk-orange">✓</span>Regional cost index applied</li><li><span className="pchk chk-orange">✓</span>PDF summary report</li></ul><Link href="/get-started" className="pbtn pbtn-outline-orange">Order Now</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--orange)'}}>Standard</div><div className="pname">Concept Estimate</div><div className="pprice">$495</div><div className="pprice-note">Delivered in 4 hours</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-orange">✓</span>Trade-by-trade breakdown</li><li><span className="pchk chk-orange">✓</span>Material &amp; labor separated</li><li><span className="pchk chk-orange">✓</span>2 finish-level scenarios</li><li><span className="pchk chk-orange">✓</span>DC-MD-VA cost data</li><li><span className="pchk chk-orange">✓</span>Shareable report</li></ul><Link href="/get-started" className="pbtn pbtn-outline-orange">Order Now</Link></div>
            <div className="pcard feat" style={{background:'var(--orange)',borderColor:'var(--orange)'}}><div className="pbadge">Most Used</div><div className="ptier" style={{color:'rgba(255,255,255,.6)'}}>Professional</div><div className="pname" style={{color:'white'}}>Full AI Takeoff</div><div className="pprice" style={{color:'rgba(255,255,255,.95)'}}>$995</div><div className="pprice-note" style={{color:'rgba(255,255,255,.5)'}}>Delivered in 24 hours</div><div className="pdiv" style={{background:'rgba(255,255,255,.2)'}} /><ul className="pfeats"><li><span className="pchk chk-white">✓</span>Drawing-based AI takeoff</li><li><span className="pchk chk-white">✓</span>Full quantity extraction</li><li><span className="pchk chk-white">✓</span>Line-item pricing</li><li><span className="pchk chk-white">✓</span>3 scenario comparisons</li><li><span className="pchk chk-white">✓</span>GC-ready bid format</li><li><span className="pchk chk-white">✓</span>Estimator review included</li></ul><Link href="/get-started" className="pbtn pbtn-gold">Order Now</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--orange)'}}>Commercial</div><div className="pname">Commercial Takeoff</div><div className="pprice">$2,495</div><div className="pprice-note">Delivered in 48 hours</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-orange">✓</span>Full commercial scope</li><li><span className="pchk chk-orange">✓</span>Multi-trade takeoff</li><li><span className="pchk chk-orange">✓</span>CSI division format</li><li><span className="pchk chk-orange">✓</span>Spec-based pricing</li><li><span className="pchk chk-orange">✓</span>Bid-ready output</li></ul><Link href="/get-started" className="pbtn pbtn-outline-orange">Order Now</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--orange)'}}>Enterprise</div><div className="pname">Full Bid Package</div><div className="pprice">$5,995</div><div className="pprice-note">Delivered in 3–5 days</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-orange">✓</span>Complete bid documentation</li><li><span className="pchk chk-orange">✓</span>Subcontractor scope letters</li><li><span className="pchk chk-orange">✓</span>Subcontractor bid solicitation</li><li><span className="pchk chk-orange">✓</span>Budget reconciliation</li><li><span className="pchk chk-orange">✓</span>GC overhead &amp; profit model</li><li><span className="pchk chk-orange">✓</span>Dedicated estimator</li></ul><Link href="/get-started" className="pbtn pbtn-outline-orange">Order Now</Link></div>
          </div>
        </section>

        <section className="sec-dark cta scroll-reveal">
          <h2>Stop Guessing.<br /><em>Know Your Numbers.</em></h2>
          <p>AI takeoff in hours. Real market rates. Built for the DC-Baltimore corridor.</p>
          <div className="cta-btns"><Link href="/get-started" className="btn-hero-gold">Get AI Estimate — From $195</Link><Link href="/contact" className="btn-hero-outline">Talk to an Estimator</Link></div>
          <p className="cta-note">Estimates reviewed by a senior estimator before delivery.</p>
        </section>
      </div>

      {/* ═══════════════════════════════════════════
           PANEL 3: PERMIT
      ═══════════════════════════════════════════ */}
      <div className={`panel ${activePhase === 'permit' ? 'active' : ''}`}>
        <section className="svc-hero hero-permit">
          <div className="hero-inner">
            <div>
              <div className="hero-badge"><span className="badge-dot" /> AI Permit Review · Electronic Submission · 30% Faster</div>
              <h1 className="fu1">Permits Approved.<br /><em>Faster Than You Think</em><br />Possible.</h1>
              <p className="hero-sub fu2">Kealee&apos;s AI pre-screens your drawings for jurisdiction-specific code compliance, auto-fills application forms, and submits electronically — cutting the typical permit timeline by 30% or more.</p>
              <div className="hero-btns fu3">
                <Link href="/get-started" className="btn-hero-gold">Start Permit — From $495</Link>
                <button className="btn-hero-outline" onClick={() => {}}>View All Permit Packages</button>
              </div>
            </div>
            <div className="stat-box fu4">
              <div className="stat-grid">
                <div className="stat-cell"><div className="stat-num">30%</div><div className="stat-lbl">Faster permit approval vs. manual submission</div></div>
                <div className="stat-cell"><div className="stat-num">250+</div><div className="stat-lbl">DC-MD-VA jurisdictions covered</div></div>
                <div className="stat-cell"><div className="stat-num">AI</div><div className="stat-lbl">Pre-screens every drawing before submission</div></div>
                <div className="stat-cell"><div className="stat-num">Auto</div><div className="stat-lbl">Form filling from your approved drawings</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec accent-green scroll-reveal">
          <div className="sec-label">Process</div>
          <h2 className="sec-h">From Approved Design<br />to Permit in Hand</h2>
          <p className="sec-p">Your approved Kealee drawings flow directly into the permit module — no re-entering data.</p>
          <div className="rail">
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-ai">1</div></div><div className="rail-body"><span className="rail-tag tag-ai">AI Pre-Check</span><h3 className="rail-title">AI Screens Drawings for Code Compliance</h3><p className="rail-desc">Our AI reviews your drawings against the specific code requirements of your jurisdiction — catching issues that would cause rejection before they reach the plan examiner.</p><div className="chips"><span className="chip">Jurisdiction-Specific Codes</span><span className="chip">Pre-Submission Review</span><span className="chip">Issue Flagging</span><span className="chip">Correction Guidance</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-ai">2</div></div><div className="rail-body"><span className="rail-tag tag-ai">Auto Form Filling</span><h3 className="rail-title">Applications Auto-Filled from Your Project Data</h3><p className="rail-desc">Every permit application form is automatically populated from your Kealee project. No copy-pasting, no manual entry errors.</p><div className="chips"><span className="chip">Auto-Populated Forms</span><span className="chip">Project Data Sync</span><span className="chip">Error Reduction</span><span className="chip">Multi-Jurisdiction Support</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-green">3</div></div><div className="rail-body"><span className="rail-tag tag-govt">Electronic Submission</span><h3 className="rail-title">Electronic Submission to Your Jurisdiction</h3><p className="rail-desc">Kealee submits permit applications electronically through established digital portals — ePlans, ProjectDox, Energov — skipping the counter line entirely.</p><div className="chips"><span className="chip">Electronic Portals</span><span className="chip">ePlans / ProjectDox</span><span className="chip">Status Tracking</span><span className="chip">Real-Time Updates</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-owner">4</div></div><div className="rail-body"><span className="rail-tag tag-owner">Your Dashboard</span><h3 className="rail-title">Track Status in Real Time</h3><p className="rail-desc">Log in anytime to see exactly where your permit stands. No calling the permit office. No guessing.</p><div className="chips"><span className="chip">Real-Time Status</span><span className="chip">Stage Notifications</span><span className="chip">Comment Tracking</span><span className="chip">Document Management</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-green">5</div></div><div className="rail-body"><span className="rail-tag tag-govt">Comment Response</span><h3 className="rail-title">We Handle Plan Review Comments</h3><p className="rail-desc">When the plan examiner issues comments, our team reviews them, coordinates revisions with your architect, and resubmits.</p><div className="chips"><span className="chip">Comment Management</span><span className="chip">Revision Coordination</span><span className="chip">Architect Coordination</span><span className="chip">Resubmission Handling</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-green">6</div></div><div className="rail-body"><span className="rail-tag tag-govt">Permit Issued</span><h3 className="rail-title">Permit Approved — Move to Build Phase</h3><p className="rail-desc">Once approved, your permit documents trigger your Build phase setup — contractor matching, PM software configuration, and inspection scheduling.</p><div className="chips"><span className="chip">Permit Storage</span><span className="chip">Auto Build Phase Trigger</span><span className="chip">Inspection Scheduling</span><span className="chip">Contractor Matching Ready</span></div></div></div>
          </div>
        </section>

        <section className="sec-alt scroll-reveal">
          <div className="sec-label accent-green">Permit Packages</div>
          <h2 className="sec-h">Permit Services Pricing</h2>
          <p className="sec-p">From single-trade permits to full commercial permit management — covered for DC, Maryland, and Virginia jurisdictions.</p>
          <div className="pkg4">
            <div className="pcard"><div className="ptier" style={{color:'var(--green)'}}>Package A</div><div className="pname">Permit Starter</div><div className="pprice">$495</div><div className="pprice-note">Simple residential permits</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-green">✓</span>Single-trade permits</li><li><span className="pchk chk-green">✓</span>AI code pre-check</li><li><span className="pchk chk-green">✓</span>Auto form filling</li><li><span className="pchk chk-green">✓</span>Electronic submission</li><li><span className="pchk chk-green">✓</span>Status tracking</li></ul><Link href="/get-started" className="pbtn pbtn-outline-green">Get Started</Link></div>
            <div className="pcard feat-green"><div className="pbadge">Most Popular</div><div className="ptier" style={{color:'rgba(255,255,255,.6)'}}>Package B</div><div className="pname" style={{color:'white'}}>Full Residential</div><div className="pprice" style={{color:'rgba(255,255,255,.95)'}}>$1,500</div><div className="pprice-note" style={{color:'rgba(255,255,255,.5)'}}>New homes, additions, ADUs</div><div className="pdiv" style={{background:'rgba(255,255,255,.2)'}} /><ul className="pfeats"><li><span className="pchk chk-white">✓</span>All trade permits</li><li><span className="pchk chk-white">✓</span>Full AI code review</li><li><span className="pchk chk-white">✓</span>Comment management</li><li><span className="pchk chk-white">✓</span>Revision coordination</li><li><span className="pchk chk-white">✓</span>Inspection scheduling</li><li><span className="pchk chk-white">✓</span>Dedicated permit coordinator</li></ul><Link href="/get-started" className="pbtn pbtn-gold">Get Started</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--green)'}}>Package C</div><div className="pname">Commercial Light</div><div className="pprice">$3,500</div><div className="pprice-note">Tenant improvements, retail</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-green">✓</span>Commercial permit set</li><li><span className="pchk chk-green">✓</span>ADA &amp; fire code review</li><li><span className="pchk chk-green">✓</span>Multi-agency coordination</li><li><span className="pchk chk-green">✓</span>Full comment management</li><li><span className="pchk chk-green">✓</span>Certificate of occupancy</li></ul><Link href="/get-started" className="pbtn pbtn-outline-green">Get Started</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--green)'}}>Package D</div><div className="pname">Full Commercial</div><div className="pprice">$7,500</div><div className="pprice-note">Ground-up commercial projects</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-green">✓</span>All commercial permits</li><li><span className="pchk chk-green">✓</span>Multi-jurisdiction mgmt</li><li><span className="pchk chk-green">✓</span>Utility coordination</li><li><span className="pchk chk-green">✓</span>Expediting services</li><li><span className="pchk chk-green">✓</span>All CO applications</li><li><span className="pchk chk-green">✓</span>Dedicated permit manager</li></ul><Link href="/get-started" className="pbtn pbtn-outline-green">Get Started</Link></div>
          </div>
        </section>

        <section className="sec-dark cta scroll-reveal">
          <h2>Stop Waiting at the<br /><em>Permit Counter.</em></h2>
          <p>AI-reviewed applications. Electronic submission. Real-time tracking across 250+ DC-MD-VA jurisdictions.</p>
          <div className="cta-btns"><Link href="/get-started" className="btn-hero-gold">Start Your Permit — From $495</Link><Link href="/contact" className="btn-hero-outline">Talk to a Permit Coordinator</Link></div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════
           PANEL 4: BUILD
      ═══════════════════════════════════════════ */}
      <div className={`panel ${activePhase === 'build' ? 'active' : ''}`}>
        <section className="svc-hero hero-build">
          <div className="hero-inner">
            <div>
              <div className="hero-badge"><span className="badge-dot" /> PM Software · Operations · Ops Services for GCs</div>
              <h1 className="fu1">Where Plans Become<br /><em>Buildings.</em></h1>
              <p className="hero-sub fu2">Kealee&apos;s Build phase serves two audiences: Project Owners who need visibility and control, and GCs who need serious construction management tools to run the job.</p>
              <div className="hero-btns fu3">
                <Link href="/owner" className="btn-hero-gold">Owner Portal — From $49/mo</Link>
                <Link href="/ops" className="btn-hero-outline">GC &amp; Builder Tools</Link>
              </div>
            </div>
            <div className="stat-box fu4">
              <div className="stat-grid">
                <div className="stat-cell"><div className="stat-num">14</div><div className="stat-lbl">Command center automation mini-apps</div></div>
                <div className="stat-cell"><div className="stat-num">Real</div><div className="stat-lbl">Time site check-in, GPS &amp; biometric</div></div>
                <div className="stat-cell"><div className="stat-num">AI</div><div className="stat-lbl">Powered daily logs, RFI &amp; decision engine</div></div>
                <div className="stat-cell"><div className="stat-num">Full</div><div className="stat-lbl">Financial controls, escrow &amp; change orders</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* TWO-AUDIENCE SPLIT */}
        <section className="sec scroll-reveal">
          <div className="sec-label accent-navy">Two Audiences. One Platform.</div>
          <h2 className="sec-h">Who Uses the Build Phase?</h2>
          <p className="sec-p">The Build phase is purpose-built for two distinct users — and both are served within the same connected ecosystem.</p>
          <div className="audience-split">
            <div className="aud-pane aud-pane-owner">
              <div className="aud-eyebrow">For Homeowners &amp; Project Owners</div>
              <div className="aud-title">Stay Informed.<br />Stay in Control.<br />Without Micromanaging.</div>
              <div className="aud-desc">Your project is live. Kealee keeps you connected to everything happening on site — without you needing to be there every day.</div>
              <ul className="aud-list">
                <li><span className="pchk chk-white" style={{flexShrink:0}}>✓</span>Real-time project timeline &amp; milestone tracking</li>
                <li><span className="pchk chk-white" style={{flexShrink:0}}>✓</span>Daily photo &amp; progress log updates from the field</li>
                <li><span className="pchk chk-white" style={{flexShrink:0}}>✓</span>Change order review &amp; approval</li>
                <li><span className="pchk chk-white" style={{flexShrink:0}}>✓</span>Budget vs. actual spend dashboard</li>
                <li><span className="pchk chk-white" style={{flexShrink:0}}>✓</span>Escrow-controlled payment releases</li>
                <li><span className="pchk chk-white" style={{flexShrink:0}}>✓</span>Inspection scheduling &amp; results</li>
                <li><span className="pchk chk-white" style={{flexShrink:0}}>✓</span>Direct contractor messaging — all documented</li>
              </ul>
              <Link href="/owner" className="aud-btn aud-btn-gold">View Owner Portal Plans</Link>
            </div>
            <div className="aud-pane aud-pane-gc">
              <div className="aud-eyebrow">For GCs, Builders &amp; Contractors</div>
              <div className="aud-title">Run the Job.<br />Not the Paperwork.</div>
              <div className="aud-desc">Kealee&apos;s Ops Services and PM Software give contractors the command center tools to manage crews, track costs, handle RFIs, and keep the job moving.</div>
              <ul className="aud-list">
                <li><span className="pchk chk-navy" style={{flexShrink:0}}>✓</span>Command center: 14 AI-powered automation mini-apps</li>
                <li><span className="pchk chk-navy" style={{flexShrink:0}}>✓</span>GPS &amp; biometric crew check-in</li>
                <li><span className="pchk chk-navy" style={{flexShrink:0}}>✓</span>AI-generated daily logs from field data</li>
                <li><span className="pchk chk-navy" style={{flexShrink:0}}>✓</span>RFI management, submittals &amp; change orders</li>
                <li><span className="pchk chk-navy" style={{flexShrink:0}}>✓</span>Bid pipeline &amp; subcontractor coordination</li>
                <li><span className="pchk chk-navy" style={{flexShrink:0}}>✓</span>Budget tracking, cost codes &amp; WBS</li>
                <li><span className="pchk chk-navy" style={{flexShrink:0}}>✓</span>Safety incident tracking &amp; SOP management</li>
              </ul>
              <Link href="/ops" className="aud-btn aud-btn-navy">View GC &amp; Builder Tools</Link>
            </div>
          </div>
        </section>

        {/* OWNER PM PACKAGES */}
        <section className="sec-alt scroll-reveal">
          <div className="sec-label accent-navy">Project Owner Plans</div>
          <h2 className="sec-h">Owner Portal &amp; PM Packages</h2>
          <p className="sec-p">Monthly plans for project owners who want full visibility and control of their active construction project.</p>
          <div className="pkg4">
            <div className="pcard"><div className="ptier" style={{color:'var(--navy)'}}>Package A</div><div className="pname">Owner Basic</div><div className="pprice">$49</div><div className="pprice-note">per month</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-navy">✓</span>Project timeline view</li><li><span className="pchk chk-navy">✓</span>Milestone tracking</li><li><span className="pchk chk-navy">✓</span>Document storage</li><li><span className="pchk chk-navy">✓</span>Contractor messaging</li><li><span className="pchk chk-navy">✓</span>Inspection calendar</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Get Started</Link></div>
            <div className="pcard feat"><div className="pbadge">Most Popular</div><div className="ptier" style={{color:'rgba(255,255,255,.55)'}}>Package B</div><div className="pname">Owner Pro</div><div className="pprice">$149</div><div className="pprice-note" style={{color:'rgba(255,255,255,.45)'}}>per month</div><div className="pdiv" style={{background:'rgba(255,255,255,.15)'}} /><ul className="pfeats"><li><span className="pchk chk-white">✓</span>Everything in Basic</li><li><span className="pchk chk-white">✓</span>Budget vs. actuals dashboard</li><li><span className="pchk chk-white">✓</span>Change order approvals</li><li><span className="pchk chk-white">✓</span>Photo &amp; daily log feed</li><li><span className="pchk chk-white">✓</span>Escrow release controls</li><li><span className="pchk chk-white">✓</span>Mobile app access</li></ul><Link href="/get-started" className="pbtn pbtn-gold">Get Started</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--navy)'}}>Package C</div><div className="pname">Owner Plus</div><div className="pprice">$499</div><div className="pprice-note">per month</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-navy">✓</span>Everything in Pro</li><li><span className="pchk chk-navy">✓</span>Multiple projects</li><li><span className="pchk chk-navy">✓</span>Lien waiver tracking</li><li><span className="pchk chk-navy">✓</span>Insurance tracking</li><li><span className="pchk chk-navy">✓</span>Dedicated PM support</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Get Started</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--navy)'}}>Package D</div><div className="pname">Owner Enterprise</div><div className="pprice">$999</div><div className="pprice-note">per month</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-navy">✓</span>Everything in Plus</li><li><span className="pchk chk-navy">✓</span>Unlimited projects</li><li><span className="pchk chk-navy">✓</span>White-glove onboarding</li><li><span className="pchk chk-navy">✓</span>Custom reporting</li><li><span className="pchk chk-navy">✓</span>API access</li><li><span className="pchk chk-navy">✓</span>Dedicated account manager</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Get Started</Link></div>
          </div>
        </section>

        {/* GC PM + OPS */}
        <section className="sec scroll-reveal">
          <div className="gc-badge"><span>For GCs, Builders &amp; Contractors Only</span></div>
          <div className="sec-label accent-navy">Ops Services &amp; PM Software</div>
          <h2 className="sec-h">Command Center for<br />Construction Professionals</h2>
          <p className="sec-p">11 a la carte Ops Services and PM software packages — built for the way GCs actually run jobs.</p>

          <h3 style={{fontSize:20,fontWeight:600,color:'var(--navy)',marginBottom:24,paddingBottom:14,borderBottom:'1px solid var(--g200)'}}>PM Software Packages</h3>
          <div className="pkg4" style={{marginBottom:56}}>
            <div className="pcard"><div className="ptier" style={{color:'var(--navy)'}}>PM Package A</div><div className="pname">Field Basic</div><div className="pprice">$1,750</div><div className="pprice-note">per month</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-navy">✓</span>Project scheduling</li><li><span className="pchk chk-navy">✓</span>Crew check-in (GPS)</li><li><span className="pchk chk-navy">✓</span>Daily logs</li><li><span className="pchk chk-navy">✓</span>Document management</li><li><span className="pchk chk-navy">✓</span>1 active project</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Start PM A</Link></div>
            <div className="pcard feat"><div className="pbadge">Most Used</div><div className="ptier" style={{color:'rgba(255,255,255,.55)'}}>PM Package B</div><div className="pname">Field Pro</div><div className="pprice">$4,500</div><div className="pprice-note" style={{color:'rgba(255,255,255,.45)'}}>per month</div><div className="pdiv" style={{background:'rgba(255,255,255,.15)'}} /><ul className="pfeats"><li><span className="pchk chk-white">✓</span>Everything in A</li><li><span className="pchk chk-white">✓</span>RFI &amp; submittal tracking</li><li><span className="pchk chk-white">✓</span>Change order management</li><li><span className="pchk chk-white">✓</span>Budget &amp; cost codes</li><li><span className="pchk chk-white">✓</span>AI daily log generation</li><li><span className="pchk chk-white">✓</span>Up to 5 projects</li></ul><Link href="/get-started" className="pbtn pbtn-gold">Start PM B</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--navy)'}}>PM Package C</div><div className="pname">Command Center</div><div className="pprice">$9,500</div><div className="pprice-note">per month</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-navy">✓</span>Everything in B</li><li><span className="pchk chk-navy">✓</span>All 14 automation apps</li><li><span className="pchk chk-navy">✓</span>Prediction engine</li><li><span className="pchk chk-navy">✓</span>QA inspection module</li><li><span className="pchk chk-navy">✓</span>Safety &amp; SOP management</li><li><span className="pchk chk-navy">✓</span>Up to 15 projects</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Start PM C</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--navy)'}}>PM Package D</div><div className="pname">Enterprise GC</div><div className="pprice">$16,500</div><div className="pprice-note">per month</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-navy">✓</span>Everything in C</li><li><span className="pchk chk-navy">✓</span>Unlimited projects</li><li><span className="pchk chk-navy">✓</span>Custom workflows</li><li><span className="pchk chk-navy">✓</span>API integration</li><li><span className="pchk chk-navy">✓</span>Dedicated success team</li><li><span className="pchk chk-navy">✓</span>White-label available</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Start PM D</Link></div>
          </div>

          <h3 style={{fontSize:20,fontWeight:600,color:'var(--navy)',marginBottom:8}}>Ops Services — A La Carte</h3>
          <p style={{fontSize:14,color:'var(--g500)',marginBottom:28,fontWeight:300}}>Add individual services to any PM package or standalone.</p>
          <div className="ops-grid">
            {([
              { icon: '📍', price: '$125', note: '/mo', name: 'GPS Crew Check-In', desc: 'Biometric and GPS-verified field check-in. Know who\'s on site, when they arrived.' },
              { icon: '📋', price: '$195', note: '/mo', name: 'AI Daily Logs', desc: 'AI generates daily construction logs from field photos, check-in data, and task completions.' },
              { icon: '🔧', price: '$195', note: '/mo', name: 'RFI Management', desc: 'Issue, track, and resolve RFIs with automated routing to architects and engineers.' },
              { icon: '📤', price: '$195', note: '/mo', name: 'Submittal Tracking', desc: 'Manage submittals — shop drawings, product data, samples — with automatic routing.' },
              { icon: '💰', price: '$295', note: '/mo', name: 'Budget & Cost Codes', desc: 'WBS cost coding, budget vs. actual tracking, and committed cost forecasting.' },
              { icon: '⚠️', price: '$195', note: '/mo', name: 'Safety Incident Tracking', desc: 'Log, track, and report safety incidents and near-misses. OSHA-ready documentation.' },
              { icon: '📊', price: '$295', note: '/mo', name: 'Prediction Engine', desc: 'AI analyzes your project to predict schedule delays, budget overruns, and quality risks.' },
              { icon: '🔍', price: '$395', note: '/mo', name: 'QA Inspection Module', desc: 'Digital quality control checklists, photo documentation, punch list management.' },
              { icon: '📝', price: '$295', note: '/mo', name: 'Meeting Management', desc: 'Schedule, run, and document OAC meetings. Auto-generate meeting minutes.' },
              { icon: '📐', price: '$495', note: '/mo', name: 'AI Takeoff (Field)', desc: 'In-field quantity verification and scope change documentation.' },
              { icon: '📖', price: '$125', note: '/mo', name: 'SOP Management', desc: 'Store, distribute, and track acknowledgment of standard operating procedures.' },
            ]).map(svc => (
              <div key={svc.name} className="ops-card">
                <span className="ops-icon">{svc.icon}</span>
                <div className="ops-price-row"><span className="ops-price">{svc.price}</span><span className="ops-price-note">{svc.note}</span></div>
                <div className="ops-name">{svc.name}</div>
                <div className="ops-desc">{svc.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="sec-dark cta scroll-reveal">
          <h2>Ready to Run a<br /><em>Tighter Job?</em></h2>
          <p>Owner portal or GC command center — Kealee has the build tools your project needs.</p>
          <div className="cta-btns"><Link href="/owner" className="btn-hero-gold">Start Owner Portal — $49/mo</Link><Link href="/ops" className="btn-hero-outline">Explore GC &amp; Builder Plans</Link></div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════
           PANEL 5: CLOSEOUT
      ═══════════════════════════════════════════ */}
      <div className={`panel ${activePhase === 'closeout' ? 'active' : ''}`}>
        <section className="svc-hero hero-closeout">
          <div className="hero-inner">
            <div>
              <div className="hero-badge"><span className="badge-dot" /> Escrow Payments · Final Walkthrough · Protected Until Done</div>
              <h1 className="fu1">Close Strong.<br />Get Paid.<br /><em>Move On.</em></h1>
              <p className="hero-sub fu2">Kealee&apos;s Closeout phase protects both sides — escrow-controlled final payments ensure contractors get paid when work is complete, and owners aren&apos;t stuck holding the bag.</p>
              <div className="hero-btns fu3">
                <Link href="/get-started" className="btn-hero-gold">Set Up Closeout Escrow</Link>
                <Link href="/finance" className="btn-hero-outline">View Finance Services</Link>
              </div>
            </div>
            <div className="stat-box fu4">
              <div className="stat-grid">
                <div className="stat-cell"><div className="stat-num">100%</div><div className="stat-lbl">Escrow-protected final payment releases</div></div>
                <div className="stat-cell"><div className="stat-num">AI</div><div className="stat-lbl">Punch list generation from walkthrough photos</div></div>
                <div className="stat-cell"><div className="stat-num">Auto</div><div className="stat-lbl">Lien waiver collection before payment release</div></div>
                <div className="stat-cell"><div className="stat-num">Full</div><div className="stat-lbl">Certificate of occupancy support included</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* ESCROW FLOW */}
        <section className="sec accent-gold scroll-reveal">
          <div className="sec-label">Escrow Flow</div>
          <h2 className="sec-h">How Closeout Escrow Works</h2>
          <p className="sec-p">Both parties protected. Money held in escrow. Released only when work is done and verified.</p>
          <div className="escrow-flow" style={{marginBottom:56}}>
            <div className="ef-step"><div className="ef-circle" style={{background:'#FEF3C7'}}>💰</div><div className="ef-title">Funds Deposited</div><div className="ef-desc">Owner deposits final payment into Kealee escrow</div></div>
            <div className="ef-step"><div className="ef-circle" style={{background:'#EFF6FF'}}>📋</div><div className="ef-title">Punch List Issued</div><div className="ef-desc">AI-assisted walkthrough generates comprehensive punch list</div></div>
            <div className="ef-step"><div className="ef-circle" style={{background:'#F0FDF4'}}>🔧</div><div className="ef-title">Items Resolved</div><div className="ef-desc">Contractor completes items with photo documentation</div></div>
            <div className="ef-step"><div className="ef-circle" style={{background:'#FFF7ED'}}>📜</div><div className="ef-title">Lien Waivers Collected</div><div className="ef-desc">All subcontractor and supplier lien waivers verified</div></div>
            <div className="ef-step"><div className="ef-circle" style={{background:'#ECFDF5'}}>✅</div><div className="ef-title">Payment Released</div><div className="ef-desc">Escrow released upon owner final acceptance</div></div>
          </div>

          <div className="rail">
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-owner">1</div></div><div className="rail-body"><span className="rail-tag tag-owner">Project Owner</span><h3 className="rail-title">Schedule Final Walkthrough</h3><p className="rail-desc">When your contractor declares substantial completion, schedule your final walkthrough through Kealee.</p><div className="chips"><span className="chip">Scheduling Tool</span><span className="chip">Multi-Party Coordination</span><span className="chip">Automated Reminders</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-ai">2</div></div><div className="rail-body"><span className="rail-tag tag-ai">AI Punch List</span><h3 className="rail-title">AI-Assisted Punch List Generation</h3><p className="rail-desc">Document issues with photos in the Kealee mobile app. Our AI categorizes deficiencies, assigns responsible trades, and generates a formatted punch list.</p><div className="chips"><span className="chip">Photo Documentation</span><span className="chip">AI Categorization</span><span className="chip">Trade Assignment</span><span className="chip">Priority Ranking</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-gold">3</div></div><div className="rail-body"><span className="rail-tag tag-finance">Punch List Resolution</span><h3 className="rail-title">Contractor Resolves Items — You Verify Each One</h3><p className="rail-desc">The contractor updates each item as completed with photo evidence. You verify and sign off on each closure.</p><div className="chips"><span className="chip">Photo Verification</span><span className="chip">Owner Sign-Off</span><span className="chip">Item-by-Item Tracking</span><span className="chip">Dispute Resolution</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-gold">4</div></div><div className="rail-body"><span className="rail-tag tag-finance">Lien Protection</span><h3 className="rail-title">Lien Waivers Collected Before Release</h3><p className="rail-desc">Kealee automatically requests and tracks lien waivers from all subcontractors and suppliers. No payment released until all waivers verified.</p><div className="chips"><span className="chip">Conditional Lien Waivers</span><span className="chip">Unconditional Waivers</span><span className="chip">Supplier Coverage</span><span className="chip">Legal Protection</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-gold">5</div></div><div className="rail-body"><span className="rail-tag tag-finance">Certificate of Occupancy</span><h3 className="rail-title">CO Application &amp; Final Inspections</h3><p className="rail-desc">Our permit team coordinates all final inspections and manages the Certificate of Occupancy application.</p><div className="chips"><span className="chip">Final Inspections</span><span className="chip">CO Application</span><span className="chip">Jurisdiction Coordination</span><span className="chip">Document Storage</span></div></div></div>
            <div className="rail-step"><div className="rail-num"><div className="step-ball ball-gold">6</div></div><div className="rail-body"><span className="rail-tag tag-finance">Escrow Release</span><h3 className="rail-title">Final Payment Released — Project Closed</h3><p className="rail-desc">Once all items are verified, waivers collected, and CO issued, the escrow balance is released. Your project record is archived with all documentation.</p><div className="chips"><span className="chip">Full Documentation Archive</span><span className="chip">Warranty Tracking</span><span className="chip">Project Record</span><span className="chip">Secure Escrow Release</span></div></div></div>
          </div>
        </section>

        {/* FINANCE PACKAGES */}
        <section className="sec-alt scroll-reveal">
          <div className="sec-label accent-gold">Finance Services</div>
          <h2 className="sec-h">Trust, Escrow &amp; Financial<br />Services for Your Project</h2>
          <p className="sec-p">Kealee&apos;s Finance/Trust portal manages all money movement throughout your project.</p>
          <div className="pkg3">
            <div className="pcard"><div className="ptier" style={{color:'var(--gold)'}}>Escrow Basic</div><div className="pname">Payment Protection</div><div className="pprice">1.5%</div><div className="pprice-note">of funds held · min. $150</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-gold">✓</span>Milestone-based escrow</li><li><span className="pchk chk-gold">✓</span>Owner-controlled releases</li><li><span className="pchk chk-gold">✓</span>Payment dashboard</li><li><span className="pchk chk-gold">✓</span>Transaction records</li><li><span className="pchk chk-gold">✓</span>FDIC-insured accounts</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Set Up Escrow</Link></div>
            <div className="pcard feat-gold"><div className="pbadge">Recommended</div><div className="ptier" style={{color:'rgba(255,255,255,.65)'}}>Escrow Pro</div><div className="pname" style={{color:'white'}}>Full Closeout Package</div><div className="pprice" style={{color:'rgba(255,255,255,.95)'}}>2%</div><div className="pprice-note" style={{color:'rgba(255,255,255,.5)'}}>of total contract value</div><div className="pdiv" style={{background:'rgba(255,255,255,.2)'}} /><ul className="pfeats"><li><span className="pchk chk-white">✓</span>Everything in Basic</li><li><span className="pchk chk-white">✓</span>Lien waiver collection</li><li><span className="pchk chk-white">✓</span>Punch list management</li><li><span className="pchk chk-white">✓</span>CO coordination</li><li><span className="pchk chk-white">✓</span>Dispute resolution support</li><li><span className="pchk chk-white">✓</span>Final walkthrough tools</li><li><span className="pchk chk-white">✓</span>Full documentation archive</li></ul><Link href="/get-started" className="pbtn pbtn-navy">Get Started</Link></div>
            <div className="pcard"><div className="ptier" style={{color:'var(--gold)'}}>Enterprise Finance</div><div className="pname">Construction Accounting</div><div className="pprice">$599</div><div className="pprice-note">per month</div><div className="pdiv" /><ul className="pfeats"><li><span className="pchk chk-gold">✓</span>Full project accounting</li><li><span className="pchk chk-gold">✓</span>Job costing &amp; WBS</li><li><span className="pchk chk-gold">✓</span>Schedule of values</li><li><span className="pchk chk-gold">✓</span>AIA draw management</li><li><span className="pchk chk-gold">✓</span>Retainage tracking</li><li><span className="pchk chk-gold">✓</span>Contractor payment reports</li></ul><Link href="/get-started" className="pbtn pbtn-outline-navy">Get Started</Link></div>
          </div>
        </section>

        <section className="sec-dark cta scroll-reveal">
          <h2>Close Your Project<br /><em>the Right Way.</em></h2>
          <p>Escrow protection, lien waivers, punch list management, and CO support — all in one place.</p>
          <div className="cta-btns"><Link href="/get-started" className="btn-hero-gold">Set Up Closeout Escrow</Link><Link href="/contact" className="btn-hero-outline">Talk to Our Finance Team</Link></div>
          <p className="cta-note">FDIC-insured escrow accounts. All transactions documented and audited.</p>
        </section>
      </div>

    </div>
  )
}
