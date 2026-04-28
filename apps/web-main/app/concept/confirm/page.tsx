'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Shield, Video, Loader2, FileText, Image as ImageIcon, LayoutTemplate, Table2, Layers, Star } from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'

// ── Tier deliverable content ──────────────────────────────────────────────────

interface TierDeliverable {
  icon: React.ElementType
  title: string
  items: string[]
}

const TIER_DELIVERABLES: Record<1 | 2 | 3, TierDeliverable[]> = {
  1: [
    {
      icon: FileText,
      title: 'PDF Report (15–20 pages)',
      items: [
        'Project vision, style & color palette',
        'Spatial planning & layout analysis',
        'Zoning & code compliance check',
        'Materials & finish specifications',
        'Budget estimate with category breakdown',
        'MEP systems overview (electrical, plumbing, HVAC)',
        'Project timeline & phases',
        'Design rationale notes',
      ],
    },
    {
      icon: ImageIcon,
      title: '3–5 Concept Renderings (1920×1080)',
      items: [
        'Front counter view',
        'Island & seating view',
        'Full space overview',
        'Detail & alternate angles',
      ],
    },
    {
      icon: FileText,
      title: 'Quick Reference Sheet + Budget Comparison',
      items: [
        'One-page print-ready summary',
        'Budget / standard / luxury options side-by-side',
        'Key colors, materials & permit count',
      ],
    },
    {
      icon: LayoutTemplate,
      title: 'Web Portal Access (lifetime)',
      items: [
        'Shareable link — send to family or contractors',
        'Download all files individually',
        '10-year cloud storage',
        '1 revision included',
      ],
    },
  ],
  2: [
    {
      icon: Video,
      title: '60-Second Transformation Video (1080p)',
      items: [
        'AI avatar narration with professional voiceover (30s)',
        'AI-generated before → after transformation (20s)',
        'Professional music, color grading & subtitles',
        'Download + streaming + social-ready formats',
      ],
    },
    {
      icon: Layers,
      title: '2D Architectural Floor Plan',
      items: [
        'Scale 1/4″ = 1′ (contractor-ready)',
        'All rooms, dimensions & appliance locations',
        'Color-coded MEP: 🟠 Electrical, 🔵 Plumbing, 🟢 HVAC',
        'Interactive viewer (zoom/pan) + PDF download',
      ],
    },
    {
      icon: ImageIcon,
      title: '6–8 Enhanced Renderings (2560×1440)',
      items: [
        'Hero, island detail, appliance zone, sink area',
        'Lifestyle & alternate lighting angles',
        'Social media, print & mobile download sizes',
      ],
    },
    {
      icon: LayoutTemplate,
      title: 'Interactive Web Portal',
      items: [
        'Embedded video player',
        'Interactive floor plan with layer toggles',
        'Lightbox renderings gallery',
        'All specs, docs & downloads in one place',
        'Password-protect & share freely — lifetime access',
      ],
    },
    {
      icon: Table2,
      title: 'Itemized Bill of Materials',
      items: [
        '8 categories (cabinetry, countertops, appliances…)',
        'Unit prices, quantities & labor estimates',
        'Editable Excel spreadsheet + PDF',
        'Budget / standard / luxury cost comparator',
      ],
    },
    {
      icon: FileText,
      title: 'Everything in Basic +',
      items: [
        '15–20 page PDF report',
        'Quick reference sheet',
        '1 major + 2 minor revisions',
        'Email + phone support (30 days)',
      ],
    },
  ],
  3: [
    {
      icon: Video,
      title: '4 Video Formats',
      items: [
        '60s Full  ·  30s Mobile  ·  15s Social  ·  10s Preview',
        '4K resolution, multiple aspect ratios',
        'AI narration + AI transformation sequence',
        'Music options & custom branding',
      ],
    },
    {
      icon: Layers,
      title: 'Multi-Layer 3D Floor Plan',
      items: [
        'Interactive 3D model with MEP layer toggles',
        'CAD file downloads (DWG/DXF)',
        'Permit-submission quality',
        'Virtual walkthrough experience',
      ],
    },
    {
      icon: ImageIcon,
      title: '12–15 Renderings (4K)',
      items: [
        'Every angle covered, dusk/dawn lighting sets',
        'Interior + exterior context shots',
        'Framing-quality print resolution',
      ],
    },
    {
      icon: Star,
      title: 'Professional Service',
      items: [
        'Advanced cost analysis + contractor bid tool',
        'Permit submission strategy & variance guidance',
        'Tax deduction & energy savings calculation',
        'Contractor coordination support',
      ],
    },
    {
      icon: FileText,
      title: 'Everything in Premium +',
      items: [
        '25–30 page comprehensive PDF report',
        'Unlimited revisions',
        '90-day priority support',
        'Perceived value $8,000–$12,000',
      ],
    },
  ],
}

const TIER_TAGLINES: Record<1 | 2 | 3, string> = {
  1: 'Perfect for exploring ideas and getting contractor bids.',
  2: 'The sweet spot — video + floor plan for most homeowners.',
  3: 'Professional-grade package. Like hiring a $5K architect.',
}

const TIER_VALUE: Record<1 | 2 | 3, string> = {
  1: 'Perceived value $1,500–$2,000',
  2: 'Perceived value $4,500–$6,000',
  3: 'Perceived value $8,000–$12,000',
}

// ──────────────────────────────────────────────────────────────────────────────

function SummaryRow({ label, value, editHref }: { label: string; value: string; editHref: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm text-slate-800">{value}</p>
      </div>
      <Link href={editHref} className="text-xs font-semibold text-[#E8724B] hover:underline whitespace-nowrap shrink-0">
        Edit
      </Link>
    </div>
  )
}

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const serviceSlug = searchParams.get('service') ?? ''
  const scope = searchParams.get('scope') ?? ''
  const budget = searchParams.get('budget') ?? ''
  const zip = searchParams.get('zip') ?? ''
  const firstName = searchParams.get('firstName') ?? ''
  const lastName = searchParams.get('lastName') ?? ''
  const email = searchParams.get('email') ?? ''
  const phone = searchParams.get('phone') ?? ''
  const address = searchParams.get('address') ?? ''

  const service = SERVICE_MAP[serviceSlug]
  const availableTiers = service?.tiers.filter((t) => t.available) ?? []
  const defaultTier = availableTiers.find((t) => t.tier === 2) ? 2 : (availableTiers[0]?.tier ?? 1)

  const [tier, setTier] = useState<1 | 2 | 3>(defaultTier as 1 | 2 | 3)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedTier = service?.tiers.find((t) => t.tier === tier)
  const price = selectedTier?.price ?? 0

  const detailsParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip })
  const contactParams = new URLSearchParams({ service: serviceSlug, scope, budget, zip, firstName, lastName, email, phone, address })

  async function handleSubmit() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setError('')
    setSubmitting(true)
    try {
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: service?.intakePath ?? serviceSlug,
          clientName: `${firstName} ${lastName}`.trim(),
          contactEmail: email,
          contactPhone: phone || null,
          projectAddress: address || `ZIP: ${zip}`,
          formData: { description: scope, budget, zip, tier },
        }),
      })
      if (!intakeRes.ok) {
        const body = await intakeRes.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save intake.')
      }
      const { intakeId } = await intakeRes.json()

      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath: service?.intakePath ?? serviceSlug,
          amount: price * 100,
          successUrl: `${window.location.origin}/concept/deliverable?intakeId=${intakeId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/concept/confirm?${searchParams.toString()}&canceled=true`,
        }),
      })
      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not create checkout.')
      }
      const { url } = await checkoutRes.json()
      if (url) window.location.href = url
      else throw new Error('No checkout URL returned.')
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  if (!serviceSlug || !email) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Session expired or incomplete.</p>
        <Link href="/concept" className="text-[#E8724B] font-semibold">← Start over</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 4 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Choose Your Package</h1>
        <p className="text-slate-500">Select a tier, then complete secure checkout.</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
        <SummaryRow label="Service" value={service?.label ?? serviceSlug} editHref={`/concept?service=${serviceSlug}`} />
        <SummaryRow label="Project Scope" value={scope.length > 100 ? scope.slice(0, 100) + '…' : scope} editHref={`/concept/details?${detailsParams}`} />
        <SummaryRow label="Budget" value={budget ? `$${Number(budget).toLocaleString()}` : '—'} editHref={`/concept/details?${detailsParams}`} />
        <SummaryRow label="ZIP Code" value={zip} editHref={`/concept/details?${detailsParams}`} />
        <SummaryRow
          label="Contact"
          value={`${firstName} ${lastName} — ${email}`}
          editHref={`/concept/contact?${contactParams}`}
        />
      </div>

      {/* Tier Selector */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Select Your Package</h2>
        <div className={`grid gap-5 ${availableTiers.length === 3 ? 'lg:grid-cols-3' : availableTiers.length === 2 ? 'sm:grid-cols-2' : 'max-w-xs'}`}>
          {availableTiers.map((t) => {
            const isSelected = tier === t.tier
            const deliverables = TIER_DELIVERABLES[t.tier as 1 | 2 | 3] ?? []

            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => setTier(t.tier as 1 | 2 | 3)}
                className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? 'border-[#E8724B] bg-orange-50 shadow-lg shadow-orange-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Popular badge */}
                {t.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#E8724B] text-white text-[10px] font-bold px-3 py-0.5 whitespace-nowrap">
                    {t.badge}
                  </span>
                )}

                {/* Radio indicator */}
                <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-300'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                {/* Tier name */}
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-[#E8724B]' : 'text-slate-400'}`}>{t.name}</p>

                {/* Price */}
                <p className="text-3xl font-black text-slate-900 mb-1">${t.price.toLocaleString()}</p>

                {/* Tagline */}
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{TIER_TAGLINES[t.tier as 1 | 2 | 3]}</p>

                {/* Deliverables */}
                <div className="space-y-3 flex-1">
                  {deliverables.map((d, i) => {
                    const Icon = d.icon
                    return (
                      <div key={i}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#E8724B]' : 'text-slate-400'}`} />
                          <p className="text-xs font-bold text-slate-800">{d.title}</p>
                        </div>
                        <ul className="ml-5 space-y-0.5">
                          {d.items.map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-snug">
                              <CheckCircle2 className={`w-3 h-3 shrink-0 mt-0.5 ${isSelected ? 'text-[#E8724B]' : 'text-slate-300'}`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {/* Perceived value */}
                <p className={`mt-4 pt-3 border-t text-[10px] font-semibold ${isSelected ? 'border-orange-200 text-[#E8724B]' : 'border-slate-100 text-slate-400'}`}>
                  {TIER_VALUE[t.tier as 1 | 2 | 3]}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Price total */}
      <div className="bg-slate-900 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
          <p className="text-2xl font-black text-white">${price.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5" /> Secure checkout via Stripe
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#E8724B]"
        />
        <span className="text-sm text-slate-600">
          I agree to Kealee's{' '}
          <Link href="/terms" className="underline text-[#E8724B]">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline text-[#E8724B]">Privacy Policy</Link>.
        </span>
      </label>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link
          href={`/concept/contact?${contactParams}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!agreed || submitting}
          className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-orange-200"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          ) : (
            <><Shield className="w-4 h-4" /> Pay ${price.toLocaleString()} & Create Concept</>
          )}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        You'll be redirected to Stripe to complete your payment securely.
      </p>
    </div>
  )
}

export default function ConceptConfirmPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <ConfirmInner />
    </Suspense>
  )
}
