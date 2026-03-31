import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Home, Leaf, Layers, PaintBucket, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Concept Engine — Kealee',
  description: 'Choose your design path. Exterior, Garden, Whole Home, Interior Reno, or Developer concept packages — AI-powered and property-specific.',
}

const PATHS = [
  {
    icon:        Home,
    color:       '#2ABFBF',
    title:       'Exterior Design',
    description: 'Facade, curb appeal, landscaping, hardscaping, and outdoor living — see your exterior transformed.',
    href:        '/concept-engine/homeowner',
    price:       'From $395 · Consultation included',
  },
  {
    icon:        Leaf,
    color:       '#38A169',
    title:       'Home Farming & Garden',
    description: 'Garden design, raised beds, backyard farming, irrigation systems, and greenhouse build.',
    href:        '/concept-engine/garden',
    price:       'From $395 · Consultation included',
    badge:       'New',
  },
  {
    icon:        Layers,
    color:       '#E8793A',
    title:       'Whole Home Renovation',
    description: 'Full property transformation — floor plans, structural changes, systems, and every room redesigned.',
    href:        '/concept-engine/whole-home',
    price:       'From $585 · Consultation included',
  },
  {
    icon:        PaintBucket,
    color:       '#7C3AED',
    title:       'Interior Reno & Addition',
    description: 'Kitchen, bath, room additions, ADUs, and complete interior redesign — all interior and addition work.',
    href:        '/concept-engine/interior-reno',
    price:       'From $395 · Consultation included',
  },
  {
    icon:        Building2,
    color:       '#1A2B4A',
    title:       'Developer / Investor',
    description: 'Commercial, mixed-use, or multifamily. Business-grade concept with feasibility and entitlement brief.',
    href:        '/concept-engine/developer',
    price:       'From $585 · Feasibility add-ons available',
  },
]

export default function ConceptEnginePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
          >
            AI Concept Engine
          </span>
          <h1 className="mt-4 text-4xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Choose your design path
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Every path delivers AI-powered, property-specific concept designs — tailored to your project type.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PATHS.map(path => (
            <Link
              key={path.href}
              href={path.href}
              className="group flex flex-col rounded-2xl border-2 bg-white p-7 transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ borderColor: path.color }}
            >
              {path.badge && (
                <span
                  className="mb-3 self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: `${path.color}18`, color: path.color }}
                >
                  {path.badge}
                </span>
              )}
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${path.color}14` }}
              >
                <path.icon className="h-6 w-6" style={{ color: path.color }} />
              </div>
              <h2 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>{path.title}</h2>
              <p className="mt-2 text-sm text-gray-500 flex-1 leading-relaxed">{path.description}</p>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: path.color }}>
                Start Concept <ArrowRight className="h-4 w-4" />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">{path.price}</p>
            </Link>
          ))}
        </div>

        {/* Something else */}
        <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-7">
          <div className="flex items-center justify-between gap-6 flex-col sm:flex-row">
            <div>
              <h2 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Something else?</h2>
              <p className="mt-1 text-sm text-gray-500">Not sure where your project fits? Tell us and we&apos;ll guide you to the right path.</p>
            </div>
            <Link
              href="/intake/other"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              Tell us about it <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Pre-design notice */}
        <div
          className="mt-8 rounded-xl border border-orange-200 p-4 text-center text-sm"
          style={{ backgroundColor: 'rgba(232,121,58,0.05)' }}
        >
          <span className="font-semibold" style={{ color: '#E8793A' }}>Note:</span>
          <span className="ml-1 text-gray-600">AI concept packages are pre-design visualization services — not permit-ready plans. Need permit-ready architectural drawings?</span>{' '}
          <Link href="/design-services" className="font-semibold hover:underline" style={{ color: '#E8793A' }}>
            See Design Services →
          </Link>
        </div>
      </div>
    </div>
  )
}
