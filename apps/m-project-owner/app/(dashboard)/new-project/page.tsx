'use client'

import React, { useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface ProjectType {
  id: string
  label: string
  category: string
}

type QualityTier = 'budget' | 'standard' | 'premium'

interface FormData {
  description: string
  projectType: string
  squareFootage: string
  address: string
  qualityTier: QualityTier
  photoDescriptions: string
}

interface AssemblyItem {
  name: string
  category: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
}

interface ClarifyingQuestion {
  id: string
  question: string
  answer: string
}

interface AnalysisResult {
  summary: string
  estimatedTotal: number
  lowRange: number
  highRange: number
  confidence: number
  assemblies: AssemblyItem[]
  assumptions: string[]
  clarifyingQuestions: ClarifyingQuestion[]
  estimatedTimeline: string
  requiredTrades: string[]
  suggestedProjectName: string
}

interface CreateProjectData {
  projectName: string
  address: string
  estimatedTotal: number
  lowRange: number
  highRange: number
  analysisId?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

const QUALITY_TIERS: { value: QualityTier; label: string; description: string; icon: string }[] = [
  {
    value: 'budget',
    label: 'Budget',
    description: 'Cost-effective materials, standard finishes, functional design',
    icon: '$',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Mid-range materials, quality finishes, popular brands',
    icon: '$$',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'High-end materials, custom finishes, designer selections',
    icon: '$$$',
  },
]

const LOADING_STEPS = [
  { label: 'Analyzing scope...', duration: 2000 },
  { label: 'Calculating costs...', duration: 2500 },
  { label: 'Preparing estimate...', duration: 1500 },
]

const FALLBACK_PROJECT_TYPES: ProjectType[] = [
  { id: 'kitchen-remodel', label: 'Kitchen Remodel', category: 'Interior' },
  { id: 'bathroom-remodel', label: 'Bathroom Remodel', category: 'Interior' },
  { id: 'basement-finish', label: 'Basement Finishing', category: 'Interior' },
  { id: 'home-addition', label: 'Home Addition', category: 'Structural' },
  { id: 'roof-replacement', label: 'Roof Replacement', category: 'Exterior' },
  { id: 'deck-patio', label: 'Deck / Patio', category: 'Exterior' },
  { id: 'whole-house', label: 'Whole House Renovation', category: 'Full' },
  { id: 'siding', label: 'Siding Replacement', category: 'Exterior' },
  { id: 'flooring', label: 'Flooring Installation', category: 'Interior' },
  { id: 'painting', label: 'Interior/Exterior Painting', category: 'Finish' },
  { id: 'hvac', label: 'HVAC System', category: 'Mechanical' },
  { id: 'plumbing', label: 'Plumbing Overhaul', category: 'Mechanical' },
  { id: 'electrical', label: 'Electrical Upgrade', category: 'Mechanical' },
  { id: 'landscaping', label: 'Landscaping', category: 'Exterior' },
  { id: 'other', label: 'Other', category: 'General' },
]

const INITIAL_FORM: FormData = {
  description: '',
  projectType: '',
  squareFootage: '',
  address: '',
  qualityTier: 'standard',
  photoDescriptions: '',
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDollars(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function confidenceLabel(confidence: number): { text: string; color: string; bg: string } {
  if (confidence >= 80) return { text: 'High Confidence', color: 'text-green-700', bg: 'bg-green-100' }
  if (confidence >= 60) return { text: 'Medium Confidence', color: 'text-yellow-700', bg: 'bg-yellow-100' }
  return { text: 'Low Confidence', color: 'text-orange-700', bg: 'bg-orange-100' }
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: 'Describe' },
    { number: 2, label: 'Analyze' },
    { number: 3, label: 'Review' },
    { number: 4, label: 'Create' },
  ]

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300
                ${
                  currentStep === step.number
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : currentStep > step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {currentStep > step.number ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`
                mt-1.5 text-xs font-medium
                ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'}
              `}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`
                w-16 md:w-24 h-0.5 mb-5 mx-2
                transition-all duration-500
                ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ============================================================================
// STEP 1: DESCRIBE YOUR PROJECT
// ============================================================================

function StepDescribe({
  form,
  setForm,
  projectTypes,
  onSubmit,
  isLoading,
}: {
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  projectTypes: ProjectType[]
  onSubmit: () => void
  isLoading: boolean
}) {
  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isValid =
    form.description.trim().length >= 20 &&
    form.projectType !== '' &&
    form.address.trim().length > 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Describe Your Project</h2>
        <p className="text-sm text-gray-500 mb-6">
          Provide details about your project and our AI will analyze the scope, estimate costs, and
          identify the trades you need.
        </p>

        {/* Project Description */}
        <div className="mb-5">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900
              placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              focus:outline-none transition-all resize-none"
            placeholder="Describe your project in detail. For example: I want to remodel my kitchen with new cabinets, quartz countertops, a tile backsplash, new flooring, and updated lighting. The kitchen is about 200 sq ft with an L-shaped layout..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            {form.description.length < 20
              ? `Minimum 20 characters (${form.description.length}/20)`
              : 'The more detail you provide, the more accurate the estimate'}
          </p>
        </div>

        {/* Project Type & Square Footage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Type <span className="text-red-500">*</span>
            </label>
            <select
              id="projectType"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900
                bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                focus:outline-none transition-all"
              value={form.projectType}
              onChange={(e) => updateField('projectType', e.target.value)}
            >
              <option value="">Select a project type</option>
              {projectTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sqft" className="block text-sm font-medium text-gray-700 mb-1.5">
              Square Footage
            </label>
            <input
              id="sqft"
              type="number"
              min={0}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900
                placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                focus:outline-none transition-all"
              placeholder="e.g. 1200"
              value={form.squareFootage}
              onChange={(e) => updateField('squareFootage', e.target.value)}
            />
          </div>
        </div>

        {/* Address */}
        <div className="mb-5">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
            Project Address <span className="text-red-500">*</span>
          </label>
          <input
            id="address"
            type="text"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900
              placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              focus:outline-none transition-all"
            placeholder="123 Main St, Baltimore, MD 21201"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
          />
        </div>

        {/* Quality Tier */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">Quality Tier</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUALITY_TIERS.map((tier) => (
              <button
                key={tier.value}
                type="button"
                onClick={() => updateField('qualityTier', tier.value)}
                className={`
                  border-2 rounded-xl p-4 text-left transition-all cursor-pointer
                  ${
                    form.qualityTier === tier.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{tier.label}</span>
                  <span
                    className={`text-xs font-bold ${
                      form.qualityTier === tier.value ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {tier.icon}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{tier.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Descriptions */}
        <div className="mb-6">
          <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-1.5">
            Photo Descriptions <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="photos"
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900
              placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              focus:outline-none transition-all resize-none"
            placeholder="Describe any photos you would share: current condition, reference images, measurements visible in photos..."
            value={form.photoDescriptions}
            onChange={(e) => updateField('photoDescriptions', e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isLoading}
          className={`
            w-full rounded-xl px-6 py-3 font-medium text-white transition-all
            ${
              isValid && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? 'Starting Analysis...' : 'Analyze My Project'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 2: AI ANALYSIS LOADING
// ============================================================================

function StepAnalyzing() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    let cumulativeDelay = 0
    const timers: ReturnType<typeof setTimeout>[] = []

    LOADING_STEPS.forEach((step, index) => {
      const activateTimer = setTimeout(() => {
        setActiveStep(index)
      }, cumulativeDelay)
      timers.push(activateTimer)

      cumulativeDelay += step.duration

      const completeTimer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, index])
      }, cumulativeDelay)
      timers.push(completeTimer)
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex items-center justify-center py-16">
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        {/* Spinner */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-6">AI is analyzing your project</h2>

        <div className="space-y-4 text-left">
          {LOADING_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(index)
            const isActive = activeStep === index && !isCompleted

            return (
              <div key={index} className="flex items-center gap-3">
                {/* Status icon */}
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                    transition-all duration-500
                    ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isActive
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-sm font-medium transition-colors duration-300
                    ${
                      isCompleted
                        ? 'text-green-700'
                        : isActive
                          ? 'text-blue-700'
                          : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 3: REVIEW ESTIMATE
// ============================================================================

function StepReview({
  result,
  onRefine,
  onCreateProject,
  isRefining,
  clarifyingAnswers,
  setClarifyingAnswers,
  editingAssumptions,
  setEditingAssumptions,
}: {
  result: AnalysisResult
  onRefine: () => void
  onCreateProject: () => void
  isRefining: boolean
  clarifyingAnswers: Record<string, string>
  setClarifyingAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
  editingAssumptions: Record<number, string>
  setEditingAssumptions: React.Dispatch<React.SetStateAction<Record<number, string>>>
}) {
  const [showAllAssemblies, setShowAllAssemblies] = useState(false)
  const [editingAssumptionIndex, setEditingAssumptionIndex] = useState<number | null>(null)

  const conf = confidenceLabel(result.confidence)
  const displayedAssemblies = showAllAssemblies ? result.assemblies : result.assemblies.slice(0, 5)

  const hasAnsweredQuestions = result.clarifyingQuestions.some(
    (q) => clarifyingAnswers[q.id]?.trim()
  )
  const hasEditedAssumptions = Object.keys(editingAssumptions).length > 0

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Estimate Summary</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
      </div>

      {/* Price Card */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 text-center">
        <p className="text-sm font-medium text-gray-500 mb-1">Estimated Total</p>
        <p className="text-4xl font-bold text-blue-600 mb-2">
          {formatDollars(result.estimatedTotal)}
        </p>
        <p className="text-sm text-gray-500">
          Range: {formatDollars(result.lowRange)} &ndash; {formatDollars(result.highRange)}
        </p>

        {/* Confidence */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${conf.bg} ${conf.color}`}>
            {conf.text} ({result.confidence}%)
          </span>
        </div>

        {/* Confidence Bar */}
        <div className="mt-3 mx-auto max-w-xs">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                result.confidence >= 80
                  ? 'bg-green-500'
                  : result.confidence >= 60
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
              }`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assembly Breakdown */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Assembly Breakdown</h3>
          <span className="text-xs text-gray-400">{result.assemblies.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assembly
                </th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="text-right py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="text-right py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Unit Cost
                </th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedAssemblies.map((item, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 pr-4 text-gray-900 font-medium">{item.name}</td>
                  <td className="py-2.5 pr-4 text-gray-500 hidden md:table-cell">{item.category}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-gray-500 hidden sm:table-cell">
                    {formatDollars(item.unitCost)}
                  </td>
                  <td className="py-2.5 text-right text-gray-900 font-medium">
                    {formatDollars(item.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.assemblies.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllAssemblies(!showAllAssemblies)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            {showAllAssemblies
              ? 'Show less'
              : `Show all ${result.assemblies.length} assemblies`}
          </button>
        )}
      </div>

      {/* Assumptions */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Assumptions</h3>
        <p className="text-xs text-gray-400 mb-4">
          Click an assumption to edit it. Changes will be used when you refine the estimate.
        </p>
        <ul className="space-y-2">
          {result.assumptions.map((assumption, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              {editingAssumptionIndex === index ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm
                      text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={editingAssumptions[index] ?? assumption}
                    onChange={(e) =>
                      setEditingAssumptions((prev) => ({ ...prev, [index]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingAssumptionIndex(null)
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setEditingAssumptionIndex(null)}
                    className="text-xs text-blue-600 font-medium hover:text-blue-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingAssumptionIndex(index)}
                  className="text-sm text-gray-600 text-left hover:text-gray-900 cursor-pointer transition-colors"
                >
                  {editingAssumptions[index] ?? assumption}
                  {editingAssumptions[index] !== undefined && (
                    <span className="ml-2 text-xs text-blue-500">(edited)</span>
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Clarifying Questions */}
      {result.clarifyingQuestions.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Clarifying Questions</h3>
          <p className="text-xs text-gray-400 mb-4">
            Answer these to improve the estimate accuracy.
          </p>
          <div className="space-y-4">
            {result.clarifyingQuestions.map((q) => (
              <div key={q.id}>
                <label htmlFor={`cq-${q.id}`} className="block text-sm font-medium text-gray-700 mb-1.5">
                  {q.question}
                </label>
                <input
                  id={`cq-${q.id}`}
                  type="text"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900
                    placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    focus:outline-none transition-all"
                  placeholder="Type your answer..."
                  value={clarifyingAnswers[q.id] || ''}
                  onChange={(e) =>
                    setClarifyingAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refine Button */}
      {(hasAnsweredQuestions || hasEditedAssumptions) && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-blue-700">
            You have provided additional information. Refine the estimate to improve accuracy.
          </p>
          <button
            type="button"
            onClick={onRefine}
            disabled={isRefining}
            className={`
              rounded-xl px-6 py-2.5 font-medium text-sm transition-all flex-shrink-0
              ${
                isRefining
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              }
            `}
          >
            {isRefining ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Refining...
              </span>
            ) : (
              'Refine Estimate'
            )}
          </button>
        </div>
      )}

      {/* Timeline & Trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Estimated Timeline</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">{result.estimatedTimeline}</span>
          </div>
        </div>

        {/* Required Trades */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Trades</h3>
          <div className="flex flex-wrap gap-2">
            {result.requiredTrades.map((trade, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
              >
                {trade}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Create Project Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onCreateProject}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 py-3 font-medium
            transition-all cursor-pointer text-base"
        >
          Create Project with this Estimate
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 4: CREATE PROJECT
// ============================================================================

function StepCreate({
  result,
  address,
  onSubmit,
  isSubmitting,
}: {
  result: AnalysisResult
  address: string
  onSubmit: (data: CreateProjectData) => void
  isSubmitting: boolean
}) {
  const [projectName, setProjectName] = useState(result.suggestedProjectName || '')
  const [confirmedAddress, setConfirmedAddress] = useState(address)

  const isValid = projectName.trim().length > 0 && confirmedAddress.trim().length > 0

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit({
      projectName: projectName.trim(),
      address: confirmedAddress.trim(),
      estimatedTotal: result.estimatedTotal,
      lowRange: result.lowRange,
      highRange: result.highRange,
    })
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Create Your Project</h2>
        <p className="text-sm text-gray-500 mb-6">
          Confirm the details below to create your project. Contractors will be able to bid once it
          is published.
        </p>

        {/* Project Name */}
        <div className="mb-5">
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900
              placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              focus:outline-none transition-all"
            placeholder="My Kitchen Remodel"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          {result.suggestedProjectName && projectName === result.suggestedProjectName && (
            <p className="mt-1 text-xs text-gray-400">Auto-suggested from AI analysis</p>
          )}
        </div>

        {/* Address */}
        <div className="mb-5">
          <label htmlFor="confirmAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
            Project Address
          </label>
          <input
            id="confirmAddress"
            type="text"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900
              placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              focus:outline-none transition-all"
            value={confirmedAddress}
            onChange={(e) => setConfirmedAddress(e.target.value)}
          />
        </div>

        {/* Final Numbers Review */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Estimate Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Low</p>
              <p className="text-sm font-semibold text-gray-700">{formatDollars(result.lowRange)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Estimated</p>
              <p className="text-lg font-bold text-blue-600">{formatDollars(result.estimatedTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">High</p>
              <p className="text-sm font-semibold text-gray-700">{formatDollars(result.highRange)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Timeline</p>
              <p className="text-sm font-medium text-gray-700">{result.estimatedTimeline}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Trades Needed</p>
              <p className="text-sm font-medium text-gray-700">{result.requiredTrades.length}</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`
            w-full rounded-xl px-6 py-3 font-medium text-white transition-all text-base
            ${
              isValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Project...
            </span>
          ) : (
            'Create Project'
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// SUCCESS VIEW
// ============================================================================

function ProjectCreatedSuccess({ projectName }: { projectName: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        {/* Checkmark */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Created!</h2>
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-medium text-gray-700">{projectName}</span> has been created with
          your AI estimate attached. Contractors can now view and bid on your project.
        </p>

        <div className="space-y-3">
          <a
            href="/project"
            className="block w-full bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 py-3
              font-medium transition-all text-center"
          >
            View My Projects
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="block w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50
              rounded-xl px-6 py-3 font-medium transition-all cursor-pointer"
          >
            Create Another Project
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR DISPLAY
// ============================================================================

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 mb-6">
      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewProjectPage() {
  // Step management: 1=describe, 2=analyzing, 3=review, 4=create, 5=success
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<string, string>>({})
  const [editingAssumptions, setEditingAssumptions] = useState<Record<number, string>>({})
  const [createdProjectName, setCreatedProjectName] = useState('')

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Error
  const [error, setError] = useState<string | null>(null)

  // ----------------------------------------
  // Fetch project types on mount
  // ----------------------------------------
  useEffect(() => {
    async function loadProjectTypes() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/scope-analysis/project-types`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          const types: ProjectType[] = Array.isArray(data)
            ? data
            : Array.isArray(data.projectTypes)
              ? data.projectTypes
              : []
          setProjectTypes(types)
        } else {
          setProjectTypes(FALLBACK_PROJECT_TYPES)
        }
      } catch {
        setProjectTypes(FALLBACK_PROJECT_TYPES)
      }
    }

    loadProjectTypes()
  }, [])

  // ----------------------------------------
  // Analyze project (Step 1 -> Step 2 -> Step 3)
  // ----------------------------------------
  const handleAnalyze = useCallback(async () => {
    setError(null)
    setIsAnalyzing(true)
    setCurrentStep(2)

    try {
      const payload = {
        description: form.description,
        projectType: form.projectType,
        squareFootage: form.squareFootage ? Number(form.squareFootage) : undefined,
        address: form.address,
        qualityTier: form.qualityTier,
        photoDescriptions: form.photoDescriptions || undefined,
      }

      const res = await fetch(`${API_BASE}/api/v1/scope-analysis/analyze-detailed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `Analysis failed (${res.status})`)
      }

      const data = await res.json()

      // Normalize response into our AnalysisResult shape
      const result: AnalysisResult = {
        summary: data.summary || data.analysis?.summary || 'Project analysis complete.',
        estimatedTotal:
          data.estimatedTotal ?? data.estimate?.total ?? data.analysis?.estimatedTotal ?? 0,
        lowRange: data.lowRange ?? data.estimate?.lowRange ?? data.analysis?.lowRange ?? 0,
        highRange: data.highRange ?? data.estimate?.highRange ?? data.analysis?.highRange ?? 0,
        confidence: data.confidence ?? data.estimate?.confidence ?? data.analysis?.confidence ?? 70,
        assemblies: (data.assemblies ?? data.estimate?.assemblies ?? data.analysis?.assemblies ?? []).map(
          (a: Record<string, unknown>) => ({
            name: a.name || a.assemblyName || 'Item',
            category: a.category || a.division || 'General',
            quantity: Number(a.quantity) || 1,
            unit: a.unit || a.uom || 'EA',
            unitCost: Number(a.unitCost) || 0,
            totalCost: Number(a.totalCost) || Number(a.total) || 0,
          })
        ),
        assumptions: data.assumptions ?? data.analysis?.assumptions ?? [],
        clarifyingQuestions: (
          data.clarifyingQuestions ??
          data.analysis?.clarifyingQuestions ??
          []
        ).map((q: Record<string, unknown>, idx: number) => ({
          id: String(q.id || `q-${idx}`),
          question: String(q.question || q.text || ''),
          answer: '',
        })),
        estimatedTimeline:
          data.estimatedTimeline ??
          data.analysis?.estimatedTimeline ??
          data.timeline ??
          'To be determined',
        requiredTrades: data.requiredTrades ?? data.analysis?.requiredTrades ?? data.trades ?? [],
        suggestedProjectName:
          data.suggestedProjectName ??
          data.analysis?.suggestedProjectName ??
          data.projectName ??
          '',
      }

      // Small delay so the loading animation can finish
      await new Promise((resolve) => setTimeout(resolve, 6500))

      setAnalysisResult(result)
      setClarifyingAnswers({})
      setEditingAssumptions({})
      setCurrentStep(3)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      setCurrentStep(1)
    } finally {
      setIsAnalyzing(false)
    }
  }, [form])

  // ----------------------------------------
  // Refine estimate (Step 3, stays on Step 3)
  // ----------------------------------------
  const handleRefine = useCallback(async () => {
    if (!analysisResult) return
    setError(null)
    setIsRefining(true)

    try {
      // Build updated assumptions array
      const updatedAssumptions = analysisResult.assumptions.map(
        (a, i) => editingAssumptions[i] ?? a
      )

      // Build answered questions
      const answers = analysisResult.clarifyingQuestions
        .filter((q) => clarifyingAnswers[q.id]?.trim())
        .map((q) => ({ questionId: q.id, question: q.question, answer: clarifyingAnswers[q.id] }))

      const payload = {
        description: form.description,
        projectType: form.projectType,
        squareFootage: form.squareFootage ? Number(form.squareFootage) : undefined,
        address: form.address,
        qualityTier: form.qualityTier,
        assumptions: updatedAssumptions,
        clarifyingAnswers: answers,
        previousEstimate: {
          total: analysisResult.estimatedTotal,
          lowRange: analysisResult.lowRange,
          highRange: analysisResult.highRange,
        },
      }

      const res = await fetch(`${API_BASE}/api/v1/scope-analysis/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `Refinement failed (${res.status})`)
      }

      const data = await res.json()

      // Merge refined data back into the result
      setAnalysisResult((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          summary: data.summary ?? prev.summary,
          estimatedTotal: data.estimatedTotal ?? data.estimate?.total ?? prev.estimatedTotal,
          lowRange: data.lowRange ?? data.estimate?.lowRange ?? prev.lowRange,
          highRange: data.highRange ?? data.estimate?.highRange ?? prev.highRange,
          confidence: data.confidence ?? data.estimate?.confidence ?? prev.confidence,
          assemblies: data.assemblies
            ? data.assemblies.map((a: Record<string, unknown>) => ({
                name: a.name || a.assemblyName || 'Item',
                category: a.category || a.division || 'General',
                quantity: Number(a.quantity) || 1,
                unit: a.unit || a.uom || 'EA',
                unitCost: Number(a.unitCost) || 0,
                totalCost: Number(a.totalCost) || Number(a.total) || 0,
              }))
            : prev.assemblies,
          assumptions: data.assumptions ?? prev.assumptions,
          clarifyingQuestions: data.clarifyingQuestions
            ? data.clarifyingQuestions.map((q: Record<string, unknown>, idx: number) => ({
                id: String(q.id || `q-${idx}`),
                question: String(q.question || q.text || ''),
                answer: '',
              }))
            : prev.clarifyingQuestions,
          estimatedTimeline: data.estimatedTimeline ?? prev.estimatedTimeline,
          requiredTrades: data.requiredTrades ?? prev.requiredTrades,
          suggestedProjectName: data.suggestedProjectName ?? prev.suggestedProjectName,
        }
      })

      // Reset edits after successful refinement
      setEditingAssumptions({})
      setClarifyingAnswers({})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refine estimate'
      setError(message)
    } finally {
      setIsRefining(false)
    }
  }, [analysisResult, form, editingAssumptions, clarifyingAnswers])

  // ----------------------------------------
  // Move to Step 4 (Create Project form)
  // ----------------------------------------
  const handleGoToCreate = useCallback(() => {
    setError(null)
    setCurrentStep(4)
  }, [])

  // ----------------------------------------
  // Create project (Step 4 -> Success)
  // ----------------------------------------
  const handleCreateProject = useCallback(
    async (data: CreateProjectData) => {
      setError(null)
      setIsCreating(true)

      try {
        const payload = {
          name: data.projectName,
          address: data.address,
          projectType: form.projectType,
          qualityTier: form.qualityTier,
          description: form.description,
          squareFootage: form.squareFootage ? Number(form.squareFootage) : undefined,
          estimate: {
            total: data.estimatedTotal,
            lowRange: data.lowRange,
            highRange: data.highRange,
            confidence: analysisResult?.confidence,
            assemblies: analysisResult?.assemblies,
            assumptions: analysisResult?.assumptions,
            timeline: analysisResult?.estimatedTimeline,
            trades: analysisResult?.requiredTrades,
          },
        }

        // Attempt to create via the scope-analysis endpoint first, then fall back
        // to a generic project creation endpoint
        let res = await fetch(`${API_BASE}/api/v1/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          // Try alternative endpoint
          res = await fetch(`${API_BASE}/api/v1/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          })
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || `Failed to create project (${res.status})`)
        }

        setCreatedProjectName(data.projectName)
        setCurrentStep(5)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create project'
        setError(message)
      } finally {
        setIsCreating(false)
      }
    },
    [form, analysisResult]
  )

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Smart Estimate</h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe your project and get an AI-powered cost estimate instantly
          </p>
        </div>

        {/* Step Indicator - hide on success */}
        {currentStep <= 4 && (
          <StepIndicator currentStep={Math.min(currentStep, 4)} />
        )}

        {/* Error Banner */}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Step Content */}
        {currentStep === 1 && (
          <StepDescribe
            form={form}
            setForm={setForm}
            projectTypes={projectTypes}
            onSubmit={handleAnalyze}
            isLoading={isAnalyzing}
          />
        )}

        {currentStep === 2 && <StepAnalyzing />}

        {currentStep === 3 && analysisResult && (
          <StepReview
            result={analysisResult}
            onRefine={handleRefine}
            onCreateProject={handleGoToCreate}
            isRefining={isRefining}
            clarifyingAnswers={clarifyingAnswers}
            setClarifyingAnswers={setClarifyingAnswers}
            editingAssumptions={editingAssumptions}
            setEditingAssumptions={setEditingAssumptions}
          />
        )}

        {currentStep === 4 && analysisResult && (
          <StepCreate
            result={analysisResult}
            address={form.address}
            onSubmit={handleCreateProject}
            isSubmitting={isCreating}
          />
        )}

        {currentStep === 5 && <ProjectCreatedSuccess projectName={createdProjectName} />}

        {/* Back navigation for steps 3 and 4 */}
        {(currentStep === 3 || currentStep === 4) && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep === 4 ? 3 : 1)}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              {currentStep === 4 ? 'Back to Review' : 'Start Over'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
