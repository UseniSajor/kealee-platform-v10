'use client'

/**
 * /profile/edit
 *
 * Contractor profile editor.
 * Loads current profile via GET /marketplace/contractors/profile,
 * then PATCHes changes via PATCH /marketplace/contractors/profile.
 *
 * NOTE: Updating licenseNumbers or insuranceCarrier triggers
 *       requiresReverification = true on the backend.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Save,
} from 'lucide-react'
import { getContractorProfile, updateContractorProfile, type ContractorProfile } from '@/lib/api/contractor'

// ─── CSI divisions list ────────────────────────────────────────────────────────

const CSI_DIVISIONS = [
  'General Requirements', 'Existing Conditions', 'Concrete', 'Masonry', 'Metals',
  'Wood / Plastics / Composites', 'Thermal & Moisture Protection', 'Openings',
  'Finishes', 'Specialties', 'Equipment', 'Furnishings', 'Special Construction',
  'Conveying Systems', 'Plumbing', 'HVAC', 'Fire Suppression', 'Electrical',
  'Communications', 'Electronic Safety', 'Earthwork', 'Exterior Improvements',
  'Utilities', 'Transportation', 'Waterway / Marine',
]

// ─── Form types ────────────────────────────────────────────────────────────────

interface EditForm {
  businessName: string
  businessType: string
  yearsInBusiness: string
  serviceArea: string
  bio: string
  website: string
  csiDivisions: string[]
  licenseNumbers: string    // newline-separated
  insuranceCarrier: string
  insuranceExpiration: string
  insuranceCoverageAmount: string
}

function profileToForm(p: ContractorProfile): EditForm {
  return {
    businessName:    p.businessName        ?? '',
    businessType:    p.businessType        ?? '',
    yearsInBusiness: p.yearsInBusiness != null ? String(p.yearsInBusiness) : '',
    serviceArea:     p.serviceArea         ?? '',
    bio:             p.bio                 ?? '',
    website:         p.website             ?? '',
    csiDivisions:    p.csiDivisions        ?? [],
    licenseNumbers:  (p.allLicenses ?? []).join('\n'),
    insuranceCarrier:       p.insuranceCarrier        ?? '',
    insuranceExpiration:    p.insuranceExpiration     ?? '',
    insuranceCoverageAmount: p.insuranceCoverageAmount != null ? String(p.insuranceCoverageAmount) : '',
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Input({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-60'

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        selected
          ? 'border-[#2ABFBF] bg-[#2ABFBF]/10 text-[#1A8F8F]'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {selected && <span className="mr-1">✓</span>}{label}
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProfileEditPage() {
  const router = useRouter()
  const [form, setForm]     = useState<EditForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved]         = useState(false)
  const [credentialWarning, setCredentialWarning] = useState(false)

  // Track original credential values to detect changes
  const [origLicenses, setOrigLicenses]           = useState('')
  const [origInsuranceCarrier, setOrigInsuranceCarrier] = useState('')

  useEffect(() => {
    getContractorProfile()
      .then((p) => {
        const f = profileToForm(p)
        setForm(f)
        setOrigLicenses(f.licenseNumbers)
        setOrigInsuranceCarrier(f.insuranceCarrier)
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const set = useCallback(<K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
    setSaveError(null)
    setSaved(false)

    // Warn if credential fields change
    if (key === 'licenseNumbers' || key === 'insuranceCarrier') {
      setCredentialWarning(true)
    }
  }, [])

  function toggleDivision(div: string) {
    if (!form) return
    setForm(prev => prev ? {
      ...prev,
      csiDivisions: prev.csiDivisions.includes(div)
        ? prev.csiDivisions.filter(d => d !== div)
        : [...prev.csiDivisions, div],
    } : prev)
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    if (!form.businessName.trim()) { setSaveError('Business name is required.'); return }

    setSaving(true)
    setSaveError(null)

    const updates: Partial<ContractorProfile> = {
      businessName:    form.businessName.trim(),
      businessType:    form.businessType  || null,
      yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness, 10) : null,
      serviceArea:     form.serviceArea   || null,
      bio:             form.bio           || null,
      website:         form.website       || null,
      csiDivisions:    form.csiDivisions,
      allLicenses:     form.licenseNumbers.split('\n').map(l => l.trim()).filter(Boolean),
      insuranceCarrier: form.insuranceCarrier || null,
      insuranceExpiration: form.insuranceExpiration || null,
      insuranceCoverageAmount: form.insuranceCoverageAmount
        ? parseFloat(form.insuranceCoverageAmount)
        : null,
    }

    try {
      await updateContractorProfile(updates)
      setSaved(true)
      setCredentialWarning(false)
      // Navigate back after short delay
      setTimeout(() => router.push('/profile'), 1200)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
  }

  if (loadError || !form) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex gap-3 text-red-700">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">{loadError ?? 'Profile not found.'}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Edit Profile</h1>
            <p className="text-sm text-gray-500">Changes are visible on your public profile after saving.</p>
          </div>
        </div>
      </div>

      {/* Credential change warning */}
      {credentialWarning && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-amber-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Credential changes require re-verification</p>
            <p className="mt-0.5 text-amber-700">
              Updating license numbers or insurance triggers a new verification review. Your profile remains
              active but marked &quot;Pending Review&quot; until an admin approves the changes.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} noValidate>
        <div className="space-y-6">

          {/* ── Business Details ── */}
          <Section title="Business Details">
            <Input label="Business Name" required>
              <input
                type="text"
                className={inputCls}
                placeholder="Smith Construction LLC"
                value={form.businessName}
                onChange={e => set('businessName', e.target.value)}
              />
            </Input>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Business Type">
                <select
                  className={inputCls + ' cursor-pointer'}
                  value={form.businessType}
                  onChange={e => set('businessType', e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="CONTRACTOR">General / Trade Contractor</option>
                  <option value="DESIGN_BUILD">Design-Build Firm</option>
                  <option value="SPECIALTY">Specialty Contractor</option>
                </select>
              </Input>
              <Input label="Years in Business">
                <input
                  type="number"
                  className={inputCls}
                  placeholder="8"
                  min="0"
                  max="100"
                  value={form.yearsInBusiness}
                  onChange={e => set('yearsInBusiness', e.target.value)}
                />
              </Input>
            </div>
            <Input label="Primary Service Area" hint="City, state, or region">
              <input
                type="text"
                className={inputCls}
                placeholder="Austin, TX"
                value={form.serviceArea}
                onChange={e => set('serviceArea', e.target.value)}
              />
            </Input>
            <Input label="Website">
              <input
                type="url"
                className={inputCls}
                placeholder="https://smithconstruction.com"
                value={form.website}
                onChange={e => set('website', e.target.value)}
              />
            </Input>
            <Input label="Company Bio" hint="Shown to project owners — max 1,500 chars">
              <textarea
                className={inputCls + ' resize-none'}
                rows={4}
                maxLength={1500}
                placeholder="Tell project owners about your company, experience, and specialties..."
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
              />
              <p className="text-right text-xs text-gray-400">{form.bio.length}/1500</p>
            </Input>
          </Section>

          {/* ── Trade Specialties ── */}
          <Section title="Trade Specialties">
            <p className="text-sm text-gray-500 mb-3">Select the CSI divisions you work in:</p>
            <div className="flex flex-wrap gap-2">
              {CSI_DIVISIONS.map(div => (
                <ToggleChip
                  key={div}
                  label={div}
                  selected={form.csiDivisions.includes(div)}
                  onClick={() => toggleDivision(div)}
                />
              ))}
            </div>
            {form.csiDivisions.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">{form.csiDivisions.length} selected</p>
            )}
          </Section>

          {/* ── Credentials ── */}
          <Section title="Credentials">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 mb-4">
              Updating credentials will trigger a re-verification review. Your profile stays active during review.
            </div>
            <Input label="License Numbers" hint="One per line">
              <textarea
                className={inputCls + ' resize-none font-mono'}
                rows={4}
                placeholder={'General Contractor: TX-GC-123456\nElectrical: TX-EC-789012'}
                value={form.licenseNumbers}
                onChange={e => set('licenseNumbers', e.target.value)}
              />
            </Input>
          </Section>

          {/* ── Insurance ── */}
          <Section title="Insurance">
            <Input label="Insurance Carrier">
              <input
                type="text"
                className={inputCls}
                placeholder="Travelers Insurance"
                value={form.insuranceCarrier}
                onChange={e => set('insuranceCarrier', e.target.value)}
              />
            </Input>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Policy Expiration">
                <input
                  type="date"
                  className={inputCls}
                  value={form.insuranceExpiration ? form.insuranceExpiration.split('T')[0] : ''}
                  onChange={e => set('insuranceExpiration', e.target.value)}
                />
              </Input>
              <Input label="Coverage Amount" hint="USD">
                <input
                  type="number"
                  className={inputCls}
                  placeholder="2000000"
                  min="0"
                  value={form.insuranceCoverageAmount}
                  onChange={e => set('insuranceCoverageAmount', e.target.value)}
                />
              </Input>
            </div>
          </Section>

        </div>

        {/* Save error */}
        {saveError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {saveError}
          </div>
        )}

        {/* Success */}
        {saved && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
            Profile saved. Redirecting...
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || saved}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: saving || saved ? '#1A8F8F' : '#2ABFBF' }}
          >
            {saving  ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> :
             saved   ? <><CheckCircle2 className="h-4 w-4" />Saved!</> :
             <><Save className="h-4 w-4" />Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-display text-base font-semibold pb-3 border-b border-gray-100" style={{ color: '#1A2B4A' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
