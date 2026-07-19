'use client'

/**
 * /permits/new — Start a permit application
 *
 * Backed by:
 *   GET  /marketplace/contractors/projects  (project picker)
 *   GET  /permits/jurisdictions             (jurisdiction picker)
 *   POST /api/permits                       (create — services/api/src/routes/permit.routes.ts)
 *
 * A project must be selected because `Permit.projectId` is a required
 * foreign key on the backend — there is no "standalone" permit.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getContractorProjects, getContractorProfile, type ContractorProject } from '@/lib/api/contractor'
import { createPermit, getJurisdictions, type PermitJurisdiction, type PermitTypeInput } from '@/lib/api/permits'

const PERMIT_TYPES: { value: PermitTypeInput; label: string }[] = [
  { value: 'building', label: 'Building' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'mechanical', label: 'Mechanical' },
]

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ABFBF] focus:border-transparent'
const labelClass = 'mb-1.5 block text-xs font-semibold text-gray-500'

export default function NewPermitApplicationPage() {
  const router = useRouter()

  const [projects, setProjects] = useState<ContractorProject[]>([])
  const [jurisdictions, setJurisdictions] = useState<PermitJurisdiction[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const [projectId, setProjectId] = useState('')
  const [jurisdictionId, setJurisdictionId] = useState('')
  const [permitType, setPermitType] = useState<PermitTypeInput>('building')
  const [address, setAddress] = useState('')
  const [scope, setScope] = useState('')
  const [applicantName, setApplicantName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getContractorProjects(),
      getJurisdictions(),
      getContractorProfile().catch(() => null),
    ])
      .then(([projectsRes, jurisdictionsRes, profile]) => {
        setProjects(projectsRes.projects ?? [])
        setJurisdictions(jurisdictionsRes.jurisdictions ?? [])
        if (profile) {
          setApplicantName(profile.businessName ?? '')
          setLicenseNumber(profile.licenseNumber ?? '')
        }
        setLoadingOptions(false)
      })
      .catch((err: any) => {
        setOptionsError(err?.message ?? 'Could not load projects and jurisdictions')
        setLoadingOptions(false)
      })
  }, [])

  function handleProjectChange(id: string) {
    setProjectId(id)
    const proj = projects.find((p) => p.projectId === id)
    if (proj?.address && !address) setAddress(proj.address)
  }

  const canSubmit =
    !!projectId && !!jurisdictionId && !!permitType && address.trim().length > 0 &&
    scope.trim().length > 0 && applicantName.trim().length > 0 &&
    email.trim().length > 0 && phone.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { permit } = await createPermit({
        address: address.trim(),
        jurisdiction: jurisdictionId,
        permitTypes: [permitType],
        projectDetails: {
          projectId,
          scope: scope.trim(),
        },
        applicantInfo: {
          name: applicantName.trim(),
          licenseNumber: licenseNumber.trim() || undefined,
          contactInfo: { email: email.trim(), phone: phone.trim() },
        },
      })
      router.push(`/permits/${permit.id}`)
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to create permit application')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <a href="/permits" className="text-xs font-medium text-gray-400 hover:text-gray-600">← Permit Applications</a>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>New Permit Application</h1>
        <p className="mt-0.5 text-sm text-gray-500">Start a permit for one of your active projects</p>
      </div>

      {loadingOptions && (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#2ABFBF', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {optionsError && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
          {optionsError}
        </div>
      )}

      {!loadingOptions && !optionsError && projects.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-bold mb-1" style={{ color: '#1A2B4A' }}>No active projects yet</h3>
          <p className="text-sm text-gray-500">
            A permit application is filed against a project. Accept a lead or get matched to a project first,
            then come back to start a permit application.
          </p>
        </div>
      )}

      {!loadingOptions && !optionsError && projects.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <label className={labelClass}>Project *</label>
            <select
              className={inputClass}
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              required
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.projectId ?? p.assignmentId} value={p.projectId ?? ''}>
                  {p.projectName}{p.address ? ` — ${p.address}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Jurisdiction *</label>
              <select
                className={inputClass}
                value={jurisdictionId}
                onChange={(e) => setJurisdictionId(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Permit Type *</label>
              <select
                className={inputClass}
                value={permitType}
                onChange={(e) => setPermitType(e.target.value as PermitTypeInput)}
                required
              >
                {PERMIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Project Address *</label>
            <input
              className={inputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Scope of Work *</label>
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Describe the work this permit covers…"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Applicant / Business Name *</label>
              <input className={inputClass} value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>License Number</label>
              <input className={inputClass} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact Email *</label>
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Contact Phone *</label>
              <input type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
              {submitError}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: '#E8793A' }}
            >
              {submitting ? 'Submitting…' : 'Create Application'}
            </button>
            <a href="/permits" className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</a>
          </div>
        </form>
      )}
    </div>
  )
}
