'use client'

/**
 * /editor — Design Studio Home
 *
 * User picks project type → we create a new Pascal scene → redirect to /editor/[sceneId]
 * Alternatively, user can upload photos/plans first and we do AI vision analysis.
 *
 * This page is the gateway into the Pascal Editor for all homeowners.
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Upload, Pencil, Sparkles, Lock } from 'lucide-react'
import { PROJECT_TYPE_CONFIG } from '@kealee/pascal-wrapper'
import type { ProjectType } from '@kealee/pascal-wrapper'

const PROJECT_TYPES = Object.entries(PROJECT_TYPE_CONFIG).map(([key, cfg]) => ({
  type: key as ProjectType,
  ...cfg,
}))

const ENTRY_MODES = [
  {
    id: 'draw',
    icon: Pencil,
    title: 'Draw My Layout',
    desc: 'Use the visual editor to sketch walls, rooms, and elements. AI generates your estimate.',
    badge: null,
    color: '#1A2B4A',
  },
  {
    id: 'upload',
    icon: Upload,
    title: 'Upload Photos or Plans',
    desc: 'Drop in room photos, existing floor plans, or sketches. AI reads the geometry for you.',
    badge: 'AI Vision',
    color: '#6B46C1',
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI Design for Me',
    desc: 'Describe your project in plain text. AI generates a starter layout with cost estimate.',
    badge: 'AI Agent',
    color: '#E8724B',
  },
]

export default function EditorHomeClient() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleStart = useCallback(async () => {
    if (!selectedType) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/editor/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType: selectedType,
          name: PROJECT_TYPE_CONFIG[selectedType].label,
        }),
      })
      const { scene } = await res.json()
      if (!scene?.id) throw new Error('No scene returned')

      if (selectedMode === 'upload') {
        router.push(`/editor/${scene.id}?mode=upload`)
      } else {
        router.push(`/editor/${scene.id}`)
      }
    } catch (err) {
      console.error('[EditorHome] create scene failed:', err)
      setIsCreating(false)
    }
  }, [selectedType, selectedMode, router])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero */}
      <div className="bg-[#1A2B4A] py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8724B]/20 text-[#E8724B] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3 h-3" /> Design Studio — AI-Powered
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Design your project.<br />Get your estimate.
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Sketch your addition, remodel, or renovation in the visual editor. AI converts your layout into a real cost estimate — and starts your Kealee build journey.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-400">
            {['No CAD experience needed', '2D + 3D visualization', 'AI cost estimate', 'Feeds directly into permitting'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-[#E8724B]">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">

        {/* Step 1 — Project Type */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 1</p>
          <h2 className="text-2xl font-black text-slate-900 mb-6">What are you building?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROJECT_TYPES.map(pt => (
              <button
                key={pt.type}
                onClick={() => setSelectedType(pt.type)}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  selectedType === pt.type
                    ? 'border-[#E8724B] bg-orange-50 shadow-md shadow-orange-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-2xl mb-2">{pt.icon}</p>
                    <p className="font-bold text-slate-900 text-sm">{pt.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{pt.budgetRange}</p>
                    <p className="text-xs text-slate-400">{pt.timelineWeeks}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                    selectedType === pt.type ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-300'
                  }`}>
                    {selectedType === pt.type && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Entry mode */}
        {selectedType && (
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 2</p>
            <h2 className="text-2xl font-black text-slate-900 mb-6">How do you want to start?</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {ENTRY_MODES.map(mode => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`text-left rounded-xl border-2 p-5 transition-all relative ${
                      selectedMode === mode.id
                        ? 'border-[#E8724B] bg-orange-50 shadow-md shadow-orange-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {mode.badge && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${mode.color}15`, color: mode.color }}>
                        {mode.badge}
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${mode.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: mode.color }} />
                    </div>
                    <p className="font-bold text-slate-900 text-sm mb-1.5">{mode.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{mode.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        {selectedType && selectedMode && (
          <div className="text-center">
            <button
              onClick={handleStart}
              disabled={isCreating}
              className="inline-flex items-center gap-3 bg-[#E8724B] hover:bg-[#D45C33] disabled:opacity-60 text-white font-black px-8 py-4 rounded-xl transition text-base shadow-lg shadow-orange-200"
            >
              {isCreating ? (
                <>Opening Editor...</>
              ) : (
                <>
                  Open Design Studio
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Free to sketch. Get an AI estimate in minutes.
            </p>
          </div>
        )}

        {/* Consultation gate info */}
        <div className="mt-16 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm mb-1">Already have approved plans?</p>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                If you have architect-stamped drawings or an approved permit set, you can book a consultation directly with the Kealee team — no AI concept required.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8724B] hover:underline"
              >
                I have plans — book a consultation <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
