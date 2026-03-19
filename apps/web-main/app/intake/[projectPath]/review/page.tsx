'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { IntakeReviewPanel } from '@kealee/ui/components/intake/intake-review-panel'

export default function IntakeReviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectPath = params.projectPath as string
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`kealee_intake_${projectPath}`)
      if (stored) {
        try {
          setFormData(JSON.parse(stored))
        } catch {}
      }
    }
  }, [projectPath])

  if (!formData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No intake data found.</p>
        <button
          onClick={() => router.push(`/intake/${projectPath}`)}
          className="mt-4 text-sm text-[#E8793A] hover:underline"
        >
          Start intake
        </button>
      </div>
    )
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake: formData }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const result = await res.json() as {
        ok: boolean
        intakeId?: string
        requiresPayment?: boolean
        paymentAmount?: number
        errors?: string[]
      }

      if (!result.ok) {
        alert('Submission failed: ' + (result.errors?.join(', ') ?? 'Unknown error'))
        return
      }

      if (result.requiresPayment && result.intakeId) {
        router.push(`/intake/${projectPath}/payment?intakeId=${result.intakeId}&amount=${result.paymentAmount ?? 0}`)
      } else {
        router.push(`/intake/${projectPath}/success?intakeId=${result.intakeId ?? 'unknown'}`)
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <IntakeReviewPanel
      formData={formData}
      projectPath={projectPath}
      onBack={() => router.push(`/intake/${projectPath}`)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
