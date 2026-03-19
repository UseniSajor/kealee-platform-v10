import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckCircle, MapPin, Star, Briefcase, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ContractorProfile {
  id: string
  slug: string
  companyName: string
  tradeSpecialties: string[]
  serviceAreas: string[]
  isVerified: boolean
  rating: number | null
  reviewCount: number
  bio: string | null
  listingTier: 'BASIC' | 'PRO' | 'PREMIUM'
  city: string | null
  state: string | null
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.kealee.com'

async function getProfile(slug: string): Promise<ContractorProfile | null> {
  try {
    const res = await fetch(`${API}/marketplace/contractors/profile/${slug}`, {
      next: { revalidate: 3600 }, // 1 hour cache
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const profile = await getProfile(params.slug)
  if (!profile) return { title: 'Contractor Not Found' }

  const primaryTrade = profile.tradeSpecialties?.[0] ?? 'Contractor'
  const location     = profile.city && profile.state
    ? `${profile.city}, ${profile.state}` : profile.state ?? 'the US'
  const areas        = profile.serviceAreas?.slice(0, 3).join(', ') ?? location

  return {
    title: `${profile.companyName} — ${primaryTrade} Contractor in ${profile.city ?? ''}, ${profile.state ?? ''} | Kealee`,
    description: `Verified ${primaryTrade} contractor serving ${areas}. ${profile.reviewCount} projects completed on Kealee.`,
    openGraph: {
      title:       `${profile.companyName} | Kealee Verified Contractor`,
      description: `${primaryTrade} contractor — ${areas}`,
      type:        'website',
    },
  }
}

export default async function ContractorProfilePage(
  { params }: { params: { slug: string } }
) {
  const profile = await getProfile(params.slug)
  if (!profile) notFound()

  const primaryTrade = profile.tradeSpecialties?.[0] ?? 'General Contractor'
  const location     = [profile.city, profile.state].filter(Boolean).join(', ') || 'US'

  // JSON-LD LocalBusiness schema
  const jsonLd = {
    '@context':       'https://schema.org',
    '@type':          'LocalBusiness',
    name:             profile.companyName,
    description:      profile.bio ?? `${primaryTrade} serving ${location}`,
    areaServed:       profile.serviceAreas?.map(area => ({ '@type': 'City', name: area })),
    hasCredential:    profile.isVerified ? [{ '@type': 'EducationalOccupationalCredential', name: 'Kealee Verified' }] : [],
    aggregateRating:  profile.rating ? {
      '@type':       'AggregateRating',
      ratingValue:    profile.rating,
      reviewCount:    profile.reviewCount,
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-start gap-6">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ backgroundColor: '#2ABFBF' }}>
            {profile.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{profile.companyName}</h1>
              {profile.isVerified && (
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}>
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}
              {profile.listingTier !== 'BASIC' && (
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: profile.listingTier === 'PREMIUM'
                      ? 'rgba(124,58,237,0.1)' : 'rgba(232,121,58,0.1)',
                    color: profile.listingTier === 'PREMIUM' ? '#7C3AED' : '#E8793A',
                  }}>
                  {profile.listingTier}
                </span>
              )}
            </div>

            <p className="mt-1 text-lg font-medium text-gray-600">{primaryTrade}</p>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {location}
                </span>
              )}
              {profile.rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {profile.rating.toFixed(1)} · {profile.reviewCount} projects
                </span>
              )}
              {!profile.rating && profile.reviewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {profile.reviewCount} projects completed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Trades + Service areas */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          {profile.tradeSpecialties?.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {profile.tradeSpecialties.map(trade => (
                  <span key={trade} className="rounded-full px-3 py-1 text-sm font-medium"
                    style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}>
                    {trade}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.serviceAreas?.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Service Areas</h2>
              <div className="flex flex-wrap gap-2">
                {profile.serviceAreas.map(area => (
                  <span key={area} className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'rgba(26,43,74,0.03)' }}>
          <h2 className="mb-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>
            Ready to work with {profile.companyName}?
          </h2>
          <p className="mb-6 text-gray-500">Start your project on Kealee and get matched with verified contractors like this one.</p>
          <Link
            href={`/homeowners/start?contractor=${profile.slug}`}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: '#E8793A' }}
          >
            Request a quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </>
  )
}
