'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, MapPin, Phone, Mail, Star, Award, Briefcase, Shield, Globe, AlertCircle, Pencil, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { getContractorProfile, type ContractorProfile } from '@/lib/api/contractor'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://contractor.kealee.com'

// ─── Status badge ─────────────────────────────────────────────────────────────

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ELIGIBLE:             { label: 'Verified',          color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    PENDING_VERIFICATION: { label: 'Pending Review',    color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    SUSPENDED:            { label: 'Suspended',         color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
    INELIGIBLE:           { label: 'Not Eligible',      color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
  }
  const cfg = map[status] ?? map['PENDING_VERIFICATION']
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <Shield className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<ContractorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    getContractorProfile()
      .then(setProfile)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-center gap-3 text-red-700">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">{error ?? 'Profile not found.'}</p>
      </div>
    )
  }

  const specialties = profile.csiDivisions ?? []
  const serviceArea = profile.serviceArea ?? ''

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Contractor Profile</h1>
          <p className="mt-1 text-sm text-gray-600">Your public profile and credentials</p>
        </div>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Link>
      </div>

      {/* Reverification notice */}
      {profile.requiresReverification && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Reverification Required</p>
            <p className="mt-0.5 text-amber-700">Your license or insurance details were updated and are pending re-verification by our team.</p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
            <User className="h-10 w-10" style={{ color: '#2ABFBF' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold" style={{ color: '#1A2B4A' }}>{profile.businessName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {profile.businessType ?? 'General Contractor'}
                  {profile.yearsInBusiness ? ` · ${profile.yearsInBusiness} years in business` : ''}
                </p>
              </div>
              <VerificationBadge status={profile.verificationStatus} />
            </div>

            {/* Contact info */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              {serviceArea && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />{serviceArea}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                  style={{ color: '#2ABFBF' }}
                >
                  <Globe className="h-3.5 w-3.5" />
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* Rating */}
            {profile.rating != null && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= Math.round(profile.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{profile.rating.toFixed(1)}</span>
              </div>
            )}

            {/* Specialties */}
            {specialties.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#1A8F8F' }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-5 text-sm text-gray-600 border-t border-gray-100 pt-5 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={Briefcase} label="Projects Completed" value={profile.completedProjects} />
        {profile.yearsInBusiness != null && (
          <StatCard icon={Award} label="Years in Business" value={profile.yearsInBusiness} />
        )}
        {profile.rating != null && (
          <StatCard icon={Star} label="Avg Rating" value={profile.rating.toFixed(1)} />
        )}
      </div>

      {/* Public Profile card */}
      {profile.slug && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold" style={{ color: '#1A2B4A' }}>Public Profile</h3>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: profile.isVerified ? 'rgba(5,150,105,0.08)' : 'rgba(107,114,128,0.08)',
                color: profile.isVerified ? '#059669' : '#6b7280',
              }}
            >
              {profile.isVerified ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {profile.isVerified ? 'Publicly Visible' : 'Not Yet Public'}
            </span>
          </div>
          <p className="mb-3 text-sm text-gray-500">
            {profile.isVerified
              ? 'Your profile is live and indexed by search engines.'
              : 'Your profile will become public once your account is verified.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-600">
              <Globe className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{BASE_URL}/{profile.slug}</span>
            </div>
            {profile.isVerified && (
              <a
                href={`${BASE_URL}/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: '#2ABFBF' }}
              >
                <ExternalLink className="h-4 w-4" />
                Preview
              </a>
            )}
          </div>
        </div>
      )}

      {/* Credentials */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-semibold mb-4" style={{ color: '#1A2B4A' }}>Credentials</h3>
        <div className="space-y-4">
          {/* Licenses */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">License Numbers</p>
            {(profile.allLicenses ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.allLicenses.map((lic) => (
                  <span key={lic} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-sm font-mono text-gray-700">
                    {lic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No license numbers on file. <Link href="/profile/edit" className="underline not-italic" style={{ color: '#2ABFBF' }}>Add one →</Link></p>
            )}
          </div>

          {/* Insurance */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Insurance</p>
            {profile.insuranceCarrier ? (
              <div className="flex flex-wrap gap-6 text-sm">
                <span className="text-gray-700">
                  <span className="text-gray-500 mr-1">Carrier:</span>{profile.insuranceCarrier}
                </span>
                {profile.insuranceExpiration && (
                  <span className="text-gray-700">
                    <span className="text-gray-500 mr-1">Expires:</span>
                    {new Date(profile.insuranceExpiration).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {profile.insuranceCoverageAmount != null && (
                  <span className="text-gray-700">
                    <span className="text-gray-500 mr-1">Coverage:</span>
                    ${profile.insuranceCoverageAmount.toLocaleString()}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No insurance on file. <Link href="/profile/edit" className="underline not-italic" style={{ color: '#2ABFBF' }}>Add one →</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
      <Icon className="mx-auto h-6 w-6" style={{ color: '#E8793A' }} />
      <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
