import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Home, Leaf, Layers, PaintBucket, Building2, Users, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Get Started — Kealee',
  description: 'Start your AI concept design or join as a contractor. Choose your path and get started in minutes.',
}

const CONCEPT_PATHS = [
  {
    icon:        Home,
    color:       '#2ABFBF',
    title:       'Exterior Design',
    description: 'Facade, curb appeal, landscaping, hardscaping, and outdoor living.',
    href:        '/concept-engine/homeowner',
    price:       'From $395',
    tag:         'Most Popular',
  },
  {
    icon:        Leaf,
    color:       '#38A169',
    title:       'Home Farming & Garden',
    description: 'Raised beds, backyard farming, irrigation, and greenhouse design.',
    href:        '/concept-engine/garden',
    price:       'From $395',
    tag:         'New',
  },
  {
    icon:        Layers,
    color:       '#E8793A',
    title:       'Whole Home Renovation',
    description: 'Full home transformation — floor plans, structure, systems, every room.',
    href:        '/concept-engine/whole-home',
    price:       'From $585',
  },
  {
    icon:        PaintBucket,
    color:       '#7C3AED',
    title:       'Interior Reno & Addition',
    description: 'Kitchen, bath, room additions, ADUs, and complete interior redesign.',
    href:        '/concept-engine/interior-reno',
    price:       'From $395',
  },
  {
    icon:        Building2,
    color:       '#1A2B4A',
    title:       'Developer / Investor',
    description: 'Commercial, mixed-use, or multifamily project concept and feasibility.',
    href:        '/concept-engine/developer',
    price:       'From $585',
  },
]

const JOIN_PATHS = [
  {
    icon:        Users,
    color:       '#E8793A',
    title:       'Join as GC / Builder / Contractor',
    description: 'Get verified, win matched project bids, and manage your business on the Kealee platform.',
    href:        '/contractor/register',
    cta:         'Apply Now',
  },
  {
    icon:        Building2,
    color:       '#1A2B4A',
    title:       'Developer / Investor Access',
    description: 'Land intelligence, feasibility tools, capital stack management, and portfolio tracking.',
    href:        '/login',
    cta:         'Sign In or Register',
  },
]

export default function GetStartedPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
          >
            Get Started
          </span>
          <h1 className="text-4xl font-bold font-display sm:text-5xl" style={{ color: '#1A2B4A' }}>
            What would you like to do?
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose a design path or join the platform — we&apos;ll take it from there.
          </p>
        </div>

        {/* Section 1: AI Concept Packages */}
        <div className="mb-14">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">AI Concept Design</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONCEPT_PATHS.map(path => (
              <Link
                key={path.href}
                href={path.href}
                className="group flex flex-col rounded-2xl border-2 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ borderColor: path.color }}
              >
                {path.tag && (
                  <span
                    className="mb-3 self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ backgroundColor: `${path.color}14`, color: path.color }}
                  >
                    {path.tag}
                  </span>
                )}
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${path.color}12` }}
                >
                  <path.icon className="h-5 w-5" style={{ color: path.color }} />
                </div>
                <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>{path.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500 flex-1 leading-relaxed">{path.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: path.color }}>{path.price}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2" style={{ color: path.color }}>
                    Start <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> 3 concept options per package</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> Consultation included</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> 5–7 business day delivery</span>
          </div>
        </div>

        {/* Section 2: Join / Portal Access */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Join the Platform</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {JOIN_PATHS.map(path => (
              <Link
                key={path.href}
                href={path.href}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md hover:border-gray-300"
              >
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${path.color}12` }}
                >
                  <path.icon className="h-5 w-5" style={{ color: path.color }} />
                </div>
                <h2 className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>{path.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500 flex-1 leading-relaxed">{path.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2" style={{ color: path.color }}>
                  {path.cta} <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom help line */}
        <p className="mt-10 text-center text-sm text-gray-400">
          Not sure where to start?{' '}
          <Link href="/contact" className="font-medium hover:underline" style={{ color: '#1A2B4A' }}>
            Talk to our team
          </Link>
          {' '}or{' '}
          <Link href="/faq" className="font-medium hover:underline" style={{ color: '#1A2B4A' }}>
            browse the FAQ
          </Link>
        </p>
      </div>
    </div>
  )
}
