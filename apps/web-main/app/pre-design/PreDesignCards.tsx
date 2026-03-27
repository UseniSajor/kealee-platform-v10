'use client'

import Link from 'next/link'
import { ArrowRight, Home, Layers, Leaf } from 'lucide-react'

const TYPES = [
  {
    key: 'exterior',
    icon: Home,
    color: '#E8793A',
    title: 'Exterior Facade',
    description: 'Curb appeal, siding, windows, doors, roofline, and landscaping. Full exterior transformation.',
    from: '$149',
    badge: null,
  },
  {
    key: 'interior',
    icon: Layers,
    color: '#7C3AED',
    title: 'Interior Addition',
    description: 'Kitchen, bath, room addition, ADU, or full interior redesign. Every room, every detail.',
    from: '$149',
    badge: 'Popular',
  },
  {
    key: 'landscape',
    icon: Leaf,
    color: '#38A169',
    title: 'Landscape & Outdoor',
    description: 'Garden design, hardscape, outdoor living, irrigation, and backyard farming.',
    from: '$149',
    badge: null,
  },
]

export function PreDesignCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TYPES.map((t) => {
        const Icon = t.icon
        return (
          <Link
            key={t.key}
            href={`/pre-design/${t.key}`}
            className="group relative flex flex-col rounded-2xl border-2 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            style={{ borderColor: 'transparent' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = t.color
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
            }}
          >
            {t.badge && (
              <span
                className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: `${t.color}15`, color: t.color }}
              >
                {t.badge}
              </span>
            )}
            <div
              className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${t.color}15` }}
            >
              <Icon className="h-6 w-6" style={{ color: t.color }} />
            </div>
            <h2 className="text-xl font-bold font-display mb-2" style={{ color: '#1A2B4A' }}>
              {t.title}
            </h2>
            <p className="text-sm text-gray-500 flex-1">{t.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: t.color }}>
                From {t.from}
              </span>
              <ArrowRight
                className="h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-600"
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
