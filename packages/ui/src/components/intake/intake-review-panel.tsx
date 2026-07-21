'use client'

import { ArrowLeft, CheckCircle } from 'lucide-react'

interface IntakeReviewPanelProps {
  formData: Record<string, unknown>
  projectPath: string
  onBack: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  /** When true, suppresses the primary Submit button (agent CTA shown instead) */
  hidePrimaryButton?: boolean
}

function ReviewRow({ label, value }: { label: string; value: unknown }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  const display = Array.isArray(value) ? (value as string[]).join(', ') : String(value)
  return (
    <div className="flex gap-4 border-b border-gray-100 py-3 last:border-0">
      <span className="w-40 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{display}</span>
    </div>
  )
}

const PATH_LABELS: Record<string, string> = {
  exterior_concept: 'Exterior Concept',
  interior_renovation: 'Interior Renovation',
  whole_home_remodel: 'Whole-Home Remodel',
  addition_expansion: 'Addition / Expansion',
  design_build: 'Design + Build',
  permit_path_only: 'Permit Path',
}

export function IntakeReviewPanel({
  formData,
  projectPath,
  onBack,
  onSubmit,
  isSubmitting,
  hidePrimaryButton = false,
}: IntakeReviewPanelProps) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="h-6 w-6 text-green-500" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
          Review Your Intake
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Confirm these details before submitting your project intake.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          Project Type
        </h3>
        <p className="mb-5 text-sm font-semibold" style={{ color: '#1A2B4A' }}>
          {PATH_LABELS[projectPath] ?? projectPath}
        </p>

        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          Contact
        </h3>
        <div className="mb-5">
          <ReviewRow label="Name" value={formData.clientName} />
          <ReviewRow label="Email" value={formData.contactEmail} />
          <ReviewRow label="Phone" value={formData.contactPhone} />
          <ReviewRow label="Project Address" value={formData.projectAddress} />
        </div>

        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          Project Details
        </h3>
        <div className="mb-5">
          <ReviewRow label="Budget" value={formData.budgetRange} />
          <ReviewRow label="Timeline" value={formData.timelineGoal} />
          <ReviewRow label="Style Preferences" value={formData.stylePreferences} />
          <ReviewRow label="Design Style" value={formData.designStyle} />
          <ReviewRow label="Goals / Priorities" value={formData.goals ?? formData.priorities ?? formData.renovationGoals} />
          <ReviewRow label="Constraints" value={formData.knownConstraints ?? formData.neighborhoodConstraints} />
          <ReviewRow label="Room Scope" value={formData.roomScope} />
          <ReviewRow label="Remodeling Scope" value={formData.remodelingScope} />
          <ReviewRow label="Addition Type" value={formData.additionType} />
          <ReviewRow label="Permit Type" value={formData.permitType} />
          <ReviewRow label="Jurisdiction" value={formData.permitJurisdiction} />
          <ReviewRow label="Project Description" value={formData.projectDescription} />
        </div>

        {Array.isArray(formData.uploadedPhotos) && (formData.uploadedPhotos as string[]).length > 0 && (
          <>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              Files
            </h3>
            <p className="text-sm text-gray-600">
              {(formData.uploadedPhotos as string[]).length} file(s) attached
            </p>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Edit
        </button>

        {!hidePrimaryButton && (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#E8793A' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Intake'}
          </button>
        )}
      </div>
    </div>
  )
}
