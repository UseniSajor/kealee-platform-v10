'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { DynamicIntakeForm } from '@kealee/ui/components/intake/dynamic-intake-form'
import { useState, useEffect } from 'react'
import { DMV_JURISDICTIONS, type DMVJurisdictionCode } from '@kealee/intake/schemas'

export default function PermitsIntakePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<DMVJurisdictionCode | ''>('')

  useEffect(() => {
    // Get tier from query param if provided
    const tier = searchParams.get('tier')
    if (tier) {
      setSelectedTier(tier)
    }
  }, [searchParams])

  function handleComplete(data: Record<string, unknown>) {
    // Persist full form data to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'kealee_permits_intake',
        JSON.stringify({
          ...data,
          selectedTier,
          selectedJurisdiction,
          submittedAt: new Date().toISOString(),
        })
      )
    }
    // Go to review/checkout
    router.push(`/permits/review?tier=${selectedTier || 'submission'}&jurisdiction=${selectedJurisdiction || 'dc_dob'}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-12 border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              File Permits in Your Jurisdiction
            </h1>
            <p className="mt-3 text-gray-600">
              Which DMV area are you in? We'll help you prepare and file with the correct agency.
            </p>
          </div>
        </div>
      </section>

      {/* Jurisdiction Selector */}
      <section className="py-8 bg-gray-50 border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <label className="block text-sm font-semibold mb-4" style={{ color: '#1A2B4A' }}>
            Select Your Jurisdiction
          </label>
          <select
            value={selectedJurisdiction}
            onChange={e => setSelectedJurisdiction(e.target.value as DMVJurisdictionCode)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Choose jurisdiction —</option>
            {(Object.entries(DMV_JURISDICTIONS) as [DMVJurisdictionCode, any][]).map(([code, data]) => (
              <option key={code} value={code}>
                {data.name} ({data.abbreviation})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {selectedJurisdiction ? (
            <>
              <DynamicIntakeForm
                projectPath="permits"
                onComplete={handleComplete}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Please select a jurisdiction to begin</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
