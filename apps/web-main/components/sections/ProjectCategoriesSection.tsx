import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    title: 'AI Design + Permits',
    price: 'From $395',
    desc: 'Ask our AI what your project could look like. Get AI-generated concept visuals and a permit-ready package delivered in days.',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    cta: 'Start a design',
    href: '/concept',
    accent: '#C8521A',
  },
  {
    title: 'Permit Path Only',
    price: '$149',
    desc: 'Already have your drawings? Our AI reviews your documents, flags potential issues, and handles jurisdiction filing for you.',
    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    cta: 'File permits',
    href: '/permits',
    accent: '#2ABFBF',
  },
  {
    title: 'Hire a Contractor',
    price: 'Free to browse',
    desc: 'Browse AI-vetted GCs, electricians, HVAC pros, and specialty trades. Get matched and receive bids on your project.',
    img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    cta: 'Find a contractor',
    href: '/marketplace',
    accent: '#3A7D52',
  },
]

export function ProjectCategoriesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="section-label">How Kealee Works</span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            Pick your starting point
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-500">
            Not sure where to begin? Our AI will guide you through the right path for your project type, budget, and timeline.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CATEGORIES.map(cat => (
            <div
              key={cat.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-lg hover:-translate-y-1"
            >
              {/* Photo */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span
                  className="absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: cat.accent }}
                >
                  {cat.price}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-bold font-display" style={{ color: '#1A1C1B' }}>{cat.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{cat.desc}</p>
                <Link
                  href={cat.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
                  style={{ color: cat.accent }}
                >
                  {cat.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
