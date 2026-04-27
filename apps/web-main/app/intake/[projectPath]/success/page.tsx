'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, ArrowRight, Clock, FileText, Users } from 'lucide-react'
import { SERVICE_DELIVERABLES, ServiceDeliverable } from '@/lib/service-deliverables'

export default function IntakeSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const projectPath = Array.isArray(params.projectPath) ? params.projectPath[0] : params.projectPath
  const intakeId = searchParams.get('intakeId')

  const deliverable = SERVICE_DELIVERABLES[projectPath] ?? null
  const category = deliverable?.category ?? 'design'

  const [status, setStatus] = useState<'idle' | 'generating' | 'redirecting' | 'done'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!deliverable) return

    // For permit, estimate, and contractor_match: no concept to generate
    if (!deliverable.generatesConcept || !intakeId) {
      setStatus('done')
      return
    }

    // For design/development: trigger concept generation then redirect
    const generate = async () => {
      setStatus('generating')
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const res = await fetch('/api/concept/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intakeId }),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!res.ok) {
          console.warn('[success] concept generation failed, redirecting anyway')
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[success] generate error:', err?.message)
        }
        // Fire-and-forget: still redirect even on timeout/error
      }

      setStatus('redirecting')
      router.push(`/concept/deliverable?intakeId=${intakeId}&projectPath=${projectPath}`)
    }

    generate()
  }, [deliverable, intakeId, projectPath, router])

  // Permit success
  if (category === 'permit') {
    return <PermitSuccess deliverable={deliverable} />
  }

  // Estimate success
  if (category === 'estimate') {
    return <EstimateSuccess deliverable={deliverable} />
  }

  // Contractor match success
  if (category === 'match') {
    return <ContractorMatchSuccess deliverable={deliverable} />
  }

  // Design / Development: show generating state
  if (status === 'generating' || status === 'redirecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-orange-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-200 rounded-full animate-pulse" />
              <Loader2 className="relative w-20 h-20 text-orange-600 animate-spin" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            {status === 'redirecting' ? 'Concept Ready!' : 'Generating Your Concept'}
          </h1>
          <p className="text-slate-600 text-lg mb-2">
            {status === 'redirecting'
              ? 'Redirecting to your deliverable...'
              : 'Claude is building your personalized concept package.'}
          </p>
          <p className="text-slate-400 text-sm">This takes about 10–15 seconds.</p>
        </div>
      </div>
    )
  }

  // Generic fallback (no intakeId or generatesConcept=false with unknown category)
  return <GenericSuccess deliverable={deliverable} intakeId={intakeId} />
}

function PermitSuccess({ deliverable }: { deliverable: ServiceDeliverable | null }) {
  const steps = [
    { icon: '📋', label: 'Application Prepared', timing: 'Day 1-2' },
    { icon: '📤', label: 'Submitted to Agency', timing: 'Day 2-3' },
    { icon: '🔍', label: 'Under Review', timing: 'Day 3–10' },
    { icon: '✅', label: 'Permit Issued', timing: 'Day 10–30' },
  ]
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <section className="bg-white border-b border-slate-200 px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200 rounded-full animate-pulse" />
              <CheckCircle2 className="relative w-20 h-20 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Permit Process Started</h1>
          <p className="text-xl text-slate-600">Our permit specialists are reviewing your project details.</p>
        </div>
      </section>
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What Happens Next</h2>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-200">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <p className="font-semibold text-slate-900">{s.label}</p>
                  <p className="text-sm text-slate-500">{s.timing}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 mb-1">What You Paid For</p>
                <ul className="space-y-1">
                  {deliverable?.includes?.map((item, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <a href="mailto:permits@kealee.com" className="text-blue-600 hover:underline text-sm">
              Questions? Email permits@kealee.com
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

function EstimateSuccess({ deliverable }: { deliverable: ServiceDeliverable | null }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      <section className="bg-white border-b border-slate-200 px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse" />
              <CheckCircle2 className="relative w-20 h-20 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Estimate In Progress</h1>
          <p className="text-xl text-slate-600">Our cost analyst is preparing your RSMeans-validated estimate.</p>
          <p className="text-slate-500 mt-2">Delivered within {deliverable?.deliveryDays ?? '2-3 days'}</p>
        </div>
      </section>
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
            <h2 className="font-bold text-slate-900 mb-4 text-lg">Your Estimate Includes</h2>
            <ul className="space-y-2">
              {deliverable?.includes?.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center">
            <Link href="/marketplace">
              <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl transition inline-flex items-center gap-2">
                Browse Contractors in the meantime
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function ContractorMatchSuccess({ deliverable }: { deliverable: ServiceDeliverable | null }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50">
      <section className="bg-white border-b border-slate-200 px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-200 rounded-full animate-pulse" />
              <Users className="relative w-20 h-20 text-teal-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Matching in Progress</h1>
          <p className="text-xl text-slate-600">Expect 3 vetted contractor matches within 24 hours.</p>
        </div>
      </section>
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {['License Verified', 'Insurance Confirmed', 'Project Fit Scored'].map((badge, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-teal-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">{badge}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="font-bold text-slate-900 mb-4">Your Match Package Includes</h2>
            <ul className="space-y-2">
              {deliverable?.includes?.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-center">
            <Link href="/marketplace">
              <button className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-2 mx-auto text-sm">
                Browse All Contractors
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function GenericSuccess({ deliverable, intakeId }: { deliverable: ServiceDeliverable | null; intakeId: string | null }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      <section className="bg-white border-b border-slate-200 px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse" />
              <CheckCircle2 className="relative w-20 h-20 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Your Project is in Motion</h1>
          <p className="text-xl text-slate-600">
            We've received your order and started the analysis process.
          </p>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          {deliverable?.includes && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="font-bold text-slate-900 mb-4 text-lg">What You Ordered</h2>
              <ul className="space-y-2">
                {deliverable.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-600">
              Delivered within <span className="font-semibold">{deliverable?.deliveryDays ?? '3-5 days'}</span>.
              You'll receive an email when your deliverables are ready.
            </p>
          </div>

          {intakeId && deliverable?.generatesConcept && (
            <div className="text-center">
              <Link href={`/concept/deliverable?intakeId=${intakeId}`}>
                <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl transition inline-flex items-center gap-2">
                  View Your Concept
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-lg opacity-90 mb-8">Our team is here to support you every step of the way.</p>
          <a href="mailto:support@kealee.com">
            <button className="bg-white hover:bg-slate-100 text-orange-600 font-bold py-3 px-8 rounded-xl transition inline-flex items-center gap-2">
              Contact Support
              <ArrowRight className="w-5 h-5" />
            </button>
          </a>
        </div>
      </section>
    </div>
  )
}
