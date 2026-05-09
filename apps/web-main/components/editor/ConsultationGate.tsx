'use client'

/**
 * ConsultationGate — Consultation booking gate component
 *
 * Checks if the current user is eligible for a consultation via
 * POST /api/consultation/gate. If not, shows an upgrade prompt.
 *
 * Business rules (from docs):
 * - Consultations require: plans uploaded OR paid design/permit package
 * - All other users → pushed to AI self-service + upgrade
 *
 * Usage:
 *   <ConsultationGate email={user.email} intakeId={intakeId}>
 *     <BookConsultationButton />
 *   </ConsultationGate>
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

interface GateResult {
  allowed: boolean
  reason: string
  upgradeProduct?: string
  upgradeUrl?: string
  upgradePrice?: string
}

interface Props {
  email?: string
  userId?: string
  intakeId?: string
  hasPlans?: boolean
  /** Rendered when consultation is allowed */
  children: React.ReactNode
  /** Show a compact version (for inline CTAs) */
  compact?: boolean
}

export default function ConsultationGate({ email, userId, intakeId, hasPlans, children, compact = false }: Props) {
  const [result, setResult] = useState<GateResult | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkGate() {
      try {
        const res = await fetch('/api/consultation/gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId, intakeId, hasPlans }),
        })
        const data = await res.json()
        setResult(data)
      } catch {
        // Network error — default to blocked, show upgrade
        setResult({
          allowed: false,
          reason: 'Gate check failed',
          upgradeUrl: '/intake/concept',
          upgradePrice: '$149',
          upgradeProduct: 'concept',
        })
      } finally {
        setIsChecking(false)
      }
    }
    checkGate()
  }, [email, userId, intakeId, hasPlans])

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking eligibility...</span>
      </div>
    )
  }

  if (result?.allowed) {
    return <>{children}</>
  }

  // Blocked — show upgrade prompt
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700">Consultation locked</p>
          <p className="text-xs text-slate-500">Requires AI Concept package or approved plans</p>
        </div>
        <Link
          href={result?.upgradeUrl ?? '/intake/concept'}
          className="inline-flex items-center gap-1 bg-[#E8724B] text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 hover:bg-[#D45C33] transition"
        >
          Unlock {result?.upgradePrice} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
      {/* Lock icon */}
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-slate-400" />
      </div>

      <h3 className="font-black text-slate-900 text-lg mb-2">Consultation Locked</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-5">
        Kealee consultations are available once you have either:
      </p>

      <ul className="space-y-2.5 mb-6">
        {[
          'AI Concept package purchased ($149)',
          'Professional Drawings package purchased',
          'Permit Package purchased',
          'Approved architect drawings uploaded',
        ].map(item => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500 mb-5 leading-relaxed">
        This ensures every consultation is focused and productive — your architect or project manager reviews your real scope, not just a description.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={result?.upgradeUrl ?? '/intake/concept'}
          className="flex-1 flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-5 py-3 rounded-xl text-sm transition"
        >
          Start with AI Concept — {result?.upgradePrice ?? '$149'} <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/contact"
          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 font-semibold px-5 py-3 rounded-xl text-sm hover:bg-slate-50 transition"
        >
          I have plans →
        </Link>
      </div>
    </div>
  )
}
