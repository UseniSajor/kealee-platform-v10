import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// KEALEE PLATFORM — COMPLETE DESIGN SYSTEM (Sections 5-21)
// Interactive multi-page prototype
// ═══════════════════════════════════════════════════════════════

const C = {
  navy: "#1A2B4A", navyLight: "#243556", navyDark: "#0F1A2E", navy800: "#162240",
  orange: "#E8793A", orangeHover: "#D4682F", orangeGlow: "rgba(232,121,58,0.15)",
  teal: "#2ABFBF", tealSoft: "rgba(42,191,191,0.08)", tealBorder: "rgba(42,191,191,0.15)",
  tealDark: "#1FA3A3",
  green: "#38A169", greenSoft: "rgba(56,161,105,0.1)",
  red: "#E53E3E", redSoft: "rgba(229,62,62,0.1)",
  white: "#FFFFFF", gray50: "#F9FAFB", gray100: "#F3F4F6", gray200: "#E5E7EB",
  gray300: "#D1D5DB", gray400: "#9CA3AF", gray500: "#6B7280", gray600: "#4B5563",
  gray700: "#374151", gray800: "#1F2937", gray900: "#111827",
};

const font = "'Plus Jakarta Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', monospace";
const display = "'Clash Display', system-ui, sans-serif";

// ── Utilities ──
function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(20px)", transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>{children}</div>;
}

const DotBg = () => (
  <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
    <svg width="100%" height="100%"><defs><pattern id="d" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill={C.gray300} /></pattern></defs><rect width="100%" height="100%" fill="url(#d)" /></svg>
  </div>
);

const Badge = ({ text, color = C.teal, bg, small }) => (
  <span style={{
    display: "inline-flex", padding: small ? "2px 8px" : "4px 12px", borderRadius: 20,
    background: bg || `${color}15`, border: `1px solid ${color}25`,
    fontSize: small ? 10 : 11, fontWeight: 700, color, letterSpacing: "0.03em",
    fontFamily: font,
  }}>{text}</span>
);

// ═══════════════════════════════════════════════════════════════
// PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════════
const pages = [
  { id: "ai", label: "AI Features", num: "5" },
  { id: "csi", label: "CSI Selector", num: "6" },
  { id: "summary", label: "Estimate Card", num: "7" },
  { id: "dashboard", label: "Dashboard", num: "8" },
  { id: "mobile", label: "Mobile Flow", num: "9" },
  { id: "assembly", label: "Assembly Lib", num: "10" },
  { id: "results", label: "Results Page", num: "18" },
  { id: "homepage", label: "Homepage", num: "19" },
  { id: "mobilenav", label: "Mobile Nav", num: "21" },
];

// ═══════════════════════════════════════════════════════════════
// SECTION 5: AI FEATURES
// ═══════════════════════════════════════════════════════════════
const AIFeatures = () => {
  const features = [
    { icon: "🔍", title: "Scope Analyzer", desc: "Identifies gaps, conflicts, and risks in your project scope before estimation begins.", badge: "NLP" },
    { icon: "📈", title: "Cost Predictor", desc: "ML-based cost forecasting with confidence intervals trained on thousands of real projects.", badge: "ML" },
    { icon: "💡", title: "Value Engineer", desc: "Automated cost optimization finds savings without compromising quality or code compliance.", badge: "AI" },
    { icon: "📐", title: "Plan Analyzer", desc: "Automatic quantity extraction from uploaded PDFs, DWG files, and blueprint images.", badge: "CV" },
  ];
  return (
    <section style={{ padding: "80px 48px", background: C.white, position: "relative", fontFamily: font }}>
      <DotBg />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <FadeIn><Badge text="⚡ Powered by AI" color={C.teal} /></FadeIn>
          <FadeIn delay={0.05}><h2 style={{ fontSize: 44, fontWeight: 800, color: C.navy, margin: "16px 0 12px", letterSpacing: "-0.03em", fontFamily: display }}>AI-Powered Accuracy</h2></FadeIn>
          <FadeIn delay={0.1}><p style={{ fontSize: 17, color: C.gray500, maxWidth: 520, margin: "0 auto" }}>Machine learning models trained on thousands of real projects deliver estimates you can trust.</p></FadeIn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {features.map((f, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.07}>
              <div style={{
                background: C.white, borderRadius: 16, padding: 28, border: `1px solid ${C.gray200}`,
                transition: "all 0.3s ease", cursor: "pointer", position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(42,191,191,0.12)"; e.currentTarget.style.borderColor = C.teal; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.gray200; }}
              >
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <Badge text={f.badge} color={C.teal} small />
                </div>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: C.tealSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 20, border: `1px solid ${C.tealBorder}`,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 6: CSI DIVISION SELECTOR
// ═══════════════════════════════════════════════════════════════
const CSISelector = () => {
  const [selected, setSelected] = useState("03");
  const divs = [
    { code: "All", name: "All Divisions", icon: "📋" },
    { code: "03", name: "Concrete", icon: "🧱" },
    { code: "04", name: "Masonry", icon: "🏗️" },
    { code: "05", name: "Metals", icon: "⚙️" },
    { code: "06", name: "Wood & Composites", icon: "🪵" },
    { code: "07", name: "Thermal Protection", icon: "🛡️" },
    { code: "08", name: "Openings", icon: "🚪" },
    { code: "09", name: "Finishes", icon: "🎨" },
    { code: "22", name: "Plumbing", icon: "🔧" },
    { code: "23", name: "HVAC", icon: "❄️" },
    { code: "26", name: "Electrical", icon: "⚡" },
  ];
  return (
    <section style={{ padding: "60px 48px", background: C.gray50, fontFamily: font }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeIn><h2 style={{ fontSize: 28, fontWeight: 800, color: C.navy, marginBottom: 8, fontFamily: display }}>CSI MasterFormat Divisions</h2></FadeIn>
        <FadeIn delay={0.05}><p style={{ fontSize: 14, color: C.gray500, marginBottom: 24 }}>Select a division to filter assemblies</p></FadeIn>
        {/* Horizontal tabs */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          {divs.map((d, i) => {
            const active = selected === d.code;
            return (
              <FadeIn key={i} delay={i * 0.03}>
                <button onClick={() => setSelected(d.code)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
                  borderRadius: 12, border: active ? `2px solid ${C.teal}` : `1px solid ${C.gray200}`,
                  background: active ? C.teal : C.white, color: active ? C.white : C.navy,
                  cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 600,
                  whiteSpace: "nowrap", transition: "all 0.2s",
                  boxShadow: active ? "0 4px 12px rgba(42,191,191,0.25)" : "none",
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.tealSoft; e.currentTarget.style.borderColor = C.tealBorder; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.gray200; } }}
                >
                  <span style={{ fontSize: 16 }}>{d.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: mono, lineHeight: 1 }}>{d.code}</div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{d.name}</div>
                  </div>
                </button>
              </FadeIn>
            );
          })}
        </div>
        {/* Selected info */}
        <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: C.white, border: `1px solid ${C.gray200}` }}>
          <span style={{ fontSize: 13, color: C.gray500 }}>Currently viewing: </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.teal }}>{divs.find(d => d.code === selected)?.name || "All"}</span>
          <span style={{ fontSize: 12, color: C.gray400, marginLeft: 12 }}>• 24 assemblies available</span>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 7: ESTIMATE SUMMARY CARD
// ═══════════════════════════════════════════════════════════════
const EstimateSummary = () => {
  const rows = [
    { label: "Direct Cost", value: "$42,500" },
    { label: "Overhead (10%)", value: "$4,250" },
    { label: "Profit (10%)", value: "$4,675" },
    { label: "Contingency (5%)", value: "$2,571" },
  ];
  const divisions = ["03", "06", "09", "22", "26", "31"];
  return (
    <section style={{ padding: "60px 48px", background: C.white, fontFamily: font }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <FadeIn>
          <div style={{
            background: C.white, borderRadius: 16, overflow: "hidden",
            boxShadow: "0 8px 32px rgba(26,43,74,0.1), 0 1px 3px rgba(26,43,74,0.06)",
            border: `1px solid ${C.gray200}`,
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.gray100}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Smith Kitchen Renovation</div>
                <div style={{ fontSize: 12, color: C.gray400, marginTop: 4 }}>Feb 4, 2026 • v2.1</div>
              </div>
              <Badge text="Approved ✓" color={C.green} />
            </div>
            {/* Total */}
            <div style={{ padding: "24px 24px 16px", textAlign: "center", background: C.gray50, borderBottom: `1px solid ${C.gray100}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.gray400, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Total Estimate</div>
              <div style={{ fontSize: 42, fontWeight: 700, color: C.navy, fontFamily: mono }}>$53,996</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
                <span style={{ fontSize: 12, color: C.gray500 }}>300 SF</span>
                <span style={{ fontSize: 12, color: C.gray300 }}>•</span>
                <span style={{ fontSize: 12, color: C.orange, fontWeight: 600, fontFamily: mono }}>$180/SF</span>
                <span style={{ fontSize: 12, color: C.gray300 }}>•</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Badge text="92% confidence" color={C.teal} small />
                </span>
              </div>
            </div>
            {/* Breakdown */}
            <div style={{ padding: "16px 24px" }}>
              {rows.map((r, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 0",
                  borderBottom: i < rows.length - 1 ? `1px solid ${C.gray100}` : "none",
                }}>
                  <span style={{ fontSize: 13, color: C.gray600 }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.navy, fontFamily: mono }}>{r.value}</span>
                </div>
              ))}
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "14px 0 0",
                borderTop: `2px solid ${C.navy}`, marginTop: 8,
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>TOTAL</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: mono }}>$53,996</span>
              </div>
            </div>
            {/* Divisions */}
            <div style={{ padding: "0 24px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.gray400, marginBottom: 8 }}>CSI Divisions</div>
              <div style={{ display: "flex", gap: 6 }}>
                {divisions.map(d => (
                  <span key={d} style={{
                    padding: "4px 10px", borderRadius: 6, background: C.gray50,
                    border: `1px solid ${C.gray200}`, fontSize: 11, fontWeight: 700,
                    color: C.navy, fontFamily: mono,
                  }}>{d}</span>
                ))}
              </div>
            </div>
            {/* Actions */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.gray100}`, display: "flex", gap: 8 }}>
              <button style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.gray200}`,
                background: C.white, color: C.navy, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: font,
              }}>📄 PDF</button>
              <button style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.gray200}`,
                background: C.white, color: C.navy, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: font,
              }}>📊 Excel</button>
              <button style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                background: C.orange, color: C.white, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: font,
              }}>Share</button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 8: HOMEOWNER DASHBOARD (Light + Dark)
// ═══════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [expanded, setExpanded] = useState({ Estimation: true });

  const bg = dark ? C.navyDark : C.gray50;
  const cardBg = dark ? C.navy800 : C.white;
  const sidebarBg = dark ? C.navy : C.white;
  const text = dark ? C.white : C.navy;
  const textSec = dark ? "rgba(255,255,255,0.5)" : C.gray500;
  const border = dark ? "rgba(255,255,255,0.06)" : C.gray200;

  const navItems = [
    { icon: "📊", label: "Dashboard" },
    { icon: "📁", label: "My Projects", children: ["Active Projects", "Completed", "Start New Project"] },
    { icon: "📋", label: "Pre-Construction", children: ["Project Pipeline", "Design Packages", "Cost Estimates"] },
    { icon: "🧮", label: "Estimation", badge: "NEW", children: ["Request Estimate", "My Estimates", "Compare Estimates"] },
    { icon: "📄", label: "Permits", children: ["Active Permits", "New Application", "Inspections"] },
    { icon: "👷", label: "Find Contractors", children: ["Search", "Active Bids", "Saved"] },
    { icon: "💳", label: "Payments", children: ["Escrow Account", "History", "Schedule"] },
    { icon: "📎", label: "Documents" },
    { icon: "📈", label: "Reports" },
  ];

  const stats = [
    { label: "Active Projects", value: "3", change: "+1 this month", color: C.teal },
    { label: "Pending Estimates", value: "2", change: "1 ready", color: C.orange },
    { label: "Permits In Progress", value: "4", change: "85% pass rate", color: C.green },
    { label: "Total Spent", value: "$124K", change: "On budget", color: C.navy },
  ];

  return (
    <section style={{ fontFamily: font, background: bg, transition: "all 0.3s" }}>
      {/* Controls */}
      <div style={{ padding: "16px 24px", display: "flex", gap: 8, justifyContent: "center", background: dark ? C.navyDark : C.white, borderBottom: `1px solid ${border}` }}>
        <button onClick={() => setDark(!dark)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? C.navy : C.white, color: text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>{dark ? "☀️ Light" : "🌙 Dark"}</button>
        <button onClick={() => setCollapsed(!collapsed)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? C.navy : C.white, color: text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>{collapsed ? "→ Expand" : "← Collapse"}</button>
      </div>
      <div style={{ display: "flex", minHeight: 640 }}>
        {/* Sidebar */}
        <div style={{
          width: collapsed ? 64 : 260, background: sidebarBg, borderRight: `1px solid ${border}`,
          transition: "width 0.3s ease", overflow: "hidden", flexShrink: 0,
          display: "flex", flexDirection: "column",
        }}>
          {/* Logo */}
          <div style={{ padding: collapsed ? "20px 12px" : "20px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10, height: 64 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>K</div>
            {!collapsed && <span style={{ fontSize: 18, fontWeight: 800, color: text, fontFamily: display }}>Kealee</span>}
          </div>
          {/* Nav items */}
          <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
            {navItems.map((item, i) => {
              const active = activeNav === item.label;
              const isExpanded = expanded[item.label];
              return (
                <div key={i}>
                  <button
                    onClick={() => {
                      setActiveNav(item.label);
                      if (item.children) setExpanded(p => ({ ...p, [item.label]: !p[item.label] }));
                    }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: collapsed ? "10px 12px" : "10px 16px",
                      borderRadius: 8, border: "none", cursor: "pointer",
                      background: active ? (dark ? "rgba(42,191,191,0.1)" : "#E5F8F8") : "transparent",
                      color: active ? C.teal : text,
                      fontFamily: font, fontSize: 14, fontWeight: active ? 600 : 500,
                      borderLeft: active ? `3px solid ${C.teal}` : "3px solid transparent",
                      transition: "all 0.15s",
                      justifyContent: collapsed ? "center" : "flex-start",
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : C.gray50; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    title={collapsed ? item.label : undefined}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && <>
                      <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                      {item.badge && <span style={{ padding: "2px 8px", borderRadius: 10, background: C.orange, color: "white", fontSize: 9, fontWeight: 700 }}>{item.badge}</span>}
                      {item.children && <span style={{ fontSize: 10, color: textSec, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>}
                    </>}
                  </button>
                  {/* Children */}
                  {!collapsed && item.children && isExpanded && (
                    <div style={{ paddingLeft: 44, paddingBottom: 4 }}>
                      {item.children.map((child, j) => (
                        <button key={j} style={{
                          display: "block", width: "100%", padding: "7px 12px",
                          borderRadius: 6, border: "none", background: "transparent",
                          color: textSec, fontSize: 13, fontWeight: 400, cursor: "pointer",
                          fontFamily: font, textAlign: "left", transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = text; e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : C.gray50; }}
                          onMouseLeave={e => { e.currentTarget.style.color = textSec; e.currentTarget.style.background = "transparent"; }}
                        >{child}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Settings + Profile */}
          {!collapsed && (
            <div style={{ borderTop: `1px solid ${border}`, padding: 12 }}>
              <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 8, border: "none", background: "transparent", color: textSec, fontSize: 14, cursor: "pointer", fontFamily: font }}>
                ⚙️ <span>Settings</span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginTop: 4, borderRadius: 10, background: dark ? "rgba(255,255,255,0.03)" : C.gray50 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.teal}, ${C.orange})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14 }}>JS</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text }}>John Smith</div>
                  <div style={{ fontSize: 11, color: textSec }}>john@email.com</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Top Bar */}
          <div style={{
            height: 64, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: dark ? C.navy800 : C.white, borderBottom: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: 13, color: textSec }}>
              <span style={{ color: C.teal, cursor: "pointer" }}>Home</span>
              <span style={{ margin: "0 8px" }}>/</span>
              <span>Dashboard</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                padding: "8px 16px", borderRadius: 8, background: dark ? "rgba(255,255,255,0.05)" : C.gray100,
                fontSize: 13, color: textSec, display: "flex", alignItems: "center", gap: 8, width: 220,
              }}>🔍 <span>Search...</span></div>
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: 20, cursor: "pointer" }}>🔔</span>
                <div style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: "50%", background: C.orange }} />
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div style={{ padding: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: text, margin: "0 0 4px", fontFamily: display }}>Good morning, John 👋</h1>
            <p style={{ fontSize: 14, color: textSec, margin: "0 0 28px" }}>Here's what's happening with your projects</p>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              {stats.map((s, i) => (
                <div key={i} style={{
                  background: cardBg, borderRadius: 14, padding: 22, border: `1px solid ${border}`,
                  transition: "all 0.2s", cursor: "pointer",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
                >
                  <div style={{ fontSize: 12, color: textSec, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: text, fontFamily: mono, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.color, marginTop: 6, fontWeight: 600 }}>{s.change}</div>
                </div>
              ))}
            </div>

            {/* Quick Action + Recent */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Estimate CTA */}
              <div style={{
                background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
                borderRadius: 14, padding: 28, color: "white", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(42,191,191,0.1)" }} />
                <Badge text="NEW" color={C.orange} bg={C.orangeGlow} />
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 8px" }}>Get a New Estimate</h3>
                <p style={{ fontSize: 14, opacity: 0.7, margin: "0 0 20px" }}>AI-powered estimates in 24 hours. Start now.</p>
                <button style={{
                  padding: "12px 24px", borderRadius: 10, border: "none",
                  background: C.orange, color: "white", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: font,
                }}>Request Estimate →</button>
              </div>
              {/* Activity */}
              <div style={{ background: cardBg, borderRadius: 14, padding: 24, border: `1px solid ${border}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: text, margin: "0 0 16px" }}>Recent Activity</h3>
                {[
                  { icon: "✅", text: "Permit #2847 approved", time: "2h ago", color: C.green },
                  { icon: "📧", text: "Estimate ready for Kitchen Reno", time: "5h ago", color: C.teal },
                  { icon: "💳", text: "Escrow payment released", time: "1d ago", color: C.orange },
                  { icon: "📄", text: "Contract signed by GC", time: "2d ago", color: C.navy },
                ].map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                    borderBottom: i < 3 ? `1px solid ${border}` : "none",
                  }}>
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: text, fontWeight: 500 }}>{a.text}</div>
                      <div style={{ fontSize: 11, color: textSec }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 9: MOBILE ESTIMATION FLOW
// ═══════════════════════════════════════════════════════════════
const MobileFlow = () => {
  const [step, setStep] = useState(0);
  const steps = ["Project Info", "Scope", "Upload", "Service", "Review"];

  const PhoneFrame = ({ children, title }) => (
    <div style={{
      width: 375, margin: "0 auto", background: C.white, borderRadius: 40,
      boxShadow: "0 25px 60px rgba(26,43,74,0.15)", border: `8px solid ${C.gray900}`,
      overflow: "hidden", position: "relative",
    }}>
      {/* Status bar */}
      <div style={{ padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 600, color: C.navy }}>
        <span>9:41</span>
        <div style={{ width: 80, height: 28, borderRadius: 20, background: C.gray900, margin: "0 auto" }} />
        <span>100%</span>
      </div>
      {/* Header */}
      <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.gray100}` }}>
        {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: C.navy, padding: 0 }}>←</button>}
        <span style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font }}>{title}</span>
      </div>
      {/* Progress */}
      <div style={{ padding: "16px 20px 8px", display: "flex", gap: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= step ? C.teal : C.gray200, transition: "all 0.3s" }} />
            <div style={{ fontSize: 9, color: i <= step ? C.teal : C.gray400, marginTop: 4, fontWeight: i === step ? 700 : 400, textAlign: "center" }}>{s}</div>
          </div>
        ))}
      </div>
      {/* Content */}
      <div style={{ padding: "16px 20px", minHeight: 380, fontFamily: font }}>
        {children}
      </div>
      {/* Bottom Action */}
      <div style={{ padding: "12px 20px 32px", borderTop: `1px solid ${C.gray100}` }}>
        <button onClick={() => setStep(s => Math.min(4, s + 1))} style={{
          width: "100%", padding: "16px 0", borderRadius: 12, border: "none",
          background: C.orange, color: "white", fontSize: 16, fontWeight: 700,
          cursor: "pointer", fontFamily: font,
        }}>
          {step === 4 ? "Submit Request 🚀" : "Continue →"}
        </button>
      </div>
    </div>
  );

  const Input = ({ label, placeholder, type }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray600, marginBottom: 6 }}>{label}</label>
      {type === "select" ? (
        <select style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid ${C.gray200}`, fontSize: 15, color: C.navy, fontFamily: font, background: C.white, appearance: "none" }}>
          <option>{placeholder}</option>
        </select>
      ) : (
        <input placeholder={placeholder} style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid ${C.gray200}`, fontSize: 15, color: C.navy, fontFamily: font, outline: "none", boxSizing: "border-box" }} />
      )}
    </div>
  );

  const Checkbox = ({ label, checked }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 10, border: `1px solid ${checked ? C.teal : C.gray200}`,
      background: checked ? C.tealSoft : C.white, cursor: "pointer", marginBottom: 8,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? C.teal : C.gray300}`,
        background: checked ? C.teal : "transparent", display: "flex", alignItems: "center",
        justifyContent: "center", color: "white", fontSize: 12,
      }}>{checked && "✓"}</div>
      <span style={{ fontSize: 14, color: C.navy, fontWeight: 500 }}>{label}</span>
    </div>
  );

  const content = [
    // Step 0: Project Info
    <>
      <Input label="Project Name" placeholder="e.g., Kitchen Renovation" />
      <Input label="Project Type" placeholder="Select type..." type="select" />
      <Input label="Square Footage" placeholder="300" />
      <Input label="Location" placeholder="Baltimore, MD 21201" />
      <Input label="Budget Range" placeholder="Select range..." type="select" />
    </>,
    // Step 1: Scope
    <>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>Select work types:</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {["Demolition", "Framing", "Electrical", "Plumbing", "HVAC", "Drywall", "Painting", "Flooring"].map((w, i) => (
          <Checkbox key={i} label={w} checked={[0, 2, 3, 7].includes(i)} />
        ))}
      </div>
    </>,
    // Step 2: Upload
    <>
      <div style={{
        border: `2px dashed ${C.gray300}`, borderRadius: 16, padding: "40px 20px",
        textAlign: "center", marginBottom: 16, background: C.gray50,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>Tap to upload files</div>
        <div style={{ fontSize: 12, color: C.gray400, marginTop: 4 }}>PDF, DWG, JPG up to 50MB</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 10, background: C.gray50, border: `1px solid ${C.gray200}` }}>
        <span>📄</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>kitchen-plans-v2.pdf</div>
          <div style={{ fontSize: 11, color: C.gray400 }}>2.4 MB</div>
        </div>
        <span style={{ fontSize: 16, color: C.green }}>✓</span>
      </div>
      <Checkbox label="I don't have plans yet" checked={false} />
    </>,
    // Step 3: Select Service
    <>
      {[
        { name: "Basic", price: "$299", time: "24 hrs", pop: false },
        { name: "Standard", price: "$799", time: "48 hrs", pop: true },
        { name: "Premium", price: "$1,999", time: "3-5 days", pop: false },
        { name: "Enterprise", price: "$4,999", time: "Custom", pop: false },
      ].map((t, i) => (
        <div key={i} style={{
          padding: 16, borderRadius: 12, marginBottom: 10,
          border: t.pop ? `2px solid ${C.orange}` : `1px solid ${C.gray200}`,
          background: t.pop ? "rgba(232,121,58,0.04)" : C.white,
          cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{t.name}</span>
              {t.pop && <Badge text="Recommended" color={C.orange} small />}
            </div>
            <div style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>{t.time} delivery</div>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.orange, fontFamily: mono }}>{t.price}</span>
        </div>
      ))}
    </>,
    // Step 4: Review
    <>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Order Summary</div>
      {[
        { l: "Project", v: "Kitchen Renovation" },
        { l: "Type", v: "Residential Remodel" },
        { l: "Size", v: "300 SF" },
        { l: "Service", v: "Standard" },
        { l: "Delivery", v: "48 hours" },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.gray100}` }}>
          <span style={{ fontSize: 13, color: C.gray500 }}>{r.l}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{r.v}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: `2px solid ${C.navy}`, marginTop: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Total</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: C.orange, fontFamily: mono }}>$799</span>
      </div>
      <div style={{ padding: "12px 14px", borderRadius: 10, background: C.greenSoft, border: `1px solid ${C.green}30`, marginTop: 8, fontSize: 12, color: C.green, fontWeight: 500 }}>
        ✓ 48-hour delivery guarantee
      </div>
    </>,
  ];

  return (
    <section style={{ padding: "60px 48px", background: C.gray100, fontFamily: font }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: C.navy, fontFamily: display }}>Mobile Estimation Flow</h2>
        <p style={{ fontSize: 14, color: C.gray500 }}>5-step wizard • Tap phone to navigate</p>
      </div>
      <PhoneFrame title={steps[step]}>
        {content[step]}
      </PhoneFrame>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 10: ASSEMBLY LIBRARY BROWSER
// ═══════════════════════════════════════════════════════════════
const AssemblyBrowser = () => {
  const [selected, setSelected] = useState("Concrete");
  const cats = ["All", "Concrete", "Framing", "Roofing", "Finishes", "MEP"];
  const assemblies = [
    { code: "03-1000", name: "Concrete Slab on Grade - 4\"", unit: "SF", prod: "800 SF/day", crew: 4, cost: "$8.25/SF" },
    { code: "06-1100", name: "Wood Stud Wall - 2x4 @ 16\" OC", unit: "SF", prod: "200 SF/day", crew: 3, cost: "$6.80/SF" },
    { code: "07-3100", name: "Asphalt Shingles - Architectural", unit: "SQ", prod: "12 SQ/day", crew: 3, cost: "$285/SQ" },
    { code: "09-2900", name: "Drywall - 1/2\" Standard", unit: "SF", prod: "500 SF/day", crew: 2, cost: "$3.45/SF" },
    { code: "26-2700", name: "Duplex Receptacle", unit: "EA", prod: "12 EA/day", crew: 1, cost: "$165/EA" },
    { code: "03-3000", name: "Concrete Foundation Wall - 8\"", unit: "SF", prod: "120 SF/day", crew: 5, cost: "$18.50/SF" },
  ];

  return (
    <section style={{ padding: "60px 48px", background: C.white, fontFamily: font }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeIn><h2 style={{ fontSize: 28, fontWeight: 800, color: C.navy, marginBottom: 4, fontFamily: display }}>Assembly Library</h2></FadeIn>
        <FadeIn delay={0.05}><p style={{ fontSize: 14, color: C.gray500, marginBottom: 24 }}>Browse and add assemblies to your estimate</p></FadeIn>

        <div style={{ display: "flex", gap: 20 }}>
          {/* Left: Categories */}
          <div style={{ width: 200, flexShrink: 0 }}>
            {cats.map((c, i) => (
              <button key={i} onClick={() => setSelected(c)} style={{
                display: "block", width: "100%", padding: "10px 16px", borderRadius: 8,
                border: "none", background: selected === c ? C.tealSoft : "transparent",
                color: selected === c ? C.teal : C.gray600, fontSize: 14,
                fontWeight: selected === c ? 700 : 500, cursor: "pointer", fontFamily: font,
                textAlign: "left", marginBottom: 2, borderLeft: selected === c ? `3px solid ${C.teal}` : "3px solid transparent",
              }}>{c}</button>
            ))}
          </div>
          {/* Right: Grid */}
          <div style={{ flex: 1 }}>
            {/* Search */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <input placeholder="Search assemblies..." style={{
                flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.gray200}`,
                fontSize: 14, fontFamily: font, outline: "none",
              }} />
              <select style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.gray200}`, fontSize: 13, fontFamily: font, color: C.gray600, background: C.white }}>
                <option>Sort by: Name</option>
                <option>Sort by: Cost</option>
                <option>Sort by: Code</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {assemblies.map((a, i) => (
                <FadeIn key={i} delay={i * 0.04}>
                  <div style={{
                    background: C.white, borderRadius: 12, padding: 20, border: `1px solid ${C.gray200}`,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,43,74,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.teal, fontFamily: mono }}>{a.code}</span>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.gray50, border: `1px solid ${C.gray200}`, color: C.gray500, fontFamily: mono }}>{a.unit}</span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: "0 0 10px", lineHeight: 1.3 }}>{a.name}</h4>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.gray500, marginBottom: 14 }}>
                      <span>⏱ {a.prod}</span>
                      <span>👷 Crew: {a.crew}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: C.orange, fontFamily: mono }}>{a.cost}</span>
                      <button style={{
                        padding: "8px 16px", borderRadius: 8, border: "none",
                        background: C.orange, color: "white", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: font,
                      }}>+ Add</button>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 18: ESTIMATE RESULTS PAGE
// ═══════════════════════════════════════════════════════════════
const EstimateResults = () => {
  const [tab, setTab] = useState("Summary");
  const tabs = ["Summary", "Line Items", "Assemblies", "Assumptions", "Value Eng."];
  const divisions = [
    { code: "03", name: "Concrete", mat: "$2,500", lab: "$1,200", equip: "$300", total: "$4,000" },
    { code: "06", name: "Carpentry", mat: "$8,000", lab: "$4,500", equip: "$200", total: "$12,700" },
    { code: "09", name: "Finishes", mat: "$6,000", lab: "$3,000", equip: "—", total: "$9,000" },
    { code: "22", name: "Plumbing", mat: "$3,500", lab: "$2,500", equip: "—", total: "$6,000" },
    { code: "26", name: "Electrical", mat: "$2,800", lab: "$2,200", equip: "—", total: "$5,000" },
  ];

  return (
    <section style={{ padding: "40px 48px", background: C.gray50, fontFamily: font }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: C.navy, margin: 0, fontFamily: display }}>Smith Kitchen Renovation</h1>
              <Badge text="Completed ✓" color={C.green} />
            </div>
            <p style={{ fontSize: 13, color: C.gray500, margin: 0 }}>Estimate #EST-2847 • Feb 4, 2026 • Version 2.1</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["📄 PDF", "📊 Excel", "✏️ Revision"].map((b, i) => (
              <button key={i} style={{
                padding: "10px 18px", borderRadius: 10,
                border: i < 2 ? `1px solid ${C.gray200}` : "none",
                background: i < 2 ? C.white : C.orange,
                color: i < 2 ? C.navy : "white",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font,
              }}>{b}</button>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div style={{
          background: C.white, borderRadius: 16, padding: 32, marginBottom: 24,
          border: `1px solid ${C.gray200}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32,
        }}>
          <div>
            <div style={{ fontSize: 12, color: C.gray400, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Total Estimate</div>
            <div style={{ fontSize: 48, fontWeight: 700, color: C.navy, fontFamily: mono, lineHeight: 1 }}>$53,996</div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <span style={{ fontSize: 13, color: C.gray500 }}>Direct: <strong style={{ color: C.navy }}>$42,500</strong></span>
              <span style={{ fontSize: 13, color: C.gray500 }}>Markup: <strong style={{ color: C.navy }}>$11,496</strong></span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            {[{ l: "Cost/SF", v: "$180/SF" }, { l: "Area", v: "300 SF" }, { l: "Divisions", v: "6 CSI" }].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: C.gray500 }}>{s.l}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.navy, fontFamily: mono }}>{s.v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ fontSize: 12, color: C.gray400, marginBottom: 8 }}>AI Confidence</div>
            <div style={{ width: 180, height: 12, borderRadius: 6, background: C.gray200, overflow: "hidden" }}>
              <div style={{ width: "92%", height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${C.teal}, ${C.tealDark})` }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.teal, fontFamily: mono, marginTop: 8 }}>92%</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: tab === t ? C.navy : "transparent",
              color: tab === t ? C.white : C.gray500,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font, transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.gray200}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
                {["Division", "Description", "Material", "Labor", "Equipment", "Total"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: font }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {divisions.map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.gray100}`, transition: "background 0.15s", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 700, color: C.teal, fontFamily: mono }}>{d.code}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 500, color: C.navy }}>{d.name}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: C.gray600, fontFamily: mono }}>{d.mat}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: C.gray600, fontFamily: mono }}>{d.lab}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, color: C.gray600, fontFamily: mono }}>{d.equip}</td>
                  <td style={{ padding: "14px 20px", fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: mono }}>{d.total}</td>
                </tr>
              ))}
              <tr style={{ background: C.navy }}>
                <td colSpan={5} style={{ padding: "14px 20px", fontSize: 14, fontWeight: 700, color: "white" }}>DIRECT COST TOTAL</td>
                <td style={{ padding: "14px 20px", fontSize: 18, fontWeight: 800, color: C.orange, fontFamily: mono }}>$42,500</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Charts placeholder */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 24, border: `1px solid ${C.gray200}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Cost by Division</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {divisions.map((d, i) => {
                const pct = parseInt(d.total.replace(/[$,]/g, "")) / 425;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: C.gray600 }}>{d.name}</span>
                      <span style={{ color: C.gray400, fontFamily: mono }}>{d.total}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: C.gray100 }}>
                      <div style={{ height: "100%", borderRadius: 4, background: [C.teal, C.orange, C.navy, C.green, "#8B5CF6"][i], width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: 24, border: `1px solid ${C.gray200}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Material vs Labor Split</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", height: 180 }}>
              {[
                { label: "Material", value: "$22,800", pct: 54, color: C.teal },
                { label: "Labor", value: "$13,400", pct: 32, color: C.orange },
                { label: "Equipment", value: "$500", pct: 1, color: C.gray400 },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: 80, height: `${s.pct * 2.5}px`, borderRadius: 8, background: s.color, margin: "0 auto 10px", minHeight: 20 }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: mono }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SECTION 21: MOBILE BOTTOM NAV
// ═══════════════════════════════════════════════════════════════
const MobileNav = () => {
  const [activeTab, setActiveTab] = useState("Home");
  const [darkMode, setDarkMode] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const bg = darkMode ? C.navyDark : C.white;
  const barBg = darkMode ? C.navy : C.white;
  const text = darkMode ? "rgba(255,255,255,0.4)" : C.gray400;
  const activeColor = C.teal;

  const tabs = [
    { icon: "🏠", label: "Home" },
    { icon: "📁", label: "Projects" },
    { icon: "🧮", label: "Estimate", badge: true },
    { icon: "📄", label: "Permits" },
    { icon: "⋯", label: "More" },
  ];

  const moreItems = ["Find Contractors", "Payments", "Documents", "Reports", "Settings", "Help & Support", "Log Out"];

  return (
    <section style={{ padding: "60px 48px", background: C.gray100, fontFamily: font }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: C.navy, fontFamily: display }}>Mobile Navigation</h2>
        <p style={{ fontSize: 14, color: C.gray500, marginBottom: 12 }}>Bottom tab bar with "More" action sheet</p>
        <button onClick={() => setDarkMode(!darkMode)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.gray200}`, background: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>{darkMode ? "☀️ Light" : "🌙 Dark"}</button>
      </div>
      <div style={{
        width: 375, margin: "0 auto", background: bg, borderRadius: 40,
        boxShadow: "0 25px 60px rgba(26,43,74,0.15)", border: `8px solid ${C.gray900}`,
        overflow: "hidden", position: "relative", height: 700,
      }}>
        {/* Status bar */}
        <div style={{ padding: "8px 24px", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: darkMode ? "white" : C.navy }}>
          <span>9:41</span>
          <div style={{ width: 80, height: 28, borderRadius: 20, background: C.gray900 }} />
          <span>100%</span>
        </div>
        {/* Content area */}
        <div style={{ padding: 24, flex: 1 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: darkMode ? "white" : C.navy, fontFamily: display }}>Good morning 👋</h2>
          <p style={{ fontSize: 14, color: darkMode ? "rgba(255,255,255,0.5)" : C.gray500, marginTop: 4 }}>Active tab: <strong style={{ color: activeColor }}>{activeTab}</strong></p>
        </div>

        {/* More Sheet */}
        {showMore && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: barBg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: "16px 20px 100px",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.gray300, margin: "0 auto 16px" }} />
            {moreItems.map((item, i) => (
              <button key={i} onClick={() => setShowMore(false)} style={{
                display: "block", width: "100%", padding: "14px 0",
                border: "none", background: "none", fontSize: 16, fontWeight: 500,
                color: item === "Log Out" ? C.red : (darkMode ? "white" : C.navy),
                cursor: "pointer", fontFamily: font, textAlign: "left",
                borderBottom: i < moreItems.length - 1 ? `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : C.gray100}` : "none",
              }}>{item}</button>
            ))}
          </div>
        )}

        {/* Tab Bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: barBg, borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : C.gray200}`,
          padding: "8px 16px 34px", display: "flex", justifyContent: "space-around",
          zIndex: 20,
        }}>
          {tabs.map((t, i) => {
            const active = activeTab === t.label;
            return (
              <button key={i} onClick={() => {
                if (t.label === "More") setShowMore(!showMore);
                else { setActiveTab(t.label); setShowMore(false); }
              }} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                border: "none", background: active ? `${activeColor}12` : "none",
                padding: "8px 16px", borderRadius: 12, cursor: "pointer",
                transition: "all 0.15s", position: "relative",
                transform: active ? "scale(1)" : "scale(1)",
              }}>
                {t.badge && <div style={{ position: "absolute", top: 4, right: 10, width: 8, height: 8, borderRadius: "50%", background: C.orange }} />}
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? activeColor : text }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP WITH PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════════
export default function KealeeDesignSystemFull() {
  const [activePage, setActivePage] = useState("ai");

  const pageMap = {
    ai: <AIFeatures />,
    csi: <CSISelector />,
    summary: <EstimateSummary />,
    dashboard: <Dashboard />,
    mobile: <MobileFlow />,
    assembly: <AssemblyBrowser />,
    results: <EstimateResults />,
    homepage: <MarketingHomepage />,
    mobilenav: <MobileNav />,
  };

  return (
    <div style={{ fontFamily: font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow-x: hidden; }
        ::selection { background: rgba(232,121,58,0.2); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.gray300}; border-radius: 3px; }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, background: C.navy,
        padding: "0 32px", display: "flex", alignItems: "center", height: 56,
        boxShadow: "0 2px 12px rgba(26,43,74,0.15)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: C.orange,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 800, fontSize: 14, marginRight: 16,
        }}>K</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "white", marginRight: 32, fontFamily: display }}>Design System</span>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", flex: 1 }}>
          {pages.map(p => (
            <button key={p.id} onClick={() => setActivePage(p.id)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: activePage === p.id ? "rgba(255,255,255,0.12)" : "transparent",
              color: activePage === p.id ? "white" : "rgba(255,255,255,0.5)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
              whiteSpace: "nowrap", transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (activePage !== p.id) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (activePage !== p.id) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ opacity: 0.5, marginRight: 4 }}>§{p.num}</span> {p.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Page Content */}
      <div key={activePage}>
        {pageMap[activePage]}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 19: MARKETING HOMEPAGE (simplified)
// ═══════════════════════════════════════════════════════════════
function MarketingHomepage() {
  const services = [
    { icon: "📁", title: "Project Management", desc: "Full visibility and control over your construction project.", price: "From $49/mo", color: C.navy, cta: "Learn More →" },
    { icon: "📄", title: "Permits & Inspections", desc: "AI-powered permit processing. 85% first-try approval.", price: "From $495/permit", color: C.green, badge: "Most Popular", cta: "Learn More →" },
    { icon: "🧮", title: "Estimation Services", desc: "Professional estimates in 24 hours. AI + expert review.", price: "From $299", color: C.teal, badge: "New", cta: "Learn More →" },
    { icon: "💼", title: "PM Services", desc: "Let Kealee's PM team coordinate your project remotely.", price: "From $1,750/mo", color: C.orange, cta: "Learn More →" },
    { icon: "📐", title: "Architecture & Design", desc: "Permit-ready plans, 3D renderings, and design consultation.", price: "From $2,500", color: C.teal, cta: "Learn More →" },
    { icon: "👷", title: "Contractor Network", desc: "Find verified contractors. Fair bidding, no pay-to-play.", price: "Free to browse", color: C.navy, cta: "Learn More →" },
  ];

  return (
    <div style={{ fontFamily: font }}>
      {/* Hero */}
      <section style={{ position: "relative", padding: "100px 48px 80px", background: C.white, overflow: "hidden" }}>
        <DotBg />
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.teal} 0%, transparent 70%)`, opacity: 0.06 }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <FadeIn><Badge text="DC-Baltimore's End-to-End Platform" color={C.teal} /></FadeIn>
          <FadeIn delay={0.08}>
            <h1 style={{ fontSize: 60, fontWeight: 800, color: C.navy, margin: "20px 0 16px", letterSpacing: "-0.03em", fontFamily: display, lineHeight: 1.05 }}>
              Build Better,<br />Build <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Smarter</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.12}><p style={{ fontSize: 19, color: C.gray500, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>The complete construction platform. AI-powered tools + expert services for the DC-Baltimore corridor.</p></FadeIn>
          <FadeIn delay={0.16}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 48 }}>
              <button style={{ padding: "16px 36px", borderRadius: 12, border: "none", background: C.orange, color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: font, boxShadow: "0 4px 14px rgba(232,121,58,0.35)" }}>Get Started Free →</button>
              <button style={{ padding: "16px 32px", borderRadius: 12, border: `2px solid ${C.gray200}`, background: "transparent", color: C.navy, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: font }}>See How It Works</button>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
              {[{ v: "3,000+", l: "Jurisdictions" }, { v: "85%", l: "First-try approval" }, { v: "$50M+", l: "Projects managed" }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.navy, fontFamily: mono }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: C.gray400 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: "80px 48px", background: C.gray50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <FadeIn><h2 style={{ fontSize: 40, fontWeight: 800, color: C.navy, margin: "0 0 12px", fontFamily: display }}>Everything You Need to Build</h2></FadeIn>
            <FadeIn delay={0.05}><p style={{ fontSize: 17, color: C.gray500 }}>One platform. Architecture to closeout.</p></FadeIn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {services.map((s, i) => (
              <FadeIn key={i} delay={0.05 + i * 0.06}>
                <div style={{
                  background: C.white, borderRadius: 16, padding: 28,
                  border: `1px solid ${C.gray200}`, cursor: "pointer",
                  transition: "all 0.25s", position: "relative",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(26,43,74,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {s.badge && <div style={{ position: "absolute", top: 16, right: 16 }}><Badge text={s.badge} color={s.badge === "New" ? C.teal : C.orange} small /></div>}
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}10`, border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{s.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: "0 0 8px" }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.6, margin: "0 0 16px", minHeight: 44 }}>{s.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${C.gray100}` }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.orange, fontFamily: mono }}>{s.price}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>{s.cta}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "80px 48px", background: C.white }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <FadeIn><h2 style={{ fontSize: 36, fontWeight: 800, color: C.navy, margin: "0 0 48px", fontFamily: display }}>How It Works</h2></FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
            {[
              { num: "01", title: "Tell Us About Your Project", desc: "Answer a few questions about your scope, timeline, and budget." },
              { num: "02", title: "Get AI-Powered Analysis", desc: "Our AI reviews your project. Expert estimators validate the numbers." },
              { num: "03", title: "Build with Confidence", desc: "Start construction with accurate estimates, approved permits, and trusted contractors." },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: `${C.teal}25`, fontFamily: mono, marginBottom: 12 }}>{s.num}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "80px 48px", background: C.navy, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
          <svg width="100%" height="100%"><defs><pattern id="g2" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#g2)" /></svg>
        </div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <FadeIn><h2 style={{ fontSize: 40, fontWeight: 800, color: "white", margin: "0 0 12px", fontFamily: display }}>Ready to Build Smarter?</h2></FadeIn>
          <FadeIn delay={0.05}><p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", margin: "0 0 32px" }}>Get started in under 2 minutes. No credit card required.</p></FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", maxWidth: 440, margin: "0 auto" }}>
              <input placeholder="Enter your email" style={{
                flex: 1, padding: "16px 20px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)", color: "white", fontSize: 15, fontFamily: font, outline: "none",
              }} />
              <button style={{
                padding: "16px 28px", borderRadius: 12, border: "none", background: C.orange,
                color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: font,
                boxShadow: "0 4px 14px rgba(232,121,58,0.35)",
              }}>Start Free →</button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "48px 48px 32px", background: C.navyDark }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 }}>K</div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "white", fontFamily: display }}>Kealee</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 240 }}>The end-to-end design/build platform for the DC-Baltimore corridor.</p>
          </div>
          {[
            { title: "Solutions", items: ["Project Management", "Permits", "Estimation", "PM Services"] },
            { title: "Services", items: ["Architecture", "Contractor Network", "Escrow", "Ops Services"] },
            { title: "Resources", items: ["Blog", "Help Center", "API Docs", "Pricing"] },
            { title: "Company", items: ["About", "Careers", "Contact", "Legal"] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{col.title}</div>
              {col.items.map((item, j) => (
                <div key={j} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10, cursor: "pointer" }}>{item}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 Kealee Construction LLC. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Accessibility"].map((l, i) => (
              <span key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
