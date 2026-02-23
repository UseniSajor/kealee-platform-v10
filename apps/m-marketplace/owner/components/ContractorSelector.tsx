'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@owner/lib/api'

type ContractorProfile = {
  id: string
  userId: string
  businessName: string
  user: { id: string; name: string; email: string; phone: string | null; avatar: string | null }
  rating: number | null
  reviewCount: number
  projectsCompleted: number
  performanceScore: number | null
  verified: boolean
  specialties: string[]
}

type ContractorSelectorProps = {
  projectId: string
  selectedContractorId: string | null
  onSelect: (contractorId: string | null) => void
}

export default function ContractorSelector({ projectId, selectedContractorId, onSelect }: ContractorSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [specialty, setSpecialty] = useState<string>('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contractors, setContractors] = useState<ContractorProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ContractorProfile | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)

  const specialties = [
    'General Contractor',
    'Plumbing',
    'Electrical',
    'HVAC',
    'Roofing',
    'Flooring',
    'Painting',
    'Cabinetry',
    'Landscaping',
    'Concrete',
    'Drywall',
    'Tile',
  ]

  const searchContractors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.searchContractors({
        search: searchQuery || undefined,
        specialty: specialty || undefined,
        verifiedOnly: verifiedOnly || undefined,
        limit: 20,
      })
      setContractors(res.profiles || [])
    } catch (e: unknown) {
      console.error('Failed to search contractors:', e)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, specialty, verifiedOnly])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchContractors()
    }, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [searchContractors])

  const handleViewProfile = async (profileId: string) => {
    try {
      const res = await api.getContractorProfile(profileId)
      setSelectedProfile(res.profile as ContractorProfile)
      setShowDetails(true)
    } catch (e: unknown) {
      console.error('Failed to load contractor profile:', e)
    }
  }

  const handleSelectContractor = (contractor: ContractorProfile) => {
    onSelect(contractor.userId)
    setSelectedProfile(contractor)
  }

  const handleSendInvitation = async () => {
    if (!selectedProfile) return
    setSendingInvite(true)
    try {
      await api.sendContractorInvitation(selectedProfile.userId, projectId)
      alert('Invitation sent successfully! The contractor will be notified via email.')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to send invitation')
    } finally {
      setSendingInvite(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Search Contractors</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business name..."
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Specialty</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">All Specialties</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-neutral-300"
              />
              Verified only
            </label>
          </div>
        </div>
      </div>

      {/* Selected contractor display */}
      {selectedContractorId && selectedProfile ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">{selectedProfile.businessName}</h3>
              <p className="mt-1 text-sm text-blue-800">
                {selectedProfile.user.name} • {selectedProfile.user.email}
              </p>
              {selectedProfile.rating !== null ? (
                <p className="mt-1 text-sm text-blue-700">
                  ⭐ {selectedProfile.rating.toFixed(1)} ({selectedProfile.reviewCount} reviews)
                </p>
              ) : null}
              <p className="mt-1 text-sm text-blue-700">
                {selectedProfile.projectsCompleted} projects completed
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setSelectedProfile(null)
              }}
              className="text-sm text-blue-700 underline"
            >
              Change
            </button>
          </div>
        </div>
      ) : null}

      {/* Contractor list */}
      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-600">Searching contractors...</div>
      ) : contractors.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-600">No contractors found</div>
      ) : (
        <div className="space-y-3">
          {contractors.map((contractor) => (
            <div
              key={contractor.id}
              className={`rounded-lg border p-4 ${
                selectedContractorId === contractor.userId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900">{contractor.businessName}</h3>
                    {contractor.verified ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        ✓ Verified
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {contractor.user.name} • {contractor.user.email}
                  </p>
                  {contractor.rating !== null ? (
                    <p className="mt-1 text-sm text-neutral-700">
                      ⭐ {contractor.rating.toFixed(1)} ({contractor.reviewCount} reviews) •{' '}
                      {contractor.projectsCompleted} projects completed
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-neutral-700">
                      {contractor.projectsCompleted} projects completed
                    </p>
                  )}
                  {contractor.specialties.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {contractor.specialties.map((s) => (
                        <span
                          key={s}
                          className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewProfile(contractor.id)}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectContractor(contractor)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      selectedContractorId === contractor.userId
                        ? 'bg-blue-600 text-white'
                        : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {selectedContractorId === contractor.userId ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contractor details modal */}
      {showDetails && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">{selectedProfile.businessName}</h2>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-700">Contact Information</h3>
                <p className="mt-1 text-sm text-neutral-900">{selectedProfile.user.name}</p>
                <p className="text-sm text-neutral-600">{selectedProfile.user.email}</p>
                {selectedProfile.user.phone && (
                  <p className="text-sm text-neutral-600">{selectedProfile.user.phone}</p>
                )}
              </div>
              {selectedProfile.rating !== null ? (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">Performance Metrics</h3>
                  <p className="mt-1 text-sm text-neutral-900">
                    ⭐ Rating: {selectedProfile.rating.toFixed(1)} / 5.0 ({selectedProfile.reviewCount} reviews)
                  </p>
                  <p className="text-sm text-neutral-600">
                    Projects Completed: {selectedProfile.projectsCompleted}
                  </p>
                  {selectedProfile.performanceScore !== null && (
                    <p className="text-sm text-neutral-600">
                      Performance Score: {selectedProfile.performanceScore}/100
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">Experience</h3>
                  <p className="text-sm text-neutral-600">
                    {selectedProfile.projectsCompleted} projects completed
                  </p>
                </div>
              )}
              {selectedProfile.specialties.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">Specialties</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedProfile.specialties.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelectContractor(selectedProfile)
                  setShowDetails(false)
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Select Contractor
              </button>
              <button
                type="button"
                onClick={handleSendInvitation}
                disabled={sendingInvite}
                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                {sendingInvite ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
