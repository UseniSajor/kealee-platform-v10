'use client'

import { CreditCard, Lock } from 'lucide-react'

interface IntakePaymentGateProps {
  intakeId: string
  projectPath: string
  paymentAmount: number
  onCheckout: () => void
  isLoading?: boolean
}

const PATH_LABELS: Record<string, string> = {
  exterior_concept: 'Exterior Concept',
  interior_renovation: 'Interior Renovation',
  whole_home_remodel: 'Whole-Home Remodel',
  addition_expansion: 'Addition / Expansion',
  design_build: 'Design + Build',
  permit_path_only: 'Permit Path',
}

export function IntakePaymentGate({
  intakeId,
  projectPath,
  paymentAmount,
  onCheckout,
  isLoading,
}: IntakePaymentGateProps) {
  const dollars = (paymentAmount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: '#1A2B4A' }}
        >
          <CreditCard className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          Intake Payment Required
        </h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Your intake has been created. To move this project into active review and consultation
          scheduling, complete the required intake payment below.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-left">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Project Type</p>
            <p className="mt-0.5 font-semibold" style={{ color: '#1A2B4A' }}>
              {PATH_LABELS[projectPath] ?? projectPath}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Intake Fee</p>
            <p className="mt-0.5 text-xl font-bold" style={{ color: '#E8793A' }}>
              {dollars}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Intake ID: <span className="font-mono text-gray-600">{intakeId}</span>
        </p>

        <button
          onClick={onCheckout}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#E8793A' }}
        >
          <Lock className="h-4 w-4" />
          {isLoading ? 'Redirecting...' : `Pay ${dollars} Securely`}
        </button>

        <p className="mt-3 text-center text-xs text-gray-400">
          Secured by Stripe. No subscription — one-time intake fee.
        </p>
      </div>
    </div>
  )
}
