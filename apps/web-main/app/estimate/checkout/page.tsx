import { Suspense } from 'react'
import EstimateCheckoutClient from './client'

// Disable static prerendering for this dynamic route
export const revalidate = 0

export default function EstimateCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <EstimateCheckoutClient />
    </Suspense>
  )
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Loading...</h1>
      </div>
    </div>
  )
}
