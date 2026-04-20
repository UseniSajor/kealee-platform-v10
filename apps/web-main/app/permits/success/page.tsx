import { Suspense } from 'react'
import PermitsSuccessClient from './client'

// Disable static prerendering for this dynamic route
export const revalidate = 0

export default function PermitsSuccessPage() {
  return (
    <Suspense fallback={<SuccessLoading />}>
      <PermitsSuccessClient />
    </Suspense>
  )
}

function SuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        </div>
        <p className="mt-4 text-slate-600">Loading your order...</p>
      </div>
    </div>
  )
}
