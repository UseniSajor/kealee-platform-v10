'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  BadgeCheck,
  Phone,
  Mail,
  Globe,
  Calendar,
  Award,
  Shield,
  FileCheck,
  Briefcase,
  MessageSquare,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

import { MarketingLayout, Badge, brand, shadows } from '@kealee/ui';

const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  gc: 'General Contractor',
  specialty_contractor: 'Specialty Contractor',
  architect: 'Architect',
  engineer: 'Engineer',
  supplier: 'Supplier',
  owner_developer: 'Owner/Developer',
};

const availabilityConfig: Record<string, { color: string; label: string; bg: string }> = {
  available: { color: '#38A169', label: 'Available Now', bg: '#E8F5E9' },
  busy: { color: '#DD6B20', label: 'Limited Availability', bg: '#FEF3E8' },
  unavailable: { color: '#E53E3E', label: 'Fully Booked', bg: '#FEE2E2' },
};

interface ProfilePageClientProps {
  profile: any;
}

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews' | 'services' | 'credentials'>('overview');
  const availConfig = availabilityConfig[profile.availability];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'services', label: 'Services & Pricing' },
    { id: 'credentials', label: 'Credentials' },
  ];

  // Rating breakdown mock
  const ratingBreakdown = [
    { stars: 5, count: 95, percentage: 75 },
    { stars: 4, count: 25, percentage: 20 },
    { stars: 3, count: 5, percentage: 4 },
    { stars: 2, count: 1, percentage: 0.8 },
    { stars: 1, count: 1, percentage: 0.2 },
  ];

  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Network', href: '/network' },
        { label: profile.businessName },
      ]}
    >
      {/* Cover Photo & Profile Header */}
      <section className="relative">
        {/* Cover Photo */}
        <div
          className="h-48 md:h-64 bg-gradient-to-r from-slate-700 to-slate-900"
          style={{
            backgroundImage: profile.coverPhoto ? `url(${profile.coverPhoto})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Profile Info Overlay */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 md:-mt-20 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              {/* Logo */}
              <div
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white flex items-center justify-center text-white text-3xl md:text-4xl font-bold flex-shrink-0"
                style={{
                  backgroundColor: brand.navy,
                  fontFamily: '"Clash Display", sans-serif',
                  boxShadow: shadows.level2,
                }}
              >
                {profile.businessName.substring(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1
                    className="text-2xl md:text-3xl font-bold"
                    style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                  >
                    {profile.businessName}
                  </h1>
                  {profile.badges.includes('verified') && (
                    <BadgeCheck className="w-6 h-6 text-blue-500" />
                  )}
                </div>

                <p className="text-gray-600 mb-2">{profile.principalName}</p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <Badge
                    text={PROFESSIONAL_TYPE_LABELS[profile.type]}
                    color="gray"
                    variant="subtle"
                  />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location.city}, {profile.location.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Member since {new Date(profile.memberSince).getFullYear()}
                  </span>
                </div>

                {/* Trade Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.trades.slice(0, 5).map((trade: string) => (
                    <span
                      key={trade}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${brand.teal}15`, color: '#1A8F8F' }}
                    >
                      {trade}
                    </span>
                  ))}
                  {profile.trades.length > 5 && (
                    <span className="text-xs text-gray-500">+{profile.trades.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* Rating & Availability */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5"
                        fill={i < Math.floor(profile.rating) ? brand.orange : 'transparent'}
                        stroke={i < Math.floor(profile.rating) ? brand.orange : brand.gray[300]}
                      />
                    ))}
                  </div>
                  <span
                    className="text-xl font-bold"
                    style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.navy }}
                  >
                    {profile.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">({profile.reviewCount} reviews)</span>
                </div>
                <span
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: availConfig.bg, color: availConfig.color }}
                >
                  {availConfig.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Badges */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {profile.badges.includes('licensed') && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Licensed
              </span>
            )}
            {profile.badges.includes('insured') && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Insured
              </span>
            )}
            {profile.badges.includes('background_checked') && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Background Checked
              </span>
            )}
            <div className="flex-1" />
            {profile.stats.responseTime && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="w-4 h-4" /> Responds in {profile.stats.responseTime}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-3">
            <button
              className="px-6 py-2.5 rounded-lg font-semibold text-white transition-colors"
              style={{ backgroundColor: brand.orange }}
            >
              Request Quote
            </button>
            <button
              className="px-6 py-2.5 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: brand.navy, color: 'white' }}
            >
              Invite to Bid
            </button>
            <button className="px-6 py-2.5 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Message
            </button>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="sticky top-16 z-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Bio */}
                <div>
                  <h2
                    className="text-xl font-bold mb-4"
                    style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                  >
                    About
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                </div>

                {/* Quick Stats */}
                <div>
                  <h2
                    className="text-xl font-bold mb-4"
                    style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                  >
                    Quick Stats
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile.stats.projectsCompleted && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div
                          className="text-2xl font-bold"
                          style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.navy }}
                        >
                          {profile.stats.projectsCompleted}+
                        </div>
                        <div className="text-sm text-gray-500">Projects</div>
                      </div>
                    )}
                    {profile.stats.yearsInBusiness && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div
                          className="text-2xl font-bold"
                          style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.navy }}
                        >
                          {profile.stats.yearsInBusiness}
                        </div>
                        <div className="text-sm text-gray-500">Years</div>
                      </div>
                    )}
                    {profile.stats.onTimeRate && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div
                          className="text-2xl font-bold"
                          style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.navy }}
                        >
                          {profile.stats.onTimeRate}
                        </div>
                        <div className="text-sm text-gray-500">On-Time</div>
                      </div>
                    )}
                    {profile.stats.repeatClientRate && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div
                          className="text-2xl font-bold"
                          style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.navy }}
                        >
                          {profile.stats.repeatClientRate}
                        </div>
                        <div className="text-sm text-gray-500">Repeat Clients</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <h2
                    className="text-xl font-bold mb-4"
                    style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                  >
                    Specialties
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((specialty: string) => (
                      <Badge key={specialty} text={specialty} color="teal" variant="subtle" size="md" />
                    ))}
                  </div>
                </div>

                {/* Service Area */}
                <div>
                  <h2
                    className="text-xl font-bold mb-4"
                    style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                  >
                    Service Area
                  </h2>
                  <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
                    Map placeholder - Serves {profile.serviceAreas.join(', ')}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3
                    className="font-bold mb-4"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
                  >
                    Contact
                  </h3>
                  <div className="space-y-3">
                    {profile.phone && (
                      <a href={`tel:${profile.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900">
                        <Phone className="w-4 h-4" />
                        {profile.phone}
                      </a>
                    )}
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900">
                        <Mail className="w-4 h-4" />
                        {profile.email}
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener" className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900">
                        <Globe className="w-4 h-4" />
                        Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Sectors */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3
                    className="font-bold mb-4"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
                  >
                    Sectors
                  </h3>
                  <div className="space-y-2">
                    {profile.sectors.map((sector: string) => (
                      <div key={sector} className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {sector.charAt(0).toUpperCase() + sector.slice(1).replace('_', '-')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div>
              <h2
                className="text-xl font-bold mb-6"
                style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
              >
                Portfolio
              </h2>
              {profile.portfolio.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.portfolio.map((project: any) => (
                    <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="aspect-video bg-gray-200 flex items-center justify-center text-gray-400">
                        Project Image
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1" style={{ color: brand.navy }}>
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{project.location}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                        {project.projectValue && (
                          <p
                            className="text-sm font-semibold mt-2"
                            style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.orange }}
                          >
                            ${project.projectValue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No portfolio projects yet.
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2
                  className="text-xl font-bold mb-6"
                  style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                >
                  Reviews
                </h2>
                {profile.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {profile.reviews.map((review: any) => (
                      <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{review.reviewerName}</span>
                              {review.verified && (
                                <Badge text="Verified" color="green" size="sm" variant="subtle" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-4 h-4"
                                  fill={i < review.rating ? brand.orange : 'transparent'}
                                  stroke={i < review.rating ? brand.orange : brand.gray[300]}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold mb-2">{review.title}</h4>
                        )}
                        <p className="text-gray-600 text-sm">{review.content}</p>
                        {review.projectType && (
                          <p className="text-xs text-gray-400 mt-3">Project: {review.projectType}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No reviews yet.
                  </div>
                )}
              </div>

              {/* Rating Breakdown */}
              <div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold mb-4" style={{ color: brand.navy }}>
                    Rating Breakdown
                  </h3>
                  <div className="space-y-2">
                    {ratingBreakdown.map((item) => (
                      <div key={item.stars} className="flex items-center gap-2">
                        <span className="text-sm w-12">{item.stars} stars</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${item.percentage}%`, backgroundColor: brand.orange }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-8">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              <h2
                className="text-xl font-bold mb-6"
                style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
              >
                Services & Pricing
              </h2>
              {profile.services.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Service</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Price</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profile.services.map((service: any) => (
                        <tr key={service.id}>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{service.name}</div>
                            <div className="text-sm text-gray-500">{service.description}</div>
                          </td>
                          <td className="px-4 py-4">
                            {service.priceType === 'fixed' && service.price !== null ? (
                              <span
                                className="font-semibold"
                                style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.orange }}
                              >
                                {service.price === 0 ? 'Free' : `$${service.price.toLocaleString()}`}
                              </span>
                            ) : service.priceType === 'project' && service.price ? (
                              <span
                                className="font-semibold"
                                style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.orange }}
                              >
                                From ${service.price.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-500">Request Quote</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              className="text-sm font-medium px-4 py-2 rounded-lg"
                              style={{ backgroundColor: `${brand.orange}15`, color: brand.orange }}
                            >
                              Request Quote
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No services listed yet.
                </div>
              )}
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div className="space-y-8">
              {/* Licenses */}
              <div>
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                >
                  Licenses
                </h2>
                {profile.licenses?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {profile.licenses.map((license: any) => (
                      <div key={license.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${brand.success}15` }}
                        >
                          <FileCheck className="w-5 h-5" style={{ color: brand.success }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{license.type}</span>
                            {license.verified && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">#{license.number} ({license.state})</p>
                          <p className="text-xs text-gray-400">Expires: {license.expirationDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No licenses listed.</p>
                )}
              </div>

              {/* Insurance */}
              <div>
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                >
                  Insurance
                </h2>
                {profile.insurance?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {profile.insurance.map((ins: any) => (
                      <div key={ins.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${brand.teal}15` }}
                        >
                          <Shield className="w-5 h-5" style={{ color: brand.teal }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{ins.type.replace('_', ' ')}</span>
                            {ins.verified && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{ins.carrier}</p>
                          <p className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                            ${ins.coverageAmount.toLocaleString()} coverage
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No insurance listed.</p>
                )}
              </div>

              {/* Certifications */}
              <div>
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                >
                  Certifications
                </h2>
                {profile.certifications?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {profile.certifications.map((cert: any) => (
                      <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${brand.orange}15` }}
                        >
                          <Award className="w-5 h-5" style={{ color: brand.orange }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{cert.name}</span>
                            {cert.verified && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{cert.issuingOrg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No certifications listed.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}
