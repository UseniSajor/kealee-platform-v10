'use client'

import { User, MapPin, Phone, Mail, Star, Award, Briefcase, Camera } from 'lucide-react'

const PORTFOLIO_ITEMS = [
  { id: '1', title: 'Modern Kitchen Remodel', type: 'Residential', year: '2025', value: '$92,000', image: '/placeholder-project-1.jpg' },
  { id: '2', title: 'ADU Construction - South Lamar', type: 'New Build', year: '2025', value: '$165,000', image: '/placeholder-project-2.jpg' },
  { id: '3', title: 'Office Build-Out - Domain', type: 'Commercial', year: '2024', value: '$280,000', image: '/placeholder-project-3.jpg' },
  { id: '4', title: 'Pool House & Outdoor Kitchen', type: 'Residential', year: '2024', value: '$148,000', image: '/placeholder-project-4.jpg' },
]

const REVIEWS = [
  { id: '1', author: 'Jennifer Adams', rating: 5, text: 'Excellent work on our kitchen remodel. On time and on budget. Highly recommended!', date: '2025-12-15' },
  { id: '2', author: 'Mark Thompson', rating: 5, text: 'Professional team, great communication throughout the project.', date: '2025-10-20' },
  { id: '3', author: 'Sarah Kim', rating: 4, text: 'Good quality work. Minor scheduling delays but overall very satisfied.', date: '2025-08-05' },
]

export default function ProfilePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Contractor Profile</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your public profile and portfolio</p>
      </div>

      {/* Profile header */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
            <User className="h-12 w-12" style={{ color: '#2ABFBF' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold" style={{ color: '#1A2B4A' }}>Summit Construction LLC</h2>
                <p className="text-sm text-gray-600">General Contractor | Licensed since 2018</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Austin, TX</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />(512) 555-0142</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />info@summitconstruction.com</span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= 4.7 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-1 text-sm font-medium" style={{ color: '#1A2B4A' }}>4.7</span>
                    <span className="text-xs text-gray-500">(23 reviews)</span>
                  </div>
                </div>
              </div>
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Edit Profile
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['Kitchen Remodels', 'ADU Construction', 'Commercial TI', 'Additions', 'Outdoor Living'].map((spec) => (
                <span key={spec} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#1A8F8F' }}>{spec}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <Briefcase className="mx-auto h-6 w-6" style={{ color: '#E8793A' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>47</p>
          <p className="text-xs text-gray-500">Projects Completed</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <Award className="mx-auto h-6 w-6" style={{ color: '#E8793A' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>8</p>
          <p className="text-xs text-gray-500">Years Experience</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <Star className="mx-auto h-6 w-6" style={{ color: '#E8793A' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>4.7</p>
          <p className="text-xs text-gray-500">Avg Rating</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
          <Camera className="mx-auto h-6 w-6" style={{ color: '#E8793A' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>126</p>
          <p className="text-xs text-gray-500">Portfolio Photos</p>
        </div>
      </div>

      {/* Portfolio */}
      <div className="mb-8">
        <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Portfolio</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PORTFOLIO_ITEMS.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="h-32 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(42,191,191,0.15) 0%, rgba(26,43,74,0.1) 100%)' }}>
                <Camera className="h-8 w-8" style={{ color: '#2ABFBF' }} />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{item.title}</p>
                <p className="text-xs text-gray-500">{item.type} | {item.year} | {item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Recent Reviews</h2>
        <div className="space-y-3">
          {REVIEWS.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: '#1A2B4A' }}>{review.author}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
              <p className="text-sm text-gray-600">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
