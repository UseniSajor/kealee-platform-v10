'use client'

import { useState, useEffect } from 'react'
import type { ProjectPath } from '@kealee/intake'
import { FORM_FIELDS_BY_PATH } from '@kealee/intake'
import type { IntakeFormStep, IntakeField } from '@kealee/intake'
import { ChevronRight, ChevronLeft, Paperclip, X } from 'lucide-react'

interface DynamicIntakeFormProps {
  projectPath: ProjectPath
  initialData?: Record<string, unknown>
  onComplete: (data: Record<string, unknown>) => void
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: IntakeField
  value: unknown
  onChange: (key: string, val: unknown) => void
}) {
  const base = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1A2B4A] focus:outline-none focus:ring-1 focus:ring-[#1A2B4A]'

  if (field.type === 'select') {
    return (
      <select
        className={base}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.key, e.target.value)}
      >
        <option value="">Select...</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'radio') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {field.options?.map((o) => (
          <label
            key={o.value}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm transition-colors ${
              value === o.value
                ? 'border-[#E8793A] bg-orange-50 font-medium'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={field.key}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(field.key, o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {field.options?.map((o) => {
          const checked = selected.includes(o.value)
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm transition-colors ${
                checked ? 'border-[#E8793A] bg-orange-50 font-medium' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(field.key, checked ? selected.filter((s) => s !== o.value) : [...selected, o.value])
                }
                className="sr-only"
              />
              {o.label}
            </label>
          )
        })}
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        className={`${base} resize-none`}
        rows={field.rows ?? 3}
        placeholder={field.placeholder}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    )
  }

  if (field.type === 'file') {
    const files = Array.isArray(value) ? (value as string[]) : []
    return (
      <div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-[#E8793A] hover:text-[#E8793A]">
          <input
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            className="sr-only"
            onChange={(e) => {
              const names = Array.from(e.target.files ?? []).map((f) => f.name)
              onChange(field.key, [...files, ...names])
            }}
          />
          <Paperclip className="h-5 w-5" />
          <span>Click to attach photos, videos, or PDFs</span>
          <span className="text-xs text-gray-400">Exterior, interior, existing conditions, inspiration</span>
        </label>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((name, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                <span className="truncate">{name}</span>
                <button
                  type="button"
                  onClick={() => onChange(field.key, files.filter((_, idx) => idx !== i))}
                  className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex gap-3">
        {['Yes', 'No'].map((label) => {
          const boolVal = label === 'Yes'
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(field.key, boolVal)}
              className={`rounded-xl border px-6 py-2.5 text-sm font-medium transition-colors ${
                value === boolVal
                  ? 'border-[#E8793A] bg-orange-50 text-[#E8793A]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <input
      type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'numeric' ? 'number' : 'text'}
      className={base}
      placeholder={field.placeholder}
      value={String(value ?? '')}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  )
}

export function DynamicIntakeForm({ projectPath, initialData, onComplete }: DynamicIntakeFormProps) {
  const steps: IntakeFormStep[] = FORM_FIELDS_BY_PATH[projectPath] ?? []
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, unknown>>(
    () => ({
      projectPath,
      ...(initialData ?? {}),
    })
  )

  // Persist draft to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`kealee_intake_${projectPath}`, JSON.stringify(formData))
      } catch {}
    }
  }, [formData, projectPath])

  function handleChange(key: string, val: unknown) {
    setFormData((prev) => ({ ...prev, [key]: val }))
  }

  const step = steps[currentStep]
  if (!step) return null

  const isLast = currentStep === steps.length - 1

  // Disable Continue if any required fields on current step are empty
  const stepRequiredMet = step.fields
    .filter((f) => f.required)
    .every((f) => {
      const val = formData[f.key]
      return val !== undefined && val !== null && val !== ''
    })

  function handleNext() {
    if (!stepRequiredMet) return
    if (isLast) {
      onComplete(formData)
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-[#E8793A]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Step {currentStep + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-xl font-bold" style={{ color: '#1A2B4A' }}>
          {step.title}
        </h2>
      </div>

      <div className="space-y-5">
        {step.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {field.hint && <p className="mb-2 text-xs text-gray-400">{field.hint}</p>}
            <FieldInput field={field} value={formData[field.key]} onChange={handleChange} />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleNext}
          disabled={!stepRequiredMet}
          className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          {isLast ? 'Review My Intake' : 'Continue'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
