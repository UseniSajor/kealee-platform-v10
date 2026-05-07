import Link from 'next/link'
import { ArrowLeft, Target, Mic, Users, BarChart2, DollarSign, Zap, FileText, MessageSquare } from 'lucide-react'
import {
  BRAND_PROMISE, BRAND_DIFFERENTIATOR, BRAND_VOICE, BRAND_TONE_AVOID,
  AUDIENCE_SEGMENTS, COPY_PILLARS, PRICING_STRATEGY, JURISDICTIONS, PRICE_ANCHORS,
} from '../../../../lib/brand-strategy'

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, color, children }: {
  title: string
  icon: React.ElementType
  color: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

function Pill({ text, color = '#1A2B4A' }: { text: string; color?: string }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${color}15`, color }}>
      {text}
    </span>
  )
}

// ── Commands quick-reference ──────────────────────────────────────────────────

const STRATEGY_COMMANDS = [
  { id: 'email-subject-lines', label: 'Email Subject Lines', desc: '8 subject lines for nurture sequence', tag: 'Nurture' },
  { id: 'google-ad-copy',      label: 'Google Ad Copy',       desc: '5 Search ad variations per jurisdiction', tag: 'PPC' },
  { id: 'meta-ad-copy',        label: 'Meta Ad Copy',         desc: '3 Facebook/Instagram body copy variations', tag: 'Social' },
  { id: 'ghl-day1-email',      label: 'GHL Day 1 Email',      desc: 'Welcome email — portal setup + scope call CTA', tag: 'GHL' },
  { id: 'ghl-day8-objection',  label: 'GHL Day 8 Email',      desc: 'Objection-handling — 3 blocks, 250–300 words', tag: 'GHL' },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BrandStrategyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/marketing" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Brand Strategy</h1>
          <p className="text-sm text-slate-500 mt-1">
            Source of truth for all Kealee marketing copy and campaign decisions.
            All AI marketing bots are pre-loaded with this context.
          </p>
        </div>
        <Link
          href="/marketing"
          className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: '#1A2B4A' }}
        >
          Run Commands →
        </Link>
      </div>

      {/* Brand positioning */}
      <Section title="Brand Positioning" icon={Target} color="#E8793A">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Core Promise</p>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">{BRAND_PROMISE}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Differentiator</p>
            <p className="text-sm text-slate-800 leading-relaxed">{BRAND_DIFFERENTIATOR}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Voice</p>
              <p className="text-sm text-green-800 leading-relaxed whitespace-pre-line">{BRAND_VOICE}</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Avoid</p>
              <p className="text-sm text-red-800 leading-relaxed whitespace-pre-line">{BRAND_TONE_AVOID}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Audience segments */}
      <Section title="Audience Segments" icon={Users} color="#2ABFBF">
        <div className="grid sm:grid-cols-2 gap-4">
          {(Object.keys(AUDIENCE_SEGMENTS) as Array<keyof typeof AUDIENCE_SEGMENTS>).map((key) => {
            const seg = AUDIENCE_SEGMENTS[key]
            return (
              <div key={key} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-900">{seg.label}</p>
                  <Pill text={key} color="#2ABFBF" />
                </div>
                <p className="text-xs text-slate-500 mb-2">{seg.demographics}</p>
                <p className="text-xs font-semibold text-slate-700 mb-2">Path: {seg.primaryPath}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pain points</p>
                <ul className="space-y-0.5">
                  {seg.painPoints.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-slate-300 mt-0.5">–</span> {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Headline angle</p>
                  <p className="text-xs text-slate-800 italic">&ldquo;{seg.headlineAngle}&rdquo;</p>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Copy pillars */}
      <Section title="Copy Pillars" icon={Mic} color="#6B46C1">
        <div className="space-y-3">
          {(Object.entries(COPY_PILLARS) as [string, string][]).map(([key, value]) => (
            <div key={key} className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
              <Pill text={key.charAt(0).toUpperCase() + key.slice(1)} color="#6B46C1" />
              <p className="text-sm text-slate-700 leading-relaxed flex-1">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing strategy */}
      <Section title="Pricing & Positioning" icon={DollarSign} color="#38A169">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {(Object.entries(PRICE_ANCHORS) as [string, string][]).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <span className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-sm font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {(Object.entries(PRICING_STRATEGY) as [string, string][]).map(([key, value]) => (
            <div key={key} className="flex gap-3 text-sm">
              <span className="shrink-0 text-green-600 font-bold">→</span>
              <p className="text-slate-700 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Campaign funnel */}
      <Section title="Campaign Architecture" icon={BarChart2} color="#E8793A">
        <div className="space-y-3">
          {[
            { step: '1', label: 'Awareness', channel: 'Meta / Google Search', detail: 'Target by DMV zip codes + intent keywords. Budget: $20–40/day per segment.', tag: 'Top of funnel' },
            { step: '2', label: 'Lead Capture', channel: 'GHL landing page + form', detail: 'Offer: "Free 5-min scope call" or "See your AI concept example." Collect: sqft, type, location, timeline.', tag: 'Mid funnel' },
            { step: '3', label: 'Nurture', channel: 'Email sequence (GHL)', detail: '5-email sequence over 12 days. Day 1: welcome. Day 3: case study. Day 5: pricing. Day 8: objections. Day 12: call CTA.', tag: 'Nurture' },
            { step: '4', label: 'Close', channel: 'Intake form + payment', detail: 'After call, send intake via GHL automation. Portal access email triggers post-payment.', tag: 'Conversion' },
          ].map(({ step, label, channel, detail, tag }) => (
            <div key={step} className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-slate-900">{label}</p>
                  <Pill text={tag} color="#E8793A" />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-1">{channel}</p>
                <p className="text-xs text-slate-600">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Jurisdictions */}
      <Section title="Target Jurisdictions (DMV)" icon={Zap} color="#1A2B4A">
        <div className="flex flex-wrap gap-2">
          {(JURISDICTIONS as readonly string[]).map((j: string) => (
            <Pill key={j} text={j} color="#1A2B4A" />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Segment GHL lists by jurisdiction. Each market gets jurisdiction-specific copy.
          Tags are set automatically at intake form submission.
        </p>
      </Section>

      {/* Strategy prompt commands */}
      <Section title="Ready-to-Run Strategy Commands" icon={MessageSquare} color="#6B46C1">
        <p className="text-sm text-slate-600 mb-4">
          These commands in the Marketing Hub are pre-loaded with the brand context above.
          Every output respects brand voice, audience rules, and copy pillar guidelines automatically.
        </p>
        <div className="space-y-2">
          {STRATEGY_COMMANDS.map(cmd => (
            <div key={cmd.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition">
              <div>
                <p className="text-sm font-semibold text-slate-900">{cmd.label}</p>
                <p className="text-xs text-slate-500">{cmd.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <Pill text={cmd.tag} color="#6B46C1" />
                <Link
                  href={`/marketing?command=${cmd.id}`}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                >
                  Run →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Prompt Reference
          </p>
          <div className="space-y-3 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800 mb-0.5">Email subject lines</p>
              <p>Inputs: audience segment, project type → 8 subject lines, varied angles, Day 1–12 order</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-0.5">Google ads</p>
              <p>Inputs: keyword, jurisdiction, price tier → 5 ads (H1/H2/Description, max chars enforced)</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-0.5">Meta ad copy</p>
              <p>Inputs: audience, jurisdictions → 3 body copy variations (60–90 words, problem-led, no rhetorical questions)</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-0.5">GHL Day 1 email</p>
              <p>Inputs: lead name, project type → welcome email with portal next-steps + scope call CTA (200–260 words)</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-0.5">GHL Day 8 email</p>
              <p>Inputs: jurisdiction → 3-block objection email: readiness / past experience / jurisdiction expertise (250–300 words)</p>
            </div>
          </div>
        </div>
      </Section>

    </div>
  )
}
