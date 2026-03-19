'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight, Upload, LogIn } from 'lucide-react'

interface IntakeSuccessPanelProps {
  intakeId: string
  projectPath: string
  allowUpload?: boolean
  portalUrl?: string
}

const PATH_LABELS: Record<string, string> = {
  exterior_concept: 'Exterior Concept',
  interior_renovation: 'Interior Renovation',
  whole_home_remodel: 'Whole-Home Remodel',
  addition_expansion: 'Addition / Expansion',
  design_build: 'Design + Build',
  permit_path_only: 'Permit Path',
}

const NEXT_STEPS: Record<string, string[]> = {
  exterior_concept: [
    'Your intake has been received and scored',
    'Our AI will generate your concept within 24 hours',
    'A Kealee design consultant will review and follow up',
  ],
  interior_renovation: [
    'Your project intake is in our system',
    'We will match you with qualified renovation contractors',
    'Expect a follow-up within 24 hours',
  ],
  whole_home_remodel: [
    'Your whole-home project intake is confirmed',
    'Our team will review your scope and budget',
    'We will connect you with vetted remodel specialists',
  ],
  addition_expansion: [
    'Your addition intake has been received',
    'We will review permit requirements for your jurisdiction',
    'Expect a project assessment within 24–48 hours',
  ],
  design_build: [
    'Your design-build intake is in review',
    'A senior project manager will contact you to scope the work',
    'We will assemble the right team for your project',
  ],
  permit_path_only: [
    'Your permit path intake has been received',
    'We will review jurisdiction requirements and timeline',
    'A permit coordinator will follow up within 1 business day',
  ],
}

export function IntakeSuccessPanel({
  intakeId,
  projectPath,
  allowUpload,
  portalUrl = '/portal',
}: IntakeSuccessPanelProps) {
  const steps = NEXT_STEPS[projectPath] ?? ['Your intake has been received. We will follow up shortly.']

  return (
    <div className="mx-auto max-w-md text-center">
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: '#E8793A' }}
      >
        <CheckCircle className="h-8 w-8 text-white" />
      </div>

      <h2 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
        Intake Received
      </h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        Your project intake has been received by Kealee. We&apos;ll use this submission to move
        your project into the next stage of review inside the platform.
      </p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-left">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          What happens next
        </p>
        <ul className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: '#2ABFBF' }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-gray-700">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Intake ID: <span className="font-mono text-gray-600">{intakeId}</span> ·{' '}
        {PATH_LABELS[projectPath] ?? projectPath}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {allowUpload && (
          <Link
            href={`/intake/upload?intakeId=${intakeId}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300"
          >
            <Upload className="h-4 w-4" /> Upload More Files
          </Link>
        )}

        <Link
          href={portalUrl}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1A2B4A' }}
        >
          <LogIn className="h-4 w-4" /> Access Your Portal
        </Link>

        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"
        >
          Back to Kealee <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
