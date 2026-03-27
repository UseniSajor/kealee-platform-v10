'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Home, CheckCircle, TreePine, Layers, Sun } from 'lucide-react'
import { useState } from 'react'

const ACCENT = '#E8793A'

const SERVICES = [
  {
    category: 'Exterior Design & Concept',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Beautiful home exterior with professional curb appeal and landscaping',
    items: [
      { name: 'AI Exterior Concept Package', price: '$595', desc: 'AI-generated exterior concept with 3 renderings, material palette, and landscape overview. 1 feedback round. 5–7 business days.' },
      { name: 'Advanced Exterior Design', price: '$1,200', desc: 'Full exterior design with detailed landscape plan, hardscape specs, and lighting layout. Up to 3 feedback rounds.' },
      { name: 'Full Landscape Design', price: 'From $3,500', desc: 'Permit-ready landscape + exterior design with contractor bid documents, irrigation plan, and grading overview.' },
    ],
  },
  {
    category: 'Landscaping & Planting',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Professional landscaping with lush plantings and well-maintained yard',
    items: [
      { name: 'Landscape Design', price: '$650', desc: 'AI landscape plan with plant species, placement, sizing, and soil recommendations for your climate zone.' },
      { name: 'Landscape Install', price: '$2,500–$12,000', desc: 'Full landscape installation by vetted contractor. Includes soil prep, planting, mulching, and initial care plan.' },
      { name: 'Tree & Shrub Program', price: '$800–$3,500', desc: 'Tree selection, placement, planting, staking, and ongoing care program through our Marketplace network.' },
    ],
  },
  {
    category: 'Hardscaping & Driveways',
    image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Beautiful stone driveway and hardscape pathway leading to home entrance',
    items: [
      { name: 'Hardscape Design', price: '$450', desc: 'AI-designed patio, walkway, driveway, and retaining wall layouts with material selection guide.' },
      { name: 'Patio & Walkway Build', price: '$3,000–$15,000', desc: 'Concrete, pavers, natural stone, or brick installation by vetted hardscape contractors.' },
      { name: 'Driveway Replacement', price: '$4,000–$20,000', desc: 'Driveway design, permits, demolition, and new installation in concrete, asphalt, or pavers.' },
    ],
  },
  {
    category: 'Outdoor Living Spaces',
    image: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Beautiful outdoor living area with patio furniture, pergola, and outdoor kitchen',
    items: [
      { name: 'Outdoor Living Design', price: '$550', desc: 'AI-designed outdoor living concept: pergola, deck, outdoor kitchen, fire pit, and seating areas.' },
      { name: 'Deck or Patio Build', price: '$8,000–$35,000', desc: 'Composite or wood deck, patio, or covered pergola construction by vetted contractors. Permit coordination included.' },
      { name: 'Outdoor Kitchen & Fire Pit', price: '$5,000–$25,000', desc: 'Full outdoor kitchen design and build with gas, appliances, countertops, and fire feature installation.' },
    ],
  },
]

const BENEFITS = [
  { icon: Home, title: 'AI Exterior Renderings', desc: 'See 3 photorealistic exterior concepts before committing to a single contractor or material purchase.' },
  { icon: TreePine, title: 'Climate-Matched Planting', desc: 'Every landscape plan uses species matched to your hardiness zone, rainfall, and sun exposure.' },
  { icon: Sun, title: 'Curb Appeal Scoring', desc: 'Our AI evaluates your current exterior and scores curb appeal improvements by ROI and neighborhood fit.' },
  { icon: Layers, title: 'Material & Color Palettes', desc: 'Receive curated material selections for siding, trim, roofing, masonry, and hardscape that work together.' },
  { icon: CheckCircle, title: 'Permit Coordination', desc: 'Driveways, retaining walls, and outdoor structures often need permits. We flag requirements upfront.' },
  { icon: ArrowRight, title: 'Vetted Contractor Network', desc: 'Matched with licensed landscape, hardscape, masonry, and outdoor living contractors in your market.' },
]

const FAQ = [
  {
    q: 'What\'s in the AI Exterior Concept Package?',
    a: 'The $595 package includes 3 exterior renderings, a material + color palette, a landscape overview, a hardscape layout, outdoor living placement, and a 30-minute consultation call. Delivered in 5–7 business days.',
  },
  {
    q: 'Does this include installation?',
    a: 'No. All onsite installation and build work is performed by your contractor of record. Kealee provides AI design, advisory, and contractor matching services only.',
  },
  {
    q: 'Can I get just a landscape design without the exterior concept?',
    a: 'Yes. Landscape Design ($650) is available as a standalone service covering plant selection, placement, soil prep, and care plan — without the full exterior rendering package.',
  },
  {
    q: 'What permits are required for exterior work?',
    a: 'Painting and most landscaping don\'t require permits. Driveways, decks, pergolas, retaining walls over 30 inches, and outdoor kitchens typically do. We include a permit scope summary in every concept package.',
  },
  {
    q: 'How do you match me with a contractor?',
    a: 'After your concept package is complete, you can activate Contractor Match to receive competitive bids from vetted contractors who specialize in your project type, are licensed in your state, and are available in your area.',
  },
]

export default function ExteriorPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 lg:py-28"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #2A3D5F 60%, #C65A20 100%)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: `${ACCENT}CC` }}
              >
                Exterior Design & Curb Appeal
              </span>
              <h1 className="mt-4 text-4xl font-bold text-white font-display sm:text-5xl lg:text-6xl">
                Make a statement before the front door
              </h1>
              <p className="mt-6 text-lg text-gray-300">
                AI-powered exterior design concepts covering facade updates, landscaping, hardscaping, driveways, and
                outdoor living — from concept to contractor in one platform.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/concept-engine/exterior"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Start My Exterior Concept <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="btn-outline-white">
                  Talk to Our Team
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <div className="overflow-hidden rounded-2xl" style={{ boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}>
                <img
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700&q=80&auto=format&fit=crop"
                  alt="Beautiful home exterior with professional landscaping and curb appeal"
                  className="h-80 w-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-4 -left-4 rounded-xl px-4 py-3"
                style={{ backgroundColor: ACCENT, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
              >
                <p className="text-xs font-semibold text-white">AI Exterior Concept</p>
                <p className="text-2xl font-bold text-white font-mono">From $595</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="bg-white py-4">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm text-gray-500">
            All onsite installation and build work is performed by your contractor of record. Kealee provides AI design,
            advisory, and contractor matching services only.
          </p>
        </div>
      </div>

      {/* Services */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Services & Pricing</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              Exterior Design Services
            </h2>
          </div>

          <div className="mt-12 space-y-12">
            {SERVICES.map((section, si) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: si * 0.1 }}
                className="overflow-hidden rounded-2xl bg-white"
                style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={section.image}
                    alt={section.imageAlt}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex items-end p-6"
                    style={{ background: 'linear-gradient(to top, rgba(26,43,74,0.85) 0%, transparent 60%)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <Home className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white font-display">{section.category}</h3>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {section.items.map((item, ii) => (
                    <div
                      key={item.name}
                      className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: '#1A2B4A' }}>{item.name}</span>
                          {ii === 0 && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                              style={{ backgroundColor: ACCENT }}
                            >
                              Start Here
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3 sm:ml-6">
                        <span className="font-bold font-mono text-sm" style={{ color: ACCENT }}>{item.price}</span>
                        <Link
                          href={ii === 0 ? '/concept-engine/exterior' : '/contact'}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: ACCENT }}
                        >
                          {ii === 0 ? 'Get Started' : 'Inquire'} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Why Kealee Exterior</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Designed to Impress, Built to Last
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-xl bg-white p-6"
                  style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)' }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${ACCENT}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                  </div>
                  <h3 className="mt-3 font-semibold" style={{ color: '#1A2B4A' }}>{b.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="section-label">FAQ</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>Common Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-gray-50"
                >
                  <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{item.q}</span>
                  <span className="text-gray-500 text-xl leading-none">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm leading-relaxed text-gray-600">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white font-display">Start Your Exterior Concept</h2>
          <p className="mt-4 text-lg text-gray-300">
            $595 · 3 renderings · Material palette · Landscape overview · 5–7 business days
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/concept-engine/exterior"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start My Exterior Concept <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/homeowners" className="btn-outline-white">
              View All Home Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
