'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type OnboardingStep = {
  id: string
  title: string
  description: string
  component: React.ReactNode
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Kealee',
      description: 'Get started with your project management platform',
      component: <WelcomeStep />,
    },
    {
      id: 'create-project',
      title: 'Create Your First Project',
      description: 'Set up your project and define the scope',
      component: <CreateProjectStep />,
    },
    {
      id: 'readiness',
      title: 'Complete Readiness Checklist',
      description: 'Ensure you have everything ready before starting',
      component: <ReadinessStep />,
    },
    {
      id: 'contracts',
      title: 'Create Contracts',
      description: 'Set up contracts with your contractors',
      component: <ContractsStep />,
    },
    {
      id: 'milestones',
      title: 'Manage Milestones',
      description: 'Track progress and approve work',
      component: <MilestonesStep />,
    },
    {
      id: 'payments',
      title: 'Payment Management',
      description: 'Understand escrow and payment release',
      component: <PaymentsStep />,
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setCompletedSteps(new Set([...completedSteps, steps[currentStep].id]))
    } else {
      // Complete onboarding
      setCompletedSteps(new Set([...completedSteps, steps[currentStep].id]))
      router.push('/')
    }
  }

  const handleSkip = () => {
    router.push('/')
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="font-medium text-neutral-900">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  index < currentStep
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : index === currentStep
                      ? 'border-blue-600 bg-white text-blue-600'
                      : 'border-neutral-300 bg-white text-neutral-400'
                }`}
              >
                {index < currentStep ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span className="mt-2 hidden text-xs text-neutral-600 md:block">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-neutral-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">{steps[currentStep].title}</h1>
        <p className="mt-2 text-lg text-neutral-600">{steps[currentStep].description}</p>

        <div className="mt-8">{steps[currentStep].component}</div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Skip Tour
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next →'}
          </button>
        </div>
      </div>
    </main>
  )
}

function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-xl font-semibold text-blue-900">What is Kealee?</h2>
        <p className="mt-2 text-blue-800">
          Kealee is a comprehensive project management platform designed specifically for construction
          and renovation projects. Manage your entire project lifecycle from planning to completion.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="font-semibold text-neutral-900">Project Management</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Track milestones, manage contracts, and oversee your entire project.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="font-semibold text-neutral-900">Payment Protection</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Secure escrow payments with milestone-based releases.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="font-semibold text-neutral-900">Document Management</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Store contracts, permits, inspections, and all project documents.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="font-semibold text-neutral-900">Dispute Resolution</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Built-in dispute management and resolution tools.
          </p>
        </div>
      </div>
    </div>
  )
}

function CreateProjectStep() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h2 className="text-xl font-semibold text-green-900">Create Your First Project</h2>
        <p className="mt-2 text-green-800">
          Start by creating a project. You'll need to provide basic information about your renovation
          or construction project.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-neutral-900">Required Information:</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600">
            <li>Project name and description</li>
            <li>Project category (Kitchen, Bathroom, Addition, etc.)</li>
            <li>Property address (optional)</li>
          </ul>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can always edit project details later. Start with the basics and
            add more information as you go.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create Project →
        </Link>
      </div>
    </div>
  )
}

function ReadinessStep() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-semibold text-amber-900">Readiness Checklist</h2>
        <p className="mt-2 text-amber-800">
          Before starting construction, complete your readiness checklist. This ensures you have
          everything in place for a successful project.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-neutral-900">Common Checklist Items:</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600">
            <li>Finalize scope of work</li>
            <li>Set firm budget</li>
            <li>Review and approve timeline</li>
            <li>Secure financing (if needed)</li>
            <li>Understand permit requirements</li>
            <li>Review insurance coverage</li>
          </ul>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-700">
            <strong>Note:</strong> All required items must be completed before you can proceed to
            contract creation.
          </p>
        </div>
      </div>
    </div>
  )
}

function ContractsStep() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
        <h2 className="text-xl font-semibold text-purple-900">Create Contracts</h2>
        <p className="mt-2 text-purple-800">
          Set up contracts with your contractors. Contracts define the scope, timeline, and payment
          schedule for your project.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-neutral-900">Contract Features:</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600">
            <li>Define project scope and timeline</li>
            <li>Set milestone-based payment schedule</li>
            <li>Digital signing with DocuSign integration</li>
            <li>Automatic escrow setup</li>
          </ul>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-700">
            <strong>Security:</strong> All contracts are stored securely and can be accessed anytime
            from your project dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}

function MilestonesStep() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6">
        <h2 className="text-xl font-semibold text-indigo-900">Manage Milestones</h2>
        <p className="mt-2 text-indigo-800">
          Track project progress through milestones. Contractors submit work for approval, and you
          review and approve before payment is released.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-neutral-900">Milestone Workflow:</h3>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-neutral-600">
            <li>Contractor submits milestone with evidence (photos, documents)</li>
            <li>You review the submission</li>
            <li>Approve or request changes</li>
            <li>Payment is automatically released upon approval</li>
          </ol>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm text-neutral-700">
            <strong>Tip:</strong> Review evidence carefully before approving. You can add comments or
            request additional information.
          </p>
        </div>
      </div>
    </div>
  )
}

function PaymentsStep() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-semibold text-emerald-900">Payment Management</h2>
        <p className="mt-2 text-emerald-800">
          All payments are protected through escrow. Funds are held securely until milestones are
          approved.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-neutral-900">How Escrow Works:</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-600">
            <li>Funds are deposited into escrow when contract is signed</li>
            <li>10% holdback is retained until project completion</li>
            <li>Payments are released automatically upon milestone approval</li>
            <li>Final payment is released after closeout checklist completion</li>
          </ul>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            <strong>Protection:</strong> Escrow protects both you and your contractor. Funds are only
            released when work is approved.
          </p>
        </div>
      </div>
    </div>
  )
}
