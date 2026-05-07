'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface IntakeSummary {
  id: string
  project_path: string
  status: string
  created_at: string
  budget_range: string | null
  project_address: string | null
  form_data: Record<string, unknown> | null
}

const ACCENT  = '#2ABFBF'
const CORAL   = '#E8724B'
const NAVY    = '#1A2B4A'

function statusBadge(status: string) {
  if (status === 'concept_ready') {
    return (
      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-teal-50 text-teal-700 border border-teal-200">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </span>
    )
  }
  if (status === 'new' || status === 'processing') {
    return (
      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" /> Generating
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
      <AlertCircle className="h-3 w-3" /> {status}
    </span>
  )
}

function projectLabel(projectPath: string): string {
  return projectPath
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ConceptsPage() {
  const [intakes, setIntakes] = useState<IntakeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email
      setEmail(userEmail ?? null)

      if (!userEmail) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`https://kealee.com/api/intake/list?email=${encodeURIComponent(userEmail)}`)
        if (res.ok) {
          const json = await res.json()
          setIntakes(json.intakes ?? [])
        }
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Design Concepts</h1>
          <p className="text-sm text-slate-500 mt-1">Your purchased concept packages and design reports.</p>
        </div>
        <a
          href="https://kealee.com/concept"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: CORAL }}
        >
          <Sparkles className="h-4 w-4" />
          New Concept
        </a>
      </div>

      {/* Permit credit callout */}
      <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3.5">
        <span className="text-xl">💡</span>
        <p className="text-sm text-teal-800">
          <span className="font-bold">Your design concept cost is credited toward permit drawing plans.</span>{' '}
          When you proceed to permits, the amount paid for your concept is deducted from your permit package price.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: ACCENT }} />
        </div>
      ) : intakes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${ACCENT}15` }}>
            <Sparkles className="h-7 w-7" style={{ color: ACCENT }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>No concept packages yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            Purchase a design concept package to get AI-generated renderings, floor plan direction, and a permit scope brief.
          </p>
          <a
            href="https://kealee.com/concept"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: CORAL }}
          >
            <Sparkles className="h-4 w-4" />
            Browse Concept Packages
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {intakes.map((intake) => {
            const formData = intake.form_data ?? {}
            const tier = typeof formData.tier === 'number' ? formData.tier : 1
            const tierLabel = tier === 3 ? 'Premium+' : tier === 2 ? 'Premium' : 'Basic'
            const isReady = intake.status === 'concept_ready'

            return (
              <Link
                key={intake.id}
                href={`/concepts/${intake.id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-all group"
              >
                {/* Icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${ACCENT}15` }}>
                  <Sparkles className="h-5 w-5" style={{ color: ACCENT }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate" style={{ color: NAVY }}>
                      {projectLabel(intake.project_path)}
                    </p>
                    {statusBadge(intake.status)}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    Tier {tier} — {tierLabel} · {intake.project_address ?? 'No address'} ·{' '}
                    {new Date(intake.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* CTA */}
                <div className="shrink-0 flex items-center gap-2">
                  {isReady ? (
                    <span className="text-xs font-semibold" style={{ color: ACCENT }}>View concept</span>
                  ) : (
                    <span className="text-xs text-slate-400">Generating…</span>
                  )}
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
