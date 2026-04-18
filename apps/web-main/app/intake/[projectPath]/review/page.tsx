'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { IntakeReviewPanel } from '@kealee/ui/components/intake/intake-review-panel'
import {
  Camera, Mic, MapPin, CheckCircle2, AlertCircle,
  ShieldAlert, TrendingUp, ArrowRight, Loader2,
} from 'lucide-react'

const SITE_VISIT_FEE_CENTS = 12500
const AI_CONCEPT_BASE_CENTS = 38500

type CaptureMode = 'self_capture' | 'enhanced_scan' | 'kealee_site_visit'

// ── Stripe product checkout mapping ────────────────────────────────────────────
const PRODUCT_CHECKOUT_MAP: Record<string, { path: string; amount?: number } | undefined> = {
  PERMIT_PACKAGE: { path: '/intake/permit_path_only/payment', amount: 79900 },
  PERMIT_PACKAGE_PM: { path: '/intake/permit_path_only/payment', amount: 374900 },
  CONTRACTOR_MATCH: { path: '/intake/contractor_match/payment', amount: 19900 },
  DESIGN_CONCEPT: { path: '/intake/design_build/checkout', amount: 39900 },
  DESIGN_CONCEPT_VALIDATION: { path: '/intake/design_build/checkout', amount: 39900 },
  CONSULTATION: { path: '/intake/design_build/payment', amount: 14900 },
}

interface CaptureInfo {
  captureSessionId: string | null
  captureMode: CaptureMode | null
  siteVisitFee: number
  preferredVisitWindow: string | null
  uploadedAssetsCount: number
  voiceNotesCount: number
  completedZonesCount: number
  totalZonesCount: number
  scanCompleted: boolean
}

// ── Agent output types ────────────────────────────────────────────────────────
interface CTCBreakdown { construction: number; soft: number; risk: number; execution: number }
interface CTCOutput { total: number; range: [number, number]; cost_per_sqft: number; sqft: number; breakdown: CTCBreakdown }
interface AgentOutput {
  success?: boolean
  status?: string
  summary?: string
  risks?: string[]
  recommendations?: string[]
  confidence?: 'high' | 'medium' | 'low'
  next_step?: string
  cta?: string
  conversion_product?: string
  ctc?: CTCOutput
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${n.toLocaleString()}`
}

// ── Path → agent mapping ──────────────────────────────────────────────────────
function resolveAgent(
  projectPath: string,
  formData: Record<string, unknown>
): { agentType: string; payload: Record<string, unknown> } | null {
  const jurisdiction =
    (formData.permitJurisdiction as string) ??
    (formData.projectAddress as string) ??
    ''
  const sqft = Number(formData.squareFootage ?? formData.sqft ?? 1500)

  const map: Record<string, { agentType: string; payload: Record<string, unknown> }> = {
    exterior_concept:     { agentType: 'land',   payload: { jurisdiction, projectType: 'single-family', address: formData.projectAddress } },
    capture_site_concept: { agentType: 'land',   payload: { jurisdiction, projectType: 'single-family' } },
    interior_renovation:  { agentType: 'design', payload: { projectType: 'interior-renovation', jurisdiction, sqft } },
    whole_home_remodel:   { agentType: 'design', payload: { projectType: 'single-family', jurisdiction, sqft } },
    addition_expansion:   { agentType: 'design', payload: { projectType: 'addition', jurisdiction, sqft } },
    design_build:         { agentType: 'design', payload: { projectType: 'single-family', jurisdiction, sqft } },
    kitchen_remodel:      { agentType: 'design', payload: { projectType: 'kitchen-remodel', jurisdiction, sqft } },
    bathroom_remodel:     { agentType: 'design', payload: { projectType: 'bathroom-remodel', jurisdiction, sqft } },
    permit_path_only:     { agentType: 'permit', payload: { jurisdiction, projectType: (formData.permitType as string) ?? '' } },
  }
  return map[projectPath] ?? null
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high:   { bg: '#F0FDF4', text: '#15803D', label: 'High Confidence' },
    medium: { bg: '#FFFBEB', text: '#B45309', label: 'Medium Confidence' },
    low:    { bg: '#FEF2F2', text: '#B91C1C', label: 'Low Confidence' },
  }
  const s = styles[level]
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

// ── CTC breakdown card ────────────────────────────────────────────────────────
function CTCBreakdownCard({ ctc }: { ctc: CTCOutput }) {
  const rows = [
    { label: 'Construction',  value: ctc.breakdown.construction, color: '#1A2B4A' },
    { label: 'Soft Costs',    value: ctc.breakdown.soft,         color: '#4338CA' },
    { label: 'Risk Buffer',   value: ctc.breakdown.risk,         color: '#B45309' },
    { label: 'Execution Fees',value: ctc.breakdown.execution,    color: '#E8793A' },
  ]
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold" style={{ color: '#1A2B4A' }}>
          Estimated Total Project Cost
        </h3>
        <span className="text-xs text-gray-400">{ctc.sqft.toLocaleString()} sqft</span>
      </div>

      {/* Range callout */}
      <div
        className="rounded-xl px-4 py-3 text-center"
        style={{ backgroundColor: '#F0FDF4' }}
      >
        <p className="text-xs text-gray-500 mb-0.5">Complete Total Cost (CTC)</p>
        <p className="text-xl font-extrabold" style={{ color: '#15803D' }}>
          {fmtK(ctc.range[0])} – {fmtK(ctc.range[1])}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtK(ctc.cost_per_sqft)}/sqft base rate
        </p>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2">
        {rows.map(({ label, value, color }) => {
          const pct = ctc.total > 0 ? Math.round((value / ctc.total) * 100) : 0
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-xs text-gray-500">{label}</div>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <div className="w-14 text-right text-sm font-semibold" style={{ color }}>
                {fmtK(value)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Agent insight card ────────────────────────────────────────────────────────
function AgentInsightCard({
  output,
  onCta,
  isSubmitting,
}: {
  output: AgentOutput
  onCta: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="space-y-4">
      {/* CTC breakdown (shown when available) */}
      {output.ctc && <CTCBreakdownCard ctc={output.ctc} />}

      <div className="rounded-2xl border border-[#1A2B4A]/10 bg-gradient-to-br from-[#1A2B4A]/5 to-white p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: '#1A2B4A' }} />
            <h3 className="text-sm font-bold" style={{ color: '#1A2B4A' }}>
              Project Analysis
            </h3>
          </div>
          {output.confidence && <ConfidenceBadge level={output.confidence} />}
        </div>

        {/* Summary */}
        {output.summary && (
          <p className="text-sm text-gray-700 leading-relaxed">{output.summary}</p>
        )}

        {/* Risks */}
        {output.risks && output.risks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Key Considerations
            </p>
            <ul className="space-y-1.5">
              {output.risks.slice(0, 4).map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next step */}
        {output.next_step && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: '#EEF2FF', color: '#3730A3' }}
          >
            <span className="font-semibold">Next step:</span> {output.next_step}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onCta}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#E8793A' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              {output.cta ?? 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Capture method section ────────────────────────────────────────────────────
function CaptureSummarySection({ info }: { info: CaptureInfo }) {
  if (!info.captureMode) return null

  if (info.captureMode === 'kealee_site_visit') {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-900">Kealee Site Visit Scan</h3>
          </div>
          <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-800">
            + $125
          </span>
        </div>
        <p className="text-sm text-indigo-700">
          Kealee will perform an on-site professional scan of your property.
        </p>
        {info.preferredVisitWindow && (
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Preferred availability: <strong>{info.preferredVisitWindow}</strong>
          </div>
        )}
        <div className="rounded-xl bg-white px-4 py-3 text-xs text-indigo-700 border border-indigo-100">
          📅 After payment, our team will contact you within 24 hours to confirm your visit.
        </div>
        <div className="border-t border-indigo-100 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-indigo-700">
            <span>AI Concept Package</span><span>$385</span>
          </div>
          <div className="flex justify-between text-indigo-700">
            <span>Kealee Site Visit Scan</span><span>$125</span>
          </div>
          <div className="flex justify-between font-bold text-indigo-900 border-t border-indigo-200 pt-1.5 mt-1.5">
            <span>Total</span><span>$510</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Capture Summary</h3>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: info.captureMode === 'enhanced_scan' ? '#EEF2FF' : '#F0FDF4',
            color: info.captureMode === 'enhanced_scan' ? '#4338CA' : '#15803D',
          }}
        >
          {info.captureMode === 'enhanced_scan' ? 'Enhanced Scan' : 'Self Capture'}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {info.captureMode === 'enhanced_scan'
          ? 'You will capture and scan your property for improved accuracy.'
          : 'You will capture your property using guided photo and video steps.'}
      </p>
      {info.captureSessionId && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <Camera className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>{info.uploadedAssetsCount}</p>
            <p className="text-xs text-gray-500">Photos</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <Mic className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>{info.voiceNotesCount}</p>
            <p className="text-xs text-gray-500">Voice Notes</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <span className="block text-sm font-bold" style={{ color: '#E8793A' }}>
              {info.completedZonesCount}/{info.totalZonesCount}
            </span>
            <p className="text-xs text-gray-500">Rooms</p>
          </div>
        </div>
      )}
      {info.captureMode === 'enhanced_scan' && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: info.scanCompleted ? '#F0FDF4' : '#FFF7ED' }}
        >
          {info.scanCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
              <span className="text-sm text-green-700">Scan Completed — Floor plan with room layout included</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-sm text-amber-700">3D scan pending — AI-inferred layout will be used</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Deliverables ──────────────────────────────────────────────────────────────
function DeliverablesSection({ captureMode, scanCompleted }: { captureMode: CaptureMode | null; scanCompleted: boolean }) {
  const items = [
    '3D exterior concept renderings',
    'Material + finish direction board',
    'AI-generated design narrative',
    captureMode === 'enhanced_scan' && scanCompleted ? '+ Floor plan with room layout' : '+ AI-inferred layout',
    captureMode === 'kealee_site_visit' ? '+ Professional scan measurements' : null,
  ].filter(Boolean) as string[]

  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A2B4A' }}>
        What&apos;s Included
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IntakeReviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectPath = params.projectPath as string

  const [formData, setFormData] = useState<Record<string, unknown> | null>(null)
  const [captureInfo, setCaptureInfo] = useState<CaptureInfo>({
    captureSessionId: null,
    captureMode: null,
    siteVisitFee: 0,
    preferredVisitWindow: null,
    uploadedAssetsCount: 0,
    voiceNotesCount: 0,
    completedZonesCount: 0,
    totalZonesCount: 0,
    scanCompleted: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agentOutput, setAgentOutput] = useState<AgentOutput | null>(null)
  const [agentLoading, setAgentLoading] = useState(false)

  // Load form data + capture info from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = sessionStorage.getItem(`kealee_intake_${projectPath}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, unknown>
        setFormData(parsed)
      } catch {}
    }

    const captureModeRaw = sessionStorage.getItem(`kealee_capture_mode_${projectPath}`)
    const captureSession = sessionStorage.getItem(`kealee_capture_session_${projectPath}`)
    let parsedMode: { captureMode?: CaptureMode; siteVisitFee?: number; preferredVisitWindow?: string | null } = {}
    try { parsedMode = captureModeRaw ? JSON.parse(captureModeRaw) : {} } catch {}
    let parsedSession: { captureSessionId?: string } = {}
    try { parsedSession = captureSession ? JSON.parse(captureSession) : {} } catch {}

    const cid = parsedSession.captureSessionId ?? null
    const mode = parsedMode.captureMode ?? null
    setCaptureInfo((prev) => ({
      ...prev,
      captureSessionId: cid,
      captureMode: mode,
      siteVisitFee: parsedMode.siteVisitFee ?? 0,
      preferredVisitWindow: parsedMode.preferredVisitWindow ?? null,
    }))

    if (cid && mode !== 'kealee_site_visit') {
      fetch(`/api/capture/progress?captureSessionId=${cid}`)
        .then((r) => r.json())
        .then((data) => {
          setCaptureInfo((prev) => ({
            ...prev,
            uploadedAssetsCount: data.uploadedAssetsCount ?? 0,
            voiceNotesCount: data.voiceNotesCount ?? 0,
            completedZonesCount: data.completedZonesCount ?? 0,
            totalZonesCount: data.totalZonesCount ?? 0,
            scanCompleted: data.scanCompleted ?? false,
          }))
        })
        .catch(() => {})
    }
  }, [projectPath])

  // Call agent once formData is available
  useEffect(() => {
    if (!formData) return
    const agentConfig = resolveAgent(projectPath, formData)
    if (!agentConfig) return

    setAgentLoading(true)
    fetch(`/api/agents/${agentConfig.agentType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentConfig.payload),
    })
      .then((r) => r.json())
      .then((data: AgentOutput) => {
        if (!data.status || data.status !== 'RAG_MISSING') {
          setAgentOutput(data)
        }
      })
      .catch(() => {})
      .finally(() => setAgentLoading(false))
  }, [formData, projectPath])

  if (!formData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No intake data found.</p>
        <button
          onClick={() => router.push(`/intake/${projectPath}`)}
          className="mt-4 text-sm text-[#E8793A] hover:underline"
        >
          Start intake
        </button>
      </div>
    )
  }

  async function handleAgentCTA() {
    // Route to specific Stripe product based on agent's conversion_product
    const product = agentOutput?.conversion_product
    if (!product) {
      // Fallback to standard intake submit
      return handleSubmit()
    }

    const checkout = PRODUCT_CHECKOUT_MAP[product]
    if (!checkout) {
      // Product not in map, fallback to standard intake
      return handleSubmit()
    }

    // Route to the Stripe product checkout
    const qs = new URLSearchParams()
    if (checkout.amount) {
      qs.append('amount', String(checkout.amount))
    }
    router.push(`${checkout.path}?${qs.toString()}`)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const isSiteVisit = captureInfo.captureMode === 'kealee_site_visit'
      const totalAmount = isSiteVisit
        ? AI_CONCEPT_BASE_CENTS + SITE_VISIT_FEE_CENTS
        : undefined

      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: formData,
          captureSessionId: captureInfo.captureSessionId ?? undefined,
          captureMode: captureInfo.captureMode ?? undefined,
          scanCompleted: captureInfo.scanCompleted,
          siteVisitRequested: isSiteVisit,
          siteVisitFee: isSiteVisit ? SITE_VISIT_FEE_CENTS : 0,
          preferredVisitWindow: captureInfo.preferredVisitWindow ?? undefined,
          overrideAmount: totalAmount,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json() as {
        ok: boolean; intakeId?: string; requiresPayment?: boolean; paymentAmount?: number; errors?: string[]
      }

      if (!result.ok) {
        alert('Submission failed: ' + (result.errors?.join(', ') ?? 'Unknown error'))
        return
      }

      const amount = result.paymentAmount ?? (isSiteVisit ? AI_CONCEPT_BASE_CENTS + SITE_VISIT_FEE_CENTS : 38500)

      if (result.requiresPayment && result.intakeId) {
        const qs = new URLSearchParams({
          intakeId: result.intakeId,
          amount: String(amount),
          ...(isSiteVisit ? { siteVisit: '1' } : {}),
        })
        router.push(`/intake/${projectPath}/payment?${qs.toString()}`)
      } else {
        router.push(`/intake/${projectPath}/success?intakeId=${result.intakeId ?? 'unknown'}`)
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
      <CaptureSummarySection info={captureInfo} />
      <DeliverablesSection
        captureMode={captureInfo.captureMode}
        scanCompleted={captureInfo.scanCompleted}
      />

      {/* Agent analysis — shown when RAG data is available */}
      {agentLoading && (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Analyzing your project against local permit + zoning data…</span>
        </div>
      )}

      {agentOutput && !agentLoading && (
        <AgentInsightCard
          output={agentOutput}
          onCta={handleAgentCTA}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Standard review panel — CTA shown only if agent didn't load */}
      <IntakeReviewPanel
        formData={formData}
        projectPath={projectPath}
        onBack={() => router.push(`/intake/${projectPath}`)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        hidePrimaryButton={!!agentOutput}
      />
    </div>
  )
}
