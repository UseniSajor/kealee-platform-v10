'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type VerificationState =
  | 'idle'
  | 'checking'
  | 'verified'
  | 'expired'
  | 'suspended'
  | 'not_found'
  | 'error'

interface LicenseResult {
  found: boolean
  state?: string
  licenseNum?: string
  companyName?: string
  licenseType?: string
  licenseClass?: string
  status?: string
  isActive?: boolean
  expiresAt?: string
  source?: string
  message?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATES = [
  { value: 'VA', label: 'Virginia' },
  { value: 'MD', label: 'Maryland' },
  { value: 'DC', label: 'District of Columbia' },
]

const LICENSE_FORMATS: Record<string, { placeholder: string; hint: string }> = {
  VA: {
    placeholder: 'e.g. 2705-026448-LIC',
    hint: 'VA DPOR format: XXXX-XXXXXX-LIC or CLASS_A/B/C prefix',
  },
  MD: {
    placeholder: 'e.g. MHIC123456',
    hint: 'MD MHIC format: MHIC followed by 6 digits',
  },
  DC: {
    placeholder: 'e.g. ECC900000',
    hint: 'DC DLCP license number from your license card',
  },
}

const STATE_LOOKUP_LINKS: Record<string, string> = {
  VA: 'https://www.dpor.virginia.gov/LicenseLookup',
  MD: 'https://www.dllr.state.md.us/license/mhicquery.shtml',
  DC: 'https://dlcp.dc.gov/service/verify-license',
}

const SPECIALTIES = [
  'General Contracting — Residential',
  'General Contracting — Commercial',
  'General Contracting — Mixed Use',
  'HVAC / Mechanical',
  'Electrical',
  'Plumbing',
  'Concrete / Foundation',
  'Steel / Structural',
  'Roofing',
  'Drywall / Interiors',
  'Site Work / Earthwork',
  'Custom Homes',
  'ADU / Addition',
  'Historic Renovation',
  'Other',
]

const inputClass =
  'w-full px-4 py-3 border border-[#E5DFD5] rounded-lg text-[15px] outline-none focus:border-[#0D1F3C] focus:ring-2 focus:ring-[#0D1F3C]/10 transition-colors'

// ── Verification Badge ────────────────────────────────────────────────────────

function VerificationBadge({ state, result }: { state: VerificationState; result: LicenseResult | null }) {
  if (state === 'idle') return null

  if (state === 'checking') {
    return (
      <div className="flex items-center gap-2 p-3.5 bg-[#F3F0EA] rounded-xl text-sm text-[#7A6E60] mt-3">
        <span className="inline-block animate-spin">&#x27F3;</span>
        Verifying license...
      </div>
    )
  }

  if (state === 'verified') {
    return (
      <div className="p-4 bg-green-50 border-[1.5px] border-green-300 rounded-xl mt-3">
        <div className="flex justify-between items-center text-[15px] font-bold text-green-800 mb-3">
          <span>&#10003; License Verified</span>
          <span className="text-[11px] font-semibold text-green-300 tracking-wide">
            {result?.source === 'live' ? '\u25CF Live' : '\u25CF Registry'}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-3 text-[13px]">
            <span className="text-[#7A6E60] min-w-[100px]">Company</span>
            <span className="text-[#0D1F3C] font-medium">{result?.companyName}</span>
          </div>
          <div className="flex gap-3 text-[13px]">
            <span className="text-[#7A6E60] min-w-[100px]">License Type</span>
            <span className="text-[#0D1F3C] font-medium">
              {result?.licenseClass ? `Class ${result.licenseClass} — ` : ''}
              {result?.licenseType}
            </span>
          </div>
          <div className="flex gap-3 text-[13px]">
            <span className="text-[#7A6E60] min-w-[100px]">Status</span>
            <span className="text-green-800 font-bold">{result?.status}</span>
          </div>
          {result?.expiresAt && (
            <div className="flex gap-3 text-[13px]">
              <span className="text-[#7A6E60] min-w-[100px]">Expires</span>
              <span className="text-[#0D1F3C] font-medium">
                {new Date(result.expiresAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="p-4 bg-orange-50 border-[1.5px] border-orange-300 rounded-xl mt-3 text-[#A84E10] text-sm">
        <div className="font-bold mb-1">&#9888; License Expired</div>
        <p className="text-[13px] m-0">
          This license expired on{' '}
          {result?.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'an unknown date'}.
          You must renew your license before joining the Kealee Builder Network.{' '}
          <a
            href={STATE_LOOKUP_LINKS[result?.state ?? 'VA']}
            target="_blank"
            rel="noreferrer"
            className="text-[#A84E10] underline ml-1"
          >
            Renew &rarr;
          </a>
        </p>
      </div>
    )
  }

  if (state === 'suspended') {
    return (
      <div className="p-4 bg-red-50 border-[1.5px] border-red-300 rounded-xl mt-3 text-[#8B2A0A] text-sm">
        <div className="font-bold mb-1">&#10007; License Suspended</div>
        <p className="text-[13px] m-0">
          This license has been suspended. Contact your state licensing board for details.
          Suspended licenses cannot be used to join the Kealee Builder Network.
        </p>
      </div>
    )
  }

  if (state === 'not_found') {
    return (
      <div className="p-4 bg-[#F3F0EA] border-[1.5px] border-[#C8BFB0] rounded-xl mt-3 text-[#3D3528] text-sm">
        <div className="font-bold mb-1">License Not Found</div>
        <p className="text-[13px] m-0">
          No active license found with that number in {result?.state ?? 'this state'}.
          Check your license number and try again.{' '}
          <a
            href={STATE_LOOKUP_LINKS[result?.state ?? 'VA']}
            target="_blank"
            rel="noreferrer"
            className="text-[#0D1F3C] underline ml-1"
          >
            Look up your license &rarr;
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="p-3.5 bg-[#F3F0EA] rounded-xl mt-3 text-[#7A6E60] text-[13px]">
      Verification temporarily unavailable. Your application will be reviewed manually within 24
      hours.
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BuilderNetworkSignup() {
  const [selectedState, setSelectedState] = useState('VA')
  const [licenseNum, setLicenseNum] = useState('')
  const [verifyState, setVerifyState] = useState<VerificationState>('idle')
  const [licenseResult, setLicenseResult] = useState<LicenseResult | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 2 form data
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [yearsInBiz, setYearsInBiz] = useState('')
  const [insuranceCo, setInsuranceCo] = useState('')
  const [bondAmount, setBondAmount] = useState('')

  const verifyLicense = useCallback(async () => {
    if (!licenseNum.trim()) return

    setVerifyState('checking')
    setLicenseResult(null)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(
        `${apiBase}/api/license/verify?num=${encodeURIComponent(licenseNum.trim())}&state=${selectedState}`
      )
      const data: LicenseResult = await res.json()
      setLicenseResult(data)

      if (!data.found) {
        setVerifyState('not_found')
      } else if (
        data.status?.toLowerCase() === 'suspended' ||
        data.status?.toLowerCase() === 'revoked'
      ) {
        setVerifyState('suspended')
      } else if (!data.isActive) {
        setVerifyState('expired')
      } else {
        setVerifyState('verified')
        if (data.companyName) setContactName((prev) => prev || data.companyName!)
      }
    } catch {
      setVerifyState('error')
    }
  }, [licenseNum, selectedState])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${apiBase}/api/license/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'pending', // will be replaced with real userId after auth
          state: selectedState,
          licenseNum: licenseNum.trim().toUpperCase(),
          companyName: licenseResult?.companyName,
          licenseType: licenseResult?.licenseType,
          licenseClass: licenseResult?.licenseClass,
          contactName,
          email,
          phone,
          specialty,
          yearsInBiz: parseInt(yearsInBiz) || 0,
          insuranceCo,
          bondAmount,
        }),
      })

      if (res.ok) {
        setStep(3)
      } else {
        const err = await res.json()
        alert(err.error ?? 'Submission failed. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 3 — Success
  if (step === 3) {
    return (
      <div className="max-w-xl mx-auto px-6 lg:px-10 py-16 text-center">
        <div className="text-6xl mb-5">&#10003;</div>
        <h2
          className="text-4xl font-bold mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
        >
          Application Received.
        </h2>
        <p className="text-base leading-relaxed text-[#7A6E60] max-w-md mx-auto mb-7">
          Your license has been verified. Our team will review your insurance and references within
          2 business days. You&apos;ll receive an email when your Builder Network profile goes live.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-7 py-3.5 rounded-lg font-semibold text-[15px] text-white"
          style={{ background: '#0D1F3C' }}
        >
          Back to Marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-6 lg:px-10 py-16">
      {/* Progress steps */}
      <div className="flex items-center justify-center mb-12 gap-0">
        {['License Verification', 'Business Details', 'Review'].map((label, i) => (
          <div key={label} className="flex flex-col items-center flex-1 gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
              style={{
                background: step > i + 1 ? '#1A5C32' : step === i + 1 ? '#0D1F3C' : '#E5DFD5',
                color: step >= i + 1 ? 'white' : '#A89888',
              }}
            >
              {step > i + 1 ? '\u2713' : i + 1}
            </div>
            <span
              className="text-xs text-center"
              style={{
                color: step === i + 1 ? '#0D1F3C' : '#A89888',
                fontWeight: step === i + 1 ? 600 : 400,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1 — License Verification */}
      {step === 1 && (
        <div>
          <div className="mb-9">
            <div className="text-xs font-bold tracking-[2.5px] uppercase mb-2.5 text-[#196B5E]">
              Step 1 of 2
            </div>
            <h2
              className="text-4xl font-bold mb-2.5 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
            >
              Verify Your Contractor License
            </h2>
            <p className="text-[15px] font-light leading-relaxed text-[#7A6E60]">
              All contractors in the Kealee Builder Network are license-verified before their
              profile goes live. Enter your state and license number below.
            </p>
          </div>

          {/* State selector */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">
              Licensing State
            </label>
            <div className="flex gap-2.5">
              {STATES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setSelectedState(s.value)
                    setVerifyState('idle')
                    setLicenseResult(null)
                  }}
                  className="flex-1 py-2.5 rounded-lg border-[1.5px] text-sm font-semibold cursor-pointer transition-all"
                  style={{
                    background: selectedState === s.value ? '#0D1F3C' : 'white',
                    color: selectedState === s.value ? 'white' : '#3D3528',
                    borderColor: selectedState === s.value ? '#0D1F3C' : '#E5DFD5',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* License number input */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">
              License Number
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={licenseNum}
                onChange={(e) => {
                  setLicenseNum(e.target.value)
                  setVerifyState('idle')
                }}
                placeholder={LICENSE_FORMATS[selectedState]?.placeholder}
                className={inputClass}
                onKeyDown={(e) => e.key === 'Enter' && verifyLicense()}
              />
              <button
                onClick={verifyLicense}
                disabled={!licenseNum.trim() || verifyState === 'checking'}
                className="px-5 py-3 rounded-lg border-none text-sm font-semibold cursor-pointer text-white whitespace-nowrap disabled:opacity-50 transition-opacity"
                style={{ background: '#196B5E' }}
              >
                {verifyState === 'checking' ? 'Checking...' : 'Verify \u2192'}
              </button>
            </div>
            <p className="text-xs text-[#A89888] mt-1">
              {LICENSE_FORMATS[selectedState]?.hint}{' '}
              <a
                href={STATE_LOOKUP_LINKS[selectedState]}
                target="_blank"
                rel="noreferrer"
                className="text-[#0D1F3C] underline"
              >
                Look up your license &rarr;
              </a>
            </p>
          </div>

          {/* Verification result */}
          <VerificationBadge state={verifyState} result={licenseResult} />

          {verifyState === 'verified' && (
            <button
              onClick={() => setStep(2)}
              className="mt-7 w-full px-7 py-3.5 rounded-lg border-none text-[15px] font-semibold cursor-pointer text-white"
              style={{ background: '#0D1F3C' }}
            >
              Continue — Add Business Details &rarr;
            </button>
          )}

          {(verifyState === 'not_found' || verifyState === 'error') && (
            <p className="text-[13px] text-[#A89888] mt-4 text-center">
              Can&apos;t verify automatically?{' '}
              <Link href="/contact" className="text-[#0D1F3C] underline">
                Contact our team
              </Link>{' '}
              and we&apos;ll verify manually within 24 hours.
            </p>
          )}
        </div>
      )}

      {/* Step 2 — Business Details */}
      {step === 2 && (
        <div>
          <div className="mb-9">
            <div className="text-xs font-bold tracking-[2.5px] uppercase mb-2.5 text-[#196B5E]">
              Step 2 of 2
            </div>
            <h2
              className="text-4xl font-bold mb-2.5 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
            >
              Business Details
            </h2>
            <p className="text-[15px] font-light leading-relaxed text-[#7A6E60]">
              License verified:{' '}
              <strong className="text-green-800">
                {licenseResult?.licenseClass ? `Class ${licenseResult.licenseClass} — ` : ''}
                {licenseResult?.licenseType}
              </strong>{' '}
              &middot; {licenseResult?.companyName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-0">
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0D1F3C]">
                Primary Contact Name
              </label>
              <input
                className={inputClass}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0D1F3C]">Business Email</label>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0D1F3C]">Phone</label>
              <input
                className={inputClass}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(202) 555-0100"
              />
            </div>
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0D1F3C]">Years in Business</label>
              <input
                className={inputClass}
                type="number"
                min="1"
                value={yearsInBiz}
                onChange={(e) => setYearsInBiz(e.target.value)}
                placeholder="e.g. 8"
              />
            </div>
            <div className="mb-5 flex flex-col gap-1.5 col-span-2">
              <label className="text-[13px] font-semibold text-[#0D1F3C]">Primary Specialty</label>
              <select
                className={`${inputClass} bg-white`}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">Select primary specialty...</option>
                {SPECIALTIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0D1F3C]">Insurance Company</label>
              <input
                className={inputClass}
                value={insuranceCo}
                onChange={(e) => setInsuranceCo(e.target.value)}
                placeholder="e.g. CNA, Travelers, Zurich"
              />
            </div>
            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0D1F3C]">Bond Amount</label>
              <input
                className={inputClass}
                value={bondAmount}
                onChange={(e) => setBondAmount(e.target.value)}
                placeholder="e.g. $500,000"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-7">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3.5 rounded-lg border-[1.5px] border-[#E5DFD5] text-[15px] font-semibold cursor-pointer text-[#0D1F3C] bg-transparent"
            >
              &larr; Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !contactName || !email || !specialty}
              className="flex-1 px-7 py-3.5 rounded-lg border-none text-[15px] font-semibold cursor-pointer text-white disabled:opacity-50 transition-opacity"
              style={{ background: '#0D1F3C' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application \u2192'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
