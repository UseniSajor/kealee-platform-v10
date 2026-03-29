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
    href:        '/concept-engine/exterior',
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

        <p className="mt-10 text-center text-sm text-gray-400">
          Not sure which path fits?{' '}
          <Link href="/contact" className="font-medium hover:underline" style={{ color: '#1A2B4A' }}>
            Talk to our team
          </Link>
        </p>
      </div>
    </div>
  )
}
