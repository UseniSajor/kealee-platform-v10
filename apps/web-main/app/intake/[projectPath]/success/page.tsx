import { Suspense } from 'react'
import { IntakeSuccessContent } from './success-content'

export default function IntakeSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading...</div>}>
      <IntakeSuccessContent />
    </Suspense>
  )
}
