'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { IntakePaymentGate } from '@kealee/ui/components/intake/intake-payment-gate'

export default function IntakePaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectPath = params.projectPath as string
  const intakeId = searchParams.get('intakeId') ?? ''
  const amountParam = searchParams.get('amount')
  const paymentAmount = amountParam ? parseInt(amountParam, 10) : 29900
  const [isLoading, setIsLoading] = useState(false)

  async function handleCheckout() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          amount: paymentAmount,
          successUrl: `${window.location.origin}/intake/${projectPath}/success?intakeId=${intakeId}`,
          cancelUrl: `${window.location.origin}/intake/${projectPath}/payment?intakeId=${intakeId}&amount=${paymentAmount}`,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { url } = await res.json() as { url?: string }
      if (url) window.location.href = url
    } catch (err) {
      console.error(err)
      alert('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <IntakePaymentGate
      intakeId={intakeId}
      projectPath={projectPath}
      paymentAmount={paymentAmount}
      onCheckout={handleCheckout}
      isLoading={isLoading}
    />
  )
}
