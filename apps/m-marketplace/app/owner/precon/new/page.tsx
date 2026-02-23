'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Zap, ChevronDown, ChevronUp, CheckCircle2, Bot, ArrowRight } from 'lucide-react'
import { quickStartProject } from '../../../lib/claws'

/**
 * 1-CLICK PRE-CON PROJECT CREATION
 *
 * Philosophy: Owner clicks one button, CLAWs handle everything behind the scenes.
 *
 * Flow:
 *   1. Owner picks category + gives brief description (single page)
 *   2. Clicks "Start My Project" (1-click)
 *   3. Behind the scenes:
 *      - Claw A: Creates project + initial scope estimate
 *      - Claw F: Sends welcome email + creates project channel
 *      - Claw H: Logs activity + sets up automation rules
 *      - Claw G: Runs initial risk assessment
 *      - Auto Design session starts immediately
 *
 * Package defaults to Standard ($499) — can be changed in optional section.
 * Location/sq ft/complexity are in collapsible "optional details" section.
 */

const CATEGORIES = [
  { value: 'KITCHEN', label: 'Kitchen Remodel', icon: '🍳' },
  { value: 'BATHROOM', label: 'Bathroom Remodel', icon: '🚿' },
  { value: 'ADDITION', label: 'Room Addition', icon: '🏠' },
  { value: 'NEW_CONSTRUCTION', label: 'New Construction', icon: '🏗️' },
  { value: 'RENOVATION', label: 'Whole Home Renovation', icon: '🔨' },
  { value: 'EXTERIOR', label: 'Exterior Work', icon: '🏡' },
  { value: 'OTHER', label: 'Other', icon: '📋' },
]

const PACKAGES = [
  { tier: 'STARTER' as const, name: 'Starter', price: 199, desc: 'AI concepts + 5 revisions' },
  { tier: 'STANDARD' as const, name: 'Standard', price: 499, desc: 'AI concepts + 5 revisions + 3D renders', popular: true },
  { tier: 'PREMIUM' as const, name: 'Premium', price: 999, desc: 'Full AI package + permit-ready docs', },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

export default function NewPreConPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [clawsActive, setClawsActive] = useState(false)
  const [activationStep, setActivationStep] = useState(0)

  // Minimal required fields — everything else is optional with smart defaults
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tier, setTier] = useState<'STARTER' | 'STANDARD' | 'PREMIUM'>('STANDARD')

  // Optional details (collapsible)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [address, setAddress] = useState('')
  const [squareFootage, setSquareFootage] = useState('')
  const [complexity, setComplexity] = useState('STANDARD')

  const canSubmit = category !== '' && name.length >= 3 && description.length >= 10

  const selectedPackage = PACKAGES.find((p) => p.tier === tier) || PACKAGES[1]

  // CLAW activation animation steps
  const CLAW_STEPS = [
    { label: 'Activating Claw A: Acquisition & Pre-Con', icon: '🔍' },
    { label: 'Activating Claw F: Docs & Communication', icon: '📄' },
    { label: 'Activating Claw H: Command Center', icon: '🎯' },
    { label: 'Activating Claw G: Risk & Predictions', icon: '🧠' },
    { label: 'Starting AI Auto Design...', icon: '✨' },
  ]

  useEffect(() => {
    if (clawsActive && activationStep < CLAW_STEPS.length) {
      const timer = setTimeout(() => {
        setActivationStep((s) => s + 1)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [clawsActive, activationStep])

  const handleQuickStart = async () => {
    if (!canSubmit) return
    setLoading(true)
    setClawsActive(true)
    setActivationStep(0)
    setError(null)

    try {
      const result = await quickStartProject({
        name,
        category,
        description,
        designPackageTier: tier,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        address: address || undefined,
        squareFootage: squareFootage ? parseInt(squareFootage) : undefined,
        complexity: complexity || undefined,
      })

      // Wait for all activation steps to show
      await new Promise((resolve) => setTimeout(resolve, CLAW_STEPS.length * 600 + 500))

      // Redirect to the new project
      router.push(`/owner/precon/${result.preconId || result.projectId}?created=true&claws=active`)
    } catch (err: any) {
      // If CLAW gateway is unavailable, fall back to regular API
      console.warn('CLAW gateway unavailable, falling back to standard API:', err.message)

      try {
        // Fallback — direct API call
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const res = await fetch(`${API_URL}/owner/precon/owner/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            description,
            designPackageTier: tier,
            city, state, zipCode, address,
            squareFootage: squareFootage ? parseInt(squareFootage) : undefined,
            complexity,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          router.push(`/owner/precon/${data.id || data.precon?.id}?created=true`)
          return
        }
      } catch {
        // Both paths failed
      }

      setError(err.message || 'Failed to create project. Please try again.')
      setClawsActive(false)
      setActivationStep(0)
    } finally {
      setLoading(false)
    }
  }

  // ── CLAW Activation Overlay ──────────────────────────────────
  if (clawsActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/20 mb-4">
              <Bot className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">CLAWs Activating</h2>
            <p className="text-indigo-300 text-sm">
              Your project is being set up by our AI agent system
            </p>
          </div>

          <div className="space-y-3 text-left">
            {CLAW_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 ${
                  i < activationStep
                    ? 'bg-green-500/20 border border-green-500/30'
                    : i === activationStep
                    ? 'bg-indigo-500/20 border border-indigo-500/30 animate-pulse'
                    : 'bg-white/5 border border-white/10 opacity-40'
                }`}
              >
                <span className="text-xl">{step.icon}</span>
                <span className={`text-sm font-medium ${i < activationStep ? 'text-green-400' : i === activationStep ? 'text-indigo-300' : 'text-gray-500'}`}>
                  {step.label}
                </span>
                {i < activationStep && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
              </div>
            ))}
          </div>

          <p className="text-xs text-indigo-400/60 mt-8">
            All 8 CLAWs are monitoring your project from this moment forward.
          </p>
        </div>
      </div>
    )
  }

  // ── Main Form (1-click model) ────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/owner/precon" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">New Pre-Con Project</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
              <Bot size={14} />
              CLAWs Ready
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Category Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">What type of project?</h2>
          <p className="text-sm text-gray-500 mb-4">Select one to get started.</p>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  category === cat.value
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <p className="text-xs font-medium text-gray-700 leading-tight">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Project Name + Description (inline) */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Modern Kitchen Renovation"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brief Description * <span className="text-gray-400 font-normal">(10+ chars)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your vision — goals, style, must-haves..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Package Selection (inline compact) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Concept Package</label>
          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.tier}
                onClick={() => setTier(pkg.tier)}
                className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                  tier === pkg.tier
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                    POPULAR
                  </span>
                )}
                <p className="font-semibold text-gray-900">{pkg.name}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(pkg.price)}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight">{pkg.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 size={12} />
            Concept fee credited when you upgrade to Architecture phase
          </p>
        </div>

        {/* Optional Details (collapsed by default) */}
        <div className="mb-8">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showDetails ? 'Hide' : 'Add'} optional details (location, size, complexity)
          </button>

          {showDetails && (
            <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Washington"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="DC"
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="20001"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Square Footage</label>
                  <input
                    type="number"
                    value={squareFootage}
                    onChange={(e) => setSquareFootage(e.target.value)}
                    placeholder="e.g., 200"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Complexity</label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="BASIC">Basic</option>
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="LUXURY">Luxury</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 1-CLICK CTA */}
        <div className="sticky bottom-0 bg-gray-50 pb-6 pt-2">
          <button
            onClick={handleQuickStart}
            disabled={!canSubmit || loading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
              canSubmit && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Activating CLAWs...
              </span>
            ) : (
              <>
                <Zap size={20} />
                Start My Project — {formatCurrency(selectedPackage.price)}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* What happens next */}
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              What happens when you click
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <span>AI generates design concepts instantly</span>
              </div>
              <div className="flex items-start gap-2">
                <Bot size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <span>8 CLAW agents begin managing your project</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                <span>5 revision rounds included, then pick from 3 finals</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                <span>Concept fee credited to architecture phase</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
