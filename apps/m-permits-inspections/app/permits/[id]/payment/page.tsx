'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { PermitApiService as PermitAPI } from '@/lib/api/permits'
import { createClient } from '@/lib/supabase/client'

interface FeeBreakdown {
  permitFee: number
  platformFee: number
  expedited?: {
    standard: number
    premium: number
  }
  documentPrep?: {
    basic: number
    standard: number
    premium: number
  }
  total: number
}

export default function PermitPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const permitId = params.id as string
  const feeType = searchParams.get('fee_type') || 'permit_fee'

  const [loading, setLoading] = useState(false)
  const [fees, setFees] = useState<FeeBreakdown | null>(null)
  const [selectedExpedited, setSelectedExpedited] = useState<'standard' | 'premium' | null>(null)
  const [selectedDocPrep, setSelectedDocPrep] = useState<'basic' | 'standard' | 'premium' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFees()
  }, [permitId])

  const loadFees = async () => {
    try {
      const fees = await PermitAPI.getPermitFees(permitId)
      setFees(fees.fees)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCheckout = async (type: 'permit_fee' | 'expedited' | 'document_prep') => {
    setLoading(true)
    setError(null)

    try {
      let data: any

      if (type === 'expedited' && selectedExpedited) {
        data = await PermitAPI.addExpeditedService(permitId, selectedExpedited)
      } else if (type === 'document_prep' && selectedDocPrep) {
        data = await PermitAPI.addDocumentPrep(permitId, selectedDocPrep)
      } else {
        data = await PermitAPI.createCheckoutSession(permitId, {
          feeType: type,
          amount: fees?.total || 0,
          description: `Payment for permit ${permitId}`,
        })
      }
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    if (!fees) return 0
    let total = fees.permitFee + fees.platformFee
    
    if (selectedExpedited && fees.expedited) {
      total += fees.expedited[selectedExpedited]
    }
    
    if (selectedDocPrep && fees.documentPrep) {
      total += fees.documentPrep[selectedDocPrep]
    }
    
    return total
  }

  if (!fees) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Permit Payment</h1>
            <p className="mt-1 text-sm text-gray-500">Permit ID: {permitId}</p>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Fee Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Fee Breakdown</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Permit Fee</span>
                  <span className="font-medium">${fees.permitFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee (3%)</span>
                  <span className="font-medium">${fees.platformFee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Expedited Processing */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expedited Processing (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">Get your permit reviewed in 48-72 hours</p>
              
              <div className="space-y-3">
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="expedited"
                    value="standard"
                    checked={selectedExpedited === 'standard'}
                    onChange={(e) => setSelectedExpedited(e.target.value as 'standard')}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Standard Expedited</span>
                      <span className="font-semibold">${fees.expedited?.standard.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">72-hour review guarantee</p>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="expedited"
                    value="premium"
                    checked={selectedExpedited === 'premium'}
                    onChange={(e) => setSelectedExpedited(e.target.value as 'premium')}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Premium Expedited</span>
                      <span className="font-semibold">${fees.expedited?.premium.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">48-hour review guarantee</p>
                  </div>
                </label>
              </div>

              {selectedExpedited && (
                <button
                  onClick={() => handleCheckout('expedited')}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay Expedited Fee (${selectedExpedited === 'premium' ? 'Premium' : 'Standard'})`}
                </button>
              )}
            </div>

            {/* Document Preparation */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Preparation (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">Professional permit package assembly</p>
              
              <div className="space-y-3">
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="docPrep"
                    value="basic"
                    checked={selectedDocPrep === 'basic'}
                    onChange={(e) => setSelectedDocPrep(e.target.value as 'basic')}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Basic Package</span>
                      <span className="font-semibold">${fees.documentPrep?.basic}</span>
                    </div>
                    <p className="text-sm text-gray-500">Document organization + checklist review</p>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="docPrep"
                    value="standard"
                    checked={selectedDocPrep === 'standard'}
                    onChange={(e) => setSelectedDocPrep(e.target.value as 'standard')}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Standard Package</span>
                      <span className="font-semibold">${fees.documentPrep?.standard}</span>
                    </div>
                    <p className="text-sm text-gray-500">+ Code compliance check</p>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="docPrep"
                    value="premium"
                    checked={selectedDocPrep === 'premium'}
                    onChange={(e) => setSelectedDocPrep(e.target.value as 'premium')}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Premium Package</span>
                      <span className="font-semibold">${fees.documentPrep?.premium}</span>
                    </div>
                    <p className="text-sm text-gray-500">+ Professional consultation + resubmission management</p>
                  </div>
                </label>
              </div>

              {selectedDocPrep && (
                <button
                  onClick={() => handleCheckout('document_prep')}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay Document Prep Fee (${selectedDocPrep.charAt(0).toUpperCase() + selectedDocPrep.slice(1)})`}
                </button>
              )}
            </div>

            {/* Total and Main Payment */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">${calculateTotal().toLocaleString()}</span>
              </div>
              
              <button
                onClick={() => handleCheckout('permit_fee')}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 text-lg"
              >
                {loading ? 'Processing...' : 'Pay Permit Fees'}
              </button>
              
              <p className="mt-3 text-xs text-gray-500 text-center">
                Secure payment processed by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

