import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// KEALEE PLATFORM — PORTAL LANDING PAGES (Prompts 35–40)
// Homeowner • Contractor • Professional • Tabs • Comparison • Services
// ═══════════════════════════════════════════════════════════════

const C = {
  navy: "#1A2B4A", navyLight: "#243556", navyDark: "#0F1A2E",
  orange: "#E8793A", orangeHover: "#D4682F",
  teal: "#2ABFBF", tealSoft: "rgba(42,191,191,0.08)", tealBorder: "rgba(42,191,191,0.2)",
  green: "#38A169", greenSoft: "rgba(56,161,105,0.08)",
  white: "#FFFFFF", gray50: "#F9FAFB", gray100: "#F3F4F6",
  gray200: "#E5E7EB", gray300: "#D1D5DB", gray400: "#9CA3AF",
  gray500: "#6B7280", gray600: "#4B5563", gray700: "#374151",
  gray800: "#1F2937", gray900: "#111827",
};

// ── Shared utilities ──
const DotPattern = ({ opacity = 0.35 }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity }}>
    <svg width="100%" height="100%"><defs><pattern id="dp" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill={C.gray300} /></pattern></defs><rect width="100%" height="100%" fill="url(#dp)" /></svg>
  </div>
);

const GlowOrb = ({ color, size, top, left, right, bottom, opacity = 0.1 }) => (
  <div style={{ position: "absolute", width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, top, left, right, bottom, opacity, pointerEvents: "none", filter: "blur(60px)" }} />
);

function FadeIn({ children, delay = 0, direction = "up" }) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const t = { up: "translateY(28px)", down: "translateY(-28px)", left: "translateX(28px)", right: "translateX(-28px)", none: "none" };
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : t[direction], transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>{children}</div>;
}

const Badge = ({ children, color = C.teal, bg }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: bg || `${color}12`, border: `1px solid ${color}25`, fontSize: 12, fontWeight: 600, color, fontFamily: "Plus Jakarta Sans, sans-serif" }}>{children}</span>
);

const Btn = ({ children, variant = "primary", color = C.orange, onClick, fullWidth }) => {
  const isPrimary = variant === "primary";
  return (
    <button onClick={onClick} style={{
      padding: "13px 28px", borderRadius: 10, border: isPrimary ? "none" : `2px solid ${C.gray200}`,
      background: isPrimary ? color : "transparent", color: isPrimary ? "white" : C.navy,
      fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif",
      boxShadow: isPrimary ? `0 4px 14px ${color}50` : "none", transition: "all 0.2s",
      width: fullWidth ? "100%" : "auto",
    }}
      onMouseEnter={e => { if (isPrimary) { e.target.style.transform = "translateY(-1px)"; } else { e.target.style.borderColor = C.navy; } }}
      onMouseLeave={e => { e.target.style.transform = "none"; if (!isPrimary) e.target.style.borderColor = C.gray200; }}
    >{children}</button>
  );
};

const SectionDivider = ({ label }) => (
  <div style={{ background: C.navy, padding: "20px 48px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.1)" }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontFamily: "Plus Jakarta Sans, sans-serif" }}>{label}</span>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.1)" }} />
    </div>
  </div>
);

// ── Icons (SVG inline) ──
const Icons = {
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  HardHat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/><path d="M10 15V6a4 4 0 014 0v9"/><path d="M4 15v-3a8 8 0 0116 0v3"/></svg>,
  PenTool: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  Layout: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Shield: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  File: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Chart: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  FileCheck: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>,
  Calc: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/></svg>,
  Store: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 21V9"/></svg>,
  Briefcase: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  Calendar: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Dollar: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  Gavel: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5l6 6M4 20l6.5-6.5M2 22l2-2M14.5 9.5L9 15M6.5 3.5L3 7l7 7 3.5-3.5"/><path d="M14.5 9.5l4-4"/></svg>,
  GitBranch: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>,
  Package: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  CreditCard: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Folder: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  Handshake: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 8l-4-4-6 6-4-4-4 4 10 10 4-4"/><path d="M14 12l2 2"/><path d="M18 8l2 2"/></svg>,
};

const FeatureCard = ({ icon: IconComp, title, desc, color = C.teal }) => (
  <div style={{
    background: C.white, borderRadius: 14, padding: 24, border: `1px solid ${C.gray200}`,
    transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(26,43,74,0.08)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}12`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 16 }}>
      <IconComp />
    </div>
    <h4 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: "0 0 6px 0", fontFamily: "Plus Jakarta Sans, sans-serif" }}>{title}</h4>
    <p style={{ fontSize: 14, color: C.gray500, margin: 0, lineHeight: 1.6 }}>{desc}</p>
  </div>
);

// ═══════════════════════════════════════════════════
// PROMPT 38: PORTAL TABS NAVIGATION
// ═══════════════════════════════════════════════════
const portals = [
  { id: "homeowner", label: "Homeowner", icon: Icons.Home, color: C.navy, subtitle: "For residential projects" },
  { id: "contractor", label: "Contractor", icon: Icons.HardHat, color: C.orange, subtitle: "For GCs & builders" },
  { id: "professional", label: "Professional", icon: Icons.PenTool, color: C.teal, subtitle: "For architects & engineers" },
];

const PortalTabs = ({ active, onChange }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef({});

  useEffect(() => {
    const el = tabRefs.current[active];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [active]);

  const activePortal = portals.find(p => p.id === active);

  return (
    <div style={{ borderBottom: `1px solid ${C.gray200}`, background: C.white }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", position: "relative" }}>
        <div role="tablist" style={{ display: "flex", gap: 0, position: "relative" }}>
          {portals.map(p => {
            const isActive = active === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                ref={el => tabRefs.current[p.id] = el}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(p.id)}
                style={{
                  padding: "16px 28px", border: "none", background: "transparent",
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  color: isActive ? p.color : C.gray500,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 15, fontFamily: "Plus Jakarta Sans, sans-serif",
                  transition: "color 0.2s",
                  position: "relative",
                }}
              >
                <Icon />{p.label}
              </button>
            );
          })}
          {/* Sliding indicator */}
          <div style={{
            position: "absolute", bottom: -1, height: 3, borderRadius: "3px 3px 0 0",
            background: activePortal?.color || C.navy,
            transition: "left 0.3s cubic-bezier(0.16,1,0.3,1), width 0.3s cubic-bezier(0.16,1,0.3,1)",
            ...indicatorStyle,
          }} />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PROMPT 35: HOMEOWNER PORTAL LANDING
// ═══════════════════════════════════════════════════
const HomeownerPortal = () => (
  <div>
    {/* Hero */}
    <section style={{ position: "relative", padding: "80px 0 60px", background: C.white, overflow: "hidden", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <DotPattern /><GlowOrb color={C.teal} size={500} top="-200px" right="-100px" /><GlowOrb color={C.orange} size={300} bottom="-50px" left="5%" opacity={0.06} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
        <div>
          <FadeIn><Badge color={C.navy}>For Residential Homeowners</Badge></FadeIn>
          <FadeIn delay={0.08}><h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.08, color: C.navy, margin: "24px 0 16px", letterSpacing: "-0.03em", fontFamily: "'Clash Display', sans-serif" }}>Take Control of Your <span style={{ color: C.orange }}>Construction</span> Project</h1></FadeIn>
          <FadeIn delay={0.14}><p style={{ fontSize: 18, lineHeight: 1.7, color: C.gray600, margin: "0 0 32px", maxWidth: 460 }}>From permits to final walkthrough. Track progress, manage contractors, and protect your investment — all in one place.</p></FadeIn>
          <FadeIn delay={0.2}>
            <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
              <Btn>Start Free Trial →</Btn>
              <Btn variant="outline">Watch Demo</Btn>
            </div>
          </FadeIn>
          <FadeIn delay={0.28}>
            <div style={{ display: "flex", gap: 28, padding: "18px 0", borderTop: `1px solid ${C.gray200}` }}>
              {[{ v: "500+", l: "Homeowners" }, { v: "Escrow", l: "Protection" }, { v: "24/7", l: "Support" }].map((s, i) => (
                <div key={i}><div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div><div style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>{s.l}</div></div>
              ))}
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.15} direction="left">
          <div style={{ background: C.gray50, borderRadius: 16, border: `1px solid ${C.gray200}`, height: 380, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray400, fontSize: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
              <div style={{ fontWeight: 600, color: C.navy }}>Homeowner Dashboard Preview</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Project status • Budget • Timeline</div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>

    {/* Features */}
    <section style={{ padding: "72px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 36, fontWeight: 800, color: C.navy, margin: "0 0 8px", letterSpacing: "-0.02em", fontFamily: "'Clash Display', sans-serif" }}>Everything You Need to Build with Confidence</h2></FadeIn>
        <FadeIn delay={0.05}><p style={{ fontSize: 16, color: C.gray500, margin: "0 0 40px", maxWidth: 520 }}>Six core capabilities that put you in the driver's seat of your project.</p></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { icon: Icons.Layout, title: "Project Dashboard", desc: "Real-time visibility into your project status, timeline, and budget.", color: C.navy },
            { icon: Icons.Users, title: "Contractor Management", desc: "Find, vet, and manage contractors with verified reviews and insurance.", color: C.orange },
            { icon: Icons.Shield, title: "Payment Protection", desc: "Milestone-based escrow keeps your money safe until work is approved.", color: C.green },
            { icon: Icons.File, title: "Document Storage", desc: "All contracts, plans, and permits in one secure location.", color: C.teal },
            { icon: Icons.Chart, title: "Progress Tracking", desc: "Photo updates, milestone tracking, and automated progress reports.", color: C.orange },
            { icon: Icons.FileCheck, title: "Permit Coordination", desc: "We handle permit applications and inspection scheduling for you.", color: C.green },
          ].map((f, i) => <FadeIn key={i} delay={0.05 + i * 0.05}><FeatureCard {...f} /></FadeIn>)}
        </div>
      </div>
    </section>

    {/* Integrated Services */}
    <section style={{ padding: "72px 0", background: C.white, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 32, fontWeight: 800, color: C.navy, margin: "0 0 8px", fontFamily: "'Clash Display', sans-serif" }}>Powerful Services at Your Fingertips</h2></FadeIn>
        <FadeIn delay={0.05}><p style={{ fontSize: 16, color: C.gray500, margin: "0 0 36px" }}>Access these services directly from your dashboard</p></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { icon: Icons.Calc, title: "Estimation Services", desc: "Get AI-powered estimates before you commit", price: "From $299", color: C.teal },
            { icon: Icons.FileCheck, title: "Permits & Inspections", desc: "85% first-try approval rate", price: "From $495", color: C.green },
            { icon: Icons.Store, title: "Contractor Marketplace", desc: "Find verified contractors with fair bidding", price: "Free to browse", color: C.navy },
            { icon: Icons.Briefcase, title: "PM Services", desc: "Let experts manage your project remotely", price: "From $1,750/mo", color: C.orange },
          ].map((s, i) => (
            <FadeIn key={i} delay={0.05 + i * 0.06}>
              <div style={{ background: `${s.color}06`, borderRadius: 14, padding: 22, border: `1px solid ${s.color}15`, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}12`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, marginBottom: 14 }}><s.icon /></div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>{s.title}</h4>
                <p style={{ fontSize: 13, color: C.gray500, margin: "0 0 14px", lineHeight: 1.5 }}>{s.desc}</p>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 14 }}>{s.price}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.color, cursor: "pointer" }}>Learn More →</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing */}
    <section style={{ padding: "72px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 32, fontWeight: 800, color: C.navy, margin: "0 0 8px", textAlign: "center", fontFamily: "'Clash Display', sans-serif" }}>Simple, Transparent Pricing</h2></FadeIn>
        <FadeIn delay={0.05}><p style={{ fontSize: 16, color: C.gray500, textAlign: "center", margin: "0 0 40px" }}>Start free, upgrade when you're ready.</p></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 960, margin: "0 auto" }}>
          {[
            { name: "Starter", price: "$49", period: "/mo", desc: "1 project", pop: false },
            { name: "Growth", price: "$149", period: "/mo", desc: "3 projects", pop: true },
            { name: "Professional", price: "$299", period: "/mo", desc: "10 projects", pop: false },
          ].map((t, i) => (
            <FadeIn key={i} delay={0.08 + i * 0.06}>
              <div style={{
                background: C.white, borderRadius: 16, padding: 28,
                border: t.pop ? `2px solid ${C.orange}` : `1px solid ${C.gray200}`,
                boxShadow: t.pop ? "0 8px 28px rgba(232,121,58,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                position: "relative", textAlign: "center",
              }}>
                {t.pop && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.orange, color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, letterSpacing: "0.05em" }}>POPULAR</div>}
                <div style={{ fontSize: 14, fontWeight: 600, color: C.gray500, marginBottom: 8 }}>{t.name}</div>
                <div style={{ fontSize: 44, fontWeight: 700, color: C.navy, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{t.price}<span style={{ fontSize: 16, color: C.gray400 }}>{t.period}</span></div>
                <div style={{ fontSize: 14, color: C.gray500, margin: "8px 0 24px" }}>{t.desc}</div>
                <Btn variant={t.pop ? "primary" : "outline"} fullWidth>Start Free Trial</Btn>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section style={{ padding: "72px 0", background: C.white, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 32, fontWeight: 800, color: C.navy, textAlign: "center", margin: "0 0 48px", fontFamily: "'Clash Display', sans-serif" }}>How It Works</h2></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          {[
            { step: "1", title: "Create your project", desc: "Enter your project details, location, and budget. Takes less than 5 minutes.", icon: "📋" },
            { step: "2", title: "Invite your contractor", desc: "Find one through our marketplace or invite your existing contractor to collaborate.", icon: "🤝" },
            { step: "3", title: "Track & pay securely", desc: "Monitor progress in real-time and release payments through escrow when milestones are met.", icon: "🔒" },
          ].map((s, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.1}>
              <div style={{ textAlign: "center", position: "relative" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${C.orange}10`, border: `2px solid ${C.orange}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>{s.icon}</div>
                <div style={{ display: "inline-flex", width: 28, height: 28, borderRadius: "50%", background: C.navy, color: "white", fontSize: 13, fontWeight: 700, alignItems: "center", justifyContent: "center", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>{s.step}</div>
                <h4 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: "0 0 8px" }}>{s.title}</h4>
                <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonial */}
    <section style={{ padding: "64px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 48px", textAlign: "center" }}>
        <FadeIn>
          <div style={{ fontSize: 20, lineHeight: 1.7, color: C.navy, fontStyle: "italic", fontWeight: 500, margin: "0 0 20px" }}>
            "Kealee saved me from a nightmare contractor situation. The escrow protection alone is worth every penny."
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 }}>SH</div>
            <div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Sarah Henderson</div><div style={{ fontSize: 12, color: C.gray500 }}>Silver Spring, MD • Kitchen Renovation</div></div>
          </div>
        </FadeIn>
      </div>
    </section>

    {/* Final CTA */}
    <section style={{ padding: "72px 0", background: C.navy, fontFamily: "Plus Jakarta Sans, sans-serif", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <GlowOrb color={C.orange} size={400} top="-150px" right="10%" opacity={0.12} />
      <GlowOrb color={C.teal} size={300} bottom="-100px" left="15%" opacity={0.08} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 36, fontWeight: 800, color: "white", margin: "0 0 12px", fontFamily: "'Clash Display', sans-serif" }}>Ready to build with confidence?</h2></FadeIn>
        <FadeIn delay={0.08}><p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", margin: "0 0 32px" }}>No credit card required</p></FadeIn>
        <FadeIn delay={0.14}>
          <div style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto" }}>
            <input placeholder="Enter your email" style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 15, fontFamily: "Plus Jakarta Sans, sans-serif", outline: "none" }} />
            <Btn>Get Started →</Btn>
          </div>
        </FadeIn>
      </div>
    </section>
  </div>
);

// ═══════════════════════════════════════════════════
// PROMPT 36: CONTRACTOR PORTAL LANDING
// ═══════════════════════════════════════════════════
const ContractorPortal = () => (
  <div>
    {/* Hero */}
    <section style={{ position: "relative", padding: "80px 0 60px", background: C.white, overflow: "hidden", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <DotPattern /><GlowOrb color={C.orange} size={500} top="-200px" right="-100px" opacity={0.08} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
        <div>
          <FadeIn><Badge color={C.orange}>For GCs, Builders & Developers</Badge></FadeIn>
          <FadeIn delay={0.08}><h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.08, color: C.navy, margin: "24px 0 16px", letterSpacing: "-0.03em", fontFamily: "'Clash Display', sans-serif" }}>Win More Bids.<br /><span style={{ color: C.orange }}>Build Smarter.</span></h1></FadeIn>
          <FadeIn delay={0.14}><p style={{ fontSize: 18, lineHeight: 1.7, color: C.gray600, margin: "0 0 32px", maxWidth: 460 }}>The all-in-one platform for managing projects, estimates, and teams. Built for contractors who want to grow.</p></FadeIn>
          <FadeIn delay={0.2}>
            <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
              <Btn>Start Free Trial →</Btn>
              <Btn variant="outline">See Pricing</Btn>
            </div>
          </FadeIn>
          <FadeIn delay={0.28}>
            <div style={{ display: "flex", gap: 28, padding: "18px 0", borderTop: `1px solid ${C.gray200}` }}>
              {[{ v: "1,000+", l: "Contractors" }, { v: "$50M+", l: "Projects" }, { v: "100+", l: "Assemblies" }].map((s, i) => (
                <div key={i}><div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div><div style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>{s.l}</div></div>
              ))}
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.15} direction="left">
          <div style={{ background: C.gray50, borderRadius: 16, border: `1px solid ${C.gray200}`, height: 380, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: C.gray400 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️</div>
              <div style={{ fontWeight: 600, color: C.navy, fontSize: 14 }}>Contractor Command Center</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Multi-project • Bids • Estimates</div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>

    {/* Features */}
    <section style={{ padding: "72px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 36, fontWeight: 800, color: C.navy, margin: "0 0 8px", fontFamily: "'Clash Display', sans-serif" }}>Built for How You Work</h2></FadeIn>
        <FadeIn delay={0.05}><p style={{ fontSize: 16, color: C.gray500, margin: "0 0 40px" }}>Everything a modern contractor needs, in one platform.</p></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { icon: Icons.Folder, title: "Multi-Project Dashboard", desc: "Manage all your projects from a single command center.", color: C.navy },
            { icon: Icons.Gavel, title: "Bid Management", desc: "Find opportunities, submit bids, and track win rates.", color: C.orange },
            { icon: Icons.Calc, title: "Estimation Tools", desc: "Full estimation suite with 100+ pre-built assemblies.", color: C.teal },
            { icon: Icons.Users, title: "Team Collaboration", desc: "Invite team members and subcontractors with role-based access.", color: C.navy },
            { icon: Icons.Calendar, title: "Scheduling & Gantt", desc: "Visual scheduling with dependencies and resource allocation.", color: C.green },
            { icon: Icons.Dollar, title: "Financial Tracking", desc: "Invoice clients, track payments, and manage cash flow.", color: C.orange },
          ].map((f, i) => <FadeIn key={i} delay={0.05 + i * 0.05}><FeatureCard {...f} /></FadeIn>)}
        </div>
      </div>
    </section>

    {/* Who It's For */}
    <section style={{ padding: "72px 0", background: C.white, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 32, fontWeight: 800, color: C.navy, margin: "0 0 40px", textAlign: "center", fontFamily: "'Clash Display', sans-serif" }}>Built for Growing Contractors</h2></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { emoji: "🏠", title: "General Contractors", desc: "Manage multiple residential and commercial projects with a unified dashboard." },
            { emoji: "🏢", title: "Builders & Developers", desc: "Track budgets, timelines, and subcontractors at scale across portfolios." },
            { emoji: "⚡", title: "Specialty Contractors", desc: "Bid on projects and grow your client base through the marketplace." },
          ].map((p, i) => (
            <FadeIn key={i} delay={0.08 + i * 0.08}>
              <div style={{ textAlign: "center", padding: 28, borderRadius: 14, border: `1px solid ${C.gray200}`, background: C.white }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{p.emoji}</div>
                <h4 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: "0 0 8px" }}>{p.title}</h4>
                <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing */}
    <section style={{ padding: "72px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 32, fontWeight: 800, color: C.navy, textAlign: "center", margin: "0 0 40px", fontFamily: "'Clash Display', sans-serif" }}>Plans That Scale With You</h2></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { name: "Starter", price: "$99", desc: "1–3 projects", pop: false },
            { name: "Professional", price: "$249", desc: "10 projects", pop: true },
            { name: "Business", price: "$499", desc: "25 projects", pop: false },
            { name: "Enterprise", price: "Custom", desc: "Unlimited", pop: false },
          ].map((t, i) => (
            <FadeIn key={i} delay={0.06 + i * 0.06}>
              <div style={{
                background: C.white, borderRadius: 16, padding: 24, textAlign: "center",
                border: t.pop ? `2px solid ${C.orange}` : `1px solid ${C.gray200}`,
                boxShadow: t.pop ? "0 8px 28px rgba(232,121,58,0.12)" : "none",
                position: "relative",
              }}>
                {t.pop && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.orange, color: "white", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, letterSpacing: "0.05em" }}>MOST POPULAR</div>}
                <div style={{ fontSize: 14, fontWeight: 600, color: C.gray500, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: C.navy, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{t.price}{t.price !== "Custom" && <span style={{ fontSize: 15, color: C.gray400 }}>/mo</span>}</div>
                <div style={{ fontSize: 13, color: C.gray500, margin: "8px 0 20px" }}>{t.desc}</div>
                <Btn variant={t.pop ? "primary" : "outline"} fullWidth>{t.price === "Custom" ? "Contact Sales" : "Start Free Trial"}</Btn>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>

    {/* Stats */}
    <section style={{ padding: "48px 0", background: C.navy, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "flex", justifyContent: "center", gap: 64 }}>
        {[{ v: "40%", l: "Faster estimates" }, { v: "25%", l: "Better bid accuracy" }, { v: "10+", l: "Hours saved weekly" }].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.orange, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Testimonial + CTA */}
    <section style={{ padding: "64px 0", background: C.white, fontFamily: "Plus Jakarta Sans, sans-serif", textAlign: "center" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn>
          <div style={{ fontSize: 20, lineHeight: 1.7, color: C.navy, fontStyle: "italic", fontWeight: 500, margin: "0 0 20px" }}>"We increased our bid win rate by 40% using Kealee's estimation tools."</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>MR</div>
            <div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Mike Rodriguez</div><div style={{ fontSize: 12, color: C.gray500 }}>Rodriguez Construction • 35 projects</div></div>
          </div>
        </FadeIn>
      </div>
    </section>

    <section style={{ padding: "72px 0", background: C.navy, fontFamily: "Plus Jakarta Sans, sans-serif", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <GlowOrb color={C.orange} size={400} top="-150px" left="15%" opacity={0.12} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 36, fontWeight: 800, color: "white", margin: "0 0 12px", fontFamily: "'Clash Display', sans-serif" }}>Ready to grow your business?</h2></FadeIn>
        <FadeIn delay={0.06}><p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 28px" }}>14-day free trial. No credit card required.</p></FadeIn>
        <FadeIn delay={0.12}>
          <div style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto" }}>
            <input placeholder="Enter your email" style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 15, fontFamily: "Plus Jakarta Sans, sans-serif", outline: "none" }} />
            <Btn>Start Free Trial</Btn>
          </div>
        </FadeIn>
      </div>
    </section>
  </div>
);

// ═══════════════════════════════════════════════════
// PROMPT 37: PROFESSIONAL PORTAL LANDING
// ═══════════════════════════════════════════════════
const ProfessionalPortal = () => (
  <div>
    {/* Hero */}
    <section style={{ position: "relative", padding: "80px 0 60px", background: C.white, overflow: "hidden", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <DotPattern /><GlowOrb color={C.teal} size={500} top="-200px" left="-100px" opacity={0.08} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
        <div>
          <FadeIn><Badge color={C.teal}>For Architects, Designers & Engineers</Badge></FadeIn>
          <FadeIn delay={0.08}><h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.08, color: C.navy, margin: "24px 0 16px", letterSpacing: "-0.03em", fontFamily: "'Clash Display', sans-serif" }}>Design Projects,<br /><span style={{ color: C.teal }}>Managed Beautifully</span></h1></FadeIn>
          <FadeIn delay={0.14}><p style={{ fontSize: 18, lineHeight: 1.7, color: C.gray600, margin: "0 0 32px", maxWidth: 460 }}>Track deliverables, collaborate with clients, and get paid on time. The platform built for design professionals.</p></FadeIn>
          <FadeIn delay={0.2}>
            <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
              <Btn color={C.teal}>Start Free →</Btn>
              <Btn variant="outline">See How It Works</Btn>
            </div>
          </FadeIn>
          <FadeIn delay={0.28}>
            <div style={{ display: "flex", gap: 28, padding: "18px 0", borderTop: `1px solid ${C.gray200}` }}>
              {[{ v: "500+", l: "Professionals" }, { v: "Free", l: "Tier available" }, { v: "AIA", l: "Member discounts" }].map((s, i) => (
                <div key={i}><div style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div><div style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>{s.l}</div></div>
              ))}
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.15} direction="left">
          <div style={{ background: C.gray50, borderRadius: 16, border: `1px solid ${C.gray200}`, height: 380, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: C.gray400 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📐</div>
              <div style={{ fontWeight: 600, color: C.navy, fontSize: 14 }}>Design Practice Dashboard</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Phases • Deliverables • Fees</div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>

    {/* Features */}
    <section style={{ padding: "72px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 36, fontWeight: 800, color: C.navy, margin: "0 0 8px", fontFamily: "'Clash Display', sans-serif" }}>Streamline Your Design Practice</h2></FadeIn>
        <FadeIn delay={0.05}><p style={{ fontSize: 16, color: C.gray500, margin: "0 0 40px" }}>Purpose-built for how design professionals actually work.</p></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { icon: Icons.GitBranch, title: "Phase Tracking", desc: "Track projects through Pre-Design, SD, DD, CD, and CA phases.", color: C.teal },
            { icon: Icons.Package, title: "Deliverable Management", desc: "Upload, version, and share deliverables with built-in client review.", color: C.navy },
            { icon: Icons.Users, title: "Client Collaboration", desc: "Client portal for comments, approvals, and communication.", color: C.orange },
            { icon: Icons.CreditCard, title: "Fee Management", desc: "Milestone invoicing with percentage-of-fee tracking.", color: C.green },
            { icon: Icons.FileCheck, title: "Permit Coordination", desc: "Submit permits and track approvals without the headache.", color: C.green },
            { icon: Icons.File, title: "Document Control", desc: "Organize drawings, specs, and project files with versioning.", color: C.teal },
          ].map((f, i) => <FadeIn key={i} delay={0.05 + i * 0.05}><FeatureCard {...f} /></FadeIn>)}
        </div>
      </div>
    </section>

    {/* Phase Workflow */}
    <section style={{ padding: "72px 0", background: C.white, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 32, fontWeight: 800, color: C.navy, textAlign: "center", margin: "0 0 48px", fontFamily: "'Clash Display', sans-serif" }}>Track Every Phase of Design</h2></FadeIn>
        <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
          {[
            { phase: "Pre-Design", pct: "10%", color: C.gray400 },
            { phase: "Schematic", pct: "15%", color: C.teal },
            { phase: "Design Dev", pct: "20%", color: C.teal },
            { phase: "Const Docs", pct: "35%", color: C.orange },
            { phase: "Permit", pct: "5%", color: C.green },
            { phase: "Const Admin", pct: "15%", color: C.navy },
          ].map((p, i) => (
            <FadeIn key={i} delay={0.05 + i * 0.06}>
              <div style={{
                flex: `0 0 ${parseFloat(p.pct) * 2.5}%`, minWidth: 100,
                background: `${p.color}10`, borderTop: `4px solid ${p.color}`,
                padding: "16px 14px", textAlign: "center",
                borderRight: i < 5 ? `1px solid ${C.gray200}` : "none",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>{p.phase}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: "'JetBrains Mono', monospace" }}>{p.pct}</div>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.4}><p style={{ fontSize: 13, color: C.gray400, textAlign: "center", marginTop: 16 }}>Fee allocation percentages shown — platform tracks progress within each phase</p></FadeIn>
      </div>
    </section>

    {/* Pricing */}
    <section style={{ padding: "72px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 32, fontWeight: 800, color: C.navy, textAlign: "center", margin: "0 0 40px", fontFamily: "'Clash Display', sans-serif" }}>Start Free, Scale as You Grow</h2></FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 960, margin: "0 auto" }}>
          {[
            { name: "Free", price: "$0", period: "/forever", desc: "3 projects", pop: false, cta: "Get Started" },
            { name: "Professional", price: "3%", period: " of project", desc: "Unlimited projects", pop: true, cta: "Start Free Trial" },
            { name: "Firm", price: "Custom", period: "", desc: "Multi-user, white-label", pop: false, cta: "Contact Sales" },
          ].map((t, i) => (
            <FadeIn key={i} delay={0.08 + i * 0.06}>
              <div style={{
                background: C.white, borderRadius: 16, padding: 28, textAlign: "center",
                border: t.pop ? `2px solid ${C.teal}` : `1px solid ${C.gray200}`,
                boxShadow: t.pop ? "0 8px 28px rgba(42,191,191,0.12)" : "none",
                position: "relative",
              }}>
                {t.pop && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.teal, color: "white", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, letterSpacing: "0.05em" }}>RECOMMENDED</div>}
                <div style={{ fontSize: 14, fontWeight: 600, color: C.gray500, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 44, fontWeight: 700, color: C.navy, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{t.price}<span style={{ fontSize: 15, color: C.gray400 }}>{t.period}</span></div>
                <div style={{ fontSize: 13, color: C.gray500, margin: "8px 0 20px" }}>{t.desc}</div>
                <Btn variant={t.pop ? "primary" : "outline"} color={C.teal} fullWidth>{t.cta}</Btn>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3}><p style={{ textAlign: "center", fontSize: 13, color: C.gray400, marginTop: 16 }}>Free tier includes 3 projects. No credit card required.</p></FadeIn>
      </div>
    </section>

    {/* Testimonial + CTA */}
    <section style={{ padding: "64px 0", background: C.white, fontFamily: "Plus Jakarta Sans, sans-serif", textAlign: "center" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn>
          <div style={{ fontSize: 20, lineHeight: 1.7, color: C.navy, fontStyle: "italic", fontWeight: 500, margin: "0 0 20px" }}>"Finally, a platform that understands how architects work. The phase tracking alone has transformed our practice."</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>LK</div>
            <div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Lisa Kim, AIA</div><div style={{ fontSize: 12, color: C.gray500 }}>Kim Architecture Studio, Baltimore</div></div>
          </div>
        </FadeIn>
      </div>
    </section>

    <section style={{ padding: "72px 0", background: C.navy, fontFamily: "Plus Jakarta Sans, sans-serif", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <GlowOrb color={C.teal} size={400} top="-150px" right="10%" opacity={0.12} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn><h2 style={{ fontSize: 36, fontWeight: 800, color: "white", margin: "0 0 12px", fontFamily: "'Clash Display', sans-serif" }}>Ready to elevate your practice?</h2></FadeIn>
        <FadeIn delay={0.06}><p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 28px" }}>Free tier includes 3 projects. No credit card required.</p></FadeIn>
        <FadeIn delay={0.12}>
          <div style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto" }}>
            <input placeholder="Enter your email" style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 15, fontFamily: "Plus Jakarta Sans, sans-serif", outline: "none" }} />
            <Btn color={C.teal}>Get Started →</Btn>
          </div>
        </FadeIn>
      </div>
    </section>
  </div>
);

// ═══════════════════════════════════════════════════
// PROMPT 39: COMPARISON TABLE
// ═══════════════════════════════════════════════════
const ComparisonTable = () => {
  const headers = [
    { label: "Homeowner", icon: Icons.Home, color: C.navy, url: "app.kealee.com" },
    { label: "Contractor", icon: Icons.HardHat, color: C.orange, url: "contractor.kealee.com" },
    { label: "Professional", icon: Icons.PenTool, color: C.teal, url: "professional.kealee.com" },
  ];

  const sections = [
    { title: "Core Features", rows: [
      { feature: "Project Dashboard", vals: ["✓", "✓ Multi-project", "✓ Phase-based"] },
      { feature: "Document Storage", vals: ["✓", "✓", "✓"] },
      { feature: "Progress Tracking", vals: ["✓", "✓", "✓ Deliverables"] },
      { feature: "Payment Management", vals: ["✓ Escrow", "✓ Invoicing", "✓ Fee tracking"] },
      { feature: "Team Collaboration", vals: ["—", "✓", "✓"] },
      { feature: "Client Portal", vals: ["—", "—", "✓"] },
    ]},
    { title: "Services Access", rows: [
      { feature: "Estimation", vals: ["✓ Request", "✓ Full suite", "✓ Request"] },
      { feature: "Permits", vals: ["✓", "✓", "✓"] },
      { feature: "Marketplace", vals: ["✓ Find contractors", "✓ Receive bids", "—"] },
      { feature: "PM Services", vals: ["✓", "✓", "—"] },
    ]},
    { title: "Unique Features", rows: [
      { feature: "Escrow Protection", vals: ["✓", "—", "—"] },
      { feature: "Assembly Library", vals: ["—", "✓", "—"] },
      { feature: "Bid Management", vals: ["—", "✓", "—"] },
      { feature: "Gantt Scheduling", vals: ["—", "✓", "—"] },
      { feature: "Phase Tracking", vals: ["—", "—", "✓"] },
      { feature: "Client Review Portal", vals: ["—", "—", "✓"] },
    ]},
  ];

  return (
    <section style={{ padding: "80px 0", background: C.white, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: C.navy, textAlign: "center", margin: "0 0 8px", fontFamily: "'Clash Display', sans-serif" }}>Choose the Right Portal for You</h2>
          <p style={{ fontSize: 16, color: C.gray500, textAlign: "center", margin: "0 0 48px" }}>Compare features across Homeowner, Contractor, and Professional portals</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ borderRadius: 16, border: `1px solid ${C.gray200}`, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 1fr 1fr", background: C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
              <div style={{ padding: "20px 24px", fontWeight: 700, color: C.navy, fontSize: 14 }}>Feature</div>
              {headers.map((h, i) => {
                const Icon = h.icon;
                return (
                  <div key={i} style={{ padding: "20px 24px", textAlign: "center", borderLeft: `1px solid ${C.gray200}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: h.color, marginBottom: 4 }}>
                      <Icon /><span style={{ fontWeight: 700, fontSize: 15 }}>{h.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.gray400, fontFamily: "'JetBrains Mono', monospace" }}>{h.url}</div>
                  </div>
                );
              })}
            </div>

            {sections.map((sec, si) => (
              <div key={si}>
                <div style={{ padding: "12px 24px", background: C.navy, color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{sec.title}</div>
                {sec.rows.map((row, ri) => (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "240px 1fr 1fr 1fr", borderBottom: `1px solid ${C.gray100}`, background: ri % 2 === 0 ? C.white : C.gray50 }}>
                    <div style={{ padding: "14px 24px", fontSize: 14, fontWeight: 600, color: C.navy }}>{row.feature}</div>
                    {row.vals.map((v, vi) => (
                      <div key={vi} style={{ padding: "14px 24px", textAlign: "center", borderLeft: `1px solid ${C.gray100}`, fontSize: 13, color: v === "—" ? C.gray300 : v.startsWith("✓") ? C.green : C.gray700, fontWeight: v.startsWith("✓") ? 600 : 400 }}>
                        {v}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* Pricing row */}
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 1fr 1fr", borderTop: `2px solid ${C.gray200}`, background: C.gray50 }}>
              <div style={{ padding: "20px 24px", fontSize: 14, fontWeight: 700, color: C.navy }}>Starting at</div>
              {[{ p: "$49/mo", c: C.navy }, { p: "$99/mo", c: C.orange }, { p: "Free", c: C.teal }].map((pr, i) => (
                <div key={i} style={{ padding: "20px 24px", textAlign: "center", borderLeft: `1px solid ${C.gray200}` }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: pr.c, fontFamily: "'JetBrains Mono', monospace" }}>{pr.p}</span>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 1fr 1fr", background: C.white }}>
              <div style={{ padding: "20px 24px" }} />
              {[{ label: "Get Started", c: C.orange }, { label: "Start Trial", c: C.orange }, { label: "Start Free", c: C.teal }].map((ct, i) => (
                <div key={i} style={{ padding: "16px 24px", textAlign: "center", borderLeft: `1px solid ${C.gray100}` }}>
                  <Btn color={ct.c}>{ct.label} →</Btn>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════
// PROMPT 40: INTEGRATED SERVICES SHOWCASE
// ═══════════════════════════════════════════════════
const ServicesShowcase = () => {
  const services = [
    {
      icon: Icons.Calc, title: "AI-Powered Estimation", color: C.teal,
      desc: "Get accurate construction estimates in 24–48 hours. Material takeoffs, labor analysis, and cash flow projections.",
      price: "From $299",
      features: ["100+ pre-built assemblies", "Regional cost indices", "Value engineering options"],
      available: ["Homeowner", "Contractor", "Professional"],
    },
    {
      icon: Icons.FileCheck, title: "Permit Processing", color: C.green,
      desc: "AI-powered permit applications with 85% first-try approval. We handle the paperwork.",
      price: "From $495",
      features: ["3,000+ jurisdictions", "Inspection scheduling", "Approval guarantee"],
      available: ["Homeowner", "Contractor", "Professional"],
    },
    {
      icon: Icons.Store, title: "Fair Bidding Platform", color: C.navy,
      desc: "Find verified contractors or receive qualified bid invitations. No pay-to-play.",
      price: "Free to browse",
      features: ["Verified contractors", "Insurance checked", "3.5% commission only"],
      available: ["Homeowner", "Contractor"],
    },
    {
      // CORRECTED: "Site visits included" → "Remote coordination" per os-pm remote-only rule
      icon: Icons.Briefcase, title: "Managed PM Services", color: C.orange,
      desc: "Let our expert PM team coordinate your project remotely through the platform.",
      price: "From $1,750/mo",
      features: ["Dedicated PM assigned", "Remote coordination", "Contractor scheduling"],
      available: ["Homeowner", "Contractor"],
    },
    {
      icon: Icons.Shield, title: "Secure Payments", color: C.green,
      desc: "Milestone-based escrow, payment processing, and dispute resolution.",
      price: "1% escrow fee (max $500)",
      features: ["Escrow protection", "Fraud prevention", "Dispute mediation"],
      available: ["Homeowner", "Contractor", "Professional"],
    },
  ];

  const portalColors = { Homeowner: C.navy, Contractor: C.orange, Professional: C.teal };

  return (
    <section style={{ padding: "80px 0", background: C.gray50, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <FadeIn>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: C.navy, textAlign: "center", margin: "0 0 8px", fontFamily: "'Clash Display', sans-serif" }}>Powerful Services, One Platform</h2>
          <p style={{ fontSize: 16, color: C.gray500, textAlign: "center", margin: "0 0 48px" }}>Access these services directly from your dashboard — no switching apps</p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <FadeIn key={i} delay={0.06 + i * 0.06}>
                <div style={{
                  background: C.white, borderRadius: 16, padding: 22,
                  border: `1px solid ${C.gray200}`,
                  display: "flex", flexDirection: "column", height: "100%",
                  transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${svc.color}15`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${svc.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: svc.color, marginBottom: 14 }}><Icon /></div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>{svc.title}</h4>
                  <p style={{ fontSize: 13, color: C.gray500, margin: "0 0 14px", lineHeight: 1.55, flex: 1 }}>{svc.desc}</p>

                  <div style={{ fontSize: 18, fontWeight: 700, color: svc.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 14 }}>{svc.price}</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                    {svc.features.map((f, fi) => (
                      <div key={fi} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.green, flexShrink: 0 }}><Icons.Check /></span>
                        <span style={{ fontSize: 12, color: C.gray600 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                    {svc.available.map((a, ai) => (
                      <span key={ai} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${portalColors[a]}10`, color: portalColors[a], fontWeight: 600 }}>{a}</span>
                    ))}
                  </div>

                  <span style={{ fontSize: 13, fontWeight: 600, color: svc.color, cursor: "pointer", marginTop: "auto" }}>Learn More →</span>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP — Full Portal Experience
// ═══════════════════════════════════════════════════
export default function KealeePortals() {
  const [activePortal, setActivePortal] = useState("homeowner");

  return (
    <div style={{ background: C.white, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow-x: hidden; }
        ::selection { background: rgba(232,121,58,0.2); color: #1A2B4A; }
        input::placeholder { color: rgba(255,255,255,0.35); }
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(5"] { grid-template-columns: repeat(3, 1fr) !important; }
          div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 240px"] { grid-template-columns: 160px 1fr 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(5"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(4"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 240px"] { overflow-x: auto !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 48px", borderBottom: `1px solid ${C.gray200}`,
        background: C.white, position: "sticky", top: 0, zIndex: 100,
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Bubble logo */}
          <div style={{ position: "relative", width: 34, height: 34 }}>
            <div style={{ position: "absolute", width: 22, height: 22, borderRadius: "50%", background: C.orange, border: `2px solid ${C.navy}`, top: 0, left: 0 }} />
            <div style={{ position: "absolute", width: 16, height: 16, borderRadius: "50%", background: C.teal, border: `2px solid ${C.navy}`, top: 4, left: 14 }} />
            <div style={{ position: "absolute", width: 10, height: 10, borderRadius: "50%", background: C.green, border: `1.5px solid ${C.navy}`, top: 16, left: 8 }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: "'Nunito', 'Quicksand', sans-serif", letterSpacing: "-0.01em" }}>Kealee</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ background: "none", border: "none", color: C.navy, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}>Login</button>
          <Btn>Sign Up Free →</Btn>
        </div>
      </header>

      {/* Portal Tabs (Prompt 38) */}
      <PortalTabs active={activePortal} onChange={setActivePortal} />

      {/* Active Portal Content (Prompts 35–37) */}
      <div style={{ transition: "opacity 0.3s ease" }}>
        {activePortal === "homeowner" && <HomeownerPortal />}
        {activePortal === "contractor" && <ContractorPortal />}
        {activePortal === "professional" && <ProfessionalPortal />}
      </div>

      <SectionDivider label="Prompt 39 — Features Comparison Table" />
      <ComparisonTable />

      <SectionDivider label="Prompt 40 — Integrated Services Showcase" />
      <ServicesShowcase />

      {/* Footer */}
      <footer style={{ padding: "48px 48px 32px", background: C.navyDark, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ position: "relative", width: 28, height: 28 }}>
                <div style={{ position: "absolute", width: 18, height: 18, borderRadius: "50%", background: C.orange, border: `1.5px solid rgba(255,255,255,0.3)`, top: 0, left: 0 }} />
                <div style={{ position: "absolute", width: 13, height: 13, borderRadius: "50%", background: C.teal, border: `1.5px solid rgba(255,255,255,0.3)`, top: 3, left: 11 }} />
                <div style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: C.green, border: `1px solid rgba(255,255,255,0.3)`, top: 13, left: 6 }} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: "white", fontFamily: "'Nunito', sans-serif" }}>Kealee</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 280 }}>The complete construction platform. From architecture to permits to project completion.</p>
          </div>
          {[
            { title: "Platform", links: ["Homeowner Portal", "Contractor Portal", "Professional Portal", "Marketplace", "Pricing"] },
            { title: "Services", links: ["Estimation", "Permits", "PM Services", "Architecture", "Operations"] },
            { title: "Company", links: ["About", "Contact", "Careers", "Blog", "Support"] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>{col.title}</div>
              {col.links.map((link, li) => (
                <div key={li} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10, cursor: "pointer" }}>{link}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 Kealee Construction Platform. Licensed & Insured • DC-Baltimore Corridor.</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Escrow Protected • 20+ Years Experience</span>
        </div>
      </footer>
    </div>
  );
}
