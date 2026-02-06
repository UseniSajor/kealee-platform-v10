import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// KEALEE PLATFORM DESIGN SYSTEM — PART 2
// Prompts 5-21: Dashboard, AI Features, CSI, Mobile Flow, etc.
// ═══════════════════════════════════════════════════════════════

const C = {
  navy: "#1A2B4A", navyLight: "#243556", navy800: "#1a2744", navy900: "#0F1A2E", navy950: "#0a1220",
  orange: "#E8793A", orangeHover: "#D4682F", orangeSoft: "rgba(232,121,58,0.08)", orangeBorder: "rgba(232,121,58,0.18)",
  teal: "#2ABFBF", tealSoft: "rgba(42,191,191,0.08)", tealBorder: "rgba(42,191,191,0.18)", tealDark: "#1fa3a3",
  green: "#38A169", greenSoft: "rgba(56,161,105,0.1)",
  white: "#FFFFFF", gray50: "#F9FAFB", gray100: "#F3F4F6", gray200: "#E5E7EB", gray300: "#D1D5DB",
  gray400: "#9CA3AF", gray500: "#6B7280", gray600: "#4B5563", gray700: "#374151", gray800: "#1F2937",
};

const font = { display: "'Clash Display', system-ui, sans-serif", body: "'Plus Jakarta Sans', system-ui, sans-serif", mono: "'JetBrains Mono', monospace" };

// ── Reusable: Fade in on scroll ──
function FadeIn({ children, delay = 0, direction = "up", style = {} }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const t = { up: "translateY(24px)", down: "translateY(-24px)", left: "translateX(24px)", right: "translateX(-24px)", none: "none" };
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : t[direction], transition: `all 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>{children}</div>;
}

const DotBg = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: 0.35 }}>
    <svg width="100%" height="100%"><defs><pattern id="d2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill={C.gray300} /></pattern></defs><rect width="100%" height="100%" fill="url(#d2)" /></svg>
  </div>
);

const GridBg = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: 0.05 }}>
    <svg width="100%" height="100%"><defs><pattern id="g2" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#g2)" /></svg>
  </div>
);

const GlowOrb = ({ color, size, top, left, right, bottom, opacity = 0.12 }) => (
  <div style={{ position: "absolute", width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, top, left, right, bottom, opacity, pointerEvents: "none", filter: "blur(50px)" }} />
);

const Badge = ({ children, color = C.teal, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: bg || `${color}12`, border: `1px solid ${color}25`, fontSize: 11, fontWeight: 650, color, fontFamily: font.body, letterSpacing: "0.02em" }}>{children}</span>
);

// ═══════════════════════════════════════════════════
// SHOWCASE NAV TABS
// ═══════════════════════════════════════════════════
const views = [
  { id: "homepage", label: "Homepage", icon: "🏠" },
  { id: "ai", label: "AI Features", icon: "⚡" },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "estimate", label: "Estimate Results", icon: "📋" },
  { id: "csi", label: "CSI & Assembly", icon: "🔧" },
  { id: "mobile", label: "Mobile Flow", icon: "📱" },
];

// ═══════════════════════════════════════════════════
// PROMPT 19: MARKETING HOMEPAGE
// ═══════════════════════════════════════════════════
const Homepage = () => {
  const services = [
    { icon: "📁", name: "Project Management", desc: "Full visibility and control over your construction project from pre-con to closeout.", price: "From $49/mo", color: C.navy, badge: null },
    { icon: "📋", name: "Permits & Inspections", desc: "AI-powered permit processing across 3,000+ jurisdictions. 85% first-try approval rate.", price: "From $495", color: C.green, badge: "Most Popular" },
    { icon: "🧮", name: "Estimation Services", desc: "Professional estimates in 24 hours. AI analysis + expert validation with RS Means data.", price: "From $299", color: C.teal, badge: "New" },
    { icon: "👷", name: "PM Operations", desc: "Kealee's PM team manages your project remotely. Scheduling, coordination, reporting.", price: "From $1,750/mo", color: C.orange, badge: null },
    { icon: "📐", name: "Architecture & Design", desc: "Design packages from schematic through construction documents. Permit-ready handoff.", price: "From $2,500", color: C.teal, badge: null },
    { icon: "👥", name: "Contractor Network", desc: "Find verified contractors. Fair bid rotation — no pay-to-play. Escrow-protected.", price: "Free to browse", color: C.navy, badge: null },
  ];

  const steps = [
    { num: "01", title: "Tell us about your project", desc: "Answer a few questions about scope, timeline, and budget." },
    { num: "02", title: "Get AI-powered analysis", desc: "Our platform analyzes your project and matches you with the right services." },
    { num: "03", title: "Build with confidence", desc: "Escrow-protected payments, milestone tracking, and expert support throughout." },
  ];

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{ position: "relative", padding: "100px 0 80px", background: C.white, overflow: "hidden" }}>
        <DotBg />
        <GlowOrb color={C.teal} size={500} top="-200px" right="-100px" opacity={0.07} />
        <GlowOrb color={C.orange} size={350} bottom="-100px" left="5%" opacity={0.05} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <FadeIn><Badge color={C.teal}>✦ Build Better, Build Smarter</Badge></FadeIn>
            <FadeIn delay={0.08}>
              <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.06, color: C.navy, margin: "24px 0 18px", letterSpacing: "-0.03em", fontFamily: font.display }}>
                The Complete<br /><span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Construction</span> Platform
              </h1>
            </FadeIn>
            <FadeIn delay={0.14}><p style={{ fontSize: 17, lineHeight: 1.7, color: C.gray600, margin: "0 0 32px", maxWidth: 440, fontFamily: font.body }}>From permits to project completion. AI-powered tools + expert services for the DC-Baltimore corridor. One platform — architecture, permits, construction, closeout.</p></FadeIn>
            <FadeIn delay={0.2}>
              <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
                <button style={{ padding: "14px 30px", borderRadius: 10, border: "none", background: C.orange, color: "white", fontSize: 15, fontWeight: 650, cursor: "pointer", fontFamily: font.body, boxShadow: `0 4px 16px rgba(232,121,58,0.3)` }}>Get Started Free →</button>
                <button style={{ padding: "14px 24px", borderRadius: 10, border: `2px solid ${C.gray200}`, background: "transparent", color: C.navy, fontSize: 15, fontWeight: 650, cursor: "pointer", fontFamily: font.body }}>See How It Works</button>
              </div>
            </FadeIn>
            <FadeIn delay={0.26}>
              <div style={{ display: "flex", gap: 28, paddingTop: 20, borderTop: `1px solid ${C.gray200}` }}>
                {[{ v: "3,000+", l: "Jurisdictions" }, { v: "85%", l: "First-try approval" }, { v: "$50M+", l: "Projects managed" }].map((s, i) => (
                  <div key={i}><div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font.mono }}>{s.v}</div><div style={{ fontSize: 11, color: C.gray500, marginTop: 2, fontFamily: font.body }}>{s.l}</div></div>
                ))}
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} direction="left">
            <div style={{ background: C.white, borderRadius: 16, boxShadow: `0 20px 50px rgba(26,43,74,0.12), 0 1px 3px rgba(26,43,74,0.06)`, border: `1px solid ${C.gray200}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", gap: 6, background: C.gray50 }}>
                {["#FF5F57", "#FFBD2E", "#28CA41"].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
                <div style={{ marginLeft: 12, flex: 1, height: 24, borderRadius: 5, background: C.gray100, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 10, color: C.gray400, fontFamily: font.mono }}>app.kealee.com</div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[{ l: "Active", v: "12", c: C.teal }, { l: "Permits", v: "4", c: C.green }, { l: "Budget", v: "$2.4M", c: C.orange }].map((s, i) => (
                    <div key={i} style={{ background: C.gray50, borderRadius: 8, padding: "12px 10px", border: `1px solid ${C.gray100}` }}>
                      <div style={{ fontSize: 9, color: C.gray500, fontFamily: font.body }}>{s.l}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font.mono, marginTop: 2 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {[{ n: "Design Phase", p: 100, c: C.teal }, { n: "Permits", p: 85, c: C.green }, { n: "Foundation", p: 60, c: C.orange }, { n: "Framing", p: 20, c: C.gray300 }].map((b, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 10, color: C.gray600, fontFamily: font.body }}>{b.n}</span><span style={{ fontSize: 10, color: C.gray400, fontFamily: font.mono }}>{b.p}%</span></div>
                    <div style={{ height: 5, borderRadius: 3, background: C.gray200 }}><div style={{ height: "100%", borderRadius: 3, background: b.c, width: `${b.p}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SERVICES GRID ── */}
      <section style={{ padding: "80px 0", background: C.gray50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <FadeIn><div style={{ textAlign: "center", marginBottom: 48 }}>
            <Badge color={C.navy} bg="rgba(26,43,74,0.06)">All Services</Badge>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: C.navy, margin: "16px 0 10px", fontFamily: font.display, letterSpacing: "-0.02em" }}>Everything You Need to Build</h2>
            <p style={{ fontSize: 16, color: C.gray500, fontFamily: font.body }}>Six integrated modules. One platform. Zero headaches.</p>
          </div></FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {services.map((svc, i) => (
              <FadeIn key={i} delay={0.04 * i}>
                <div style={{ background: C.white, borderRadius: 14, padding: 24, border: `1px solid ${C.gray200}`, cursor: "pointer", transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(26,43,74,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${svc.color}0D`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{svc.icon}</div>
                    {svc.badge && <Badge color={svc.badge === "New" ? C.teal : C.orange}>{svc.badge}</Badge>}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: "0 0 8px", fontFamily: font.body }}>{svc.name}</h3>
                  <p style={{ fontSize: 13, color: C.gray500, margin: "0 0 18px", lineHeight: 1.6, fontFamily: font.body, minHeight: 42 }}>{svc.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${C.gray100}` }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.orange, fontFamily: font.mono }}>{svc.price}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: font.body }}>Learn More →</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 0", background: C.white, position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <FadeIn><div style={{ textAlign: "center", marginBottom: 52 }}>
            <Badge color={C.orange}>How It Works</Badge>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: C.navy, margin: "16px 0 0", fontFamily: font.display, letterSpacing: "-0.02em" }}>Three Steps to Build Smarter</h2>
          </div></FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {steps.map((s, i) => (
              <FadeIn key={i} delay={0.1 * i}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 18, fontWeight: 800, color: C.white, fontFamily: font.mono }}>{s.num}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: "0 0 8px", fontFamily: font.body }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.6, fontFamily: font.body, margin: 0 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "80px 0", background: C.gray50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <FadeIn><h2 style={{ fontSize: 34, fontWeight: 800, color: C.navy, margin: "0 0 36px", textAlign: "center", fontFamily: font.display }}>Trusted by Builders Across the Corridor</h2></FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { name: "Sarah M.", role: "Homeowner, Bethesda", quote: "Kealee made our kitchen remodel completely stress-free. We could see every milestone and every dollar in real-time.", avatar: "S" },
              { name: "Marcus T.", role: "GC, Baltimore", quote: "The estimation platform cut our bid prep time in half. AI catches things we'd miss — and the RS Means integration is spot-on.", avatar: "M" },
              { name: "Priya K.", role: "Architect, DC", quote: "Finally, a platform that connects design to permits to construction. No more emailing spreadsheets back and forth.", avatar: "P" },
            ].map((t, i) => (
              <FadeIn key={i} delay={0.06 * i}>
                <div style={{ background: C.white, borderRadius: 14, padding: 24, border: `1px solid ${C.gray200}` }}>
                  <div style={{ fontSize: 22, color: C.orange, marginBottom: 12 }}>★★★★★</div>
                  <p style={{ fontSize: 14, color: C.gray600, lineHeight: 1.7, fontFamily: font.body, margin: "0 0 18px", fontStyle: "italic" }}>"{t.quote}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.navy}, ${C.teal})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700, fontFamily: font.body }}>{t.avatar}</div>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: font.body }}>{t.name}</div><div style={{ fontSize: 11, color: C.gray400, fontFamily: font.body }}>{t.role}</div></div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: "relative", padding: "80px 0", background: C.navy, overflow: "hidden" }}>
        <GridBg />
        <GlowOrb color={C.teal} size={400} top="-100px" left="-100px" opacity={0.1} />
        <GlowOrb color={C.orange} size={300} bottom="-80px" right="-60px" opacity={0.08} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "0 40px", textAlign: "center" }}>
          <FadeIn><h2 style={{ fontSize: 38, fontWeight: 800, color: C.white, margin: "0 0 12px", fontFamily: font.display, letterSpacing: "-0.02em" }}>Ready to Build Smarter?</h2></FadeIn>
          <FadeIn delay={0.08}><p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", margin: "0 0 32px", fontFamily: font.body }}>Get started in under 2 minutes. No credit card required.</p></FadeIn>
          <FadeIn delay={0.14}>
            <div style={{ display: "flex", gap: 0, justifyContent: "center", maxWidth: 440, margin: "0 auto" }}>
              <input placeholder="Enter your email" style={{ flex: 1, padding: "14px 16px", borderRadius: "10px 0 0 10px", border: "2px solid rgba(255,255,255,0.12)", borderRight: "none", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, fontFamily: font.body, outline: "none" }} />
              <button style={{ padding: "14px 24px", borderRadius: "0 10px 10px 0", border: "none", background: C.orange, color: "white", fontSize: 14, fontWeight: 650, cursor: "pointer", fontFamily: font.body, whiteSpace: "nowrap" }}>Start Free →</button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "48px 0 24px", background: C.navy900, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.white, fontFamily: font.display, marginBottom: 10 }}>Kealee</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontFamily: font.body, maxWidth: 240 }}>The complete construction platform for the DC-Baltimore corridor. Build better, build smarter.</p>
          </div>
          {[
            { title: "Solutions", items: ["Project Management", "Permits", "Estimation", "PM Operations"] },
            { title: "Services", items: ["Architecture", "Contractor Network", "Site Analysis", "Bid Leveling"] },
            { title: "Resources", items: ["Documentation", "API Reference", "Blog", "Help Center"] },
            { title: "Company", items: ["About", "Careers", "Contact", "Legal"] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 14, fontFamily: font.body, textTransform: "uppercase", letterSpacing: "0.08em" }}>{col.title}</div>
              {col.items.map((item, j) => <div key={j} style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 10, cursor: "pointer", fontFamily: font.body }}>{item}</div>)}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: "32px auto 0", padding: "20px 40px 0", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: font.body }}>© 2026 Kealee Construction LLC. All rights reserved.</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: font.body }}>Privacy · Terms · Accessibility</span>
        </div>
      </footer>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PROMPT 5: AI FEATURES SECTION
// ═══════════════════════════════════════════════════
const AIFeatures = () => {
  const features = [
    { icon: "🔍", title: "Scope Analyzer", desc: "Identifies gaps, risks, and missing items in your project scope before estimating begins.", tag: "NLP" },
    { icon: "📈", title: "Cost Predictor", desc: "ML-based cost forecasting with confidence intervals using historical project data.", tag: "ML" },
    { icon: "💡", title: "Value Engineer", desc: "Automated cost optimization — finds equivalent materials and methods that save money.", tag: "Optimization" },
    { icon: "📄", title: "Plan Analyzer", desc: "Automatic quantity extraction from PDFs and DWG files. No manual takeoffs.", tag: "Computer Vision" },
  ];

  return (
    <div>
      <section style={{ position: "relative", padding: "100px 0", background: C.white, overflow: "hidden" }}>
        <DotBg />
        <GlowOrb color={C.teal} size={600} top="-200px" left="50%" opacity={0.06} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <FadeIn><div style={{ textAlign: "center", marginBottom: 56 }}>
            <Badge color={C.teal}>⚡ AI-Powered</Badge>
            <h2 style={{ fontSize: 44, fontWeight: 800, color: C.navy, margin: "18px 0 12px", fontFamily: font.display, letterSpacing: "-0.03em" }}>AI-Powered Accuracy</h2>
            <p style={{ fontSize: 17, color: C.gray500, fontFamily: font.body, maxWidth: 520, margin: "0 auto" }}>Machine learning models trained on thousands of real projects deliver estimates you can trust.</p>
          </div></FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {features.map((f, i) => (
              <FadeIn key={i} delay={0.08 * i}>
                <div style={{ background: C.white, borderRadius: 16, padding: 28, border: `1px solid ${C.gray200}`, position: "relative", overflow: "hidden", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.tealBorder; e.currentTarget.style.boxShadow = `0 8px 30px ${C.tealSoft}`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: `radial-gradient(circle, ${C.teal}08, transparent)`, pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: C.tealSoft, border: `1px solid ${C.tealBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{f.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font.body }}>{f.title}</h3>
                        <Badge color={C.teal}>AI · {f.tag}</Badge>
                      </div>
                      <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.65, margin: 0, fontFamily: font.body }}>{f.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Confidence visualization */}
          <FadeIn delay={0.4}>
            <div style={{ marginTop: 40, background: C.navy, borderRadius: 16, padding: 32, position: "relative", overflow: "hidden" }}>
              <GridBg />
              <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
                <div>
                  <Badge color={C.teal} bg="rgba(42,191,191,0.15)">How It Works</Badge>
                  <h3 style={{ fontSize: 26, fontWeight: 800, color: C.white, margin: "14px 0 12px", fontFamily: font.display }}>From Plans to Pricing in Minutes</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, fontFamily: font.body }}>Upload your plans. Our AI extracts quantities, prices assemblies against RS Means data, applies regional factors, and delivers a validated estimate — all before an expert even reviews it.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { step: "Upload", desc: "PDF/DWG plans", pct: 100, icon: "📤" },
                    { step: "Extract", desc: "AI quantity takeoff", pct: 100, icon: "🔍" },
                    { step: "Price", desc: "RS Means + local data", pct: 100, icon: "💰" },
                    { step: "Validate", desc: "Expert review", pct: 85, icon: "✅" },
                    { step: "Deliver", desc: "PDF + Excel report", pct: 60, icon: "📋" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(42,191,191,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{s.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.white, fontFamily: font.body }}>{s.step}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: font.mono }}>{s.desc}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                          <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${C.teal}, ${C.tealDark})`, width: `${s.pct}%`, transition: "width 1.5s ease" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PROMPT 8/16: HOMEOWNER DASHBOARD + SIDEBAR
// ═══════════════════════════════════════════════════
const Dashboard = () => {
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [expanded, setExpanded] = useState({ "Estimation": true });

  const bg = dark ? C.navy950 : C.white;
  const cardBg = dark ? C.navy900 : C.white;
  const sidebarBg = dark ? C.navy900 : C.white;
  const borderColor = dark ? "rgba(255,255,255,0.06)" : C.gray200;
  const textPrimary = dark ? C.white : C.navy;
  const textSecondary = dark ? "rgba(255,255,255,0.55)" : C.gray500;
  const textMuted = dark ? "rgba(255,255,255,0.3)" : C.gray400;
  const hoverBg = dark ? "rgba(42,191,191,0.08)" : "#E5F8F8";

  const sidebarW = collapsed ? 64 : 240;

  const navItems = [
    { icon: "📊", label: "Dashboard", children: null },
    { icon: "📁", label: "My Projects", children: ["Active Projects", "Completed", "Start New Project"] },
    { icon: "📋", label: "Pre-Construction", children: ["Project Pipeline", "Design Packages", "Cost Estimates"] },
    { icon: "🧮", label: "Estimation", badge: "NEW", children: ["Request Estimate", "My Estimates", "Compare Estimates"] },
    { icon: "📄", label: "Permits", children: ["Active Permits", "New Application", "Inspections"] },
    { icon: "👥", label: "Find Contractors", children: ["Search", "Active Bids", "Saved"] },
    { icon: "💳", label: "Payments", children: ["Escrow Account", "Payment History", "Schedule"] },
    { icon: "📎", label: "Documents", children: null },
    { icon: "📈", label: "Reports", children: null },
  ];

  return (
    <div style={{ background: bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${borderColor}`, position: "relative" }}>
      {/* Theme + collapse controls */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 20, display: "flex", gap: 6 }}>
        <button onClick={() => setDark(!dark)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, color: textPrimary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>{dark ? "☀️ Light" : "🌙 Dark"}</button>
        <button onClick={() => setCollapsed(!collapsed)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, color: textPrimary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>{collapsed ? "→" : "←"}</button>
      </div>

      <div style={{ display: "flex", height: 620 }}>
        {/* ── SIDEBAR ── */}
        <div style={{ width: sidebarW, background: sidebarBg, borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", transition: "width 0.25s ease", overflow: "hidden", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: collapsed ? "18px 12px" : "18px 20px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0 }}>K</div>
            {!collapsed && <span style={{ fontSize: 17, fontWeight: 800, color: textPrimary, fontFamily: font.display, whiteSpace: "nowrap" }}>Kealee</span>}
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
            {navItems.map((item, i) => (
              <div key={i}>
                <div onClick={() => {
                  setActiveItem(item.label);
                  if (item.children) setExpanded(p => ({ ...p, [item.label]: !p[item.label] }));
                }} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px 12px" : "9px 12px",
                  borderRadius: 8, cursor: "pointer", marginBottom: 2,
                  background: activeItem === item.label ? hoverBg : "transparent",
                  borderLeft: activeItem === item.label ? `3px solid ${C.teal}` : "3px solid transparent",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { if (activeItem !== item.label) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : C.gray50; }}
                  onMouseLeave={e => { if (activeItem !== item.label) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: "center" }}>{item.icon}</span>
                  {!collapsed && <>
                    <span style={{ fontSize: 13, fontWeight: activeItem === item.label ? 600 : 500, color: activeItem === item.label ? C.teal : textSecondary, fontFamily: font.body, flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>
                    {item.badge && <span style={{ padding: "1px 7px", borderRadius: 10, background: C.orange, color: "white", fontSize: 9, fontWeight: 700 }}>{item.badge}</span>}
                    {item.children && <span style={{ fontSize: 10, color: textMuted, transform: expanded[item.label] ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>}
                  </>}
                </div>
                {/* Children */}
                {!collapsed && item.children && expanded[item.label] && (
                  <div style={{ marginLeft: 37, marginBottom: 4 }}>
                    {item.children.map((child, j) => (
                      <div key={j} style={{ padding: "6px 12px", fontSize: 12, color: textMuted, cursor: "pointer", borderRadius: 6, fontFamily: font.body, transition: "color 0.15s" }}
                        onMouseEnter={e => { e.target.style.color = textPrimary; e.target.style.background = dark ? "rgba(255,255,255,0.03)" : C.gray50; }}
                        onMouseLeave={e => { e.target.style.color = textMuted; e.target.style.background = "transparent"; }}>
                        {child}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Settings + profile */}
          <div style={{ borderTop: `1px solid ${borderColor}`, padding: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>⚙️</span>
              {!collapsed && <span style={{ fontSize: 13, color: textSecondary, fontFamily: font.body }}>Settings</span>}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${borderColor}`, padding: collapsed ? "12px 8px" : "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.navy}, ${C.teal})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>JS</div>
            {!collapsed && <div><div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, fontFamily: font.body }}>John Smith</div><div style={{ fontSize: 10, color: textMuted, fontFamily: font.body }}>john@email.com</div></div>}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: cardBg }}>
            <div style={{ fontSize: 12, color: textMuted, fontFamily: font.body }}>Home <span style={{ margin: "0 6px" }}>›</span> <span style={{ color: textPrimary, fontWeight: 500 }}>Dashboard</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 200, height: 32, borderRadius: 8, background: dark ? "rgba(255,255,255,0.04)" : C.gray50, border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 11, color: textMuted, fontFamily: font.body }}>🔍 Search...</div>
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: 18 }}>🔔</span>
                <div style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: "50%", background: C.orange }} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: 24, overflowY: "auto", background: dark ? C.navy950 : C.gray50 }}>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Active Projects", value: "3", icon: "📁", change: "+1 this month", changeColor: C.teal },
                { label: "Pending Estimates", value: "2", icon: "🧮", change: "1 due tomorrow", changeColor: C.orange },
                { label: "Permits in Progress", value: "1", icon: "📄", change: "On track", changeColor: C.green },
                { label: "Total Spent", value: "$124,500", icon: "💰", change: "Under budget", changeColor: C.green },
              ].map((s, i) => (
                <div key={i} style={{ background: cardBg, borderRadius: 12, padding: "18px 16px", border: `1px solid ${borderColor}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: textSecondary, fontFamily: font.body }}>{s.label}</span>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: textPrimary, fontFamily: font.mono }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.changeColor, marginTop: 4, fontWeight: 500, fontFamily: font.body }}>{s.change}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              {/* Recent projects */}
              <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", borderBottom: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: textPrimary, fontFamily: font.body }}>Recent Projects</span>
                  <span style={{ fontSize: 12, color: C.teal, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>View All →</span>
                </div>
                {[
                  { name: "Smith Kitchen Renovation", status: "Active", statusColor: C.teal, budget: "$54K", progress: 65 },
                  { name: "Johnson Bathroom Remodel", status: "Permitting", statusColor: C.orange, budget: "$28K", progress: 30 },
                  { name: "Davis Basement Finish", status: "Estimating", statusColor: C.gray400, budget: "TBD", progress: 10 },
                ].map((p, i) => (
                  <div key={i} style={{ padding: "14px 18px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, fontFamily: font.body, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${p.statusColor}15`, color: p.statusColor, fontWeight: 600, fontFamily: font.body }}>{p.status}</span>
                        <span style={{ fontSize: 11, color: textMuted, fontFamily: font.mono }}>{p.budget}</span>
                      </div>
                    </div>
                    <div style={{ width: 80 }}>
                      <div style={{ fontSize: 10, color: textMuted, fontFamily: font.mono, textAlign: "right", marginBottom: 3 }}>{p.progress}%</div>
                      <div style={{ height: 4, borderRadius: 2, background: dark ? "rgba(255,255,255,0.06)" : C.gray200 }}>
                        <div style={{ height: "100%", borderRadius: 2, background: p.statusColor, width: `${p.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: `linear-gradient(135deg, ${C.orange}, #c4622c)`, borderRadius: 12, padding: 20, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                  <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>🧮</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4, fontFamily: font.body }}>Get a New Estimate</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 14, fontFamily: font.body }}>AI-powered estimates in 24 hours</div>
                  <button style={{ padding: "8px 18px", borderRadius: 8, border: "2px solid rgba(255,255,255,0.4)", background: "transparent", color: "white", fontSize: 12, fontWeight: 650, cursor: "pointer", fontFamily: font.body }}>Start Estimate →</button>
                </div>
                <div style={{ background: cardBg, borderRadius: 12, padding: 18, border: `1px solid ${borderColor}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12, fontFamily: font.body }}>Activity</div>
                  {[
                    { text: "Permit approved for Smith Kitchen", time: "2h ago", color: C.green },
                    { text: "New estimate ready for review", time: "5h ago", color: C.teal },
                    { text: "Payment released: Milestone 3", time: "1d ago", color: C.orange },
                  ].map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, marginTop: 6, flexShrink: 0 }} />
                      <div><div style={{ fontSize: 12, color: textSecondary, fontFamily: font.body }}>{a.text}</div><div style={{ fontSize: 10, color: textMuted, fontFamily: font.body, marginTop: 2 }}>{a.time}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PROMPT 7/18: ESTIMATE SUMMARY + RESULTS
// ═══════════════════════════════════════════════════
const EstimateResults = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const divisions = [
    { code: "03", name: "Concrete", material: 2500, labor: 1200, equip: 300, total: 4000 },
    { code: "06", name: "Carpentry", material: 8000, labor: 4500, equip: 200, total: 12700 },
    { code: "09", name: "Finishes", material: 6000, labor: 3000, equip: 0, total: 9000 },
    { code: "22", name: "Plumbing", material: 3500, labor: 2500, equip: 0, total: 6000 },
    { code: "26", name: "Electrical", material: 2800, labor: 2200, equip: 0, total: 5000 },
    { code: "31", name: "Site Work", material: 1200, labor: 2800, equip: 800, total: 4800 },
  ];
  const totalDirect = divisions.reduce((s, d) => s + d.total, 0);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: 0, fontFamily: font.display }}>Smith Kitchen Renovation</h2>
            <Badge color={C.green}>✓ Completed</Badge>
          </div>
          <div style={{ fontSize: 12, color: C.gray400, fontFamily: font.body }}>Estimate #KE-2026-0047 · Feb 4, 2026 · Version 2</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.gray200}`, background: C.white, color: C.navy, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>📄 PDF</button>
          <button style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.gray200}`, background: C.white, color: C.navy, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>📊 Excel</button>
          <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.orange, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>Request Revision</button>
        </div>
      </div>

      {/* Summary card */}
      <div style={{ background: C.navy, borderRadius: 16, padding: 28, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontFamily: font.body }}>Total Estimate</div>
              <div style={{ fontSize: 42, fontWeight: 700, color: C.white, fontFamily: font.mono, lineHeight: 1 }}>$53,996</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8, fontFamily: font.body }}>300 SF · $180/SF · 6 CSI Divisions</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontFamily: font.body }}>Breakdown</div>
              {[
                { l: "Direct Cost", v: `$${totalDirect.toLocaleString()}` },
                { l: "Overhead (10%)", v: `$${Math.round(totalDirect * 0.1).toLocaleString()}` },
                { l: "Profit (10%)", v: `$${Math.round(totalDirect * 1.1 * 0.1).toLocaleString()}` },
                { l: "Contingency (5%)", v: `$${Math.round(totalDirect * 1.21 * 0.05).toLocaleString()}` },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: font.body }}>{r.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", fontFamily: font.mono }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontFamily: font.body }}>AI Confidence</div>
              <div style={{ width: 100, height: 100, borderRadius: "50%", border: "4px solid rgba(42,191,191,0.3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(42,191,191,0.15)" strokeWidth="4" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke={C.teal} strokeWidth="4" strokeDasharray={`${289 * 0.92} ${289 * 0.08}`} strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 24, fontWeight: 700, color: C.teal, fontFamily: font.mono }}>92%</span>
              </div>
              <Badge color={C.teal} bg="rgba(42,191,191,0.15)">High Confidence</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${C.gray200}`, marginBottom: 20 }}>
        {["summary", "line-items", "assemblies", "assumptions", "value-eng"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "10px 18px", fontSize: 13, fontWeight: 600, border: "none", background: "none",
            color: activeTab === tab ? C.navy : C.gray400, cursor: "pointer", fontFamily: font.body,
            borderBottom: activeTab === tab ? `2px solid ${C.teal}` : "2px solid transparent", marginBottom: -2, transition: "all 0.15s",
          }}>{tab.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</button>
        ))}
      </div>

      {/* Cost breakdown table */}
      <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.gray200}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font.body }}>
          <thead>
            <tr style={{ background: C.gray50 }}>
              {["Division", "Description", "Material", "Labor", "Equipment", "Total"].map(h => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.gray500, textAlign: h === "Division" || h === "Description" ? "left" : "right", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.gray200}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {divisions.map((d, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? C.gray50 : C.white }}>
                <td style={{ padding: "12px 16px" }}><Badge color={C.navy} bg="rgba(26,43,74,0.06)">{d.code}</Badge></td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: C.navy }}>{d.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray600, fontFamily: font.mono, textAlign: "right" }}>${d.material.toLocaleString()}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray600, fontFamily: font.mono, textAlign: "right" }}>${d.labor.toLocaleString()}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: C.gray600, fontFamily: font.mono, textAlign: "right" }}>{d.equip ? `$${d.equip.toLocaleString()}` : "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: font.mono, textAlign: "right" }}>${d.total.toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{ background: C.navy }}>
              <td colSpan={2} style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "white" }}>TOTAL DIRECT COST</td>
              <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: font.mono, textAlign: "right" }}>${divisions.reduce((s, d) => s + d.material, 0).toLocaleString()}</td>
              <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: font.mono, textAlign: "right" }}>${divisions.reduce((s, d) => s + d.labor, 0).toLocaleString()}</td>
              <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: font.mono, textAlign: "right" }}>${divisions.reduce((s, d) => s + d.equip, 0).toLocaleString()}</td>
              <td style={{ padding: "14px 16px", fontSize: 15, fontWeight: 700, color: "white", fontFamily: font.mono, textAlign: "right" }}>${totalDirect.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        {/* Pie chart (simplified as bars) */}
        <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.gray200}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 16, fontFamily: font.body }}>Cost by Division</div>
          {divisions.map((d, i) => {
            const colors = [C.teal, C.orange, C.green, "#6366F1", "#F59E0B", C.navy];
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: C.gray600, fontFamily: font.body }}>{d.code} {d.name}</span>
                  <span style={{ fontSize: 12, color: C.gray400, fontFamily: font.mono }}>{Math.round(d.total / totalDirect * 100)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: C.gray100 }}>
                  <div style={{ height: "100%", borderRadius: 4, background: colors[i], width: `${d.total / totalDirect * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        {/* Material vs Labor */}
        <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.gray200}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 16, fontFamily: font.body }}>Cost Breakdown by Type</div>
          {[
            { label: "Materials", value: divisions.reduce((s, d) => s + d.material, 0), color: C.teal },
            { label: "Labor", value: divisions.reduce((s, d) => s + d.labor, 0), color: C.orange },
            { label: "Equipment", value: divisions.reduce((s, d) => s + d.equip, 0), color: C.navy },
          ].map((t, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: font.body }}>{t.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.color, fontFamily: font.mono }}>${t.value.toLocaleString()}</span>
              </div>
              <div style={{ height: 12, borderRadius: 6, background: C.gray100 }}>
                <div style={{ height: "100%", borderRadius: 6, background: t.color, width: `${t.value / totalDirect * 100}%`, transition: "width 0.8s ease" }} />
              </div>
              <div style={{ fontSize: 10, color: C.gray400, marginTop: 3, fontFamily: font.mono }}>{Math.round(t.value / totalDirect * 100)}% of direct cost</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PROMPT 6/10: CSI SELECTOR + ASSEMBLY BROWSER
// ═══════════════════════════════════════════════════
const CSIAssembly = () => {
  const [selectedDiv, setSelectedDiv] = useState("03");
  const divisions = [
    { code: "All", name: "All Divisions" },
    { code: "03", name: "Concrete" }, { code: "04", name: "Masonry" }, { code: "05", name: "Metals" },
    { code: "06", name: "Wood & Composites" }, { code: "07", name: "Thermal Protection" },
    { code: "08", name: "Openings" }, { code: "09", name: "Finishes" },
    { code: "22", name: "Plumbing" }, { code: "23", name: "HVAC" }, { code: "26", name: "Electrical" },
  ];
  const assemblies = [
    { code: "03-1000", name: "Concrete Slab on Grade - 4\"", unit: "SF", prod: "800 SF/day", crew: 4, cost: "$6.25/SF", div: "03" },
    { code: "03-2100", name: "Concrete Foundation Wall - 8\"", unit: "LF", prod: "120 LF/day", crew: 5, cost: "$42.00/LF", div: "03" },
    { code: "06-1100", name: "Wood Stud Wall - 2x4 @ 16\" OC", unit: "SF", prod: "400 SF/day", crew: 3, cost: "$4.80/SF", div: "06" },
    { code: "07-3100", name: "Asphalt Shingles - Architectural", unit: "SQ", prod: "15 SQ/day", crew: 3, cost: "$385/SQ", div: "07" },
    { code: "09-2900", name: "Drywall - 1/2\" Standard", unit: "SF", prod: "600 SF/day", crew: 2, cost: "$2.10/SF", div: "09" },
    { code: "26-2700", name: "Duplex Receptacle w/ Wiring", unit: "EA", prod: "12 EA/day", crew: 1, cost: "$185/EA", div: "26" },
    { code: "22-1100", name: "Copper Water Line - 3/4\"", unit: "LF", prod: "80 LF/day", crew: 2, cost: "$18.50/LF", div: "22" },
    { code: "09-6800", name: "Hardwood Floor - Oak", unit: "SF", prod: "200 SF/day", crew: 2, cost: "$12.50/SF", div: "09" },
  ];

  const filtered = selectedDiv === "All" ? assemblies : assemblies.filter(a => a.div === selectedDiv);

  return (
    <div style={{ display: "flex", gap: 0, background: C.white, borderRadius: 14, border: `1px solid ${C.gray200}`, overflow: "hidden", height: 600 }}>
      {/* Left: Division sidebar */}
      <div style={{ width: 220, borderRight: `1px solid ${C.gray200}`, background: C.gray50, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.gray200}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: font.body }}>CSI Divisions</div>
        </div>
        {divisions.map(d => (
          <div key={d.code} onClick={() => setSelectedDiv(d.code)} style={{
            padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            background: selectedDiv === d.code ? C.tealSoft : "transparent",
            borderLeft: selectedDiv === d.code ? `3px solid ${C.teal}` : "3px solid transparent",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { if (selectedDiv !== d.code) e.currentTarget.style.background = C.gray100; }}
            onMouseLeave={e => { if (selectedDiv !== d.code) e.currentTarget.style.background = "transparent"; }}>
            {d.code !== "All" && <span style={{ fontSize: 11, fontWeight: 700, color: selectedDiv === d.code ? C.teal : C.gray400, fontFamily: font.mono, width: 22 }}>{d.code}</span>}
            <span style={{ fontSize: 13, fontWeight: selectedDiv === d.code ? 600 : 400, color: selectedDiv === d.code ? C.teal : C.gray600, fontFamily: font.body }}>{d.name}</span>
          </div>
        ))}
      </div>

      {/* Right: Assembly cards */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Search bar */}
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.gray200}`, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, height: 36, borderRadius: 8, border: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", paddingLeft: 12, fontSize: 13, color: C.gray400, fontFamily: font.body, background: C.white }}>🔍 Search assemblies...</div>
          <select style={{ height: 36, borderRadius: 8, border: `1px solid ${C.gray200}`, padding: "0 12px", fontSize: 12, color: C.gray600, fontFamily: font.body, background: C.white }}>
            <option>Sort: Popular</option><option>Sort: Price ↑</option><option>Sort: Price ↓</option>
          </select>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, padding: 18, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, alignContent: "start" }}>
          {filtered.map((a, i) => (
            <div key={i} style={{ background: C.white, borderRadius: 12, padding: 18, border: `1px solid ${C.gray200}`, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,43,74,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.teal, fontFamily: font.mono }}>{a.code}</span>
                <Badge color={C.navy} bg="rgba(26,43,74,0.06)">{a.unit}</Badge>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 10, fontFamily: font.body, lineHeight: 1.3 }}>{a.name}</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: C.gray400, fontFamily: font.body }}>⏱ {a.prod}</span>
                <span style={{ fontSize: 11, color: C.gray400, fontFamily: font.body }}>👷 Crew: {a.crew}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${C.gray100}` }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.orange, fontFamily: font.mono }}>{a.cost}</span>
                <button style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.orange, color: "white", fontSize: 11, fontWeight: 650, cursor: "pointer", fontFamily: font.body }}>+ Add</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: C.gray400, fontFamily: font.body }}>
              No assemblies found for this division. Try "All Divisions".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PROMPT 9/17/21: MOBILE ESTIMATION FLOW
// ═══════════════════════════════════════════════════
const MobileFlow = () => {
  const [step, setStep] = useState(0);
  const [darkPhone, setDarkPhone] = useState(false);
  const phoneBg = darkPhone ? C.navy950 : C.white;
  const phoneText = darkPhone ? C.white : C.navy;
  const phoneTextSec = darkPhone ? "rgba(255,255,255,0.5)" : C.gray500;
  const phoneBorder = darkPhone ? "rgba(255,255,255,0.08)" : C.gray200;
  const phoneCard = darkPhone ? C.navy900 : C.white;
  const phoneInputBg = darkPhone ? "rgba(255,255,255,0.04)" : C.gray50;

  const steps = ["Details", "Scope", "Upload", "Service", "Review"];

  const PhoneFrame = ({ children }) => (
    <div style={{ width: 375, background: phoneBg, borderRadius: 40, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: `1px solid ${phoneBorder}`, overflow: "hidden", position: "relative" }}>
      {/* Notch */}
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ width: 120, height: 28, borderRadius: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, background: darkPhone ? "#000" : "#1a1a1a" }} />
      </div>
      {/* Content */}
      <div style={{ height: 680, display: "flex", flexDirection: "column" }}>{children}</div>
      {/* Home indicator */}
      <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 134, height: 5, borderRadius: 3, background: darkPhone ? "rgba(255,255,255,0.2)" : C.gray300 }} />
      </div>
    </div>
  );

  const Input = ({ label, placeholder, type = "text" }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: phoneText, display: "block", marginBottom: 6, fontFamily: font.body }}>{label}</label>
      <input placeholder={placeholder} type={type} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${phoneBorder}`, background: phoneInputBg, fontSize: 14, color: phoneText, fontFamily: font.body, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 40, alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>
      {/* Phone */}
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" }}>
          <button onClick={() => setDarkPhone(!darkPhone)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.gray200}`, background: C.white, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>{darkPhone ? "☀️ Light" : "🌙 Dark"}</button>
        </div>
        <PhoneFrame>
          {/* Header */}
          <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span onClick={() => step > 0 && setStep(step - 1)} style={{ fontSize: 14, color: step > 0 ? C.teal : "transparent", cursor: step > 0 ? "pointer" : "default", fontFamily: font.body, fontWeight: 600 }}>← Back</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: phoneText, fontFamily: font.body }}>New Estimate</span>
            <span style={{ fontSize: 12, color: phoneTextSec, fontFamily: font.body }}>Step {step + 1}/5</span>
          </div>

          {/* Progress */}
          <div style={{ padding: "0 20px 16px", display: "flex", gap: 6 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ height: 3, width: "100%", borderRadius: 2, background: i <= step ? C.teal : (darkPhone ? "rgba(255,255,255,0.08)" : C.gray200), transition: "background 0.3s" }} />
                <span style={{ fontSize: 9, color: i <= step ? C.teal : phoneTextSec, fontWeight: i === step ? 700 : 400, fontFamily: font.body }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Step content */}
          <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
            {step === 0 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: phoneText, margin: "0 0 4px", fontFamily: font.display }}>Project Details</h3>
                <p style={{ fontSize: 13, color: phoneTextSec, margin: "0 0 20px", fontFamily: font.body }}>Tell us about your project</p>
                <Input label="Project Name" placeholder="e.g., Kitchen Renovation" />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: phoneText, display: "block", marginBottom: 6, fontFamily: font.body }}>Project Type</label>
                  <select style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${phoneBorder}`, background: phoneInputBg, fontSize: 14, color: phoneText, fontFamily: font.body, appearance: "none" }}>
                    <option>Kitchen Remodel</option><option>Bathroom</option><option>Addition</option><option>Full Renovation</option><option>New Construction</option>
                  </select>
                </div>
                <Input label="Square Footage" placeholder="e.g., 300" type="number" />
                <Input label="Property Address" placeholder="City, State or Zip" />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: phoneText, display: "block", marginBottom: 6, fontFamily: font.body }}>Target Budget</label>
                  <select style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${phoneBorder}`, background: phoneInputBg, fontSize: 14, color: phoneText, fontFamily: font.body, appearance: "none" }}>
                    <option>Under $25K</option><option>$25K – $50K</option><option>$50K – $100K</option><option>$100K – $250K</option><option>$250K+</option>
                  </select>
                </div>
              </div>
            )}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: phoneText, margin: "0 0 4px", fontFamily: font.display }}>Scope of Work</h3>
                <p style={{ fontSize: 13, color: phoneTextSec, margin: "0 0 20px", fontFamily: font.body }}>Select the work types involved</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {["Demolition", "Framing", "Electrical", "Plumbing", "HVAC", "Drywall", "Painting", "Flooring", "Cabinets", "Countertops", "Tile", "Windows"].map((w, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: `1px solid ${phoneBorder}`, background: phoneCard, cursor: "pointer", fontSize: 12, color: phoneText, fontFamily: font.body }}>
                      <input type="checkbox" defaultChecked={i < 3} style={{ accentColor: C.teal }} /> {w}
                    </label>
                  ))}
                </div>
                <label style={{ fontSize: 12, fontWeight: 600, color: phoneText, display: "block", marginBottom: 6, fontFamily: font.body }}>Additional Details</label>
                <textarea placeholder="Describe any special requirements..." style={{ width: "100%", height: 80, padding: "12px 14px", borderRadius: 10, border: `1px solid ${phoneBorder}`, background: phoneInputBg, fontSize: 13, color: phoneText, fontFamily: font.body, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
            )}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: phoneText, margin: "0 0 4px", fontFamily: font.display }}>Upload Plans</h3>
                <p style={{ fontSize: 13, color: phoneTextSec, margin: "0 0 20px", fontFamily: font.body }}>Share your drawings and documents</p>
                <div style={{ border: `2px dashed ${phoneBorder}`, borderRadius: 14, padding: "40px 20px", textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: phoneText, marginBottom: 4, fontFamily: font.body }}>Tap to upload files</div>
                  <div style={{ fontSize: 11, color: phoneTextSec, fontFamily: font.body }}>PDF, DWG, JPG, PNG · Max 50MB</div>
                </div>
                {/* Sample uploaded file */}
                <div style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${phoneBorder}`, background: phoneCard, display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📐</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: phoneText, fontFamily: font.body }}>kitchen-plans.pdf</div>
                    <div style={{ fontSize: 10, color: phoneTextSec, fontFamily: font.body }}>2.4 MB</div>
                  </div>
                  <span style={{ fontSize: 14, color: C.green }}>✓</span>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, fontSize: 13, color: phoneTextSec, fontFamily: font.body, cursor: "pointer" }}>
                  <input type="checkbox" style={{ accentColor: C.teal }} /> I don't have plans yet
                </label>
              </div>
            )}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: phoneText, margin: "0 0 4px", fontFamily: font.display }}>Select Service</h3>
                <p style={{ fontSize: 13, color: phoneTextSec, margin: "0 0 20px", fontFamily: font.body }}>Choose your estimation tier</p>
                {[
                  { name: "Basic", price: "$299", time: "24 hours", desc: "Small residential" },
                  { name: "Standard", price: "$799", time: "48 hours", desc: "Mid-size projects", popular: true },
                  { name: "Premium", price: "$1,999", time: "3-5 days", desc: "Large commercial" },
                  { name: "Enterprise", price: "$4,999", time: "Custom", desc: "Multi-phase builds" },
                ].map((t, i) => (
                  <div key={i} style={{
                    padding: "16px", borderRadius: 12, marginBottom: 10,
                    border: t.popular ? `2px solid ${C.orange}` : `1px solid ${phoneBorder}`,
                    background: phoneCard, position: "relative", cursor: "pointer",
                  }}>
                    {t.popular && <div style={{ position: "absolute", top: -1, right: 12, padding: "2px 10px", borderRadius: "0 0 8px 8px", background: C.orange, fontSize: 9, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>RECOMMENDED</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: phoneText, fontFamily: font.body }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: phoneTextSec, fontFamily: font.body }}>{t.desc}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: C.orange, fontFamily: font.mono }}>{t.price}</div>
                        <div style={{ fontSize: 10, color: phoneTextSec, fontFamily: font.mono }}>{t.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {step === 4 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: phoneText, margin: "0 0 4px", fontFamily: font.display }}>Review & Pay</h3>
                <p style={{ fontSize: 13, color: phoneTextSec, margin: "0 0 20px", fontFamily: font.body }}>Confirm your estimate request</p>
                <div style={{ background: phoneCard, borderRadius: 12, padding: 16, border: `1px solid ${phoneBorder}`, marginBottom: 16 }}>
                  {[
                    { l: "Project", v: "Kitchen Renovation" },
                    { l: "Type", v: "Kitchen Remodel" },
                    { l: "Size", v: "300 SF" },
                    { l: "Service", v: "Standard ($799)" },
                    { l: "Turnaround", v: "48 hours" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? `1px solid ${phoneBorder}` : "none" }}>
                      <span style={{ fontSize: 12, color: phoneTextSec, fontFamily: font.body }}>{r.l}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: phoneText, fontFamily: font.body }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: phoneCard, borderRadius: 12, padding: 16, border: `1px solid ${phoneBorder}`, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: phoneText, fontFamily: font.body }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: C.orange, fontFamily: font.mono }}>$799</span>
                  </div>
                  <div style={{ fontSize: 11, color: phoneTextSec, fontFamily: font.body }}>One-time payment · Estimate delivered in 48 hours</div>
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: phoneTextSec, fontFamily: font.body, marginBottom: 12, lineHeight: 1.5 }}>
                  <input type="checkbox" style={{ accentColor: C.teal, marginTop: 2 }} /> I agree to the Terms of Service and Privacy Policy
                </label>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${phoneBorder}` }}>
            <button onClick={() => step < 4 ? setStep(step + 1) : setStep(0)} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: C.orange, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: font.body, boxShadow: `0 4px 14px rgba(232,121,58,0.3)` }}>
              {step < 4 ? "Continue →" : "Submit Request →"}
            </button>
          </div>

          {/* Bottom nav */}
          <div style={{ padding: "8px 0", borderTop: `1px solid ${phoneBorder}`, display: "flex", justifyContent: "space-around" }}>
            {[
              { icon: "🏠", label: "Home", active: false },
              { icon: "📁", label: "Projects", active: false },
              { icon: "🧮", label: "Estimate", active: true },
              { icon: "📄", label: "Permits", active: false },
              { icon: "⋯", label: "More", active: false },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 48, cursor: "pointer" }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{ fontSize: 9, fontWeight: t.active ? 700 : 400, color: t.active ? C.teal : phoneTextSec, fontFamily: font.body }}>{t.active ? t.label : ""}</span>
              </div>
            ))}
          </div>
        </PhoneFrame>
      </div>

      {/* Step descriptions */}
      <div style={{ maxWidth: 320, paddingTop: 60 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: "0 0 8px", fontFamily: font.display }}>Mobile Estimation Flow</h3>
        <p style={{ fontSize: 14, color: C.gray500, margin: "0 0 24px", lineHeight: 1.6, fontFamily: font.body }}>5-step wizard optimized for mobile. Click "Continue" on the phone to advance through each step.</p>
        {steps.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", borderRadius: 10, marginBottom: 6,
            background: step === i ? C.tealSoft : "transparent",
            border: `1px solid ${step === i ? C.tealBorder : "transparent"}`,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: step === i ? C.teal : C.gray200,
              color: step === i ? "white" : C.gray500,
              fontSize: 12, fontWeight: 700, fontFamily: font.mono,
            }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: step === i ? C.navy : C.gray500, fontFamily: font.body }}>{s}</div>
              <div style={{ fontSize: 11, color: C.gray400, fontFamily: font.body }}>
                {["Project name, type, location", "Work types checklist", "Upload plans & docs", "Choose estimation tier", "Confirm & pay"][i]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP — TAB NAVIGATION
// ═══════════════════════════════════════════════════
export default function KealeeDesignSystemP2() {
  const [activeView, setActiveView] = useState("homepage");

  return (
    <div style={{ background: C.gray50, minHeight: "100vh", fontFamily: font.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow-x: hidden; }
        ::selection { background: rgba(42,191,191,0.2); color: #1A2B4A; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      {/* ── Top showcase nav ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.gray200}`,
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>K</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.navy, fontFamily: font.display }}>Kealee Design System</span>
            <Badge color={C.teal}>Part 2</Badge>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {views.map(v => (
              <button key={v.id} onClick={() => setActiveView(v.id)} style={{
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: activeView === v.id ? C.tealSoft : "transparent",
                color: activeView === v.id ? C.teal : C.gray500,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font.body,
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ fontSize: 13 }}>{v.icon}</span> {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: activeView === "homepage" ? 0 : "32px 24px" }}>
        <div style={{ maxWidth: activeView === "homepage" ? "100%" : 1200, margin: "0 auto" }}>
          {activeView === "homepage" && <Homepage />}
          {activeView === "ai" && <AIFeatures />}
          {activeView === "dashboard" && <Dashboard />}
          {activeView === "estimate" && <EstimateResults />}
          {activeView === "csi" && <CSIAssembly />}
          {activeView === "mobile" && <MobileFlow />}
        </div>
      </div>
    </div>
  );
}
