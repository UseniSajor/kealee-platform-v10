import Link from 'next/link'
import { Star, MapPin, Shield, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export interface ContractorCardData {
  id: string
  name: string
  company: string
  trade: string
  category: string
  rating: number
  reviewCount: number
  location: string
  yearsExperience: number
  projectsCompleted: number
  isVerified: boolean
  isInsured: boolean
  responseTime: string
  priceRange: 'budget' | 'mid' | 'premium'
  specialties: string[]
  bio: string
  initials?: string
  accentColor?: string
}

const PRICE_LABELS = {
  budget: '$',
  mid: '$$',
  premium: '$$$',
}

interface MarketplaceCardProps {
  contractor: ContractorCardData
}

export function MarketplaceCard({ contractor: c }: MarketplaceCardProps) {
  const accent = c.accentColor ?? '#2ABFBF'
  const initials = c.initials ?? c.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="group flex flex-col rounded-xl border border-gray-200 bg-white transition-all hover:border-teal-200 hover:shadow-md">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold leading-tight" style={{ color: '#1A2B4A' }}>
                  {c.name}
                </h3>
                <p className="text-xs text-gray-500">{c.company}</p>
              </div>
              <span className="text-sm font-bold text-gray-400">{PRICE_LABELS[c.priceRange]}</span>
            </div>

            {/* Rating */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className="h-3 w-3"
                    fill={star <= Math.round(c.rating) ? '#E8793A' : 'transparent'}
                    stroke={star <= Math.round(c.rating) ? '#E8793A' : '#CBD5E0'}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold" style={{ color: '#1A2B4A' }}>
                {c.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">({c.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-gray-500">{c.bio}</p>

        {/* Trust badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="teal">
            <span className="flex items-center gap-1">
              {c.trade}
            </span>
          </Badge>
          {c.isVerified && (
            <Badge variant="green">
              <span className="flex items-center gap-1">
                <Shield className="h-2.5 w-2.5" /> Verified
              </span>
            </Badge>
          )}
          {c.isInsured && (
            <Badge variant="teal">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-2.5 w-2.5" /> Insured
              </span>
            </Badge>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
        <div className="px-3 py-3 text-center">
          <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>
            {c.yearsExperience}yr
          </p>
          <p className="text-[10px] text-gray-400">Experience</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>
            {c.projectsCompleted}
          </p>
          <p className="text-[10px] text-gray-400">Projects</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-sm font-bold" style={{ color: '#1A2B4A' }}>
            <Clock className="h-3 w-3 text-gray-400" />
            {c.responseTime}
          </p>
          <p className="text-[10px] text-gray-400">Response</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="h-3 w-3" />
          {c.location}
        </span>
        <Link
          href={`/marketplace/contractor/${c.id}`}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}
